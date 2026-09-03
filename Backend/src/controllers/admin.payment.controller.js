const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const { PAYMENT_STATUS, MESSAGES, HTTP_STATUS } = require('../config/constants');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Serialize a payment document into the admin-facing shape.
 * Payment status and order status are deliberately kept separate —
 * paymentStatus reflects only what the payment provider verified.
 * No provider credentials are ever included here.
 */
function serializePayment(payment, order, user) {
  return {
    id: payment._id,
    orderId: order ? order.orderId : null,
    customerName: order ? order.customerName : null,
    customerPhone: order ? order.customerPhone : null,
    customer: user
      ? { name: user.name, email: user.email, phone: user.phone }
      : null,
    method: payment.method || payment.provider,
    amount: payment.amount,
    currency: payment.currency || 'ETB',
    paymentStatus: payment.status,
    transactionId: payment.transactionId,
    providerReference: payment.providerReference || payment.chapaReference || payment.reference,
    paymentDate: payment.paymentDate,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt
  };
}

async function buildPaymentSearchFilter(search) {
  const s = String(search);

  const paymentFieldMatch = {
    $or: [
      { transactionId: { $regex: s, $options: 'i' } },
      { providerReference: { $regex: s, $options: 'i' } },
      { chapaReference: { $regex: s, $options: 'i' } },
      { reference: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } }
    ]
  };

  // Matches against data living on the linked Order (orderId / customer)
  const orders = await Order.find({
    $or: [
      { orderId: { $regex: s, $options: 'i' } },
      { customerName: { $regex: s, $options: 'i' } },
      { customerPhone: { $regex: s, $options: 'i' } }
    ]
  })
    .select('_id')
    .lean();

  if (orders.length) {
    const ids = orders.map((o) => o._id);
    return {
      $or: [
        ...paymentFieldMatch.$or,
        { orderId: { $in: ids } }
      ]
    };
  }

  return paymentFieldMatch;
}

/**
 * @desc    List payments (admin) - read-only monitoring
 * @route   GET /api/v1/admin/payments
 * @access  Private/Admin
 * Query: method, status, date (YYYY-MM-DD), search, page, limit, sort
 * Note:    Intentionally GET-only. There is NO endpoint that lets an admin
 *          change paymentStatus — only provider verification sets PAID.
 */
exports.getAllPayments = async (req, res) => {
  try {
    const {
      method,
      status,
      date,
      search,
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const conditions = [];

    if (method && method !== 'all') {
      conditions.push({ method: String(method).toUpperCase() });
    }

    if (status && status !== 'all') {
      conditions.push({ status: String(status).toUpperCase() });
    }

    if (date) {
      const day = new Date(`${date}T00:00:00.000Z`);
      const nextDay = new Date(day.getTime() + 86400000);
      conditions.push({ paymentDate: { $gte: day, $lt: nextDay } });
    }

    if (search && String(search).trim()) {
      conditions.push(await buildPaymentSearchFilter(String(search).trim()));
    }

    const filter = conditions.length ? { $and: conditions } : {};

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'amount-desc':
        sortOption = { amount: -1 };
        break;
      case 'amount-asc':
        sortOption = { amount: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const payments = await Payment.find(filter).sort(sortOption).skip(skip).limit(limitNum);
    const total = await Payment.countDocuments(filter);

    const orderIds = [...new Set(payments.map((p) => String(p.orderId)).filter(Boolean))];
    const orders = await Order.find({ _id: { $in: orderIds } }).lean();
    const orderMap = {};
    orders.forEach((o) => (orderMap[String(o._id)] = o));

    const userIds = [...new Set(payments.map((p) => String(p.userId)).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email phone').lean();
    const userMap = {};
    users.forEach((u) => (userMap[String(u._id)] = u));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: payments.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      payments: payments.map((payment) =>
        serializePayment(
          payment,
          orderMap[String(payment.orderId)],
          userMap[String(payment.userId)]
        )
      )
    });
  } catch (error) {
    console.error('❌ Admin Get All Payments Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Payment statistics (admin) - read-only metric cards
 * @route   GET /api/v1/admin/payments/stats
 * @access  Private/Admin
 */
exports.getPaymentStats = async (req, res) => {
  try {
    // Case-insensitive regex to match every successful status variant written by
    // our simulators, Chapa, Telebirr, and admin flows: 'paid', 'success',
    // 'SUCCESS', 'completed', 'paid', 'simulated', 'successful', etc.
    const successStatusRegex = /^(paid|success|completed|successful|simulated)$/i;
    const pendingStatusRegex = /^(pending|in_progress|processing)$/i;
    const failedStatusRegex = /^(failed|cancelled|canceled|rejected|reversed)$/i;

    const [successfulPayments, pendingPayments, failedPayments, failedOrCancelled] = await Promise.all([
      Payment.countDocuments({ status: { $regex: successStatusRegex } }),
      Payment.countDocuments({ status: { $regex: pendingStatusRegex } }),
      Payment.countDocuments({ status: { $regex: failedStatusRegex } }),
      Payment.countDocuments({ status: PAYMENT_STATUS.CANCELLED })
    ]);

    const cancelledPayments = failedOrCancelled;

    // Aggregate revenue only from successful payments, reading either the
    // amount or totalAmount field depending on how the row was created.
    const revenueAggregation = await Payment.aggregate([
      { $match: { status: { $regex: successStatusRegex } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$amount', '$totalAmount'] } }
        }
      }
    ]);
    const totalRevenue = revenueAggregation.length ? revenueAggregation[0].totalRevenue : 0;

    const telebirr = await Payment.countDocuments({ method: 'TELEBIRR' });
    const chapa = await Payment.countDocuments({ method: 'CHAPA' });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      stats: {
        totalPayments: successfulPayments + pendingPayments + failedPayments + cancelledPayments,
        successfulPayments,
        pendingPayments,
        failedPayments,
        cancelledPayments,
        totalRevenue,
        methods: { telebirr, chapa }
      }
    });
  } catch (error) {
    console.error('❌ Admin Get Payment Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Payment detail (admin) - read-only
 * @route   GET /api/v1/admin/payments/:id
 * @access  Private/Admin
 */
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Payment not found' });
    }

    const payment = await Payment.findById(id).lean();
    if (!payment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Payment not found' });
    }

    const order = await Order.findById(payment.orderId).lean();
    const user = await User.findById(payment.userId).select('name email phone').lean();

    const record = serializePayment(payment, order, user);
    record.order = order
      ? {
          orderType: order.orderType,
          tableNumber: order.tableNumber,
          items: order.items,
          subtotal: order.subtotal,
          serviceFee: order.serviceFee,
          totalAmount: order.totalAmount,
          orderStatus: order.orderStatus || String(order.status || '').toUpperCase(),
          paymentStatus: order.paymentStatus,
          orderDate: order.orderDate,
          orderTime: order.orderTime
        }
      : null;

    res.status(HTTP_STATUS.OK).json({ success: true, payment: record });
  } catch (error) {
    console.error('❌ Admin Get Payment By ID Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { PAYMENT_STATUS, HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * @desc    Simulate payment for order
 * @route   POST /api/payments/simulate
 * @access  Private
 * Frontend: checkout.js -> Simulate payment
 * Expected Body: { orderId, method, phone, reference }
 */
exports.simulatePayment = async (req, res) => {
  try {
    const { orderId, method, phone, reference } = req.body;

    if (!orderId || !method) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Order ID and payment method are required'
      });
    }

    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.userId && order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Unauthorized to pay for this order'
      });
    }

    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Order already paid'
      });
    }

    const isSuccess = Math.random() < 0.95;

    const payment = await Payment.create({
      orderId: order._id,
      userId: req.user.id,
      amount: order.totalAmount,
      method,
      provider: method,
      status: isSuccess ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED,
      phone: phone || '',
      reference: reference || '',
      paymentDate: new Date()
    });

    if (isSuccess) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
      order.transactionId = payment.transactionId;
      await order.save();
    } else {
      order.paymentStatus = PAYMENT_STATUS.FAILED;
      await order.save();
    }

    res.status(HTTP_STATUS.OK).json({
      success: isSuccess,
      message: isSuccess ? 'Payment successful!' : 'Payment failed. Please try again.',
      payment: {
        id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        paymentDate: payment.paymentDate
      }
    });
  } catch (error) {
    console.error('❌ Simulate Payment Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR
    });
  }
};

/**
 * @desc    Get payment by order ID
 * @route   GET /api/payments/order/:orderId
 * @access  Private
 */
exports.getPaymentByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Order not found'
      });
    }
    const payment = await Payment.findOne({ orderId: order._id });
    if (!payment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Payment not found for this order'
      });
    }
    res.status(HTTP_STATUS.OK).json({
      success: true,
      payment: {
        id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        phone: payment.phone,
        reference: payment.reference,
        paymentDate: payment.paymentDate
      }
    });
  } catch (error) {
    console.error('❌ Get Payment By Order Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR
    });
  }
};

/**
 * @desc    Get all payments (Admin only)
 * @route   GET /api/payments
 * @access  Private/Admin
 * Query Params: status, method, date
 */
exports.getAllPayments = async (req, res) => {
  try {
    const { status, method, date, limit = 50, page = 1 } = req.query;
    let filter = {};
    if (status && status !== 'all') filter.status = status;
    if (method && method !== 'all') filter.method = method;
    if (date) filter.paymentDate = { $regex: date };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const payments = await Payment.find(filter)
      .populate('userId', 'name email phone')
      .populate('orderId', 'orderId customerName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Payment.countDocuments(filter);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: payments.length,
      total,
      payments: payments.map((payment) => ({
        id: payment._id,
        transactionId: payment.transactionId,
        orderId: payment.orderId?.orderId || 'N/A',
        customerName: payment.orderId?.customerName || 'N/A',
        user: payment.userId
          ? { name: payment.userId.name, email: payment.userId.email, phone: payment.userId.phone }
          : null,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        phone: payment.phone,
        reference: payment.reference,
        paymentDate: payment.paymentDate
      }))
    });
  } catch (error) {
    console.error('❌ Get All Payments Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR
    });
  }
};

/**
 * @desc    Get user's payment history
 * @route   GET /api/payments/my
 * @access  Private
 */
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate('orderId', 'orderId customerName items totalAmount')
      .sort({ createdAt: -1 });
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: payments.length,
      payments: payments.map((payment) => ({
        id: payment._id,
        transactionId: payment.transactionId,
        orderId: payment.orderId?.orderId || 'N/A',
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        paymentDate: payment.paymentDate,
        orderTotal: payment.orderId?.totalAmount || 0
      }))
    });
  } catch (error) {
    console.error('❌ Get My Payments Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR
    });
  }
};

/**
 * @desc    Get payment statistics (Admin only)
 * @route   GET /api/payments/stats
 * @access  Private/Admin
 */
exports.getPaymentStats = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const successfulPayments = await Payment.countDocuments({ status: PAYMENT_STATUS.PAID });
    const pendingPayments = await Payment.countDocuments({ status: PAYMENT_STATUS.PENDING });
    const failedPayments = await Payment.countDocuments({ status: PAYMENT_STATUS.FAILED });

    const successfulPaymentsData = await Payment.find({ status: PAYMENT_STATUS.PAID });
    const totalRevenue = successfulPaymentsData.reduce((sum, p) => sum + p.amount, 0);

    const telebirr = await Payment.countDocuments({ method: 'TELEBIRR' });
    const chapa = await Payment.countDocuments({ method: 'CHAPA' });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      stats: {
        totalPayments,
        successfulPayments,
        pendingPayments,
        failedPayments,
        totalRevenue,
        methods: { telebirr, chapa }
      }
    });
  } catch (error) {
    console.error('❌ Get Payment Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR
    });
  }
};

/**
 * @desc    Validate payment details
 * @route   POST /api/payments/validate
 * @access  Private
 * Expected Body: { method, phone }
 */
exports.validatePayment = async (req, res) => {
  try {
    const { method, phone } = req.body;
    const errors = {};
    const validMethods = ['TELEBIRR', 'CHAPA', 'telebirr', 'chapa', 'cash', 'CBE Birr'];
    if (!method) {
      errors.method = 'Payment method is required';
    } else if (!validMethods.includes(method)) {
      errors.method = 'Invalid payment method';
    }
    const phoneRegex = /^(09|07)[0-9]{8}$/;
    if (!phone) {
      errors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(phone)) {
      errors.phone = 'Invalid phone number format (09XXXXXXXX or 07XXXXXXXX)';
    }
    res.status(HTTP_STATUS.OK).json({
      success: Object.keys(errors).length === 0,
      valid: Object.keys(errors).length === 0,
      errors
    });
  } catch (error) {
    console.error('❌ Validate Payment Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR
    });
  }
};

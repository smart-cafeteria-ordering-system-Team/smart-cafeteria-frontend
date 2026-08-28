const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { PAYMENT_STATUS, ORDER_STATUS, MESSAGES, HTTP_STATUS } = require('../config/constants');
const { logAction } = require('../utils/audit');

const FLOW = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];

// Map uppercase flow status -> value allowed in Order.status enum
const STATUS_TO_LOWERCASE = {
  PENDING: ORDER_STATUS.PENDING,
  PREPARING: ORDER_STATUS.PREPARING,
  READY: ORDER_STATUS.READY,
  SERVED: ORDER_STATUS.SERVED,
  COMPLETED: 'Completed',
  CANCELLED: ORDER_STATUS.CANCELLED
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

function normalizeStatus(value) {
  if (!value) return null;
  return String(value).toUpperCase();
}

/**
 * Compute the effective order status from both the legacy `status`
 * (lowercase, updated by kitchen flow) and `orderStatus` (uppercase).
 */
function effectiveStatus(order) {
  const up = normalizeStatus(order.orderStatus);
  const low = normalizeStatus(order.status);

  const indexOf = (s) => FLOW.indexOf(s);
  const upIndex = indexOf(up);
  const lowIndex = indexOf(low);

  // Cancelled wins (terminal)
  if (up === 'CANCELLED' || low === 'CANCELLED') return 'CANCELLED';
  if (upIndex === -1 && lowIndex === -1) return up || low || 'PENDING';
  if (upIndex === -1) return low;
  if (lowIndex === -1) return up;
  return upIndex >= lowIndex ? up : low;
}

function serializeOrder(order) {
  const status = effectiveStatus(order);
  return {
    id: order._id,
    orderId: order.orderId,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    userId: order.userId,
    orderType: order.orderType,
    tableNumber: order.tableNumber,
    itemCount: order.items ? order.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) : 0,
    items: (order.items || []).map((i) => ({
      itemId: i.itemId,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      notes: i.notes
    })),
    subtotal: order.subtotal,
    serviceFee: order.serviceFee,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status,
    orderDate: order.orderDate,
    orderTime: order.orderTime,
    readyTime: order.readyTime,
    completedTime: order.completedTime,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

function buildStatusFilter(value) {
  const s = normalizeStatus(value);
  if (!s || s === 'ALL') return null;
  return {
    $or: [{ orderStatus: s }, { status: s.toLowerCase() }, { status: s }]
  };
}

/**
 * @desc    Get all orders (admin) - search / filter / sort / paginate
 * @route   GET /api/v1/admin/orders
 * @access  Private/Admin
 * Query: search, status, paymentStatus, orderType, date, sort, page, limit
 * sort:   newest | oldest | amount-desc | amount-asc
 */
exports.getAllOrders = async (req, res) => {
  try {
    const {
      search,
      status,
      paymentStatus,
      orderType,
      date,
      from,
      to,
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const conditions = [];

    const statusFilter = buildStatusFilter(status);
    if (statusFilter) conditions.push(statusFilter);

    if (paymentStatus && paymentStatus !== 'all') {
      conditions.push({ paymentStatus: normalizeStatus(paymentStatus) });
    }

    if (orderType && orderType !== 'all') {
      conditions.push({ orderType });
    }

    if (date) {
      const day = String(date);
      conditions.push({
        $or: [
          { orderDate: { $regex: day } },
          { orderTime: { $gte: new Date(`${day}T00:00:00.000Z`), $lte: new Date(`${day}T23:59:59.999Z`) } }
        ]
      });
    } else if (from) {
      conditions.push({ orderTime: { $gte: new Date(from) } });
    }
    if (to) {
      conditions.push({ orderTime: { $lte: new Date(to) } });
    }

    if (search) {
      const s = String(search);
      conditions.push({
        $or: [
          { orderId: { $regex: s, $options: 'i' } },
          { customerName: { $regex: s, $options: 'i' } },
          { customerPhone: { $regex: s, $options: 'i' } }
        ]
      });
    }

    const filter = conditions.length ? { $and: conditions } : {};

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'amount-desc':
        sortOption = { totalAmount: -1 };
        break;
      case 'amount-asc':
        sortOption = { totalAmount: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(filter).sort(sortOption).skip(skip).limit(limitNum);
    const total = await Order.countDocuments(filter);

    // Batch-load customer info
    const userIds = [...new Set(orders.map((o) => String(o.userId)).filter(Boolean))];
    const customers = await User.find({ _id: { $in: userIds } }).select('name email phone role').lean();
    const customerMap = {};
    customers.forEach((c) => (customerMap[String(c._id)] = c));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      orders: orders.map((order) => {
        const record = serializeOrder(order);
        const customer = customerMap[String(order.userId)];
        record.customer = customer
          ? { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone, role: customer.role }
          : null;
        return record;
      })
    });
  } catch (error) {
    console.error('❌ Admin Get All Orders Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Get single order (admin) with customer + payment details
 * @route   GET /api/v1/admin/orders/:id
 * @access  Private/Admin
 */
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;
    if (isValidObjectId(id)) order = await Order.findById(id);
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Order not found' });
    }

    const customer = await User.findById(order.userId).select('-password').lean();
    const payment = await Payment.findOne({ orderId: order._id }).lean();

    const record = serializeOrder(order);
    record.customer = customer
      ? { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone, role: customer.role }
      : null;
    record.payment = payment
      ? {
          id: payment._id,
          provider: payment.provider,
          amount: payment.amount,
          status: payment.status,
          transactionId: payment.transactionId,
          reference: payment.reference,
          providerReference: payment.providerReference,
          paidAt: payment.paidAt,
          paymentDate: payment.paymentDate
        }
      : null;
    record.cancellation = {
      requested: order.cancellationRequested,
      reason: order.cancellationReason,
      cancellationStatus: order.cancellationStatus,
      requestedAt: order.cancellationRequestedAt,
      adminNote: order.cancellationAdminNote,
      processedAt: order.cancellationProcessedAt
    };
    record.notes = order.notes;

    res.status(HTTP_STATUS.OK).json({ success: true, order: record });
  } catch (error) {
    console.error('❌ Admin Get Order By ID Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * Enforce business rules for status transitions.
 * Flow: PENDING -> PREPARING -> READY -> SERVED -> COMPLETED
 * Cancellation is handled separately and only allowed from PENDING/PREPARING.
 * Returns the normalized uppercase status or throws an Error with statusCode.
 */
function assertTransitionAllowed(currentStatus, newStatus) {
  const cur = normalizeStatus(currentStatus);
  const next = normalizeStatus(newStatus);

  if (!FLOW.includes(next) && next !== 'CANCELLED') {
    const error = new Error(`Invalid order status. Allowed: ${FLOW.join(', ')} or CANCELLED`);
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  if (cur === 'CANCELLED' || cur === 'COMPLETED') {
    const error = new Error(`Cannot modify an order that is already ${cur}`);
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  const curIndex = FLOW.indexOf(cur);
  const nextIndex = FLOW.indexOf(next);

  if (next === 'CANCELLED') {
    if (curIndex > FLOW.indexOf('PREPARING')) {
      const error = new Error(`Order can only be cancelled while PENDING or PREPARING (current: ${cur})`);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }
    return next;
  }

  if (nextIndex !== curIndex + 1) {
    const error = new Error(
      `Invalid status transition: ${cur} -> ${next}. Statuses must advance one step at a time through the flow.`
    );
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  return next;
}

/**
 * @desc    Update order status (admin) - respects business flow rules
 * @route   PATCH /api/v1/admin/orders/:id/status
 * @access  Private/Admin
 * Body: { status: 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' }
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Status is required' });
    }

    const { id } = req.params;
    let order = null;
    if (isValidObjectId(id)) order = await Order.findById(id);
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Order not found' });
    }

    const current = effectiveStatus(order);
    let next;
    try {
      next = assertTransitionAllowed(current, status);
    } catch (e) {
      return res.status(e.statusCode || HTTP_STATUS.BAD_REQUEST).json({ success: false, error: e.message });
    }

    order.orderStatus = next;
    order.status = STATUS_TO_LOWERCASE[next];

    if (next === 'READY') {
      order.readyTime = new Date();
    }
    if (next === 'SERVED' || next === 'COMPLETED') {
      order.completedTime = new Date();
    }

    await order.save();

    try {
      await Notification.create({
        userId: order.userId,
        title: next === 'READY' ? 'Order Ready!' : `Order ${next}`,
        message: `Your order #${order.orderId} is now ${next.replace(/_/g, ' ').toLowerCase()}.`,
        type: 'status_update',
        orderId: order.orderId,
        isRead: false
      });
    } catch (notifError) {
      // notifications are best effort
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Order #${order.orderId} status updated to ${next}`,
      order: serializeOrder(order)
    });
  } catch (error) {
    console.error('❌ Admin Update Order Status Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Cancel order (admin)
 * @route   PATCH /api/v1/admin/orders/:id/cancel
 * @access  Private/Admin
 * Body: { reason, adminNote }
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { reason, adminNote } = req.body;
    const { id } = req.params;

    let order = null;
    if (isValidObjectId(id)) order = await Order.findById(id);
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Order not found' });
    }

    const current = effectiveStatus(order);
    if (['CANCELLED', 'COMPLETED', 'SERVED'].includes(current)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: `Order cannot be cancelled (status: ${current})`
      });
    }
    if (FLOW.indexOf(current) > FLOW.indexOf('PREPARING')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: `Order can only be cancelled while PENDING or PREPARING (current: ${current})`
      });
    }

    order.orderStatus = 'CANCELLED';
    order.status = STATUS_TO_LOWERCASE.CANCELLED;
    order.cancellationRequested = false;
    order.cancellationReason = reason || 'Cancelled by admin';
    order.cancellationAdminNote = adminNote || '';
    order.cancellationStatus = 'approved';
    order.cancellationProcessedAt = new Date();
    order.cancellationProcessedBy = req.user.id;
    await order.save();

    try {
      await Notification.create({
        userId: order.userId,
        title: 'Order Cancelled',
        message: `Your order #${order.orderId} has been cancelled${adminNote ? ': ' + adminNote : '.'}`,
        type: 'cancellation',
        orderId: order.orderId,
        isRead: false
      });
    } catch (notifError) {
      // best effort
    }

    await logAction({
      req,
      action: 'ORDER_CANCELLED',
      entityType: 'Order',
      entityId: String(order.orderId || order._id),
      description: `Admin cancelled order #${order.orderId}${reason ? ' - reason: ' + reason : ''}`
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Order #${order.orderId} cancelled successfully`,
      order: serializeOrder(order)
    });
  } catch (error) {
    console.error('❌ Admin Cancel Order Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Order statistics (admin)
 * @route   GET /api/v1/admin/orders/stats
 * @access  Private/Admin
 */
exports.getOrderStats = async (req, res) => {
  try {
    const all = await Order.find({}).select('status orderStatus totalAmount createdAt').lean();

    const count = (status) => all.filter((o) => effectiveStatus(o) === status).length;
    const totalOrders = all.length;
    const pendingOrders = count('PENDING');
    const preparingOrders = count('PREPARING');
    const readyOrders = count('READY');
    const servedOrders = count('SERVED');
    const completedOrders = count('COMPLETED');
    const cancelledOrders = count('CANCELLED');

    const completedOrServed = all.filter(
      (o) => effectiveStatus(o) === 'COMPLETED' || effectiveStatus(o) === 'SERVED'
    );
    const totalRevenue = completedOrServed.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = all.filter((o) => {
      const d = o.createdAt || o.orderTime;
      return d && new Date(d) >= todayStart;
    }).length;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        preparingOrders,
        readyOrders,
        servedOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        todayOrders
      }
    });
  } catch (error) {
    console.error('❌ Admin Get Order Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};
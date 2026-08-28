const Order = require('../models/Order');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { ORDER_STATUS, PAYMENT_STATUS, MESSAGES, HTTP_STATUS } = require('../config/constants');
const { logAction } = require('../utils/audit');

/**
 * @desc    Request order cancellation
 * @route   POST /api/cancellations/request
 * @access  Private
 * Body: { orderId, reason, details }
 */
exports.requestCancellation = async (req, res) => {
  try {
    const { orderId, reason, details } = req.body;
    if (!orderId || !reason) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Order ID and reason are required' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Order not found' });
    }
    if (order.userId && req.user.role !== 'admin' && order.userId.toString() !== req.user.id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: 'You can only cancel your own orders' });
    }
    if (order.status === 'served' || order.status === 'cancelled') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: `Order cannot be cancelled (status: ${order.status})` });
    }
    if (order.cancellationRequested) {
      return res.status(HTTP_STATUS.CONFLICT).json({ success: false, error: 'Cancellation already requested for this order' });
    }

    order.cancellationRequested = true;
    order.cancellationReason = reason;
    order.cancellationDetails = details || '';
    order.cancellationStatus = 'pending';
    order.cancellationRequestedAt = new Date();
    await order.save();

    await Notification.create({
      userId: 'admin',
      title: 'Cancellation Request',
      message: `Order #${orderId} cancellation requested by ${req.user.name}`,
      type: 'system',
      orderId,
      link: `/admin/cancellations.html?orderId=${orderId}`,
      isRead: false
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Cancellation request submitted successfully',
      cancellation: {
        orderId: order.orderId,
        reason,
        details: details || '',
        status: 'pending',
        requestedAt: order.cancellationRequestedAt
      }
    });
  } catch (error) {
    console.error('❌ Request Cancellation Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Get all cancellation requests (Admin only)
 * @route   GET /api/cancellations
 * @access  Private/Admin
 * Query Params: status, date
 */
exports.getCancellations = async (req, res) => {
  try {
    const { status, date, limit = 50, page = 1 } = req.query;
    let filter = { cancellationRequested: true };
    if (status && status !== 'all') filter.cancellationStatus = status;
    if (date) filter.cancellationRequestedAt = { $regex: date };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(filter)
      .populate('userId', 'name email phone')
      .sort({ cancellationRequestedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Order.countDocuments(filter);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: orders.length,
      total,
      cancellations: orders.map((order) => ({
        id: order._id,
        orderId: order.orderId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        user: order.userId
          ? { name: order.userId.name, email: order.userId.email, phone: order.userId.phone }
          : null,
        reason: order.cancellationReason,
        details: order.cancellationDetails,
        status: order.cancellationStatus || 'pending',
        totalAmount: order.totalAmount,
        requestedAt: order.cancellationRequestedAt,
        items: order.items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price }))
      }))
    });
  } catch (error) {
    console.error('❌ Get Cancellations Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Approve cancellation request (Admin only)
 * @route   PATCH /api/cancellations/:orderId/approve
 * @access  Private/Admin
 * Body: { adminNote }
 */
exports.approveCancellation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { adminNote } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Order not found' });
    }
    if (!order.cancellationRequested) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'No cancellation request found for this order' });
    }
    if (order.cancellationStatus !== 'pending') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: `Cancellation already ${order.cancellationStatus}` });
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.cancellationStatus = 'approved';
    order.cancellationAdminNote = adminNote || '';
    order.cancellationProcessedAt = new Date();
    order.cancellationProcessedBy = req.user.id;
    await order.save();

    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      await Payment.findOneAndUpdate({ orderId: order._id }, { status: 'CANCELLED' });
    }

    await Notification.create({
      userId: order.userId,
      title: 'Order Cancellation Approved',
      message: `Your order #${orderId} has been cancelled and refunded. ${adminNote || ''}`,
      type: 'order',
      orderId,
      isRead: false
    });

    await logAction({
      req,
      action: 'ORDER_CANCELLED',
      entityType: 'Order',
      entityId: String(orderId),
      description: `Cancellation approved - order #${orderId} cancelled and ${order.paymentStatus === PAYMENT_STATUS.PAID ? 'refunded' : 'closed'}`
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Order #${orderId} cancellation approved and refund processed`
    });
  } catch (error) {
    console.error('❌ Approve Cancellation Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Reject cancellation request (Admin only)
 * @route   PATCH /api/cancellations/:orderId/reject
 * @access  Private/Admin
 * Body: { adminNote }
 */
exports.rejectCancellation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { adminNote } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Order not found' });
    }
    if (!order.cancellationRequested) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'No cancellation request found for this order' });
    }
    if (order.cancellationStatus !== 'pending') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: `Cancellation already ${order.cancellationStatus}` });
    }

    order.cancellationStatus = 'rejected';
    order.cancellationAdminNote = adminNote || 'Cancellation request rejected';
    order.cancellationProcessedAt = new Date();
    order.cancellationProcessedBy = req.user.id;
    await order.save();

    await Notification.create({
      userId: order.userId,
      title: 'Cancellation Request Rejected',
      message: `Your cancellation request for order #${orderId} was rejected. ${adminNote || 'Please contact support for more information.'}`,
      type: 'order',
      orderId,
      isRead: false
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Order #${orderId} cancellation rejected`
    });
  } catch (error) {
    console.error('❌ Reject Cancellation Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Get cancellation statistics (Admin only)
 * @route   GET /api/cancellations/stats
 * @access  Private/Admin
 */
exports.getCancellationStats = async (req, res) => {
  try {
    const totalCancellations = await Order.countDocuments({ cancellationRequested: true });
    const pendingApproval = await Order.countDocuments({ cancellationRequested: true, cancellationStatus: 'pending' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const refundedToday = await Order.countDocuments({
      cancellationRequested: true,
      cancellationStatus: 'approved',
      cancellationProcessedAt: { $gte: today }
    });

    const rejectedRequests = await Order.countDocuments({ cancellationRequested: true, cancellationStatus: 'rejected' });

    const approvedCancellations = await Order.find({
      cancellationRequested: true,
      cancellationStatus: 'approved',
      paymentStatus: PAYMENT_STATUS.PAID
    });
    const totalRefundAmount = approvedCancellations.reduce((sum, order) => sum + order.totalAmount, 0);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      stats: { totalCancellations, pendingApproval, refundedToday, rejectedRequests, totalRefundAmount }
    });
  } catch (error) {
    console.error('❌ Get Cancellation Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Check if order can be cancelled
 * @route   GET /api/cancellations/:orderId/check
 * @access  Private
 */
exports.checkCancellationEligibility = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Order not found' });
    }
    if (order.userId && order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: 'Unauthorized to check this order' });
    }

    let canCancel = false;
    let message = '';
    let status = order.status;

    if (order.status === 'served') {
      message = 'Order has already been served and cannot be cancelled';
    } else if (order.status === 'cancelled') {
      message = 'Order has already been cancelled';
    } else if (order.cancellationRequested) {
      message = `Cancellation already requested (status: ${order.cancellationStatus})`;
    } else {
      canCancel = true;
      message = 'Order can be cancelled';
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      canCancel,
      status,
      message,
      orderSummary: {
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        items: order.items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price }))
      }
    });
  } catch (error) {
    console.error('❌ Check Cancellation Eligibility Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

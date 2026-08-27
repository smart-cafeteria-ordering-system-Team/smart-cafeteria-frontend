const Order = require('../models/Order');
const User = require('../models/

User');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { ORDER_STATUS, PAYMENT_STATUS, MESSAGES, HTTP_STATUS } = require('../config/constants');

/**
* @desc    Request order cancellation
* @route   POST /api/cancellations/request
* @access  Private
*
* Frontend: cancel-order.html →

Request cancellation
* Expected Body: { orderId, reason, details }
* Response: { success, message, cancellation }
*/
exports.requestCancellation = async (req, res) => {
try {
const { orderId, reason, details } = req.body;

// ✅ Validate required fields
if (!orderId || !reason) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,

error: 'Order ID and reason are required'
});
}

// ✅ Find order
const order = await Order.findOne({ orderId: orderId });
if (!order) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Order not found'
});
}

// ✅ Check if user owns order

if (order.userId.toString() !== req.user.id) {
return res.status(HTTP_STATUS.FORBIDDEN).json({
success: false,
error: 'You can only cancel your own orders'
});
}

// ✅ Check if order can be cancelled
if (order.status === 'served' || order.status === 'cancelled') {
return res.status(HTTP_STATUS.BAD_REQUEST).json({

success: false,
error: `Order cannot be cancelled (status: ${order.status})`
});
}

// ✅ Check if cancellation already requested
if (order.cancellationRequested) {
return res.status(HTTP_STATUS.CONFLICT).json({
success: false,
error: 'Cancellation already requested for this order'
});
}


// ✅ Create cancellation request
order.cancellationRequested = true;
order.cancellationReason = reason;
order.cancellationDetails = details || '';
order.cancellationStatus = 'pending';
order.cancellationRequestedAt = new Date();

await order.save();

// ✅ Create notification for admin

await Notification.create({
userId: 'admin', // In production, send to all admins
title: 'Cancellation Request',
message: `Order #${orderId} cancellation requested by ${req.user.name}`,
type: 'system',
orderId: orderId,
link: `/admin/cancellations.html?orderId=${orderId}`,
isRead: false
});

res.status(HTTP_STATUS.OK).json({
success: true,

message: 'Cancellation request submitted successfully',
cancellation: {
orderId: order.orderId,
reason: reason,
details: details || '',
status: 'pending',
requestedAt: order.cancellationRequestedAt
}
});

} catch (error) {
console.error('❌ Request Cancellation Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({

success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Get all cancellation requests (Admin only)
* @route   GET /api/cancellations
* @access  Private/Admin
*
* Frontend: admin/cancellations.html → Load all cancellations
* Query Params: status, date
* Response: { success, count,

cancellations: [...] }
*/
exports.getCancellations = async (req, res) => {
try {
const { status, date, limit = 50, page = 1 } = req.query;

// ✅ Build filter
let filter = { cancellationRequested: true };
if (status && status !== 'all') filter.cancellationStatus = status;
if (date) filter.cancellationRequestedAt = { $regex: date };

// ✅ Pagination

const skip = (parseInt(page) - 1) * parseInt(limit);

// ✅ Execute query
const orders = await Order.find(filter)
.populate('userId', 'name email phone')
.sort({ cancellationRequestedAt: -1 })
.skip(skip)
.limit(parseInt(limit));

const total = await Order.countDocuments(filter);

res.status(HTTP_STATUS.OK).json({

success: true,
count: orders.length,
total: total,
cancellations: orders.map(order => ({
id: order._id,
orderId: order.orderId,
customerName: order.customerName,
customerPhone: order.customerPhone,
user: order.userId ? {
name: order.userId.name,
email: order.userId.email,
phone: order.userId.phone
} : null,
reason:

order.cancellationReason,
details: order.cancellationDetails,
status: order.cancellationStatus || 'pending',
totalAmount: order.totalAmount,
requestedAt: order.cancellationRequestedAt,
items: order.items.map(item => ({
name: item.name,
quantity: item.quantity,
price: item.price
}))
}))
});

} catch (error) {
console.error('❌ Get Cancellations Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Approve cancellation request (Admin only)
* @route   PATCH /api/cancellations/:orderId/approve

* @access  Private/Admin
*
* Frontend: admin/cancellations.html → Approve cancellation
* Expected Body: { adminNote }
* Response: { success, message }
*/
exports.approveCancellation = async (req, res) => {
try {
const { orderId } = req.params;
const { adminNote } = req.body;

// ✅ Find order
const order = await Order.findOne({ orderId: orderId });
if (!order) {

return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Order not found'
});
}

// ✅ Check if cancellation requested
if (!order.cancellationRequested) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'No cancellation request found for this order'

});
}

// ✅ Check if already processed
if (order.cancellationStatus !== 'pending') {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: `Cancellation already ${order.cancellationStatus}`
});
}

// ✅ Update order
order.status = ORDER_STATUS.CANCELLED;

order.cancellationStatus = 'approved';
order.cancellationAdminNote = adminNote || '';
order.cancellationProcessedAt = new Date();
order.cancellationProcessedBy = req.user.id;

await order.save();

// ✅ Process refund if payment was made
if (order.paymentStatus === PAYMENT_STATUS.SIMULATED) {
await Payment.findOneAndUpdate(
{ orderId: order._id },

{ status: 'refunded' }
);
}

// ✅ Create notification for customer
await Notification.create({
userId: order.userId,
title: 'Order Cancellation Approved',
message: `Your order #${orderId} has been cancelled and refunded. ${adminNote || ''}`,
type: 'order',
orderId: orderId,
isRead: false
});

res.status(HTTP_STATUS.OK).json({
success: true,
message: `Order #${orderId} cancellation approved and refund processed`
});

} catch (error) {
console.error('❌ Approve Cancellation Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});

}
};

/**
* @desc    Reject cancellation request (Admin only)
* @route   PATCH /api/cancellations/:orderId/reject
* @access  Private/Admin
*
* Frontend: admin/cancellations.html → Reject cancellation
* Expected Body: { adminNote }
* Response: { success, message }
*/
exports.rejectCancellation = async (req, res) => {

try {
const { orderId } = req.params;
const { adminNote } = req.body;

// ✅ Find order
const order = await Order.findOne({ orderId: orderId });
if (!order) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Order not found'
});
}

// ✅ Check if cancellation requested

if (!order.cancellationRequested) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'No cancellation request found for this order'
});
}

// ✅ Check if already processed
if (order.cancellationStatus !== 'pending') {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,

error: `Cancellation already ${order.cancellationStatus}`
});
}

// ✅ Update order
order.cancellationStatus = 'rejected';
order.cancellationAdminNote = adminNote || 'Cancellation request rejected';
order.cancellationProcessedAt = new Date();
order.cancellationProcessedBy = req.user.id;

await order.save();

// ✅ Create notification for customer
await Notification.create({
userId: order.userId,
title: 'Cancellation Request Rejected',
message: `Your cancellation request for order #${orderId} was rejected. ${adminNote || 'Please contact support for more information.'}`,
type: 'order',
orderId: orderId,
isRead: false
});

res.status(HTTP_STATUS.OK).json({

success: true,
message: `Order #${orderId} cancellation rejected`
});

} catch (error) {
console.error('❌ Reject Cancellation Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Get cancellation statistics (Admin only)
* @route   GET /api/cancellations/stats
* @access  Private/Admin
*
* Frontend: admin/cancellations.html → Metrics
* Response: { totalCancellations, pendingApproval, refundedToday, rejectedRequests }
*/
exports.getCancellationStats = async (req, res) => {
try {
const totalCancellations = await Order.countDocuments({

cancellationRequested: true
});

const pendingApproval = await Order.countDocuments({
cancellationRequested: true,
cancellationStatus: 'pending'
});

// ✅ Today's refunded cancellations
const today = new Date();
today.setHours(0, 0, 0, 0);
const refundedToday = await Order.countDocuments({
cancellationRequested: true,
cancellationStatus: 'approved',
cancellationProcessedAt: {

$gte: today }
});

const rejectedRequests = await Order.countDocuments({
cancellationRequested: true,
cancellationStatus: 'rejected'
});

// ✅ Calculate total refund amount (approved cancellations)
const approvedCancellations = await Order.find({
cancellationRequested: true,
cancellationStatus: 'approved',
paymentStatus: PAYMENT_STATUS.SIMULATED
});

const totalRefundAmount = approvedCancellations.reduce((sum, order) => sum + order.totalAmount, 0);

res.status(HTTP_STATUS.OK).json({
success: true,
stats: {
totalCancellations,
pendingApproval,
refundedToday,
rejectedRequests,
totalRefundAmount
}
});

} catch (error) {

console.error('❌ Get Cancellation Stats Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Check if order can be cancelled
* @route   GET /api/cancellations/:orderId/check
* @access  Private

*
* Frontend: cancel-order.html → Check cancellation eligibility
* Response: { success, canCancel, status, message }
*/
exports.checkCancellationEligibility = async (req, res) => {
try {
const { orderId } = req.params;

// ✅ Find order
const order = await Order.findOne({ orderId: orderId });
if (!order) {
return res.status(HTTP_STATUS.NOT_FOUND).json({

success: false,
error: 'Order not found'
});
}

// ✅ Check if user owns order
if (order.userId.toString() !== req.user.id) {
return res.status(HTTP_STATUS.FORBIDDEN).json({
success: false,
error: 'Unauthorized to check this order'
});
}

// ✅ Determine if can cancel

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
items: order.items.map(item => ({
name: item.name,

quantity: item.quantity,
price: item.price
}))
}
});

} catch (error) {
console.error('❌ Check Cancellation Eligibility Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

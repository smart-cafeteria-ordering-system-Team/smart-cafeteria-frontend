const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { ORDER_STATUS, MESSAGES, HTTP_STATUS } = require('../config/constants');

/**
* @desc    Get kitchen dashboard data
* @route   GET /api/kitchen/dashboard
* @access  Private/Kitchen
*
* Frontend: kitchen/dashboard.html → Load dashboard
* Response: { success, stats, orders }
*/
exports.getKitchenDashboard = async (req, res) => {
try {
// ✅ Get all active orders (pending, preparing, ready)
const activeOrders = await

Order.find({
status: { $in: ['pending', 'preparing', 'ready'] }
})
.populate('userId', 'name phone')
.sort({ createdAt: 1 });

// ✅ Group by status
const pendingOrders = activeOrders.filter(o => o.status === 'pending');
const preparingOrders = activeOrders.filter(o => o.status === 'preparing');
const readyOrders = activeOrders.filter(o => o.status === 'ready');

// ✅ Get completed orders today
const today = new Date();
today.setHours(0, 0, 0, 0);
const completedToday = await Order.countDocuments({
status: 'served',
completedTime: { $gte: today }
});

// ✅ Stats for dashboard
const stats = {
pending: pendingOrders.length,
preparing: preparingOrders.length,
ready: readyOrders.length,

activeOrders: activeOrders.length,
completedToday: completedToday,
totalActive: activeOrders.length
};

res.status(HTTP_STATUS.OK).json({
success: true,
stats,
orders: {
pending: pendingOrders.map(o => formatKitchenOrder(o)),
preparing: preparingOrders.map(o =>

formatKitchenOrder(o)),
ready: readyOrders.map(o => formatKitchenOrder(o))
}
});

} catch (error) {
console.error('❌ Get Kitchen Dashboard Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};


/**
* @desc    Get kitchen orders (list view)
* @route   GET /api/kitchen/orders
* @access  Private/Kitchen
*
* Frontend: kitchen/orders.html → Load orders list
* Query Params: status
* Response: { success, count, orders: [...] }
*/
exports.getKitchenOrders = async (req, res) => {
try {
const { status } = req.query;

// ✅ Build filter
let filter = {};
filter.paymentStatus = 'PAID';
if (status && status !== 'all') {
filter.status = status;
} else {
filter.status = { $in: ['pending', 'preparing', 'ready', 'served'] };
}

const orders = await Order.find(filter)
.populate('userId', 'name phone')
.sort({ createdAt: -1 });

res.status(HTTP_STATUS.OK).json({
success: true,

count: orders.length,
orders: orders.map(o => formatKitchenOrder(o))
});

} catch (error) {
console.error('❌ Get Kitchen Orders Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Accept order (Kitchen)
* @route   PATCH /api/kitchen/orders/:orderId/accept
* @access  Private/Kitchen
*
* Frontend: kitchen/dashboard.html → Accept order
* Response: { success, message, order }
*/
exports.acceptOrder = async (req, res) => {
try {
const { orderId } = req.params;

const order = await Order.findOne({ orderId: orderId });

if (!order) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Order not found'
});
}

// ✅ Check if order can be accepted
if (order.status !== 'pending') {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: `Order cannot be accepted (status: ${order.status})`

});
}

// ✅ Update status to preparing
order.status = ORDER_STATUS.PREPARING;
await order.save();

// ✅ Notify customer
await Notification.create({
userId: order.userId,
title: 'Order Accepted!',
message: `Your order #${orderId} has been accepted and is being prepared by the kitchen.`,
type: 'status_update',
orderId: orderId,
link: `/customer/order-

tracking.html?id=${orderId}`,
isRead: false
});

res.status(HTTP_STATUS.OK).json({
success: true,
message: `Order #${orderId} accepted and is now being prepared`,
order: formatKitchenOrder(order)
});

} catch (error) {
console.error('❌ Accept Order Error:', error);


res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Mark order as ready (Kitchen)
* @route   PATCH /api/kitchen/orders/:orderId/ready
* @access  Private/Kitchen
*
* Frontend: kitchen/dashboard.html → Mark ready

* Response: { success, message, order }
*/
exports.markOrderReady = async (req, res) => {
try {
const { orderId } = req.params;

const order = await Order.findOne({ orderId: orderId });
if (!order) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Order not found'
});
}


// ✅ Check if order can be marked ready
if (order.status !== 'preparing') {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: `Order cannot be marked ready (status: ${order.status})`
});
}

// ✅ Update status to ready
order.status = ORDER_STATUS.READY;
order.readyTime = new Date();

await order.save();

// ✅ Notify customer
await Notification.create({
userId: order.userId,
title: 'Order Ready!',
message: `Your order #${orderId} is ready for pickup! 🍽️`,
type: 'ready',
orderId: orderId,
link: `/customer/order-tracking.html?id=${orderId}`,
isRead: false
});

res.status(HTTP_STATUS.OK).json({
success: true,

message: `Order #${orderId} is now ready for pickup`,
order: formatKitchenOrder(order)
});

} catch (error) {
console.error('❌ Mark Order Ready Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};


/**
* @desc    Mark order as served (Kitchen)
* @route   PATCH /api/kitchen/orders/:orderId/serve
* @access  Private/Kitchen
*
* Frontend: kitchen/dashboard.html → Mark served
* Response: { success, message, order }
*/
exports.markOrderServed = async (req, res) => {
try {
const { orderId } = req.params;

const order = await Order.findOne({ orderId: orderId });
if (!order) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Order not found'
});
}

// ✅ Check if order can be marked served
if (order.status !== 'ready') {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,

error: `Order cannot be marked served (status: ${order.status})`
});
}

// ✅ Update status to served
order.status = ORDER_STATUS.SERVED;
order.completedTime = new Date();
await order.save();

res.status(HTTP_STATUS.OK).json({
success: true,
message: `Order #${orderId} has been served`,

order: formatKitchenOrder(order)
});

} catch (error) {
console.error('❌ Mark Order Served Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**

* @desc    Reject/cancel order from kitchen
* @route   PATCH /api/kitchen/orders/:orderId/reject
* @access  Private/Kitchen
*
* Frontend: kitchen/dashboard.html → Reject order
* Expected Body: { reason }
* Response: { success, message }
*/
exports.rejectOrder = async (req, res) => {
try {
const { orderId } = req.params;
const { reason } = req.body;

const order = await

Order.findOne({ orderId: orderId });
if (!order) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Order not found'
});
}

// ✅ Check if order can be rejected
if (order.status !== 'pending' && order.status !== 'preparing') {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,

error: `Order cannot be rejected (status: ${order.status})`
});
}

// ✅ Update status to cancelled
order.status = ORDER_STATUS.CANCELLED;
order.cancellationReason = reason || 'Rejected by kitchen';
await order.save();

// ✅ Notify customer
await Notification.create({
userId: order.userId,
title: 'Order Rejected',
message: `Your order #${orderId} has been rejected by the

kitchen. ${reason || ''}`,
type: 'system',
orderId: orderId,
isRead: false
});

res.status(HTTP_STATUS.OK).json({
success: true,
message: `Order #${orderId} has been rejected`
});

} catch (error) {
console.error('❌ Reject Order Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Get kitchen stats only
* @route   GET /api/kitchen/stats
* @access  Private/Kitchen
*
* Frontend: kitchen/dashboard.html → Live stats update
* Response: { success, stats }
*/
exports.getKitchenStats = async (req, res) => {
try {
const pending = await Order.countDocuments({ status: 'pending' });
const preparing = await Order.countDocuments({ status: 'preparing' });
const ready = await Order.countDocuments({ status: 'ready' });
const activeOrders = pending + preparing;

const today = new Date();
today.setHours(0, 0, 0, 0);
const completedToday = await Order.countDocuments({

status: 'served',
completedTime: { $gte: today }
});

res.status(HTTP_STATUS.OK).json({
success: true,
stats: {
pending,
preparing,
ready,
activeOrders,
completedToday
}
});

} catch (error) {

console.error('❌ Get Kitchen Stats Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* Helper: Format order for kitchen display
*/
function formatKitchenOrder(order) {
const elapsed = order.createdAt ?

getElapsedTime(order.createdAt) : '0 mins';
return {
id: order._id,
orderId: order.orderId,
customerName: order.customerName,
customerPhone: order.customerPhone,
items: order.items.map(item => ({
name: item.name,
quantity: item.quantity,
notes: item.notes || ''
})),
status: order.status,
totalAmount: order.totalAmount,
orderType: order.orderType,

tableNumber: order.tableNumber,
createdAt: order.createdAt,
elapsedTime: elapsed,
readyTime: order.readyTime,
completedTime: order.completedTime
};
}

/**
* Helper: Get elapsed time
*/
function getElapsedTime(date) {
const diffMs = Date.now() - new Date(date).getTime();
const diffMins = Math.floor(diffMs / 60000);

if (diffMins < 1) return 'Just now';
if (diffMins < 60) return `${diffMins} mins`;
const diffHours = Math.floor(diffMins / 60);
return `${diffHours}h ${diffMins % 60}m`;
}

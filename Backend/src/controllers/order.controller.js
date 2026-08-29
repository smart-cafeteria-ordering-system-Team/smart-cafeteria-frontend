const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Notification = require('../models/Notification');
const { ORDER_STATUS,

PAYMENT_STATUS, MESSAGES, HTTP_STATUS } = require('../config/constants');

/**
* @desc    Create new order
* @route   POST /api/orders
* @access  Private
*
* Frontend: checkout.js → Place Order
* Expected Body: { items, customerName, customerPhone, orderType, tableNumber, paymentMethod, totalAmount }
* Response: { success, order }
*/
exports.createOrder = async (req,

res) => {
try {
const {
items,
customerName,
customerPhone,
orderType = 'dine-in',
tableNumber = 'N/A',
paymentMethod,
totalAmount,
notes
} = req.body;

// ✅ Validate required fields
if (!items || !Array.isArray(items) || items.length === 0) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Order must have at least one item'
});
}

if (!customerName || !customerPhone) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Customer name and phone are required'
});
}

if (!paymentMethod) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Payment method is required'
});
}

// ✅ Validate items and calculate subtotal
let subtotal = 0;
const validatedItems = [];

for (const item of items) {
const menuItem = await MenuItem.findById(item.id);

if (!menuItem) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: `Item ${item.name} not found`
});
}

if (!menuItem.availability) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: `${menuItem.name.en} is currently unavailable`

});
}

const quantity = parseInt(item.quantity) || 1;
const price = menuItem.price;
const itemTotal = price * quantity;
subtotal += itemTotal;

validatedItems.push({
itemId: menuItem._id,
name: menuItem.name.en,
quantity: quantity,
price: price,
notes: item.notes || ''
});
}


// ✅ Calculate totals
const serviceFee = 20;
const total = subtotal + serviceFee;

// ✅ Create order
const order = await Order.create({
userId: req.user.id,
customerName: customerName.trim(),
customerPhone: customerPhone,
orderType: orderType,
tableNumber: tableNumber,
items: validatedItems,
subtotal: subtotal,

serviceFee: serviceFee,
totalAmount: total,
paymentMethod: paymentMethod,
paymentStatus: PAYMENT_STATUS.PENDING,
status: ORDER_STATUS.PENDING,
orderDate: new Date().toLocaleString(),
notes: notes || ''
});

// ✅ Create notification for kitchen (if needed)
// In production, this would notify kitchen staff

res.status(HTTP_STATUS.CREATED).json({
success: true,
message: MESSAGES.ORDER_PLACED,
order: order.getSummary()
});

} catch (error) {
console.error('❌ Create Order Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR

});
}
};

/**
* @desc    Get all orders (Admin only)
* @route   GET /api/orders
* @access  Private/Admin
*
* Frontend: admin/orders.html → Load all orders
* Query Params: status, paymentStatus, date
* Response: { success, count, orders: [...] }
*/
exports.getAllOrders = async (req,

res) => {
try {
const { status, paymentStatus, date, limit = 50, page = 1 } = req.query;

// ✅ Build filter
let filter = {};
if (status && status !== 'all') filter.status = status;
if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;
if (date) filter.orderDate = { $regex: date };

// ✅ Pagination

const skip = (parseInt(page) - 1) * parseInt(limit);

// ✅ Execute query
const orders = await Order.find(filter)
.sort({ createdAt: -1 })
.skip(skip)
.limit(parseInt(limit));

const total = await Order.countDocuments(filter);

res.status(HTTP_STATUS.OK).json({
success: true,
count: orders.length,
total: total,

orders: orders.map(order => order.getSummary())
});

} catch (error) {
console.error('❌ Get All Orders Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**

* @desc    Get user's orders
* @route   GET /api/orders/myorders
* @access  Private
*
* Frontend: order-history.js → Load user orders
* Response: { success, count, orders: [...] }
*/
exports.getMyOrders = async (req, res) => {
try {
const orders = await Order.find({ userId: req.user.id })
.sort({ createdAt: -1 });



res.status(HTTP_STATUS.OK).json({
success: true,
count: orders.length,
orders: orders.map(order => order.getSummary())
});

} catch (error) {
console.error('❌ Get My Orders Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}

};

/**
* @desc    Get order by ID
* @route   GET /api/orders/:id
* @access  Private
*
* Frontend: order-status.js → Load order details
* Response: { success, order }
*/
exports.getOrderById = async (req, res) => {
try {
const order = await Order.findOne({ orderId: req.params.id });

if (!order) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Order not found'
});
}

// ✅ Check if user owns order or is admin
if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
return res.status(HTTP_STATUS.FORBIDDEN).json({
success: false,

error: 'Unauthorized to view this order'
});
}

res.status(HTTP_STATUS.OK).json({
success: true,
order: {
...order.getSummary(),
items: order.items,
orderDate: order.orderDate,
orderTime: order.orderTime,
readyTime: order.readyTime,
completedTime: order.completedTime,
cancellationReason:

order.cancellationReason,
notes: order.notes
}
});

} catch (error) {
console.error('❌ Get Order By ID Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Update order status (Kitchen/Admin)
* @route   PATCH /api/orders/:id/status
* @access  Private/Kitchen/Admin
*
* Frontend: kitchen/dashboard.html → Update status
* Expected Body: { status }
* Response: { success, order }
*/
exports.updateOrderStatus = async (req, res) => {
try {
const { status } = req.body;

// ✅ Validate status

const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
if (!validStatuses.includes(status)) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Invalid status'
});
}

const order = await Order.findOne({ orderId: req.params.id });
if (!order) {
return

res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Order not found'
});
}

// ✅ Update status
order.status = status;

// ✅ Set timestamps
if (status === 'ready') {
order.readyTime = new Date();
}
if (status === 'served') {
order.completedTime = new Date();
}


await order.save();

// ✅ Create notification for customer
if (status === 'ready' || status === 'preparing') {
await Notification.create({
userId: order.userId,
title: status === 'ready' ? 'Order Ready!' : 'Order Preparing',
message: status === 'ready'
? `Your order #${order.orderId} is ready for pickup!`
: `Your order #${order.orderId} is being prepared`,
type: 'order',

orderId: order.orderId,
isRead: false
});
}

res.status(HTTP_STATUS.OK).json({
success: true,
message: `Order status updated to ${status}`,
order: order.getSummary()
});

} catch (error) {
console.error('❌ Update Order Status Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Cancel order (Customer)
* @route   PATCH /api/orders/:id/cancel
* @access  Private
*
* Frontend: order-status.js → Cancel Order
* Expected Body: { reason }
* Response: { success, message }

*/
exports.cancelOrder = async (req, res) => {
try {
const { reason } = req.body;

const order = await Order.findOne({ orderId: req.params.id });
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

// ✅ Cancel order
order.status = 'cancelled';
order.cancellationReason = reason || 'Cancelled by customer';
await order.save();

res.status(HTTP_STATUS.OK).json({
success: true,
message: `Order #${order.orderId} cancelled

successfully`
});

} catch (error) {
console.error('❌ Cancel Order Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Get order statistics

(Admin only)
* @route   GET /api/orders/stats
* @access  Private/Admin
*
* Frontend: admin/dashboard.html → Metrics
* Response: { totalOrders, pendingOrders, preparingOrders, completedOrders, totalRevenue }
*/
exports.getOrderStats = async (req, res) => {
try {
const totalOrders = await Order.countDocuments();
const pendingOrders = await Order.countDocuments({ status: 'pending' });

const preparingOrders = await Order.countDocuments({ status: 'preparing' });
const readyOrders = await Order.countDocuments({ status: 'ready' });
const completedOrders = await Order.countDocuments({ status: 'served' });
const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

// ✅ Calculate revenue (only completed orders)
const completedOrdersData = await Order.find({ status: 'served' });
const totalRevenue =

completedOrdersData.reduce((sum, order) => sum + order.totalAmount, 0);

// ✅ Today's orders
const today = new Date().toISOString().split('T')[0];
const todayOrders = await Order.countDocuments({
orderDate: { $regex: today }
});

res.status(HTTP_STATUS.OK).json({
success: true,
stats: {
totalOrders,
pendingOrders,

preparingOrders,
readyOrders,
completedOrders,
cancelledOrders,
totalRevenue,
todayOrders
}
});

} catch (error) {
console.error('❌ Get Order Stats Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR

});
}
};

/**
* @desc    Get kitchen orders (For Kitchen Dashboard)
* @route   GET /api/orders/kitchen
* @access  Private/Kitchen
*
* Frontend: kitchen/dashboard.html → Live orders
* Response: { success, orders: [...] }
*/
exports.getKitchenOrders = async (req, res) => {
try {
const orders = await Order.find({

status: { $in: ['pending', 'preparing', 'ready'] }
})
.sort({ createdAt: 1 });

res.status(HTTP_STATUS.OK).json({
success: true,
count: orders.length,
orders: orders.map(order => ({
...order.getSummary(),
items: order.items,
orderTime: order.orderTime
}))
});

} catch (error) {
console.error('❌ Get Kitchen Orders Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

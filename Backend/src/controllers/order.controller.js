const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { ORDER_STATUS,
PAYMENT_STATUS, MESSAGES, HTTP_STATUS } = require('../config/constants');
const { emitSocketEvent } = require('../utils/socket');

// Resolve a menu item reference from any field the frontend may send
// (id | foodItem | menuItemId | itemId).
const resolveItemId = (item = {}) =>
  item.foodItem || item.id || item.menuItemId || item.itemId || null;

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
paymentMethod = 'chapa',
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

// ✅ Chapa is the only supported online payment method.
const normalizedPaymentMethod = String(paymentMethod || 'chapa').toLowerCase();
if (normalizedPaymentMethod !== 'chapa') {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Only Chapa online payment is supported'
});
}

// ✅ Validate order type (must match the Order schema enum)
const VALID_ORDER_TYPES = ['dine-in', 'takeaway'];
if (!VALID_ORDER_TYPES.includes(orderType)) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: `Order type must be one of: ${VALID_ORDER_TYPES.join(', ')}`
});
}

// ✅ Customer info falls back to the authenticated user profile
if (req.user?.id && (!customerName || !customerPhone)) {
  const profile = await User.findById(req.user.id).select('name fullName phone');
  if (profile) {
    req.user.name = profile.name || profile.fullName;
    req.user.phone = profile.phone;
  }
}
const name = (customerName && customerName.trim()) || req.user?.name || 'Customer';
const phone = (customerPhone && customerPhone.trim()) || req.user?.phone || '';

// ✅ Validate items and calculate subtotal (server-side prices only)
let subtotal = 0;
const validatedItems = [];

for (const item of items) {
const itemRef = resolveItemId(item);

if (!itemRef) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
message: 'Each order item requires a valid food item id',
error: 'Each order item requires a valid food item id'
});
}

// ✅ Validate MongoDB ObjectId format (24 hex characters)
const itemRefStr = String(itemRef);
if (!mongoose.Types.ObjectId.isValid(itemRefStr)) {
console.error(`[Order] Invalid item ID format: ${itemRefStr} (type: ${typeof itemRef})`);
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
message: `Invalid item reference: "${itemRefStr}". Item IDs must be valid menu item references. Please clear your cart and re-add items from the menu.`,
error: `Invalid food item id: ${itemRefStr}`
});
}

const menuItem = await MenuItem.findById(itemRef);

if (!menuItem) {
console.error(`[Order] Menu item not found: ${itemRefStr}`);
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
message: `Item with ID "${itemRefStr}" not found in menu. It may have been deleted. Please clear your cart and re-add items.`,
error: `Item ${item.name || itemRefStr} not found`
});
}

if (!menuItem.availability || !menuItem.isAvailable) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
message: `${menuItem.name.en || 'This item'} is currently unavailable. Please remove it from your cart.`,
error: `${menuItem.name.en} is currently unavailable`
});
}

const quantity = parseInt(item.quantity) || 0;

if (quantity < 1) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
message: `Quantity must be at least 1 for ${menuItem.name.en}`,
error: `Quantity must be at least 1 for ${menuItem.name.en}`
});
}

// ✅ Server price is authoritative — client price is ignored to prevent tampering
const price = Number(menuItem.price) || 0;
const itemTotal = price * quantity;
subtotal += itemTotal;

validatedItems.push({
foodItem: menuItem._id,
itemId: menuItem._id,
title: menuItem.name.en,
name: menuItem.name.en,
quantity: quantity,
price: price,
notes: item.notes || ''
});
}

// ✅ Calculate totals
const serviceFee = subtotal > 0 ? 20 : 0;
const total = subtotal + serviceFee;

// ✅ Create order (canonical Phase-4 fields + legacy fields)
const order = await Order.create({
user: req.user.id,
userId: req.user.id,
customerName: name,
customerPhone: phone,
orderType: orderType,
tableNumber: tableNumber,
items: validatedItems,
subtotal: subtotal,
serviceFee: serviceFee,
totalAmount: total,
paymentMethod: normalizedPaymentMethod,
paymentStatus: 'unpaid',
status: ORDER_STATUS.PENDING,
orderStatus: ORDER_STATUS.PENDING,
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
const id = req.params.id;
let order = null;

if (mongoose.Types.ObjectId.isValid(id)) {
order = await Order.findById(id);
}
if (!order) {
order = await Order.findOne({
$or: [{ orderId: id }, { orderNumber: id }]
});
}

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
const requestedStatus = String(req.body.status || '').toLowerCase();
const status = requestedStatus === 'delivered' ? 'completed' : requestedStatus;

// ✅ Validate status

const validStatuses = ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
if (!validStatuses.includes(status)) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Invalid status'
});
}

const order = await (mongoose.Types.ObjectId.isValid(req.params.id)
  ? Order.findById(req.params.id)
  : Order.findOne({ $or: [{ orderId: req.params.id }, { orderNumber: req.params.id }] }));
if (!order) {
return

res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Order not found'
});
}

// ✅ Record when each state was entered (log timestamp updates)
const statusTimestampField = {
  preparing: 'preparingTime',
  ready: 'readyTime',
  served: 'completedTime'
};
const timestampField = statusTimestampField[status];
if (timestampField && !order[timestampField]) {
  order[timestampField] = new Date();
}

// ✅ Update status. The model pre-save hook keeps the canonical
// `orderStatus` field in sync with `status` automatically.
order.status = status;

await order.save();

// ✅ Create a notification for every kitchen status update.
const orderReference = order.orderNumber || order.orderId || order._id.toString().slice(-4);
let title = 'Order Update';
let message = `Your order #${orderReference} status changed to ${status}.`;
if (status === 'ready') {
  title = 'Food is Ready!';
  message = `Your order #${orderReference} has been finished by the kitchen and is ready for pickup/serving!`;
} else if (status === 'preparing') {
  title = 'Kitchen Started Cooking';
  message = `The kitchen staff started preparing your order #${orderReference}.`;
} else if (status === 'completed' || status === 'served') {
  title = 'Order Completed';
  message = `Your order #${orderReference} is completed. Enjoy your meal!`;
} else if (status === 'cancelled') {
  title = 'Order Cancelled';
  message = `Your order #${orderReference} has been cancelled.`;
}

const notification = await Notification.create({
  userId: order.userId,
  title,
  message,
  type: 'status_update',
  orderId: order.orderNumber || order.orderId,
  isRead: false
});

// ✅ Emit real-time Socket.IO event to the customer
try {
const customerId = order.userId ? order.userId.toString() : null;
if (customerId) {
  emitSocketEvent(`user_${customerId}`, 'orderStatusUpdated', {
    orderId: order._id,
    orderNumber: order.orderId,
    status: order.status,
    message: status === 'ready'
      ? `Your order #${order.orderId} is ready for pickup!`
      : status === 'preparing'
        ? `Your order #${order.orderId} is being prepared`
        : `Your order #${order.orderId} status updated to ${status}`
  });
}
} catch (socketErr) {
console.warn('[Order] Socket emit failed (non-critical):', socketErr.message);
}

res.status(HTTP_STATUS.OK).json({
success: true,
message: `Order status updated to ${status}`,
order: order.getSummary(),
notification
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

const order = await (mongoose.Types.ObjectId.isValid(req.params.id)
  ? Order.findById(req.params.id)
  : Order.findOne({ $or: [{ orderId: req.params.id }, { orderNumber: req.params.id }] }));
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
const ACTIVE_STATUSES = ['pending', 'preparing', 'ready'];

// Match both the legacy `status` field and the canonical `orderStatus`
// field, then sort chronologically (oldest first) so the kitchen works
// through the queue in FIFO order.
const orders = await Order.find({
  $or: [
    { status: { $in: ACTIVE_STATUSES } },
    { orderStatus: { $in: ACTIVE_STATUSES } }
  ]
})
.sort({ createdAt: 1 });

res.status(HTTP_STATUS.OK).json({
  success: true,
  count: orders.length,
  orders: orders.map(order => ({
    ...order.getSummary(),
    items: order.items,
    orderTime: order.orderTime,
    readyTime: order.readyTime,
    completedTime: order.completedTime,
    preparingTime: order.preparingTime,
    orderType: order.orderType,
    tableNumber: order.tableNumber,
    notes: order.notes
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

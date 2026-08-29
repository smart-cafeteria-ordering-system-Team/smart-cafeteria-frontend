const Order = require('../models/Order');
const Payment = require('../models/Payment');
const MenuItem = require('../models/MenuItem');

const User = require('../models/User');
const Report = require('../models/Report');
const { MESSAGES, HTTP_STATUS } = require('../config/constants');

/**
* @desc    Generate daily orders report
* @route   GET /api/reports/daily
* @access  Private/Admin
*
* Frontend: admin/reports.html → Daily Orders Report
* Query Params: date (YYYY-MM-DD)
* Response: { success, report }

*/
exports.getDailyOrdersReport = async (req, res) => {
try {
const { date } = req.query;
const reportDate = date || new Date().toISOString().split('T')[0];

// ✅ Get orders for the date
const orders = await Order.find({
orderDate: { $regex: reportDate }
});

const totalOrders = orders.length;
const totalRevenue = orders.reduce((sum, order) => sum

+ order.totalAmount, 0);
const pendingOrders = orders.filter(o => o.status === 'pending').length;
const completedOrders = orders.filter(o => o.status === 'served').length;
const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

// ✅ Get payment breakdown
const payments = await Payment.find({
paymentDate: { $regex: reportDate }
});

const paymentMethods = {
cbeBirr: payments.filter(p => p.method === 'cbe_birr').length,
telebirr: payments.filter(p => p.method === 'telebirr').length,
cash: payments.filter(p => p.method === 'cash').length
};

// ✅ Get popular items
const itemCounts = {};
orders.forEach(order => {
order.items.forEach(item => {
const name = item.name;
itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
});

});

const popularItems = Object.entries(itemCounts)
.map(([name, count]) => ({ name, count }))
.sort((a, b) => b.count - a.count)
.slice(0, 10);

// ✅ Create report object
const report = {
date: reportDate,
totalOrders,
totalRevenue,
pendingOrders,
completedOrders,
cancelledOrders,

paymentMethods,
popularItems,
averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0
};

// ✅ Save report to database
await Report.create({
reportType: 'daily_orders',
date: reportDate,
fromDate: new Date(reportDate),
toDate: new Date(reportDate),
data: report,
summary: {
totalOrders,
totalSales: totalRevenue,

topItems: popularItems.slice(0, 5)
},
generatedBy: req.user.id
});

res.status(HTTP_STATUS.OK).json({
success: true,
report
});

} catch (error) {
console.error('❌ Get Daily Orders Report Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({

success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Generate sales report
* @route   GET /api/reports/sales
* @access  Private/Admin
*
* Frontend: admin/reports.html → Sales Report
* Query Params: fromDate, toDate
* Response: { success, report }
*/
exports.getSalesReport = async (req, res) => {
try {
const { fromDate, toDate } = req.query;

if (!fromDate || !toDate) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'From date and to date are required'
});
}

// ✅ Get orders in date range
const orders = await Order.find({
createdAt: {

$gte: new Date(fromDate),
$lte: new Date(toDate)
},
status: { $in: ['served', 'ready'] }
});

const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
const totalOrders = orders.length;

// ✅ Daily breakdown
const dailyBreakdown = {};
orders.forEach(order => {
const date = order.orderDate?.split(',')[0] || order.createdAt.toISOString().split('T'

)[0];
if (!dailyBreakdown[date]) {
dailyBreakdown[date] = { orders: 0, revenue: 0 };
}
dailyBreakdown[date].orders++;
dailyBreakdown[date].revenue += order.totalAmount;
});

// ✅ Payment method breakdown
const payments = await Payment.find({
paymentDate: {
$gte: new Date(fromDate),

$lte: new Date(toDate)
},
status: 'simulated'
});

const paymentBreakdown = {
cbeBirr: payments.filter(p => p.method === 'cbe_birr').reduce((sum, p) => sum + p.amount, 0),
telebirr: payments.filter(p => p.method === 'telebirr').reduce((sum, p) => sum + p.amount, 0),
cash: payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0)
};


const report = {
fromDate,
toDate,
totalSales,
totalOrders,
averageOrderValue: totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0,
dailyBreakdown,
paymentBreakdown
};

// ✅ Save report
await Report.create({
reportType: 'sales',
date: `${fromDate} to ${toDate}`,

fromDate: new Date(fromDate),
toDate: new Date(toDate),
data: report,
summary: {
totalOrders,
totalSales
},
generatedBy: req.user.id
});

res.status(HTTP_STATUS.OK).json({
success: true,
report
});

} catch (error) {

console.error('❌ Get Sales Report Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Get popular items report
* @route   GET /api/reports/popular
* @access  Private/Admin
*
* Frontend: admin/reports.html →

Popular Items
* Query Params: fromDate, toDate, limit
* Response: { success, items: [...] }
*/
exports.getPopularItemsReport = async (req, res) => {
try {
const { fromDate, toDate, limit = 10 } = req.query;

// ✅ Build filter
let filter = {};
if (fromDate && toDate) {
filter.createdAt = {
$gte: new Date(fromDate),
$lte: new Date(toDate)
};

}

// ✅ Get orders
const orders = await Order.find(filter);

// ✅ Count items
const itemCounts = {};
orders.forEach(order => {
order.items.forEach(item => {
const key = item.name;
if (!itemCounts[key]) {
itemCounts[key] = {
name: item.name,
totalQuantity: 0,
totalRevenue: 0
};
}

itemCounts[key].totalQuantity += item.quantity;
itemCounts[key].totalRevenue += item.price * item.quantity;
});
});

// ✅ Sort and limit
const popularItems = Object.values(itemCounts)
.sort((a, b) => b.totalQuantity - a.totalQuantity)
.slice(0, parseInt(limit));

// ✅ Calculate totals
const totalItems =

popularItems.reduce((sum, item) => sum + item.totalQuantity, 0);
const totalRevenue = popularItems.reduce((sum, item) => sum + item.totalRevenue, 0);

const report = {
fromDate: fromDate || 'All time',
toDate: toDate || 'All time',
items: popularItems,
totalItems,
totalRevenue
};

res.status(HTTP_STATUS.OK).json({
success: true,

report
});

} catch (error) {
console.error('❌ Get Popular Items Report Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Get payments report

* @route   GET /api/reports/payments
* @access  Private/Admin
*
* Frontend: admin/reports.html → Payments Report
* Query Params: fromDate, toDate
* Response: { success, report }
*/
exports.getPaymentsReport = async (req, res) => {
try {
const { fromDate, toDate } = req.query;

// ✅ Build filter
let filter = {};
if (fromDate && toDate) {

filter.paymentDate = {
$gte: new Date(fromDate),
$lte: new Date(toDate)
};
}

// ✅ Get payments
const payments = await Payment.find(filter)
.populate('userId', 'name email');

const totalPayments = payments.length;
const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
const successful =

payments.filter(p => p.status === 'simulated').length;
const failed = payments.filter(p => p.status === 'failed').length;
const pending = payments.filter(p => p.status === 'pending').length;

// ✅ Method breakdown
const methodBreakdown = {
cbeBirr: payments.filter(p => p.method === 'cbe_birr').length,
telebirr: payments.filter(p => p.method === 'telebirr').length,
cash: payments.filter(p => p.method === 'cash').length
};

const report = {
fromDate: fromDate || 'All time',
toDate: toDate || 'All time',
totalPayments,
totalAmount,
successful,
failed,
pending,
methodBreakdown,
averageAmount: totalPayments > 0 ? (totalAmount / totalPayments).toFixed(2) : 0
};

res.status(HTTP_STATUS.OK).json({
success: true,

report
});

} catch (error) {
console.error('❌ Get Payments Report Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Get all saved reports

(Admin only)
* @route   GET /api/reports
* @access  Private/Admin
*
* Frontend: admin/reports.html → Report history
* Response: { success, count, reports: [...] }
*/
exports.getAllReports = async (req, res) => {
try {
const reports = await Report.find()
.populate('generatedBy', 'name email')
.sort({ createdAt: -1 });

res.status(HTTP_STATUS.OK).json({
success: true,
count: reports.length,
reports: reports.map(report => ({
id: report._id,
reportType: report.reportType,
date: report.date,
summary: report.summary,
generatedBy: report.generatedBy?.name || 'System',
createdAt: report.createdAt
}))
});

} catch (error) {
console.error('❌ Get All Reports Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Get report by ID (Admin only)
* @route   GET /api/reports/:id
* @access  Private/Admin

*
* Frontend: admin/reports.html → View report details
* Response: { success, report }
*/
exports.getReportById = async (req, res) => {
try {
const report = await Report.findById(req.params.id)
.populate('generatedBy', 'name email');

if (!report) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,

error: 'Report not found'
});
}

res.status(HTTP_STATUS.OK).json({
success: true,
report: {
id: report._id,
reportType: report.reportType,
date: report.date,
data: report.data,
summary: report.summary,
generatedBy: report.generatedBy?.name || 'System',
createdAt: report.createdAt

}
});

} catch (error) {
console.error('❌ Get Report By ID Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Delete report (Admin

only)
* @route   DELETE /api/reports/:id
* @access  Private/Admin
*
* Frontend: admin/reports.html → Delete report
* Response: { success, message }
*/
exports.deleteReport = async (req, res) => {
try {
const report = await Report.findByIdAndDelete(req.params.id);

if (!report) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Report not found'
});
}

res.status(HTTP_STATUS.OK).json({
success: true,
message: 'Report deleted successfully'
});

} catch (error) {
console.error('❌ Delete Report Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

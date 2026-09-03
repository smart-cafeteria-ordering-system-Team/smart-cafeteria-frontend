const bcrypt = require("bcryptjs");
const Order = require("../models/Order");
const User = require("../models/User");
const Payment = require("../models/Payment");
const MenuItem = require("../models/MenuItem");
const Category = require("../models/Category");
const Feedback = require("../models/Feedback");
const Setting = require("../models/Setting");
const ActivityLog = require("../models/ActivityLog");
const { HTTP_STATUS, MESSAGES } = require("../config/constants");
const { coerceValue, DEFAULT_SETTINGS } = require("../utils/settings");

/**
 * @desc    Get admin dashboard aggregate stats (real MongoDB data)
 * @route   GET /api/v1/admin/dashboard
 * @access  Private/Admin
 * Frontend: admin/dashboard.html
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [
      totalUsers,
      students,
      kitchenStaff,
      admins,
      totalMenu,
      availableMenu,
      unavailableMenu,
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      servedOrders,
      completedOrders,
      cancelledOrders,
      successfulPayments,
      pendingPayments,
      failedPayments,
      todayRevenue,
      totalRevenue,
      pendingCancellations,
      pendingRefunds,
      chartSeries,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: { $in: ["kitchen", "KITCHEN_STAFF"] } }),
      User.countDocuments({ role: { $in: ["admin", "ADMIN"] } }),
      MenuItem.countDocuments(),
      MenuItem.countDocuments({ availability: true, isAvailable: true }),
      MenuItem.countDocuments({ $or: [{ availability: false }, { isAvailable: false }] }),
      Order.countDocuments(),
      Order.countDocuments({ status: { $regex: /^(pending|preparing|in_progress|in-progress)$/i } }),
      Order.countDocuments({ status: { $regex: /^preparing$/i } }),
      Order.countDocuments({ status: { $regex: /^ready$/i } }),
      Order.countDocuments({ status: { $regex: /^served$/i } }),
      Order.countDocuments({ status: { $regex: /^(completed|done)$/i } }),
      Order.countDocuments({ status: { $regex: /^cancelled$/i } }),
      Payment.countDocuments({ status: { $regex: /^paid$/i } }),
      Payment.countDocuments({ status: { $regex: /^pending$/i } }),
      Payment.countDocuments({ status: { $regex: /^failed$/i } }),
      Order.aggregate([
        {
          $match: {
            $and: [
              { createdAt: { $gte: today } },
              {
                $or: [
                  { paymentStatus: { $regex: /^(paid|completed|delivered|success)$/i } },
                  { status: { $regex: /^(paid|completed|delivered|success)$/i } },
                ],
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$totalAmount", { $ifNull: ["$totalPrice", "$amount"] }] } },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            $or: [
              { paymentStatus: { $regex: /^(paid|completed|delivered|success)$/i } },
              { status: { $regex: /^(paid|completed|delivered|success)$/i } },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$totalAmount", { $ifNull: ["$totalPrice", "$amount"] }] } },
          },
        },
      ]),
      Order.countDocuments({ cancellationRequested: true, cancellationStatus: { $regex: /^pending$/i } }),
      Order.countDocuments({
        $or: [
          { status: { $regex: /^(cancelled|refund_requested|cancellation_pending)$/i } },
          { refundStatus: { $regex: /^(pending|requested)$/i } },
          { isCancelled: true, isRefunded: false },
        ],
      }),
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $regexMatch: { input: { $ifNull: ["$paymentStatus", ""] }, regex: /^(paid|completed|delivered|success)$/i } },
                      { $regexMatch: { input: { $ifNull: ["$status", ""] }, regex: /^(paid|completed|delivered|success)$/i } },
                    ],
                  },
                  { $ifNull: ["$totalAmount", { $ifNull: ["$totalPrice", "$amount"] }] },
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const seriesMap = {};
    chartSeries.forEach((point) => {
      seriesMap[point._id] = { orders: point.orders, revenue: point.revenue };
    });

    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      last7Days.push({
        date: key,
        orders: (seriesMap[key] && seriesMap[key].orders) || 0,
        revenue: (seriesMap[key] && seriesMap[key].revenue) || 0,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalSales: totalRevenue[0] ? totalRevenue[0].total : 0,
        totalOrdersToday: totalOrders,
        pendingOrders: pendingOrders,
        pendingRefunds: pendingRefunds,
        users: { total: totalUsers, students, kitchenStaff, admins },
        menu: { total: totalMenu, available: availableMenu, unavailable: unavailableMenu },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          preparing: preparingOrders,
          ready: readyOrders,
          served: servedOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
        },
        payments: { successful: successfulPayments, pending: pendingPayments, failed: failedPayments },
        revenue: { today: todayRevenue[0] ? todayRevenue[0].total : 0, total: totalRevenue[0] ? totalRevenue[0].total : 0 },
        chart: { last7Days },
        cancellations: { pending: pendingRefunds },
      },
    });
  } catch (error) {
    console.error("❌ Get Dashboard Stats Error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Get recent orders for dashboard
 * @route   GET /api/admin/dashboard/recent-orders
 * @access  Private/Admin
 */
exports.getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 8)
      .populate("userId", "name email");
    res.status(HTTP_STATUS.OK).json({
      success: true,
      orders: orders.map((o) => ({
        _id: o._id,
        orderId: o.orderId,
        customerName: o.customerName,
        customer: o.userId ? { name: o.userId.name, email: o.userId.email } : null,
        status: o.status,
        paymentStatus: o.paymentStatus,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        items: (o.items || []).map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      })),
    });
  } catch (error) {
    console.error("❌ Get Recent Orders Error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Get recent payments for dashboard
 * @route   GET /api/v1/admin/dashboard/recent-payments
 * @access  Private/Admin
 */
exports.getRecentPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 8)
      .populate("userId", "name email")
      .populate("orderId", "orderId customerName totalAmount");
    res.status(HTTP_STATUS.OK).json({
      success: true,
      payments: payments.map((p) => ({
        _id: p._id,
        transactionId: p.transactionId,
        orderId: p.orderId ? { id: p.orderId._id, orderId: p.orderId.orderId, totalAmount: p.orderId.totalAmount } : null,
        customer: p.userId ? { id: p.userId._id, name: p.userId.name, email: p.userId.email } : null,
        provider: p.provider,
        method: p.method,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        phone: p.phone,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ Get Recent Payments Error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Get settings (grouped)
 * @route   GET /api/admin/settings
 * @access  Private/Admin
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = await Setting.find().sort({ group: 1, key: 1 });
    res.status(HTTP_STATUS.OK).json({
      success: true,
      settings: settings.map((s) => ({ key: s.key, value: s.value, type: s.type, group: s.group, label: s.label })),
    });
  } catch (error) {
    console.error("❌ Get Settings Error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Update setting by key
 * @route   PUT /api/admin/settings/:key
 * @access  Private/Admin
 */
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Value is required" });
    }

    const def = DEFAULT_SETTINGS.find(s => s.key === key);
    const coerced = def ? coerceValue(key, value) : value;

    const update = { value: coerced };
    if (def) {
      update.type = def.type;
      update.group = def.group;
      update.label = def.label;
    }

    const setting = await Setting.findOneAndUpdate({ key }, update, { returnDocument: 'after', upsert: true });
    await ActivityLog.create({
      actorId: req.user.id,
      actorName: req.user.name || "Admin",
      action: "settings.update",
      entity: "Setting",
      entityId: key,
      description: `Updated setting ${key}`,
    });
    res.status(HTTP_STATUS.OK).json({ success: true, setting });
  } catch (error) {
    console.error("❌ Update Setting Error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Get activity logs
 * @route   GET /api/admin/activity-logs
 * @access  Private/Admin
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const {
      limit = 50,
      page = 1,
      action,
      entity,
      entityType,
      search,
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (action && action !== 'all') filter.action = action;

    const entityValue = entityType || entity;
    if (entityValue && entityValue !== 'all') filter.entity = entityValue;

    if (startDate || endDate) {
      const dateRange = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'startDate must be a valid date' });
        }
        start.setHours(0, 0, 0, 0);
        dateRange.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'endDate must be a valid date' });
        }
        end.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + 1);
        dateRange.$lt = end;
      }
      filter.createdAt = dateRange;
    }

    if (search && search.trim()) {
      const term = String(search).trim();
      filter.$or = [
        { actorName: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { entityId: { $regex: term, $options: 'i' } },
        { entity: { $regex: term, $options: 'i' } },
      ];
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('actorId', 'name email role')
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      count: logs.length,
      logs: logs.map((log) => ({
        id: log._id,
        adminId: log.actorId ? log.actorId._id : null,
        adminName: log.actorId && log.actorId.name ? log.actorId.name : log.actorName || 'System',
        adminEmail: log.actorId ? log.actorId.email : '',
        adminRole: log.actorId ? log.actorId.role : '',
        action: log.action,
        entityType: log.entity,
        entityId: log.entityId,
        description: log.description,
        ip: log.ip,
        timestamp: log.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ Get Activity Logs Error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Change admin password
 * @route   PUT /api/admin/password
 * @access  Private/Admin
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "All password fields are required" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "New password and confirmation do not match" });
    }
    const user = await User.findById(req.user.id);
    if (!user || !user.password) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: "User not found" });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Current password is incorrect" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await ActivityLog.create({
      actorId: req.user.id,
      actorName: req.user.name || "Admin",
      action: "auth.password.change",
      description: "Admin changed their password",
    });
    res.status(HTTP_STATUS.OK).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("❌ Change Password Error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

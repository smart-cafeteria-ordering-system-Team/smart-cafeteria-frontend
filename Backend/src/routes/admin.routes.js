const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getDashboardStats,
  getRecentOrders,
  getRecentPayments,
  getSettings,
  updateSetting,
  getActivityLogs,
  changePassword,
} = require("../controllers/admin.controller");

// ============================================================
//  ALL ROUTES REQUIRE ADMIN ROLE
// ============================================================
router.use(protect);
router.use(authorize("admin", "ADMIN"));

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard aggregate stats
 * @access  Private/Admin
 * Frontend: admin/dashboard.html
 */
router.get("/dashboard", getDashboardStats);

/**
 * @route   GET /api/admin/dashboard/recent-orders
 * @desc    Get recent orders for dashboard
 * @access  Private/Admin
 */
router.get("/dashboard/recent-orders", getRecentOrders);

/**
 * @route   GET /api/admin/dashboard/recent-payments
 * @desc    Get recent payments for dashboard
 * @access  Private/Admin
 */
router.get("/dashboard/recent-payments", getRecentPayments);

/**
 * @route   GET /api/admin/activity-logs
 * @desc    Get activity logs
 * @access  Private/Admin
 */
router.get("/activity-logs", getActivityLogs);

/**
 * @route   GET /api/admin/settings
 * @desc    Get all settings
 * @access  Private/Admin
 */
router.get("/settings", getSettings);

/**
 * @route   PUT /api/admin/settings/:key
 * @desc    Update a setting by key
 * @access  Private/Admin
 */
router.put("/settings/:key", updateSetting);

/**
 * @route   PUT /api/admin/password
 * @desc    Change admin password
 * @access  Private/Admin
 */
router.put("/password", changePassword);

module.exports = router;

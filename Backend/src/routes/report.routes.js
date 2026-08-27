const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {

    getDailyOrdersReport,
    getSalesReport,
    getPopularItemsReport,
    getPaymentsReport,
    getAllReports,
    getReportById,
    deleteReport
} = require('../controllers/report.controller');

// ============================================================
//  ALL ROUTES REQUIRE ADMIN ROLE
// =============================

===============================
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/reports/daily
 * @desc    Get daily orders report
 * @access  Private/Admin
 * 
 * Frontend: admin/reports.html → Daily Orders Report
 * Query Params: date (YYYY-MM-DD)
 */
router.get('/daily', getDailyOrdersReport);

/**
 * @route   GET /api/reports/sales
 * @desc    Get sales report
 * @access  Private/Admin
 * 
 * Frontend: admin/reports.html → Sales Report
 * Query Params: fromDate, toDate
 */
router.get('/sales', getSalesReport);

/**
 * @route   GET /api/reports/popular
 * @desc    Get popular items report
 * @access  Private/Admin
 * 
 * Frontend: admin/reports.html → Popular Items

 * Query Params: fromDate, toDate, limit
 */
router.get('/popular', getPopularItemsReport);

/**
 * @route   GET /api/reports/payments
 * @desc    Get payments report
 * @access  Private/Admin
 * 
 * Frontend: admin/reports.html → Payments Report
 * Query Params: fromDate, toDate
 */
router.get('/payments', getPaymentsReport);


/**
 * @route   GET /api/reports
 * @desc    Get all saved reports
 * @access  Private/Admin
 * 
 * Frontend: admin/reports.html → Report history
 */
router.get('/', getAllReports);

/**
 * @route   GET /api/reports/:id
 * @desc    Get report by ID
 * @access  Private/Admin
 * 
 * Frontend: admin/reports.html → View report details

 */
router.get('/:id', getReportById);

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete report
 * @access  Private/Admin
 * 
 * Frontend: admin/reports.html → Delete report
 */
router.delete('/:id', deleteReport);

module.exports = router;

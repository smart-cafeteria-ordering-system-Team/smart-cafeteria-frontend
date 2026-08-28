const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  requestCancellation,
  getCancellations,
  approveCancellation,
  rejectCancellation,
  getCancellationStats,
  checkCancellationEligibility
} = require('../controllers/cancellation.controller');

// ============================================================
//  PRIVATE ROUTES (Customer)
// ============================================================

/**
 * @route   POST /api/cancellations/request
 * @desc    Request order cancellation
 * @access  Private
 * Body: { orderId, reason, details }
 */
router.post('/request', protect, requestCancellation);

/**
 * @route   GET /api/cancellations/:orderId/check
 * @desc    Check cancellation eligibility
 * @access  Private
 */
router.get('/:orderId/check', protect, checkCancellationEligibility);

// ============================================================
//  ADMIN ROUTES
// ============================================================

/**
 * @route   GET /api/cancellations
 * @desc    Get all cancellation requests
 * @access  Private/Admin
 * Query Params: status, date
 */
router.get('/', protect, authorize('admin'), getCancellations);

/**
 * @route   GET /api/cancellations/stats
 * @desc    Get cancellation statistics
 * @access  Private/Admin
 */
router.get('/stats', protect, authorize('admin'), getCancellationStats);

/**
 * @route   PATCH /api/cancellations/:orderId/approve
 * @desc    Approve cancellation
 * @access  Private/Admin
 * Body: { adminNote }
 */
router.patch('/:orderId/approve', protect, authorize('admin'), approveCancellation);

/**
 * @route   PATCH /api/cancellations/:orderId/reject
 * @desc    Reject cancellation
 * @access  Private/Admin
 * Body: { adminNote }
 */
router.patch('/:orderId/reject', protect, authorize('admin'), rejectCancellation);

module.exports = router;

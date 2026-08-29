const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllPayments,
  getPaymentStats,
  getPaymentById
} = require('../controllers/admin.payment.controller');

// All routes require admin role
router.use(protect);
router.use(authorize('admin', 'ADMIN'));

/**
 * Security note (Requirement 24):
 * These routes are READ-ONLY. An admin can monitor payment details but
 * can never manually set paymentStatus = PAID. Only backend verification
 * through the Chapa / Telebirr flows may do that.
 */

/**
 * @route   GET /api/v1/admin/payments
 * @desc    List payments (method / status / date / search / pagination)
 */
router.get('/', getAllPayments);

/**
 * @route   GET /api/v1/admin/payments/stats
 * @desc    Payment statistics for metric cards
 */
router.get('/stats', getPaymentStats);

/**
 * @route   GET /api/v1/admin/payments/:id
 * @desc    Payment detail (read-only)
 */
router.get('/:id', getPaymentById);

module.exports = router;
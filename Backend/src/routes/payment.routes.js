const express = require('express');
const router = express.Router();
const { protect, authorize } = 

require('../middleware/auth');
const {
    simulatePayment,
    getPaymentByOrder,
    getAllPayments,
    getMyPayments,
    getPaymentStats,
    validatePayment
} = require('../controllers/payment.controller');
const {
    initializeChapaPayment,
    verifyChapaPayment,
    verifyChapaPaymentByBody
} = require('../controllers/chapa.controller');

// ============================================================
//  PRIVATE ROUTES
// ============================================================

/**
 * @route   POST /api/payments/simulate
 * @desc    Simulate payment
 * @access  Private
 * 
 * Frontend: checkout.js → Simulate payment
 * Body: { orderId, method, phone, reference }
 */
router.post('/simulate', protect, simulatePayment);

/**
 * @route   POST /api/payments/checkout
 * @desc    Initialize a real Chapa payment for an order and return checkout_url
 * @access  Private
 * 
 * Frontend: checkout.js → Chapa online payment (Phase 7)
 * Body: { orderId, returnUrl }
 * Response: { success, checkoutUrl, transactionReference }
 */
router.post('/checkout', protect, initializeChapaPayment);

/**
 * @route   POST /api/payments/verify
 * @desc    Manual verification fallback (body: { tx_ref })
 * @access  Private
 * 
 * Frontend: order-tracking.js → Poll payment status (Phase 7)
 */
router.post('/verify', protect, verifyChapaPaymentByBody);

/**
 * @route   GET /api/payments/verify/:txRef
 * @desc    Manual verification fallback by path param
 * @access  Private
 */
router.get('/verify/:txRef', protect, verifyChapaPayment);

/**
 * @route   POST /api/payments/validate
 * @desc    Validate payment details
 * @access  Private
 * 
 * Frontend: checkout.js → Validate payment
 * Body: { method, phone }
 */
router.post('/validate', protect, validatePayment);

/**
 * @route   GET /api/payments/my
 * @desc    Get user's payment history
 * @access  Private
 * 

 * Frontend: profile.js → Payment history
 */
router.get('/my', protect, getMyPayments);

/**
 * @route   GET /api/payments/order/:orderId
 * @desc    Get payment by order ID
 * @access  Private
 * 
 * Frontend: order-status.js → Show payment details
 */
router.get('/order/:orderId', protect, getPaymentByOrder);

// ============================================================
//  ADMIN ROUTES
// ============================================================

/**
 * @route   GET /api/payments
 * @desc    Get all payments
 * @access  Private/Admin
 * 
 * Frontend: admin/payments.html → Load all payments
 */

router.get('/', protect, authorize('admin'), getAllPayments);

/**
 * @route   GET /api/payments/stats
 * @desc    Get payment statistics
 * @access  Private/Admin
 * 
 * Frontend: admin/payments.html → Metrics
 */
router.get('/stats', protect, authorize('admin'), getPaymentStats);

module.exports = router;

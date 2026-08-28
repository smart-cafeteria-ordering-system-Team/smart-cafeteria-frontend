const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
} = require('../controllers/admin.order.controller');

// All routes require admin role
router.use(protect);
router.use(authorize('admin', 'ADMIN'));

/**
 * @route   GET /api/v1/admin/orders
 * @desc    Get all orders (search / filter / sort / paginate)
 * Query: search, status, paymentStatus, orderType, date, from, to, sort, page, limit
 */
router.get('/', getAllOrders);

/**
 * @route   GET /api/v1/admin/orders/stats
 * @desc    Order statistics for metric cards
 */
router.get('/stats', getOrderStats);

/**
 * @route   GET /api/v1/admin/orders/:id
 * @desc    Get single order with customer + payment details
 */
router.get('/:id', getOrderById);

/**
 * @route   PATCH /api/v1/admin/orders/:id/status
 * @desc    Update order status (respects flow: PENDING->PREPARING->READY->SERVED->COMPLETED)
 * Body: { status: 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' }
 */
router.patch('/:id/status', updateOrderStatus);

/**
 * @route   PATCH /api/v1/admin/orders/:id/cancel
 * @desc    Cancel order (allowed while PENDING or PREPARING)
 * Body: { reason, adminNote }
 */
router.patch('/:id/cancel', cancelOrder);

module.exports = router;
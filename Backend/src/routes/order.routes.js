const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createOrder,

    getAllOrders,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getOrderStats,
    getKitchenOrders
} = require('../controllers/order.controller');

// ============================================================
//  PUBLIC / KITCHEN ROUTES (require auth)
// =============================

===============================

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 * 
 * Frontend: checkout.js → Place Order
 * Body: { items, customerName, customerPhone, orderType, tableNumber, paymentMethod }
 */
router.post('/', protect, createOrder);

/**
 * @route   GET /api/orders/

myorders
 * @desc    Get user's orders
 * @access  Private
 * 
 * Frontend: order-history.js → Load user orders
 */
router.get('/myorders', protect, getMyOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 * 
 * Frontend: order-status.js → Load order details
 */

router.get('/:id', protect, getOrderById);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 * 
 * Frontend: order-status.js → Cancel Order
 * Body: { reason }
 */
router.patch('/:id/cancel', protect, cancelOrder);

// =============================

===============================
//  ADMIN ROUTES
// ============================================================

/**
 * @route   GET /api/orders
 * @desc    Get all orders
 * @access  Private/Admin
 * 
 * Frontend: admin/orders.html → Load all orders
 * Query Params: status, paymentStatus, date
 */

router.get('/', protect, authorize('admin'), getAllOrders);

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics
 * @access  Private/Admin
 * 
 * Frontend: admin/dashboard.html → Metrics
 */
router.get('/stats', protect, authorize('admin'), getOrderStats);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status

 * @access  Private/Admin/Kitchen
 * 
 * Frontend: kitchen/dashboard.html → Update status
 * Body: { status }
 */
router.patch('/:id/status', protect, authorize('admin', 'kitchen'), updateOrderStatus);

/**
 * @route   GET /api/orders/kitchen
 * @desc    Get kitchen orders
 * @access  Private/Kitchen
 * 
 * Frontend: kitchen/dashboard.html → Live orders
 */

router.get('/kitchen', protect, authorize('kitchen'), getKitchenOrders);

module.exports = router;

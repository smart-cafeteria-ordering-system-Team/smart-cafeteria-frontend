const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getKitchenDashboard,
    getKitchenOrders,
    acceptOrder,
    markOrderReady,
    markOrderServed,
    rejectOrder,
    getKitchenStats
} = require('../controllers/kitchen.controller');

// 

//  ALL ROUTES REQUIRE KITCHEN ROLE
// ============================================================
router.use(protect);
router.use(authorize('kitchen'));

/**
 * @route   GET /api/kitchen/dashboard
 * @desc    Get kitchen dashboard data
 * @access  Private/Kitchen

 * 
 * Frontend: kitchen/dashboard.html → Load dashboard
 */
router.get('/dashboard', getKitchenDashboard);

/**
 * @route   GET /api/kitchen/orders
 * @desc    Get kitchen orders
 * @access  Private/Kitchen
 * 
 * Frontend: kitchen/orders.html → Load orders list
 * Query Params: status
 */
router.get('/orders', getKitchenOrders);


/**
 * @route   GET /api/kitchen/stats
 * @desc    Get kitchen stats
 * @access  Private/Kitchen
 * 
 * Frontend: kitchen/dashboard.html → Live stats update
 */
router.get('/stats', getKitchenStats);

/**
 * @route   PATCH /api/kitchen/orders/:orderId/accept
 * @desc    Accept order
 * @access  Private/Kitchen
 * 
 * Frontend: kitchen/dashboard.html 

→ Accept order
 */
router.patch('/orders/:orderId/accept', acceptOrder);

/**
 * @route   PATCH /api/kitchen/orders/:orderId/ready
 * @desc    Mark order as ready
 * @access  Private/Kitchen
 * 
 * Frontend: kitchen/dashboard.html → Mark ready
 */
router.patch('/orders/:orderId/ready', markOrderReady);

/**

 * @route   PATCH /api/kitchen/orders/:orderId/serve
 * @desc    Mark order as served
 * @access  Private/Kitchen
 * 
 * Frontend: kitchen/dashboard.html → Mark served
 */
router.patch('/orders/:orderId/serve', markOrderServed);

/**
 * @route   PATCH /api/kitchen/orders/:orderId/reject
 * @desc    Reject/cancel order
 * @access  Private/Kitchen
 * 
 * Frontend: kitchen/dashboard.html 

→ Reject order
 * Body: { reason }
 */
router.patch('/orders/:orderId/reject', rejectOrder);

module.exports = router;

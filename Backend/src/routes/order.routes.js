const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation.middleware');
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
const { validateCreateOrder, validateUpdateOrderStatus, validateCancelOrder } = require('../validators/order.validator');

router.post('/', protect, validateBody(validateCreateOrder), createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/cancel', protect, validateBody(validateCancelOrder), cancelOrder);

router.get('/', protect, authorize('admin'), getAllOrders);
router.get('/stats', protect, authorize('admin'), getOrderStats);
router.patch('/:id/status', protect, authorize('admin', 'kitchen'), validateBody(validateUpdateOrderStatus), updateOrderStatus);
router.get('/kitchen', protect, authorize('kitchen'), getKitchenOrders);

module.exports = router;
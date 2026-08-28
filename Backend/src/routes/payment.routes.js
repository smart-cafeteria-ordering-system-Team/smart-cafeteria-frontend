const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation.middleware');
const {
    initializeChapaPayment,
    chapaCallback,
    verifyChapaPayment
} = require('../controllers/chapa.controller');
const { initializeTelebirrPayment, telebirrCallback } = require('../controllers/provider-payment.controller');
const {
    simulatePayment,
    getPaymentByOrder,
    getAllPayments,
    getMyPayments,
    getPaymentStats,
    validatePayment
} = require('../controllers/payment.controller');
const { validatePaymentInput, validatePaymentVerification, validateAdminPaymentFilter } = require('../validators/payment.validator');

router.post('/simulate', protect, validateBody(validatePaymentInput), simulatePayment);
router.post('/validate', protect, validateBody(validatePaymentVerification), validatePayment);
router.get('/my', protect, getMyPayments);
router.get('/order/:orderId', protect, getPaymentByOrder);

router.get('/stats', protect, authorize('admin'), getPaymentStats);
router.get('/', protect, authorize('admin'), validateBody(validateAdminPaymentFilter), getAllPayments);

router.post('/chapa/initialize', protect, initializeChapaPayment);
router.post('/chapa/callback', chapaCallback);
router.get('/chapa/callback', chapaCallback);
router.get('/chapa/verify/:txRef', protect, verifyChapaPayment);
router.post('/telebirr/initialize', protect, initializeTelebirrPayment);
router.post('/telebirr/callback', telebirrCallback);
router.get('/telebirr/callback', telebirrCallback);

module.exports = router;
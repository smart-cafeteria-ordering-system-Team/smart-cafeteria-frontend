const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation.middleware');
const {
    getDailyOrdersReport,
    getSalesReport,
    getPopularItemsReport,
    getPaymentsReport,
    getAllReports,
    getReportById,
    deleteReport
} = require('../controllers/report.controller');
const { validateReportQuery } = require('../validators/report.validator');

router.use(protect);
router.use(authorize('admin'));

router.get('/daily', validateBody(validateReportQuery), getDailyOrdersReport);
router.get('/sales', validateBody(validateReportQuery), getSalesReport);
router.get('/popular', validateBody(validateReportQuery), getPopularItemsReport);
router.get('/payments', validateBody(validateReportQuery), getPaymentsReport);
router.get('/', getAllReports);
router.get('/:id', getReportById);
router.delete('/:id', deleteReport);

module.exports = router;
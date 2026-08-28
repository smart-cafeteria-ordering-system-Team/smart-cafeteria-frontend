const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation.middleware');
const {
    submitFeedback,
    getMyFeedback,
    getAllFeedback,
    replyToFeedback,
    deleteFeedback,
    getFeedbackStats
} = require('../controllers/feedback.controller');
const { validateFeedbackInput } = require('../validators/feedback.validator');

router.post('/', protect, validateBody(validateFeedbackInput), submitFeedback);
router.get('/my', protect, getMyFeedback);

router.get('/', protect, authorize('admin'), getAllFeedback);
router.get('/stats', protect, authorize('admin'), getFeedbackStats);
router.patch('/:id/reply', protect, authorize('admin'), replyToFeedback);
router.delete('/:id', protect, authorize('admin'), deleteFeedback);

module.exports = router;
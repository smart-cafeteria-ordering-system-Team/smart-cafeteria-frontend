const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    submitFeedback,
    getMyFeedback,
    getAllFeedback,
    replyToFeedback,
    deleteFeedback,
    getFeedbackStats
} = require('../controllers/

feedback.controller');

// ============================================================
//  PRIVATE ROUTES (Customer)
// ============================================================

/**
 * @route   POST /api/feedback
 * @desc    Submit feedback
 * @access  Private
 * 
 * Frontend: feedback.html → 

Submit feedback
 * Body: { orderId, rating, comment, category, dishName }
 */
router.post('/', protect, submitFeedback);

/**
 * @route   GET /api/feedback/my
 * @desc    Get user's feedback
 * @access  Private
 * 
 * Frontend: feedback.html → Show user's past feedback
 */
router.get('/my', protect, getMyFeedback);

// ============================================================
//  ADMIN ROUTES
// ============================================================

/**
 * @route   GET /api/feedback
 * @desc    Get all feedback
 * @access  Private/Admin
 * 
 * Frontend: admin/feedback.html → Load all feedback
 * Query Params: status, rating, date

 */
router.get('/', protect, authorize('admin'), getAllFeedback);

/**
 * @route   GET /api/feedback/stats
 * @desc    Get feedback statistics
 * @access  Private/Admin
 * 
 * Frontend: admin/feedback.html → Metrics
 */
router.get('/stats', protect, authorize('admin'), getFeedbackStats);

/**
 * @route   PATCH /api/feedback/:id/

reply
 * @desc    Reply to feedback
 * @access  Private/Admin
 * 
 * Frontend: admin/feedback.html → Reply to feedback
 * Body: { reply }
 */
router.patch('/:id/reply', protect, authorize('admin'), replyToFeedback);

/**
 * @route   DELETE /api/feedback/:id
 * @desc    Delete feedback
 * @access  Private/Admin
 * 
 * Frontend: admin/feedback.html → 

Delete feedback
 */
router.delete('/:id', protect, authorize('admin'), deleteFeedback);

module.exports = router;

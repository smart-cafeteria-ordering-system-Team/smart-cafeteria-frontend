const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification
} = require('../controllers/notification.controller');

// ============================================================
//  ALL ROUTES REQUIRE AUTHENTICATION
// ============================================================
router.use(protect);

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 * @access  Private
 * Query Params: unread (true/false)
 */
router.get('/', getNotifications);

/**
 * @route   GET /api/notifications/unread
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread', getUnreadCount);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/read-all', markAllRead);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:id/read', markAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', deleteNotification);

module.exports = router;

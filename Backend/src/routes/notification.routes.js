const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllRead,
    deleteNotification,
    clearNotifications
} = require('../controllers/notification.controller');

// ============================================================
//  ALL ROUTES REQUIRE AUTHENTICATION
// ============================================================
router.use(protect);

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 * @access  Private

 * 
 * Frontend: notifications.html → Load notifications
 * Query Params: unread (true/false)
 */
router.get('/', getNotifications);

/**
 * @route   GET /api/notifications/unread
 * @desc    Get unread notification count
 * @access  Private
 * 
 * Frontend: navbar.js → Show badge count
 */
router.get('/unread', 

getUnreadCount);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 * 
 * Frontend: notifications.html → Mark all as read
 */
router.patch('/read-all', markAllRead);
router.put('/read-all', markAllRead);
router.delete('/clear-all', clearNotifications);

/**
 * @route   PATCH /api/notifications/:id/read

 * @desc    Mark notification as read
 * @access  Private
 * 
 * Frontend: notifications.html → Mark as read
 */
router.patch('/:id/read', markAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 * 
 * Frontend: notifications.html → Delete notification
 */

router.delete('/:id', deleteNotification);

module.exports = router;

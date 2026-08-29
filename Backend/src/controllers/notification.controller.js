const Notification = require('../models/Notification');
const { MESSAGES, HTTP_STATUS } = require('../config/constants');

/**
* @desc    Get user's notifications
* @route   GET /api/notifications
* @access  Private
*
* Frontend: notifications.html → Load notifications
* Query Params: unread (true/false)
* Response: { success, count, notifications: [...] }

*/
exports.getNotifications = async (req, res) => {
try {
const { unread } = req.query;

let filter = { userId: req.user.id };
if (unread === 'true') filter.isRead = false;

const notifications = await Notification.find(filter)
.sort({ createdAt: -1 });

res.status(HTTP_STATUS.OK).json({
success: true,
count: notifications.length,

notifications: notifications.map(notif => ({
id: notif._id,
title: notif.title,
message: notif.message,
type: notif.type,
orderId: notif.orderId,
link: notif.link,
isRead: notif.isRead,
createdAt: notif.createdAt,
timeAgo: getTimeAgo(notif.createdAt)
}))
});

} catch (error) {
console.error('❌ Get Notifications Error:', error);

res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Get unread notification count
* @route   GET /api/notifications/unread
* @access  Private
*
* Frontend: navbar.js → Show

badge count
* Response: { success, count }
*/
exports.getUnreadCount = async (req, res) => {
try {
const count = await Notification.countDocuments({
userId: req.user.id,
isRead: false
});

res.status(HTTP_STATUS.OK).json({
success: true,
count: count
});

} catch (error) {
console.error('❌ Get Unread Count Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Mark notification as read
* @route   PATCH /api/notifications/:id/read
* @access  Private

*
* Frontend: notifications.html → Mark as read
* Response: { success, message }
*/
exports.markAsRead = async (req, res) => {
try {
const notification = await Notification.findOne({
_id: req.params.id,
userId: req.user.id
});

if (!notification) {
return res.status(HTTP_STATUS.NOT_FOUND).json({

success: false,
error: 'Notification not found'
});
}

await notification.markAsRead();

res.status(HTTP_STATUS.OK).json({
success: true,
message: 'Notification marked as read'
});

} catch (error) {
console.error('❌ Mark As Read Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Mark all notifications as read
* @route   PATCH /api/notifications/read-all
* @access  Private
*

* Frontend: notifications.html → Mark all as read
* Response: { success, message, count }
*/
exports.markAllRead = async (req, res) => {
try {
const result = await Notification.updateMany(
{ userId: req.user.id, isRead: false },
{ isRead: true, readAt: new Date() }
);

res.status(HTTP_STATUS.OK).json({

success: true,
message: 'All notifications marked as read',
count: result.modifiedCount
});

} catch (error) {
console.error('❌ Mark All Read Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};


/**
* @desc    Delete notification
* @route   DELETE /api/notifications/:id
* @access  Private
*
* Frontend: notifications.html → Delete notification
* Response: { success, message }
*/
exports.deleteNotification = async (req, res) => {
try {
const notification = await Notification.findOne({
_id: req.params.id,
userId: req.user.id

});

if (!notification) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Notification not found'
});
}

await notification.deleteOne();

res.status(HTTP_STATUS.OK).json({
success: true,
message: 'Notification deleted'
});

} catch (error) {
console.error('❌ Delete Notification Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Create notification

(Internal use)
* @route   POST /api/notifications
* @access  Private/Admin
*
* Internal function for creating notifications
*/
exports.createNotification = async (userId, title, message, type = 'system', orderId = null, link = null) => {
try {
const notification = await Notification.create({
userId,
title,
message,
type,

orderId,
link,
isRead: false,
createdAt: new Date()
});

return notification;
} catch (error) {
console.error('❌ Create Notification Error:', error);
return null;
}
};

/**
* Helper: Get time ago string
*/
function getTimeAgo(date) {

const now = new Date();
const diffMs = now - new Date(date);
const diffMins = Math.floor(diffMs / 60000);
const diffHours = Math.floor(diffMs / 3600000);
const diffDays = Math.floor(diffMs / 86400000);

if (diffMins < 1) return 'Just now';
if (diffMins < 60) return `${diffMins} mins ago`;
if (diffHours < 24) return `${diffHours} hours ago`;
return `${diffDays} days ago`;
}

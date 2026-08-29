const Notification = require("../models/Notification");

const sendNotification = async (
    userId,
    title,
    message,
    type = 'INFO',
    orderId = null
) => {
    const notification = await Notification.create({
        userId,
        orderId,
        title: title.trim(),
        message: message.trim(),
        type,
        isRead: false
    });

    return notification;
};


const getUserNotifications = async (userId) => {
    return await Notification.find({ userId })
        .sort({ createdAt: -1 });
};


const markNotificationAsRead = async (
    notificationId,
    userId
) => {
    const notification = await Notification.findOne({
        _id: notificationId,
        userId
    });

    if (!notification) {
        const error = new Error('Notification not found');
        error.statusCode = 404;
        throw error;
    }

    notification.isRead = true;

    await notification.save();

    return notification;
};


const markAllNotificationsAsRead = async (userId) => {
    await Notification.updateMany(
        {
            userId,
            isRead: false
        },
        {
            $set: {
                isRead: true
            }
        }
    );

    return true;
};
module.exports = { sendNotification, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead };

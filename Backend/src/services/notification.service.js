const notifications = [];

export const sendNotification = async (userId, title, message, type = 'INFO') => {
    const notification = {
        id: `notif_${Date.now()}`,
        userId,
        title,
        message,
        type, // 'INFO', 'SUCCESS', 'WARNING'
        isRead: false,
        createdAt: new Date()
    };

    notifications.push(notification);
    return notification;
};

export const getUserNotifications = async (userId) => {
    return notifications.filter(n => n.userId === userId);
};
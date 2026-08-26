import { logger } from '../utils/logger.js';

export const registerNotificationHandlers = (io, socket) => {
    // User registers their personal notification channel upon login
    socket.on('notification:subscribe', (userId) => {
        socket.join(`user_${userId}`);
        logger.info(`Socket ${socket.id} subscribed to notifications for user_${userId}`);
    });

    // Broadcast direct notification alert to a specific user
    socket.on('notification:send', (payload) => {
        const { targetUserId, title, message, type } = payload;
        io.to(`user_${targetUserId}`).emit('notification:received', {
            title,
            message,
            type: type || 'INFO',
            timestamp: new Date()
        });
    });
};
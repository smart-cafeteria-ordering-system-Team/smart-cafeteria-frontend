import { logger } from '../utils/logger.js';

export const registerNotificationHandlers = (io, socket) => {
    const userRoom = `user:${socket.user.id}`;

    // Automatically subscribe authenticated user
    socket.join(userRoom);

    logger.info('User joined notification room', {
        socketId: socket.id,
        userId: socket.user.id,
        room: userRoom
    });
};
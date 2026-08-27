import { logger } from '../utils/logger.js';

export const registerOrderHandlers = (io, socket) => {

    // Customer joins their order room to receive real-time updates
    socket.on('order:join', (orderId) => {
        if (!orderId) {
            return;
        }

        const room = `order:${orderId}`;

        socket.join(room);

        logger.info('Socket joined order room', {
            socketId: socket.id,
            userId: socket.user?.id,
            orderId,
            room
        });
    });

    // Customer leaves the order room
    socket.on('order:leave', (orderId) => {
        if (!orderId) {
            return;
        }

        const room = `order:${orderId}`;

        socket.leave(room);

        logger.info('Socket left order room', {
            socketId: socket.id,
            userId: socket.user?.id,
            orderId
        });
    });
};
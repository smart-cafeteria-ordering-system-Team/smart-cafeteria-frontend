import { logger } from '../utils/logger.js';

export const registerOrderHandlers = (io, socket) => {
    // Join a specific order room to listen for status changes
    socket.on('order:join', (orderId) => {
        socket.join(`order_${orderId}`);
        logger.info(`Socket ${socket.id} joined room order_${orderId}`);
    });

    // Leave an order room
    socket.on('order:leave', (orderId) => {
        socket.leave(`order_${orderId}`);
        logger.info(`Socket ${socket.id} left room order_${orderId}`);
    });

    // Kitchen staff broadcasts updated order status to customer
    socket.on('order:status_update', (data) => {
        const { orderId, status } = data;
        io.to(`order_${orderId}`).emit('order:status_changed', {
            orderId,
            status,
            updatedAt: new Date()
        });
        logger.info(`Broadcasted status '${status}' for order ${orderId}`);
    });
};
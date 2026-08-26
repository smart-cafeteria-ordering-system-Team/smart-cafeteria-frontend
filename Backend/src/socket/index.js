import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
import { initSocket } from '../utils/socket.js';
import { registerOrderHandlers } from './order.socket.js';
import { registerNotificationHandlers } from './notification.socket.js';

export const setupSocketIO = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    // Save global socket instance in utils
    initSocket(io);

    io.on('connection', (socket) => {
        logger.info(`New client connected: ${socket.id}`);

        // Register feature handlers
        registerOrderHandlers(io, socket);
        registerNotificationHandlers(io, socket);

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};
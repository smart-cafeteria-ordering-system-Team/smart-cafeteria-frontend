// socket/index.js

import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
import { initSocket } from '../utils/socket.js';
import { registerOrderHandlers } from './order.socket.js';
import { registerNotificationHandlers } from './notification.socket.js';

export const setupSocketIO = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            methods: ['GET', 'POST']
        }
    });

    // Store Socket.io instance
    initSocket(io);

    io.on('connection', (socket) => {
        logger.info('Socket client connected', {
            socketId: socket.id,
            userId: socket.user?.id,
            role: socket.user?.role
        });

        registerOrderHandlers(io, socket);
        registerNotificationHandlers(io, socket);

        socket.on('disconnect', (reason) => {
            logger.info('Socket client disconnected', {
                socketId: socket.id,
                reason
            });
        });
    });

    return io;
};
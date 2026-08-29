// socket/index.js

const { Server } = require("socket.io");
const { logger } = require("../utils/logger");
const { initSocket } = require("../utils/socket");
const { registerOrderHandlers } = require("./order.socket");
const { registerNotificationHandlers } = require("./notification.socket");

const setupSocketIO = (server) => {
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
module.exports = { setupSocketIO };

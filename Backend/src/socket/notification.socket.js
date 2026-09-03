const { logger } = require("../utils/logger");

const registerNotificationHandlers = (io, socket) => {
    // Support both auth-middleware-based auto-join and explicit joinUserRoom
    if (socket.user && socket.user.id) {
        const userRoom = `user:${socket.user.id}`;
        socket.join(userRoom);
        logger.info('User auto-joined notification room', {
            socketId: socket.id,
            userId: socket.user.id,
            room: userRoom
        });
    }
};

module.exports = { registerNotificationHandlers };

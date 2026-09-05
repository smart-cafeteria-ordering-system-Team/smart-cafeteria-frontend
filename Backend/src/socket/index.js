// socket/index.js

const { Server } = require("socket.io");
const { logger } = require("../utils/logger");
const { initSocket } = require("../utils/socket");
const { registerOrderHandlers } = require("./order.socket");
const { registerNotificationHandlers } = require("./notification.socket");

const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Store Socket.io instance globally for use in controllers
  initSocket(io);

  io.on("connection", (socket) => {
    logger.info("Socket client connected", {
      socketId: socket.id,
    });

    // Customer joins their user-specific notification room
    socket.on("joinUserRoom", (userId) => {
      if (!userId) return;
      const room = `user_${userId}`;
      socket.join(room);
      socket.userId = userId;
      logger.info("User joined notification room", {
        socketId: socket.id,
        userId,
        room,
      });
    });

    // Customer joins a specific order room
    registerOrderHandlers(io, socket);

    // Auto-join notification room if socket carries user info
    registerNotificationHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      logger.info("Socket client disconnected", {
        socketId: socket.id,
        reason,
      });
    });
  });

  return io;
};

module.exports = { setupSocketIO };

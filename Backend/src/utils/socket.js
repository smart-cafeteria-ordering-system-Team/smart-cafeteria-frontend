import { logger } from './logger.js';

let ioInstance = null;

// Attach Socket.io server instance globally
export const initSocket = (io) => {
    ioInstance = io;
    logger.info('Socket utility initialized');
};

// Emits an event to a specific room or to all connected clients
export const emitSocketEvent = (room, eventName, payload) => {
    if (!ioInstance) {
        logger.warn('Socket.io instance not initialized, skipping broadcast');
        return false;
    }

    if (room) {
        ioInstance.to(room).emit(eventName, payload);
    } else {
        ioInstance.emit(eventName, payload);
    }
    
    return true;
};
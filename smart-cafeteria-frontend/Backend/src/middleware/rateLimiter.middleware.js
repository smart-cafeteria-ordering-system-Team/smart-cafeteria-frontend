// middleware/rateLimiter.middleware.js

const requestCounts = new Map();

/**
 * Simple in-memory rate limiter.
 *
 * @param {Object} options
 * @param {number} options.windowMs
 * @param {number} options.maxRequests
 */
export const rateLimiter = ({
    windowMs = 15 * 60 * 1000,
    maxRequests = 100
} = {}) => {
    return (req, res, next) => {
        const clientIp = req.ip || 'unknown';

        const currentTime = Date.now();

        let timestamps = requestCounts.get(clientIp) || [];

        // Remove expired timestamps
        timestamps = timestamps.filter(
            timestamp => currentTime - timestamp < windowMs
        );

        // Request limit reached
        if (timestamps.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.'
            });
        }

        // Record current request
        timestamps.push(currentTime);

        requestCounts.set(clientIp, timestamps);

        next();
    };
};
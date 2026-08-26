const requestCounts = new Map(); // Stores IP request timestamps

export const rateLimiter = (options = { windowMs: 15 * 60 * 1000, maxRequests: 100 }) => {
    return (req, res, next) => {
        const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown_ip';
        const currentTime = Date.now();

        if (!requestCounts.has(clientIp)) {
            requestCounts.set(clientIp, []);
        }

        const timestamps = requestCounts.get(clientIp);
        
        // Filter out timestamps outside the current window
        const validTimestamps = timestamps.filter(time => currentTime - time < options.windowMs);

        if (validTimestamps.length >= options.maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests from this IP, please try again later.'
            });
        }

        validTimestamps.push(currentTime);
        requestCounts.set(clientIp, validTimestamps);
        next();
    };
};
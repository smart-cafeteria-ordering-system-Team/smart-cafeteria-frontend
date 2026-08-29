// middleware/auth.middleware.js

const jwt = require("jsonwebtoken");

/**
 * Authenticate user using JWT access token.
 *
 * Expected header:
 * Authorization: Bearer <token>
 */
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // No Authorization header
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Check Bearer format
        const [scheme, token] = authHeader.split(' ');

        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization format'
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Attach authenticated user information to request
        req.user = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role
        };

        next();

    } catch (error) {

        // Token expired
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access token expired'
            });
        }

        // Invalid token
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                success: false,
                message: 'Invalid access token'
            });
        }

        // Unexpected error
        console.error('Authentication middleware error:', error);

        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};
module.exports = { authenticateToken };

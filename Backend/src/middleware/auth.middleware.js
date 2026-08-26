export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    // Mock token verification (Replace with jwt.verify if using jsonwebtoken)
    if (token === 'mock-jwt-token') {
        req.user = { id: 'u1', name: 'Kidus Birhanu', role: 'customer' };
        return next();
    }

    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
};
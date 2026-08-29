const jwt = require('jsonwebtoken');

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const protect = (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_cafeteria_super_secret_change_this_in_production_2026');

    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role || 'customer',
    };

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid access token',
      });
    }

    console.error('Authentication middleware error:', error);

    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have permission to access this resource',
    });
  }

  return next();
};

module.exports = {
  protect,
  authorize,
};

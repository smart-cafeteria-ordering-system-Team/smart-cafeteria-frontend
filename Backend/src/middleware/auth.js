const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  const allowed = (roles || []).map((role) => String(role).toLowerCase());
  const userRole = String(req.user?.role || '').toLowerCase();

  if (!userRole || !allowed.includes(userRole)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  return next();
};

module.exports = { protect, authorize };

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const path = require('path');
const mongoose = require('mongoose');

const { MONGODB_URI } = require('./src/config/env');
const connectDatabase = require('./src/config/database');
const paymentRoutes = require('./src/routes/payment.routes');
const orderRoutes = require('./src/routes/order.routes');
const kitchenRoutes = require('./src/routes/kitchen.routes');
const userRoutes = require('./src/routes/user.routes');
const menuRoutes = require('./src/routes/menu.routes');
const categoryRoutes = require('./src/routes/category.routes');
const reportRoutes = require('./src/routes/report.routes');
const feedbackRoutes = require('./src/routes/feedback.routes');
const cancellationRoutes = require('./src/routes/cancellation.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const adminRoutes = require('./src/routes/admin.routes');
const adminMenuRoutes = require('./src/routes/admin.menu.routes');
const adminOrderRoutes = require('./src/routes/admin.order.routes');
const adminPaymentRoutes = require('./src/routes/admin.payments.routes');
const adminReportRoutes = require('./src/routes/admin.reports.routes');
const publicSettingsRoutes = require('./src/routes/public.settings.routes');
const { ensureDefaultSettings } = require('./src/utils/settings');
const chapaController = require('./src/controllers/chapa.controller');
const authController = require('./src/controllers/auth-v2.controller');
const authProfileController = require('./src/controllers/auth.controller');
const { protect } = require('./src/middleware/auth');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { setupSocketIO } = require('./src/socket/index');

const app = express();
const port = Number(process.env.PORT || 5000);

// 1. Secure HTTP Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. Strict CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
  : ['http://localhost:3000', 'http://127.0.0.1:5500'];

const isProductionMode = process.env.NODE_ENV === 'production';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. Postman, curl, mobile apps)
      if (!origin) {
        console.log('[CORS] ✓ Allowed: Non-browser request (no origin header)');
        callback(null, true);
        return;
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        console.log(`[CORS] ✓ Allowed: "${origin}" (in allowed origins list)`);
        callback(null, true);
        return;
      }

      // In development, allow any localhost or 127.0.0.1 regardless of port
      if (!isProductionMode) {
        try {
          const url = new URL(origin);
          const hostname = url.hostname;
          
          if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
            console.log(`[CORS] ✓ Allowed: "${origin}" (localhost in development)`);
            callback(null, true);
            return;
          }
        } catch (err) {
          // Invalid URL, will be rejected below
        }
      }

      // Reject the request
      console.error(`[CORS] ✗ Blocked: "${origin}" (not in allowed origins)`);
      callback(new Error(`CORS restriction: Origin "${origin}" not allowed`));
    },
    credentials: true,
  })
);

// 3. Rate Limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Chapa Webhook Raw Body Parser (Preserved BEFORE express.json)
app.post(
  '/api/v1/payments/webhooks/chapa',
  express.raw({ type: 'application/json', limit: '4mb' }),
  (req, res, next) => {
    try {
      req.rawBody = req.body;
      req.body = JSON.parse(req.body.toString('utf8') || '{}');
    } catch (err) {
      req.body = {};
    }
    next();
  },
  chapaController.chapaWebhook
);

// 5. Body Parsers with Controlled Limits (10kb prevents body-flooding attacks)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// 6. Custom Safe NoSQL Injection Sanitizer (req.body and req.params only)
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key in obj) {
    if (key.startsWith('$') || key.includes('.')) {
      console.log(`[Sanitizer] Removed dangerous key: ${key}`);
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  next();
});
app.use(hpp());

// Static Uploads Directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Fallback for nested backend path (e.g. when uploads live next to the repo root)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend public assets at the same absolute path the DB stores
// (e.g. /Frontend/public/assets/images/food/... ) so backend-absolute
// image URLs resolve for both seeded and admin-uploaded menu items.
app.use(
  '/Frontend/public',
  express.static(path.join(__dirname, '..', 'Frontend', 'public'))
);

// Health check endpoint
app.get('/health', (req, res) =>
  res.json({ success: true, service: 'smart-cafeteria-backend' })
);

// Global API Limiter
app.use('/api/v1', apiLimiter);

// Auth Routes
app.post('/api/v1/auth/register', authLimiter, authController.register);
app.post('/api/v1/auth/login', authLimiter, authController.login);
app.get('/api/v1/auth/me', protect, authController.getMe);
app.post('/api/v1/auth/logout', protect, authController.logout);
app.put('/api/v1/auth/me', protect, authProfileController.updateMe);
app.put('/api/v1/auth/password', protect, authProfileController.changePassword);
app.post('/api/v1/auth/reset-password', authProfileController.resetPassword);

// Feature Routes
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/kitchen', kitchenRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin/users', userRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/cancellations', cancellationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/menu', adminMenuRoutes);
app.use('/api/v1/admin/orders', adminOrderRoutes);
app.use('/api/v1/admin/payments', adminPaymentRoutes);
app.use('/api/v1/admin/reports', adminReportRoutes);
app.use('/api/v1/settings', publicSettingsRoutes);

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  try {
    console.log('[Server] Connecting to MongoDB...');
    await connectDatabase();
    console.log('[Server] Database connection established.');
  } catch (error) {
    console.error(
      '[Server] Failed to connect to MongoDB. Please check your connection string and IP whitelist.'
    );
    console.error(error.message);
    process.exit(1);
  }

  try {
    await ensureDefaultSettings();
    console.log('[Server] Default settings initialized.');
  } catch (error) {
    console.warn('[Server] Warning: Could not initialize settings:', error.message);
  }

  // Create HTTP server and attach Socket.IO
  const server = http.createServer(app);
  const io = setupSocketIO(server);
  app.set('io', io);

  server.listen(port, () => {
    console.log(`✓ [Server] Backend listening on port ${port}`);
    console.log(`   Health check: http://localhost:${port}/health`);
    console.log(`   Socket.IO ready for real-time connections`);
  });
};

if (require.main === module) {
  start().catch((error) => {
    console.error('[Server] Fatal error during startup:', error.message);
    process.exit(1);
  });
}

module.exports = { app, start };
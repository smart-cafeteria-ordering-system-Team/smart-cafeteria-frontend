require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
const authController = require('./src/controllers/auth-v2.controller');
const { protect } = require('./src/middleware/auth');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
}));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: false }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => res.json({ success: true, service: 'smart-cafeteria-backend' }));

app.use('/api/v1', apiLimiter);

app.post('/api/v1/auth/register', authLimiter, authController.register);
app.post('/api/v1/auth/login', authLimiter, authController.login);
app.get('/api/v1/auth/me', protect, authController.getMe);
app.post('/api/v1/auth/logout', protect, authController.logout);

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

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    await connectDatabase();
    await ensureDefaultSettings();
    app.listen(port, () => console.log(`Backend listening on port ${port}`));
};

if (require.main === module) {
    start().catch((error) => {
        console.error('Backend startup failed:', error.message);
        process.exitCode = 1;
    });
}

module.exports = { app, start };
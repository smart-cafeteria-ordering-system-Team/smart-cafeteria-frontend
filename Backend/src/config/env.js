require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://smartcafeteria_admin:Cafe%402026%21Secure@cluster0.4ic56qt.mongodb.net/smart_cafeteria?retryWrites=true&w=majority&appName=Cluster0',
  JWT_SECRET: process.env.JWT_SECRET || 'smart_cafeteria_super_secret_change_this_in_production_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5500',
  BACKEND_URL: process.env.BACKEND_URL || process.env.PUBLIC_BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`,
  APP_NAME: process.env.APP_NAME || 'Smart Cafeteria Ordering System',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CHAPA_SECRET_KEY: process.env.CHAPA_SECRET_KEY || '',
  CHAPA_WEBHOOK_SECRET: process.env.CHAPA_WEBHOOK_SECRET || '',
  CHAPA_CALLBACK_URL: process.env.CHAPA_CALLBACK_URL || 'http://localhost:5000/api/v1/payments/webhooks/chapa',
  CHAPA_RETURN_URL: process.env.CHAPA_RETURN_URL || 'http://localhost:5500/Frontend/src/pages/customer/order-tracking.html',
};

// Log on startup to verify MONGODB_URI is loaded
if (!env.MONGODB_URI) {
  console.warn('[Env] Warning: MONGODB_URI is not set. Database connection will fail.');
}

module.exports = env;

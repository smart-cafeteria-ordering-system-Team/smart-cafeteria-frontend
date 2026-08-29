require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  MONGODB_URI:
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/smart_cafeteria',
  JWT_SECRET: process.env.JWT_SECRET || 'smart_cafeteria_super_secret_change_this_in_production_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5500',
  APP_NAME: process.env.APP_NAME || 'Smart Cafeteria Ordering System',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

module.exports = env;

require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const port = Number(process.env.PORT || 5000);

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction,
  PORT: port,
  // Secrets must ALWAYS come from the environment / Render secret fields.
  // No hardcoded production values are used as fallbacks.
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI || undefined,
  JWT_SECRET: process.env.JWT_SECRET || undefined,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || "7d",
  // Non-secret defaults are fine locally, but production must provide real URLs.
  FRONTEND_URL:
    process.env.FRONTEND_URL || (isProduction ? undefined : "http://localhost:5500"),
  BACKEND_URL:
    process.env.BACKEND_URL ||
    process.env.PUBLIC_BACKEND_URL ||
    (isProduction ? undefined : `http://localhost:${port}`),
  APP_NAME: process.env.APP_NAME || "Smart Cafeteria Ordering System",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  CHAPA_SECRET_KEY: process.env.CHAPA_SECRET_KEY || "",
  CHAPA_PUBLIC_KEY: process.env.CHAPA_PUBLIC_KEY || "",
  CHAPA_WEBHOOK_SECRET: process.env.CHAPA_WEBHOOK_SECRET || "",
  CHAPA_CALLBACK_URL:
    process.env.CHAPA_CALLBACK_URL ||
    (isProduction
      ? undefined
      : "http://localhost:5000/api/v1/payments/webhooks/chapa"),
  CHAPA_RETURN_URL:
    process.env.CHAPA_RETURN_URL ||
    (isProduction
      ? undefined
      : "http://localhost:5500/Frontend/src/pages/customer/order-tracking.html"),
};

// Log on startup to verify MONGODB_URI is loaded
if (!env.MONGODB_URI) {
  console.warn(
    "[Env] Warning: MONGODB_URI is not set. Database connection will fail.",
  );
}

/**
 * Fail clearly when critical production configuration is missing.
 * Never lets the server silently start with a localhost or empty fallback.
 */
function validateEnv() {
  const missing = [];

  if (!env.MONGODB_URI) {
    missing.push(
      "MONGODB_URI (set to your MongoDB Atlas connection string on Render)",
    );
  }

  if (!env.JWT_SECRET) {
    missing.push("JWT_SECRET (set a strong random value on Render)");
  }

  if (env.isProduction) {
    if (!process.env.CORS_ORIGIN && !env.FRONTEND_URL) {
      missing.push(
        "FRONTEND_URL or CORS_ORIGIN (the deployed frontend origin that may call this API)",
      );
    }
    if (!env.BACKEND_URL) {
      missing.push(
        "BACKEND_URL (the public https URL of this backend, e.g. https://your-app.onrender.com)",
      );
    }
  }

  if (missing.length > 0) {
    throw new Error(
      "[Env] Missing required configuration:\n  - " + missing.join("\n  - "),
    );
  }
}

module.exports = env;
module.exports.validateEnv = validateEnv;
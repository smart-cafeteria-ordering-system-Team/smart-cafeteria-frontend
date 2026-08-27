<<<<<<< HEAD
const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
=======
<<<<<<< HEAD
/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM
 * SERVER ENTRY POINT
 * File: backend/server.js
 * ================================================================
 */

require("dotenv").config();

const http = require("http");
const mongoose = require("mongoose");

const app = require("./app");

/**
 * ------------------------------------------------
 * ENVIRONMENT VARIABLES
 * ------------------------------------------------
 */

const PORT = Number(process.env.PORT) || 5000;

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/smart_cafeteria";

/**
 * ------------------------------------------------
 * SERVER
 * ------------------------------------------------
 */

let server;

/**
 * ------------------------------------------------
 * DATABASE CONNECTION
 * ------------------------------------------------
 */

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("================================================");
    console.log("MongoDB connected successfully");
    console.log(`Database: ${mongoose.connection.name}`);
    console.log("================================================");
  } catch (error) {
    console.error("================================================");
    console.error("MongoDB connection failed");
    console.error(error.message);
    console.error("================================================");

    process.exit(1);
  }
}

/**
 * ------------------------------------------------
 * START SERVER
 * ------------------------------------------------
 */

async function startServer() {
  await connectDatabase();

  server = http.createServer(app);

  server.listen(PORT, () => {
    console.log("");
    console.log("================================================");
    console.log(" SMART CAFETERIA ORDERING SYSTEM");
    console.log(" BACKEND SERVER");
    console.log("================================================");
    console.log(`Environment : ${process.env.NODE_ENV || "development"}`);
    console.log(`Port        : ${PORT}`);
    console.log(`API         : http://localhost:${PORT}/api`);
    console.log(`Health      : http://localhost:${PORT}/api/health`);
    console.log("================================================");
    console.log("");
  });
}

/**
 * ------------------------------------------------
 * UNHANDLED ERRORS
 * ------------------------------------------------
 */

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Promise Rejection:");
  console.error(error);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:");
  console.error(error);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

/**
 * ------------------------------------------------
 * GRACEFUL SHUTDOWN
 * ------------------------------------------------
 */

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down server...`);

  if (server) {
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
        console.log("Server stopped.");
        process.exit(0);
      } catch (error) {
        console.error("Shutdown error:", error);
        process.exit(1);
      }
    });
  } else {
    await mongoose.connection.close();
    process.exit(0);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

/**
 * ------------------------------------------------
 * START APPLICATION
 * ------------------------------------------------
 */

startServer();
=======
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err));

app.get('/', (req, res) => {
  res.send('Smart Cafeteria API is running');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
>>>>>>> c9275e6e95495801102644943b7daafcf9e40368
>>>>>>> c5f9e0ff7ba8f512b6233b62b7c7421911f0c320

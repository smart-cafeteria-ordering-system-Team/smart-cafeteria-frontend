require("dotenv").config();

const http = require("http");
const mongoose = require("mongoose");

const app = require("./app");
const { MONGODB_URI } = require("./src/config/env");

const DEFAULT_PORT = Number(process.env.PORT || 5000);
let server;

async function connectDatabase() {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
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

function startServer(port = DEFAULT_PORT, attemptsLeft = 10) {
  if (!server) {
    server = http.createServer(app);
  }

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Retrying on port ${nextPort}...`);
      process.env.PORT = String(nextPort);
      server.removeAllListeners("error");
      server.close(() => {
        server = null;
        startServer(nextPort, attemptsLeft - 1);
      });
      return;
    }

    console.error("Server failed to start:", error);
    process.exit(1);
  });

  server.listen(port, () => {
    process.env.PORT = String(port);
    console.log("");
    console.log("================================================");
    console.log(" SMART CAFETERIA ORDERING SYSTEM");
    console.log(" BACKEND SERVER");
    console.log("================================================");
    console.log(`Environment : ${process.env.NODE_ENV || "development"}`);
    console.log(`Port        : ${port}`);
    console.log(`API         : http://localhost:${port}/api`);
    console.log(`Health      : http://localhost:${port}/api/health`);
    console.log("================================================");
    console.log("");
  });
}

async function initializeServer() {
  await connectDatabase();
  startServer();
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Promise Rejection:");
  console.error(error);

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:");
  console.error(error);

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

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

initializeServer();

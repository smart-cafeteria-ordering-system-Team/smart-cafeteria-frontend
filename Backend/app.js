const express = require("express");
const cors = require("cors");

const {
  authRoutes,
  userRoutes,
  menuRoutes,
  categoryRoutes,
  cartRoutes,
  orderRoutes,
  paymentRoutes,
  notificationRoutes,
  reportRoutes,
  feedbackRoutes,
  cancellationRoutes,
  kitchenRoutes,
} = require("./src/routes");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Cafeteria Ordering System API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/cancellations", cancellationRoutes);
app.use("/api/kitchen", kitchenRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled app error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;

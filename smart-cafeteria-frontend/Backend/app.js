const express = require("express");
const cors = require("cors");

const app = express();

// ===============================
// Middleware
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// Test Route
// ===============================
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Smart Cafeteria Ordering System API is running"
    });
});

// ===============================
// Export App
// ===============================
module.exports = app;
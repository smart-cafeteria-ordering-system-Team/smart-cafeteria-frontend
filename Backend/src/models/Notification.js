const mongoose = require("mongoose");

/**
 * Notification Schema - User notifications
 *
 * Frontend Usage:
 * - notifications.html: Display user notifications
 * - active-order.js: Show order status updates
 */
const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["order", "promo", "system", "status_update", "ready"],
      default: "system",
    },
    orderId: {
      type: String,
      default: null,
    },
    link: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Mark as read
NotificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model("Notification", NotificationSchema);

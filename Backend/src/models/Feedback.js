const mongoose = require("mongoose");

/**
 * Feedback Schema - Customer feedback on orders
 *
 * Frontend Usage:
 * - customer/feedback.html: Submit & view feedback
 * - admin/feedback.html: List, reply, archive feedback
 */
const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "Food Quality",
    },
    dishName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "RESOLVED", "ARCHIVED"],
      default: "PENDING",
    },
    reply: {
      type: String,
      default: "",
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Feedback", FeedbackSchema);

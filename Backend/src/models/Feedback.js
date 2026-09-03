const mongoose = require('mongoose');

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
      ref: 'User',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    topic: {
      type: String,
      default: 'General',
    },
    category: {
      type: String,
      default: 'General',
    },
    dishName: {
      type: String,
      default: '',
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reply: {
      type: String,
      default: '',
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Feedback', FeedbackSchema);

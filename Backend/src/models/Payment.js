const mongoose = require("mongoose");

/**
 * Payment Schema - Track payments
 *
 * Frontend Usage:
 * - checkout.js: Chapa checkout
 * - admin/payments.html: View all payments
 */
const PaymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    provider: {
      type: String,
      enum: ["TELEBIRR", "CHAPA"],
      required: true,
    },
    method: {
      type: String,
      enum: ["TELEBIRR", "CHAPA"],
      required: true,
    },
    currency: {
      type: String,
      default: "ETB",
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      default: "",
    },
    reference: {
      type: String,
      default: "",
    },
    chapaReference: {
      type: String,
      unique: true,
      sparse: true,
    },
    checkoutUrl: {
      type: String,
      default: "",
    },
    providerReference: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Generate transaction ID before saving
PaymentSchema.pre("save", function (next) {
  if (!this.transactionId) {
    const prefix = this.provider.toUpperCase();
    this.transactionId = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
  next();
});

PaymentSchema.index({ status: 1 });
PaymentSchema.index({ method: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ reference: 1 });
PaymentSchema.index({ providerReference: 1 });
PaymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model("Payment", PaymentSchema);

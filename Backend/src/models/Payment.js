const mongoose = require("mongoose");

/**
 * Payment Schema - Track payments
 *
 * Frontend Usage:
 * - checkout.js: Simulate payment (CBE Birr, TeleBirr, Cash)
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
    method: {
      type: String,
      enum: ["cbe_birr", "telebirr", "cash", "CBE Birr", "Telebirr", "Cash"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "simulated", "failed", "paid", "completed"],
      default: "pending",
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
PaymentSchema.pre("save", function () {
  if (!this.transactionId) {
    const methodValue = this.method || "payment";
    const prefix = String(methodValue).toUpperCase().replace(/\s+/g, "_");
    this.transactionId = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
});

module.exports = mongoose.model("Payment", PaymentSchema);

const mongoose = require("mongoose");

/**
 * Payment Schema - Track payments
 *
 * Frontend Usage:
 * - checkout.js: Simulate payment (CBE Birr, TeleBirr, Cash)
 * - checkout.js / order-tracking: Chapa online payment (Phase 7)
 * - admin/payments.html: View all payments
 *
 * Provider fields (added for Phase 7 Chapa integration):
 * - provider    : normalized gateway id (chapa | telebirr | ...)
 * - chapaReference : our tx_ref sent to Chapa
 * - providerReference : provider/our reference for the tx
 * - checkoutUrl : Chapa-hosted checkout page URL (redirect target)
 * - currency    : ETB
 * - paidAt      : when the provider confirmed payment
 * - metadata    : extra data (customer, order info for webhook reconciliation)
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
      enum: ["cbe_birr", "telebirr", "cash", "CBE Birr", "Telebirr", "Cash", "chapa", "Chapa"],
      default: "cash",
    },
    provider: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "simulated", "failed", "paid", "completed", "cancelled"],
      default: "pending",
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    chapaReference: {
      type: String,
      default: "",
    },
    providerReference: {
      type: String,
      default: "",
    },
    checkoutUrl: {
      type: String,
      default: "",
    },
    currency: {
      type: String,
      default: "ETB",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    phone: {
      type: String,
      default: "",
    },
    reference: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
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
PaymentSchema.pre("save", function () {
  if (!this.transactionId) {
    const methodValue = this.method || "payment";
    const prefix = String(methodValue).toUpperCase().replace(/\s+/g, "_");
    this.transactionId = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
});

module.exports = mongoose.model("Payment", PaymentSchema);

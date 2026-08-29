const mongoose = require("mongoose");

/**
 * Order Schema - Matches Frontend Requirements
 *
 * Frontend Usage:
 * - checkout.js: Place order with items, customer info, payment
 * - order-status.js: Track order status (Pending → Preparing → Ready → Served)
 * - order-history.js: View past orders
 * - admin/orders.html: Manage all orders
 */
const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
    },
    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
    },
    orderType: {
      type: String,
      enum: ["dine-in", "takeaway"],
      default: "dine-in",
    },
    tableNumber: {
      type: String,
      default: "N/A",
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        notes: {
          type: String,
          default: "",
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    serviceFee: {
      type: Number,
      default: 20,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "preparing",
        "ready",
        "served",
        "cancelled",
        "Received",
        "Completed",
        "completed",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cbe_birr", "telebirr", "cash", "CBE Birr", "Telebirr", "Cash"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "simulated", "failed", "paid", "completed"],
      default: "pending",
    },
    transactionId: {
      type: String,
      default: null,
    },
    orderDate: {
      type: String,
      default: () => new Date().toLocaleString(),
    },
    orderTime: {
      type: Date,
      default: Date.now,
    },
    readyTime: {
      type: Date,
      default: null,
    },
    completedTime: {
      type: Date,
      default: null,
    },
    cancellationRequested: {
      type: Boolean,
      default: false,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    cancellationDetails: {
      type: String,
      default: "",
    },
    cancellationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: null,
    },
    cancellationRequestedAt: {
      type: Date,
      default: null,
    },
    cancellationProcessedAt: {
      type: Date,
      default: null,
    },
    cancellationProcessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancellationAdminNote: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Generate orderId before saving
OrderSchema.pre("save", async function () {
  if (!this.orderId) {
    const count = await mongoose.model("Order").countDocuments();
    const num = String(count + 1000).padStart(4, "0");
    this.orderId = `ET-${num}`;
  }
});

// Get order summary
OrderSchema.methods.getSummary = function () {
  return {
    orderId: this.orderId,
    customerName: this.customerName,
    customerPhone: this.customerPhone,
    orderType: this.orderType,
    tableNumber: this.tableNumber,
    items: this.items,
    subtotal: this.subtotal,
    serviceFee: this.serviceFee,
    totalAmount: this.totalAmount,
    status: this.status,
    paymentMethod: this.paymentMethod,
    paymentStatus: this.paymentStatus,
    orderDate: this.orderDate,
    orderTime: this.orderTime,
  };
};

module.exports = mongoose.model("Order", OrderSchema);

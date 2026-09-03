const mongoose = require("mongoose");

// Normalize a legacy / human-readable status into a Phase-4 orderStatus value.
// 'served' / 'Completed' / 'Received' are legacy values mapped onto the new enum.
const STATUS_TO_ORDER_STATUS = {
  pending: "pending",
  preparing: "preparing",
  ready: "ready",
  served: "completed",
  received: "pending",
  completed: "completed",
  cancelled: "cancelled",
};

function normalizeOrderStatus(value) {
  const key = String(value || "pending").toLowerCase();
  return STATUS_TO_ORDER_STATUS[key] || key;
}

/**
 * Order Schema - Matches Frontend Requirements
 *
 * Phase 4 (Cart + Orders database integration) adds the canonical fields:
 * - `user`          (ObjectId -> User)   mirrors legacy `userId`
 * - `orderNumber`   (unique string)      mirrors legacy `orderId`
 * - `orderStatus`   (new status enum)    mirrors legacy `status`
 * - `items[].foodItem` / `items[].title` mirrors `items[].itemId` / `items[].name`
 *
 * Legacy fields are kept so existing admin/kitchen/payment/cancellation
 * controllers keep working untouched.
 */
const OrderSchema = new mongoose.Schema(
  {
    // ----- Phase 4 canonical identifiers -----
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    orderNumber: {
      type: String,
      unique: true,
      default: null,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
    // ----- Legacy identifiers (kept for backward compatibility) -----
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
        foodItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          default: null,
        },
        title: {
          type: String,
          default: "",
        },
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
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "simulated", "failed", "paid", "completed", "unpaid"],
      default: "unpaid",
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
    preparingTime: {
      type: Date,
      default: null,
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

// Generate a unique timestamp-based order code (used by pre-validate and pre-save).
function ensureOrderIdentifiers(doc) {
  if (!doc.orderId) {
    // Timestamp-based code: unique, avoids the count-based collision risk
    // of the legacy ET-1001-style scheme against seeded orders.
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
    doc.orderId = `ET-${ts.slice(-6)}${rand}`;
  }
  if (!doc.orderNumber) doc.orderNumber = doc.orderId;
}

// Keep canonical Phase-4 fields in sync before validation runs.
OrderSchema.pre("validate", function () {
  ensureOrderIdentifiers(this);
  if (!this.user && this.userId) this.user = this.userId;
  if (!this.userId && this.user) this.userId = this.user;
  if (!this.orderStatus && this.status) this.orderStatus = normalizeOrderStatus(this.status);
  if (!this.orderNumber && this.orderId) this.orderNumber = this.orderId;

  if (Array.isArray(this.items)) {
    this.items.forEach((item) => {
      if (!item.foodItem && item.itemId) item.foodItem = item.itemId;
      if (!item.itemId && item.foodItem) item.itemId = item.foodItem;
      if (!item.title && item.name) item.title = item.name;
      if (!item.name && item.title) item.name = item.title;
    });
  }
});

// Regenerate identifiers if missing and sync aliases before saving.
OrderSchema.pre("save", function () {
  ensureOrderIdentifiers(this);

  this.orderStatus = normalizeOrderStatus(this.status || this.orderStatus || "pending");

  if (!this.user && this.userId) this.user = this.userId;
  if (!this.userId && this.user) this.userId = this.user;

  if (Array.isArray(this.items)) {
    this.items.forEach((item) => {
      if (!item.foodItem && item.itemId) item.foodItem = item.itemId;
      if (!item.itemId && item.foodItem) item.itemId = item.foodItem;
      if (!item.title && item.name) item.title = item.name;
      if (!item.name && item.title) item.name = item.title;
    });
  }
});

// Get order summary
OrderSchema.methods.getSummary = function () {
  return {
    id: this._id,
    orderId: this.orderId,
    orderNumber: this.orderNumber || this.orderId,
    customerName: this.customerName,
    customerPhone: this.customerPhone,
    orderType: this.orderType,
    tableNumber: this.tableNumber,
    items: this.items,
    subtotal: this.subtotal,
    serviceFee: this.serviceFee,
    totalAmount: this.totalAmount,
    status: this.orderStatus || this.status,
    orderStatus: this.orderStatus || normalizeOrderStatus(this.status),
    paymentMethod: this.paymentMethod,
    paymentStatus: this.paymentStatus,
    orderDate: this.orderDate,
    orderTime: this.orderTime,
    preparingTime: this.preparingTime,
  };
};

module.exports = mongoose.model("Order", OrderSchema);
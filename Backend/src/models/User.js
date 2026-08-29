const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Schema - Matches Frontend Requirements
 *
 * Frontend Usage:
 * - login.html: identifier (email or phone)
 * - register.html: name, email, phone, password
 * - users.js (Admin): role, balance, status
 * - profile.js: name, phone, email, avatar
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    fullName: {
      type: String,
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [50, "Full name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [
        /^(09|07)[0-9]{8}$/,
        "Please provide a valid Ethiopian phone number (09XXXXXXXX or 07XXXXXXXX)",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "kitchen", "admin", "STAFF", "STUDENT", "ADMIN"],
      default: "customer",
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCKED", "active", "blocked"],
      default: "ACTIVE",
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.pre("validate", async function () {
  if (!this.name && this.fullName) {
    this.name = this.fullName;
  }
  if (!this.fullName && this.name) {
    this.fullName = this.name;
  }
  if (!this.name && !this.fullName) {
    throw new Error("User name or fullName is required");
  }
});

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Update updatedAt on save
UserSchema.pre("findOneAndUpdate", async function () {
  this.set({ updatedAt: new Date() });
});

// Match password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get user profile without sensitive data
UserSchema.methods.getPublicProfile = function () {
  const displayName = this.name || this.fullName || "User";
  return {
    id: this._id,
    name: displayName,
    fullName: this.fullName || this.name || displayName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    balance: this.balance,
    status: this.status,
    avatar: this.avatar,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", UserSchema);

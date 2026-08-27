const mongoose = require("mongoose");

/**
 * Category Schema - For menu categorization
 *
 * Frontend Usage:
 * - menu.html: Category filter buttons
 * - categories.html (Admin): Manage categories
 */
const CategorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      en: {
        type: String,
        required: true,
      },
      am: {
        type: String,
        required: true,
      },
    },
    icon: {
      type: String,
      default: "🍽️",
    },
    description: {
      en: { type: String, default: "" },
      am: { type: String, default: "" },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Get localized category name
CategorySchema.methods.getLocalizedName = function (lang = "en") {
  return this.name[lang] || this.name.en || this.id;
};

module.exports = mongoose.model("Category", CategorySchema);

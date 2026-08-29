const mongoose = require("mongoose");

/**
 * MenuItem Schema - Matches Frontend Requirements
 *
 * Frontend Usage:
 * - menu.html: Display all food items with name, price, image, category
 * - food-details.html: Show detailed view of single item
 * - menu.js (Admin): Add/Edit/Delete menu items
 */
const MenuItemSchema = new mongoose.Schema(
  {
    name: {
      en: {
        type: String,
        required: [true, "English name is required"],
        trim: true,
      },
      am: {
        type: String,
        required: [true, "Amharic name is required"],
        trim: true,
      },
    },
    category: {
      type: String,
      enum: [
        "breakfast",
        "mains",
        "main-meals",
        "fasting",
        "beverages",
        "drinks",
        "snacks",
        "Lunch",
        "Dinner",
        "Drinks",
      ],
      required: [true, "Category is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    description: {
      en: {
        type: String,
        default: "",
      },
      am: {
        type: String,
        default: "",
      },
    },
    icon: {
      type: String,
      default: "🍽️",
    },
    image: {
      type: String,
      default: null,
    },
    preparationTime: {
      type: Number,
      default: 10,
      min: 1,
    },
    availability: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Get menu item with language support
MenuItemSchema.methods.getLocalized = function (lang = "en") {
  return {
    id: this._id,
    name: this.name[lang] || this.name.en,
    category: this.category,
    price: this.price,
    description: this.description[lang] || this.description.en || "",
    icon: this.icon,
    image: this.image,
    preparationTime: this.preparationTime,
    availability: this.availability || this.isAvailable,
  };
};

module.exports = mongoose.model("MenuItem", MenuItemSchema);

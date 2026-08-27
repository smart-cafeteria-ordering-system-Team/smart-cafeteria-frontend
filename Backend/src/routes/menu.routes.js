const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getAllMenuItems,
  getMenuItemById,
  getMenuItemsByCategory,
  getFeaturedItems,
  getRelatedItems,
  createMenuItem,
  updateMenuItem,

  deleteMenuItem,
  toggleAvailability,
  getMenuStats,
} = require("../controllers/menu.controller");

// ============================================================
//  PUBLIC ROUTES
// ============================================================

/**
 * @route   GET /api/menu

 * @desc    Get all menu items
 * @access  Public
 * 
 * Frontend: menu.html → Load all food items
 * Query Params: category, search, sort, available, limit, page
 */
router.get("/", getAllMenuItems);

/**
 * @route   GET /api/menu/featured
 * @desc    Get featured items
 * @access  Public
 * 
 * Frontend: index.html → Popular Menu Items
 * Query Params: limit

 */
router.get("/featured", getFeaturedItems);

/**
 * @route   GET /api/menu/category/:category
 * @desc    Get items by category
 * @access  Public
 *
 * Frontend: menu.html → Category filter
 */
router.get("/category/:category", getMenuItemsByCategory);

/**
 * @route   GET /api/menu/:id

 * @desc    Get single menu item
 * @access  Public
 * 
 * Frontend: food-details.html → Load food details
 */
router.get("/:id", getMenuItemById);

/**
 * @route   GET /api/menu/:id/related
 * @desc    Get related items
 * @access  Public
 *
 * Frontend: food-details.html → You Might Also Like
 */
router.get(
  "/:id/related",

  getRelatedItems,
);

// ============================================================
//  ADMIN ROUTES (Require Authentication + Admin Role)
// ============================================================

/**
 * @route   POST /api/menu
 * @desc    Create new menu item
 * @access  Private/Admin
 * 

 * Frontend: admin/menu.js → Add New Item
 * Body: { name, category, price, description, image, preparationTime, available }
 */
router.post("/", protect, authorize("admin"), createMenuItem);

/**
 * @route   PUT /api/menu/:id
 * @desc    Update menu item
 * @access  Private/Admin
 * 
 * Frontend: admin/menu.js → Edit Item
 * Body: { name, category, price, description, image, preparationTime, 

available }
 */
router.put("/:id", protect, authorize("admin"), updateMenuItem);

/**
 * @route   DELETE /api/menu/:id
 * @desc    Delete menu item
 * @access  Private/Admin
 *
 * Frontend: admin/menu.js → deleteFoodItem(id)
 */
router.delete("/:id", protect, authorize("admin"), deleteMenuItem);

/**

 * @route   PATCH /api/menu/:id/availability
 * @desc    Toggle availability
 * @access  Private/Admin
 * 
 * Frontend: admin/menu.js → toggleAvailability(id)
 * Body: { available: true/false }
 */
router.patch(
  "/:id/availability",
  protect,
  authorize("admin"),
  toggleAvailability,
);

/**
 * @route   GET /api/menu/stats
 * @desc    Get menu statistics
 * @access  Private/Admin
 * 

 * Frontend: admin/menu.js → Metrics cards
 */
router.get("/stats", protect, authorize("admin"), getMenuStats);

module.exports = router;

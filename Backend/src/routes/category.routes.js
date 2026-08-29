const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} = require("../controllers/category.controller");

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

router.post("/", protect, authorize("admin"), createCategory);
router.put("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);
router.patch("/:id/status", protect, authorize("admin"), toggleCategoryStatus);

module.exports = router;

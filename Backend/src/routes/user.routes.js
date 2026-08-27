const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
} = require("../controllers/user.controller");

// ============================================================
//  ALL ROUTES REQUIRE ADMIN ROLE

// ============================================================
router.use(protect);
router.use(authorize("admin"));

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private/Admin
 *
 * Frontend: users.js → fetchUsersData()
 */
router.get("/", getAllUsers);

/**

 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private/Admin
 * 
 * Frontend: users.js → updateUserMetrics()
 */
router.get("/stats", getUserStats);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private/Admin
 * 
 * Frontend: users.js → handleUserFormSubmit (Add)
 * Body: { name, email, phone, role, balance }

 */
router.post("/", createUser);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user
 * @access  Private/Admin
 *
 * Frontend: users.js → editUser(id)
 */
router.get("/:id", getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private/Admin
 * 
 * Frontend: users.js → 

handleUserFormSubmit (Edit)
 * Body: { name, email, phone, role, balance }
 */
router.put("/:id", updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 *
 * Frontend: users.js → deleteUser(id)
 */
router.delete("/:id", deleteUser);

/**
 * @route   PATCH /api/users/:id/

status
 * @desc    Toggle user status (block/activate)
 * @access  Private/Admin
 * 
 * Frontend: users.js → toggleUserStatus(id, currentStatus)
 * Body: { status: 'ACTIVE' | 'BLOCKED' }
 */
router.patch("/:id/status", toggleUserStatus);

module.exports = router;

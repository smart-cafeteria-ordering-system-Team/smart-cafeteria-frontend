const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {

    register,
    login,
    getMe,
    updateMe,
    changePassword,
    resetPassword,
    logout
} = require('../controllers/auth.controller');

// ============================================================
//  PUBLIC ROUTES
// ============================================================

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 * 
 * Frontend: register.html
 * Body: { name, email, phone, password, confirmPassword }
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * 

 * Frontend: login.html
 * Body: { identifier, password }
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password
 * @access  Public
 * 
 * Frontend: login.html (Forgot password)
 * Body: { email }
 */
router.post('/reset-password', resetPassword);

// ============================================================
//  PRIVATE ROUTES (Require Authentication)
// ============================================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 * 
 * Frontend: profile.js → loadProfileData()

 */
router.get('/me', protect, getMe);

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 * 
 * Frontend: profile.js → profileForm submit
 * Body: { name, phone, email, avatar, language, diningType, tableNumber }
 */
router.put('/me', protect, updateMe);

/**

 * @route   PUT /api/auth/password
 * @desc    Change password
 * @access  Private
 * 
 * Frontend: profile.js → Change password
 * Body: { currentPassword, newPassword, confirmPassword }
 */
router.put('/password', protect, changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 * 
 * Frontend: profile.js → Logout 

button
 */
router.post('/logout', protect, logout);

module.exports = router;

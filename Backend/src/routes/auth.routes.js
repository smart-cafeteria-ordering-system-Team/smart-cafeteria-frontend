const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation.middleware');
const {
    register,
    login,
    getMe,
    updateMe,
    changePassword,
    resetPassword,
    logout
} = require('../controllers/auth.controller');
const { validateRegisterInput, validateLoginInput, validateUpdateProfileInput } = require('../validators/auth.validator');

router.post('/register', validateBody(validateRegisterInput), register);
router.post('/login', validateBody(validateLoginInput), login);
router.post('/reset-password', resetPassword);

router.get('/me', protect, getMe);
router.put('/me', protect, validateBody(validateUpdateProfileInput), updateMe);
router.put('/password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;
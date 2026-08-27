const User = require('../models/User');
const jwt = require('jsonwebtoken');




const { ROLES, MESSAGES, HTTP_STATUS } = require('../config/constants');

/**
* Generate JWT Token
*/
const generateToken = (id) => {
return jwt.sign({ id }, process.env.JWT_SECRET, {
expiresIn: process.env.JWT_EXPIRE || '30d'
});
};

/**
* @desc    Register new user
* @route   POST /api/auth/register

* @access  Public
*
* Frontend: register.html
* Expected Body: { name, email, phone, password, confirmPassword }
* Response: { success, token, user: { id, name, email, role, phone } }
*/
exports.register = async (req, res) => {
try {
const { name, email, phone, password, confirmPassword } = req.body;

// ✅ Validate required fields (matches register.html validation)

if (!name || !email || !phone || !password) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'All fields are required'
});
}

// ✅ Validate name (matches register.html)
if (name.length < 2) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Name must be at

least 2 characters'
});
}

// ✅ Validate email format (matches register.html regex)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Please enter a valid email address'
});
}

// ✅ Validate phone (matches register.html pattern: 09XXXXXXXX or 07XXXXXXXX)
const phoneRegex = /^(09|07)[0-9]{8}$/;
if (!phoneRegex.test(phone)) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Enter a valid phone number (09XXXXXXXX or 07XXXXXXXX)'
});
}

// ✅ Validate password (matches register.html: min 6

characters)
if (password.length < 6) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Password must be at least 6 characters'
});
}

// ✅ Check password confirmation (matches register.html)
if (password !== confirmPassword) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({

success: false,
error: 'Passwords do not match'
});
}

// ✅ Check if user exists (email or phone)
const existingUser = await User.findOne({
$or: [
{ email: email.toLowerCase() },
{ phone: phone }
]
});

if (existingUser) {

return res.status(HTTP_STATUS.CONFLICT).json({
success: false,
error: 'User with this email or phone already exists'
});
}

// ✅ Create user
const user = await User.create({
name: name.trim(),
email: email.toLowerCase(),
phone: phone,
password: password,
role: ROLES.CUSTOMER // Default role
});


// ✅ Generate token
const token = generateToken(user._id);

// ✅ Response matches frontend expectations
res.status(HTTP_STATUS.CREATED).json({
success: true,
token,
user: {
id: user._id,
name: user.name,
email: user.email,
phone: user.phone,
role: user.role,

avatar: user.avatar,
createdAt: user.createdAt
}
});

} catch (error) {
console.error('❌ Registration Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Login user
* @route   POST /api/auth/login
* @access  Public
*
* Frontend: login.html
* Expected Body: { identifier, password }
* Response: { success, token, user: { id, name, email, role, phone } }
*/
exports.login = async (req, res) => {
try {
const { identifier, password } = req.body;

// ✅ Validate input (matches login.html)

if (!identifier || !password) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Phone/Email and password are required'
});
}

// ✅ Check if identifier is email or phone
const isEmail = identifier.includes('@');
const query = isEmail
? { email: identifier.toLowerCase() }
: { phone: identifier };


// ✅ Find user
const user = await User.findOne(query).select('+password');

if (!user) {
return res.status(HTTP_STATUS.UNAUTHORIZED).json({
success: false,
error: 'Invalid credentials'
});
}

// ✅ Check if account is blocked
if (user.status === 'BLOCKED' ||

user.isActive === false) {
return res.status(HTTP_STATUS.FORBIDDEN).json({
success: false,
error: 'Account is blocked. Please contact admin.'
});
}

// ✅ Check password
const isMatch = await user.matchPassword(password);
if (!isMatch) {
return res.status(HTTP_STATUS.UNAUTHORIZED).json({
success: false,

error: 'Invalid credentials'
});
}

// ✅ Generate token
const token = generateToken(user._id);

// ✅ Response matches frontend expectations
// Frontend stores: isLoggedIn, userRole, userProfile
res.status(HTTP_STATUS.OK).json({
success: true,
token,
user: {
id: user._id,

name: user.name,
email: user.email,
phone: user.phone,
role: user.role,
avatar: user.avatar,
status: user.status,
balance: user.balance
}
});

} catch (error) {
console.error('❌ Login Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error:

MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Get current user profile
* @route   GET /api/auth/me
* @access  Private
*
* Frontend: profile.js
* Response: { success, user: { id, name, email, phone, role, avatar } }
*/
exports.getMe = async (req, res) => {
try {
const user = await User.findById(req.user.id).select('-

password');

if (!user) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'User not found'
});
}

res.status(HTTP_STATUS.OK).json({
success: true,
user: {
id: user._id,
name: user.name,
email: user.email,

phone: user.phone,
role: user.role,
avatar: user.avatar,
status: user.status,
balance: user.balance,
createdAt: user.createdAt
}
});

} catch (error) {
console.error('❌ Get Profile Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR

});
}
};

/**
* @desc    Update user profile
* @route   PUT /api/auth/me
* @access  Private
*
* Frontend: profile.js
* Expected Body: { name, phone, email, avatar, language, diningType, tableNumber }
* Response: { success, user }
*/
exports.updateMe = async (req, res) => {
try {

const { name, phone, email, avatar, language, diningType, tableNumber } = req.body;

const user = await User.findById(req.user.id);
if (!user) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'User not found'
});
}

// ✅ Update fields (matches profile.js form)
if (name) user.name =

name.trim();
if (phone) {
const phoneRegex = /^(09|07)[0-9]{8}$/;
if (!phoneRegex.test(phone)) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Enter a valid phone number (09XXXXXXXX or 07XXXXXXXX)'
});
}
user.phone = phone;
}
if (email) {
const emailRegex = /^[^\s@]

+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Please enter a valid email address'
});
}
user.email = email.toLowerCase();
}
if (avatar) user.avatar = avatar;

// ✅ Save preferences (profile.js stores these in localStorage)

// These are stored in frontend, not necessarily in DB
// But we can store them if needed
if (language) user.language = language;
if (diningType) user.diningType = diningType;
if (tableNumber) user.tableNumber = tableNumber;

await user.save();

res.status(HTTP_STATUS.OK).json({
success: true,
user: {
id: user._id,

name: user.name,
email: user.email,
phone: user.phone,
role: user.role,
avatar: user.avatar,
status: user.status,
balance: user.balance
}
});

} catch (error) {
console.error('❌ Update Profile Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error:

MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Change password
* @route   PUT /api/auth/password
* @access  Private
*
* Frontend: profile.js (password change section)
* Expected Body: { currentPassword, newPassword, confirmPassword }
* Response: { success, message }
*/
exports.changePassword = async

(req, res) => {
try {
const { currentPassword, newPassword, confirmPassword } = req.body;

// ✅ Validate input
if (!currentPassword || !newPassword) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Current password and new password are required'
});
}

if (newPassword.length < 6) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'New password must be at least 6 characters'
});
}

if (newPassword !== confirmPassword) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'New passwords do not match'

});
}

const user = await User.findById(req.user.id).select('+password');
if (!user) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'User not found'
});
}

// ✅ Check current password
const isMatch = await user.matchPassword(currentPasswo

rd);
if (!isMatch) {
return res.status(HTTP_STATUS.UNAUTHORIZED).json({
success: false,
error: 'Current password is incorrect'
});
}

// ✅ Update password
user.password = newPassword;
await user.save();

// ✅ Generate new token
const token = generateToken(user._id);


res.status(HTTP_STATUS.OK).json({
success: true,
token,
message: 'Password changed successfully'
});

} catch (error) {
console.error('❌ Change Password Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR

});
}
};

/**
* @desc    Reset password (forgot password)
* @route   POST /api/auth/reset-password
* @access  Public
*
* Frontend: login.html (Forgot password link)
* Expected Body: { email }
* Response: { success, message }
*/
exports.resetPassword = async (req, res) => {

try {
const { email } = req.body;

if (!email) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Email is required'
});
}

const user = await User.findOne({ email: email.toLowerCase() });
if (!user) {
return res.status(HTTP_STATUS.NOT_FOU

ND).json({
success: false,
error: 'No account found with this email'
});
}

// ✅ In production, send reset link via email
// For now, just return success

res.status(HTTP_STATUS.OK).json({
success: true,
message: 'Password reset link sent to your email'
});

} catch (error) {
console.error('❌ Reset Password Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Logout user
* @route   POST /api/auth/logout
* @access  Private
*

* Frontend: profile.js (Logout button)
* Response: { success, message }
*/
exports.logout = async (req, res) => {
try {
// ✅ Frontend handles localStorage cleanup
// Backend just acknowledges logout
res.status(HTTP_STATUS.OK).json({
success: true,
message: 'Logged out successfully'
});

} catch (error) {

console.error('❌ Logout Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

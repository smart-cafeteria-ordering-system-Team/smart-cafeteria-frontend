const User = require('../models/User');
const { ROLES, MESSAGES, HTTP_STATUS } = require('../config/constants');

/**
* @desc    Get all users (Admin only)
* @route   GET /api/users
* @access  Private/Admin

*
* Frontend: users.js → fetchUsersData()
* Response: { success, count, users: [...] }
*/
exports.getAllUsers = async (req, res) => {
try {
const users = await User.find()
.select('-password')
.sort({ createdAt: -1 });

res.status(HTTP_STATUS.OK).json({
success: true,
count: users.length,
users: users.map(user => ({

id: user._id,
name: user.name,
email: user.email,
phone: user.phone,
role: user.role,
balance: user.balance,
status: user.status,
avatar: user.avatar,
createdAt: user.createdAt
}))
});

} catch (error) {
console.error('❌ Get All Users Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({

success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Get single user by ID (Admin only)
* @route   GET /api/users/:id
* @access  Private/Admin
*
* Frontend: users.js → editUser(id)
* Response: { success, user }
*/
exports.getUserById = async (req, res) => {

try {
const user = await User.findById(req.params.id).select('-password');

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
balance: user.balance,
status: user.status,
avatar: user.avatar,
createdAt: user.createdAt
}
});

} catch (error) {
console.error('❌ Get User By ID Error:', error);
if (error.kind === 'ObjectId') {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'User not found'
});
}
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Create new user (Admin only)

* @route   POST /api/users
* @access  Private/Admin
*
* Frontend: users.js → handleUserFormSubmit (Add New User)
* Expected Body: { name, email, role, balance }
* Response: { success, user }
*/
exports.createUser = async (req, res) => {
try {
const { name, email, phone, role, balance, password } = req.body;

// ✅ Validate required fields (matches users.js modal)

if (!name || !email || !role) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Name, email, and role are required'
});
}

// ✅ Validate email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,

error: 'Please provide a valid email address'
});
}

// ✅ Password is required so the user can log in
if (!password || String(password).length < 6) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Password is required and must be at least 6 characters'
});
}

// ✅ Check if user exists
const existingUser = await User.findOne({ email: email.toLowerCase() });
if (existingUser) {
return res.status(HTTP_STATUS.CONFLICT).json({
success: false,
error: 'User with this email already exists'
});
}

const roleVal = String(role || '').toLowerCase();

// Kitchen / staff users never hold a wallet balance.
const isKitchenRole = roleVal === 'kitchen' || roleVal === 'staff' || roleVal === 'KITCHEN_STAFF' || roleVal === 'kitchen_staff';
const finalBalance = isKitchenRole ? 0 : (Number(balance) || 0);

const userData = {
name: name.trim(),
email: email.toLowerCase(),
password, // hashed by the User model's bcrypt pre-save hook
role: roleVal,
balance: finalBalance,
status: 'ACTIVE'
};

// Phone is optional (admin can create kitchen/staff users without one).
if (phone) {
userData.phone = String(phone).trim();
}

// ✅ Create user
const user = await User.create(userData);

res.status(HTTP_STATUS.CREATED).json({
success: true,

user: {
id: user._id,
name: user.name,
email: user.email,
phone: user.phone,
role: user.role,
balance: user.balance,
status: user.status,
avatar: user.avatar,
createdAt: user.createdAt
}
});

} catch (error) {
console.error('❌ Create User Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Update user (Admin only)
* @route   PUT /api/users/:id
* @access  Private/Admin
*
* Frontend: users.js → handleUserFormSubmit (Edit User)
* Expected Body: { name, email, role, balance }
* Response: { success, user }

*/
exports.updateUser = async (req, res) => {
try {
const { name, email, phone, role, balance } = req.body;

const user = await User.findById(req.params.id);
if (!user) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'User not found'
});
}

// ✅ Update fields (matches users.js edit modal)
if (name) user.name = name.trim();
if (email) {
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Please provide a valid email address'
});
}
user.email = email.toLowerCase();

}
if (phone) user.phone = phone;
if (role) user.role = role.toLowerCase();
if (balance !== undefined) user.balance = balance;

await user.save();

res.status(HTTP_STATUS.OK).json({
success: true,
user: {
id: user._id,
name: user.name,
email: user.email,
phone: user.phone,
role: user.role,

balance: user.balance,
status: user.status,
avatar: user.avatar
}
});

} catch (error) {
console.error('❌ Update User Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};


/**
* @desc    Delete user (Admin only)
* @route   DELETE /api/users/:id
* @access  Private/Admin
*
* Frontend: users.js → deleteUser(id)
* Response: { success, message }
*/
exports.deleteUser = async (req, res) => {
try {
const user = await User.findByIdAndDelete(req.params.id);

if (!user) {

return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'User not found'
});
}

res.status(HTTP_STATUS.OK).json({
success: true,
message: 'User deleted successfully'
});

} catch (error) {
console.error('❌ Delete User Error:', error);

res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Toggle user status (Block/Activate)
* @route   PATCH /api/users/:id/status
* @access  Private/Admin
*
* Frontend: users.js →

toggleUserStatus(id, currentStatus)
* Expected Body: { status: 'ACTIVE' | 'BLOCKED' }
* Response: { success, user }
*/
exports.toggleUserStatus = async (req, res) => {
try {
const { status } = req.body;

// ✅ Validate status (matches users.js)
const validStatuses = ['ACTIVE', 'BLOCKED'];
if (!status || !validStatuses.includes(status)) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Invalid status. Must be ACTIVE or BLOCKED'
});
}

const isActive = status === 'ACTIVE';
const user = await User.findByIdAndUpdate(
req.params.id,
{
status: status,
isActive: isActive
},
{ returnDocument: 'after' }
).select('-password');


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
balance: user.balance,
status: user.status,
isActive: user.isActive
}
});

} catch (error) {
console.error('❌ Toggle User Status Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}

};

/**
* @desc    Get user statistics (Admin only)
* @route   GET /api/users/stats
* @access  Private/Admin
*
* Frontend: users.js → updateUserMetrics()
* Response: { totalUsers, activeStudents, staffCount, blockedCount }
*/
exports.getUserStats = async (req, res) => {
try {
const totalUsers = await

User.countDocuments();
const activeStudents = await User.countDocuments({
role: { $in: ['customer', 'STUDENT'] },
status: 'ACTIVE',
isActive: true
});
const staffCount = await User.countDocuments({
role: { $in: ['kitchen', 'STAFF', 'admin', 'ADMIN'] }
});
const blockedCount = await User.countDocuments({
status: 'BLOCKED',
isActive: false
});


res.status(HTTP_STATUS.OK).json({
success: true,
stats: {
totalUsers,
activeStudents,
staffCount,
blockedCount
}
});

} catch (error) {
console.error('❌ Get User Stats Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({

success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

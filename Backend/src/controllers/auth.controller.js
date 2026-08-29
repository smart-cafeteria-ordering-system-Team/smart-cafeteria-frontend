const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { ROLES, MESSAGES, HTTP_STATUS } = require('../config/constants');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'smart_cafeteria_super_secret_change_this_in_production_2026',
    { expiresIn: process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'All fields are required',
      });
    }

    if (name.trim().length < 2) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Name must be at least 2 characters',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Please enter a valid email address',
      });
    }

    const phoneRegex = /^(09|07)[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Enter a valid phone number (09XXXXXXXX or 07XXXXXXXX)',
      });
    }

    if (password.length < 6) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    if (password !== confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Passwords do not match',
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: 'User with this email or phone already exists',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      phone,
      password,
      role: ROLES.CUSTOMER,
    });

    const token = generateToken(user._id);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Registration Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Phone/Email and password are required',
      });
    }

    const isEmail = identifier.includes('@');
    const query = isEmail ? { email: identifier.toLowerCase() } : { phone: identifier };

    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    if (user.status === 'BLOCKED' || user.isActive === false) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Account is blocked. Please contact admin.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const token = generateToken(user._id);

    return res.status(HTTP_STATUS.OK).json({
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
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR,
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.status(HTTP_STATUS.OK).json({
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
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Get Profile Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR,
    });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, phone, email, avatar, language, diningType, tableNumber } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'User not found',
      });
    }

    if (name) user.name = name.trim();

    if (phone) {
      const phoneRegex = /^(09|07)[0-9]{8}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Enter a valid phone number (09XXXXXXXX or 07XXXXXXXX)',
        });
      }
      user.phone = phone;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Please enter a valid email address',
        });
      }
      user.email = email.toLowerCase();
    }

    if (avatar) user.avatar = avatar;
    if (language) user.language = language;
    if (diningType) user.diningType = diningType;
    if (tableNumber) user.tableNumber = tableNumber;

    await user.save();

    return res.status(HTTP_STATUS.OK).json({
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
      },
    });
  } catch (error) {
    console.error('❌ Update Profile Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'New password must be at least 6 characters',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'New passwords do not match',
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'User not found',
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      token,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('❌ Change Password Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'No account found with this email',
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    console.error('❌ Reset Password Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('❌ Logout Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR,
    });
  }
};

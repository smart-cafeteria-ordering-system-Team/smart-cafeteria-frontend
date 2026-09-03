// services/auth.service.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const registerUser = async (userData) => {
    const email = userData.email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        const error = new Error('Email already registered');
        error.statusCode = 409;
        throw error;
    }

    // Model pre-save hook hashes the password. Never pre-hash here,
    // otherwise the password would be hashed twice and login would fail.
    // Public registration always creates a customer
    const newUser = await User.create({
        fullName: userData.fullName.trim(),
        email,
        phone: userData.phone?.trim(),
        password: userData.password,
        role: 'customer'
    });

    return {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        createdAt: newUser.createdAt
    };
};


const loginUser = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    // Find user (password is select:false on the schema; opt back in)
    const user = await User.findOne({
        email: normalizedEmail
    }).select('+password');

    if (!user) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    // Compare password with hashed password
    const passwordMatches = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatches) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    // Create JWT
    const token = jwt.sign(
        {
            id: user._id.toString(),
            name: user.fullName,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
    );

    return {
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role
        },
        token
    };
};
module.exports = { registerUser, loginUser };

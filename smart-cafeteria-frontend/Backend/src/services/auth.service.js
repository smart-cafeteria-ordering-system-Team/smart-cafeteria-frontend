// services/auth.service.js

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const registerUser = async (userData) => {
    const email = userData.email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        const error = new Error('Email already registered');
        error.statusCode = 409;
        throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Public registration always creates a customer
    const newUser = await User.create({
        fullName: userData.fullName.trim(),
        email,
        phone: userData.phone?.trim(),
        password: hashedPassword,
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


export const loginUser = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({
        email: normalizedEmail
    });

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
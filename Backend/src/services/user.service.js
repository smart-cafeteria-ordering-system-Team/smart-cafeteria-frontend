const User = require("../models/User");

const getUserById = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User profile not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};


const updateUserProfile = async (
    userId,
    updateData
) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User profile not found');
        error.statusCode = 404;
        throw error;
    }

    if (updateData.fullName !== undefined) {
        user.fullName = updateData.fullName.trim();
    }

    if (updateData.email !== undefined) {
        const email = updateData.email
            .trim()
            .toLowerCase();

        const existingUser = await User.findOne({
            email,
            _id: { $ne: userId }
        });

        if (existingUser) {
            const error = new Error(
                'Email is already in use'
            );
            error.statusCode = 409;
            throw error;
        }

        user.email = email;
    }

    if (updateData.phone !== undefined) {
        user.phone = updateData.phone.trim();
    }

    await user.save();

    return user;
};


const getAllUsers = async (roleFilter) => {
    const filter = {};

    if (roleFilter) {
        filter.role = roleFilter;
    }

    return await User.find(filter)
        .sort({ createdAt: -1 });
};
module.exports = { getUserById, updateUserProfile, getAllUsers };

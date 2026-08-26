// Mock user database collection
const users = [
    {
        id: 'usr_1',
        fullName: 'Kidus Birhanu',
        email: 'kidus@example.com',
        role: 'customer',
        createdAt: new Date('2026-01-15')
    }
];

// Fetch a single user profile by ID
export const getUserById = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
        throw { status: 404, message: 'User profile not found' };
    }
    
    // Omit sensitive data before returning
    const { password, ...userProfile } = user;
    return userProfile;
};

// Update existing user profile details
export const updateUserProfile = async (userId, updateData) => {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw { status: 404, message: 'User profile not found' };
    }

    const currentUser = users[userIndex];
    
    // Apply allowed updates
    const updatedUser = {
        ...currentUser,
        fullName: updateData.fullName || currentUser.fullName,
        email: updateData.email || currentUser.email,
        updatedAt: new Date()
    };

    users[userIndex] = updatedUser;
    
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
};

// Fetch all registered users (Admin only)
export const getAllUsers = async (roleFilter) => {
    let result = [...users];

    if (roleFilter) {
        result = result.filter(u => u.role === roleFilter);
    }

    return result.map(({ password, ...userProfile }) => userProfile);
};
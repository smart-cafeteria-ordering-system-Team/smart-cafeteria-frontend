import { validateRegisterInput } from '../validators/auth.validator.js';

// In-memory user store for backend testing
const users = [];

export const registerUser = async (userData) => {
    const validation = validateRegisterInput(userData);
    if (!validation.isValid) {
        throw { status: 400, message: 'Validation failed', errors: validation.errors };
    }

    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
        throw { status: 409, message: 'Email already registered' };
    }

    const newUser = {
        id: `usr_${Date.now()}`,
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password, // In production, hash this using bcrypt
        role: userData.role || 'customer',
        createdAt: new Date()
    };

    users.push(newUser);
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};

export const loginUser = async (email, password) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        throw { status: 401, message: 'Invalid email or password' };
    }

    const token = 'mock-jwt-token';
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
};
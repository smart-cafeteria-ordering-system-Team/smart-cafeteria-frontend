/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - AUTHENTICATION MODULE
 * ================================================================
 * Handles:
 * - Login
 * - Registration
 * - Logout
 * - Session management
 * - Profile update
 * - Password change
 * - Password reset
 * - Authentication listeners
 * ================================================================
 */

import { ROLES, MOCK_USERS, STORAGE_KEYS } from './config.js';
import { UserStorage, TokenStorage } from './utils/storage.js';
import {
    validateEmail,
    validatePassword,
    validateName,
    validatePhone
} from './utils/validators.js';
import { showToast } from './main.js';


// ================================================================
// 1. AUTH STATE
// ================================================================

let currentUser = null;
let authListeners = [];


// ================================================================
// 2. LOGIN
// ================================================================

/**
 * Login user with email or username.
 *
 * @param {string} identifier - Email or username
 * @param {string} password - Password
 * @returns {Promise<Object>} Login result
 */
export async function login(identifier, password) {
    try {
        // -----------------------------
        // Validate identifier
        // -----------------------------
        if (!identifier || identifier.trim() === '') {
            return {
                success: false,
                error: 'Email or username is required'
            };
        }

        // -----------------------------
        // Validate password
        // -----------------------------
        if (!password || password.trim() === '') {
            return {
                success: false,
                error: 'Password is required'
            };
        }

        const normalizedIdentifier = identifier.trim().toLowerCase();

        // -----------------------------
        // Find user
        // -----------------------------
        const user = MOCK_USERS.find((u) => {
            const email = String(u.email || '').toLowerCase();
            const name = String(u.name || '').toLowerCase();

            return (
                email === normalizedIdentifier ||
                name === normalizedIdentifier
            );
        });

        if (!user) {
            return {
                success: false,
                error: 'Invalid credentials'
            };
        }

        // -----------------------------
        // Check password
        // -----------------------------
        if (user.password !== password) {
            return {
                success: false,
                error: 'Invalid credentials'
            };
        }

        // -----------------------------
        // Remove password before storing
        // -----------------------------
        const { password: ignoredPassword, ...userWithoutPassword } = user;

        // -----------------------------
        // Save session
        // -----------------------------
        UserStorage.save(userWithoutPassword);

        TokenStorage.save(
            `mock-jwt-token-${Date.now()}`
        );

        currentUser = userWithoutPassword;

        // -----------------------------
        // Notify listeners
        // -----------------------------
        notifyAuthListeners(currentUser);

        // -----------------------------
        // Success message
        // -----------------------------
        showToast(
            `Welcome back, ${user.name}!`,
            'success'
        );

        return {
            success: true,
            user: userWithoutPassword
        };

    } catch (error) {
        console.error('Login error:', error);

        return {
            success: false,
            error: 'Login failed. Please try again.'
        };
    }
}


// ================================================================
// 3. REGISTER
// ================================================================

/**
 * Register a new user.
 *
 * @param {Object} userData
 * @returns {Promise<Object>} Registration result
 */
export async function register(userData = {}) {
    try {
        const {
            name,
            email,
            password,
            confirmPassword,
            phone = '',
            role = ROLES.CUSTOMER
        } = userData;

        // -----------------------------
        // Validate name
        // -----------------------------
        const nameValidation = validateName(name);

        if (!nameValidation.valid) {
            return {
                success: false,
                error: nameValidation.error
            };
        }

        // -----------------------------
        // Validate email
        // -----------------------------
        const emailValidation = validateEmail(email);

        if (!emailValidation.valid) {
            return {
                success: false,
                error: emailValidation.error
            };
        }

        // -----------------------------
        // Validate password
        // -----------------------------
        const passwordValidation = validatePassword(password);

        if (!passwordValidation.valid) {
            return {
                success: false,
                error: passwordValidation.error
            };
        }

        // -----------------------------
        // Confirm password
        // -----------------------------
        if (password !== confirmPassword) {
            return {
                success: false,
                error: 'Passwords do not match'
            };
        }

        // -----------------------------
        // Validate phone if provided
        // -----------------------------
        if (phone && String(phone).trim() !== '') {
            const phoneValidation = validatePhone(phone);

            if (!phoneValidation.valid) {
                return {
                    success: false,
                    error: phoneValidation.error
                };
            }
        }

        // -----------------------------
        // Normalize email
        // -----------------------------
        const normalizedEmail = email.trim().toLowerCase();

        // -----------------------------
        // Check existing email
        // -----------------------------
        const existingUser = MOCK_USERS.find(
            (u) =>
                String(u.email || '').toLowerCase() ===
                normalizedEmail
        );

        if (existingUser) {
            return {
                success: false,
                error: 'User with this email already exists'
            };
        }

        // -----------------------------
        // Check duplicate name
        // -----------------------------
        const normalizedName = name.trim().toLowerCase();

        const existingName = MOCK_USERS.find(
            (u) =>
                String(u.name || '').toLowerCase() ===
                normalizedName
        );

        if (existingName) {
            return {
                success: false,
                error: 'A user with this name already exists'
            };
        }

        // -----------------------------
        // Create user
        // -----------------------------
        const newUser = {
            id: `u${Date.now()}`,
            name: name.trim(),
            email: normalizedEmail,
            password,
            role,
            phone: phone ? String(phone).trim() : '',
            avatar: null,
            createdAt: new Date().toISOString()
        };

        // -----------------------------
        // Add to mock users
        // -----------------------------
        MOCK_USERS.push(newUser);

        // -----------------------------
        // Remove password
        // -----------------------------
        const {
            password: ignoredPassword,
            ...userWithoutPassword
        } = newUser;

        // -----------------------------
        // Auto login
        // -----------------------------
        UserStorage.save(userWithoutPassword);

        TokenStorage.save(
            `mock-jwt-token-${Date.now()}`
        );

        currentUser = userWithoutPassword;

        // -----------------------------
        // Notify listeners
        // -----------------------------
        notifyAuthListeners(currentUser);

        // -----------------------------
        // Success message
        // -----------------------------
        showToast(
            `Account created successfully! Welcome, ${name.trim()}!`,
            'success'
        );

        return {
            success: true,
            user: userWithoutPassword
        };

    } catch (error) {
        console.error('Registration error:', error);

        return {
            success: false,
            error: 'Registration failed. Please try again.'
        };
    }
}


// ================================================================
// 4. LOGOUT
// ================================================================

/**
 * Logout current user.
 *
 * @param {boolean} redirect - Redirect to home page
 */
export function logout(redirect = true) {
    try {
        // -----------------------------
        // Clear user session
        // -----------------------------
        UserStorage.clear();

        // -----------------------------
        // Clear token
        // -----------------------------
        TokenStorage.clear();

        // -----------------------------
        // Clear cart
        // -----------------------------
        if (STORAGE_KEYS?.cart) {
            localStorage.removeItem(STORAGE_KEYS.cart);
        }

        // -----------------------------
        // Clear notifications
        // -----------------------------
        if (STORAGE_KEYS?.notifications) {
            localStorage.removeItem(
                STORAGE_KEYS.notifications
            );
        }

        // -----------------------------
        // Clear current user
        // -----------------------------
        currentUser = null;

        // -----------------------------
        // Notify listeners
        // -----------------------------
        notifyAuthListeners(null);

        showToast(
            'Logged out successfully',
            'info'
        );

        // -----------------------------
        // Redirect
        // -----------------------------
        if (redirect) {
            window.location.href = '/index.html';
        }

        return true;

    } catch (error) {
        console.error('Logout error:', error);
        return false;
    }
}


// ================================================================
// 5. GET CURRENT USER
// ================================================================

/**
 * Get currently logged-in user.
 *
 * @returns {Object|null}
 */
export function getCurrentUser() {
    if (currentUser) {
        return currentUser;
    }

    currentUser = UserStorage.get();

    return currentUser;
}


// ================================================================
// 6. CHECK LOGIN STATUS
// ================================================================

/**
 * Check whether user is logged in.
 *
 * @returns {boolean}
 */
export function isLoggedIn() {
    return Boolean(getCurrentUser());
}


// ================================================================
// 7. GET CURRENT ROLE
// ================================================================

/**
 * Get current user's role.
 *
 * @returns {string|null}
 */
export function getCurrentRole() {
    const user = getCurrentUser();

    return user ? user.role : null;
}


// ================================================================
// 8. CHECK USER ROLE
// ================================================================

/**
 * Check whether current user has a specific role.
 *
 * @param {string|string[]} roles
 * @returns {boolean}
 */
export function hasRole(roles) {
    const userRole = getCurrentRole();

    if (!userRole) {
        return false;
    }

    if (Array.isArray(roles)) {
        return roles.includes(userRole);
    }

    return userRole === roles;
}


// ================================================================
// 9. UPDATE PROFILE
// ================================================================

/**
 * Update current user's profile.
 *
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateProfile(updates = {}) {
    try {
        const user = getCurrentUser();

        if (!user) {
            return {
                success: false,
                error: 'Not logged in'
            };
        }

        // -----------------------------
        // Validate name
        // -----------------------------
        if (updates.name !== undefined) {
            const nameValidation =
                validateName(updates.name);

            if (!nameValidation.valid) {
                return {
                    success: false,
                    error: nameValidation.error
                };
            }
        }

        // -----------------------------
        // Validate email
        // -----------------------------
        if (updates.email !== undefined) {
            const emailValidation =
                validateEmail(updates.email);

            if (!emailValidation.valid) {
                return {
                    success: false,
                    error: emailValidation.error
                };
            }
        }

        // -----------------------------
        // Validate phone
        // -----------------------------
        if (
            updates.phone !== undefined &&
            String(updates.phone).trim() !== ''
        ) {
            const phoneValidation =
                validatePhone(updates.phone);

            if (!phoneValidation.valid) {
                return {
                    success: false,
                    error: phoneValidation.error
                };
            }
        }

        // -----------------------------
        // Normalize data
        // -----------------------------
        const normalizedUpdates = {
            ...updates
        };

        if (normalizedUpdates.name !== undefined) {
            normalizedUpdates.name =
                String(normalizedUpdates.name).trim();
        }

        if (normalizedUpdates.email !== undefined) {
            normalizedUpdates.email =
                String(normalizedUpdates.email)
                    .trim()
                    .toLowerCase();
        }

        if (normalizedUpdates.phone !== undefined) {
            normalizedUpdates.phone =
                String(normalizedUpdates.phone).trim();
        }

        // -----------------------------
        // Create updated user
        // -----------------------------
        const updatedUser = {
            ...user,
            ...normalizedUpdates
        };

        // -----------------------------
        // Save user
        // -----------------------------
        UserStorage.save(updatedUser);

        currentUser = updatedUser;

        // -----------------------------
        // Update MOCK_USERS
        // -----------------------------
        const index = MOCK_USERS.findIndex(
            (u) => u.id === user.id
        );

        if (index !== -1) {
            MOCK_USERS[index] = {
                ...MOCK_USERS[index],
                ...normalizedUpdates
            };
        }

        // -----------------------------
        // Notify listeners
        // -----------------------------
        notifyAuthListeners(updatedUser);

        showToast(
            'Profile updated successfully!',
            'success'
        );

        return {
            success: true,
            user: updatedUser
        };

    } catch (error) {
        console.error(
            'Profile update error:',
            error
        );

        return {
            success: false,
            error: 'Failed to update profile'
        };
    }
}


// ================================================================
// 10. CHANGE PASSWORD
// ================================================================

/**
 * Change current user's password.
 *
 * @param {string} currentPassword
 * @param {string} newPassword
 * @param {string} confirmPassword
 * @returns {Promise<Object>}
 */
export async function changePassword(
    currentPassword,
    newPassword,
    confirmPassword
) {
    try {
        const user = getCurrentUser();

        if (!user) {
            return {
                success: false,
                error: 'Not logged in'
            };
        }

        // -----------------------------
        // Find mock user
        // -----------------------------
        const mockUser = MOCK_USERS.find(
            (u) => u.id === user.id
        );

        if (!mockUser) {
            return {
                success: false,
                error: 'User not found'
            };
        }

        // -----------------------------
        // Validate current password
        // -----------------------------
        if (!currentPassword) {
            return {
                success: false,
                error: 'Current password is required'
            };
        }

        if (mockUser.password !== currentPassword) {
            return {
                success: false,
                error: 'Current password is incorrect'
            };
        }

        // -----------------------------
        // Validate new password
        // -----------------------------
        const passwordValidation =
            validatePassword(newPassword);

        if (!passwordValidation.valid) {
            return {
                success: false,
                error: passwordValidation.error
            };
        }

        // -----------------------------
        // Confirm new password
        // -----------------------------
        if (newPassword !== confirmPassword) {
            return {
                success: false,
                error: 'New passwords do not match'
            };
        }

        // -----------------------------
        // Update password
        // -----------------------------
        mockUser.password = newPassword;

        // -----------------------------
        // Save user without password
        // -----------------------------
        const {
            password: ignoredPassword,
            ...userWithoutPassword
        } = mockUser;

        UserStorage.save(userWithoutPassword);

        currentUser = userWithoutPassword;

        notifyAuthListeners(currentUser);

        showToast(
            'Password changed successfully!',
            'success'
        );

        return {
            success: true
        };

    } catch (error) {
        console.error(
            'Password change error:',
            error
        );

        return {
            success: false,
            error: 'Failed to change password'
        };
    }
}


// ================================================================
// 11. RESET PASSWORD
// ================================================================

/**
 * Reset password.
 *
 * NOTE:
 * This is a mock implementation.
 * Real backend should send an email/SMS reset token.
 *
 * @param {string} email
 * @returns {Promise<Object>}
 */
export async function resetPassword(email) {
    try {
        // -----------------------------
        // Validate email
        // -----------------------------
        const emailValidation =
            validateEmail(email);

        if (!emailValidation.valid) {
            return {
                success: false,
                error: emailValidation.error
            };
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        // -----------------------------
        // Find user
        // -----------------------------
        const user = MOCK_USERS.find(
            (u) =>
                String(u.email || '').toLowerCase() ===
                normalizedEmail
        );

        if (!user) {
            return {
                success: false,
                error: 'No account found with this email'
            };
        }

        // -----------------------------
        // Mock reset process
        // -----------------------------
        showToast(
            `Password reset link sent to ${normalizedEmail}`,
            'info'
        );

        return {
            success: true
        };

    } catch (error) {
        console.error(
            'Password reset error:',
            error
        );

        return {
            success: false,
            error: 'Failed to send reset link'
        };
    }
}


// ================================================================
// 12. AUTH LISTENERS
// ================================================================

/**
 * Add authentication state listener.
 *
 * @param {Function} listener
 */
export function addAuthListener(listener) {
    if (typeof listener !== 'function') {
        return false;
    }

    if (!authListeners.includes(listener)) {
        authListeners.push(listener);
    }

    return true;
}


/**
 * Remove authentication listener.
 *
 * @param {Function} listener
 */
export function removeAuthListener(listener) {
    authListeners =
        authListeners.filter(
            (item) => item !== listener
        );
}


/**
 * Notify authentication listeners.
 *
 * @param {Object|null} user
 */
function notifyAuthListeners(user) {
    authListeners.forEach((listener) => {
        try {
            listener(user);
        } catch (error) {
            console.error(
                'Auth listener error:',
                error
            );
        }
    });
}


// ================================================================
// 13. SESSION INITIALIZATION
// ================================================================

/**
 * Restore user session when module loads.
 */
function initializeAuth() {
    try {
        currentUser = UserStorage.get();

        if (currentUser) {
            console.log(
                `🔐 Session restored for ${currentUser.name}`
            );
        }
    } catch (error) {
        console.error(
            'Auth initialization error:',
            error
        );

        currentUser = null;
    }
}

initializeAuth();


// ================================================================
// 14. DEFAULT EXPORT
// ================================================================

export default {
    login,
    register,
    logout,

    getCurrentUser,
    isLoggedIn,
    getCurrentRole,
    hasRole,

    updateProfile,
    changePassword,
    resetPassword,

    addAuthListener,
    removeAuthListener
};

/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - STORAGE UTILITIES
 * ================================================================
 * Handles all LocalStorage operations with JSON serialization.
 * ================================================================
 */

import { STORAGE_KEYS } from '../config.js';

/**
 * Generic storage operations
 */
export const Storage = {
    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store (will be JSON stringified)
     */
    set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error(`Storage error (set): ${error.message}`);
            return false;
        }
    },

    /**
     * Retrieve data from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key not found
     * @returns {*} Parsed value or default
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.error(`Storage error (get): ${error.message}`);
            return defaultValue;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Storage error (remove): ${error.message}`);
            return false;
        }
    },

    /**
     * Clear all app-related storage
     */
    clear() {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error(`Storage error (clear): ${error.message}`);
            return false;
        }
    },

    /**
     * Check if key exists in localStorage
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return localStorage.getItem(key) !== null;
    },

    /**
     * Get all storage keys
     * @returns {string[]}
     */
    keys() {
        return Object.keys(localStorage);
    },
};

// ===== 2. USER STORAGE =====
export const UserStorage = {
    /**
     * Save user data
     * @param {Object} user - User object
     */
    save(user) {
        return Storage.set(STORAGE_KEYS.user, user);
    },

    /**
     * Get user data
     * @returns {Object|null}
     */
    get() {
        return Storage.get(STORAGE_KEYS.user, null);
    },

    /**
     * Remove user data (logout)
     */
    clear() {
        return Storage.remove(STORAGE_KEYS.user);
    },

    /**
     * Update specific user fields
     * @param {Object} updates - Fields to update
     */
    update(updates) {
        const user = this.get();
        if (!user) return false;
        const updated = { ...user, ...updates };
        return this.save(updated);
    },

    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.get() !== null;
    },

    /**
     * Get user role
     * @returns {string|null}
     */
    getRole() {
        const user = this.get();
        return user ? user.role : null;
    },
};

// ===== 3. TOKEN STORAGE =====
export const TokenStorage = {
    /**
     * Save auth token
     * @param {string} token - JWT token
     */
    save(token) {
        return Storage.set(STORAGE_KEYS.token, token);
    },

    /**
     * Get auth token
     * @returns {string|null}
     */
    get() {
        return Storage.get(STORAGE_KEYS.token, null);
    },

    /**
     * Remove token (logout)
     */
    clear() {
        return Storage.remove(STORAGE_KEYS.token);
    },
   /**
     * Check if token exists
     * @returns {boolean}
     */
    hasToken() {
        return Storage.has(STORAGE_KEYS.token);
    },
};

// ===== 4. CART STORAGE =====
export const CartStorage = {
    /**
     * Save cart items
     * @param {Array} items - Cart items array
     */
    save(items) {
        return Storage.set(STORAGE_KEYS.cart, items);
    },

    /**
     * Get cart items
     * @returns {Array}
     */
    get() {
        return Storage.get(STORAGE_KEYS.cart, []);
    },

    /**
     * Clear cart
     */
    clear() {
        return Storage.remove(STORAGE_KEYS.cart);
    },

    /**
     * Add item to cart
     * @param {Object} item - Item to add
     * @returns {Array} Updated cart
     */
    addItem(item) {
        const cart = this.get();
        const existing = cart.find(i => i.itemId === item.itemId);
        if (existing) {
            existing.quantity += item.quantity || 1;
        } else {
            cart.push({ ...item, quantity: item.quantity || 1 });
        }
        this.save(cart);
        return cart;
    },

    /**
     * Remove item from cart
     * @param {number} itemId - Item ID to remove
     * @returns {Array} Updated cart
     */
    removeItem(itemId) {
        let cart = this.get();
        cart = cart.filter(item => item.itemId !== itemId);
        this.save(cart);
        return cart;
    },

    /**
     * Update item quantity
     * @param {number} itemId - Item ID
     * @param {number} quantity - New quantity
     * @returns {Array} Updated cart
     */
    updateQuantity(itemId, quantity) {
        const cart = this.get();
        const item = cart.find(i => i.itemId === itemId);
        if (item) {
            if (quantity <= 0) {
                return this.removeItem(itemId);
            }
            item.quantity = quantity;
            this.save(cart);
        }
        return cart;
    },

    /**
     * Get total items count
     * @returns {number}
     */
    getTotalItems() {
        const cart = this.get();
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    },

    /**
     * Get total price
     * @returns {number}
     */
    getTotalPrice() {
        const cart = this.get();
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
};

// ===== 5. THEME STORAGE =====
export const ThemeStorage = {
    /**
     * Save theme preference
     * @param {string} theme - 'light' or 'dark'
     */
    save(theme) {
        return Storage.set(STORAGE_KEYS.theme, theme);
    },

    /**
     * Get theme preference
     * @returns {string} 'light' or 'dark'
     */
    get() {
        return Storage.get(STORAGE_KEYS.theme, 'light');
    },

    /**
     * Toggle theme
     * @returns {string} New theme
     */
    toggle() {
        const current = this.get();
        const next = current === 'light' ? 'dark' : 'light';
        this.save(next);
        return next;
    },
};

// ===== 6. LANGUAGE STORAGE =====
export const LanguageStorage = {
    /**
     * Save language preference
     * @param {string} lang - 'en' or 'am'
     */
    save(lang) {
        return Storage.set(STORAGE_KEYS.language, lang);
    },

    /**
     * Get language preference
     * @returns {string}
     */
    get() {
        return Storage.get(STORAGE_KEYS.language, 'en');
    },
};

// ===== 7. NOTIFICATIONS STORAGE =====
export const NotificationStorage = {
    /**
     * Save notifications
     * @param {Array} notifications
     */
    save(notifications) {
        return Storage.set(STORAGE_KEYS.notifications, notifications);
    },

    /**
     * Get notifications
     * @returns {Array}
     */
    get() {
        return Storage.get(STORAGE_KEYS.notifications, []);
    },

    /**
     * Add notification
     * @param {Object} notification
      */
    add(notification) {
        const notifications = this.get();
        notifications.unshift({
            id: Date.now(),
            read: false,
            createdAt: new Date().toISOString(),
            ...notification,
        });
        this.save(notifications);
        return notifications;
    },

    /**
     * Mark notification as read
     * @param {number} id - Notification ID
     */
    markRead(id) {
        const notifications = this.get();
        const index = notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            notifications[index].read = true;
            this.save(notifications);
        }
        return notifications;
    },

    /**
     * Mark all as read
     */
    markAllRead() {
        const notifications = this.get();
        notifications.forEach(n => n.read = true);
        this.save(notifications);
        return notifications;
    },

    /**
     * Get unread count
     * @returns {number}
     */
    getUnreadCount() {
        const notifications = this.get();
        return notifications.filter(n => !n.read).length;
    },

    /**
     * Clear all notifications
     */
    clear() {
        return Storage.remove(STORAGE_KEYS.notifications);
    },
};

// ===== 8. EXPORT ALL =====
export default {
    Storage,
    UserStorage,
    TokenStorage,
    CartStorage,
    ThemeStorage,
    LanguageStorage,
    NotificationStorage,
};
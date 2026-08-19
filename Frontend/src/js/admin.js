/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN MODULE
 * ================================================================
 * Handles admin operations: dashboard, user management, reports.
 * ================================================================
 */

import { MOCK_USERS } from './config.js';
import { getCurrentUser } from './auth.js';
import { getOrderStats, getAllOrders } from './orders.js';
import { getAllFeedback, getFeedbackStats } from './feedback.js';
import { getAllPayments, getPaymentStats } from './payment.js';
import { getAllCancellations, getCancellationStats } from './order-cancellation.js';
import { getMenuItems, getTotalCount, getAvailableCount } from './menu.js';
import { showToast } from './main.js';

// ===== 1. ADMIN STATE =====
let adminListeners = [];

// ===== 2. ADMIN FUNCTIONS =====

/**
 * Get admin dashboard data
 * @returns {Object} Complete dashboard data
 */
export function getAdminDashboardData() {
    const orderStats = getOrderStats();
    const feedbackStats = getFeedbackStats();
    const paymentStats = getPaymentStats();
    const cancellationStats = getCancellationStats();

    const menuItems = getMenuItems();
    const totalMenuItems = getTotalCount();
    const availableMenuItems = getAvailableCount();

    const allOrders = getAllOrders();
    const recentOrders = allOrders
        .sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime))
        .slice(0, 10);

    return {
        stats: {
            totalOrders: orderStats.total,
            pendingOrders: orderStats.pending,
            preparingOrders: orderStats.preparing,
            readyOrders: orderStats.ready,
            servedOrders: orderStats.served,
            cancelledOrders: orderStats.cancelled,
            totalRevenue: orderStats.totalRevenue,
            todayOrders: orderStats.todayOrders,
            todayRevenue: orderStats.todayRevenue,
            totalCustomers: MOCK_USERS.length,
            totalMenuItems: totalMenuItems,
            availableMenuItems: availableMenuItems,
            averageRating: feedbackStats.averageRating,
            totalFeedback: feedbackStats.total,
            pendingFeedback: feedbackStats.pending,
            totalPayments: paymentStats.total,
            totalPaymentAmount: paymentStats.totalAmount,
            pendingCancellations: cancellationStats.pending,
            totalCancellations: cancellationStats.total,
        },
        recentOrders: recentOrders,
        feedbackStats: feedbackStats,
        paymentStats: paymentStats,
        cancellationStats: cancellationStats,
    };
}

/**
 * Get admin users list
 * @param {Object} filters - Filter options
 * @param {string} filters.search - Search query
 * @param {string} filters.role - Role filter
 * @returns {Array} Users list
 */
export function getAdminUsers(filters = {}) {
    let users = [...MOCK_USERS];

    if (filters.search && filters.search.trim() !== '') {
        const q = filters.search.trim().toLowerCase();
        users = users.filter(u =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
    }

    if (filters.role) {
        users = users.filter(u => u.role === filters.role);
    }

    return users;
}

/**
 * Get user by ID (Admin only)
 * @param {string} userId - User ID
 * @returns {Object|null} User or null
 */
export function getUserById(userId) {
    return MOCK_USERS.find(u => u.id === userId) || null;
}

/**
 * Update user (Admin only)
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user or error
 */
export async function updateUser(userId, updates) {
    try {
        const index = MOCK_USERS.findIndex(u => u.id === userId);
        if (index === -1) {
            return { success: false, error: 'User not found' };
        }

        const user = MOCK_USERS[index];
    // Prevent role changes for admin
        if (updates.role && user.role === 'admin') {
            return { success: false, error: 'Cannot change admin role' };
        }

        // Update user
        const allowedFields = ['name', 'email', 'phone', 'role', 'avatar'];
        const filteredUpdates = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        MOCK_USERS[index] = { ...user, ...filteredUpdates };

        // If updating current user, update storage too
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            const { password: _, ...userWithoutPassword } = MOCK_USERS[index];
            localStorage.setItem('scos_user', JSON.stringify(userWithoutPassword));
        }

        showToast('User updated successfully', 'success');

        return { success: true, user: MOCK_USERS[index] };

    } catch (error) {
        console.error('Update user error:', error);
        return { success: false, error: 'Failed to update user' };
    }
}

/**
 * Delete user (Admin only)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Success or error
 */
export async function deleteUser(userId) {
    try {
        const index = MOCK_USERS.findIndex(u => u.id === userId);
        if (index === -1) {
            return { success: false, error: 'User not found' };
        }

        const user = MOCK_USERS[index];

        // Prevent deleting admin
        if (user.role === 'admin') {
            return { success: false, error: 'Cannot delete admin user' };
        }

        // Prevent deleting self
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            return { success: false, error: 'Cannot delete your own account' };
        }

        MOCK_USERS.splice(index, 1);
        showToast('User deleted successfully', 'info');

        return { success: true };

    } catch (error) {
        console.error('Delete user error:', error);
        return { success: false, error: 'Failed to delete user' };
    }
}

/**
 * Generate admin report
 * @param {string} type - Report type
 * @param {Object} filters - Report filters
 * @param {string} filters.startDate - Start date
 * @param {string} filters.endDate - End date
 * @returns {Object} Report data
 */
export function generateReport(type, filters = {}) {
    const reports = {
        'daily-orders': generateDailyOrdersReport,
        'sales': generateSalesReport,
        'popular-items': generatePopularItemsReport,
        'payments': generatePaymentsReport,
    };

    const generator = reports[type];
    if (!generator) {
        return { success: false, error: 'Invalid report type' };
    }

    return generator(filters);
}

/**
 * Generate daily orders report
 * @param {Object} filters - Date filters
 * @returns {Object} Report data
 */
function generateDailyOrdersReport(filters = {}) {
    const allOrders = getAllOrders();
    const startDate = filters.startDate || new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0];
    const endDate = filters.endDate || new Date().toISOString().split('T')[0];

    const filteredOrders = allOrders.filter(o =>
        o.orderTime >= startDate && o.orderTime <= endDate
    );

    // Group by date
    const dailyData = {};
    filteredOrders.forEach(order => {
        const date = order.orderTime.split('T')[0];
        if (!dailyData[date]) {
            dailyData[date] = { orders: 0, revenue: 0, items: 0 };
        }
        dailyData[date].orders++;
        dailyData[date].revenue += order.totalAmount;
        dailyData[date].items += order.items.reduce((sum, item) => sum + item.quantity, 0);
    });

    return {
        type: 'daily-orders',
        startDate,
        endDate,
        totalOrders: filteredOrders.length,
        totalRevenue: filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        dailyData,
    };
}
 /**
 * Generate sales report
 * @param {Object} filters - Date filters
 * @returns {Object} Report data
 */
function generateSalesReport(filters = {}) {
    const allOrders = getAllOrders();
    const startDate = filters.startDate || new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0];
    const endDate = filters.endDate || new Date().toISOString().split('T')[0];

    const filteredOrders = allOrders.filter(o =>
        o.orderTime >= startDate && o.orderTime <= endDate &&
        o.status !== 'cancelled'
    );

    // Aggregate by category
    const categorySales = {};
    const itemSales = {};

    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            const key = item.name.en || item.name;
            if (!itemSales[key]) {
                itemSales[key] = { name: key, quantity: 0, revenue: 0 };
            }
            itemSales[key].quantity += item.quantity;
            itemSales[key].revenue += item.price * item.quantity;
        });
    });

    return {
        type: 'sales',
        startDate,
        endDate,
        totalRevenue: filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        totalOrders: filteredOrders.length,
        itemSales: Object.values(itemSales).sort((a, b) => b.revenue - a.revenue),
    };
}

/**
 * Generate popular items report
 * @param {Object} filters - Date filters
 * @returns {Object} Report data
 */
function generatePopularItemsReport(filters = {}) {
    const allOrders = getAllOrders();
    const startDate = filters.startDate || new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0];
    const endDate = filters.endDate || new Date().toISOString().split('T')[0];

    const filteredOrders = allOrders.filter(o =>
        o.orderTime >= startDate && o.orderTime <= endDate
    );

    const itemCount = {};

    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            const key = item.name.en || item.name;
            if (!itemCount[key]) {
                itemCount[key] = { name: key, count: 0, revenue: 0 };
            }
            itemCount[key].count += item.quantity;
            itemCount[key].revenue += item.price * item.quantity;
        });
    });

    const sorted = Object.values(itemCount).sort((a, b) => b.count - a.count);

    return {
        type: 'popular-items',
        startDate,
        endDate,
        totalItems: sorted.reduce((sum, item) => sum + item.count, 0),
        items: sorted,
        topItems: sorted.slice(0, 10),
    };
}

/**
 * Generate payments report
 * @param {Object} filters - Date filters
 * @returns {Object} Report data
 */
function generatePaymentsReport(filters = {}) {
    const allPayments = getAllPayments();
    const startDate = filters.startDate || new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0];
    const endDate = filters.endDate || new Date().toISOString().split('T')[0];

    const filteredPayments = allPayments.filter(p =>
        p.createdAt >= startDate && p.createdAt <= endDate
    );

    const methodCounts = {};
    filteredPayments.forEach(p => {
        methodCounts[p.method] = (methodCounts[p.method] || 0) + 1;
    });

    return {
        type: 'payments',
        startDate,
        endDate,
        totalPayments: filteredPayments.length,
        totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
        successful: filteredPayments.filter(p => p.status === 'simulated').length,
        failed: filteredPayments.filter(p => p.status === 'failed').length,
        methodCounts,
    };
}

/**
 * Check if user is admin
 * @returns {boolean}
 */
export function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// ===== 3. ADMIN LISTENERS =====

/**
 * Add admin change listener
 * @param {Function} listener - Callback function
 */
export function addAdminListener(listener) {
    if (typeof listener === 'function') {
        adminListeners.push(listener);
    }
}
 /**
 * Remove admin change listener
 * @param {Function} listener - Callback function
 */
export function removeAdminListener(listener) {
    adminListeners = adminListeners.filter(l => l !== listener);
}

/**
 * Notify all admin listeners
 */
function notifyAdminListeners() {
    const data = getAdminDashboardData();
    adminListeners.forEach(listener => {
        try {
            listener(data);
        } catch (error) {
            console.error('Admin listener error:', error);
        }
    });
}

// ===== 4. EXPORTS =====
export default {
    getAdminDashboardData,
    getAdminUsers,
    getUserById,
    updateUser,
    deleteUser,
    generateReport,
    isAdmin,
    addAdminListener,
    removeAdminListener,
};
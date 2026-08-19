/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - NOTIFICATIONS MODULE
 * ================================================================
 * Handles user notifications, alerts, and real-time updates.
 * ================================================================
 */

import { NotificationStorage } from './utils/storage.js';
import { getCurrentUser } from './auth.js';
import { getOrderById } from './orders.js';
import { showToast } from './main.js';
import { formatRelativeTime } from './utils/formatters.js';

// ===== 1. NOTIFICATIONS STATE =====
let notifications = [];
let notificationListeners = [];

// ===== 2. LOAD NOTIFICATIONS =====
function loadNotifications() {
    notifications = NotificationStorage.get();
    return notifications;
}

// ===== 3. SAVE NOTIFICATIONS =====
function saveNotifications() {
    NotificationStorage.save(notifications);
    notifyNotificationListeners();
    return notifications;
}

// ===== 4. NOTIFICATION FUNCTIONS =====

/**
 * Get all notifications for current user
 * @param {Object} filters - Filter options
 * @param {boolean} filters.unread - Only unread
 * @param {string} filters.type - Notification type
 * @returns {Array} Notifications
 */
export function getNotifications(filters = {}) {
    let result = loadNotifications();

    // Filter by user
    const user = getCurrentUser();
    if (user) {
        result = result.filter(n => n.userId === user.id);
    }

    if (filters.unread) {
        result = result.filter(n => !n.read);
    }

    if (filters.type) {
        result = result.filter(n => n.type === filters.type);
    }

    // Sort by most recent first
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return result;
}

/**
 * Get unread notifications count
 * @returns {number}
 */
export function getUnreadCount() {
    const user = getCurrentUser();
    if (!user) return 0;
    return loadNotifications()
        .filter(n => n.userId === user.id && !n.read)
        .length;
}

/**
 * Add a new notification
 * @param {Object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.message - Notification message
 * @param {string} notification.type - Notification type (status_update, ready, etc.)
 * @param {string} notification.orderId - Related order ID
 * @param {string} notification.userId - User ID
 * @param {string} notification.icon - Icon class
 * @param {string} notification.link - Link to redirect
 * @returns {Array} Updated notifications
 */
export function addNotification(notification) {
    const user = getCurrentUser();
    if (!user && !notification.userId) {
        console.warn('Cannot add notification: no user');
        return notifications;
    }

    const newNotification = {
        id: 'n' + Date.now(),
        userId: notification.userId || user.id,
        title: notification.title || 'Notification',
        message: notification.message || '',
        type: notification.type || 'info',
        icon: notification.icon || this.getTypeIcon(notification.type),
        orderId: notification.orderId || null,
        link: notification.link || null,
        read: false,
        createdAt: new Date().toISOString(),
    };

    notifications.push(newNotification);
    saveNotifications();

    // Show toast for real-time notification
    showToast(newNotification.message, this.getTypeToast(newNotification.type));

    return notifications;
}

/**
 * Get icon for notification type
 * @param {string} type - Notification type
 * @returns {string} Icon class
 */
export function getTypeIcon(type) {
    const icons = {
        status_update: 'fa-sync-alt',
        ready: 'fa-check-circle',
        order_placed: 'fa-shopping-bag',
        payment: 'fa-credit-card',
        cancelled: 'fa-times-circle',
        feedback: 'fa-star',
        admin: 'fa-shield-alt',
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-exclamation-circle',
    };
    return icons[type] || icons.info;
}

/**
 * Get toast type for notification type
 * @param {string} type - Notification type
 * @returns {string} Toast type
 */
export function getTypeToast(type) {
    const types = {
        ready: 'success',
        order_placed: 'success',
        payment: 'success',
        cancelled: 'warning',
        status_update: 'info',
        feedback: 'info',
        admin: 'info',
        error: 'error',
        warning: 'warning',
    };
    return types[type] || 'info';
}

/**
 * Mark notification as read
 * @param {string|number} id - Notification ID
 * @returns {Array} Updated notifications
 */
export function markAsRead(id) {
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
        notifications[index].read = true;
        saveNotifications();
    }
    return notifications;
}

/**
 * Mark all notifications as read
 * @returns {Array} Updated notifications
 */
export function markAllAsRead() {
    const user = getCurrentUser();
    if (!user) return notifications;

    notifications.forEach(n => {
        if (n.userId === user.id) {
            n.read = true;
        }
    });
    saveNotifications();
    return notifications;
}

/**
 * Delete a notification
 * @param {string|number} id - Notification ID
 * @returns {Array} Updated notifications
 */
export function deleteNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
    saveNotifications();
    return notifications;
}

/**
 * Clear all notifications for current user
 * @param {boolean} showConfirm - Show confirmation
 * @returns {Array} Empty notifications
 */
export function clearAllNotifications(showConfirm = true) {
    const user = getCurrentUser();
    if (!user) return notifications;

    if (showConfirm) {
        if (!confirm('Clear all notifications?')) {
            return notifications;
        }
    }

    notifications = notifications.filter(n => n.userId !== user.id);
    saveNotifications();
    return notifications;
}

/**
 * Create order status notification
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @returns {Array} Updated notifications
 */
export function notifyOrderStatus(orderId, status) {
    const order = getOrderById(orderId);
    if (!order) return notifications;

    const statusLabels = {
        pending: 'Order placed',
        preparing: 'Order is being prepared',
        ready: 'Order ready for pickup',
        served: 'Order served',
        cancelled: 'Order cancelled',
    };

    return addNotification({
        userId: order.userId,
        title: Order ${orderId},
        message: statusLabels[status] || Order status: ${status},
        type: status === 'ready' ? 'ready' : 'status_update',
        orderId: orderId,
        link: /src/pages/customer/order-tracking.html?id=${orderId},
    });
}

/**
 * Create order ready notification (shortcut)
 * @param {string} orderId - Order ID
 * @returns {Array} Updated notifications
 */
export function notifyOrderReady(orderId) {
    const order = getOrderById(orderId);
    if (!order) return notifications;

    return addNotification({
        userId: order.userId,
        title: '🍽️ Order Ready!',
        message: Your order ${orderId} is ready for pickup.,
        type: 'ready',
        orderId: orderId,
        link: /src/pages/customer/order-tracking.html?id=${orderId},
    });
}

/**
 * Create payment notification
 * @param {string} orderId - Order ID
 * @param {boolean} success - Payment success
 * @returns {Array} Updated notifications
 */
export function notifyPayment(orderId, success) {
    const order = getOrderById(orderId);
    if (!order) return notifications;
    return addNotification({
        userId: order.userId,
        title: success ? '✅ Payment Successful' : '❌ Payment Failed',
        message: success
            ? Payment for order ${orderId} was successful.
            : Payment for order ${orderId} failed. Please try again.,
        type: success ? 'payment' : 'error',
        orderId: orderId,
        link: /src/pages/customer/order-tracking.html?id=${orderId},
    });
}

// ===== 5. NOTIFICATION LISTENERS =====

/**
 * Add notification change listener
 * @param {Function} listener - Callback function
 */
export function addNotificationListener(listener) {
    if (typeof listener === 'function') {
        notificationListeners.push(listener);
    }
}

/**
 * Remove notification change listener
 * @param {Function} listener - Callback function
 */
export function removeNotificationListener(listener) {
    notificationListeners = notificationListeners.filter(l => l !== listener);
}

/**
 * Notify all notification listeners
 */
function notifyNotificationListeners() {
    notificationListeners.forEach(listener => {
        try {
            listener(notifications);
        } catch (error) {
            console.error('Notification listener error:', error);
        }
    });
}

// ===== 6. INITIALIZATION =====
loadNotifications();

// ===== 7. EXPORTS =====
export default {
    getNotifications,
    getUnreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    notifyOrderStatus,
    notifyOrderReady,
    notifyPayment,
    getTypeIcon,
    getTypeToast,
    addNotificationListener,
    removeNotificationListener,
};
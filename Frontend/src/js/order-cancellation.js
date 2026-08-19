/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ORDER CANCELLATION MODULE
 * ================================================================
 * Handles order cancellation requests, reasons, and tracking.
 * ================================================================
 */

import { getCurrentUser } from './auth.js';
import { getOrderById, cancelOrder, canCancelOrder } from './orders.js';
import { addNotification } from './notifications.js';
import { showToast } from './main.js';

// ===== 1. CANCELLATION STATE =====
let cancellationRequests = [];
let cancellationListeners = [];

// ===== 2. CANCELLATION FUNCTIONS =====

/**
 * Get all cancellation requests (Admin only)
 * @param {Object} filters - Filter options
 * @param {string} filters.status - Request status
 * @param {string} filters.date - Date filter
 * @returns {Array} Cancellation requests
 */
export function getAllCancellations(filters = {}) {
    let result = [...cancellationRequests];

    if (filters.status) {
        result = result.filter(c => c.status === filters.status);
    }

    if (filters.date) {
        const dateStr = filters.date;
        result = result.filter(c => c.createdAt.startsWith(dateStr));
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return result;
}

/**
 * Get user's cancellation requests
 * @param {string} userId - User ID
 * @returns {Array} User's cancellations
 */
export function getUserCancellations(userId) {
    return cancellationRequests.filter(c => c.userId === userId);
}

/**
 * Get current user's cancellation requests
 * @returns {Array} Current user's cancellations
 */
export function getMyCancellations() {
    const user = getCurrentUser();
    if (!user) return [];
    return getUserCancellations(user.id);
}

/**
 * Request cancellation for an order
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @param {string} details - Additional details
 * @returns {Promise<Object>} Request result
 */
export async function requestCancellation(orderId, reason, details = '') {
    try {
        const user = getCurrentUser();
        if (!user) {
            return { success: false, error: 'Please login to cancel orders' };
        }

        const order = getOrderById(orderId);
        if (!order) {
            return { success: false, error: 'Order not found' };
        }

        // Check if order belongs to user
        if (order.userId !== user.id) {
            return { success: false, error: 'You can only cancel your own orders' };
        }

        // Check if cancellable
        if (!canCancelOrder(orderId)) {
            return { success: false, error: 'This order cannot be cancelled at this stage' };
        }

        // Check if already requested
        const existing = cancellationRequests.find(c => c.orderId === orderId);
        if (existing && existing.status === 'pending') {
            return { success: false, error: 'Cancellation already requested' };
        }

        // Validate reason
        const validReasons = [
            'changed_mind',
            'wrong_item',
            'long_wait',
            'payment_issue',
            'duplicate_order',
            'other'
        ];

        if (!validReasons.includes(reason)) {
            return { success: false, error: 'Invalid cancellation reason' };
        }

        const reasonLabels = {
            changed_mind: "Changed my mind",
            wrong_item: "Wrong item ordered",
            long_wait: "Too long waiting time",
            payment_issue: "Payment issue",
            duplicate_order: "Duplicate order",
            other: "Other reason"
        };
        const cancellation = {
            id: 'c' + Date.now(),
            orderId: orderId,
            userId: user.id,
            reason: reason,
            reasonLabel: reasonLabels[reason] || reason,
            details: details.trim() || '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            resolvedAt: null,
            resolvedBy: null,
            resolutionNote: null,
        };

        cancellationRequests.push(cancellation);
        notifyCancellationListeners();

        // Send notification
        addNotification({
            userId: user.id,
            title: 'Cancellation Requested',
            message: Cancellation request for order ${orderId} has been submitted.,
            type: 'cancelled',
            orderId: orderId,
            link: /src/pages/customer/cancel-order.html?id=${orderId},
        });

        // Admin notification
        addNotification({
            userId: 'u1', // Admin ID
            title: 'New Cancellation Request',
            message: User ${user.name} requested cancellation for order ${orderId},
            type: 'admin',
            orderId: orderId,
            link: /src/pages/admin/cancellations.html,
        });

        showToast('Cancellation request submitted successfully', 'info');

        return { success: true, cancellation };

    } catch (error) {
        console.error('Request cancellation error:', error);
        return { success: false, error: 'Failed to submit cancellation request' };
    }
}

/**
 * Approve cancellation request (Admin only)
 * @param {string} cancellationId - Cancellation ID
 * @param {string} note - Admin note
 * @returns {Promise<Object>} Updated request or error
 */
export async function approveCancellation(cancellationId, note = '') {
    try {
        const index = cancellationRequests.findIndex(c => c.id === cancellationId);
        if (index === -1) {
            return { success: false, error: 'Cancellation request not found' };
        }

        const cancellation = cancellationRequests[index];
        if (cancellation.status !== 'pending') {
            return { success: false, error: 'Request already processed' };
        }

        // Actually cancel the order
        const result = await cancelOrder(cancellation.orderId, cancellation.reasonLabel);
        if (!result.success) {
            return { success: false, error: result.error };
        }

        // Update cancellation request
        cancellation.status = 'approved';
        cancellation.resolvedAt = new Date().toISOString();
        cancellation.resolvedBy = 'admin';
        cancellation.resolutionNote = note || 'Approved';

        notifyCancellationListeners();

        // Notify user
        addNotification({
            userId: cancellation.userId,
            title: '✅ Order Cancelled',
            message: Your order ${cancellation.orderId} has been cancelled.,
            type: 'cancelled',
            orderId: cancellation.orderId,
        });

        showToast('Cancellation approved successfully', 'success');

        return { success: true, cancellation };

    } catch (error) {
        console.error('Approve cancellation error:', error);
        return { success: false, error: 'Failed to approve cancellation' };
    }
}

/**
 * Reject cancellation request (Admin only)
 * @param {string} cancellationId - Cancellation ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Updated request or error
 */
export async function rejectCancellation(cancellationId, reason) {
    try {
        const index = cancellationRequests.findIndex(c => c.id === cancellationId);
        if (index === -1) {
            return { success: false, error: 'Cancellation request not found' };
        }

        const cancellation = cancellationRequests[index];
        if (cancellation.status !== 'pending') {
            return { success: false, error: 'Request already processed' };
        }
      cancellation.status = 'rejected';
        cancellation.resolvedAt = new Date().toISOString();
        cancellation.resolvedBy = 'admin';
        cancellation.resolutionNote = reason || 'Rejected';

        notifyCancellationListeners();

        // Notify user
        addNotification({
            userId: cancellation.userId,
            title: '❌ Cancellation Rejected',
            message: Your cancellation request for order ${cancellation.orderId} was rejected. Reason: ${reason || 'Not provided'},
            type: 'cancelled',
            orderId: cancellation.orderId,
        });

        showToast('Cancellation rejected', 'warning');

        return { success: true, cancellation };

    } catch (error) {
        console.error('Reject cancellation error:', error);
        return { success: false, error: 'Failed to reject cancellation' };
    }
}

/**
 * Get cancellation statistics
 * @returns {Object} Cancellation stats
 */
export function getCancellationStats() {
    const total = cancellationRequests.length;
    const pending = cancellationRequests.filter(c => c.status === 'pending').length;
    const approved = cancellationRequests.filter(c => c.status === 'approved').length;
    const rejected = cancellationRequests.filter(c => c.status === 'rejected').length;

    // Reason breakdown
    const reasons = {};
    cancellationRequests.forEach(c => {
        reasons[c.reason] = (reasons[c.reason] || 0) + 1;
    });

    return {
        total,
        pending,
        approved,
        rejected,
        reasons,
    };
}

// ===== 3. CANCELLATION LISTENERS =====

/**
 * Add cancellation change listener
 * @param {Function} listener - Callback function
 */
export function addCancellationListener(listener) {
    if (typeof listener === 'function') {
        cancellationListeners.push(listener);
    }
}

/**
 * Remove cancellation change listener
 * @param {Function} listener - Callback function
 */
export function removeCancellationListener(listener) {
    cancellationListeners = cancellationListeners.filter(l => l !== listener);
}

/**
 * Notify all cancellation listeners
 */
function notifyCancellationListeners() {
    cancellationListeners.forEach(listener => {
        try {
            listener(cancellationRequests);
        } catch (error) {
            console.error('Cancellation listener error:', error);
        }
    });
}

// ===== 4. VALIDATION =====

/**
 * Get cancellation reasons for dropdown
 * @param {string} language - 'en' or 'am'
 * @returns {Array} Reason options
 */
export function getCancellationReasons(language = 'en') {
    const reasons = {
        changed_mind: { en: 'Changed my mind', am: 'ሀሳቤን ቀየርኩ' },
        wrong_item: { en: 'Wrong item ordered', am: 'የተሳሳተ ምግብ አዘዝኩ' },
        long_wait: { en: 'Too long waiting time', am: 'ረጅም የመጠበቅ ጊዜ' },
        payment_issue: { en: 'Payment issue', am: 'የክፍያ ችግር' },
        duplicate_order: { en: 'Duplicate order', am: 'ድግግሞሽ ትዕዛዝ' },
        other: { en: 'Other reason', am: 'ሌላ ምክንያት' },
    };

    return Object.entries(reasons).map(([key, value]) => ({
        value: key,
        label: value[language] || value.en,
    }));
}

// ===== 5. EXPORTS =====
export default {
    getAllCancellations,
    getUserCancellations,
    getMyCancellations,
    requestCancellation,
    approveCancellation,
    rejectCancellation,
    getCancellationStats,
    getCancellationReasons,
    addCancellationListener,
    removeCancellationListener,
};
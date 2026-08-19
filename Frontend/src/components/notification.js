/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - NOTIFICATION COMPONENT
 * ================================================================
 * Pure UI Component - Renders notification items.
 * ================================================================
 */

/**
 * Create notification item HTML
 * @param {Object} options - Notification configuration
 * @param {string} options.id - Notification ID
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - 'info', 'success', 'warning', 'error'
 * @param {string} options.icon - Icon class
 * @param {string} options.time - Time string
 * @param {boolean} options.isRead - Read status
 * @param {string} options.link - Link href
 * @param {Function} options.onClick - Click callback
 * @param {Function} options.onMarkRead - Mark as read callback
 * @param {Function} options.onDelete - Delete callback
 * @returns {string} Notification HTML
 */
export function createNotification(options = {}) {
    const {
        id = 'n' + Date.now(),
        title = 'Notification',
        message = '',
        type = 'info',
        icon = null,
        time = 'Just now',
        isRead = false,
        link = null,
        onClick = null,
        onMarkRead = null,
        onDelete = null,
    } = options;

    // ---- Type Colors ----
    const typeColors = {
        info: { border: '#0ea5e9', bg: '#e0f2fe', icon: 'fa-info-circle' },
        success: { border: '#16a34a', bg: '#dcfce7', icon: 'fa-check-circle' },
        warning: { border: '#f59e0b', bg: '#fef3c7', icon: 'fa-exclamation-triangle' },
        error: { border: '#dc2626', bg: '#fee2e2', icon: 'fa-exclamation-circle' },
    };

    const colors = typeColors[type] || typeColors.info;
    const iconClass = icon || colors.icon;

    // ---- Build Notification ----
    const content = `
        <div style="flex:1;">
            <div style="font-weight:600; font-size:14px; color:var(--gray-900);">${title}</div>
            <div style="font-size:13px; color:var(--gray-600);">${message}</div>
            <div style="font-size:11px; color:var(--gray-400); margin-top:4px;">${time}</div>
        </div>
        <div style="display:flex; gap:4px; flex-shrink:0;">
            ${!isRead && onMarkRead ? `
                <button class="mark-read-btn" title="Mark as read" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:4px; font-size:14px;" onclick="${onMarkRead.toString()}()">
                    <i class="fas fa-check-circle"></i>
                </button>
            ` : ''}
            ${onDelete ? `
                <button class="delete-btn" title="Delete" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:4px; font-size:14px;" onclick="${onDelete.toString()}()">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
        </div>
    `;

    const wrapper = link ? `
        <a href="${link}" style="text-decoration:none; color:inherit; display:block;">
            ${content}
        </a>
    ` : content;

    return `
        <div class="notification ${!isRead ? 'unread' : ''}" id="notif-${id}" style="display:flex; align-items:flex-start; gap:12px; padding:12px 16px; border-radius:8px; background:${!isRead ? colors.bg : 'var(--white)'}; border-left:4px solid ${colors.border}; box-shadow:var(--shadow-sm); transition:all 0.2s; ${onClick ? 'cursor:pointer;' : ''}" ${onClick ? `onclick="${onClick.toString()}()"` : ''}>
            <div class="notification-icon" style="font-size:18px; color:${colors.border}; flex-shrink:0; margin-top:2px;">
                <i class="fas ${iconClass}"></i>
            </div>
            ${wrapper}
        </div>
        <!-- Notification Styles -->
        <style>
            .notification:hover {
                box-shadow: var(--shadow-md);
            }
            .notification.unread {
                background: var(--primary-bg);
                border-color: #2563eb;
            }
            .notification .mark-read-btn:hover {
                color: #16a34a !important;
            }
            .notification .delete-btn:hover {
                color: #dc2626 !important;
            }
            [data-theme="dark"] .notification {
                background: #1e293b;
            }
            [data-theme="dark"] .notification.unread {
                background: #0f172a;
            }
            [data-theme="dark"] .notification .notification-icon {
                color: #3b82f6;
            }
        </style>
    ;
}

/**
 * Create notification list
 * @param {Array} notifications - Array of notification options
 * @param {string} emptyMessage - Message when empty
 * @returns {string} Notification list HTML
 */
export function createNotificationList(notifications, emptyMessage = 'No notifications') {
    if (!notifications || notifications.length === 0) {
        return 
            <div style="text-align:center; padding:40px 20px; color:var(--gray-400);">
                <i class="fas fa-bell" style="font-size:40px; display:block; margin-bottom:12px;"></i>
                <p style="font-size:16px;">${emptyMessage}</p>
            </div>
        ;
    }

    return 
        <div class="notification-list" style="display:flex; flex-direction:column; gap:8px;">
            ${notifications.map(n => createNotification(n)).join('')}
        </div>
    `;
}

export default {
    createNotification,
    createNotificationList,
};
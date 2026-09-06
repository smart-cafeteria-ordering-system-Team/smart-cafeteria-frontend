/**
 * Real-Time Order Notification Listener
 * Connects to Socket.IO server and listens for order status updates.
 * Shows browser notifications + in-app toast when orders change status.
 */

(function () {
    const SOCKET_URL = (function() {
        if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
            return window.SOCKET_URL || "http://localhost:5000";
        }
        return window.SOCKET_URL || "https://smart-cafeteria-frontend.onrender.com";
    })();
    const STORAGE_KEY_USER = 'user';
    const STORAGE_KEY_TOKEN = 'auth_token';
    const STORAGE_KEY_TOKEN_ALT = 'token';

    function getStoredUser() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY_USER)
                || localStorage.getItem('current_user')
                || localStorage.getItem('scos_user')
                || localStorage.getItem('loggedUser');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function getToken() {
        return localStorage.getItem(STORAGE_KEY_TOKEN)
            || localStorage.getItem(STORAGE_KEY_TOKEN_ALT)
            || '';
    }

    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    function showNotificationToast(message, orderId) {
        // Try browser Notification API first
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                var notif = new Notification('Order Update', {
                    body: message,
                    icon: '/public/assets/images/food/food-placeholder.png',
                    tag: 'order-' + (orderId || ''),
                    requireInteraction: true
                });
                notif.onclick = function () {
                    window.focus();
                    if (orderId) {
                        window.location.href = '/src/pages/customer/order-tracking.html?orderId=' + orderId;
                    }
                    notif.close();
                };
                // Auto close after 10s
                setTimeout(function () { notif.close(); }, 10000);
            } catch (e) {
                // Fallback below
            }
        }

        // In-app toast banner (always show regardless of browser notification permission)
        showToastBanner(message, orderId);
    }

    function showToastBanner(message, orderId) {
        // Remove any existing toast first
        var existing = document.getElementById('order-notification-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.id = 'order-notification-toast';
        toast.style.cssText = [
            'position: fixed',
            'top: 20px',
            'right: 20px',
            'z-index: 99999',
            'background: linear-gradient(135deg, #15803d, #22c55e)',
            'color: #fff',
            'padding: 16px 24px',
            'border-radius: 12px',
            'box-shadow: 0 8px 32px rgba(0,0,0,0.25)',
            'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'font-size: 15px',
            'max-width: 400px',
            'cursor: pointer',
            'animation: slideInRight 0.4s ease-out',
            'display: flex',
            'align-items: flex-start',
            'gap: 12px'
        ].join(';');

        toast.innerHTML = '<div style="font-size:28px;line-height:1;">🔔</div>'
            + '<div style="flex:1;">'
            + '  <div style="font-weight:700;font-size:16px;margin-bottom:4px;">Order Update</div>'
            + '  <div style="line-height:1.4;">' + escapeHtml(message) + '</div>'
            + '</div>'
            + '<button id="toast-close-btn" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0 0 0 8px;line-height:1;">&times;</button>';

        document.body.appendChild(toast);

        // Click to go to order tracking
        toast.addEventListener('click', function (e) {
            if (e.target.id === 'toast-close-btn') return;
            if (orderId) {
                window.location.href = '/src/pages/customer/order-tracking.html?orderId=' + orderId;
            }
        });

        // Close button
        var closeBtn = document.getElementById('toast-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
                setTimeout(function () { toast.remove(); }, 300);
            });
        }

        // Auto-remove after 8 seconds
        setTimeout(function () {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
                setTimeout(function () { if (toast.parentNode) toast.remove(); }, 300);
            }
        }, 8000);

        // Inject animation keyframes if not already present
        if (!document.getElementById('toast-animations')) {
            var style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = [
                '@keyframes slideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }',
                '@keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120%); opacity: 0; } }'
            ].join('\n');
            document.head.appendChild(style);
        }
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function initSocketConnection() {
        var user = getStoredUser();
        var userId = user && (user._id || user.id);
        var token = getToken();

        // Don't connect if not logged in
        if (!userId || !token) return;

        // Check if Socket.IO client is available
        if (typeof io === 'undefined') {
            console.warn('[Socket] Socket.IO client library not loaded. Real-time notifications disabled.');
            return;
        }

        var socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            query: { token: token }
        });

        socket.on('connect', function () {
            console.log('[Socket] Connected to notification server');

            // Join user-specific room for targeted notifications
            socket.emit('joinUserRoom', userId);
        });

        socket.on('orderStatusUpdated', function (data) {
            console.log('[Socket] Order status update received:', data);
            showNotificationToast(data.message, data.orderNumber || data.orderId);

            // Play notification sound (non-blocking)
            try {
                var audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH+DgHx1b3V5goKAfnZydHh+g4F+d3J0eH6DgX53cnR4foOBfndydHh+g4F+d3J0eH6DgX53cnR4foOBfndydHh+g4F+d3J0eH6DgX4=');
                audio.volume = 0.3;
                audio.play().catch(function () { });
            } catch (e) { }
        });

        socket.on('disconnect', function (reason) {
            console.log('[Socket] Disconnected:', reason);
        });

        socket.on('connect_error', function (err) {
            // Suppress verbose console warning if error is due to page unloading or BFCache suspension
            if (document.visibilityState === 'hidden') return;
            console.warn('[Socket] Connection info:', err.message || err);
        });

        // Handle BFCache (Back-Forward Cache) events gracefully
        window.addEventListener('pageshow', function (e) {
            if (e.persisted && socket && !socket.connected) {
                socket.connect();
            }
        });

        // Store reference globally for cleanup if needed
        window.__orderSocket = socket;
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            requestNotificationPermission();
            initSocketConnection();
        });
    } else {
        requestNotificationPermission();
        initSocketConnection();
    }
})();

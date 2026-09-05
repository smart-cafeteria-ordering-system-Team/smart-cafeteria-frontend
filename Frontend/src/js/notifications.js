(function () {
    const API_URL = 'https://smart-cafeteria-frontend.onrender.com/api/v1/notifications';

    function getToken() {
        return localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
    }

    function escapeHtml(value) {
        const element = document.createElement('div');
        element.textContent = value == null ? '' : String(value);
        return element.innerHTML;
    }

    async function request(path, options) {
        const response = await fetch(API_URL + path, {
            ...options,
            headers: {
                Authorization: `Bearer ${getToken()}`,
                ...(options && options.headers)
            }
        });
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await response.json() : {};
        if (!response.ok || !data.success) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        return data;
    }

    async function loadNotifications() {
        const container = document.querySelector('#notifications-container, #notificationsContainer, .card-body');
        if (!container) return;

        if (!getToken()) {
            container.innerHTML = '<div class="alert alert-warning my-3" role="alert">Please <a href="../common/login.html">log in</a> to view your order notifications.</div>';
            return;
        }

        try {
            const data = await request('');
            const notifications = data.notifications || [];
            if (!notifications.length) {
                container.innerHTML = '<div class="text-center py-5 text-muted"><i class="fa-regular fa-bell-slash fs-1 d-block mb-2"></i><p class="mb-0">No notifications yet. You will get notified when your order status updates!</p></div>';
                return;
            }

            container.innerHTML = `<div class="list-group list-group-flush mt-3">${notifications.map((notification) => `
                <div class="list-group-item d-flex justify-content-between align-items-start p-3 ${notification.isRead ? 'bg-light' : 'bg-white border-start border-warning border-4'} mb-2 rounded shadow-sm notification-item" data-id="${escapeHtml(notification.id)}">
                    <div class="ms-2 me-auto">
                        <div class="fw-bold fs-6 text-dark">${escapeHtml(notification.title)}</div>
                        <div class="text-secondary small mt-1">${escapeHtml(notification.message)}</div>
                        <small class="text-muted mt-2 d-block">${escapeHtml(new Date(notification.createdAt).toLocaleString())}</small>
                    </div>
                    <button class="btn btn-sm btn-link text-muted delete-notification" title="Delete notification" aria-label="Delete notification"><i class="fa-solid fa-trash-can"></i></button>
                </div>`).join('')}</div>`;

            container.querySelectorAll('.notification-item').forEach((item) => {
                item.addEventListener('click', async (event) => {
                    if (event.target.closest('.delete-notification')) return;
                    await request(`/${encodeURIComponent(item.dataset.id)}/read`, { method: 'PATCH' });
                    loadNotifications();
                });
                item.querySelector('.delete-notification').addEventListener('click', async () => {
                    await request(`/${encodeURIComponent(item.dataset.id)}`, { method: 'DELETE' });
                    loadNotifications();
                });
            });
        } catch (error) {
            console.error('Failed to load notifications:', error);
            container.innerHTML = '<div class="text-center py-5 text-muted"><p>Unable to load notifications right now.</p></div>';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        loadNotifications();
        const markAllReadButton = document.getElementById('mark-all-read-btn');
        if (markAllReadButton) {
            markAllReadButton.addEventListener('click', async () => {
                await request('/read-all', { method: 'PUT' });
                loadNotifications();
            });
        }
        const clearAllButton = document.getElementById('clear-notifications-btn');
        if (clearAllButton) {
            clearAllButton.addEventListener('click', async () => {
                await request('/clear-all', { method: 'DELETE' });
                loadNotifications();
            });
        }
    });
})();

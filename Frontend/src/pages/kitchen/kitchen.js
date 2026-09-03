/**
 * Kitchen Display System (KDS) - Phase 5 Full Integration
 * ================================================================
 * - Fetches live orders from GET /api/v1/orders/kitchen (pending/preparing/ready)
 * - Sends status updates via PATCH /api/v1/orders/:id/status
 * - Auto-refresh polling (every 12s), manual refresh button
 * - Graceful error handling (toasts, 403/401 handling)
 *
 * Supports two layouts:
 *   1. Table view   -> #kitchenOrdersBody (kitchen/orders.html)
 *   2. Grid view    -> #kitchenTicketsGrid + stats (kitchen/dashboard.html)
 */

(function () {
    'use strict';

    const API_BASE_URL = 'http://localhost:5000/api/v1';
    const POLL_INTERVAL_MS = 12000;

    const STATUS_LABELS = {
        pending: 'Pending',
        preparing: 'Preparing',
        ready: 'Ready',
        served: 'Completed',
        completed: 'Completed',
        cancelled: 'Cancelled'
    };

    // What each active status advances to when the kitchen presses the action button.
    const NEXT_STATUS = {
        pending: 'preparing',
        preparing: 'ready',
        ready: 'served'
    };

    const ACTION_LABELS = {
        preparing: 'Start Prep',
        ready: 'Mark Ready',
        served: 'Complete Order'
    };

    let orders = [];
    let currentFilter = 'all';
    let loading = false;

    function getToken() {
        return localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
    }

    const getRole = () => {
        const raw = (localStorage.getItem('userRole') || localStorage.getItem('role') || '').toLowerCase();
        if (raw === 'admin') return 'admin';
        if (raw === 'staff' || raw === 'kitchen_staff' || raw === 'kitchen' || raw === 'kitchen staff') return 'kitchen';
        return '';
    };

    const getElapsedMinutes = (dateStr) => {
        const start = new Date(dateStr).getTime();
        if (Number.isNaN(start)) return '--';
        const mins = Math.max(0, Math.floor((Date.now() - start) / 60000));
        return `${String(mins).padStart(2, '0')} mins`;
    };

    const displayStatus = (rawStatus) => {
        const s = String(rawStatus || 'pending').toLowerCase();
        return s === 'served' ? 'completed' : s;
    };

    function normalizeOrder(raw) {
        if (!raw) return null;
        const status = displayStatus(raw.status || raw.orderStatus || 'pending');
        const items = Array.isArray(raw.items)
            ? raw.items.map((it) => ({
                  name: it.title || it.name || it.foodItem || it.itemId || 'Item',
                  qty: Number(it.quantity) || 1,
                  notes: it.notes || ''
              }))
            : [];

        return {
            id: String(raw.orderId || raw.orderNumber || raw._id || raw.id || ''),
            customerName: raw.customerName || 'Customer',
            items,
            status,
            statusLabel: STATUS_LABELS[status] || 'Pending',
            createdAt: raw.orderTime || raw.createdAt || raw.orderDate || new Date().toISOString(),
            readyTime: raw.readyTime || null,
            preparingTime: raw.preparingTime || null,
            orderType: (raw.orderType || 'dine-in').toLowerCase() === 'takeaway' ? 'Takeaway' : 'Dine-In',
            tableNumber: raw.tableNumber || '-',
            totalAmount: Number(raw.totalAmount) || 0,
            paymentMethod: raw.paymentMethod || ''
        };
    }

    // =========== API ===========

    async function fetchKitchenOrders() {
        const token = getToken();
        if (!token) {
            handleAuthFailure();
            return null;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/orders/kitchen`, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const err = new Error(data?.error || data?.message || 'Failed to load kitchen orders');
                err.status = response.status;
                throw err;
            }

            return (data?.orders || []).map(normalizeOrder).filter(Boolean);
        } catch (error) {
            handleApiError(error, 'load');
            return null;
        }
    }

    async function updateOrderStatus(orderId, nextStatus, button) {
        const token = getToken();
        if (!token) {
            handleAuthFailure();
            return;
        }

        if (button) {
            button.disabled = true;
            const original = button.innerHTML;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
            button.dataset.original = original;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: nextStatus })
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const err = new Error(data?.error || data?.message || 'Failed to update status');
                err.status = response.status;
                throw err;
            }

            toast(`Order #${orderId} moved to ${(STATUS_LABELS[nextStatus] || nextStatus).toLowerCase()}`, 'success');
            await refreshOrders(true);
        } catch (error) {
            if (button) {
                button.disabled = false;
                button.innerHTML = button.dataset.original || '';
            }
            handleApiError(error, 'update');
        }
    }

    // =========== REFRESH ===========

    async function refreshOrders({ silent } = {}) {
        if (loading) return;
        loading = true;
        setLoadingUI(true, silent);

        const fresh = await fetchKitchenOrders();
        loading = false;

        if (fresh) {
            orders = fresh;
            render();
            updateLastUpdated();
            setLoadingUI(false);
        } else {
            setLoadingUI(false, silent);
        }
    }

    function setLoadingUI(isLoading, silent) {
        const indicator = document.getElementById('refreshIndicator');
        if (!indicator) return;
        if (isLoading && !silent) {
            indicator.innerHTML = '<i class="fa-solid fa-rotate-right fa-spin"></i> Syncing...';
        } else {
            indicator.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#10b981;"></i> Live Sync Active';
        }
    }

    function updateLastUpdated() {
        const el = document.getElementById('lastUpdated');
        if (el) el.textContent = `Last updated ${new Date().toLocaleTimeString()}`;
    }

    // =========== RENDER (TABLE VIEW) ===========

    function getFilteredOrders() {
        if (!currentFilter || currentFilter.toLowerCase() === 'all') return orders;
        if (currentFilter.toLowerCase() === 'cancelled') {
            // The kitchen queue endpoint only returns active orders.
            return [];
        }
        return orders.filter((o) => o.status === currentFilter.toLowerCase());
    }

    function renderTable() {
        const tableBody = document.getElementById('kitchenOrdersBody');
        if (!tableBody) return;

        const filtered = getFilteredOrders();

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #94a3b8; padding: 32px;">
                        <i class="fa-solid fa-utensils" style="margin-right:8px;"></i>
                        No <strong>${currentFilter === 'all' ? 'active' : currentFilter}</strong> orders in the queue.
                    </td>
                </tr>`;
            return;
        }

        tableBody.innerHTML = filtered.map((order) => {
            const itemsFormatted = order.items
                .map((i) => `${i.qty}x ${i.name}${i.notes ? ` <small style="color:#94a3b8">(${i.notes})</small>` : ''}`)
                .join('<br>');

            return `
                <tr data-order-id="${order.id}">
                    <td><strong>#${order.id}</strong></td>
                    <td>${escapeHtml(order.customerName)}</td>
                    <td>${itemsFormatted}</td>
                    <td><span class="badge ${getBadgeClass(order.status)}">${order.statusLabel}</span></td>
                    <td class="elapsed-timer" data-created="${order.createdAt}">${getElapsedMinutes(order.createdAt)}</td>
                    <td>${getTableActionButton(order)}</td>
                </tr>
            `;
        }).join('');
    }

    function getTableActionButton(order) {
        const next = NEXT_STATUS[order.status];
        if (!next) {
            return `<span style="color:#94a3b8; font-size:0.85rem;">Done</span>`;
        }
        return `<button class="btn js-action-btn" data-id="${order.id}" data-next-status="${next}">
                    <i class="fa-solid fa-${getActionIcon(next)}"></i> ${ACTION_LABELS[next]}
                </button>`;
    }

    // =========== RENDER (GRID / DASHBOARD VIEW) ===========

    function renderGrid() {
        const grid = document.getElementById('kitchenTicketsGrid');
        if (!grid) return;

        // Stats
        const pendingCount = document.getElementById('pendingCount');
        const preparingCount = document.getElementById('preparingCount');
        const readyCount = document.getElementById('readyCount');
        const counts = orders.reduce((acc, o) => {
            acc[o.status] = (acc[o.status] || 0) + 1;
            return acc;
        }, {});
        if (pendingCount) pendingCount.textContent = counts.pending || 0;
        if (preparingCount) preparingCount.textContent = counts.preparing || 0;
        if (readyCount) readyCount.textContent = counts.ready || 0;

        if (orders.length === 0) {
            grid.innerHTML = `
                <div class="order-card" style="grid-column: 1 / -1; text-align: center; padding: 48px; border-left-color: #cbd5e1;">
                    <i class="fa-solid fa-mug-hot" style="font-size: 2.5rem; color: #94a3b8; margin-bottom: 12px; display:block;"></i>
                    <h3 style="margin: 0 0 6px 0;">No Active Orders</h3>
                    <p style="color: #6b7280; margin: 0;">New student orders will appear here automatically.</p>
                </div>`;
            return;
        }

        grid.innerHTML = orders.map((order) => {
            const itemsFormatted = order.items
                .map(
                    (i) => `
                        <div class="item">
                            <span class="qty">${i.qty}x ${escapeHtml(i.name)}</span>
                            ${i.notes ? `<small style="color:#6b7280;">(${escapeHtml(i.notes)})</small>` : ''}
                        </div>`
                )
                .join('');

            return `
                <div class="order-card" data-order-id="${order.id}">
                    <div class="order-header">
                        <div>
                            <span class="order-id">#${order.id}</span>
                            <div style="font-size:0.8rem; color:#6b7280; margin-top:2px;">${escapeHtml(order.customerName)}</div>
                        </div>
                        <span class="order-status ${order.status}">${order.statusLabel}</span>
                    </div>
                    <div style="font-size:0.75rem; color:#6b7280; margin-bottom:8px;">
                        <i class="fa-solid fa-table"></i> ${escapeHtml(order.tableNumber)}
                        &nbsp;·&nbsp; ${order.orderType}
                        &nbsp;·&nbsp; <span class="ticket-elapsed" data-created="${order.createdAt}">${getElapsedMinutes(order.createdAt)}</span>
                    </div>
                    <div class="order-items">${itemsFormatted}</div>
                    <div class="order-total" style="font-size:0.95rem;">
                        ETB ${order.totalAmount.toFixed(2)}
                        ${order.paymentMethod ? `<span style="font-size:0.75rem; color:#6b7280; font-weight:400;">(${escapeHtml(order.paymentMethod)})</span>` : ''}
                    </div>
                    ${getGridActionButtons(order)}
                </div>
            `;
        }).join('');
    }

    function getGridActionButtons(order) {
        const next = NEXT_STATUS[order.status];
        if (!next) {
            return `<div class="order-actions">
                        <span class="btn" style="flex:1; text-align:center; background:#334155; color:#94a3b8; cursor:default;">Complete</span>
                    </div>`;
        }
        return `
            <div class="order-actions">
                <button class="btn js-action-btn" data-id="${order.id}" data-next-status="${next}"
                        style="background:#f97316; color:#fff; border:none;">
                    <i class="fa-solid fa-${getActionIcon(next)}"></i> ${ACTION_LABELS[next]}
                </button>
            </div>`;
    }

    function getActionIcon(nextStatus) {
        switch (nextStatus) {
            case 'preparing': return 'fire';
            case 'ready': return 'check';
            case 'served': return 'box-archive';
            default: return 'arrow-right';
        }
    }

    // =========== RENDER DISPATCH ===========

    function render() {
        const tableBody = document.getElementById('kitchenOrdersBody');
        const grid = document.getElementById('kitchenTicketsGrid');

        if (tableBody) {
            renderTable();
        } else if (grid) {
            renderGrid();
        }

        updateElapsedTimers();
    }

    // =========== UI HELPERS ===========

    function getBadgeClass(status) {
        switch (status) {
            case 'pending': return 'badge-pending';
            case 'preparing': return 'badge-preparing';
            case 'ready': return 'badge-ready';
            case 'completed': return 'badge-served';
            case 'cancelled': return 'badge-cancelled';
            default: return '';
        }
    }

    function updateElapsedTimers() {
        document.querySelectorAll('.elapsed-timer, .ticket-elapsed').forEach((el) => {
            const created = el.dataset.created;
            if (created) el.textContent = getElapsedMinutes(created);
        });
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // =========== TOASTS & ERRORS ===========

    function ensureToastContainer() {
        let container = document.getElementById('kdsToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'kdsToastContainer';
            container.style.cssText = 'position:fixed; top:16px; right:16px; z-index:9999; display:flex; flex-direction:column; gap:8px; max-width:320px;';
            document.body.appendChild(container);
        }
        return container;
    }

    function toast(message, type = 'info') {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        const container = ensureToastContainer();
        const toastEl = document.createElement('div');
        toastEl.style.cssText = `background:#1f2937; color:#fff; padding:12px 16px; border-radius:8px; border-left:5px solid ${colors[type] || colors.info}; box-shadow:0 4px 12px rgba(0,0,0,0.25); font-size:0.85rem; animation: kdsFadeIn 0.2s ease;`;
        toastEl.innerHTML = message;

        // Simple fade-in keyframe
        if (!document.getElementById('kdsToastKeyframes')) {
            const style = document.createElement('style');
            style.id = 'kdsToastKeyframes';
            style.textContent = '@keyframes kdsFadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0);} }';
            document.head.appendChild(style);
        }

        container.appendChild(toastEl);
        setTimeout(() => toastEl.remove(), 4000);
    }

    function handleApiError(error, phase) {
        console.error(`Kitchen KDS ${phase} error:`, error);

        if (error.status === 401) {
            handleAuthFailure();
            return;
        }

        if (error.status === 403) {
            showAccessDenied();
            toast(
                '<i class="fa-solid fa-shield-halved"></i> Forbidden — kitchen/admin access required. Log back in as kitchen staff.',
                'error'
            );
            return;
        }

        toast(
            `<i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(error.message || 'Network error - check your connection')}`,
            'error'
        );
    }

    function showAccessDenied() {
        const grid = document.getElementById('kitchenTicketsGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="order-card" style="grid-column: 1 / -1; text-align: center; padding: 48px; border-left-color: #ef4444;">
                    <i class="fa-solid fa-shield-halved" style="font-size: 2.5rem; color: #ef4444; margin-bottom: 12px; display:block;"></i>
                    <h3 style="margin: 0 0 6px 0;">Access Denied</h3>
                    <p style="color: #6b7280; margin: 0 0 16px 0;">Only kitchen staff and admins can view the kitchen queue.</p>
                    <a href="../common/login.html" class="btn" style="text-decoration:none;">Go to Login</a>
                </div>`;
        }
    }

    function handleAuthFailure() {
        toast('<i class="fa-solid fa-user-lock"></i> Please log in to continue.', 'warning');
        localStorage.removeItem('auth_token');
        setTimeout(() => {
            window.location.href = '../common/login.html';
        }, 800);
    }

    // =========== EVENTS ===========

    function bindEvents() {
        // Filter buttons (table view)
        document.querySelectorAll('.filter-group .btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.filter-group .btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.getAttribute('data-status') || btn.innerText.trim();
                render();
            });
        });

        // Manual refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                refreshOrders({ silent: true }).then(() => {
                    toast('<i class="fa-solid fa-rotate-right"></i> Queue refreshed', 'info');
                });
            });
        }

        // Action buttons (delegated - works for table AND grid)
        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.js-action-btn');
            if (!actionBtn || actionBtn.disabled) return;

            const orderId = actionBtn.dataset.id;
            const nextStatus = actionBtn.dataset.nextStatus;
            if (!orderId || !nextStatus) return;

            updateOrderStatus(orderId, nextStatus, actionBtn);
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                localStorage.removeItem('role');
                localStorage.removeItem('userProfile');
                localStorage.removeItem('current_user');
                window.location.href = '../common/login.html?role=kitchen';
            });
        }

        // Elapsed timer ticks
        setInterval(updateElapsedTimers, 30000);
    }

    function startPolling() {
        if (pollHandle) clearInterval(pollHandle);
        pollHandle = setInterval(() => {
            refreshOrders({ silent: true });
        }, POLL_INTERVAL_MS);
    }

    // =========== INIT ===========

    function init() {
        if (!getToken()) {
            handleAuthFailure();
            return;
        }

        bindEvents();
        refreshOrders();
        startPolling();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
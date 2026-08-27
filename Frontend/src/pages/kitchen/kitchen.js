/**
 * Kitchen Display System (KDS) Module
 * Features: Working Status Filters, State Progression, Dynamic Elapsed Time
 */

document.addEventListener('DOMContentLoaded', () => {
    KDS.init();
});

const KDS = {
    // In-memory mock order data (Replace with database/API endpoint)
    orders: [
        {
            id: '1042',
            customer: 'John Doe',
            items: [
                { name: 'Cheese Burger', qty: 2, notes: 'No onions' },
                { name: 'French Fries', qty: 1, notes: 'Extra crispy' }
            ],
            status: 'Preparing',
            createdAt: new Date(Date.now() - 8 * 60000)
        },
        {
            id: '1043',
            customer: 'Abebe Bikila',
            items: [
                { name: 'Veggie Pizza', qty: 1, notes: '' },
                { name: 'Coca Cola', qty: 2, notes: 'Ice only' }
            ],
            status: 'Pending',
            createdAt: new Date(Date.now() - 2 * 60000)
        },
        {
            id: '1044',
            customer: 'Sara Tadesse',
            items: [
                { name: 'Chicken Wings', qty: 12, notes: 'Spicy' }
            ],
            status: 'Ready',
            createdAt: new Date(Date.now() - 15 * 60000)
        }
    ],

    currentFilter: 'all',

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.render();
        this.startTimer();
    },

    cacheDOM() {
        this.tableBody = document.getElementById('kitchenOrdersBody');
        // Targets buttons inside .filter-group
        this.filterButtons = document.querySelectorAll('.filter-group .btn');
    },

    bindEvents() {
        // FILTER BUTTON CLICK EVENT
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.currentTarget;
                
                // Update active button styling
                this.filterButtons.forEach(b => b.classList.remove('active'));
                targetBtn.classList.add('active');


                // Read filter status (e.g., "all", "Pending", "Preparing", "Ready", "Cancelled")
                this.currentFilter = targetBtn.getAttribute('data-status') || targetBtn.innerText.trim();
                
                // Re-render UI with filtered data
                this.render();
            });
        });

        // ACTION BUTTON CLICK EVENT (Delegated)
        if (this.tableBody) {
            this.tableBody.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('.js-action-btn');
                if (!actionBtn) return;

                const orderId = actionBtn.dataset.id;
                const nextStatus = actionBtn.dataset.nextStatus;
                this.updateOrderStatus(orderId, nextStatus);
            });
        }
    },

    // Filter logic handling case-insensitive status matching
    getFilteredOrders() {
        if (!this.currentFilter || this.currentFilter.toLowerCase() === 'all') {
            // Exclude completed or archived orders from active view if needed
            return this.orders.filter(order => order.status !== 'Completed');
        }
        
        return this.orders.filter(order => 
            order.status.toLowerCase() === this.currentFilter.toLowerCase()
        );
    },

    getElapsedTime(createdAt) {
        const diffMs = new Date() - new Date(createdAt);
        const diffMins = Math.floor(diffMs / 60000);
        return `${String(diffMins).padStart(2, '0')} mins`;
    },

    updateOrderStatus(orderId, newStatus) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            this.render();
        }
    },

    render() {
        if (!this.tableBody) return;

        const filtered = this.getFilteredOrders();

        if (filtered.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">
                        No <strong>${this.currentFilter}</strong> orders found in queue.
                    </td>
                </tr>`;
            return;
        }

        this.tableBody.innerHTML = filtered.map(order => {
            const itemsFormatted = order.items
                .map(i => `${i.qty}x ${i.name}${i.notes ? ` <small style="color:var(--text-muted)">(${i.notes})</small>` : ''}`)
                .join(', ');

            const badgeClass = this.getBadgeClass(order.status);
            const actionButton = this.getActionButtonHTML(order);

            return `
                <tr data-order-id="${order.id}">
                    <td><strong>#${order.id}</strong></td>
                    <td>${order.customer}</td>
                    <td>${itemsFormatted}</td>
                    <td><span class="badge ${badgeClass}">${order.status}</span></td>
                    <td class="elapsed-timer" data-created="${order.createdAt}">${this.getElapsedTime(order.createdAt)}</td>
                    <td>${actionButton}</td>
                </tr>
            `;
        }).join('');
    },

    getBadgeClass(status) {
        switch (status) {
            case 'Pending': return 'badge-pending';
            case 'Preparing': return 'badge-preparing';
            case 'Ready': return 'badge-ready';
            case 'Cancelled': return 'badge-cancelled';
            default: return '';
        }
    },

    getActionButtonHTML(order) {
        if (order.status === 'Pending') {
            return `<button class="btn js-action-btn" data-id="${order.id}" data-next-status="Preparing">
                        <i class="fa-solid fa-fire"></i> Start Prep
                    </button>`;
        } else if (order.status === 'Preparing') {
            return `<button class="btn js-action-btn" data-id="${order.id}" data-next-status="Ready">
                        <i class="fa-solid fa-check"></i> Mark Ready
                    </button>`;
        } else if (order.status === 'Ready') {
            return `<button class="btn js-action-btn" data-id="${order.id}" data-next-status="Completed">
                        <i class="fa-solid fa-box-archive"></i> Complete
                    </button>`;
        }
        return `<span style="color: var(--text-muted); font-size: 0.85rem;">Done</span>`;
    },

    startTimer() {
        setInterval(() => {
            
            const timerElements = document.querySelectorAll('.elapsed-timer');
            timerElements.forEach(el => {
                const createdAt = el.dataset.created;
                if (createdAt) {
                    el.textContent = this.getElapsedTime(createdAt);
                }
            });
        }, 30000); // Check every 30 seconds
    }
};
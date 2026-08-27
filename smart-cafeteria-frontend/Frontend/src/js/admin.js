document.addEventListener("DOMContentLoaded", () => {
    // 1. Protection Check (Client-Side)
    verifyAdminAuthentication();

    // 2. UI Event Bindings
    initSidebarToggle();
    initLogout();

    // 3. Load & Render Initial Dashboard Analytics
    loadDashboardData();

    // Manual Refresh Event
    const refreshBtn = document.getElementById("refreshMetricsBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadDashboardData();
        });
    }
});

/**
 * Verify logged in user has administrator role
 */
function verifyAdminAuthentication() {
    const userJson = localStorage.getItem("user") || localStorage.getItem("loggedUser");
    if (!userJson) {
        // Fallback redirection if no authentication token/user is present
        // window.location.href = "../auth/login.html";
        return;
    }

    try {
        const user = JSON.parse(userJson);
        if (user.role !== "admin") {
            alert("Unauthorized access. Admin privileges required.");
            window.location.href = "../menu.html";
            return;
        }

        // Populate user UI
        const nameDisplay = document.getElementById("adminNameDisplay");
        const avatar = document.getElementById("adminAvatar");
        if (nameDisplay) nameDisplay.textContent = user.name || "Admin";
        if (avatar && user.name) avatar.textContent = user.name.charAt(0).toUpperCase();

    } catch (err) {
        console.error("Auth Verification Error:", err);
    }
}

/**
 * Sidebar drawer toggle for mobile responsiveness
 */
function initSidebarToggle() {
    const toggleBtn = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("adminSidebar");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }
}

/**
 * Handle system logout
 */
function initLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to log out of the admin panel?")) {
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                window.location.href = "../auth/login.html";
            }
        });
    }
}

/**
 * Retrieve & calculate dashboard metrics from LocalStorage (or backend API)
 */
function loadDashboardData() {
    const ordersHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
    const latestOrder = JSON.parse(localStorage.getItem("latestOrder"));
    const refundsList = JSON.parse(localStorage.getItem("cafeteriaRefunds")) || [];

    // Consolidate order array
    let allOrders = [...ordersHistory];
    if (latestOrder) {
        const latestId = latestOrder.orderId || latestOrder.id;
        const exists = allOrders.some(o => (o.orderId || o.id) === latestId);
        if (!exists) allOrders.unshift(latestOrder);
    }

    // Calculations
    let totalSales = 0;
    let pendingOrdersCount = 0;

    allOrders.forEach(order => {
        const status = (order.status || "Pending").toLowerCase();
        const total = parseFloat(order.totalAmount) || parseFloat(order.subtotal) || 0;

        if (status !== "cancelled") {
            totalSales += total;
        }

        if (status === "pending" || status === "in progress" || status === "preparing") {
            pendingOrdersCount++;
        }
    });

    // Count pending refunds
    const pendingRefundsCount = refundsList.filter(r => (r.status || "Pending").toLowerCase() === "pending").length;

    // Update UI Elements
    document.getElementById("metricSales").innerHTML = `${totalSales.toFixed(0)} <small>ETB</small>`;
    document.getElementById("metricOrders").textContent = allOrders.length;
    document.getElementById("metricPending").textContent = pendingOrdersCount;
    document.getElementById("metricRefunds").textContent = pendingRefundsCount;

    // Update Refund Sidebar Badge
    const refundBadge = document.getElementById("sidebarRefundBadge");
    if (refundBadge) {
        refundBadge.textContent = pendingRefundsCount;
        refundBadge.style.display = pendingRefundsCount > 0 ? "inline-block" : "none";
    }

    // Render Sub-Components
    renderRecentOrders(allOrders.slice(0, 5));
    renderPopularFoods(allOrders);
}

/**
 * Render recent orders table
 */
function renderRecentOrders(recentOrders) {
    const tbody = document.getElementById("recentOrdersTableBody");
    if (!tbody) return;

    if (recentOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #9ca3af;">No recent orders recorded.</td></tr>`;
        return;
    }

    tbody.innerHTML = recentOrders.map(order => {
        const id = order.orderId || order.id || "ET-0000";
        const customer = order.customerName || order.name || "Customer";
        const amount = order.totalAmount || order.subtotal || 0;
        const paymentStatus = order.paymentStatus || "Paid";
        const orderStatus = order.status || "Pending";

        return `
            <tr>
                <td><strong>#${id}</strong></td>
                <td>${customer}</td>
                <td>${amount} ETB</td>
                <td><span class="status-pill ${paymentStatus.toLowerCase()}">${paymentStatus}</span></td>
                <td><span class="status-pill ${orderStatus.toLowerCase()}">${orderStatus}</span></td>
                <td>
                    <a href="orders.html?orderId=${id}" class="link-btn">Details</a>
                </td>
            </tr>
        `;
    }).join("");
}

/**
 * Extract and render top popular foods
 */
function renderPopularFoods(orders) {
    const popularList = document.getElementById("popularFoodsList");
    if (!popularList) return;

    const itemCounts = {};

    orders.forEach(order => {
        if (Array.isArray(order.items)) {
            order.items.forEach(item => {
                const name = item.name || "Unknown Item";
                const qty = parseInt(item.quantity) || 1;
                itemCounts[name] = (itemCounts[name] || 0) + qty;
            });
        }
    });

    const sortedItems = Object.keys(itemCounts)
        .map(name => ({ name, count: itemCounts[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

    if (sortedItems.length === 0) {
        popularList.innerHTML = `<li style="text-align:center; color: #9ca3af; padding: 10px;">No food analytics yet.</li>`;
        return;
    }

    popularList.innerHTML = sortedItems.map((item, index) => `
        <li class="popular-item">
            <div class="popular-item-info">
                <span class="item-rank">${index + 1}</span>
                <strong>${item.name}</strong>
            </div>
            <span style="font-size: 0.85rem; color: #6b7280; font-weight: 600;">${item.count} orders</span>
        </li>
    `).join("");
}
document.addEventListener("DOMContentLoaded", () => {
    // 1. Protection Check (Client-Side)
    verifyAdminAuthentication();

    // 2. UI Event Bindings
    initSidebarToggle();
    initLogout();

    // 3. Load & Render Initial Dashboard Analytics (live backend data).
    //    Only runs on the dashboard page (guarded below inside loadDashboardData).
    loadDashboardData();

    // 4. Refresh the cancellations sidebar badge on every admin page.
    updateSidebarBadge();

    // Manual Refresh Event
    const refreshBtn = document.getElementById("refreshMetricsBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadDashboardData();
        });
    }
});

/**
 * Update the red Cancellations badge in the sidebar. The badge is shown only
 * when there are pending cancellations (> 0) and fully hidden otherwise.
 */
async function updateSidebarBadge() {
    const badgeEl = document.getElementById("sidebarCancellationBadge") ||
        document.querySelector('.nav-link[href*="cancellations"] .badge');
    if (!badgeEl) return;

    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    if (!token) return;

    try {
        const res = await fetch("http://localhost:5000/api/v1/cancellations/stats", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success || !data.stats) return;

        const pendingCount = data.stats.pendingApproval || data.stats.pendingCount || 0;
        badgeEl.textContent = pendingCount;
        badgeEl.style.display = pendingCount > 0 ? "inline-block" : "none";
    } catch (error) {
        console.error("Error updating sidebar badge:", error);
    }
}

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
function handleAdminLogout() {
    // Clear session and auth tokens
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("role");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("isLoggedIn");
    sessionStorage.clear();

    // Determine clean relative path to login page regardless of server root depth
    const currentPath = window.location.pathname;

    if (currentPath.includes('/pages/')) {
        // If currently inside a subfolder like /pages/admin/
        window.location.href = '../common/login.html';
    } else {
        // Fallback standard relative redirect
        window.location.href = '/src/pages/common/login.html';
    }
}

function initLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to log out of the admin panel?")) {
                handleAdminLogout();
            }
        });
    }
}

/**
 * Retrieve & calculate dashboard metrics from the live backend API
 * GET /api/v1/admin/dashboard (aggregate stats)
 * GET /api/v1/admin/dashboard/recent-orders (latest orders)
 */
async function loadDashboardData() {
    const api = window.AdminAPI;
    if (!api) return;

    // Only run on the dashboard page (does nothing on other admin pages)
    if (!document.getElementById("metricSales")) return;

    try {
        const [statsRes, recentRes] = await Promise.all([
            api.get("/admin/dashboard"),
            api.get("/admin/dashboard/recent-orders", { limit: 6 })
        ]);

        const d = statsRes && statsRes.data ? statsRes.data : {};
        const revenue = d.revenue || {};
        const orders = d.orders || {};
        const cancellations = d.cancellations || {};

        // Use the new top-level dashboard fields when present (fall back to legacy paths)
        const totalSales = Number(d.totalSales !== undefined ? d.totalSales : (revenue.today || revenue.total || 0));
        const totalOrdersToday = Number(d.totalOrdersToday !== undefined ? d.totalOrdersToday : (orders.total || 0));
        const pendingOrdersCount = Number(d.pendingOrders !== undefined ? d.pendingOrders : (orders.pending || 0));
        const pendingRefundsCount = Number(d.pendingRefunds !== undefined ? d.pendingRefunds : (cancellations.pending || 0));

        // Update metric cards
        const todayEl = document.getElementById("metricSales");
        if (todayEl) todayEl.innerHTML = `${totalSales.toLocaleString()} <small>ETB</small>`;

        const totalOrdersEl = document.getElementById("metricOrders");
        if (totalOrdersEl) totalOrdersEl.textContent = totalOrdersToday.toLocaleString();

        const pendingEl = document.getElementById("metricPending");
        if (pendingEl) pendingEl.textContent = pendingOrdersCount.toLocaleString();

        const refundsEl = document.getElementById("metricRefunds");
        if (refundsEl) refundsEl.textContent = pendingRefundsCount.toLocaleString();

        // Update Refund Sidebar Badge
        const refundBadge = document.getElementById("sidebarRefundBadge") ||
            document.getElementById("sidebarCancellationBadge");
        if (refundBadge) {
            refundBadge.textContent = pendingRefundsCount;
            refundBadge.style.display = pendingRefundsCount > 0 ? "inline-block" : "none";
        }

        // Render recent orders table + popular foods from recent orders
        const recentOrders = (recentRes && recentRes.orders) || [];
        renderRecentOrders(recentOrders);
        renderPopularFoods(recentOrders);
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        const tbody = document.getElementById("recentOrdersTableBody");
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Could not load dashboard data from server.</td></tr>`;
        if (window.AdminToast) window.AdminToast.error("Failed to load dashboard: " + (error.message || "Server error"));
    }
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
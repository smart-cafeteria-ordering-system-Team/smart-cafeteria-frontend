/**
 * Dashboard Side Navigation Component (Admin & Kitchen)
 */
export function renderSidebar(activePage = "", containerId = "sidebar-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: "fa-chart-line", link: "dashboard.html" },
        { id: "orders", label: "Live Orders", icon: "fa-receipt", link: "orders.html" },
        { id: "menu", label: "Menu Management", icon: "fa-utensils", link: "menu.html" },
        { id: "categories", label: "Food Categories", icon: "fa-list", link: "categories.html" },
        { id: "reports", label: "Reports & Sales", icon: "fa-file-invoice", link: "reports.html" }
    ];

    const linksHtml = menuItems.map(item => `
        <a href="${item.link}" class="sidebar-link ${activePage === item.id ? 'active' : ''}">
            <i class="fa-solid ${item.icon}"></i>
            <span>${item.label}</span>
        </a>
    `).join("");

    container.innerHTML = `
        <aside class="app-sidebar">
            <div class="sidebar-brand">
                <h3>Cafeteria Admin</h3>
            </div>
            <nav class="sidebar-nav">
                ${linksHtml}
            </nav>
        </aside>
    `;
}
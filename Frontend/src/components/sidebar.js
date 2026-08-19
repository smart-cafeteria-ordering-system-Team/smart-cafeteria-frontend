/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - SIDEBAR COMPONENT
 * ================================================================
 * Pure UI Component - Renders a sidebar for admin/kitchen dashboards.
 * ================================================================
 */

/**
 * Create sidebar HTML
 * @param {Object} options - Sidebar configuration
 * @param {string} options.brandText - Brand text
 * @param {string} options.brandIcon - Brand icon class
 * @param {Array} options.navItems - [{ label, icon, href, active, badge }]
 * @param {Array} options.sections - Section groups [{ label, items: [] }]
 * @param {string} options.userRole - 'admin', 'kitchen', or 'customer'
 * @param {string} options.userName - User's name
 * @param {Function} options.onItemClick - Nav item click callback
 * @param {boolean} options.isOpen - Sidebar open state
 * @param {Function} options.onToggle - Toggle callback
 * @returns {string} Sidebar HTML
 */
export function createSidebar(options = {}) {
    const {
        brandText = 'SmartCafeteria',
        brandIcon = 'fas fa-utensils',
        navItems = [],
        sections = [],
        userRole = 'admin',
        userName = 'Admin',
        onItemClick = null,
        isOpen = true,
        onToggle = null,
    } = options;

    // ---- Build Nav Items ----
    const navItemsHTML = navItems.map(item => `
        <a href="${item.href}" class="nav-link ${item.active ? 'active' : ''}" data-href="${item.href}" style="display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:8px; color:#94a3b8; font-weight:500; text-decoration:none; transition:all 0.2s; cursor:pointer; ${item.active ? 'background:#2563eb; color:#ffffff;' : ''}">
            <i class="fas ${item.icon}" style="width:18px; text-align:center;"></i>
            <span>${item.label}</span>
            ${item.badge ? `<span class="badge" style="margin-left:auto; background:#dc2626; color:white; font-size:10px; font-weight:700; padding:1px 8px; border-radius:12px;">${item.badge}</span>` : ''}
        </a>
    `).join('');

    // ---- Build Sections ----
    const sectionsHTML = sections.map(section => {
        const itemsHTML = section.items.map(item => `
            <a href="${item.href}" class="nav-link ${item.active ? 'active' : ''}" data-href="${item.href}" style="display:flex; align-items:center; gap:10px; padding:8px 14px; border-radius:8px; color:#94a3b8; font-size:14px; font-weight:400; text-decoration:none; transition:all 0.2s; cursor:pointer; ${item.active ? 'background:#2563eb; color:#ffffff;' : ''}">
                <i class="fas ${item.icon}" style="width:18px; text-align:center;"></i>
                <span>${item.label}</span>
            </a>
        `).join('');

        return `
            <div class="nav-section" style="margin-top:8px;">
                <div class="nav-label" style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#64748b; padding:8px 14px 4px; font-weight:600;">
                    ${section.label}
                </div>
                ${itemsHTML}
            </div>
        `;
    }).join('');

    // ---- Role Icon ----
    const roleIcons = {
        admin: 'fa-shield-alt',
        kitchen: 'fa-utensil-spoon',
        customer: 'fa-user',
    };
    const roleIcon = roleIcons[userRole] || 'fa-user';
    const roleLabels = {
        admin: 'Administrator',
        kitchen: 'Kitchen Staff',
        customer: 'Customer',
    };

    // ---- Build Sidebar ----
    return `
        <aside class="admin-sidebar ${isOpen ? 'open' : ''}" style="position:fixed; top:0; left:0; bottom:0; width:260px; background:#0f172a; color:white; padding:20px 16px; overflow-y:auto; z-index:200; transition:transform 0.25s ease; ${!isOpen ? 'transform:translateX(-100%);' : ''}">
             <!-- Brand -->
            <div class="sidebar-brand" style="display:flex; align-items:center; gap:10px; font-size:20px; font-weight:700; color:white; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:16px;">
                <i class="${brandIcon}" style="color:#3b82f6;"></i>
                <span>${brandText}</span>
            </div>

            <!-- User Info -->
            <div style="display:flex; align-items:center; gap:10px; padding:8px 12px; background:rgba(255,255,255,0.04); border-radius:8px; margin-bottom:16px;">
                <div style="width:40px; height:40px; border-radius:50%; background:#2563eb; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:16px; color:white; flex-shrink:0;">
                    ${userName.charAt(0).toUpperCase()}
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:600; font-size:14px; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${userName}</div>
                    <div style="font-size:12px; color:#94a3b8;">
                        <i class="fas ${roleIcon}" style="margin-right:4px; font-size:11px;"></i>
                        ${roleLabels[userRole] || userRole}
                    </div>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="sidebar-nav" style="display:flex; flex-direction:column; gap:2px;">
                ${navItemsHTML}
                ${sectionsHTML}
            </nav>

            <!-- Toggle Button (Mobile) -->
            <button class="sidebar-toggle-btn" onclick="${typeof onToggle === 'function' ? onToggle.toString() + '()' : ''}" style="display:none; position:absolute; top:12px; right:12px; background:none; border:none; color:#94a3b8; font-size:20px; cursor:pointer;">
                <i class="fas fa-times"></i>
            </button>
        </aside>

        <!-- Overlay -->
        ${!isOpen ? '' : 
            <div class="sidebar-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:150; ${isOpen && window.innerWidth <= 1024 ? 'display:block;' : ''}" onclick="${typeof onToggle === 'function' ? onToggle.toString() + '()' : ''}"></div>
        }

        <!-- Sidebar Styles -->
        <style>
            .admin-sidebar .nav-link:hover {
                background: rgba(255,255,255,0.06);
                color: #ffffff;
            }
            .admin-sidebar .nav-link.active {
                background: #2563eb;
                color: #ffffff;
            }
            .admin-sidebar .nav-link .badge {
                background: #dc2626;
                color: white;
                font-size: 10px;
                font-weight: 700;
                padding: 1px 8px;
                border-radius: 12px;
                margin-left: auto;
            }
            @media (max-width: 1024px) {
                .admin-sidebar {
                    transform: translateX(-100%);
                }
                .admin-sidebar.open {
                    transform: translateX(0);
                }
                .admin-sidebar .sidebar-toggle-btn {
                    display: block !important;
                }
                .sidebar-overlay {
                    display: block !important;
                }
            }
            @media (min-width: 1025px) {
                .sidebar-overlay {
                    display: none !important;
                }
            }
        </style>

        <!-- Sidebar Script -->
        <script>
            (function() {
                const sidebar = document.querySelector('.admin-sidebar');
                const overlay = document.querySelector('.sidebar-overlay');
                const toggleBtn = document.querySelector('.sidebar-toggle-btn');

                ${typeof onToggle === 'function' ? 
                    window.toggleSidebar = ${onToggle.toString()};
                 : ''}
                 // Close sidebar when clicking overlay
                if (overlay) {
                    overlay.addEventListener('click', function() {
                        if (typeof window.toggleSidebar === 'function') {
                            window.toggleSidebar();
                        }
                    });
                }

                // Close sidebar on escape key
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
                        if (typeof window.toggleSidebar === 'function') {
                            window.toggleSidebar();
                        }
                    }
                });
            })();
        </script>
    `;
}

/**
 * Render sidebar to a container element
 * @param {string|Element} container - Container selector or element
 * @param {Object} options - Same as createSidebar options
 */
export function renderSidebar(container, options = {}) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) {
        console.warn('Sidebar container not found');
        return;
    }
    el.innerHTML = createSidebar(options);
}

export default {
    createSidebar,
    renderSidebar,
};
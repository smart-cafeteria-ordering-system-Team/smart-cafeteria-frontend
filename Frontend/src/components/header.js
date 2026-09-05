/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - HEADER COMPONENT
 * ================================================================
 * Pure UI Component - Renders the main header/navigation bar.
 * Receives data via parameters, no internal logic.
 * ================================================================
 */

/**
 * Create header HTML
 * @param {Object} options - Header configuration
 * @param {string} options.logoText - Logo text
 * @param {string} options.logoIcon - Logo icon class
 * @param {Array} options.navLinks - Navigation links [{ label, href, active }]
 * @param {Object} options.user - User data { name, role, avatar }
 * @param {boolean} options.isLoggedIn - Login status
 * @param {string} options.theme - 'light' or 'dark'
 * @param {string} options.language - 'en' or 'am'
 * @param {number} options.cartCount - Items in cart
 * @param {number} options.notificationCount - Unread notifications
 * @param {Object} options.authButtons - { loginLabel, registerLabel, loginHref, registerHref }
 * @param {Function} options.onToggleMenu - Mobile menu toggle callback
 * @param {Function} options.onToggleTheme - Theme toggle callback
 * @param {Function} options.onToggleLanguage - Language toggle callback
 * @param {Function} options.onLogout - Logout callback
 * @param {Function} options.onNotificationClick - Notification bell click callback
 * @returns {string} Header HTML
 */
export function createHeader(options = {}) {
    // ---- Defaults ----
    const {
        logoText = 'SmartCafeteria',
        logoIcon = 'fas fa-utensils',
        navLinks = [],
        user = null,
        isLoggedIn = false,
        theme = 'light',
        language = 'en',
        cartCount = 0,
        notificationCount = 0,
        authButtons = {
            loginLabel: 'Login',
            registerLabel: 'Register',
            loginHref: '/src/pages/common/login.html',
            registerHref: '/src/pages/common/register.html',
        },
        onToggleMenu = null,
        onToggleTheme = null,
        onToggleLanguage = null,
        onLogout = null,
        onNotificationClick = null,
    } = options;

    // ---- Build Nav Links ----
    const navLinksHTML = navLinks.map(link => `
        <a href="${link.href}" class="${link.active ? 'active' : ''}">
            ${link.label}
        </a>
    `).join('');

    // ---- User Section ----
    let userSectionHTML = '';
    if (isLoggedIn && user) {
        const roleLabels = {
            admin: 'Admin',
            kitchen: 'Kitchen Staff',
            customer: 'Customer',
        };
        const roleLabel = roleLabels[user.role] || user.role;

userSectionHTML = `
            <div class="user-menu" style="display:flex; align-items:center; gap:12px;">
                <button class="notification-btn" id="notificationBell" title="Notifications" style="position:relative; background:none; border:none; font-size:20px; color:#64748b; cursor:pointer; padding:8px; border-radius:50%; transition:background 0.2s;">
                    <i class="fas fa-bell"></i>
                    ${notificationCount > 0 ? `<span class="dot" style="position:absolute; top:4px; right:4px; width:8px; height:8px; background:#dc2626; border-radius:50%; border:2px solid white;"></span>` : ''}
                </button>

                <div class="admin-profile" style="display:flex; align-items:center; gap:8px; cursor:pointer; padding:4px 8px; border-radius:8px; transition:background 0.2s;">
                    <div class="avatar" style="width:36px; height:36px; border-radius:50%; background:#2563eb; color:white; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:14px;">
[8/15/2026 4:45 AM]                     ${user.avatar ? <img src="${user.avatar}" alt="${user.name}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;"> : user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style="text-align:left; line-height:1.3;">
                        <div style="font-weight:600; font-size:14px; color:#1e293b;">${user.name}</div>
                        <div style="font-size:11px; color:#64748b;">${roleLabel}</div>
                    </div>
                    <button class="logout-btn" onclick="${typeof onLogout === 'function' ? 'event.stopPropagation();' + onLogout.toString() + '()' : ''}" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:16px; padding:4px;" title="Logout">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
                <a id="backToAdminBtn" href="/src/pages/admin/dashboard.html" class="btn btn-outline-warning btn-sm ms-2 d-none">
                    <i class="bi bi-speedometer2"></i> Back to Admin
                </div>
    } else {
        userSectionHTML = 
            <div class="auth-buttons" style="display:flex; gap:8px;">
                <a href="${authButtons.loginHref}" class="btn btn-outline">${authButtons.loginLabel}</a>
                <a href="${authButtons.registerHref}" class="btn btn-primary">${authButtons.registerLabel}</a>
            </div>
        ;
    }

    // ---- Cart Icon ----
    const cartHTML = 
        <a href="/src/pages/customer/cart.html" class="cart-icon" style="position:relative; color:#64748b; font-size:20px; text-decoration:none; padding:4px;">
            <i class="fas fa-shopping-cart"></i>
            ${cartCount > 0 ? <span style="position:absolute; top:-6px; right:-8px; background:#dc2626; color:white; font-size:10px; font-weight:700; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center;">${cartCount}</span> : ''}
        </a>
    ;

    // ---- Theme & Language Toggles ----
    const themeIcon = theme === 'dark' ? 'fa-sun' : 'fa-moon';
    const themeLabel = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    const langLabel = language === 'en' ? 'አማ' : 'EN';

    // ---- Build Header ----
    return 
        <header class="header" style="background:var(--white); box-shadow:var(--shadow-xs); padding:12px 0; position:sticky; top:0; z-index:100; border-bottom:1px solid var(--gray-200);">
            <div class="container" style="display:flex; justify-content:space-between; align-items:center;">

                <!-- Logo -->
                <a href="/index.html" class="logo" style="display:flex; align-items:center; gap:10px; font-size:22px; font-weight:700; color:#2563eb; text-decoration:none;">
                    <i class="${logoIcon}"></i>
                    <span style="color:#1e293b;">${logoText}</span>
                </a>

                <!-- Mobile Menu Toggle -->
                <button class="menu-toggle" id="menuToggle" aria-label="Toggle navigation" style="display:none; font-size:24px; background:none; border:none; color:#1e293b; cursor:pointer; padding:4px;">
                    <i class="fas fa-bars"></i>
                </button>

                <!-- Navigation -->
                <nav class="nav" id="mainNav" style="display:flex; align-items:center; gap:24px;">
                    ${navLinksHTML}

                    <!-- Theme Toggle -->
                    <button class="theme-toggle" id="themeToggle" title="${themeLabel}" style="background:none; border:none; cursor:pointer; font-size:18px; color:#64748b; padding:4px; border-radius:50%; transition:background 0.2s;">
                        <i class="fas ${themeIcon}"></i>
                    </button>

                    <!-- Language Toggle -->
                    <button class="lang-toggle" id="langToggle" title="${language === 'en' ? 'Switch to Amharic' : 'Switch to English'}" style="background:none; border:none; cursor:pointer; font-weight:600; font-size:14px; color:#64748b; padding:4px 8px; border-radius:4px; transition:background 0.2s;">
                        ${langLabel}
                    </button>
                     <!-- Cart -->
                    ${cartHTML}

                    <!-- User Section -->
                    ${userSectionHTML}
                </nav>
            </div>
        </header>

        <!-- Mobile Menu Script -->
        <script>
            (function() {
                const toggle = document.getElementById('menuToggle');
                const nav = document.getElementById('mainNav');
                if (toggle && nav) {
                    toggle.addEventListener('click', function(e) {
                        e.stopPropagation();
                        nav.classList.toggle('open');
                    });
                    document.addEventListener('click', function(e) {
                        if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
                            nav.classList.remove('open');
                        }
                    });
                }
                ${typeof onToggleTheme === 'function' ? document.getElementById('themeToggle')?.addEventListener('click', ${onToggleTheme.toString()}); : ''}
                ${typeof onToggleLanguage === 'function' ? document.getElementById('langToggle')?.addEventListener('click', ${onToggleLanguage.toString()}); : ''}
                ${typeof onNotificationClick === 'function' ? document.getElementById('notificationBell')?.addEventListener('click', ${onNotificationClick.toString()}); : ''}
            })();
        </script>
    `;
}

/**
 * Render header to a container element
 * @param {string|Element} container - Container selector or element
 * @param {Object} options - Same as createHeader options
 */
export function renderHeader(container, options = {}) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) {
        console.warn('Header container not found');
        return;
    }
    el.innerHTML = createHeader(options);
}

export default {
    createHeader,
    renderHeader,
};


/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - MAIN APPLICATION
 * ================================================================
 * Entry point for the frontend application.
 *
 * Handles:
 * - Application initialization
 * - Theme management
 * - Language management
 * - Authentication UI
 * - Navigation
 * - Mobile navigation
 * - Modal management
 * - Logout
 * - Toast notifications
 * - Page-specific module loading
 * ================================================================
 */

import { APP_CONFIG, ROLES } from './config.js';
import {
    UserStorage,
    ThemeStorage,
    LanguageStorage
} from './utils/storage.js';


// ================================================================
// 1. APPLICATION STATE
// ================================================================

const App = {
    initialized: false,
    currentPage: null,
    currentUser: null
};


// ================================================================
// 2. DOM REFERENCES
// ================================================================

const DOM = {

    // Main elements
    get body() {
        return document.body;
    },

    get mainNav() {
        return document.getElementById('mainNav');
    },

    get menuToggle() {
        return document.getElementById('menuToggle');
    },

    // Theme
    get themeToggle() {
        return document.getElementById('themeToggle');
    },

    // Language
    get languageToggle() {
        return document.getElementById('languageToggle');
    },

    // Notifications
    get notificationBell() {
        return document.getElementById('notificationBell');
    },

    get notificationBadge() {
        return document.getElementById('notificationBadge');
    },

    // User
    get userDropdown() {
        return document.getElementById('userDropdown');
    },

    get userAvatar() {
        return document.getElementById('userAvatar');
    },

    get userName() {
        return document.getElementById('userName');
    },

    get userRole() {
        return document.getElementById('userRole');
    },

    // Logout
    get logoutBtn() {
        return document.getElementById('logoutBtn');
    }
};


// ================================================================
// 3. APPLICATION INITIALIZATION
// ================================================================

/**
 * Initialize the application.
 */
export function initApp() {

    if (App.initialized) {
        return;
    }

    try {

        // --------------------------------------------------------
        // Application information
        // --------------------------------------------------------

        console.log(
            `🚀 ${APP_CONFIG.name} v${APP_CONFIG.version}`
        );

        console.log(
            `📅 ${APP_CONFIG.year} | ${APP_CONFIG.institution}`
        );


        // --------------------------------------------------------
        // Current page
        // --------------------------------------------------------

        App.currentPage = window.location.pathname;


        // --------------------------------------------------------
        // Load current user
        // --------------------------------------------------------

        App.currentUser = UserStorage.get();


        // --------------------------------------------------------
        // Apply saved theme
        // --------------------------------------------------------

        applyTheme();


        // --------------------------------------------------------
        // Apply saved language
        // --------------------------------------------------------

        applyLanguage();


        // --------------------------------------------------------
        // Setup event listeners
        // --------------------------------------------------------

        setupEventListeners();


        // --------------------------------------------------------
        // Update authentication UI
        // --------------------------------------------------------

        updateAuthUI();


        // --------------------------------------------------------
        // Setup page-specific logic
        // --------------------------------------------------------

        setupPageLogic();


        // --------------------------------------------------------
        // Mark application as initialized
        // --------------------------------------------------------

        App.initialized = true;

        console.log(
            '✅ Smart Cafeteria application initialized successfully.'
        );

    } catch (error) {

        console.error(
            '❌ Application initialization error:',
            error
        );
    }
}


// ================================================================
// 4. THEME MANAGEMENT
// ================================================================

/**
 * Apply saved theme.
 */
export function applyTheme() {

    try {

        const theme = ThemeStorage.get();

        const activeTheme =
            theme === 'dark'
                ? 'dark'
                : 'light';

        document.documentElement.setAttribute(
            'data-theme',
            activeTheme
        );

        updateThemeIcon(activeTheme);

    } catch (error) {

        console.error(
            'Theme application error:',
            error
        );
    }
}


/**
 * Toggle between light and dark themes.
 */
export function toggleTheme() {

    try {

        const newTheme = ThemeStorage.toggle();

        const activeTheme =
            newTheme === 'dark'
                ? 'dark'
                : 'light';

        document.documentElement.setAttribute(
            'data-theme',
            activeTheme
        );

        updateThemeIcon(activeTheme);

    } catch (error) {

        console.error(
            'Theme toggle error:',
            error
        );
    }
}


/**
 * Update theme toggle button.
 *
 * @param {string} theme
 */
function updateThemeIcon(theme) {

    const toggle = DOM.themeToggle;

    if (!toggle) {
        return;
    }

    if (theme === 'dark') {

        toggle.innerHTML =
            '<i class="fas fa-sun"></i>';

        toggle.title = 'Switch to Light Mode';
        toggle.setAttribute(
            'aria-label',
            'Switch to Light Mode'
        );

    } else {

        toggle.innerHTML =
            '<i class="fas fa-moon"></i>';

        toggle.title = 'Switch to Dark Mode';
        toggle.setAttribute(
            'aria-label',
            'Switch to Dark Mode'
        );
    }
}


// ================================================================
// 5. LANGUAGE MANAGEMENT
// ================================================================

/**
 * Apply saved language.
 */
export function applyLanguage() {

    try {

        const lang = LanguageStorage.get();

        const activeLanguage =
            lang === 'am'
                ? 'am'
                : 'en';

        document.documentElement.lang =
            activeLanguage;

        updateLanguageUI(activeLanguage);

    } catch (error) {

        console.error(
            'Language application error:',
            error
        );
    }
}


/**
 * Toggle between English and Amharic.
 */
export function toggleLanguage() {

    try {

        const currentLanguage =
            LanguageStorage.get();

        const nextLanguage =
            currentLanguage === 'en'
                ? 'am'
                : 'en';

        LanguageStorage.save(nextLanguage);

        applyLanguage();

        /*
         * Reload page so static translated HTML
         * can be refreshed.
         */
        window.location.reload();

    } catch (error) {

        console.error(
            'Language toggle error:',
            error
        );
    }
}


/**
 * Update language toggle UI.
 *
 * @param {string} lang
 */
function updateLanguageUI(lang) {

    const toggle = DOM.languageToggle;

    if (!toggle) {
        return;
    }

    if (lang === 'en') {

        toggle.textContent = 'አማ';
        toggle.title = 'Switch to Amharic';
        toggle.setAttribute(
            'aria-label',
            'Switch to Amharic'
        );

    } else {

        toggle.textContent = 'EN';
        toggle.title = 'Switch to English';
        toggle.setAttribute(
            'aria-label',
            'Switch to English'
        );
    }
}


// ================================================================
// 6. AUTHENTICATION UI
// ================================================================

/**
 * Update UI according to authentication state.
 */
export function updateAuthUI() {

    try {

        const user = UserStorage.get();

        const isLoggedIn = Boolean(user);


        // --------------------------------------------------------
        // Auth buttons
        // --------------------------------------------------------

        const authButtons =
            document.querySelector('.auth-buttons');

        const userMenu =
            document.querySelector('.user-menu');


        if (authButtons) {

            authButtons.style.display =
                isLoggedIn
                    ? 'none'
                    : 'flex';
        }


        if (userMenu) {

            userMenu.style.display =
                isLoggedIn
                    ? 'flex'
                    : 'none';
        }


        // --------------------------------------------------------
        // Logged-in user information
        // --------------------------------------------------------

        if (isLoggedIn && user) {

            // User name
            if (DOM.userName) {

                DOM.userName.textContent =
                    user.name || 'User';
            }


            // User role
            if (DOM.userRole) {

                const roleLabels = {

                    [ROLES.ADMIN]:
                        'Admin',

                    [ROLES.KITCHEN]:
                        'Kitchen Staff',

                    [ROLES.CUSTOMER]:
                        'Customer'
                };

                DOM.userRole.textContent =
                    roleLabels[user.role] ||
                    user.role ||
                    'User';
            }


            // Avatar
            if (DOM.userAvatar) {

                const firstLetter =
                    user.name
                        ? user.name
                            .trim()
                            .charAt(0)
                            .toUpperCase()
                        : 'U';

                DOM.userAvatar.textContent =
                    firstLetter;
            }
        }

    } catch (error) {

        console.error(
            'Authentication UI error:',
            error
        );
    }
}


// ================================================================
// 7. NAVIGATION
// ================================================================

/**
 * Navigate to another page.
 *
 * @param {string} path
 * @param {Object} options
 */
export function navigateTo(path, options = {}) {

    if (!path) {
        console.warn(
            'Navigation failed: path is empty.'
        );

        return;
    }

    try {

        if (options.replace) {

            window.location.replace(path);

        } else {

            window.location.href = path;
        }

    } catch (error) {

        console.error(
            'Navigation error:',
            error
        );
    }
}


// ================================================================
// 8. AUTHORIZATION
// ================================================================

/**
 * Check whether the user is authenticated
 * and optionally has a required role.
 *
 * @param {string|null} requiredRole
 * @param {string} redirectPath
 * @returns {boolean}
 */
export function requireAuth(
    requiredRole = null,
    redirectPath = '/src/pages/common/login.html'
) {

    const user = UserStorage.get();


    // ------------------------------------------------------------
    // Not logged in
    // ------------------------------------------------------------

    if (!user) {

        window.location.href =
            redirectPath;

        return false;
    }


    // ------------------------------------------------------------
    // No specific role required
    // ------------------------------------------------------------

    if (!requiredRole) {
        return true;
    }


    // ------------------------------------------------------------
    // Correct role
    // ------------------------------------------------------------

    if (user.role === requiredRole) {
        return true;
    }


    // ------------------------------------------------------------
    // Wrong role → redirect to role dashboard
    // ------------------------------------------------------------

    const rolePaths = {

        [ROLES.ADMIN]:
            '/src/pages/admin/dashboard.html',

        [ROLES.KITCHEN]:
            '/src/pages/kitchen/dashboard.html',

        [ROLES.CUSTOMER]:
            '/src/pages/customer/menu.html'
    };


    window.location.href =
        rolePaths[user.role] ||
        '/index.html';

    return false;
}


// ================================================================
// 9. EVENT LISTENERS
// ================================================================

function setupEventListeners() {


    // ============================================================
    // MOBILE MENU
    // ============================================================

    if (DOM.menuToggle) {

        DOM.menuToggle.addEventListener(
            'click',
            (event) => {

                event.stopPropagation();

                if (DOM.mainNav) {

                    DOM.mainNav.classList.toggle(
                        'open'
                    );
                }
            }
        );
    }


    // ============================================================
    // THEME TOGGLE
    // ============================================================

    if (DOM.themeToggle) {

        DOM.themeToggle.addEventListener(
            'click',
            toggleTheme
        );
    }


    // ============================================================
    // LANGUAGE TOGGLE
    // ============================================================

    if (DOM.languageToggle) {

        DOM.languageToggle.addEventListener(
            'click',
            toggleLanguage
        );
    }


    // ============================================================
    // LOGOUT
    // ============================================================

    if (DOM.logoutBtn) {

        DOM.logoutBtn.addEventListener(
            'click',
            (event) => {

                event.preventDefault();

                logout();
            }
        );
    }


    // ============================================================
    // NOTIFICATION BELL
    // ============================================================

    if (DOM.notificationBell) {

        DOM.notificationBell.addEventListener(
            'click',
            () => {

                navigateTo(
                    '/src/pages/customer/notifications.html'
                );
            }
        );
    }


    // ============================================================
    // CLOSE MOBILE MENU ON OUTSIDE CLICK
    // ============================================================

    document.addEventListener(
        'click',
        (event) => {

            if (
                !DOM.mainNav ||
                !DOM.mainNav.classList.contains('open')
            ) {
                return;
            }

            const target = event.target;


            const clickedInsideNav =
                DOM.mainNav.contains(target);

            const clickedMenuButton =
                DOM.menuToggle &&
                DOM.menuToggle.contains(target);


            if (
                !clickedInsideNav &&
                !clickedMenuButton
            ) {

                DOM.mainNav.classList.remove(
                    'open'
                );
            }
        }
    );


    // ============================================================
    // CLOSE MODALS WHEN CLICKING OVERLAY
    // ============================================================

    document
        .querySelectorAll('.modal-overlay')
        .forEach((overlay) => {

            overlay.addEventListener(
                'click',
                (event) => {

                    if (
                        event.target === overlay
                    ) {

                        closeModal(overlay);
                    }
                }
            );
        });


    // ============================================================
    // ESCAPE KEY
    // ============================================================

    document.addEventListener(
        'keydown',
        (event) => {

            if (event.key === 'Escape') {

                closeAllModals();

                if (
                    DOM.mainNav &&
                    DOM.mainNav.classList.contains('open')
                ) {

                    DOM.mainNav.classList.remove(
                        'open'
                    );
                }
            }
        }
    );
}


// ================================================================
// 10. MODAL MANAGEMENT
// ================================================================

/**
 * Open modal.
 *
 * @param {string|Element} modalId
 */
export function openModal(modalId) {

    const modal =
        typeof modalId === 'string'
            ? document.getElementById(modalId)
            : modalId;


    if (!modal) {
        console.warn(
            'Modal not found:',
            modalId
        );

        return false;
    }


    modal.classList.add('open');

    document.body.style.overflow =
        'hidden';

    return true;
}


/**
 * Close modal.
 *
 * @param {string|Element} modalId
 */
export function closeModal(modalId) {

    const modal =
        typeof modalId === 'string'
            ? document.getElementById(modalId)
            : modalId;


    if (!modal) {
        return false;
    }


    modal.classList.remove('open');

    // Restore scrolling only if no other modal is open
    const anotherOpenModal =
        document.querySelector(
            '.modal-overlay.open'
        );

    if (!anotherOpenModal) {

        document.body.style.overflow =
            '';
    }

    return true;
}


/**
 * Close all modals.
 */
export function closeAllModals() {

    document
        .querySelectorAll('.modal-overlay.open')
        .forEach((modal) => {

            modal.classList.remove('open');
        });


    document.body.style.overflow =
        '';
}


// ================================================================
// 11. LOGOUT
// ================================================================

/**
 * Logout current user.
 */
export function logout() {

    const confirmed =
        window.confirm(
            'Are you sure you want to log out?'
        );


    if (!confirmed) {
        return false;
    }


    try {

        // --------------------------------------------------------
        // Clear user session
        // --------------------------------------------------------

        UserStorage.clear();


        // --------------------------------------------------------
        // Clear token
        // --------------------------------------------------------

        if (
            typeof localStorage !== 'undefined'
        ) {

            localStorage.removeItem(
                'scos_token'
            );

            localStorage.removeItem(
                'scos_cart'
            );
        }


        // --------------------------------------------------------
        // Clear application state
        // --------------------------------------------------------

        App.currentUser = null;


        // --------------------------------------------------------
        // Redirect
        // --------------------------------------------------------

        window.location.href =
            '/index.html';

        return true;

    } catch (error) {

        console.error(
            'Logout error:',
            error
        );

        return false;
    }
}


// ================================================================
// 12. PAGE-SPECIFIC LOGIC
// ================================================================

function setupPageLogic() {

    const path =
        window.location.pathname.toLowerCase();


    // ------------------------------------------------------------
    // Customer pages
    // ------------------------------------------------------------

    if (path.includes('/customer/')) {

        loadModule('./cart.js');
        loadModule('./menu.js');
        loadModule('./orders.js');
        loadModule('./payment.js');
        loadModule('./notifications.js');
        loadModule('./feedback.js');
        loadModule('./order-cancellation.js');
    }


    // ------------------------------------------------------------
    // Kitchen pages
    // ------------------------------------------------------------

    if (path.includes('/kitchen/')) {

        loadModule('./kitchen.js');
        loadModule('./orders.js');
        loadModule('./notifications.js');
    }


    // ------------------------------------------------------------
    // Admin pages
    // ------------------------------------------------------------

    if (path.includes('/admin/')) {

        loadModule('./admin.js');
        loadModule('./menu.js');
        loadModule('./orders.js');
        loadModule('./payment.js');
        loadModule('./feedback.js');
        loadModule('./order-cancellation.js');
        loadModule('./notifications.js');
    }
}


// ================================================================
// 13. DYNAMIC MODULE LOADING
// ================================================================

/**
 * Dynamically load a JavaScript module.
 *
 * NOTE:
 * ES modules are normally imported directly by
 * page-specific JavaScript files. This helper is
 * kept only for compatibility with the current
 * project structure.
 *
 * @param {string} src
 */
function loadModule(src) {

    if (!src) {
        return;
    }


    // ------------------------------------------------------------
    // Prevent duplicate loading
    // ------------------------------------------------------------

    const existingScript =
        document.querySelector(
            `script[data-module-src="${src}"]`
        );


    if (existingScript) {
        return;
    }


    const script =
        document.createElement('script');


    script.src = src;

    script.type = 'module';

    script.defer = true;

    script.dataset.moduleSrc = src;


    script.onerror = () => {

        console.warn(
            `Optional module could not be loaded: ${src}`
        );
    };


    document.body.appendChild(script);
}


// ================================================================
// 14. TOAST NOTIFICATIONS
// ================================================================

/**
 * Show toast notification.
 *
 * @param {string} message
 * @param {string} type
 * @param {number} duration
 */
export function showToast(
    message,
    type = 'info',
    duration = 3000
) {

    // ------------------------------------------------------------
    // Validate type
    // ------------------------------------------------------------

    const validTypes = [
        'success',
        'error',
        'warning',
        'info'
    ];


    if (!validTypes.includes(type)) {
        type = 'info';
    }


    // ------------------------------------------------------------
    // Get or create container
    // ------------------------------------------------------------

    const container =
        document.getElementById(
            'toastContainer'
        ) || createToastContainer();


    // ------------------------------------------------------------
    // Create toast
    // ------------------------------------------------------------

    const toast =
        document.createElement('div');


    toast.className =
        `toast toast-${type}`;


    // ------------------------------------------------------------
    // Icon
    // ------------------------------------------------------------

    const icons = {

        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };


    const icon =
        icons[type] || 'info-circle';


    // ------------------------------------------------------------
    // Build toast safely
    // ------------------------------------------------------------

    const iconElement =
        document.createElement('span');

    iconElement.className =
        'toast-icon';

    iconElement.innerHTML =
        `<i class="fas fa-${icon}"></i>`;


    const messageElement =
        document.createElement('span');

    messageElement.className =
        'toast-message';

    messageElement.textContent =
        String(message ?? '');


    const closeButton =
        document.createElement('button');

    closeButton.className =
        'toast-close';

    closeButton.type =
        'button';

    closeButton.setAttribute(
        'aria-label',
        'Close notification'
    );

    closeButton.innerHTML =
        '&times;';


    closeButton.addEventListener(
        'click',
        () => {

            removeToast(toast);
        }
    );


    // ------------------------------------------------------------
    // Assemble toast
    // ------------------------------------------------------------

    toast.appendChild(iconElement);

    toast.appendChild(messageElement);

    toast.appendChild(closeButton);


    // ------------------------------------------------------------
    // Add to container
    // ------------------------------------------------------------

    container.appendChild(toast);


    // ------------------------------------------------------------
    // Auto remove
    // ------------------------------------------------------------

    const timeout =
        Math.max(
            Number(duration) || 3000,
            1000
        );


    setTimeout(() => {

        removeToast(toast);

    }, timeout);


    return toast;
}


/**
 * Remove toast with animation.
 *
 * @param {Element} toast
 */
function removeToast(toast) {

    if (!toast || !toast.isConnected) {
        return;
    }


    toast.classList.add(
        'fade-out'
    );


    setTimeout(() => {

        if (toast.isConnected) {
            toast.remove();
        }

    }, 300);
}


// ================================================================
// 15. CREATE TOAST CONTAINER
// ================================================================

/**
 * Create toast container.
 *
 * @returns {HTMLElement}
 */
function createToastContainer() {

    // ------------------------------------------------------------
    // Check existing container
    // ------------------------------------------------------------

    const existing =
        document.getElementById(
            'toastContainer'
        );


    if (existing) {
        return existing;
    }


    // ------------------------------------------------------------
    // Create container
    // ------------------------------------------------------------

    const container =
        document.createElement('div');


    container.id =
        'toastContainer';


    container.setAttribute(
        'aria-live',
        'polite'
    );


    container.setAttribute(
        'aria-atomic',
        'true'
    );


    // ------------------------------------------------------------
    // Container styles
    // ------------------------------------------------------------

    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;

        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;

        width: min(400px, calc(100vw - 40px));
        max-width: 400px;

        pointer-events: none;
    `;


    document.body.appendChild(
        container
    );


    // ------------------------------------------------------------
    // Toast styles
    // ------------------------------------------------------------

    if (
        !document.getElementById(
            'smartCafeteriaToastStyles'
        )
    ) {

        const style =
            document.createElement('style');


        style.id =
            'smartCafeteriaToastStyles';


        style.textContent = `
            .toast {
                pointer-events: auto;

                display: flex;
                align-items: center;
                gap: 12px;

                width: 100%;
                box-sizing: border-box;

                padding: 13px 15px;

                background: #ffffff;

                border-radius: 12px;

                border: 1px solid #e2e8f0;

                border-left: 4px solid #2563eb;

                box-shadow:
                    0 10px 30px rgba(15, 23, 42, 0.15);

                animation:
                    smartToastSlideIn
                    0.3s ease forwards;

                font-family:
                    'Poppins',
                    Arial,
                    sans-serif;

                transition:
                    opacity 0.3s ease,
                    transform 0.3s ease;
            }


            .toast-success {
                border-left-color: #16a34a;
            }


            .toast-error {
                border-left-color: #dc2626;
            }


            .toast-warning {
                border-left-color: #f59e0b;
            }


            .toast-info {
                border-left-color: #0ea5e9;
            }


            .toast-icon {
                flex: 0 0 auto;
                font-size: 20px;
                line-height: 1;
            }


            .toast-success .toast-icon {
                color: #16a34a;
            }


            .toast-error .toast-icon {
                color: #dc2626;
            }


            .toast-warning .toast-icon {
                color: #f59e0b;
            }


            .toast-info .toast-icon {
                color: #0ea5e9;
            }


            .toast-message {
                flex: 1;

                min-width: 0;

                font-size: 14px;
                line-height: 1.5;

                color: #1e293b;

                overflow-wrap: anywhere;
            }


            .toast-close {
                flex: 0 0 auto;

                width: 28px;
                height: 28px;

                display: inline-flex;
                align-items: center;
                justify-content: center;

                padding: 0;

                border: 0;
                border-radius: 6px;

                background: transparent;

                color: #94a3b8;

                font-size: 20px;
                line-height: 1;

                cursor: pointer;

                transition:
                    background 0.2s ease,
                    color 0.2s ease;
            }


            .toast-close:hover {
                background: #f1f5f9;
                color: #475569;
            }


            .toast.fade-out {
                opacity: 0;
                transform: translateX(40px);
            }


            @keyframes smartToastSlideIn {

                from {
                    opacity: 0;
                    transform: translateX(40px);
                }

                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }


            [data-theme="dark"] .toast {
                background: #1e293b;
                border-color: #334155;

                box-shadow:
                    0 10px 30px rgba(0, 0, 0, 0.35);
            }


            [data-theme="dark"] .toast-message {
                color: #e2e8f0;
            }


            [data-theme="dark"] .toast-close {
                color: #94a3b8;
            }


            [data-theme="dark"] .toast-close:hover {
                background: #334155;
                color: #f8fafc;
            }


            @media (max-width: 480px) {

                #toastContainer {
                    top: 12px;
                    right: 12px;

                    width:
                        calc(100vw - 24px);
                }


                .toast {
                    padding: 12px;
                    border-radius: 10px;
                }


                .toast-message {
                    font-size: 13px;
                }
            }
        `;


        document.head.appendChild(
            style
        );
    }


    return container;
}


// ================================================================
// 16. APP API
// ================================================================

export const AppAPI = {

    init: initApp,

    navigate: navigateTo,

    requireAuth: requireAuth,

    logout: logout,

    openModal: openModal,

    closeModal: closeModal,

    closeAllModals:
        closeAllModals,

    showToast: showToast,

    toggleTheme: toggleTheme,

    toggleLanguage:
        toggleLanguage,

    applyTheme: applyTheme,

    applyLanguage:
        applyLanguage,

    updateAuthUI:
        updateAuthUI,

    getUser: () =>
        UserStorage.get(),

    isLoggedIn: () =>
        Boolean(UserStorage.get())
};


// ================================================================
// 17. AUTO INITIALIZATION
// ================================================================

if (
    document.readyState === 'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        initApp,
        { once: true }
    );

} else {

    initApp();
}

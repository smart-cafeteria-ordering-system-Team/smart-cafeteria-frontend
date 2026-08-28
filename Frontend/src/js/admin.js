/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN SHARED SCRIPT
 * ================================================================
 * Shared by all admin pages (users, menu, orders, payments, ...).
 * Provides:
 *   - Admin authentication guard (client-side)
 *   - Sidebar toggle for mobile
 *   - Logout handler
 *
 * Dashboard stats are now handled by dashboard.js (backend data).
 * ================================================================
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Protection Check (Client-Side)
    verifyAdminAuthentication();

    // 2. UI Event Bindings
    initSidebarToggle();
    initLogout();
});

/**
 * Verify logged in user has administrator role
 */
function verifyAdminAuthentication() {
    const userRole = localStorage.getItem("userRole") || localStorage.getItem("role");
    const isAdmin = userRole === "ADMIN" || userRole === "Admin" || userRole === "admin";
    if (!isAdmin) {
        return;
    }

    // Populate user UI
    const profile = getStoredProfile();
    const nameDisplay = document.getElementById("adminNameDisplay");
    const avatar = document.getElementById("adminAvatar");
    if (profile) {
        if (nameDisplay) nameDisplay.textContent = profile.name || "Admin";
        if (avatar && profile.name) avatar.textContent = profile.name.charAt(0).toUpperCase();
    } else {
        if (nameDisplay) nameDisplay.textContent = "Admin";
    }
}

function getStoredProfile() {
    try {
        const raw = localStorage.getItem("userProfile") || localStorage.getItem("user") || localStorage.getItem("loggedUser");
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        return null;
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
                localStorage.removeItem("auth_token");
                localStorage.removeItem("userRole");
                localStorage.removeItem("role");
                localStorage.removeItem("userProfile");
                localStorage.removeItem("user");
                localStorage.removeItem("loggedUser");
                localStorage.removeItem("token");
                localStorage.removeItem("adminLoggedIn");
                localStorage.removeItem("isLoggedIn");
                window.location.href = "../../pages/common/login.html";
            }
        });
    }
}
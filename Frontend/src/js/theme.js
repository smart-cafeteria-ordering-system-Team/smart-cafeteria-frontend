/**
 * Smart Cafeteria Ordering System
 * Theme Toggle Engine - Light / Dark Mode with Icon Toggle
 *
 * Persists the theme choice in localStorage, applies the theme as soon
 * as the script parses to avoid a screen flash, and auto-injects a
 * toggle-on / toggle-off icon button into the header across Customer,
 * Kitchen, and Admin pages.
 */
(function () {
  "use strict";

  var THEME_KEY = "app_theme";

  // Ensure Bootstrap Icons are available for the toggle icons
  if (!document.querySelector('link[href*="bootstrap-icons"]')) {
    var biLink = document.createElement("link");
    biLink.rel = "stylesheet";
    biLink.href = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
    document.head.appendChild(biLink);
  }

  function getStoredTheme() {
    var stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return "light";
  }

  function applyTheme(theme) {
    var safe = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", safe);
    try {
      localStorage.setItem(THEME_KEY, safe);
    } catch (e) { /* storage unavailable */ }

    var toggleIconBtn = document.getElementById("nightModeIconBtn");
    if (toggleIconBtn) {
      if (safe === "dark") {
        toggleIconBtn.innerHTML =
          '<div class="d-flex align-items-center gap-2 cursor-pointer text-warning">' +
          '  <i class="bi bi-moon-stars-fill fs-5"></i>' +
          '  <span class="small fw-bold text-light">Dark Mode</span>' +
          '  <i class="bi bi-toggle-on fs-3 text-warning"></i>' +
          '</div>';
      } else {
        toggleIconBtn.innerHTML =
          '<div class="d-flex align-items-center gap-2 cursor-pointer text-secondary">' +
          '  <i class="bi bi-sun-fill fs-5 text-warning"></i>' +
          '  <span class="small fw-bold text-dark">Light Mode</span>' +
          '  <i class="bi bi-toggle-off fs-3"></i>' +
          '</div>';
      }
    }

    // Notify other scripts
    window.dispatchEvent(new CustomEvent("theme:changed", { detail: { theme: safe } }));
  }

  function injectThemeToggle() {
    // Look for header/navbar container across customer, kitchen, and admin pages
    var headerContainer = document.querySelector(
      "header, .navbar, .top-bar, .admin-header, .d-flex.align-items-center.ms-auto, " +
      "header .nav, header .d-flex, header .navbar-header, header .nav-container, " +
      "header .nav-right, header .header-actions, header .user-nav-links, header .nav-auth, " +
      ".admin-navbar .nav-right, .navbar-header"
    );
    if (!headerContainer || document.getElementById("nightModeIconBtn")) return;

    var toggleBtn = document.createElement("div");
    toggleBtn.id = "nightModeIconBtn";
    toggleBtn.style.cursor = "pointer";
    toggleBtn.className = "ms-auto me-3 user-select-none";
    toggleBtn.style.display = "inline-flex";
    toggleBtn.style.alignItems = "center";
    toggleBtn.style.zIndex = "1050";

    toggleBtn.addEventListener("click", function () {
      var currentTheme = getStoredTheme();
      var newTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(newTheme);
    });

    headerContainer.appendChild(toggleBtn);
    applyTheme(getStoredTheme());
  }

  // Apply theme immediately before DOM fully loads to prevent screen flash
  applyTheme(getStoredTheme());

  document.addEventListener("DOMContentLoaded", function () {
    injectThemeToggle();
    applyTheme(getStoredTheme());
  });

  // Expose globally
  window.setTheme = applyTheme;
  window.getStoredTheme = getStoredTheme;
  window.injectThemeToggle = injectThemeToggle;
})();

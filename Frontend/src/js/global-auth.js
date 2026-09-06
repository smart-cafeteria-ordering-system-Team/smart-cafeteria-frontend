/**
 * Global Auth / Navbar Name Script
 * File: frontend/src/js/global-auth.js
 *
 * Injected on every customer page. Reads the logged-in user from
 * localStorage and updates every profile-name element
 * (#userProfileName / .user-profile-name) to show the registered name.
 */
(function () {
  "use strict";

  function getToken() {
    return (
      localStorage.getItem("auth_token") ||
      localStorage.getItem("scos_token") ||
      localStorage.getItem("token") ||
      ""
    );
  }

  function getStoredUser() {
    var raw =
      localStorage.getItem("current_user") ||
      localStorage.getItem("scos_user") ||
      localStorage.getItem("user") ||
      localStorage.getItem("loggedUser") ||
      localStorage.getItem("userProfile");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function getDisplayName(user) {
    if (!user) return "";
    return (
      user.fullName ||
      user.name ||
      user.fname ||
      user.firstName ||
      user.email ||
      ""
    );
  }

  function applyName(name) {
    var elements = document.querySelectorAll(
      "#userProfileName, .user-profile-name"
    );
    elements.forEach(function (el) {
      el.textContent = name;
    });
  }

  function updateGlobalHeaderName() {
    var userData = localStorage.getItem("user");
    var token = getToken();

    var displayName = "";

    if (userData) {
      try {
        var user = JSON.parse(userData);
        displayName = getDisplayName(user);
      } catch (e) {
        console.error("Failed to parse user data from localStorage:", e);
      }
    }

    // Fallback: read from any of the other storage keys the app may use.
    if (!displayName) {
      displayName = getDisplayName(getStoredUser());
    }

    var elements = document.querySelectorAll(
      "#userProfileName, .user-profile-name"
    );

    if (displayName) {
      applyName(displayName);
    } else if (token) {
      // Fallback: fetch user details from API if token exists but user object is missing.
      fetch("/api/v1/auth/me", {
        headers: { Authorization: "Bearer " + token }
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data && data.success && data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            var fetchedName = getDisplayName(data.user);
            applyName(fetchedName);
          }
        })
        .catch(function (err) {
          console.error("Error fetching current user:", err);
        });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateGlobalHeaderName();
    var backToAdminBtn = document.getElementById("backToAdminBtn");
    if (backToAdminBtn) {
      try {
        var user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user && user.role === "admin") {
          backToAdminBtn.classList.remove("d-none");
        }
      } catch (e) {}
    }
  });
})();

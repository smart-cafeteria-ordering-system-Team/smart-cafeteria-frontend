/**
 * ==========================================================================
   SMART CAFETERIA ORDERING SYSTEM - ADMIN SHARED HELPER
   ==========================================================================
   Classic (non-module) script shared by all admin pages.
   - window.AdminAPI : minimal fetch wrapper against the backend
   - window.esc      : HTML escaping helper
   - Auto bootstrap for common admin chrome on DOMContentLoaded:
       admin auth guard, sidebar toggle, logout, name/avatar.
 *
 * Load this BEFORE the page-specific admin script, e.g.:
 *   <script src="../../js/admin-api.js"></script>
 *   <script src="/frontend/src/js/admin/users.js"></script>
 * ==========================================================================
 */
(function () {
  "use strict";

  var API_BASE = "http://localhost:5000/api/v1";

  function getToken() {
    return localStorage.getItem("auth_token") || "";
  }

  function getProfile() {
    try {
      var p = JSON.parse(localStorage.getItem("userProfile") || "null");
      return p;
    } catch (e) {
      return null;
    }
  }

  function esc(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, '"')
      .replace(/'/g, "'");
  }

  function qs(map) {
    var parts = [];
    for (var key in map) {
      if (map[key] !== undefined && map[key] !== null && map[key] !== "") {
        parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(map[key]));
      }
    }
    return parts.length ? "?" + parts.join("&") : "";
  }

  function formatDate(value) {
    if (!value) return "—";
    var d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function formatDateTime(value) {
    if (!value) return "—";
    var d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function formatCurrency(value, currency) {
    if (value === null || value === undefined) return "0.00";
    var c = currency || "ETB";
    return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + c;
  }

  function handleErrorStatus(status, data) {
    var message = data?.error || data?.message || "Request failed";
    switch (status) {
      case 401:
        message = "Session expired. Please log in again.";
        clearAuthAndRedirect();
        break;
      case 403:
        message = "Access denied. Insufficient permissions.";
        clearAuthAndRedirect();
        break;
      case 404:
        message = "Resource not found: " + message;
        break;
      case 422:
        message = "Validation failed: " + message;
        break;
      case 429:
        message = "Too many requests. Please wait and try again.";
        break;
      case 500:
        message = "Server error. Please try again later.";
        break;
      default:
        if (status >= 500) message = "Server error. Please try again later.";
    }
    return message;
  }

  function clearAuthAndRedirect() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("role");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("isLoggedIn");
    setTimeout(function () {
      window.location.href = "../../pages/common/login.html";
    }, 1500);
  }

  function request(method, path, body, query) {
    var url = API_BASE + path + (query ? qs(query) : "");
    var init = {
      method: method,
      headers: { "Content-Type": "application/json" },
    };
    var token = getToken();
    if (token) init.headers.Authorization = "Bearer " + token;
    if (body !== undefined && body !== null) init.body = JSON.stringify(body);

    return fetch(url, init).then(function (res) {
      return res.json().catch(function () {
        return { success: false, error: "Invalid server response" };
      }).then(function (data) {
        data._status = res.status;
        if (!res.ok) {
          var err = new Error(handleErrorStatus(res.status, data));
          err.status = res.status;
          err.data = data;
          throw err;
        }
        if (!data.success) {
          var err = new Error(data.error || data.message || "Request failed");
          err.status = data._status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  /**
   * Upload files with FormData (multipart/form-data)
   * Automatically handled by browser, don't set Content-Type header
   */
  function formDataRequest(method, path, formData, query) {
    var url = API_BASE + path + (query ? qs(query) : "");
    var init = {
      method: method
      // DO NOT set Content-Type - browser will set it with boundary
    };
    var token = getToken();
    if (token) init.headers = { Authorization: "Bearer " + token };
    if (formData) init.body = formData;

    return fetch(url, init).then(function (res) {
      return res.json().catch(function () {
        return { success: false, error: "Invalid server response" };
      }).then(function (data) {
        data._status = res.status;
        if (!res.ok) {
          var err = new Error(handleErrorStatus(res.status, data));
          err.status = res.status;
          err.data = data;
          throw err;
        }
        if (!data.success) {
          var err = new Error(data.error || data.message || "Request failed");
          err.status = data._status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  function get(path, query) { return request("GET", path, undefined, query); }
  function post(path, body) { return request("POST", path, body); }
  function put(path, body) { return request("PUT", path, body); }
  function patch(path, body) { return request("PATCH", path, body); }
  function del(path) { return request("DELETE", path); }
  function postFormData(path, formData) { return formDataRequest("POST", path, formData); }
  function putFormData(path, formData) { return formDataRequest("PUT", path, formData); }

  window.AdminAPI = {
    base: API_BASE,
    get: get, post: post, put: put, patch: patch, del: del, request: request,
    postFormData: postFormData, putFormData: putFormData,
    esc: esc, formatDate: formatDate, formatDateTime: formatDateTime, formatCurrency: formatCurrency,
    getToken: getToken, getProfile: getProfile, qs: qs
  };
  window.esc = esc;

  function showToast(message, type) {
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();
    var toast = document.createElement("div");
    toast.className = "toast " + (type || "success");
    toast.innerHTML = '<span class="toast-icon">' + (type === "error" ? '<i class="fa-solid fa-circle-exclamation"></i>' : type === "warning" ? '<i class="fa-solid fa-triangle-exclamation"></i>' : '<i class="fa-solid fa-circle-check"></i>') + '</span><span class="toast-message">' + esc(message) + '</span><button class="toast-close" aria-label="Close">&times;</button>';
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.classList.add("show");
    }, 10);
    var closeBtn = toast.querySelector(".toast-close");
    if (closeBtn) closeBtn.addEventListener("click", function() { toast.classList.remove("show"); setTimeout(function() { toast.remove(); }, 300); });
    setTimeout(function () {
      toast.classList.remove("show");
      setTimeout(function () { toast.remove(); }, 300);
    }, 4000);
  }

  window.AdminToast = { show: showToast, success: function(m){showToast(m,"success");}, error: function(m){showToast(m,"error");}, warning: function(m){showToast(m,"warning");}, info: function(m){showToast(m,"info");} };
  window.esc = esc;

  document.addEventListener("DOMContentLoaded", function () {
    var userRole = localStorage.getItem("userRole");
    if (userRole !== "ADMIN" && userRole !== "Admin" && userRole !== "admin") {
      window.location.href = "../../pages/common/login.html";
      return;
    }

    var profile = getProfile();
    var nameDisplay = document.getElementById("adminNameDisplay");
    var avatar = document.getElementById("adminAvatar");
    if (profile) {
      if (nameDisplay) nameDisplay.textContent = profile.name || "Admin";
      if (avatar && profile.name) avatar.textContent = profile.name.charAt(0).toUpperCase();
    } else {
      if (nameDisplay) nameDisplay.textContent = "Admin";
    }
  });
})();

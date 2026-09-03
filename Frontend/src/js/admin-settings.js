/**
 * ==========================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN SETTINGS
 * ==========================================================================
 * Loads and saves system settings via AdminAPI.
 *
 * Backend endpoints:
 *   GET  /admin/settings        -> { success, settings: [{key, value, type, group, label}] }
 *   PUT  /admin/settings/:key   -> body { value } (each changed key)
 *   PUT  /admin/password        -> body { currentPassword, newPassword, confirmPassword }
 *
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ==========================================================================
 */
(function () {
  "use strict";

  var API_SETTINGS_MAP = [
    { key: "cafeteria_name",       field: "cafeteriaName",         type: "text" },
    { key: "support_email",        field: "contactEmail",          type: "text" },
    { key: "support_phone",        field: "supportPhone",          type: "text" },
    { key: "order_availability",   field: "acceptingOrdersToggle", type: "checkbox" },
    { key: "open_time",            field: "openTime",              type: "time" },
    { key: "close_time",           field: "closeTime",             type: "time" },
    { key: "max_order_quantity",   field: "maxOrderLimit",         type: "number" },
    { key: "service_fee",          field: "serviceFee",            type: "number" },
    { key: "cancellation_window",  field: "cancellationWindow",    type: "number" },
    { key: "enable_telebirr",      field: "enableTelebirr",        type: "checkbox" },
    { key: "enable_cbe_birr",      field: "enableCbeBirr",         type: "checkbox" },
    { key: "cash_payment",         field: "cashToggle",            type: "checkbox" },
    { key: "email_new_order",      field: "emailNotifNewOrder",    type: "checkbox" },
    { key: "email_cancellation",   field: "emailNotifCancellation",type: "checkbox" },
    { key: "sound_alert_new_order",field: "soundAlertNewOrder",    type: "checkbox" },
    { key: "maintenance_mode",     field: "maintenanceMode",       type: "checkbox" },
    { key: "currency",             field: "currency",              type: "text" }
  ];

  function showAlert(message, type) {
    var el = document.getElementById("settingsAlert");
    if (!el) return;
    el.textContent = message;
    el.className = "alert-banner " + (type || "success");
    el.style.display = "block";
    setTimeout(function () { el.style.display = "none"; }, 5000);
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalText || "Save All Changes";
    }
  }

  function populateForm(settingsArray) {
    if (!settingsArray || !settingsArray.length) return;
    var settingsMap = {};
    settingsArray.forEach(function (s) { settingsMap[s.key] = s.value; });

    API_SETTINGS_MAP.forEach(function (m) {
      var el = document.getElementById(m.field);
      if (!el) return;
      if (!(m.key in settingsMap)) return;
      var val = settingsMap[m.key];
      if (m.type === "checkbox") {
        el.checked = val === true || val === "true" || val === 1;
      } else {
        el.value = val !== null && val !== undefined ? val : "";
      }
    });
  }

  function collectFormPayload() {
    var payload = {};
    API_SETTINGS_MAP.forEach(function (m) {
      var el = document.getElementById(m.field);
      if (!el) return;
      if (m.type === "checkbox") {
        payload[m.key] = el.checked;
      } else if (m.type === "number") {
        payload[m.key] = parseFloat(el.value) || 0;
      } else {
        payload[m.key] = el.value.trim();
      }
    });
    return payload;
  }

  async function loadSettings() {
    try {
      var data = await window.AdminAPI.get("/admin/settings");
      if (data.success && data.settings) {
        populateForm(data.settings);
      }
    } catch (error) {
      showAlert("Failed to load settings: " + (error.message || "Server error"), "error");
    }
  }

  async function saveSettings(e) {
    if (e) e.preventDefault();
    var btn = document.getElementById("saveAllSettingsBtn");
    setLoading(btn, true);

    var payload = collectFormPayload();
    var keys = Object.keys(payload);
    var errors = 0;

    try {
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        try {
          await window.AdminAPI.put("/admin/settings/" + encodeURIComponent(key), { value: payload[key] });
        } catch (err) {
          errors++;
          if (window.AdminToast) window.AdminToast.error("Failed to save " + key + ": " + (err.message || "error"));
        }
      }
      if (errors === 0) {
        showAlert("All settings saved successfully");
        if (window.AdminToast) window.AdminToast.success("Settings saved");
      } else {
        showAlert("Some settings failed to save. " + errors + " error(s).", "error");
      }
    } catch (error) {
      showAlert("Failed to save settings: " + (error.message || "Server error"), "error");
    } finally {
      setLoading(btn, false);
    }
  }

  async function changePassword() {
    var currentInput = document.getElementById("currentPassword");
    var newInput = document.getElementById("newPassword");
    var btn = document.getElementById("updatePasswordBtn");

    var currentPassword = currentInput ? currentInput.value : "";
    var newPassword = newInput ? newInput.value : "";

    if (!currentPassword || !newPassword) {
      if (window.AdminToast) window.AdminToast.error("Please fill in both password fields");
      return;
    }
    if (newPassword.length < 6) {
      if (window.AdminToast) window.AdminToast.error("New password must be at least 6 characters");
      return;
    }
    if (currentPassword === newPassword) {
      if (window.AdminToast) window.AdminToast.error("New password must differ from current password");
      return;
    }

    setLoading(btn, true);
    try {
      await window.AdminAPI.put("/admin/password", {
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: newPassword
      });
      if (window.AdminToast) window.AdminToast.success("Password changed successfully");
      if (currentInput) currentInput.value = "";
      if (newInput) newInput.value = "";
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Password change failed");
    } finally {
      setLoading(btn, false);
    }
  }

  function bindEvents() {
    var form = document.getElementById("settingsForm");
    if (form) form.addEventListener("submit", saveSettings);

    var saveBtn = document.getElementById("saveAllSettingsBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", function (e) {
        e.preventDefault();
        saveSettings(e);
      });
    }

    var passwordBtn = document.getElementById("updatePasswordBtn");
    if (passwordBtn) passwordBtn.addEventListener("click", changePassword);
  }

  function init() {
    bindEvents();
    loadSettings();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

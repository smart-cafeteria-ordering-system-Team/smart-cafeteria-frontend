/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN SETTINGS
 * ================================================================
 * Loads and saves system settings via admin-api.js
 * ================================================================
 */
(function () {
  "use strict";

  const FORM_IDS = [
    'cafeteriaName', 'currency', 'supportEmail', 'supportPhone',
    'orderAvailability', 'maxOrderQuantity', 'maintenanceMode'
  ];

  function showAlert(message, type) {
    const el = document.getElementById('settingsAlert');
    if (!el) return;
    el.textContent = message;
    el.className = 'alert-banner ' + (type || 'success');
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalText || 'Save';
    }
  }

  function populateForm(data) {
    if (!data) return;
    document.getElementById('cafeteriaName').value = data.cafeteria_name || 'Smart Cafeteria';
    document.getElementById('currency').value = data.currency || 'ETB';
    document.getElementById('supportEmail').value = data.support_email || '';
    document.getElementById('supportPhone').value = data.support_phone || '';
    document.getElementById('orderAvailability').checked = data.order_availability !== false;
    document.getElementById('maxOrderQuantity').value = data.max_order_quantity || 10;
    document.getElementById('maintenanceMode').checked = data.maintenance_mode === true;
  }

  function collectForm() {
    return {
      cafeteria_name: document.getElementById('cafeteriaName').value.trim(),
      currency: document.getElementById('currency').value,
      support_email: document.getElementById('supportEmail').value.trim(),
      support_phone: document.getElementById('supportPhone').value.trim(),
      order_availability: document.getElementById('orderAvailability').checked,
      max_order_quantity: parseInt(document.getElementById('maxOrderQuantity').value, 10) || 10,
      maintenance_mode: document.getElementById('maintenanceMode').checked,
    };
  }

  async function loadSettings() {
    try {
      const data = await window.AdminAPI.get('/admin/settings');
      if (data.success && data.settings) {
        const map = {};
        for (const s of data.settings) {
          map[s.key] = s.value;
        }
        populateForm(map);
      }
    } catch (error) {
      showAlert('Failed to load settings: ' + (error.message || error), 'error');
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    const btn = document.getElementById('saveSettingsBtn');
    setLoading(btn, true);

    const payload = collectForm();
    const keys = Object.keys(payload);

    try {
      for (const key of keys) {
        await window.AdminAPI.put('/admin/settings/' + encodeURIComponent(key), { value: payload[key] });
      }
      showAlert('Settings saved successfully');
    } catch (error) {
      showAlert('Failed to save settings: ' + (error.message || error), 'error');
    } finally {
      setLoading(btn, false);
    }
  }

  async function resetSettings() {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
    const btn = document.getElementById('resetSettingsBtn');
    setLoading(btn, true);
    try {
      const defaults = {
        cafeteria_name: 'Smart Cafeteria',
        currency: 'ETB',
        support_email: 'support@smartcafeteria.com',
        support_phone: '+251 911 000 000',
        order_availability: true,
        max_order_quantity: 10,
        maintenance_mode: false,
      };
      for (const key of Object.keys(defaults)) {
        await window.AdminAPI.put('/admin/settings/' + encodeURIComponent(key), { value: defaults[key] });
      }
      populateForm(defaults);
      showAlert('Settings reset to defaults');
    } catch (error) {
      showAlert('Failed to reset: ' + (error.message || error), 'error');
    } finally {
      setLoading(btn, false);
    }
  }

  function bindEvents() {
    const form = document.getElementById('settingsForm');
    if (form) form.addEventListener('submit', saveSettings);

    const resetBtn = document.getElementById('resetSettingsBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetSettings);
  }

  function init() {
    bindEvents();
    loadSettings();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
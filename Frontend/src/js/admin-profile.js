/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN PROFILE
 * ================================================================
 * Loads admin profile and handles password change
 * ================================================================
 */
(function () {
  "use strict";

  function showAlert(message, type) {
    const el = document.getElementById('profileAlert');
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
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalText || 'Update Password';
    }
  }

  function loadProfile() {
    const profile = window.AdminAPI.getProfile();
    if (profile) {
      document.getElementById('profileName').textContent = profile.name || 'Admin User';
      document.getElementById('profileEmail').textContent = profile.email || 'admin@example.com';
      document.getElementById('profileRole').textContent = profile.role || 'ADMIN';
      const avatar = document.getElementById('profileAvatar');
      const avatarNav = document.getElementById('adminAvatar');
      const nameNav = document.getElementById('adminNameDisplay');
      if (avatar && profile.name) avatar.textContent = profile.name.charAt(0).toUpperCase();
      if (avatarNav && profile.name) avatarNav.textContent = profile.name.charAt(0).toUpperCase();
      if (nameNav) nameNav.textContent = profile.name || 'Admin User';
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    const btn = document.getElementById('changePasswordBtn');
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (!current || !newPass || !confirm) {
      showAlert('All fields are required', 'error');
      return;
    }
    if (newPass.length < 6) {
      showAlert('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPass !== confirm) {
      showAlert('Passwords do not match', 'error');
      return;
    }

    setLoading(btn, true);
    try {
      await window.AdminAPI.put('/admin/password', { currentPassword: current, newPassword: newPass, confirmPassword: confirm });
      showAlert('Password updated successfully');
      document.getElementById('passwordForm').reset();
    } catch (error) {
      showAlert('Failed to update password: ' + (error.message || error), 'error');
    } finally {
      setLoading(btn, false);
    }
  }

  function bindEvents() {
    const form = document.getElementById('passwordForm');
    if (form) form.addEventListener('submit', changePassword);
  }

  function init() {
    bindEvents();
    loadProfile();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
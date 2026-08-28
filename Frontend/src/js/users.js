/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - USER MANAGEMENT
 * ================================================================
 * Admin User Management driven by the backend API:
 *   GET    /admin/users            (list/search/filter/paginate)
 *   GET    /admin/users/:id        (details)
 *   POST   /admin/users            (create)
 *   PUT    /admin/users/:id        (update)
 *   PATCH  /admin/users/:id/status (activate / deactivate)
 *   PATCH  /admin/users/:id/role   (assign role)
 *   DELETE /admin/users/:id        (delete)
 *
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ================================================================
 */
(function () {
  "use strict";

  var state = {
    page: 1,
    limit: 10,
    search: "",
    role: "",
    status: "",
    total: 0,
    pages: 1,
    originalRole: null
  };

  var roleSelect = document.getElementById("roleFilter");
  var statusSelect = document.getElementById("statusFilter");
  var searchInput = document.getElementById("userSearchInput");

  var ROLE_LABELS = {
    STUDENT: "Student",
    STAFF: "Staff",
    KITCHEN_STAFF: "Kitchen Staff",
    ADMIN: "Admin",
    customer: "Customer",
    kitchen: "Kitchen",
    admin: "Admin"
  };

  var currentAdminId = decodeAdminId();

  var ROLE_DISPLAY_MAP = {
    customer: "STUDENT",
    kitchen: "KITCHEN_STAFF",
    admin: "ADMIN",
    staff: "STAFF"
  };

  function decodeAdminId() {
    try {
      var token = window.AdminAPI.getToken();
      if (!token) return null;
      var payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.id || null;
    } catch (e) {
      return null;
    }
  }

  function money(value) {
    if (value === null || value === undefined) return "0";
    return Number(value).toLocaleString("en-US");
  }

  function roleLabel(role) {
    return ROLE_LABELS[role] || role || "—";
  }

  function rolePill(role) {
    var cls = "role-pill";
    var r = String(role || "").toUpperCase();
    if (r === "ADMIN") cls += " role-admin";
    else if (r === "STUDENT") cls += " role-student";
    else if (r === "KITCHEN_STAFF" || r === "KITCHEN") cls += " role-kitchen";
    else if (r === "STAFF") cls += " role-staff";
    else cls += " role-customer";
    return '<span class="' + cls + '">' + window.esc(roleLabel(role)) + "</span>";
  }

  function statusPill(status, isActive) {
    var active = status === "ACTIVE" && isActive !== false;
    var cls = active ? "order-badge active-badge" : "order-badge blocked-badge";
    return '<span class="' + cls + '">' + (active ? "Active" : "Blocked") + "</span>";
  }

  function avatarInitial(name) {
    return (name && name.charAt(0)) || "U";
  }

  /* ============================================================
   * MODALS
   * ============================================================ */
  function openModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add("open");
  }

  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove("open");
  }

  function closeAllModals() {
    var modals = document.querySelectorAll(".amodal-overlay.open");
    modals.forEach(function (m) { m.classList.remove("open"); });
  }

  /* ============================================================
   * DATA LOADING
   * ============================================================ */
  async function loadStats() {
    try {
      var data = await window.AdminAPI.get("/admin/users/stats");
      var stats = data.stats || {};
      document.getElementById("metricTotalUsers").textContent = stats.totalUsers || 0;
      document.getElementById("metricActiveStudents").textContent = stats.activeStudents || 0;
      document.getElementById("metricStaff").textContent = stats.staffCount || 0;
      document.getElementById("metricBlockedUsers").textContent = stats.blockedCount || 0;
    } catch (e) {
      // stats are supplementary; ignore failures
    }
  }

  async function loadUsers() {
    var tbody = document.getElementById("usersTableBody");
    if (!tbody || !window.AdminAPI) return;

    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Loading users...</td></tr>';

    try {
      var data = await window.AdminAPI.get("/admin/users", {
        page: state.page,
        limit: state.limit,
        search: state.search,
        role: state.role,
        status: state.status
      });

      state.total = data.total || 0;
      state.pages = data.pages || Math.max(Math.ceil(state.total / state.limit), 1);
      window.__usersCache = data.users || [];
      renderUsers(window.__usersCache);
      renderPagination();
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Failed to load users: ' + window.esc(error.message || "Server error") + '</td></tr>';
    }
  }

  function renderUsers(users) {
    var tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No users found.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(function (u) {
      var initials = escapeHtml(avatarInitial(u.name));
      var name = window.esc(u.name || "—");
      var email = window.esc(u.email || "—");
      var isSelf = u.id === currentAdminId;

      var toggleBtn = isSelf
        ? '<button class="action-btn" title="Your own account cannot be deactivated" disabled><i class="fa-solid fa-power-off"></i></button>'
        : '<button class="action-btn" data-action="toggle" data-id="' + u.id + '" title="' + (u.status === "ACTIVE" && u.isActive !== false ? "Deactivate" : "Activate") + '">' +
          '<i class="fa-solid ' + (u.status === "ACTIVE" && u.isActive !== false ? "fa-user-slash" : "fa-user-check") + '"></i></button>';

      return (
        '<tr>' +
        '<td>' +
          '<div class="user-cell">' +
            '<div class="user-avatar">' + initials + '</div>' +
            '<div>' +
              '<strong>' + name + '</strong>' +
              '<small>' + email + '</small>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td>' + rolePill(u.role) + '</td>' +
        '<td>' + money(u.balance) + ' ETB</td>' +
        '<td>' + statusPill(u.status, u.isActive) + '</td>' +
        '<td>' + window.AdminAPI.formatDate(u.createdAt) + '</td>' +
        '<td>' +
          '<div class="table-actions">' +
            '<button class="action-btn" data-action="view" data-id="' + u.id + '" title="View details"><i class="fa-solid fa-eye"></i></button>' +
            '<button class="action-btn" data-action="edit" data-id="' + u.id + '" title="Edit user"><i class="fa-solid fa-pen"></i></button>' +
            '<button class="action-btn" data-action="role" data-id="' + u.id + '" title="Assign role"><i class="fa-solid fa-id-card"></i></button>' +
            toggleBtn +
            '<button class="action-btn danger" data-action="delete" data-id="' + u.id + '" title="Delete user"><i class="fa-solid fa-trash"></i></button>' +
          '</div>' +
        '</td>' +
        '</tr>'
      );
    }).join("");
  }

  function escapeHtml(value) {
    return window.esc(value);
  }

  function renderPagination() {
    var info = document.getElementById("paginationInfo");
    var prevBtn = document.getElementById("prevPageBtn");
    var nextBtn = document.getElementById("nextPageBtn");

    if (info) info.textContent = "Page " + state.page + " of " + Math.max(state.pages, 1) + " (" + state.total + " users)";
    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) nextBtn.disabled = state.page >= state.pages;
  }

  function changePage(delta) {
    state.page = Math.min(Math.max(state.page + delta, 1), Math.max(state.pages, 1));
    loadUsers();
  }

  /* ============================================================
   * ADD / EDIT USER
   * ============================================================ */
  function openAddUserModal() {
    closeAllModals();
    state.originalRole = null;
    document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";
    document.getElementById("modalTitle").textContent = "Add New User";
    document.getElementById("saveUserBtn").textContent = "Save User";
    document.getElementById("passwordLabel").textContent = "Password *";
    document.getElementById("userPassword").required = true;
    document.getElementById("userBalance").value = 0;
    openModal("userModal");
  }

  function openEditUserModal(user) {
    closeAllModals();
    state.originalRole = user.role || "STUDENT";
    var displayRole = ROLE_DISPLAY_MAP[user.role] || user.role || "STUDENT";
    if (["STUDENT", "STAFF", "KITCHEN_STAFF", "ADMIN"].indexOf(displayRole) === -1) displayRole = "STUDENT";
    document.getElementById("userForm").reset();
    document.getElementById("userId").value = user.id;
    document.getElementById("userName").value = user.name || "";
    document.getElementById("userEmail").value = user.email || "";
    document.getElementById("userPhone").value = user.phone || "";
    document.getElementById("userRole").value = displayRole;
    document.getElementById("userBalance").value = user.balance || 0;
    document.getElementById("modalTitle").textContent = "Edit User";
    document.getElementById("saveUserBtn").textContent = "Update User";
    document.getElementById("passwordLabel").textContent = "New Password (leave blank to keep)";
    document.getElementById("userPassword").required = false;
    openModal("userModal");
  }

  function getSelectedRole() {
    var el = document.getElementById("userRole");
    if (!el) return state.originalRole || "STUDENT";
    var selected = el.value;
    if (!selected) return state.originalRole || "STUDENT";
    var displayOfOriginal = ROLE_DISPLAY_MAP[state.originalRole] || state.originalRole;
    return selected === displayOfOriginal ? state.originalRole : selected;
  }

  function buildUserPayload() {
    return {
      name: document.getElementById("userName").value.trim(),
      email: document.getElementById("userEmail").value.trim(),
      phone: document.getElementById("userPhone").value.trim(),
      role: getSelectedRole(),
      balance: parseFloat(document.getElementById("userBalance").value) || 0,
      password: document.getElementById("userPassword").value
    };
  }

  async function handleUserFormSubmit(event) {
    event.preventDefault();

    var id = document.getElementById("userId").value;
    var payload = buildUserPayload();
    if (!id && !payload.email) return;

    try {
      var data;
      if (!id) {
        if (!payload.password) {
          if (window.AdminToast) window.AdminToast.error("Password is required for new users");
          return;
        }
        data = await window.AdminAPI.post("/admin/users", payload);
      } else {
        var updatePayload = {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          role: payload.role,
          balance: payload.balance
        };
        if (payload.password) updatePayload.password = payload.password;
        data = await window.AdminAPI.put("/admin/users/" + id, updatePayload);
      }

      closeModal("userModal");
      if (window.AdminToast) window.AdminToast.success("User saved successfully");
      loadUsers();
      loadStats();
    } catch (error) {
      if (window.AdminToast) {
        window.AdminToast.error(error.message || "Failed to save user");
      }
    }
  }

  /* ============================================================
   * VIEW / ROLE / STATUS / DELETE
   * ============================================================ */
  async function viewUser(user) {
    closeAllModals();

    document.getElementById("detailAvatar").textContent = avatarInitial(user.name || "U");
    document.getElementById("detailName").textContent = user.name || "—";
    document.getElementById("detailRoleWrap").innerHTML = rolePill(user.role);
    document.getElementById("detailId").textContent = user.id;
    document.getElementById("detailEmail").textContent = user.email || "—";
    document.getElementById("detailPhone").textContent = user.phone || "—";
    document.getElementById("detailBalance").textContent = money(user.balance) + " ETB";
    document.getElementById("detailStatus").textContent = user.status === "ACTIVE" && user.isActive !== false ? "Active" : "Blocked";
    document.getElementById("detailJoined").textContent = window.AdminAPI.formatDate(user.createdAt) + " | " + window.AdminAPI.formatDateTime(user.createdAt);
    openModal("viewUserModal");
  }

  function openAssignRoleModal(user) {
    closeAllModals();
    document.getElementById("assignRoleName").textContent = (user.name || "User") + " (" + (user.email || "") + ")";
    var displayRole = ROLE_DISPLAY_MAP[user.role] || user.role || "STUDENT";
    if (["STUDENT", "STAFF", "KITCHEN_STAFF", "ADMIN"].indexOf(displayRole) === -1) displayRole = "STUDENT";
    document.getElementById("assignRoleSelect").value = displayRole;
    document.getElementById("assignRoleSelect").dataset.originalRole = user.role || "STUDENT";
    document.getElementById("assignRoleSelect").dataset.userId = user.id;
    openModal("assignRoleModal");
  }

  async function confirmAssignRole() {
    var select = document.getElementById("assignRoleSelect");
    var id = select.dataset.userId;
    var role = select.value;
    if (!role) role = select.dataset.originalRole || "STUDENT";
    if (!id) return;

    try {
      await window.AdminAPI.patch("/admin/users/" + id + "/role", { role: role });
      closeModal("assignRoleModal");
      if (window.AdminToast) window.AdminToast.success("Role updated successfully");
      loadUsers();
      loadStats();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to assign role");
    }
  }

  async function toggleStatus(user) {
    var currentlyActive = user.status === "ACTIVE" && user.isActive !== false;
    var nextStatus = currentlyActive ? "BLOCKED" : "ACTIVE";
    var message = currentlyActive
      ? 'Deactivate user "' + user.name + '"? They will no longer be able to log in.'
      : 'Activate user "' + user.name + '"? They will regain access.';

    if (!window.confirm(message)) return;

    try {
      await window.AdminAPI.patch("/admin/users/" + user.id + "/status", { status: nextStatus });
      if (window.AdminToast) window.AdminToast.success(currentlyActive ? "User deactivated" : "User activated");
      loadUsers();
      loadStats();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to update status");
    }
  }

  async function deleteUser(user) {
    if (!window.confirm('Delete user "' + user.name + '"? This action cannot be undone.')) return;

    try {
      await window.AdminAPI.del("/admin/users/" + user.id);
      if (window.AdminToast) window.AdminToast.success("User deleted successfully");
      if (state.total === 1 && state.page > 1) state.page--;
      loadUsers();
      loadStats();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to delete user");
    }
  }

  async function findUserById(id) {
    try {
      var data = await window.AdminAPI.get("/admin/users/" + id);
      return data.user || null;
    } catch (e) {
      return null;
    }
  }

  /* ============================================================
   * EVENT BINDINGS
   * ============================================================ */
  function bindEvents() {
    // Open add-user modal
    var addBtn = document.getElementById("openAddUserModalBtn");
    if (addBtn) addBtn.addEventListener("click", openAddUserModal);

    // Form submit
    var userForm = document.getElementById("userForm");
    if (userForm) userForm.addEventListener("submit", handleUserFormSubmit);

    // Close buttons (data-close-modal="<id>")
    document.querySelectorAll("[data-close-modal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        closeModal(btn.getAttribute("data-close-modal"));
      });
    });

    // Modal overlay click (close on backdrop)
    document.querySelectorAll(".amodal-overlay").forEach(function (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) overlay.classList.remove("open");
      });
    });

    // Search (debounced)
    if (searchInput) {
      var debounceTimer = null;
      searchInput.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          state.search = searchInput.value.trim();
          state.page = 1;
          loadUsers();
        }, 400);
      });
    }

    // Filters
    if (roleSelect) {
      roleSelect.addEventListener("change", function () {
        state.role = roleSelect.value;
        state.page = 1;
        loadUsers();
      });
    }
    if (statusSelect) {
      statusSelect.addEventListener("change", function () {
        state.status = statusSelect.value;
        state.page = 1;
        loadUsers();
      });
    }

    var resetBtn = document.getElementById("resetFiltersBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (searchInput) searchInput.value = "";
        if (roleSelect) roleSelect.value = "";
        if (statusSelect) statusSelect.value = "";
        state.search = "";
        state.role = "";
        state.status = "";
        state.page = 1;
        loadUsers();
      });
    }

    // Pagination
    var prevBtn = document.getElementById("prevPageBtn");
    var nextBtn = document.getElementById("nextPageBtn");
    if (prevBtn) prevBtn.addEventListener("click", function () { changePage(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { changePage(1); });

    // Table row actions (event delegation)
    var tbody = document.getElementById("usersTableBody");
    if (tbody) {
      tbody.addEventListener("click", async function (e) {
        var btn = e.target.closest("[data-action]");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        if (!id) return;

        var user = (window.__usersCache || []).find(function (u) { return u.id === id; });
        if (!user) user = await findUserById(id);
        if (!user) {
          if (window.AdminToast) window.AdminToast.error("User not found");
          return;
        }

        if (action === "view") viewUser(user);
        else if (action === "edit") openEditUserModal(user);
        else if (action === "role") openAssignRoleModal(user);
        else if (action === "toggle") toggleStatus(user);
        else if (action === "delete") deleteUser(user);
      });
    }

    // Assign role modal save
    var confirmRoleBtn = document.getElementById("confirmAssignRoleBtn");
    if (confirmRoleBtn) confirmRoleBtn.addEventListener("click", confirmAssignRole);
  }

  function init() {
    bindEvents();
    loadStats();
    loadUsers();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
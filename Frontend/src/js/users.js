/**
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN USER MANAGEMENT
 * ================================================================
 * Live user management driven by the backend API (via AdminAPI):
 *   GET    /users          (list)
 *   GET    /users/stats    (metric cards)
 *   POST   /users          (create)
 *   PUT    /users/:id      (update: role, balance, name, email)
 *   PATCH  /users/:id/status (block / activate)
 *
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ================================================================
 */
(function () {
  "use strict";

  var allUsersData = [];
  var api = function () { return window.AdminAPI; };

  function esc(value) {
    return window.esc(value);
  }

  /* ============================================================
   * METRICS
   * ============================================================ */
  function updateUserMetrics(stats) {
    var m = stats || {};
    var setEl = function (id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setEl("metricTotalUsers", m.totalUsers || allUsersData.length || 0);
    setEl("metricActiveStudents", m.activeStudents || 0);
    setEl("metricStaff", m.staffCount || 0);
    setEl("metricBlockedUsers", m.blockedCount || 0);
  }

  async function loadMetrics() {
    try {
      var data = await api().get("/users/stats");
      if (data && data.stats) updateUserMetrics(data.stats);
    } catch (e) {
      // metrics fallback computed from table
      var total = allUsersData.length;
      var activeStudents = allUsersData.filter(function (u) {
        return (u.role === "STUDENT" || u.role === "customer") && u.status === "ACTIVE";
      }).length;
      var staff = allUsersData.filter(function (u) {
        return (u.role === "STAFF" || u.role === "kitchen" || u.role === "KITCHEN_STAFF" || u.role === "admin" || u.role === "ADMIN");
      }).length;
      var blocked = allUsersData.filter(function (u) { return u.status === "BLOCKED"; }).length;
      updateUserMetrics({ totalUsers: total, activeStudents: activeStudents, staffCount: staff, blockedCount: blocked });
    }
  }

  /* ============================================================
   * TABLE RENDERING
   * ============================================================ */
  function roleBadge(role) {
    var r = String(role || "").toUpperCase();
    var cls = "badge badge-role-" + r.toLowerCase();
    return '<span class="' + cls + '">' + esc(r) + "</span>";
  }

  function statusBadge(status) {
    var active = status === "ACTIVE";
    var cls = active ? "status-active" : "status-blocked";
    return '<span class="status-badge ' + cls + '">' + esc(status || "ACTIVE") + "</span>";
  }

  function money(value) {
    if (value === null || value === undefined) return "0.00";
    return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderUsersTable(users) {
    var tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    if (!users || !users.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No users found.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(function (user) {
      var active = user.status === "ACTIVE";
      return (
        "<tr>" +
        '<td><strong>#' + esc(user.id) + "</strong></td>" +
        "<td>" + esc(user.name) + "</td>" +
        "<td>" + esc(user.email) + (user.phone ? '<small>' + esc(user.phone) + "</small>" : "") + "</td>" +
        "<td>" + roleBadge(user.role) + "</td>" +
        "<td>" + money(user.balance) + " ETB</td>" +
        "<td>" + statusBadge(user.status) + "</td>" +
        "<td>" +
          '<div class="table-actions">' +
            '<button class="action-btn" data-action="edit" data-id="' + esc(user.id) + '" title="Edit user"><i class="fa-solid fa-pen"></i></button>' +
            '<button class="action-btn ' + (active ? "danger" : "") + '" data-action="toggle" data-id="' + esc(user.id) + '" title="' +
              (active ? "Block user" : "Activate user") + '">' +
              '<i class="fa-solid ' + (active ? "fa-user-slash" : "fa-user-check") + '"></i></button>' +
          "</div>" +
        "</td>" +
        "</tr>"
      );
    }).join("");
  }

  /* ============================================================
   * FILTERING
   * ============================================================ */
  function filterUsers() {
    var searchVal = (document.getElementById("userSearchInput").value || "").toLowerCase();
    var roleVal = document.getElementById("roleFilter").value;
    var statusVal = document.getElementById("statusFilter").value;

    var filtered = allUsersData.filter(function (user) {
      var name = (user.name || "").toLowerCase();
      var email = (user.email || "").toLowerCase();
      var id = String(user.id || "").toLowerCase();
      var matchesSearch = !searchVal || name.includes(searchVal) || email.includes(searchVal) || id.includes(searchVal);
      var userRole = String(user.role || "").toUpperCase();
      var matchesRole = !roleVal || userRole === roleVal.toUpperCase();
      var matchesStatus = !statusVal || (user.status || "").toUpperCase() === statusVal.toUpperCase();
      return matchesSearch && matchesRole && matchesStatus;
    });

    renderUsersTable(filtered);
  }

  /* ============================================================
   * DATA LOADING
   * ============================================================ */
  async function loadUsers() {
    var tbody = document.getElementById("usersTableBody");
    if (!tbody || !api()) return;

    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Loading users...</td></tr>';

    try {
      var data = await api().get("/users");
      allUsersData = (data && data.users) || [];
      renderUsersTable(allUsersData);
      loadMetrics();
    } catch (error) {
      allUsersData = [];
      renderUsersTable(allUsersData);
      if (window.AdminToast) window.AdminToast.error("Failed to load users: " + (error.message || "Server error"));
    }
  }

  /* ============================================================
   * MODAL
   * ============================================================ */
  function openUserModal(user) {
    var modal = document.getElementById("userModal");
    var title = document.getElementById("modalTitle");
    if (!modal) return;

    if (user) {
      if (title) title.textContent = "Edit User";
      document.getElementById("userId").value = user.id;
      document.getElementById("userName").value = user.name || "";
      document.getElementById("userEmail").value = user.email || "";
      var roleSelect = document.getElementById("userRole");
      var roleVal = String(user.role || "").toLowerCase();
      if (roleSelect) {
        var matched = Array.prototype.find.call(
          roleSelect.options,
          function (o) { return String(o.value).toLowerCase() === roleVal; }
        );
        roleSelect.value = matched ? matched.value : roleVal;
      }
    } else {
      if (title) title.textContent = "Add New User";
      var form = document.getElementById("userForm");
      if (form) form.reset();
      document.getElementById("userId").value = "";
    }
    modal.style.display = "flex";
  }

  function closeUserModal() {
    var modal = document.getElementById("userModal");
    if (modal) modal.style.display = "none";
  }

  async function handleUserFormSubmit(event) {
    event.preventDefault();
    var userId = document.getElementById("userId").value;
    var role = document.getElementById("userRole").value.toLowerCase();

    var userData = {
      name: document.getElementById("userName").value.trim(),
      email: document.getElementById("userEmail").value.trim(),
      role: role
    };

    var passwordEl = document.getElementById("userPassword");
    if (passwordEl && passwordEl.value) {
      userData.password = passwordEl.value;
    }

    if (!userData.name || !userData.email) {
      if (window.AdminToast) window.AdminToast.error("Name and email are required");
      return;
    }

    if (!userId && !userData.password) {
      if (window.AdminToast) window.AdminToast.error("Password is required to create a login");
      return;
    }

    try {
      if (userId) {
        await api().put("/users/" + userId, userData);
        if (window.AdminToast) window.AdminToast.success("User updated");
      } else {
        await api().post("/users", userData);
        if (window.AdminToast) window.AdminToast.success("User created");
      }
      closeUserModal();
      loadUsers();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to save user");
    }
  }

  /* ============================================================
   * EDIT / TOGGLE
   * ============================================================ */
  window.editUser = function (id) {
    var user = allUsersData.find(function (u) { return String(u.id) === String(id); });
    if (user) openUserModal(user);
  };

  window.toggleUserStatus = async function (id, currentStatus) {
    var newStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    if (!window.confirm("Are you sure you want to change this user's status to " + newStatus + "?")) return;

    try {
      await api().patch("/users/" + id + "/status", { status: newStatus });
      if (window.AdminToast) window.AdminToast.success("User " + (newStatus === "ACTIVE" ? "activated" : "blocked"));
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to update user status");
    }
    loadUsers();
  };

  /* ============================================================
   * EVENT BINDINGS
   * ============================================================ */
  function bindEvents() {
    var searchInput = document.getElementById("userSearchInput");
    if (searchInput) searchInput.addEventListener("input", filterUsers);
    var roleFilter = document.getElementById("roleFilter");
    if (roleFilter) roleFilter.addEventListener("change", filterUsers);
    var statusFilter = document.getElementById("statusFilter");
    if (statusFilter) statusFilter.addEventListener("change", filterUsers);

    var addBtn = document.getElementById("openAddUserModalBtn");
    if (addBtn) addBtn.addEventListener("click", function () { openUserModal(); });

    var closeBtn = document.getElementById("closeUserModalBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeUserModal);
    var cancelBtn = document.getElementById("cancelUserModalBtn");
    if (cancelBtn) cancelBtn.addEventListener("click", closeUserModal);
    var modal = document.getElementById("userModal");
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeUserModal();
      });
    }

    var form = document.getElementById("userForm");
    if (form) form.addEventListener("submit", handleUserFormSubmit);

    var tbody = document.getElementById("usersTableBody");
    if (tbody) {
      tbody.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-action]");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        if (!id) return;
        if (action === "edit") window.editUser(id);
        else if (action === "toggle") {
          var user = allUsersData.find(function (u) { return String(u.id) === String(id); });
          if (user) window.toggleUserStatus(id, user.status);
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.AdminAPI) return;
    bindEvents();
    loadUsers();
  });
})();

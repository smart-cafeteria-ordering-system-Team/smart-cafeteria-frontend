/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN ACTIVITY LOG
 * ================================================================
 * Audit trail page driven by the backend:
 *   GET /admin/activity-logs
 *   Supports: search, action, entity, start/end date + pagination.
 *
 * Note: the backend never stores passwords, tokens or secrets.
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ================================================================
 */
(function () {
  "use strict";

  var state = {
    page: 1,
    limit: 20,
    search: "",
    action: "",
    entity: "",
    startDate: "",
    endDate: "",
  };

  var ACTION_LABELS = {
    ADMIN_LOGIN: "Admin Login",
    USER_CREATED: "User Created",
    USER_UPDATED: "User Updated",
    USER_ACTIVATED: "User Activated",
    USER_DEACTIVATED: "User Deactivated",
    USER_DELETED: "User Deleted",
    ROLE_CHANGED: "Role Changed",
    FOOD_CREATED: "Food Created",
    FOOD_UPDATED: "Food Updated",
    FOOD_DELETED: "Food Deleted",
    FOOD_AVAILABILITY_CHANGED: "Availability Changed",
    ORDER_CANCELLED: "Order Cancelled",
    SETTINGS_UPDATED: "Settings Updated",
    "settings.update": "Settings Updated",
    "auth.password.change": "Password Changed",
  };

  function actionClass(action) {
    if (!action) return "act-other";
    if (action.indexOf("ADMIN_LOGIN") === 0) return "act-login";
    if (action.indexOf("USER_") === 0) return "act-user";
    if (action.indexOf("FOOD_") === 0) return "act-food";
    if (action.indexOf("ORDER_") === 0) return "act-order";
    if (action.indexOf("ROLE_") === 0) return "act-user";
    return "act-other";
  }

  function actionLabel(action) {
    return ACTION_LABELS[action] || action || "-";
  }

  function getQuery() {
    var params = "?page=" + state.page + "&limit=" + state.limit;
    if (state.search) params += "&search=" + encodeURIComponent(state.search);
    if (state.action) params += "&action=" + encodeURIComponent(state.action);
    if (state.entity) params += "&entityType=" + encodeURIComponent(state.entity);
    if (state.startDate) params += "&startDate=" + encodeURIComponent(state.startDate);
    if (state.endDate) params += "&endDate=" + encodeURIComponent(state.endDate);
    return params;
  }

  async function loadLogs() {
    try {
      var data = await window.AdminAPI.get("/admin/activity-logs" + getQuery());
      var logs = data.logs || [];
      renderLogs(logs);
      renderPagination(data.total || 0, data.pages || 0);
    } catch (error) {
      var tbody = document.getElementById("logsTableBody");
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="table-empty">Failed to load activity logs: ' +
          window.esc(error.message || "Server error") + "</td></tr>";
      }
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to load activity logs");
    }
  }

  function renderLogs(logs) {
    var tbody = document.getElementById("logsTableBody");
    if (!tbody) return;

    if (!logs.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No activity records match your filters.</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(function (log) {
      var entityText = log.entityType || "-";
      var entityId = log.entityId || "-";
      return (
        "<tr>" +
        "<td><strong>" + window.esc(log.adminName || "System") + "</strong>" +
        (log.adminEmail ? '<div class="table-muted">' + window.esc(log.adminEmail) + "</div>" : "") +
        "</td>" +
        '<td><span class="action-badge ' + actionClass(log.action) + '">' + window.esc(actionLabel(log.action)) + "</span></td>" +
        "<td>" + window.esc(entityText) + "</td>" +
'<td class="mono-ref">' + window.esc(entityId) + "</td>" +
        "<td>" + window.esc(log.description || "") + "</td>" +
        "<td>" + (log.timestamp ? window.AdminAPI.formatDateTime(log.timestamp) : "-") + "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderPagination(total, pages) {
    var info = document.getElementById("logsPaginationInfo");
    if (info) info.textContent = "Page " + state.page + " of " + (pages || 1) + " (" + total + " records)";

    var prev = document.getElementById("prevLogsBtn");
    var next = document.getElementById("nextLogsBtn");
    if (prev) prev.disabled = state.page <= 1;
    if (next) next.disabled = state.page >= (pages || 1);
  }

  function syncFilters() {
    state.search = document.getElementById("logSearchInput").value.trim();
    state.action = document.getElementById("logActionFilter").value;
    state.entity = document.getElementById("logEntityFilter").value;
    state.startDate = document.getElementById("logStartDate").value;
    state.endDate = document.getElementById("logEndDate").value;
    state.page = 1;
  }

  function resetFilters() {
    document.getElementById("logSearchInput").value = "";
    document.getElementById("logActionFilter").value = "";
    document.getElementById("logEntityFilter").value = "";
    document.getElementById("logStartDate").value = "";
    document.getElementById("logEndDate").value = "";
    syncFilters();
    loadLogs();
  }

  function bindEvents() {
    var searchInput = document.getElementById("logSearchInput");
    if (searchInput) {
      searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          state.search = searchInput.value.trim();
          state.page = 1;
          loadLogs();
        }
      });
    }

    ["logActionFilter", "logEntityFilter", "logStartDate", "logEndDate"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", function () {
          syncFilters();
          loadLogs();
        });
      }
    });

    var resetBtn = document.getElementById("resetLogFiltersBtn");
    if (resetBtn) resetBtn.addEventListener("click", resetFilters);

    var prevBtn = document.getElementById("prevLogsBtn");
    if (prevBtn) prevBtn.addEventListener("click", function () {
      if (state.page > 1) {
        state.page -= 1;
        loadLogs();
      }
    });

    var nextBtn = document.getElementById("nextLogsBtn");
    if (nextBtn) nextBtn.addEventListener("click", function () {
      state.page += 1;
      loadLogs();
    });

    var refreshBtn = document.getElementById("refreshLogsBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", loadLogs);
  }

  function init() {
    bindEvents();
    loadLogs();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
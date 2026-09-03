/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN CANCELLATION MANAGEMENT
 * ================================================================
 * Admin cancellation request management driven by the backend API:
 *   GET    /cancellations/stats                (metric cards)
 *   GET    /cancellations                      (list / filter / paginate)
 *   PATCH  /cancellations/:orderId/approve      (approve + refund, body {adminNote})
 *   PATCH  /cancellations/:orderId/reject       (reject, body {adminNote})
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
    status: ""
  };

  var STATUS_MAP = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected"
  };

  function money(value) {
    if (value === null || value === undefined) return "0.00";
    return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function normalizeStatus(value) {
    var v = String(value || "").toUpperCase();
    return STATUS_MAP[v] || v;
  }

  function statusBadge(status) {
    var cls = "order-badge";
    switch (String(status || "").toUpperCase()) {
      case "PENDING": cls += " pend"; break;
      case "APPROVED": cls += " cmp"; break;
      case "REJECTED": cls += " cxl"; break;
      default: cls += " pend"; break;
    }
    var label = String(status || "PENDING").charAt(0).toUpperCase() +
      String(status || "PENDING").slice(1).toLowerCase();
    return '<span class="' + cls + '">' + window.esc(label) + "</span>";
  }

  /* ============================================================
   * MODALS (display toggled via inline style in HTML)
   * ============================================================ */
  function openModal(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = "block";
  }

  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = "none";
  }

  /* ============================================================
   * DATA LOADING
   * ============================================================ */
  async function loadStats() {
    try {
      var data = await window.AdminAPI.get("/cancellations/stats");
      var stats = data.stats || {};
      var totalEl = document.getElementById("metricTotalCancellations");
      var pendingEl = document.getElementById("metricPendingCancellations");
      var refundEl = document.getElementById("metricRefundedAmount");
      var rejectedEl = document.getElementById("metricRejectedCancellations");

      // Refunded Today is a monetary sum — use innerHTML so the <small>ETB</small>
      // renders instead of showing the literal HTML tags.
      if (totalEl) totalEl.textContent = stats.totalCancellations || 0;
      if (pendingEl) pendingEl.textContent = stats.pendingApproval || 0;
      if (refundEl) refundEl.innerHTML = money(stats.refundedToday) + " <small>ETB</small>";
      if (rejectedEl) rejectedEl.textContent = stats.rejectedRequests || 0;

      // Sidebar badge: show pending count, hide when 0
      var pendingCount = stats.pendingApproval || 0;
      var badgeEl = document.getElementById("sidebarCancellationBadge") ||
        document.querySelector('.nav-link[href*="cancellations"] .badge');
      if (badgeEl) {
        badgeEl.textContent = pendingCount;
        badgeEl.style.display = pendingCount > 0 ? "inline-block" : "none";
      }
    } catch (e) {
      // stats are supplementary
    }
  }

  async function loadCancellations() {
    var tbody = document.getElementById("cancellationsTableBody");
    if (!tbody || !window.AdminAPI) return;

    tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Loading cancellations...</td></tr>';

    try {
      var query = {
        page: state.page,
        limit: state.limit,
        status: normalizeStatus(state.status)
      };
      if (state.search) query.search = state.search;

      var data = await window.AdminAPI.get("/cancellations", query);

      window.__cancellationsCache = data.cancellations || [];
      renderCancellations(window.__cancellationsCache);

      var total = data.total || 0;
      var pages = Math.max(Math.ceil(total / state.limit), 1);
      renderPagination(total, pages);
      state.page = data.page || 1;
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Failed to load cancellations: ' +
        window.esc(error.message || "Server error") + "</td></tr>";
    }
  }

  function renderPagination(total, pages) {
    var container = document.getElementById("cancellationPaginationControls");
    if (!container) return;
    container.innerHTML =
      '<div class="pagination">' +
        '<div class="pagination-info">Page ' + state.page + " of " + pages + " (" + total + " total)</div>" +
        '<button class="page-btn" id="cancellationPrevPageBtn"' + (state.page <= 1 ? " disabled" : "") + '>' +
          '<i class="fa-solid fa-chevron-left"></i> Prev</button>' +
        '<button class="page-btn" id="cancellationNextPageBtn"' + (state.page >= pages ? " disabled" : "") + '>' +
          'Next <i class="fa-solid fa-chevron-right"></i></button>' +
      "</div>";

    var prevBtn = document.getElementById("cancellationPrevPageBtn");
    var nextBtn = document.getElementById("cancellationNextPageBtn");
    if (prevBtn) prevBtn.addEventListener("click", function () { changePage(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { changePage(1); });
  }

  function renderCancellations(cancellations) {
    var tbody = document.getElementById("cancellationsTableBody");
    if (!tbody) return;

    if (!cancellations.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No cancellation requests found.</td></tr>';
      return;
    }

    tbody.innerHTML = cancellations.map(function (c) {
      var status = String(c.status || "PENDING").toUpperCase();
      var isPending = status === "PENDING";

      var customerName = c.customerName ||
        (c.user && c.user.name) || "—";
      var customerLines = "<strong>" + window.esc(customerName) + "</strong>" +
        (c.user && c.user.email ? "<small>" + window.esc(c.user.email) + "</small>" : "") +
        (c.customerPhone || (c.user && c.user.phone) ? "<small>" + window.esc(c.customerPhone || (c.user && c.user.phone)) + "</small>" : "");

      var actions = '<button class="action-btn" data-action="view" data-id="' + c.id + '" title="Review request"><i class="fa-solid fa-eye"></i></button>';
      if (isPending) {
        actions += '<button class="action-btn" data-action="approve" data-id="' + c.id + '" title="Approve request"><i class="fa-solid fa-check"></i></button>' +
          '<button class="action-btn danger" data-action="reject" data-id="' + c.id + '" title="Reject request"><i class="fa-solid fa-xmark"></i></button>';
      }

      return (
        "<tr>" +
        '<td><div class="user-cell"><div class="order-id-cell">' +
          "<strong>" + window.esc(c.id) + "</strong>" +
        "</div></div></td>" +
        '<td><div class="user-cell"><div class="order-id-cell">' +
          "<strong>" + window.esc(c.orderId || "—") + "</strong>" +
        "</div></div></td>" +
        '<td><div class="user-cell"><div class="user-avatar">' +
          window.esc(customerName.charAt(0)) +
          "</div><div>" + customerLines + "</div></div></td>" +
        "<td>" + window.esc(c.reason || "—") + "</td>" +
        "<td><strong>" + money(c.totalAmount) + " ETB</strong></td>" +
        "<td>" + statusBadge(status) + "</td>" +
        "<td>" + window.AdminAPI.formatDateTime(c.requestedAt || c.createdAt) + "</td>" +
        "<td><div class=\"table-actions\">" + actions + "</div></td>" +
        "</tr>"
      );
    }).join("");
  }

  function changePage(delta) {
    state.page += delta;
    if (state.page < 1) state.page = 1;
    loadCancellations();
  }

  /* ============================================================
   * DETAIL MODAL & ACTIONS
   * ============================================================ */
  function viewCancellationDetails(id) {
    var c = (window.__cancellationsCache || []).find(function (x) { return x.id === id; });
    if (!c) return;

    var status = String(c.status || "PENDING").toUpperCase();
    var customerName = c.customerName || (c.user && c.user.name) || "—";

    document.getElementById("modalRequestId").textContent = c.id || "#0000";
    document.getElementById("modalOrderId").textContent = c.orderId || "#0000";
    document.getElementById("modalCustomerName").textContent = customerName;
    document.getElementById("modalRefundAmount").textContent = money(c.totalAmount) + " ETB";
    document.getElementById("modalCancellationReason").textContent =
      c.reason || c.details || "—";
    var noteInput = document.getElementById("adminNoteInput");
    if (noteInput) {
      noteInput.value = c.adminNote || "";
      noteInput.disabled = status !== "PENDING";
    }

    var approveBtn = document.getElementById("approveCancellationBtn");
    var rejectBtn = document.getElementById("rejectCancellationBtn");
    if (approveBtn) approveBtn.style.display = status === "PENDING" ? "" : "none";
    if (rejectBtn) rejectBtn.style.display = status === "PENDING" ? "" : "none";

    window.__activeCancellation = c;
    openModal("cancellationModal");
  }

  async function processCancellation(action) {
    var c = window.__activeCancellation;
    if (!c) return;

    var actionLabel = action === "approve" ? "approve" : "reject";
    if (!window.confirm("Are you sure you want to " + actionLabel + " cancellation request for order " + c.orderId + "?")) return;

    var noteInput = document.getElementById("adminNoteInput");
    var adminNote = noteInput ? noteInput.value.trim() : "";

    try {
      // Backend route takes the human orderId as the param
      await window.AdminAPI.patch("/cancellations/" + c.orderId + "/" + action, { adminNote: adminNote });
      closeModal("cancellationModal");
      if (window.AdminToast) {
        window.AdminToast.success(action === "approve" ? "Cancellation approved and refund processed" : "Cancellation rejected");
      }
      loadCancellations();
      loadStats();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to " + actionLabel + " cancellation");
    }
  }

  /* ============================================================
   * EVENT BINDINGS
   * ============================================================ */
  function bindEvents() {
    var refreshBtn = document.getElementById("refreshCancellationsBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", async function () {
        var original = refreshBtn.innerHTML;
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
        try {
          await Promise.all([loadCancellations(), loadStats()]);
          if (window.AdminToast) window.AdminToast.show("Cancellations refreshed");
        } finally {
          refreshBtn.disabled = false;
          refreshBtn.innerHTML = original;
        }
      });
    }

    var closeBtn = document.getElementById("closeCancellationModalBtn");
    if (closeBtn) closeBtn.addEventListener("click", function () { closeModal("cancellationModal"); });

    var modal = document.getElementById("cancellationModal");
    if (modal) modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal("cancellationModal");
    });

    var approveBtn = document.getElementById("approveCancellationBtn");
    if (approveBtn) approveBtn.addEventListener("click", function () { processCancellation("approve"); });

    var rejectBtn = document.getElementById("rejectCancellationBtn");
    if (rejectBtn) rejectBtn.addEventListener("click", function () { processCancellation("reject"); });

    var searchInput = document.getElementById("cancellationSearchInput");
    if (searchInput) {
      var debounceTimer = null;
      searchInput.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          state.search = searchInput.value.trim();
          state.page = 1;
          loadCancellations();
        }, 400);
      });
    }

    var statusFilter = document.getElementById("cancellationStatusFilter");
    if (statusFilter) {
      statusFilter.addEventListener("change", function () {
        state.status = normalizeStatus(statusFilter.value);
        state.page = 1;
        loadCancellations();
      });
    }

    var tbody = document.getElementById("cancellationsTableBody");
    if (tbody) {
      tbody.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-action]");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        if (!id) return;

        if (action === "view") {
          viewCancellationDetails(id);
        } else if (action === "approve" || action === "reject") {
          viewCancellationDetails(id);
          setTimeout(function () {
            processCancellation(action);
          }, 50);
        }
      });
    }
  }

  function init() {
    bindEvents();
    loadStats();
    loadCancellations();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

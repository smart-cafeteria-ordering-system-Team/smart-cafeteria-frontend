/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN PAYMENT MANAGEMENT
 * ================================================================
 * Read-only payment monitoring driven by the backend API:
 *   GET /admin/payments        (list / search / filter / paginate)
 *   GET /admin/payments/stats  (metric cards)
 *   GET /admin/payments/:id    (payment detail)
 *
 * There are intentionally NO update/delete actions: only verified
 * Chapa / Telebirr callbacks may set paymentStatus = PAID.
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
    method: "",
    status: "",
    date: "",
    sort: "newest"
  };

  function money(value) {
    if (value === null || value === undefined) return "0.00";
    return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function paymentBadge(paymentStatus) {
    var cls = "order-badge";
    switch (String(paymentStatus || "").toUpperCase()) {
      case "PAID": cls += " cmp"; break;
      case "FAILED": cls += " cxl"; break;
      case "CANCELLED": cls += " cxl"; break;
      default: cls += " pend"; break;
    }
    return '<span class="' + cls + '">' + String(paymentStatus || "PENDING") + "</span>";
  }

  function methodLabel(method) {
    var m = String(method || "").toUpperCase();
    return '<span class="pay-method">' + window.esc(m || "—") + "</span>";
  }

  function refText(value) {
    var v = value || "—";
    return '<span class="mono-ref">' + window.esc(v) + "</span>";
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

  /* ============================================================
   * DATA LOADING
   * ============================================================ */
  async function loadStats() {
    try {
      var data = await window.AdminAPI.get("/admin/payments/stats");
      var stats = data.stats || {};
      document.getElementById("metricTotalRevenue").textContent =
        money(stats.totalRevenue) + " ETB";
      document.getElementById("metricSuccessfulPayments").textContent = stats.successfulPayments || 0;
      document.getElementById("metricPendingPayments").textContent = stats.pendingPayments || 0;
      document.getElementById("metricFailedPayments").textContent = stats.failedPayments || 0;
    } catch (e) {
      // stats are supplementary
    }
  }

  async function loadPayments() {
    var tbody = document.getElementById("paymentsTableBody");
    if (!tbody || !window.AdminAPI) return;

    tbody.innerHTML = '<tr><td colspan="9" class="table-empty">Loading payments...</td></tr>';

    try {
      var data = await window.AdminAPI.get("/admin/payments", {
        page: state.page,
        limit: state.limit,
        search: state.search,
        method: state.method,
        status: state.status,
        date: state.date,
        sort: state.sort
      });

      window.__paymentsCache = data.payments || [];
      renderPayments(window.__paymentsCache);

      var total = data.total || 0;
      var pages = Math.max(data.pages || 1, 1);
      var info = document.getElementById("paymentPaginationInfo");
      if (info) info.textContent = "Page " + (data.page || state.page) + " of " + pages + " (" + total + " payments)";
      var prevBtn = document.getElementById("paymentPrevPageBtn");
      var nextBtn = document.getElementById("paymentNextPageBtn");
      if (prevBtn) prevBtn.disabled = (data.page || 1) <= 1;
      if (nextBtn) nextBtn.disabled = (data.page || 1) >= pages;
      state.page = data.page || 1;
    } catch (error) {
      tbody.innerHTML =
        '<tr><td colspan="9" class="table-empty">Failed to load payments: ' +
        window.esc(error.message || "Server error") + "</td></tr>";
    }
  }

  function renderPayments(payments) {
    var tbody = document.getElementById("paymentsTableBody");
    if (!tbody) return;

    if (!payments.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="table-empty">No payments found.</td></tr>';
      return;
    }

    tbody.innerHTML = payments.map(function (payment) {
      var customerLines = "<strong>" + window.esc(payment.customerName || "—") + "</strong>" +
        (payment.customerPhone ? "<small>" + window.esc(payment.customerPhone) + "</small>" : "");

      return (
        "<tr>" +
        '<td><div class="user-cell"><div class="order-id-cell">' +
          "<strong>" + window.esc(payment.orderId || "—") + "</strong>" +
        "</div></div></td>" +
        '<td><div class="user-cell"><div class="user-avatar">' +
          window.esc((payment.customerName || "?").charAt(0)) +
          "</div><div>" + customerLines + "</div></div></td>" +
        "<td>" + methodLabel(payment.method) + "</td>" +
        "<td><strong>" + money(payment.amount) + "</strong> " +
          window.esc(payment.currency || "ETB") + "</td>" +
        "<td>" + paymentBadge(payment.paymentStatus) + "</td>" +
        "<td>" + refText(payment.transactionId) + "</td>" +
        "<td>" + refText(payment.providerReference) + "</td>" +
        "<td>" + window.AdminAPI.formatDateTime(payment.paymentDate) + "</td>" +
        "<td>" +
          '<div class="table-actions">' +
            '<button class="action-btn" data-action="view" data-id="' + payment.id + '" title="View payment details"><i class="fa-solid fa-eye"></i></button>' +
          "</div>" +
        "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function changePage(delta) {
    state.page += delta;
    if (state.page < 1) state.page = 1;
    loadPayments();
  }

  /* ============================================================
   * PAYMENT DETAILS
   * ============================================================ */
  function renderPaymentItems(items) {
    var tbody = document.getElementById("modalPaymentItemsBody");
    if (!items || !items.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="table-empty">No items</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(function (item) {
      var sub = (Number(item.price) || 0) * (Number(item.quantity) || 0);
      return (
        "<tr>" +
        "<td>" + window.esc(item.name) + "</td>" +
        "<td>" + money(item.price) + " ETB</td>" +
        "<td>" + (item.quantity || 0) + "</td>" +
        "<td>" + money(sub) + " ETB</td>" +
        "</tr>"
      );
    }).join("");
  }

  async function viewPaymentDetails(id, cached) {
    var payment = cached || null;
    try {
      if (!payment) {
        var data = await window.AdminAPI.get("/admin/payments/" + id);
        payment = data.payment;
      }
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to load payment");
      return;
    }
    if (!payment) return;

    var order = payment.order || {};

    document.getElementById("modalPaymentOrderId").textContent = payment.orderId || "#0000";
    document.getElementById("modalPaymentCustomer").textContent = payment.customerName || "—";
    document.getElementById("modalPaymentCustomerPhone").textContent = payment.customerPhone || "—";
    document.getElementById("modalPaymentCustomerEmail").textContent =
      (payment.customer && payment.customer.email) || "—";
    document.getElementById("modalPaymentMethod").textContent = payment.method || "—";
    document.getElementById("modalPaymentStatus").innerHTML = paymentBadge(payment.paymentStatus);
    document.getElementById("modalPaymentAmount").textContent =
      money(payment.amount) + " " + (payment.currency || "ETB");
    document.getElementById("modalPaymentTransactionId").textContent = payment.transactionId || "—";
    document.getElementById("modalPaymentProviderReference").textContent = payment.providerReference || "—";
    document.getElementById("modalPaymentDate").textContent =
      window.AdminAPI.formatDateTime(payment.paymentDate);
    document.getElementById("modalPaymentPaidAt").textContent =
      payment.paidAt ? window.AdminAPI.formatDateTime(payment.paidAt) : "—";

    document.getElementById("modalPaymentOrderType").textContent = order.orderType || "—";
    document.getElementById("modalPaymentTableNumber").textContent = order.tableNumber || "—";
    document.getElementById("modalPaymentOrderStatus").textContent = order.orderStatus || "—";

    renderPaymentItems(order.items);
    document.getElementById("modalPaymentSubtotal").textContent = money(order.subtotal) + " ETB";
    document.getElementById("modalPaymentServiceFee").textContent = money(order.serviceFee) + " ETB";
    document.getElementById("modalPaymentTotal").textContent = money(order.totalAmount) + " ETB";

    openModal("paymentDetailsModal");
  }

  /* ============================================================
   * EVENT BINDINGS
   * ============================================================ */
  function bindEvents() {
    var refreshBtn = document.getElementById("refreshPaymentsBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", function () {
      loadPayments();
      loadStats();
      if (window.AdminToast) window.AdminToast.show("Payments refreshed");
    });

    document.querySelectorAll("[data-close-modal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        closeModal(btn.getAttribute("data-close-modal"));
      });
    });

    document.querySelectorAll(".amodal-overlay").forEach(function (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) overlay.classList.remove("open");
      });
    });

    var searchInput = document.getElementById("paymentSearchInput");
    if (searchInput) {
      var debounceTimer = null;
      searchInput.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          state.search = searchInput.value.trim();
          state.page = 1;
          loadPayments();
        }, 400);
      });
    }

    var methodFilter = document.getElementById("paymentMethodFilter");
    if (methodFilter) {
      methodFilter.addEventListener("change", function () {
        state.method = methodFilter.value;
        state.page = 1;
        loadPayments();
      });
    }

    var statusFilter = document.getElementById("paymentStatusFilter");
    if (statusFilter) {
      statusFilter.addEventListener("change", function () {
        state.status = statusFilter.value;
        state.page = 1;
        loadPayments();
      });
    }

    var dateFilter = document.getElementById("paymentDateFilter");
    if (dateFilter) {
      dateFilter.addEventListener("change", function () {
        state.date = dateFilter.value;
        state.page = 1;
        loadPayments();
      });
    }

    var sortSelect = document.getElementById("paymentSortSelect");
    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        state.sort = sortSelect.value;
        state.page = 1;
        loadPayments();
      });
    }

    var resetBtn = document.getElementById("resetPaymentFiltersBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (searchInput) searchInput.value = "";
        if (methodFilter) methodFilter.value = "";
        if (statusFilter) statusFilter.value = "";
        if (dateFilter) dateFilter.value = "";
        if (sortSelect) sortSelect.value = "newest";
        state.search = "";
        state.method = "";
        state.status = "";
        state.date = "";
        state.sort = "newest";
        state.page = 1;
        loadPayments();
      });
    }

    var prevBtn = document.getElementById("paymentPrevPageBtn");
    var nextBtn = document.getElementById("paymentNextPageBtn");
    if (prevBtn) prevBtn.addEventListener("click", function () { changePage(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { changePage(1); });

    var tbody = document.getElementById("paymentsTableBody");
    if (tbody) {
      tbody.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-action]");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        if (!id) return;

        if (action === "view") {
          var cached = (window.__paymentsCache || []).find(function (p) { return p.id === id; });
          viewPaymentDetails(id, cached);
        }
      });
    }
  }

  function init() {
    bindEvents();
    loadStats();
    loadPayments();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
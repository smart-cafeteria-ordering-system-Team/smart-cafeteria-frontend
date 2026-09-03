/**
 * ==========================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN PAYMENTS
 * ==========================================================================
 * Read-only payment monitoring driven by the live backend API:
 *   GET /admin/payments       (list / search / filter / paginate)
 *   GET /admin/payments/stats (metric cards)
 *   GET /admin/payments/:id   (payment detail / receipt)
 *
 * There are intentionally NO update/delete actions: only verified
 * Chapa / Telebirr callbacks may set paymentStatus = PAID.
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ==========================================================================
 */
(function () {
  "use strict";

  var state = {
    page: 1,
    limit: 10,
    search: "",
    method: "",
    status: "",
    sort: "newest"
  };

  function esc(value) {
    return window.esc(value);
  }

  function money(value) {
    if (value === null || value === undefined) return "0.00";
    return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function paymentBadge(paymentStatus) {
    var label = String(paymentStatus || "PENDING").toUpperCase();
    var cls = "order-badge";
    if (label === "PAID" || label === "COMPLETED") cls += " cmp";
    else if (label === "FAILED" || label === "CANCELLED") cls += " cxl";
    else cls += " pend";
    return '<span class="' + cls + '">' + window.esc(label) + "</span>";
  }

  function methodLabel(method) {
    var m = String(method || "").toUpperCase();
    return '<span class="cat-pill">' + window.esc(m === "CBE_BIRR" ? "CBE BIRR" : m || "—") + "</span>";
  }

  /* ============================================================
   * MODALS
   * ============================================================ */
  function openModal() {
    var modal = document.getElementById("paymentModal");
    if (modal) modal.style.display = "flex";
  }

  function closeModal() {
    var modal = document.getElementById("paymentModal");
    if (modal) modal.style.display = "none";
  }

  /* ============================================================
   * DATA LOADING
   * ============================================================ */
  async function loadStats() {
    try {
      var data = await window.AdminAPI.get("/admin/payments/stats");
      var stats = data.stats || {};
      setHtml("metricTotalRevenue", money(stats.totalRevenue) + " <small>ETB</small>");
      setText("metricSuccessfulPayments", stats.successfulPayments || 0);
      setText("metricPendingPayments", stats.pendingPayments || 0);
      setText("metricFailedPayments", stats.failedPayments || 0);
    } catch (e) {
      // stats are supplementary
    }
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setHtml(id, value) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = value;
  }

  async function loadPayments() {
    var tbody = document.getElementById("paymentsTableBody");
    if (!tbody || !window.AdminAPI) return;

    tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Loading...</td></tr>';

    try {
      var data = await window.AdminAPI.get("/admin/payments", {
        page: state.page,
        limit: state.limit,
        search: state.search,
        method: state.method,
        status: state.status,
        sort: state.sort
      });

      var payments = data.payments || [];
      renderPayments(payments);

      var total = data.total || 0;
      var pages = Math.max(data.pages || 1, 1);
      var page = data.page || state.page;
      renderPagination(page, pages, total);
      state.page = page;
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Failed to load payments: ' + esc(error.message || "Server error") + "</td></tr>";
    }
  }

  /* ============================================================
   * TABLE
   * ============================================================ */
  function renderPayments(payments) {
    var tbody = document.getElementById("paymentsTableBody");
    if (!tbody) return;

    if (!payments.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No payments found.</td></tr>';
      return;
    }

    tbody.innerHTML = payments.map(function (payment) {
      var customerLines = "<strong>" + esc(payment.customerName || "—") + "</strong>" +
        (payment.customerPhone ? "<small>" + esc(payment.customerPhone) + "</small>" : "");

      return (
        "<tr>" +
        '<td><span class="mono-ref">' + esc(payment.transactionId || "—") + "</span></td>" +
        '<td><strong>' + esc(payment.orderId || "—") + "</strong></td>" +
        '<td><div class="user-cell"><div class="user-avatar">' + esc((payment.customerName || "?").charAt(0)) + "</div><div>" + customerLines + "</div></div></td>" +
        "<td>" + methodLabel(payment.method) + "</td>" +
        "<td><strong>" + money(payment.amount) + "</strong> " + esc(payment.currency || "ETB") + "</td>" +
        "<td>" + paymentBadge(payment.paymentStatus) + "</td>" +
        "<td>" + window.AdminAPI.formatDateTime(payment.paymentDate || payment.createdAt) + "</td>" +
        "<td>" +
          '<div class="table-actions">' +
            '<button class="action-btn" data-action="view" data-id="' + esc(payment.id) + '" title="View payment details"><i class="fa-solid fa-eye"></i></button>' +
          "</div>" +
        "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderPagination(page, pages, total) {
    var container = document.getElementById("paymentPaginationControls");
    if (!container) return;

    container.innerHTML =
      '<div class="pagination-info">Page ' + page + " of " + pages + " (" + total + " payments)</div>" +
      '<div class="pagination">' +
        '<button class="page-btn" id="paymentPrevPageBtn"' + (page <= 1 ? " disabled" : "") + '><i class="fa-solid fa-chevron-left"></i> Prev</button>' +
        '<button class="page-btn" id="paymentNextPageBtn"' + (page >= pages ? " disabled" : "") + '>Next <i class="fa-solid fa-chevron-right"></i></button>' +
      "</div>";

    var prevBtn = document.getElementById("paymentPrevPageBtn");
    var nextBtn = document.getElementById("paymentNextPageBtn");
    if (prevBtn) prevBtn.addEventListener("click", function () { changePage(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { changePage(1); });
  }

  function changePage(delta) {
    state.page += delta;
    if (state.page < 1) state.page = 1;
    loadPayments();
  }

  /* ============================================================
   * PAYMENT DETAILS
   * ============================================================ */
  async function viewPaymentDetails(id) {
    var receipt = document.getElementById("paymentReceiptDetails");
    try {
      var data = await window.AdminAPI.get("/admin/payments/" + encodeURIComponent(id));
      var payment = data.payment;
      if (!payment) {
        if (window.AdminToast) window.AdminToast.error("Payment not found");
        return;
      }
      if (receipt) receipt.innerHTML = renderReceipt(payment);
      openModal();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to load payment");
    }
  }

  function renderReceipt(payment) {
    var order = payment.order || {};
    var items = (order.items || []).map(function (item) {
      var sub = (Number(item.price) || 0) * (Number(item.quantity) || 0);
      return (
        "<tr>" +
        "<td>" + esc(item.name) + "</td>" +
        "<td>" + money(item.price) + " ETB</td>" +
        "<td>" + (item.quantity || 0) + "</td>" +
        "<td>" + money(sub) + " ETB</td>" +
        "</tr>"
      );
    }).join("");

    return (
      '<div class="card-header table-header-actions">' +
        "<h3>Payment Receipt</h3>" +
      "</div>" +
      '<div class="divider"></div>' +
      "<table class='admin-table'>" +
        "<tbody>" +
          "<tr><td><strong>Transaction ID</strong></td><td>" + esc(payment.transactionId || "—") + "</td></tr>" +
          "<tr><td><strong>Order ID</strong></td><td>" + esc(payment.orderId || "—") + "</td></tr>" +
          "<tr><td><strong>Customer</strong></td><td>" + esc(payment.customerName || "—") +
            (payment.customerPhone ? "<br><small>" + esc(payment.customerPhone) + "</small>" : "") +
            (payment.customer && payment.customer.email ? "<br><small>" + esc(payment.customer.email) + "</small>" : "") + "</td></tr>" +
          "<tr><td><strong>Method</strong></td><td>" + esc(payment.method || "—") + "</td></tr>" +
          "<tr><td><strong>Provider Reference</strong></td><td>" + esc(payment.providerReference || "—") + "</td></tr>" +
          "<tr><td><strong>Amount</strong></td><td><strong>" + money(payment.amount) + " " + esc(payment.currency || "ETB") + "</strong></td></tr>" +
          "<tr><td><strong>Status</strong></td><td>" + paymentBadge(payment.paymentStatus) + "</td></tr>" +
          "<tr><td><strong>Payment Date</strong></td><td>" + window.AdminAPI.formatDateTime(payment.paymentDate || payment.createdAt) + "</td></tr>" +
        "</tbody>" +
      "</table>" +
      '<div class="divider"></div>' +
      (order.items && order.items.length
        ? "<table class='admin-table'><thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead><tbody>" + items + "</tbody></table>"
        : "") +
      '<div class="divider"></div>' +
      "<table class='admin-table'>" +
        "<tbody>" +
          "<tr><td><strong>Subtotal</strong></td><td>" + money(order.subtotal) + " ETB</td></tr>" +
          "<tr><td><strong>Service Fee</strong></td><td>" + money(order.serviceFee) + " ETB</td></tr>" +
          "<tr><td><strong>Total</strong></td><td><strong>" + money(order.totalAmount) + " ETB</strong></td></tr>" +
        "</tbody>" +
      "</table>"
    );
  }

  /* ============================================================
   * EVENT BINDINGS
   * ============================================================ */
  function bindEvents() {
    var refreshBtn = document.getElementById("refreshPaymentsBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", function () {
      loadPayments();
      loadStats();
      if (window.AdminToast) window.AdminToast.success("Payments refreshed");
    });

    var closeBtn = document.getElementById("closePaymentModalBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    var footerCloseBtn = document.getElementById("closePaymentModalFooterBtn");
    if (footerCloseBtn) footerCloseBtn.addEventListener("click", closeModal);
    var modal = document.getElementById("paymentModal");
    if (modal) modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
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

    var tbody = document.getElementById("paymentsTableBody");
    if (tbody) {
      tbody.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-action]");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        if (!id) return;

        if (action === "view") viewPaymentDetails(id);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.AdminAPI) return;
    bindEvents();
    loadStats();
    loadPayments();
  });
})();
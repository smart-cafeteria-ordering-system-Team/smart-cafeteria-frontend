/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN ORDER MANAGEMENT
 * ================================================================
 * Admin Order Management driven by the backend API:
 *   GET    /admin/orders/stats      (metric cards)
 *   GET    /admin/orders            (list / search / filter / paginate)
 *   GET    /admin/orders/:id        (details with customer + payment)
 *   PATCH  /admin/orders/:id/status (update status, respects flow rules)
 *   PATCH  /admin/orders/:id/cancel (cancel order)
 *
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ================================================================
 */
(function () {
  "use strict";

  var FLOW = ["PENDING", "PREPARING", "READY", "SERVED", "COMPLETED"];

  var state = {
    page: 1,
    limit: 10,
    search: "",
    status: "",
    paymentStatus: "",
    sort: "newest"
  };

  function money(value) {
    if (value === null || value === undefined) return "0.00";
    return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function statusBadge(status) {
    var cls = "order-badge";
    var s = String(status || "PENDING").toUpperCase();
    switch (s) {
      case "PENDING": cls += " pend"; break;
      case "PREPARING": cls += " prep"; break;
      case "READY": cls += " rd"; break;
      case "SERVED": cls += " svd"; break;
      case "COMPLETED": cls += " cmp"; break;
      case "CANCELLED": cls += " cxl"; break;
      default: cls += " pend"; break;
    }
    var label = s.charAt(0) + s.slice(1).toLowerCase();
    return '<span class="' + cls + '">' + window.esc(label) + "</span>";
  }

  function paymentBadge(paymentStatus) {
    var cls = "order-badge";
    switch (String(paymentStatus || "").toUpperCase()) {
      case "PAID": cls += " cmp"; break;
      case "SUCCESS": cls += " cmp"; break;
      case "SIMULATED": cls += " cmp"; break;
      case "FAILED": cls += " cxl"; break;
      case "REFUNDED": cls += " cxl"; break;
      default: cls += " pend"; break;
    }
    return '<span class="' + cls + '">' + window.esc(String(paymentStatus || "PENDING")) + "</span>";
  }

  function getNextStatus(current) {
    var idx = FLOW.indexOf(String(current || "").toUpperCase());
    if (idx >= 0 && idx < FLOW.length - 1) return FLOW[idx + 1];
    return null;
  }

  function canCancel(current) {
    var s = String(current || "").toUpperCase();
    return s === "PENDING" || s === "PREPARING";
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
      var data = await window.AdminAPI.get("/admin/orders/stats");
      var stats = data.stats || {};
      var totalEl = document.getElementById("metricTotalOrders");
      var pendingEl = document.getElementById("metricPendingOrders");
      var preparingEl = document.getElementById("metricPreparingOrders");
      var completedEl = document.getElementById("metricCompletedOrders");
      if (totalEl) totalEl.textContent = stats.totalOrders || 0;
      if (pendingEl) pendingEl.textContent = stats.pendingOrders || 0;
      if (preparingEl) preparingEl.textContent = stats.preparingOrders || 0;
      if (completedEl) completedEl.textContent =
        (stats.completedOrders || 0) + (stats.servedOrders || 0);
    } catch (e) {
      // stats are supplementary
    }
  }

  async function loadOrders() {
    var tbody = document.getElementById("ordersTableBody");
    if (!tbody || !window.AdminAPI) return;

    tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Loading orders...</td></tr>';

    try {
      var data = await window.AdminAPI.get("/admin/orders", {
        page: state.page,
        limit: state.limit,
        search: state.search,
        status: state.status,
        paymentStatus: state.paymentStatus,
        sort: state.sort
      });

      window.__ordersCache = data.orders || [];
      renderOrders(window.__ordersCache);

      var total = data.total || 0;
      var pages = Math.max(data.pages || 1, 1);
      renderPagination(total, pages);
      state.page = data.page || 1;
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Failed to load orders: ' +
        window.esc(error.message || "Server error") + "</td></tr>";
    }
  }

  function renderPagination(total, pages) {
    var container = document.getElementById("orderPaginationControls");
    if (!container) return;
    container.innerHTML =
      '<div class="pagination">' +
        '<div class="pagination-info">Page ' + state.page + " of " + pages + " (" + total + " total)</div>" +
        '<button class="page-btn" id="orderPrevPageBtn"' + (state.page <= 1 ? " disabled" : "") + '>' +
          '<i class="fa-solid fa-chevron-left"></i> Prev</button>' +
        '<button class="page-btn" id="orderNextPageBtn"' + (state.page >= pages ? " disabled" : "") + '>' +
          'Next <i class="fa-solid fa-chevron-right"></i></button>' +
      "</div>";

    var prevBtn = document.getElementById("orderPrevPageBtn");
    var nextBtn = document.getElementById("orderNextPageBtn");
    if (prevBtn) prevBtn.addEventListener("click", function () { changePage(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { changePage(1); });
  }

  function renderOrders(orders) {
    var tbody = document.getElementById("ordersTableBody");
    if (!tbody) return;

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No orders found.</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(function (order) {
      var status = String(order.status || "PENDING").toUpperCase();
      var showCancel = canCancel(status);
      var cancelBtn = showCancel
        ? '<button class="action-btn danger" data-action="cancel" data-id="' + order.id +
          '" title="Cancel order"><i class="fa-solid fa-ban"></i></button>'
        : "";

      var customerLines = "<strong>" + window.esc(order.customerName || "—") + "</strong>" +
        (order.customerPhone ? "<small>" + window.esc(order.customerPhone) + "</small>" : "") +
        (order.customer && order.customer.email ? "<small>" + window.esc(order.customer.email) + "</small>" : "");

      var paymentLine = '<span class="pay-method">' + window.esc(order.paymentMethod || "—") + "</span> " +
        paymentBadge(order.paymentStatus);

      return (
        "<tr>" +
        '<td><div class="user-cell"><div class="order-id-cell">' +
          "<strong>" + window.esc(order.orderId || "—") + "</strong>" +
        "</div></div></td>" +
        '<td><div class="user-cell"><div class="user-avatar">' +
          window.esc((order.customerName || "?").charAt(0)) +
          "</div><div>" + customerLines + "</div></div></td>" +
        '<td><div class="order-item-count">' + (order.itemCount || 0) + " items</div></td>" +
        "<td><strong>" + money(order.totalAmount) + " ETB</strong></td>" +
        "<td>" + paymentLine + "</td>" +
        "<td>" + statusBadge(status) + "</td>" +
        "<td>" + window.AdminAPI.formatDateTime(order.createdAt || order.orderTime) + "</td>" +
        "<td>" +
          '<div class="table-actions">' +
            '<button class="action-btn" data-action="view" data-id="' + order.id + '" title="View order details"><i class="fa-solid fa-eye"></i></button>' +
            cancelBtn +
          "</div>" +
        "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function changePage(delta) {
    state.page += delta;
    if (state.page < 1) state.page = 1;
    loadOrders();
  }

  /* ============================================================
   * ORDER DETAILS
   * ============================================================ */
  function renderOrderItems(items) {
    var tbody = document.getElementById("modalOrderItemsBody");
    if (!tbody) return;
    if (!items || !items.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="table-empty">No items</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(function (item) {
      var sub = (Number(item.price) || 0) * (Number(item.quantity) || 0);
      return (
        "<tr>" +
        "<td>" +
          window.esc(item.name || "—") +
          (item.notes ? ' <small class="item-note">(' + window.esc(item.notes) + ")</small>" : "") +
        "</td>" +
        "<td>" + money(item.price) + " ETB</td>" +
        "<td>" + (item.quantity || 0) + "</td>" +
        "<td>" + money(sub) + " ETB</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderStatusSelect(status) {
    var select = document.getElementById("updateOrderStatusSelect");
    var saveBtn = document.getElementById("saveOrderStatusBtn");
    if (!select) return;

    var s = String(status || "PENDING").toUpperCase();
    var next = getNextStatus(s);

    if (!next) {
      select.innerHTML = '<option value="">' +
        (s === "CANCELLED"
          ? "Order cancelled — no further updates"
          : "Order " + s.toLowerCase() + " — flow complete") +
        "</option>";
      select.disabled = true;
      if (saveBtn) saveBtn.style.display = "none";
      return;
    }

    select.disabled = false;
    select.innerHTML =
      '<option value="">Select next status...</option>' +
      '<option value="' + next + '">' + next.charAt(0) + next.slice(1).toLowerCase() + "</option>";
    if (saveBtn) saveBtn.style.display = "";
  }

  async function viewOrderDetails(id, cached) {
    var order = cached || null;
    try {
      if (!order) {
        var data = await window.AdminAPI.get("/admin/orders/" + id);
        order = data.order;
      }
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to load order");
      return;
    }
    if (!order) return;

    var status = String(order.status || "PENDING").toUpperCase();

    document.getElementById("modalOrderId").textContent = order.orderId || "#0000";
    document.getElementById("modalCustomerName").textContent = order.customerName || "—";
    document.getElementById("modalCustomerEmail").textContent =
      (order.customer && order.customer.email) || "—";
    document.getElementById("modalOrderDate").textContent =
      window.AdminAPI.formatDateTime(order.createdAt || order.orderTime);
    document.getElementById("modalPaymentMethod").textContent = order.paymentMethod || "—";

    renderOrderItems(order.items);
    document.getElementById("modalOrderTotal").textContent = money(order.totalAmount) + " ETB";

    window.__activeOrder = order;
    renderStatusSelect(status);
    openModal("orderDetailsModal");
  }

  async function saveOrderStatus() {
    var select = document.getElementById("updateOrderStatusSelect");
    var order = window.__activeOrder;
    if (!order) return;
    if (!select || !select.value) {
      if (window.AdminToast) window.AdminToast.error("Select a status to apply");
      return;
    }

    try {
      await window.AdminAPI.patch("/admin/orders/" + order.id + "/status", { status: select.value });
      closeModal("orderDetailsModal");
      if (window.AdminToast) window.AdminToast.success("Order status updated to " + select.value);
      loadOrders();
      loadStats();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to update order status");
    }
  }

  async function cancelOrder(id) {
    var order = (window.__ordersCache || []).find(function (o) { return o.id === id; });
    if (!order) return;
    if (!window.confirm('Cancel order ' + order.orderId + '? This cannot be undone.')) return;

    try {
      await window.AdminAPI.patch("/admin/orders/" + id + "/cancel", {
        reason: "Cancelled by admin",
        adminNote: "Cancelled by admin"
      });
      if (window.AdminToast) window.AdminToast.success("Order " + order.orderId + " cancelled");
      loadOrders();
      loadStats();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to cancel order");
    }
  }

  /* ============================================================
   * EVENT BINDINGS
   * ============================================================ */
  function bindEvents() {
    var refreshBtn = document.getElementById("refreshOrdersBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", function () {
      loadOrders();
      loadStats();
      if (window.AdminToast) window.AdminToast.show("Orders refreshed");
    });

    var closeBtn = document.getElementById("closeOrderModalBtn");
    if (closeBtn) closeBtn.addEventListener("click", function () { closeModal("orderDetailsModal"); });

    var cancelModalBtn = document.getElementById("cancelOrderModalBtn");
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", function () { closeModal("orderDetailsModal"); });

    var modal = document.getElementById("orderDetailsModal");
    if (modal) modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal("orderDetailsModal");
    });

    var searchInput = document.getElementById("orderSearchInput");
    if (searchInput) {
      var debounceTimer = null;
      searchInput.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          state.search = searchInput.value.trim();
          state.page = 1;
          loadOrders();
        }, 400);
      });
    }

    var statusFilter = document.getElementById("orderStatusFilter");
    if (statusFilter) {
      statusFilter.addEventListener("change", function () {
        state.status = statusFilter.value;
        state.page = 1;
        loadOrders();
      });
    }

    var paymentFilter = document.getElementById("paymentStatusFilter");
    if (paymentFilter) {
      paymentFilter.addEventListener("change", function () {
        state.paymentStatus = paymentFilter.value;
        state.page = 1;
        loadOrders();
      });
    }

    var saveStatusBtn = document.getElementById("saveOrderStatusBtn");
    if (saveStatusBtn) saveStatusBtn.addEventListener("click", saveOrderStatus);

    var tbody = document.getElementById("ordersTableBody");
    if (tbody) {
      tbody.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-action]");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        if (!id) return;

        if (action === "view") {
          var cached = (window.__ordersCache || []).find(function (o) { return o.id === id; });
          viewOrderDetails(id, cached);
        } else if (action === "cancel") {
          cancelOrder(id);
        }
      });
    }
  }

  function init() {
    bindEvents();
    loadStats();
    loadOrders();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

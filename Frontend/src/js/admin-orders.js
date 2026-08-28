/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN ORDER MANAGEMENT
 * ================================================================
 * Admin Order Management driven by the backend API:
 *   GET    /admin/orders            (list / search / filter / sort / paginate)
 *   GET    /admin/orders/stats      (metric cards)
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
    orderType: "",
    sort: "newest"
  };

  function money(value) {
    if (value === null || value === undefined) return "0";
    return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function escapeHtml(value) {
    return window.esc(value);
  }

  function statusBadge(status) {
    var cls = "order-badge";
    var s = String(status || "").toUpperCase();
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
    return '<span class="' + cls + '">' + label + "</span>";
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

  function getNextStatus(current) {
    var idx = FLOW.indexOf(String(current || "").toUpperCase());
    if (idx >= 0 && idx < FLOW.length - 1) return FLOW[idx + 1];
    return null;
  }

  function canCancel(current) {
    var idx = FLOW.indexOf(String(current || "").toUpperCase());
    return idx === 0 || idx === 1; // PENDING or PREPARING
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
      var data = await window.AdminAPI.get("/admin/orders/stats");
      var stats = data.stats || {};
      document.getElementById("metricTotalOrders").textContent = stats.totalOrders || 0;
      document.getElementById("metricPendingOrders").textContent = stats.pendingOrders || 0;
      document.getElementById("metricPreparingOrders").textContent = stats.preparingOrders || 0;
      document.getElementById("metricReadyOrders").textContent = stats.readyOrders || 0;
      document.getElementById("metricCompletedOrders").textContent =
        (stats.completedOrders || 0) + (stats.servedOrders || 0);
      document.getElementById("metricCancelledOrders").textContent = stats.cancelledOrders || 0;
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
        orderType: state.orderType,
        sort: state.sort
      });

      window.__ordersCache = data.orders || [];
      renderOrders(window.__ordersCache);

      var total = data.total || 0;
      var pages = Math.max(data.pages || 1, 1);
      var info = document.getElementById("orderPaginationInfo");
      if (info) info.textContent = "Page " + (data.page || state.page) + " of " + pages + " (" + total + " orders)";
      var prevBtn = document.getElementById("orderPrevPageBtn");
      var nextBtn = document.getElementById("orderNextPageBtn");
      if (prevBtn) prevBtn.disabled = (data.page || 1) <= 1;
      if (nextBtn) nextBtn.disabled = (data.page || 1) >= pages;
      state.page = data.page || 1;
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Failed to load orders: ' + window.esc(error.message || "Server error") + "</td></tr>";
    }
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
        ? '<button class="action-btn danger" data-action="cancel" data-id="' + order.id + '" title="Cancel order"><i class="fa-solid fa-ban"></i></button>'
        : "";

      var customerLines = "<strong>" + escapeHtml(order.customerName) + "</strong>" +
        "<small>" + escapeHtml(order.customerPhone || "") + "</small>" +
        (order.customer && order.customer.email ? "<small>" + escapeHtml(order.customer.email) + "</small>" : "");

      var paymentLine = "<span class=\"pay-method\">" + escapeHtml(order.paymentMethod || "—") + "</span> " +
        paymentBadge(order.paymentStatus);

      return (
        "<tr>" +
        "<td>" +
          '<div class="user-cell">' +
            '<div class="order-id-cell">' +
              "<strong>" + escapeHtml(order.orderId) + "</strong>" +
              "<small>" + (order.orderType || "dine-in") + (order.tableNumber && order.tableNumber !== "N/A" ? " · Table " + escapeHtml(order.tableNumber) : "") + "</small>" +
            "</div>" +
          "</div>" +
        "</td>" +
        '<td><div class="user-cell"><div class="user-avatar">' + escapeHtml((order.customerName || "?").charAt(0)) + "</div><div>" + customerLines + "</div></div></td>" +
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
    if (!items || !items.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="table-empty">No items</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(function (item) {
      var sub = (Number(item.price) || 0) * (Number(item.quantity) || 0);
      return (
        "<tr>" +
        "<td>" +
          escapeHtml(item.name) +
          (item.notes ? ' <small class="item-note">(' + escapeHtml(item.notes) + ")</small>" : "") +
        "</td>" +
        "<td>" + money(item.price) + " ETB</td>" +
        "<td>" + item.quantity + "</td>" +
        "<td>" + money(sub) + " ETB</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderStatusSelect(status) {
    var select = document.getElementById("updateOrderStatusSelect");
    var hint = document.getElementById("statusFlowHint");
    var cancelBtn = document.getElementById("cancelOrderBtn");

    if (!select) return;
    var s = String(status || "PENDING").toUpperCase();
    var next = getNextStatus(s);

    cancelBtn.style.display = canCancel(s) ? "inline-flex" : "none";

    if (!next) {
      select.innerHTML = '<option value="">' + (s === "CANCELLED" ? "Order cancelled — no further updates" : "Order " + s.toLowerCase() + " — flow complete") + "</option>";
      select.disabled = true;
      if (hint) hint.textContent = "";
      return;
    }

    select.disabled = false;
    select.innerHTML =
      '<option value="">Select next status...</option>' +
      '<option value="' + next + '">' + next.charAt(0) + next.slice(1).toLowerCase() + "</option>";
    if (hint) hint.textContent = "PENDING → PREPARING → READY → SERVED → COMPLETED. Current: " + s + ".";
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
    document.getElementById("modalCustomerPhone").textContent = order.customerPhone || "—";
    document.getElementById("modalCustomerEmail").textContent = (order.customer && order.customer.email) || "—";
    document.getElementById("modalOrderDate").textContent = window.AdminAPI.formatDateTime(order.createdAt || order.orderTime);
    document.getElementById("modalOrderType").textContent = order.orderType || "dine-in";
    document.getElementById("modalTableNumber").textContent = order.tableNumber || "N/A";
    document.getElementById("modalPaymentMethod").textContent = order.paymentMethod || "—";
    document.getElementById("modalPaymentStatus").innerHTML = paymentBadge(order.paymentStatus);
    document.getElementById("modalTransactionId").textContent =
      (order.payment && order.payment.transactionId) || order.transactionId || "—";

    renderOrderItems(order.items);
    document.getElementById("modalSubtotal").textContent = money(order.subtotal) + " ETB";
    document.getElementById("modalServiceFee").textContent = money(order.serviceFee) + " ETB";
    document.getElementById("modalOrderTotal").textContent = money(order.totalAmount) + " ETB";

    document.getElementById("modalOrderTime").textContent = window.AdminAPI.formatDateTime(order.orderTime || order.createdAt);
    document.getElementById("modalReadyTime").textContent = order.readyTime ? window.AdminAPI.formatDateTime(order.readyTime) : "—";
    document.getElementById("modalCompletedTime").textContent = order.completedTime ? window.AdminAPI.formatDateTime(order.completedTime) : "—";

    var cancelInfo = "—";
    if (order.cancellation && (order.cancellation.reason || order.cancellation.requested)) {
      var parts = [];
      if (order.cancellation.reason) parts.push("Reason: " + order.cancellation.reason);
      if (order.cancellation.requested) parts.push("Requested");
      if (order.cancellation.adminNote) parts.push("Note: " + order.cancellation.adminNote);
      cancelInfo = parts.join(" · ") || "—";
    } else if (status === "CANCELLED") {
      cancelInfo = "Cancelled";
    }
    document.getElementById("modalCancellationInfo").textContent = cancelInfo;

    window.__activeOrder = order;
    renderStatusSelect(status);
    openModal("orderDetailsModal");
  }

  async function saveOrderStatus() {
    var select = document.getElementById("updateOrderStatusSelect");
    var order = window.__activeOrder;
    if (!order || !select.value) {
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

  async function cancelCurrentOrder() {
    var order = window.__activeOrder;
    if (!order) return;

    if (!window.confirm('Cancel order ' + order.orderId + '? This cannot be undone.')) return;
    var reason = window.prompt("Cancellation reason (optional):", "Cancelled by admin");

    try {
      await window.AdminAPI.patch("/admin/orders/" + order.id + "/cancel", {
        reason: reason || "Cancelled by admin",
        adminNote: reason || "Cancelled by admin"
      });
      closeModal("orderDetailsModal");
      if (window.AdminToast) window.AdminToast.success("Order cancelled");
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

    var typeFilter = document.getElementById("orderTypeFilter");
    if (typeFilter) {
      typeFilter.addEventListener("change", function () {
        state.orderType = typeFilter.value;
        state.page = 1;
        loadOrders();
      });
    }

    var sortSelect = document.getElementById("orderSortSelect");
    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        state.sort = sortSelect.value;
        state.page = 1;
        loadOrders();
      });
    }

    var resetBtn = document.getElementById("resetOrderFiltersBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (searchInput) searchInput.value = "";
        if (statusFilter) statusFilter.value = "";
        if (paymentFilter) paymentFilter.value = "";
        if (typeFilter) typeFilter.value = "";
        if (sortSelect) sortSelect.value = "newest";
        state.search = "";
        state.status = "";
        state.paymentStatus = "";
        state.orderType = "";
        state.sort = "newest";
        state.page = 1;
        loadOrders();
      });
    }

    var prevBtn = document.getElementById("orderPrevPageBtn");
    var nextBtn = document.getElementById("orderNextPageBtn");
    if (prevBtn) prevBtn.addEventListener("click", function () { changePage(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { changePage(1); });

    var saveStatusBtn = document.getElementById("saveOrderStatusBtn");
    if (saveStatusBtn) saveStatusBtn.addEventListener("click", saveOrderStatus);

    var cancelBtn = document.getElementById("cancelOrderBtn");
    if (cancelBtn) cancelBtn.addEventListener("click", cancelCurrentOrder);

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
          var order = (window.__ordersCache || []).find(function (o) { return o.id === id; });
          if (!order) return;
          viewOrderDetails(id, order).then(function () {
            setTimeout(() => {
              var cancelBtnEl = document.getElementById("cancelOrderBtn");
              if (cancelBtnEl && cancelBtnEl.style.display !== "none") cancelBtnEl.click();
            }, 100);
          });
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
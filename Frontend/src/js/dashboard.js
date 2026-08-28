/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN DASHBOARD
 * ================================================================
 * Loads real MongoDB statistics from the backend dashboard API
 * (GET /api/v1/admin/dashboard) and renders:
 *   - Statistics cards (users, menu, orders, payments, revenue)
 *   - Charts (order status doughnut + last 7 days revenue bars)
 *   - Recent orders & recent payments tables
 *
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ================================================================
 */
(function () {
  "use strict";

  var charts = [];

  function money(value) {
    if (value === null || value === undefined) return "0";
    return Number(value).toLocaleString("en-US");
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function destroyCharts() {
    charts.forEach(function (chart) {
      try {
        chart.destroy();
      } catch (e) { /* noop */ }
    });
    charts = [];
  }

  function badgeClass(status) {
    return String(status || "").toLowerCase();
  }

  function formatDate(value) {
    return window.AdminAPI ? window.AdminAPI.formatDate(value) : "—";
  }

  function formatDateTime(value) {
    if (!value) return "—";
    var d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  /* ============================================================
   * STAT CARDS
   * ============================================================ */
  function renderStats(d) {
    if (!d) return;

    // Users
    if (d.users) {
      setText("statTotalUsers", d.users.total || 0);
      setText("statStudents", d.users.students || 0);
      setText("statKitchenStaff", d.users.kitchenStaff || 0);
      setText("statAdmins", d.users.admins || 0);
    }

    // Menu
    if (d.menu) {
      setText("statTotalMenu", d.menu.total || 0);
      setText("statAvailableMenu", d.menu.available || 0);
      setText("statUnavailableMenu", d.menu.unavailable || 0);
    }

    // Orders
    if (d.orders) {
      setText("statTotalOrders", d.orders.total || 0);
      setText("statPendingOrders", d.orders.pending || 0);
      setText("statPreparingOrders", d.orders.preparing || 0);
      setText("statReadyOrders", d.orders.ready || 0);
      setText("statServedOrders", d.orders.served || 0);
      setText("statCompletedOrders", d.orders.completed || 0);
      setText("statCancelledOrders", d.orders.cancelled || 0);
    }

    // Payments
    if (d.payments) {
      setText("statSuccessfulPayments", d.payments.successful || 0);
      setText("statPendingPayments", d.payments.pending || 0);
      setText("statFailedPayments", d.payments.failed || 0);
    }

    // Revenue
    if (d.revenue) {
      var todayEl = document.getElementById("statTodayRevenue");
      if (todayEl) todayEl.innerHTML = money(d.revenue.today) + " <small>ETB</small>";
      var totalEl = document.getElementById("statTotalRevenue");
      if (totalEl) totalEl.innerHTML = money(d.revenue.total) + " <small>ETB</small>";
    }

    // Cancellations badge
    var refundBadge = document.getElementById("sidebarRefundBadge");
    if (refundBadge && d.cancellations) {
      refundBadge.textContent = d.cancellations.pending || 0;
      refundBadge.style.display = d.cancellations.pending > 0 ? "inline-block" : "none";
    }
  }

  /* ============================================================
   * CHARTS
   * ============================================================ */
  function renderOrderStatusChart(orders) {
    var canvas = document.getElementById("orderStatusChart");
    if (!canvas || typeof Chart === "undefined") return;

    var labels = ["Pending", "Preparing", "Ready", "Served", "Completed", "Cancelled"];
    var keys = ["pending", "preparing", "ready", "served", "completed", "cancelled"];
    var colors = ["#f59e0b", "#3b82f6", "#06b6d4", "#10b981", "#0d9488", "#ef4444"];
    var data = keys.map(function (k) { return (orders && orders[k]) || 0; });

    var chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
    charts.push(chart);
  }

  function renderRevenueChart(series) {
    var canvas = document.getElementById("revenueChart");
    if (!canvas || typeof Chart === "undefined") return;

    var days = (series && series.last7Days) || [];
    var labels = days.map(function (d) {
      var parts = d.date.split("-");
      return parts[1] + "/" + parts[2];
    });
    var revenue = days.map(function (d) { return d.revenue || 0; });
    var orderCounts = days.map(function (d) { return d.orders || 0; });

    var chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Revenue (ETB)",
            data: revenue,
            backgroundColor: "rgba(79, 70, 229, 0.75)",
            borderColor: "#4f46e5",
            borderWidth: 1,
            yAxisID: "y"
          },
          {
            label: "Orders",
            data: orderCounts,
            type: "line",
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            tension: 0.3,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { position: "bottom" } },
        scales: {
          y: {
            beginAtZero: true,
            position: "left"
          },
          y1: {
            beginAtZero: true,
            position: "right",
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
    charts.push(chart);
  }

  /* ============================================================
   * TABLES
   * ============================================================ */
  function renderRecentOrders(orders) {
    var tbody = document.getElementById("recentOrdersTableBody");
    if (!tbody) return;

    if (!orders || orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No orders recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(function (o) {
      var status = o.status || "pending";
      var payment = o.paymentStatus || "PENDING";
      return (
        '<tr>' +
        '<td><strong>' + window.esc(o.orderId || "ET-0000") + '</strong></td>' +
        '<td>' + window.esc(o.customerName || "Customer") + '</td>' +
        '<td>' + money(o.totalAmount) + ' ETB</td>' +
        '<td><span class="order-badge ' + badgeClass(payment) + '">' + window.esc(payment) + '</span></td>' +
        '<td><span class="order-badge ' + badgeClass(status) + '">' + window.esc(status.charAt(0).toUpperCase() + status.slice(1)) + '</span></td>' +
        '<td>' + formatDateTime(o.createdAt) + '</td>' +
        '</tr>'
      );
    }).join("");
  }

  function renderRecentPayments(payments) {
    var tbody = document.getElementById("recentPaymentsTableBody");
    if (!tbody) return;

    if (!payments || payments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No payments recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = payments.map(function (p) {
      var customer = p.customer ? p.customer.name : (p.phone || "—");
      var provider = p.provider || p.method || "—";
      return (
        '<tr>' +
        '<td><strong>' + window.esc(p.transactionId || "—") + '</strong></td>' +
        '<td>' + window.esc(customer) + '</td>' +
        '<td>' + money(p.amount) + ' ' + window.esc(p.currency || "ETB") + '</td>' +
        '<td>' + window.esc(provider) + '</td>' +
        '<td><span class="order-badge ' + badgeClass(p.status) + '">' + window.esc(p.status || "—") + '</span></td>' +
        '<td>' + formatDateTime(p.createdAt) + '</td>' +
        '</tr>'
      );
    }).join("");
  }

  /* ============================================================
   * DATA LOADING
   * ============================================================ */
  async function loadDashboard() {
    if (!window.AdminAPI) return;

    var now = new Date();
    var updatedEl = document.getElementById("lastUpdated");
    if (updatedEl) {
      updatedEl.textContent = "Last updated: " + now.toLocaleTimeString("en-US");
    }

    // Parallel: dashboard stats + recent orders + recent payments
    try {
      var results = await Promise.all([
        window.AdminAPI.get("/admin/dashboard"),
        window.AdminAPI.get("/admin/dashboard/recent-orders", { limit: 6 }),
        window.AdminAPI.get("/admin/dashboard/recent-payments", { limit: 6 })
      ]);

      var stats = results[0] && results[0].data;
      var ordersResponse = results[1] || {};
      var paymentsResponse = results[2] || {};

      destroyCharts();
      renderStats(stats);
      if (stats) {
        renderOrderStatusChart(stats.orders);
        renderRevenueChart(stats.chart);
      }
      renderRecentOrders(ordersResponse.orders);
      renderRecentPayments(paymentsResponse.payments);

      if (window.AdminToast) window.AdminToast.show("Dashboard refreshed");
    } catch (error) {
      if (window.AdminToast) {
        window.AdminToast.error("Failed to load dashboard: " + (error.message || "Server error"));
      }
      var oBody = document.getElementById("recentOrdersTableBody");
      var pBody = document.getElementById("recentPaymentsTableBody");
      if (oBody) oBody.innerHTML = '<tr><td colspan="6" class="table-empty">Could not load orders from server.</td></tr>';
      if (pBody) pBody.innerHTML = '<tr><td colspan="6" class="table-empty">Could not load payments from server.</td></tr>';
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var refreshBtn = document.getElementById("refreshMetricsBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        loadDashboard();
      });
    }
    loadDashboard();
  });
})();
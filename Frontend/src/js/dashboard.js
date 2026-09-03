/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN DASHBOARD
 * ================================================================
 * Loads real MongoDB statistics from the backend dashboard API
 * (GET /api/v1/admin/dashboard) and renders:
 *   - Statistics cards (users, menu, orders, payments, revenue)
 *   - Charts (order status doughnut + last 7 days revenue bars)
 *   - Recent orders & recent payments tables
 *   - Auto-refresh, date filtering, export, search, alerts
 *
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ================================================================
 */
(function () {
  "use strict";

  var charts = [];
  var autoRefreshInterval = null;
  var autoRefreshEnabled = false;
  var currentDateRange = "7d";
  var refreshIntervalMs = 30000; // 30 seconds default

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

  /* ====================================================================
   * STAT CARDS
   * ==================================================================== */
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
    var refundBadge = document.getElementById("sidebarRefundBadge") ||
      document.getElementById("sidebarCancellationBadge");
    if (refundBadge && d.cancellations) {
      refundBadge.textContent = d.cancellations.pending || 0;
      refundBadge.style.display = d.cancellations.pending > 0 ? "inline-block" : "none";
    }

    // Render critical alerts
    renderAlerts(d);
  }

  function renderAlerts(d) {
    var alertsContainer = document.getElementById("alertsContainer");
    if (!alertsContainer) return;

    var alerts = [];

    // Pending cancellations
    if (d.cancellations && d.cancellations.pending > 0) {
      alerts.push({
        type: "warning",
        icon: "fa-triangle-exclamation",
        title: "Pending Cancellations",
        message: d.cancellations.pending + " cancellation request(s) awaiting review",
        action: { text: "View Cancellations", url: "cancellations.html" }
      });
    }

    // Failed payments
    if (d.payments && d.payments.failed > 0) {
      alerts.push({
        type: "danger",
        icon: "fa-circle-exclamation",
        title: "Failed Payments",
        message: d.payments.failed + " payment(s) failed in the last 24 hours",
        action: { text: "View Payments", url: "payments.html" }
      });
    }

    // Out of stock items
    if (d.menu && d.menu.unavailable > 0) {
      alerts.push({
        type: "warning",
        icon: "fa-box-open",
        title: "Out of Stock Items",
        message: d.menu.unavailable + " menu item(s) currently unavailable",
        action: { text: "View Menu", url: "menu.html" }
      });
    }

    // Pending orders
    if (d.orders && d.orders.pending > 5) {
      alerts.push({
        type: "info",
        icon: "fa-clock",
        title: "High Pending Orders",
        message: d.orders.pending + " orders awaiting processing",
        action: { text: "View Orders", url: "orders.html" }
      });
    }

    if (alerts.length === 0) {
      alertsContainer.innerHTML = '<div class="alert alert-success"><i class="fa-solid fa-check-circle"></i><span>All systems operating normally. No critical alerts.</span></div>';
      return;
    }

    alertsContainer.innerHTML = alerts.map(function(alert) {
      var actionHtml = alert.action ? '<a href="' + alert.action.url + '" class="alert-action">' + alert.action.text + '</a>' : '';
      return (
        '<div class="alert alert-' + alert.type + '">' +
        '  <i class="fa-solid ' + alert.icon + '"></i>' +
        '  <div class="alert-content">' +
        '    <strong>' + alert.title + '</strong>' +
        '    <span>' + alert.message + '</span>' +
        '  </div>' +
        '  ' + actionHtml +
        '</div>'
      );
    }).join("");
  }

  /* ====================================================================
   * CHARTS
   * ==================================================================== */
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
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: function(context) {
                var total = context.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                var percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                return context.label + ": " + context.raw + " (" + percentage + "%)";
              }
            }
          }
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
          y: { beginAtZero: true, position: "left", title: { display: true, text: "Revenue (ETB)" } },
          y1: { beginAtZero: true, position: "right", title: { display: true, text: "Orders" }, grid: { drawOnChartArea: false } }
        }
      }
    });
    charts.push(chart);
  }

  /* ====================================================================
   * TABLES
   * ==================================================================== */
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

  /* ====================================================================
   * DATE RANGE & FILTERING
   * ==================================================================== */
  function applyDateRange(range) {
    currentDateRange = range;
    var customInputs = document.querySelectorAll(".custom-date-input");
    var isCustom = range === "custom";
    customInputs.forEach(function(el) { el.style.display = isCustom ? "inline-block" : "none"; });

    // Update active button
    document.querySelectorAll(".date-range-btn").forEach(function(btn) {
      btn.classList.toggle("active", btn.dataset.range === range);
    });

    loadDashboard();
  }

  function setCustomDateRange() {
    var start = document.getElementById("startDateInput").value;
    var end = document.getElementById("endDateInput").value;
    if (!start || !end) {
      if (window.AdminToast) window.AdminToast.warning("Please select both start and end dates");
      return;
    }
    if (new Date(start) > new Date(end)) {
      if (window.AdminToast) window.AdminToast.error("Start date must be before end date");
      return;
    }
    applyDateRange("custom");
  }

  /* ====================================================================
   * AUTO REFRESH
   * ==================================================================== */
  function toggleAutoRefresh() {
    autoRefreshEnabled = !autoRefreshEnabled;
    var btn = document.getElementById("autoRefreshBtn");
    if (autoRefreshEnabled) {
      if (btn) btn.innerHTML = '<i class="fa-solid fa-pause"></i> Auto-refresh ON';
      if (window.AdminToast) window.AdminToast.show("Auto-refresh enabled (every 30s)");
      autoRefreshInterval = setInterval(loadDashboard, refreshIntervalMs);
    } else {
      if (btn) btn.innerHTML = '<i class="fa-solid fa-play"></i> Auto-refresh OFF';
      if (window.AdminToast) window.AdminToast.show("Auto-refresh disabled");
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
  }

  function setRefreshInterval(ms) {
    refreshIntervalMs = ms;
    if (autoRefreshEnabled) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = setInterval(loadDashboard, refreshIntervalMs);
    }
    // Update active button
    document.querySelectorAll(".refresh-interval-btn").forEach(function(btn) {
      btn.classList.toggle("active", parseInt(btn.dataset.interval) === ms);
    });
  }

  /* ====================================================================
   * EXPORT
   * ==================================================================== */
  function exportDashboardData() {
    if (!window.AdminAPI) return;

    window.AdminAPI.get("/admin/dashboard").then(function(res) {
      if (!res.success || !res.data) {
        if (window.AdminToast) window.AdminToast.error("Failed to fetch data for export");
        return;
      }

      var d = res.data;
      var now = new Date();
      var csv = [];
      csv.push(["Smart Cafeteria - Dashboard Export"]);
      csv.push(["Generated", now.toLocaleString()]);
      csv.push([]);

      // Users
      csv.push(["Users"]);
      csv.push(["Total Users", d.users?.total || 0]);
      csv.push(["Students", d.users?.students || 0]);
      csv.push(["Kitchen Staff", d.users?.kitchenStaff || 0]);
      csv.push(["Admins", d.users?.admins || 0]);
      csv.push([]);

      // Menu
      csv.push(["Menu"]);
      csv.push(["Total Items", d.menu?.total || 0]);
      csv.push(["Available", d.menu?.available || 0]);
      csv.push(["Unavailable", d.menu?.unavailable || 0]);
      csv.push([]);

      // Orders
      csv.push(["Orders"]);
      csv.push(["Total Orders", d.orders?.total || 0]);
      csv.push(["Pending", d.orders?.pending || 0]);
      csv.push(["Preparing", d.orders?.preparing || 0]);
      csv.push(["Ready", d.orders?.ready || 0]);
      csv.push(["Served", d.orders?.served || 0]);
      csv.push(["Completed", d.orders?.completed || 0]);
      csv.push(["Cancelled", d.orders?.cancelled || 0]);
      csv.push([]);

      // Payments
      csv.push(["Payments"]);
      csv.push(["Successful", d.payments?.successful || 0]);
      csv.push(["Pending", d.payments?.pending || 0]);
      csv.push(["Failed", d.payments?.failed || 0]);
      csv.push([]);

      // Revenue
      csv.push(["Revenue (ETB)"]);
      csv.push(["Today", d.revenue?.today || 0]);
      csv.push(["Total", d.revenue?.total || 0]);

      var csvContent = csv.map(function(row) {
        return row.map(function(cell) {
          var val = String(cell === null || cell === undefined ? "" : cell);
          return /[",\n]/.test(val) ? '"' + val.replace(/"/g, '""') + '"' : val;
        }).join(",");
      }).join("\r\n");

      var blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "dashboard-export-" + new Date().toISOString().split("T")[0] + ".csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.AdminToast) window.AdminToast.success("Dashboard exported to CSV");
    }).catch(function(err) {
      if (window.AdminToast) window.AdminToast.error("Export failed: " + err.message);
    });
  }

  /* ====================================================================
   * SEARCH / FILTER TABLES
   * ==================================================================== */
  function filterTable(inputId, tableBodyId, columns) {
    var input = document.getElementById(inputId);
    var tbody = document.getElementById(tableBodyId);
    if (!input || !tbody) return;

    var filter = input.value.toLowerCase();
    var rows = tbody.querySelectorAll("tr");

    rows.forEach(function(row) {
      var text = row.textContent.toLowerCase();
      row.style.display = text.includes(filter) ? "" : "none";
    });
  }

  /* ====================================================================
   * REAL-TIME CLOCK
   * ==================================================================== */
  function startClock() {
    var clockEl = document.getElementById("realtimeClock");
    if (!clockEl) return;
    updateClock();
    setInterval(updateClock, 1000);

    function updateClock() {
      var now = new Date();
      clockEl.textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
  }

  /* ====================================================================
   * KEYBOARD SHORTCUTS
   * ==================================================================== */
  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", function(e) {
      // R - Refresh
      if (e.key === "r" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
          e.preventDefault();
          loadDashboard();
        }
      }
      // F - Toggle fullscreen for charts
      if (e.key === "f" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
          e.preventDefault();
          toggleChartsFullscreen();
        }
      }
      // A - Toggle auto-refresh
      if (e.key === "a" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
          e.preventDefault();
          toggleAutoRefresh();
        }
      }
      // E - Export
      if (e.key === "e" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
          e.preventDefault();
          exportDashboardData();
        }
      }
    });
  }

  function toggleChartsFullscreen() {
    var chartsGrid = document.querySelector(".charts-grid");
    if (!chartsGrid) return;

    if (chartsGrid.classList.contains("fullscreen")) {
      chartsGrid.classList.remove("fullscreen");
      document.body.style.overflow = "";
    } else {
      chartsGrid.classList.add("fullscreen");
      document.body.style.overflow = "hidden";
    }
  }

  /* ====================================================================
   * STAT CARD CLICK NAVIGATION
   * ==================================================================== */
  function setupStatCardNavigation() {
    var statCards = document.querySelectorAll(".metric-card[data-nav]");
    statCards.forEach(function(card) {
      card.style.cursor = "pointer";
      card.addEventListener("click", function() {
        var navUrl = card.dataset.nav;
        if (navUrl) window.location.href = navUrl;
      });
    });
  }

  /* ====================================================================
   * DATA LOADING
   * ==================================================================== */
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

  function init() {
    // Setup event listeners for controls
    var refreshBtn = document.getElementById("refreshMetricsBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", loadDashboard);

    var autoRefreshBtn = document.getElementById("autoRefreshBtn");
    if (autoRefreshBtn) autoRefreshBtn.addEventListener("click", toggleAutoRefresh);

    var exportBtn = document.getElementById("exportDashboardBtn");
    if (exportBtn) exportBtn.addEventListener("click", exportDashboardData);

    // Date range buttons
    document.querySelectorAll(".date-range-btn").forEach(function(btn) {
      btn.addEventListener("click", function() { applyDateRange(btn.dataset.range); });
    });

    var applyCustomBtn = document.getElementById("applyCustomDateBtn");
    if (applyCustomBtn) applyCustomBtn.addEventListener("click", setCustomDateRange);

    var refreshIntervalBtns = document.querySelectorAll(".refresh-interval-btn");
    refreshIntervalBtns.forEach(function(btn) {
      btn.addEventListener("click", function() { setRefreshInterval(parseInt(btn.dataset.interval)); });
    });

    // Search inputs for tables
    var orderSearch = document.getElementById("orderSearchInput");
    if (orderSearch) orderSearch.addEventListener("input", function() { filterTable("orderSearchInput", "recentOrdersTableBody"); });

    var paymentSearch = document.getElementById("paymentSearchInput");
    if (paymentSearch) paymentSearch.addEventListener("input", function() { filterTable("paymentSearchInput", "recentPaymentsTableBody"); });

    // Setup
    setupStatCardNavigation();
    setupKeyboardShortcuts();
    startClock();

    // Load initial data
    loadDashboard();
  }

  // Expose for inline handlers
  window.Dashboard = {
    loadDashboard: loadDashboard,
    applyDateRange: applyDateRange,
    setCustomDateRange: setCustomDateRange,
    toggleAutoRefresh: toggleAutoRefresh,
    setRefreshInterval: setRefreshInterval,
    exportDashboardData: exportDashboardData,
    loadDashboard: loadDashboard
  };

  document.addEventListener("DOMContentLoaded", init);
})();
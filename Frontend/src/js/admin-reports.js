/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN REPORTS
 * ================================================================
 * Driver for the reports page with period filters:
 *   Today | Yesterday | Last 7 Days | Last 30 Days | This Month | Custom Date Range
 *
 * Period is resolved by the backend (GET /admin/reports/summary).
 * For a custom range, startDate & endDate (YYYY-MM-DD) are validated
 * server-side. Most ordered foods are computed from order data on the
 * server - never here.
 *
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ================================================================
 */
(function () {
  "use strict";

  var lastReport = null;

  var PERIOD_LABELS = {
    today: "Today",
    yesterday: "Yesterday",
    last7: "Last 7 Days",
    last30: "Last 30 Days",
    month: "This Month",
    custom: "Custom Date Range",
  };

  function money(value) {
    if (value === null || value === undefined) return "0.00";
    return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setMoney(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = money(value) + " ETB";
  }

  function getQuery() {
    var period = document.getElementById("periodSelect").value;
    var startDate = document.getElementById("startDateInput").value;
    var endDate = document.getElementById("endDateInput").value;

    var params = "?period=" + encodeURIComponent(period);
    if (period === "custom" && startDate) params += "&startDate=" + encodeURIComponent(startDate);
    if (period === "custom" && endDate) params += "&endDate=" + encodeURIComponent(endDate);
    return params;
  }

  /* ============================================================
   * PERIOD SELECTOR UI
   * ============================================================ */
  function toggleCustomRange() {
    var period = document.getElementById("periodSelect").value;
    var isCustom = period === "custom";
    document.getElementById("startDateInput").disabled = !isCustom;
    document.getElementById("endDateInput").disabled = !isCustom;
  }

  function resetFilters() {
    document.getElementById("periodSelect").value = "month";
    document.getElementById("startDateInput").value = "";
    document.getElementById("endDateInput").value = "";
    toggleCustomRange();
  }

  /* ============================================================
   * DATA LOADING
   * ============================================================ */
  async function loadReport() {
    try {
      var data = await window.AdminAPI.get("/admin/reports/summary" + getQuery());
      var report = data.report || {};
      lastReport = report;

      // Revenue for the selected period
      document.getElementById("metricRevenueTitle").textContent =
        "Revenue (" + (PERIOD_LABELS[report.period] || report.period) + ")";
      setMoney("metricTotalRevenue", report.revenue);

      // Orders
      setText("metricTotalOrders", report.orders.totalOrders || 0);
      setText("metricCompletedOrders", report.orders.completedOrders || 0);
      setText("metricCancelledOrders", report.orders.cancelledOrders || 0);

      // Payments
      setText("metricSuccessfulPayments", report.payments.successfulPayments || 0);
      setText("metricFailedPayments", report.payments.failedPayments || 0);
      setText("metricPendingPayments", report.payments.pendingPayments || 0);

      renderTopFoods(report.mostOrderedFoods || []);

      var updated = document.getElementById("reportUpdatedAt");
      if (updated) {
        var rangeText = report.range && report.range.startDate && report.range.endDate
          ? report.range.startDate + " to " + report.range.endDate
          : "all time";
        var when = report.generatedAt ? window.AdminAPI.formatDateTime(report.generatedAt) : "just now";
        updated.textContent = "Period: " + rangeText + " - generated " + when + ".";
      }

      if (window.AdminToast) window.AdminToast.show("Report refreshed");
    } catch (error) {
      var message = (error && error.message) || "Server error";
      var tbody = document.getElementById("topFoodsBody");
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="table-empty">Failed to load report: ' +
          window.esc(message) + "</td></tr>";
      }
      if (window.AdminToast) window.AdminToast.error(message);
    }
  }

  function renderTopFoods(foods) {
    var tbody = document.getElementById("topFoodsBody");
    if (!tbody) return;

    if (!foods.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No food items ordered in this period.</td></tr>';
      return;
    }

    tbody.innerHTML = foods.map(function (food, index) {
      return (
        "<tr>" +
        '<td><span class="rank-badge">' + (index + 1) + "</span></td>" +
        "<td><strong>" + window.esc(food.name) + "</strong></td>" +
        "<td>" + (food.totalQuantity || 0) + "</td>" +
        "<td>" + (food.orderCount || 0) + "</td>" +
        "<td><strong>" + money(food.totalRevenue) + "</strong></td>" +
        "</tr>"
      );
    }).join("");
  }

  /* ============================================================
   * CSV EXPORT
   * ============================================================ */
  function exportCsv() {
    if (!lastReport) {
      if (window.AdminToast) window.AdminToast.error("No report data to export yet");
      return;
    }

    var rows = [];
    rows.push(["Smart Cafeteria - Reports Summary"]);
    rows.push(["Period", PERIOD_LABELS[lastReport.period] || lastReport.period]);
    rows.push(["Range", lastReport.range.startDate + " to " + lastReport.range.endDate]);
    rows.push(["Generated", new Date().toLocaleString()]);
    rows.push([]);

    rows.push(["Revenue (ETB)"]);
    rows.push(["Total Revenue", lastReport.revenue]);
    rows.push([]);

    rows.push(["Orders"]);
    rows.push(["Total Orders", lastReport.orders.totalOrders]);
    rows.push(["Completed Orders", lastReport.orders.completedOrders]);
    rows.push(["Cancelled Orders", lastReport.orders.cancelledOrders]);
    rows.push([]);

    rows.push(["Payments"]);
    rows.push(["Successful Payments", lastReport.payments.successfulPayments]);
    rows.push(["Failed Payments", lastReport.payments.failedPayments]);
    rows.push(["Pending Payments", lastReport.payments.pendingPayments]);
    rows.push([]);

    rows.push(["Most Ordered Foods"]);
    rows.push(["Rank", "Food Item", "Total Quantity", "Times Ordered", "Revenue (ETB)"]);
    lastReport.mostOrderedFoods.forEach(function (food, index) {
      rows.push([index + 1, food.name, food.totalQuantity, food.orderCount, food.totalRevenue]);
    });

    var csv = rows
      .map(function (row) {
        return row
          .map(function (cell) {
            var value = String(cell === null || cell === undefined ? "" : cell);
            return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
          })
          .join(",");
      })
      .join("\r\n");

    var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "smart-cafeteria-report-" + (lastReport.period || "summary") + "-" + new Date().toISOString().split("T")[0] + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /* ============================================================
   * EVENT BINDINGS
   * ============================================================ */
  function bindEvents() {
    var periodSelect = document.getElementById("periodSelect");
    if (periodSelect) {
      periodSelect.addEventListener("change", toggleCustomRange);
      periodSelect.addEventListener("change", function () {
        if (periodSelect.value !== "custom") loadReport();
      });
    }

    var applyBtn = document.getElementById("applyReportBtn");
    if (applyBtn) applyBtn.addEventListener("click", loadReport);

    var refreshBtn = document.getElementById("refreshReportsBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", loadReport);

    var exportBtn = document.getElementById("exportCsvBtn");
    if (exportBtn) exportBtn.addEventListener("click", exportCsv);
  }

  function init() {
    toggleCustomRange();
    bindEvents();
    loadReport();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
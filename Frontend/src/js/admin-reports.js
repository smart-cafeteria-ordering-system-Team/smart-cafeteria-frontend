/**
 * ==========================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN REPORTS
 * ==========================================================================
 * Driver for the reports page with date range filters and
 * Daily / Monthly / Yearly / Popular grouping:
 *   GET /admin/reports/summary?period=...&startDate=...&endDate=...&reportType=...
 *
 * Backend returns:
 *   { success, report: { generatedAt, period, reportType, range, currency,
 *     revenue, orders: { totalOrders, completedOrders, cancelledOrders },
 *     payments: { successfulPayments, failedPayments, pendingPayments, totalPayments },
 *     mostOrderedFoods: [...], breakdown: [{ period, orderCount, completed,
 *       cancelled, revenue }] } }
 *
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ==========================================================================
 */
(function () {
  "use strict";

  var lastReport = null;

  function tr(key, fallback) {
    var t = window.translations;
    if (!t) return fallback;
    var lang = localStorage.getItem("app_language") || "en";
    return (t[lang] && t[lang][key]) || t.en && t.en[key] || fallback;
  }

  function money(value) {
    if (value === null || value === undefined) return "0.00";
    return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function etb(value) {
    return money(value) + " ETB";
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function getReportType() {
    var sel = document.getElementById("reportTypeSelect");
    return sel ? sel.value : "daily";
  }

  function getPeriod() {
    var fromDate = document.getElementById("fromDate");
    var toDate = document.getElementById("toDate");
    if (fromDate && fromDate.value && toDate && toDate.value) return "custom";
    if (fromDate && fromDate.value) return "custom";
    return "month";
  }

  function getQuery() {
    var reportType = getReportType();
    var period = getPeriod();
    var fromDate = document.getElementById("fromDate");
    var toDate = document.getElementById("toDate");
    var params = { period: period, reportType: reportType };
    if (period === "custom" && fromDate && fromDate.value) params.startDate = fromDate.value;
    if (period === "custom" && toDate && toDate.value) params.endDate = toDate.value;
    return params;
  }

  async function loadReport() {
    try {
      var data = await window.AdminAPI.get("/admin/reports/summary", getQuery());
      var report = data.report || {};
      lastReport = report;
      var type = getReportType();

      // --- Metrics ---
      switch (type) {
        case "monthly":
        case "yearly":
        case "daily":
          setText("metricReportOrders", report.orders ? report.orders.totalOrders || 0 : 0);
          setText("metricReportSales", etb(report.revenue));
          setText("metricReportPopular", report.mostOrderedFoods && report.mostOrderedFoods.length ? report.mostOrderedFoods[0].name : "—");
          setText("metricReportPayments", report.payments ? report.payments.totalPayments || 0 : 0);
          break;
        case "popular":
          setText("metricReportOrders", report.mostOrderedFoods ? report.mostOrderedFoods.length : 0);
          setText("metricReportSales", etb(report.revenue));
          setText("metricReportPopular", report.mostOrderedFoods && report.mostOrderedFoods.length ? report.mostOrderedFoods[0].name + " (" + report.mostOrderedFoods[0].totalQuantity + ")" : "—");
          setText("metricReportPayments", report.payments ? report.payments.successfulPayments || 0 : 0);
          break;
        default:
          setText("metricReportOrders", report.orders ? report.orders.totalOrders || 0 : 0);
          setText("metricReportSales", etb(report.revenue));
          setText("metricReportPopular", report.mostOrderedFoods ? report.mostOrderedFoods.length : 0);
          setText("metricReportPayments", report.payments ? report.payments.totalPayments || 0 : 0);
      }

      renderReportTable(report, type);
      if (window.AdminToast) window.AdminToast.show("Report refreshed");
    } catch (error) {
      var tbody = document.getElementById("reportsTableBody");
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Failed to load report: ' +
          window.esc((error && error.message) || "Server error") + "</td></tr>";
      }
      if (window.AdminToast) window.AdminToast.error((error && error.message) || "Server error");
    }
  }

  function renderReportTable(report, type) {
    var thead = document.getElementById("reportTableHead");
    var tbody = document.getElementById("reportsTableBody");
    if (!thead || !tbody) return;

    var foods = report.mostOrderedFoods || [];
    var breakdown = report.breakdown || [];
    var rangeLabel = report.range
      ? window.esc((report.range.startDate || "") + " to " + (report.range.endDate || ""))
      : "—";

    if (type === "popular") {
      thead.innerHTML = "<tr>" +
        "<th>" + tr("rank", "Rank") + "</th>" +
        "<th>" + tr("item_name", "Item Name") + "</th>" +
        "<th>" + tr("qty_ordered", "Total Qty Ordered") + "</th>" +
        "<th>" + tr("order_count", "Order Count") + "</th>" +
        "<th>" + tr("col_revenue", "Revenue (ETB)") + "</th>" +
        "<th>" + tr("percent_total", "% of Total") + "</th></tr>";
      if (!foods.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="table-empty">' + tr("no_orders", "No food items ordered in this period.") + '</td></tr>';
      } else {
        var totalRev = report.revenue || 1;
        tbody.innerHTML = foods.map(function (food, idx) {
          var pct = ((food.totalRevenue / totalRev) * 100).toFixed(1);
          return (
            "<tr>" +
            "<td><strong>" + (idx + 1) + "</strong></td>" +
            "<td><strong>" + window.esc(food.name) + "</strong></td>" +
            "<td>" + (food.totalQuantity || 0) + "</td>" +
            "<td>" + (food.orderCount || 0) + "</td>" +
            "<td><strong>" + money(food.totalRevenue) + "</strong></td>" +
            "<td>" + pct + "%</td>" +
            "</tr>"
          );
        }).join("");
      }
    } else {
      // Daily / Monthly / Yearly grouped breakdown
      thead.innerHTML = "<tr>" +
        "<th>" + tr("col_period", "Period") + "</th>" +
        "<th>" + tr("col_order_count", "Order Count") + "</th>" +
        "<th>" + tr("col_completed", "Completed") + "</th>" +
        "<th>" + tr("col_cancelled", "Cancelled") + "</th>" +
        "<th>" + tr("col_revenue", "Revenue (ETB)") + "</th></tr>";
      if (!breakdown.length) {
        tbody.innerHTML =
          "<tr>" +
          "<td colspan=\"5\" class=\"table-empty\">" + tr("no_orders", "No orders found for this period.") + "</td>" +
          "</tr>";
      } else {
        tbody.innerHTML = breakdown.map(function (row) {
          return (
            "<tr>" +
            "<td><strong>" + window.esc(row.period) + "</strong></td>" +
            "<td>" + (row.orderCount || 0) + "</td>" +
            "<td>" + (row.completed || 0) + "</td>" +
            "<td>" + (row.cancelled || 0) + "</td>" +
            "<td><strong>" + money(row.revenue) + "</strong></td>" +
            "</tr>"
          );
        }).join("");
      }
    }

    // Pagination controls (client-side, single-page report)
    var pagContainer = document.getElementById("reportPaginationControls");
    if (pagContainer) pagContainer.innerHTML = "";
  }

  function exportCsv() {
    if (!lastReport) {
      if (window.AdminToast) window.AdminToast.error("No report data to export yet");
      return;
    }

    var rows = [];
    rows.push(["Smart Cafeteria - Report Summary"]);
    rows.push(["Type", getReportType()]);
    if (lastReport.range) {
      rows.push(["Period", (lastReport.range.startDate || "") + " to " + (lastReport.range.endDate || "")]);
    }
    rows.push(["Generated", new Date().toLocaleString()]);
    rows.push([]);
    rows.push(["Revenue (ETB)", lastReport.revenue]);
    rows.push(["Total Orders", lastReport.orders ? lastReport.orders.totalOrders : 0]);
    rows.push(["Completed Orders", lastReport.orders ? lastReport.orders.completedOrders : 0]);
    rows.push(["Cancelled Orders", lastReport.orders ? lastReport.orders.cancelledOrders : 0]);
    rows.push([]);

    if (lastReport.breakdown && lastReport.breakdown.length) {
      rows.push(["Date Breakdown"]);
      rows.push(["Period", "Order Count", "Completed", "Cancelled", "Revenue (ETB)"]);
      lastReport.breakdown.forEach(function (row) {
        rows.push([row.period, row.orderCount, row.completed, row.cancelled, row.revenue]);
      });
      rows.push([]);
    }

    if (lastReport.mostOrderedFoods && lastReport.mostOrderedFoods.length) {
      rows.push(["Most Ordered Foods"]);
      rows.push(["Rank", "Item", "Qty Ordered", "Order Count", "Revenue (ETB)"]);
      lastReport.mostOrderedFoods.forEach(function (food, idx) {
        rows.push([idx + 1, food.name, food.totalQuantity, food.orderCount, food.totalRevenue]);
      });
    }

    var csv = rows
      .map(function (row) {
        return row
          .map(function (cell) {
            var v = String(cell === null || cell === undefined ? "" : cell);
            return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
          })
          .join(",");
      })
      .join("\r\n");

    var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "cafeteria-report-" + getReportType() + "-" + new Date().toISOString().split("T")[0] + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (window.AdminToast) window.AdminToast.success("CSV exported successfully");
  }

  function bindEvents() {
    var generateBtn = document.getElementById("generateReportBtn");
    if (generateBtn) generateBtn.addEventListener("click", loadReport);

    var exportBtn = document.getElementById("exportCsvBtn");
    if (exportBtn) exportBtn.addEventListener("click", exportCsv);

    var reportTypeSelect = document.getElementById("reportTypeSelect");
    if (reportTypeSelect) reportTypeSelect.addEventListener("change", loadReport);
  }

  function init() {
    bindEvents();
    loadReport();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

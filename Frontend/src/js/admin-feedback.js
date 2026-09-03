/**
 * ==========================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN FEEDBACK MANAGEMENT
 * ==========================================================================
 * Admin Feedback Management driven by the backend API:
 *   GET    /feedback            (list - Admin, with status/rating query params)
 *   GET    /feedback/stats      (admin metrics)
 *   PATCH  /feedback/:id/reply  (reply to feedback, body: { reply })
 *   DELETE /feedback/:id        (delete feedback)
 *
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ==========================================================================
 */
(function () {
  "use strict";

  var state = {
    page: 1,
    limit: 10,
    search: "",
    status: "",
    rating: ""
  };

  function ratingStars(rating) {
    var r = Number(rating) || 0;
    var html = "";
    for (var i = 1; i <= 5; i++) {
      html += '<i class="fa-solid fa-star' + (i <= r ? "" : "-o") + '" style="color: ' + (i <= r ? "#f59e0b" : "#d1d5db") + '"></i>';
    }
    return html;
  }

  function statusBadge(status) {
    var s = String(status || "").toUpperCase();
    var cls = "order-badge";
    switch (s) {
      case "PENDING": cls += " pend"; break;
      case "APPROVED": cls += " cmp"; break;
      case "REJECTED": cls += " cxl"; break;
      case "ARCHIVED": cls += " cxl"; break;
      default: cls += " pend";
    }
    return '<span class="' + cls + '">' + s + "</span>";
  }

  async function loadMetrics() {
    try {
      var data = await window.AdminAPI.get("/feedback/stats");
      var stats = data.stats || {};
      var el;
      el = document.getElementById("metricTotalFeedback");
      if (el) el.textContent = stats.totalFeedback || 0;
      el = document.getElementById("metricAvgRating");
      if (el) el.innerHTML = (stats.averageRating !== undefined && stats.averageRating !== null ? stats.averageRating : stats.averageRatingText || "0.0") + ' <small>/ 5</small>';
      el = document.getElementById("metricPositiveFeedback");
      if (el) el.textContent = stats.positiveReviews !== undefined ? stats.positiveReviews : (stats.approved || 0);
      el = document.getElementById("metricPendingFeedback");
      if (el) el.textContent = stats.pendingIssues !== undefined ? stats.pendingIssues : (stats.pending || 0);
    } catch (e) {
      // Metrics are non-critical; keep defaults
    }
  }

  async function loadFeedback() {
    var tbody = document.getElementById("feedbackTableBody");
    if (!tbody || !window.AdminAPI) return;

    tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Loading feedback...</td></tr>';

    try {
      var query = { page: state.page, limit: state.limit };
      if (state.status) query.status = state.status;
      if (state.rating) query.rating = state.rating;

      var data = await window.AdminAPI.get("/feedback", query);

      var allFeedback = data.feedback || [];
      state.total = data.total || 0;
      state.pages = Math.max(Math.ceil(state.total / state.limit), 1);

      // Client-side search filter
      if (state.search) {
        var q = state.search.toLowerCase();
        allFeedback = allFeedback.filter(function (f) {
          return (
            (f.user && f.user.name && f.user.name.toLowerCase().indexOf(q) !== -1) ||
            (f.orderId && String(f.orderId).toLowerCase().indexOf(q) !== -1) ||
            (f.customerName && f.customerName.toLowerCase().indexOf(q) !== -1) ||
            (f.comment && f.comment.toLowerCase().indexOf(q) !== -1)
          );
        });
      }

      window.__feedbackCache = allFeedback;
      renderFeedback(allFeedback);
      renderPagination();
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Failed to load feedback: ' + window.esc(error.message || "Server error") + "</td></tr>";
    }
  }

  function renderFeedback(items) {
    var tbody = document.getElementById("feedbackTableBody");
    if (!tbody) return;

    if (!items || !items.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No feedback found.</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(function (f) {
      var fid = f._id || f.id || "-";
      var customerName = (f.user && f.user.name) || f.customerName || "—";
      return (
        "<tr>" +
        '<td><strong>' + window.esc(fid) + "</strong></td>" +
        '<td>' + window.esc(customerName) + "</td>" +
        '<td>' + window.esc(f.orderId || "-") + "</td>" +
        "<td>" + ratingStars(f.rating) + ' <small>(' + (f.rating || 0) + "/5)</small></td>" +
        '<td>' + window.esc(f.comment || "-") + "</td>" +
        "<td>" + statusBadge(f.status) + "</td>" +
        "<td>" + window.AdminAPI.formatDate(f.createdAt) + "</td>" +
        "<td>" +
        '<div class="table-actions">' +
        '<button class="action-btn" data-action="reply" data-id="' + fid + '" title="View / Reply"><i class="fa-solid fa-reply"></i></button>' +
        '<button class="action-btn danger" data-action="delete" data-id="' + fid + '" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
        "</div>" +
        "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderPagination() {
    var container = document.getElementById("feedbackPaginationControls");
    if (!container) return;

    var html =
      '<div class="pagination">' +
      '<div class="pagination-info">Page ' + state.page + " of " + Math.max(state.pages, 1) + " (" + (state.total || 0) + " items)</div>" +
      '<button class="page-btn" id="feedbackPrevBtn"' + (state.page <= 1 ? " disabled" : "") + ">&laquo; Prev</button>" +
      '<button class="page-btn" id="feedbackNextBtn"' + (state.page >= state.pages ? " disabled" : "") + ">Next &raquo;</button>" +
      "</div>";

    container.innerHTML = html;

    var prevBtn = document.getElementById("feedbackPrevBtn");
    var nextBtn = document.getElementById("feedbackNextBtn");
    if (prevBtn) prevBtn.addEventListener("click", function () { state.page--; loadFeedback(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { state.page++; loadFeedback(); });
  }

  function openFeedbackModal(feedback) {
    var modal = document.getElementById("feedbackModal");
    if (!modal) return;

    var fid = feedback._id || feedback.id || "";
    var customerName = (feedback.user && feedback.user.name) || feedback.customerName || "—";
    var orderId = feedback.orderId || "—";
    var rating = feedback.rating || 0;
    var comment = feedback.comment || "-";

    var el;
    el = document.getElementById("modalFeedbackId");
    if (el) el.textContent = "#" + fid;
    el = document.getElementById("modalOrderId");
    if (el) el.textContent = "#" + orderId;
    el = document.getElementById("modalCustomerName");
    if (el) el.textContent = customerName;
    el = document.getElementById("modalRatingStars");
    if (el) el.innerHTML = ratingStars(rating) + " <small>(" + rating + "/5)</small>";
    el = document.getElementById("modalCustomerComment");
    if (el) el.textContent = comment;

    var replyInput = document.getElementById("adminReplyInput");
    if (replyInput) replyInput.value = feedback.reply || "";

    modal.style.display = "flex";
    modal.dataset.feedbackId = fid;
  }

  function closeFeedbackModal() {
    var modal = document.getElementById("feedbackModal");
    if (modal) {
      modal.style.display = "none";
      modal.dataset.feedbackId = "";
    }
  }

  function bindEvents() {
    var searchInput = document.getElementById("feedbackSearchInput");
    if (searchInput) {
      var debounceTimer = null;
      searchInput.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          state.search = searchInput.value.trim();
          state.page = 1;
          loadFeedback();
        }, 400);
      });
    }

    var statusFilter = document.getElementById("feedbackStatusFilter");
    if (statusFilter) {
      statusFilter.addEventListener("change", function () {
        state.status = statusFilter.value;
        state.page = 1;
        loadFeedback();
      });
    }

    var ratingFilter = document.getElementById("feedbackRatingFilter");
    if (ratingFilter) {
      ratingFilter.addEventListener("change", function () {
        state.rating = ratingFilter.value;
        state.page = 1;
        loadFeedback();
      });
    }

    var refreshBtn = document.getElementById("refreshFeedbackBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", async function () {
        var original = refreshBtn.innerHTML;
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
        try {
          await Promise.all([loadFeedback(), loadMetrics()]);
        } finally {
          refreshBtn.disabled = false;
          refreshBtn.innerHTML = original;
        }
      });
    }

    var tbody = document.getElementById("feedbackTableBody");
    if (tbody) {
      tbody.addEventListener("click", async function (e) {
        var btn = e.target.closest("[data-action]");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        if (!id) return;

        var feedback = (window.__feedbackCache || []).find(function (f) {
          return (f._id || f.id) === id;
        });
        if (!feedback) {
          if (window.AdminToast) window.AdminToast.error("Feedback not found");
          return;
        }

        if (action === "reply") {
          openFeedbackModal(feedback);
        } else if (action === "delete") {
          if (!confirm("Delete this feedback? This action cannot be undone.")) return;
          try {
            await window.AdminAPI.del("/feedback/" + id);
            if (window.AdminToast) window.AdminToast.success("Feedback deleted");
            if (state.total === 1 && state.page > 1) state.page--;
            loadFeedback();
            loadMetrics();
          } catch (err) {
            if (window.AdminToast) window.AdminToast.error(err.message || "Delete failed");
          }
        }
      });
    }

    var closeBtn = document.getElementById("closeFeedbackModalBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeFeedbackModal);

    var sendBtn = document.getElementById("sendFeedbackReplyBtn");
    if (sendBtn) {
      sendBtn.addEventListener("click", async function () {
        var modal = document.getElementById("feedbackModal");
        var feedbackId = modal ? modal.dataset.feedbackId : "";
        var replyInput = document.getElementById("adminReplyInput");
        var reply = replyInput ? replyInput.value.trim() : "";

        if (!reply) {
          if (window.AdminToast) window.AdminToast.error("Reply cannot be empty");
          return;
        }

        try {
          await window.AdminAPI.patch("/feedback/" + feedbackId + "/reply", { reply: reply });
          closeFeedbackModal();
          if (window.AdminToast) window.AdminToast.success("Reply sent successfully");
          loadFeedback();
          loadMetrics();
        } catch (err) {
          if (window.AdminToast) window.AdminToast.error(err.message || "Failed to send reply");
        }
      });
    }

    var archiveBtn = document.getElementById("archiveFeedbackBtn");
    if (archiveBtn) {
      archiveBtn.addEventListener("click", async function () {
        var modal = document.getElementById("feedbackModal");
        var feedbackId = modal ? modal.dataset.feedbackId : "";
        if (!feedbackId) return;

        if (!confirm("Archive this feedback? This will delete it.")) return;
        try {
          await window.AdminAPI.del("/feedback/" + feedbackId);
          closeFeedbackModal();
          if (window.AdminToast) window.AdminToast.success("Feedback archived");
          loadFeedback();
          loadMetrics();
        } catch (err) {
          if (window.AdminToast) window.AdminToast.error(err.message || "Archive failed");
        }
      });
    }

    var overlay = document.getElementById("feedbackModal");
    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeFeedbackModal();
      });
    }
  }

  function init() {
    bindEvents();
    loadFeedback();
    loadMetrics();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

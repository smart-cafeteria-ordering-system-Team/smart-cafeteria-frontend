/**
 * ==========================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN CATEGORIES
 * ==========================================================================
 * Admin Category Management driven by the live backend API:
 *   GET    /categories               (list)
 *   POST   /categories               (create)
 *   PUT    /categories/:id           (update)
 *   PATCH  /categories/:id/status    (toggle active)
 *   DELETE /categories/:id           (delete)
 *
 * Search + status filtering are done client-side on the fetched list.
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ==========================================================================
 */
(function () {
  "use strict";

  var state = {
    page: 1,
    perPage: 8,
    search: "",
    status: ""
  };

  var allCategories = [];
  var total = 0;
  var pages = 1;

  function esc(value) {
    return window.esc(value);
  }

  function catName(cat) {
    var name = cat.name;
    if (name && typeof name === "object") return name.en || name.am || "";
    return name || "";
  }

  function catDescription(cat) {
    var desc = cat.description;
    if (desc && typeof desc === "object") return desc.en || desc.am || "";
    return desc || "";
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* ============================================================
   * MODALS
   * ============================================================ */
  function openModal() {
    var modal = document.getElementById("categoryModal");
    if (modal) modal.style.display = "flex";
  }

  function closeModal() {
    var modal = document.getElementById("categoryModal");
    if (modal) modal.style.display = "none";
  }

  /* ============================================================
   * DATA LOADING
   * ============================================================ */
  async function loadCategories() {
    var tbody = document.getElementById("categoryTableBody");
    if (!tbody || !window.AdminAPI) return;

    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Loading...</td></tr>';

    try {
      var data = await window.AdminAPI.get("/categories");
      allCategories = data.categories || [];
      total = allCategories.length;
      pages = Math.max(Math.ceil(total / state.perPage), 1);
      if (state.page > pages) state.page = pages;
      renderMetrics();
      renderCategories();
      renderPagination();
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Failed to load categories: ' + esc(error.message || "Server error") + "</td></tr>";
    }
  }

  function renderMetrics() {
    var activeTotal = 0;
    var linkedItems = 0;
    allCategories.forEach(function (cat) {
      if (cat.isActive) activeTotal++;
      linkedItems += Number(cat.itemCount) || 0;
    });
    setText("metricTotalCategories", allCategories.length);
    setText("metricActiveCategories", activeTotal);
    setText("metricTotalLinkedItems", linkedItems);
    setText("metricInactiveCategories", allCategories.length - activeTotal);
  }

  function filteredCategories() {
    var query = state.search.toLowerCase();
    return allCategories.filter(function (cat) {
      if (state.status === "ACTIVE" && !cat.isActive) return false;
      if (state.status === "INACTIVE" && cat.isActive) return false;
      if (!query) return true;
      var name = catName(cat).toLowerCase();
      var id = String(cat.id || "").toLowerCase();
      return name.indexOf(query) !== -1 || id.indexOf(query) !== -1;
    });
  }

  /* ============================================================
   * TABLE
   * ============================================================ */
  function renderCategories() {
    var tbody = document.getElementById("categoryTableBody");
    if (!tbody) return;

    var filtered = filteredCategories();
    var start = (state.page - 1) * state.perPage;
    var rows = filtered.slice(start, start + state.perPage);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No categories found.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (cat) {
      var name = catName(cat);
      var desc = catDescription(cat);
      var statusBadge = cat.isActive
        ? '<span class="status-badge status-active">Active</span>'
        : '<span class="status-badge status-blocked">Inactive</span>';
      var toggleIcon = cat.isActive ? "fa-toggle-on" : "fa-toggle-off";
      var toggleTitle = cat.isActive ? "Deactivate" : "Activate";

      return (
        "<tr>" +
        "<td><strong>" + esc(cat.id) + "</strong></td>" +
        "<td>" + (cat.icon ? '<span class="cat-pill">' + esc(cat.icon) + "</span> " : "") + "<strong>" + esc(name) + "</strong></td>" +
        "<td>" + esc(desc || "—") + "</td>" +
        "<td>" + (Number(cat.itemCount) || 0) + "</td>" +
        "<td>" + statusBadge + "</td>" +
        "<td>" +
          '<div class="table-actions">' +
            '<button class="action-btn" data-action="edit" data-id="' + esc(cat.id) + '" title="Edit category"><i class="fa-solid fa-pen"></i></button>' +
            '<button class="action-btn" data-action="toggle" data-id="' + esc(cat.id) + '" title="' + toggleTitle + '"><i class="fa-solid ' + toggleIcon + '"></i></button>' +
            '<button class="action-btn danger" data-action="delete" data-id="' + esc(cat.id) + '" title="Delete category"><i class="fa-solid fa-trash"></i></button>' +
          "</div>" +
        "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderPagination() {
    var container = document.getElementById("categoryPaginationControls");
    if (!container) return;

    container.innerHTML =
      '<div class="pagination-info">Page ' + state.page + " of " + pages + " (" + total + " categories)</div>" +
      '<div class="pagination">' +
        '<button class="page-btn" id="categoryPrevPageBtn"' + (state.page <= 1 ? " disabled" : "") + '><i class="fa-solid fa-chevron-left"></i> Prev</button>' +
        '<button class="page-btn" id="categoryNextPageBtn"' + (state.page >= pages ? " disabled" : "") + '>Next <i class="fa-solid fa-chevron-right"></i></button>' +
      "</div>";

    var prevBtn = document.getElementById("categoryPrevPageBtn");
    var nextBtn = document.getElementById("categoryNextPageBtn");
    if (prevBtn) prevBtn.addEventListener("click", function () { changePage(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { changePage(1); });
  }

  function changePage(delta) {
    state.page += delta;
    if (state.page < 1) state.page = 1;
    renderCategories();
    renderPagination();
  }

  /* ============================================================
   * ADD / EDIT MODAL
   * ============================================================ */
  function openAddCategoryModal() {
    var form = document.getElementById("categoryForm");
    if (form) form.reset();
    document.getElementById("categoryId").value = "";
    document.getElementById("categoryIsActive").checked = true;
    document.getElementById("categoryModalTitle").textContent = "Add New Category";
    document.getElementById("saveCategoryBtn").textContent = "Save Category";
    openModal();
  }

  function openEditCategoryModal(cat) {
    var form = document.getElementById("categoryForm");
    if (form) form.reset();
    document.getElementById("categoryId").value = cat.id;
    document.getElementById("categoryName").value = catName(cat);
    document.getElementById("categoryDescription").value = catDescription(cat);
    document.getElementById("categoryIsActive").checked = cat.isActive !== false;
    document.getElementById("categoryModalTitle").textContent = "Edit Category";
    document.getElementById("saveCategoryBtn").textContent = "Update Category";
    openModal();
  }

  function slugify(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function buildPayload(includeId) {
    var nameEn = document.getElementById("categoryName").value.trim();
    var desc = document.getElementById("categoryDescription").value.trim();
    var payload = {
      name: { en: nameEn, am: nameEn },
      description: { en: desc, am: desc },
      icon: "🍽️",
      isActive: document.getElementById("categoryIsActive").checked
    };
    if (includeId) payload.id = slugify(nameEn);
    return payload;
  }

  async function handleCategoryFormSubmit(event) {
    event.preventDefault();

    var id = document.getElementById("categoryId").value;
    var payload = buildPayload(!id);
    if (!payload.id || !payload.name.en) {
      if (window.AdminToast) window.AdminToast.error("Category name is required");
      return;
    }

    try {
      if (id) {
        await window.AdminAPI.put("/categories/" + encodeURIComponent(id), payload);
      } else {
        await window.AdminAPI.post("/categories", payload);
      }
      closeModal();
      if (window.AdminToast) window.AdminToast.success(id ? "Category updated successfully" : "Category created successfully");
      loadCategories();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to save category");
    }
  }

  /* ============================================================
   * ACTIONS
   * ============================================================ */
  async function toggleCategoryStatus(cat) {
    var nextStatus = cat.isActive ? false : true;
    var label = (cat.isActive ? "Deactivate" : "Activate") + ' category "' + catName(cat) + '"?';
    if (!window.confirm(label)) return;

    try {
      await window.AdminAPI.patch("/categories/" + encodeURIComponent(cat.id) + "/status", { isActive: nextStatus });
      if (window.AdminToast) window.AdminToast.success(nextStatus ? "Category activated" : "Category deactivated");
      loadCategories();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to update category status");
    }
  }

  async function deleteCategory(cat) {
    if (!window.confirm('Delete category "' + catName(cat) + '"? This action cannot be undone.')) return;

    try {
      await window.AdminAPI.del("/categories/" + encodeURIComponent(cat.id));
      if (window.AdminToast) window.AdminToast.success("Category deleted successfully");
      loadCategories();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to delete category");
    }
  }

  /* ============================================================
   * EVENT BINDINGS
   * ============================================================ */
  function bindEvents() {
    var openBtn = document.getElementById("openAddCategoryModalBtn");
    if (openBtn) openBtn.addEventListener("click", openAddCategoryModal);

    var closeBtn = document.getElementById("closeCategoryModalBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    var cancelBtn = document.getElementById("cancelCategoryModalBtn");
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    var modal = document.getElementById("categoryModal");
    if (modal) modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });

    var form = document.getElementById("categoryForm");
    if (form) form.addEventListener("submit", handleCategoryFormSubmit);

    var searchInput = document.getElementById("categorySearchInput");
    if (searchInput) {
      var debounceTimer = null;
      searchInput.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          state.search = searchInput.value.trim();
          state.page = 1;
          renderCategories();
          renderPagination();
        }, 400);
      });
    }

    var statusFilter = document.getElementById("categoryStatusFilter");
    if (statusFilter) {
      statusFilter.addEventListener("change", function () {
        state.status = statusFilter.value;
        state.page = 1;
        renderCategories();
        renderPagination();
      });
    }

    var tbody = document.getElementById("categoryTableBody");
    if (tbody) {
      tbody.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-action]");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        if (!id) return;

        var cat = allCategories.find(function (c) { return String(c.id) === String(id); });
        if (!cat) return;

        if (action === "edit") openEditCategoryModal(cat);
        else if (action === "toggle") toggleCategoryStatus(cat);
        else if (action === "delete") deleteCategory(cat);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.AdminAPI) return;
    bindEvents();
    loadCategories();
  });
})();
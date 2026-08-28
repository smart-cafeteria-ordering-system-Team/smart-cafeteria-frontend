/**
 * ==========================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN CATEGORIES
 * ==========================================================================
 * Admin Category Management driven by the backend API:
 *   GET    /admin/categories        (list)
 *   GET    /admin/categories/:id    (details)
 *   POST   /admin/categories        (create)
 *   PUT    /admin/categories/:id    (update)
 *   PATCH  /admin/categories/:id/status (toggle active)
 *   DELETE /admin/categories/:id    (delete)
 *
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ============================================================================
 */
(function () {
  "use strict";

  var state = {
    page: 1,
    limit: 10,
    search: "",
    status: ""
  };

  function escapeHtml(value) {
    return window.esc(value);
  }

  function openModal(id) { var el = document.getElementById(id); if (el) el.classList.add("open"); }
  function closeModal(id) { var el = document.getElementById(id); if (el) el.classList.remove("open"); }
  function closeAllModals() { document.querySelectorAll(".modal-overlay.open").forEach(function(m) { m.classList.remove("open"); }); }

  document.addEventListener("click", function(e) {
    var closeBtn = e.target.closest("[data-close-modal]");
    if (closeBtn) closeModal(closeBtn.getAttribute("data-close-modal"));
    var overlay = e.target.closest(".modal-overlay");
    if (overlay && e.target === overlay) closeAllModals();
  });

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") closeAllModals();
  });

  async function loadCategories() {
    var tbody = document.getElementById("categoriesTableBody");
    if (!tbody || !window.AdminAPI) return;

    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Loading categories...</td></tr>';

    try {
      var data = await window.AdminAPI.get("/admin/categories", {
        page: state.page,
        limit: state.limit,
        search: state.search,
        status: state.status
      });

      state.total = data.total || 0;
      state.pages = data.pages || Math.max(Math.ceil(state.total / state.limit), 1);
      window.__categoriesCache = data.categories || [];
      renderCategories(window.__categoriesCache);
      renderPagination();
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Failed to load categories: ' + window.esc(error.message || "Server error") + '</td></tr>';
    }
  }

  function renderCategories(categories) {
    var tbody = document.getElementById("categoriesTableBody");
    if (!tbody) return;

    if (!categories.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No categories found.</td></tr>';
      return;
    }

    tbody.innerHTML = categories.map(function (cat) {
      var isActive = cat.isActive !== false;
      return (
        "<tr>" +
        '<td><strong>' + window.esc(cat.name) + '</strong><br><small class="table-muted">' + window.esc(cat.icon || "fa-solid fa-tag") + '</small></td>' +
        '<td><span class="category-pill">' + window.esc(cat.category || "-") + '</span></td>' +
        '<td>' + (cat.isActive !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>') + '</td>' +
        '<td>' + window.esc(cat.description || "-") + '</td>' +
        '<td>' + window.AdminAPI.formatDate(cat.createdAt) + '</td>' +
        '<td>' +
        '<div class="table-actions">' +
          '<button class="action-btn" data-action="edit" data-id="' + cat.id + '" title="Edit category"><i class="fa-solid fa-pen"></i></button>' +
          '<button class="action-btn" data-action="toggle" data-id="' + cat.id + '" title="' + (isActive ? "Deactivate" : "Activate") + '"><i class="fa-solid ' + (isActive ? "fa-toggle-on" : "fa-toggle-off") + '"></i></button>' +
          '<button class="action-btn danger" data-action="delete" data-id="' + cat.id + '" title="Delete category"><i class="fa-solid fa-trash"></i></button>' +
        '</div>' +
        '</td>' +
        '</tr>'
      );
    }).join("");
  }

  function renderPagination() {
    var info = document.getElementById("paginationInfo");
    var prevBtn = document.getElementById("prevPageBtn");
    var nextBtn = document.getElementById("nextPageBtn");

    if (info) info.textContent = "Page " + state.page + " of " + Math.max(state.pages, 1) + " (" + state.total + " categories)";
    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) nextBtn.disabled = state.page >= state.pages;
  }

  function changePage(delta) {
    state.page += delta;
    if (state.page < 1) state.page = 1;
    loadCategories();
  }

  function openAddCategoryModal() {
    closeAllModals();
    document.getElementById("categoryForm").reset();
    document.getElementById("categoryId").value = "";
    document.getElementById("categoryModalTitle").textContent = "Add New Category";
    document.getElementById("saveCategoryBtn").textContent = "Save Category";
    document.getElementById("categoryIsActive").checked = true;
    openModal("categoryModal");
  }

  function openEditCategoryModal(category) {
    closeAllModals();
    document.getElementById("categoryForm").reset();
    document.getElementById("categoryId").value = category.id;
    document.getElementById("categoryName").value = category.name || "";
    document.getElementById("categoryIcon").value = category.icon || "fa-solid fa-tag";
    document.getElementById("categoryDescription").value = category.description || "";
    document.getElementById("categoryIsActive").checked = category.isActive !== false;
    document.getElementById("categoryModalTitle").textContent = "Edit Category";
    document.getElementById("saveCategoryBtn").textContent = "Update Category";
    openModal("categoryModal");
  }

  async function handleCategoryFormSubmit(event) {
    event.preventDefault();

    var id = document.getElementById("categoryId").value;
    var payload = {
      name: document.getElementById("categoryName").value.trim(),
      icon: document.getElementById("categoryIcon").value.trim() || "fa-solid fa-tag",
      description: document.getElementById("categoryDescription").value.trim(),
      isActive: document.getElementById("categoryIsActive").checked
    };

    try {
      var data;
      var id = document.getElementById("categoryId").value;
      if (!id) {
        data = await window.AdminAPI.post("/admin/categories", payload);
      } else {
        data = await window.AdminAPI.put("/admin/categories/" + id, payload);
      }
      closeModal("categoryModal");
      if (window.AdminToast) window.AdminToast.success("Category saved successfully");
      loadCategories();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to save category");
    }
  }

  async function toggleCategoryStatus(category) {
    var nextStatus = category.isActive !== false ? false : true;
    var message = (category.isActive !== false ? "Deactivate" : "Activate") + ' category "' + category.name + '"?';

    if (!window.confirm(message)) return;

    try {
      await window.AdminAPI.patch("/admin/categories/" + category.id + "/status", { isActive: nextStatus });
      if (window.AdminToast) window.AdminToast.success(nextStatus ? "Category activated" : "Category deactivated");
      loadCategories();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to update category status");
    }
  }

  async function deleteCategory(category) {
    if (!window.confirm('Delete category "' + category.name + '"? This action cannot be undone.')) return;

    try {
      await window.AdminAPI.del("/admin/categories/" + category.id);
      if (window.AdminToast) window.AdminToast.success("Category deleted successfully");
      if (state.total === 1 && state.page > 1) state.page--;
      loadCategories();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to delete category");
    }
  }

  function findCategoryById(id) {
    return window.AdminAPI.get("/admin/categories/" + id).then(function(d) { return d.category; }).catch(function() { return null; });
  }

  function renderPagination() {
    var info = document.getElementById("paginationInfo");
    var prevBtn = document.getElementById("prevPageBtn");
    var nextBtn = document.getElementById("nextPageBtn");

    if (info) info.textContent = "Page " + state.page + " of " + Math.max(state.pages, 1) + " (" + state.total + " categories)";
    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) nextBtn.disabled = state.page >= state.pages;
  }

  function changePage(delta) {
    state.page += delta;
    if (state.page < 1) state.page = 1;
    loadCategories();
  }

  function init() {
    bindEvents();
    loadCategories();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
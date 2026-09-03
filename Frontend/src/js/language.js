/**
 * Smart Cafeteria Ordering System
 * Language Switcher Engine
 *
 * Reads `window.translations` (translations.js), persists the choice in
 * localStorage, translates every element marked with `data-i18n`, and
 * auto-injects a Globe language dropdown into the page header.
 *
 * Usage: load AFTER translations.js, ideally in the <head> or before
 * closing </body>. Applies on DOMContentLoaded.
 */
(function () {
  "use strict";

  const CURRENT_LANG_KEY = "app_language";

  function getTranslations() {
    return (window.translations && window.translations.en) ? window.translations : null;
  }

  function getCurrentLanguage() {
    const lang = localStorage.getItem(CURRENT_LANG_KEY);
    const t = getTranslations();
    return lang && t && t[lang] ? lang : "en";
  }

  function setLanguage(lang) {
    const t = getTranslations();
    if (!t || !t[lang]) return;
    localStorage.setItem(CURRENT_LANG_KEY, lang);

    // Apply via data-i18n
    const langData = t[lang] || t.en;
    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      const key = element.getAttribute("data-i18n");
      if (!key || !langData[key]) return;

      const tag = element.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        if (element.hasAttribute("placeholder")) {
          element.placeholder = langData[key];
        }
      } else if (tag === "SELECT") {
        // Option text translation handled via data-i18n per option; keep value
      } else {
        // Preserve child icon/svg elements, replace trailing text node
        const icons = element.querySelectorAll("i, svg");
        if (icons.length) {
          // Clear all text nodes, keep icon elements
          element.childNodes.forEach(function (node) {
            if (node.nodeType === 3) node.nodeValue = "";
          });
          element.appendChild(document.createTextNode(" " + langData[key]));
        } else {
          element.textContent = langData[key];
        }
      }
    });

    // Translate placeholders declared separately
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (element) {
      const key = element.getAttribute("data-i18n-placeholder");
      if (key && langData[key]) element.placeholder = langData[key];
    });

    // Translate <option> marked with data-i18n
    document.querySelectorAll("option[data-i18n]").forEach(function (option) {
      const key = option.getAttribute("data-i18n");
      if (key && langData[key]) option.textContent = langData[key];
    });

    // Translate page-specific selectors
    document.querySelectorAll(".scos-lang-select, #languageSelect").forEach(function (select) {
      select.value = lang;
    });

    // Persist to the existing i18n module if present (keeps both in sync)
    if (window.setLanguage) {
      try { window.setLanguage(lang); } catch (e) { /* ignore */ }
    }

    // Notify other scripts
    window.dispatchEvent(new CustomEvent("language:changed", {
      detail: { language: lang, translations: langData }
    }));
  }

  function renderLanguageDropdown() {
    // Look for a sensible header container
    const container = document.querySelector(
      "header .nav, header .d-flex, header .navbar-header, header .nav-container, " +
      "header .nav-right, header .header-actions, header .user-nav-links, header .nav-auth, " +
      ".admin-navbar .nav-right, .navbar-header"
    );
    if (!container || document.getElementById("languageSelect")) return;

    const langDiv = document.createElement("div");
    langDiv.className = "d-flex align-items-center ms-auto me-3 lang-switcher-widget";
    langDiv.id = "languageSwitcher";
    langDiv.innerHTML =
      '<i class="fa-solid fa-globe me-1 text-muted"></i> ' +
      '<select id="languageSelect" class="form-select form-select-sm" ' +
      'style="width: auto; cursor: pointer; display:inline-block;">' +
      '  <option value="en">English 🇬🇧</option>' +
      '  <option value="am">አማርኛ 🇪🇹</option>' +
      '</select>';

    container.insertBefore(langDiv, container.firstChild);

    const select = document.getElementById("languageSelect");
    select.value = getCurrentLanguage();
    select.addEventListener("change", function (e) {
      setLanguage(e.target.value);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderLanguageDropdown();
    setLanguage(getCurrentLanguage());
  });

  // Expose globally for console / other scripts
  window.langEngine = {
    getCurrentLanguage: getCurrentLanguage,
    setLanguage: setLanguage
  };
  window.setAppLanguage = setLanguage;
  window.getAppLanguage = getCurrentLanguage;
})();
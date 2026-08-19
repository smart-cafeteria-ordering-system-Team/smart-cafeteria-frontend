/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - NAVBAR COMPONENT
 * ================================================================
 * Pure UI Component - Renders a simple navigation bar.
 * ================================================================
 */

/**
 * Create navbar HTML
 * @param {Object} options - Navbar configuration
 * @param {string} options.brandText - Brand text
 * @param {string} options.brandIcon - Brand icon class
 * @param {string} options.brandHref - Brand link
 * @param {Array} options.links - [{ label, href, active }]
 * @param {string} options.position - 'static', 'sticky', 'fixed'
 * @param {string} options.backgroundColor - Background color
 * @param {string} options.textColor - Text color
 * @param {boolean} options.showSearch - Show search bar
 * @param {Function} options.onSearch - Search callback
 * @param {Function} options.onToggle - Mobile menu toggle callback
 * @returns {string} Navbar HTML
 */
export function createNavbar(options = {}) {
    const {
        brandText = 'SmartCafeteria',
        brandIcon = 'fas fa-utensils',
        brandHref = '/index.html',
        links = [],
        position = 'sticky',
        backgroundColor = 'var(--white)',
        textColor = 'var(--gray-700)',
        showSearch = false,
        onSearch = null,
        onToggle = null,
    } = options;

    // ---- Build Links ----
    const linksHTML = links.map(link => `
        <a href="${link.href}" class="${link.active ? 'active' : ''}" style="font-weight:500; color:${textColor}; text-decoration:none; transition:color 0.2s; ${link.active ? 'color:#2563eb;' : ''}">
            ${link.label}
        </a>
    `).join('');

    // ---- Search Bar ----
    const searchHTML = showSearch ? `
        <div class="navbar-search" style="position:relative;">
            <input type="text" class="search-input" placeholder="Search..." style="padding:8px 14px 8px 36px; border:2px solid var(--gray-200); border-radius:8px; font-size:14px; outline:none; transition:border-color 0.2s, box-shadow 0.2s; background:var(--white); color:var(--gray-800); width:200px;">
            <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--gray-400);"></i>
        </div>
    ` : '';

    // ---- Position Styles ----
    const positionStyles = {
        static: 'position:static;',
        sticky: 'position:sticky; top:0; z-index:100;',
        fixed: 'position:fixed; top:0; left:0; right:0; z-index:100;',
    };

    // ---- Build Navbar ----
    return `
        <nav class="navbar" style="display:flex; align-items:center; justify-content:space-between; padding:12px 24px; background:${backgroundColor}; border-bottom:1px solid var(--gray-200); ${positionStyles[position] || positionStyles.sticky} box-shadow:var(--shadow-xs);">
            <!-- Brand -->
            <a href="${brandHref}" class="navbar-brand" style="display:flex; align-items:center; gap:8px; font-size:20px; font-weight:700; color:#2563eb; text-decoration:none;">
                <i class="${brandIcon}"></i>
                <span style="color:var(--gray-900);">${brandText}</span>
            </a>

            <!-- Mobile Toggle -->
            <button class="navbar-toggle" aria-label="Toggle navigation" style="display:none; background:none; border:none; font-size:24px; color:var(--gray-600); cursor:pointer; padding:4px;" onclick="${typeof onToggle === 'function' ? onToggle.toString() + '()' : ''}">
                <i class="fas fa-bars"></i>
            </button>

            <!-- Nav Links -->
            <div class="navbar-links" style="display:flex; align-items:center; gap:20px;">
                ${linksHTML}
                ${searchHTML}
            </div>
        </nav>
       <!-- Navbar Styles -->
        <style>
            .navbar-links a:hover {
                color: #2563eb !important;
            }
            .search-input:focus {
                border-color: #2563eb;
                box-shadow: 0 0 0 4px rgba(37,99,235,0.12);
            }
            @media (max-width: 768px) {
                .navbar-toggle {
                    display: block !important;
                }
                .navbar-links {
                    display: none !important;
                    flex-direction: column;
                    gap: 12px !important;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: var(--white);
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--gray-200);
                    box-shadow: var(--shadow-md);
                }
                .navbar-links.open {
                    display: flex !important;
                }
                .navbar-search .search-input {
                    width: 100% !important;
                }
            }
        </style>

        <!-- Navbar Script -->
        <script>
            (function() {
                const toggle = document.querySelector('.navbar-toggle');
                const links = document.querySelector('.navbar-links');
                if (toggle && links) {
                    toggle.addEventListener('click', function(e) {
                        e.stopPropagation();
                        links.classList.toggle('open');
                    });
                    document.addEventListener('click', function(e) {
                        if (links.classList.contains('open') && !links.contains(e.target) && !toggle.contains(e.target)) {
                            links.classList.remove('open');
                        }
                    });
                }
                ${typeof onSearch === 'function' ? 
                    document.querySelector('.search-input')?.addEventListener('input', function(e) {
                        ${onSearch.toString()}(e.target.value);
                    });
                 : ''}
            })();
        </script>
    `;
}

/**
 * Render navbar to a container element
 * @param {string|Element} container - Container selector or element
 * @param {Object} options - Same as createNavbar options
 */
export function renderNavbar(container, options = {}) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) {
        console.warn('Navbar container not found');
        return;
    }
    el.innerHTML = createNavbar(options);
}

export default {
    createNavbar,
    renderNavbar,
};
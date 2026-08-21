/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - CARD COMPONENT
 * ================================================================
 * Pure UI Component - Renders a card with header, body, footer.
 * ================================================================
 */

/**
 * Create card HTML
 * @param {Object} options - Card configuration
 * @param {string} options.header - Header content (HTML)
 * @param {string} options.body - Body content (HTML)
 * @param {string} options.footer - Footer content (HTML)
 * @param {string} options.variant - 'default', 'primary', 'success', 'danger', 'warning'
 * @param {boolean} options.hoverable - Add hover effect
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.image - Image URL for card image
 * @param {string} options.imageAlt - Image alt text
 * @param {string} options.imagePosition - 'top', 'bottom'
 * @param {Function} options.onClick - Click callback
 * @returns {string} Card HTML
 */
export function createCard(options = {}) {
    const {
        header = '',
        body = '',
        footer = '',
        variant = 'default',
        hoverable = false,
        className = '',
        image = null,
        imageAlt = 'Card image',
        imagePosition = 'top',
        onClick = null,
    } = options;

    // ---- Variant Styles ----
    const variantStyles = {
        default: 'border-color:var(--gray-200);',
        primary: 'border-color:#2563eb;',
        success: 'border-color:#16a34a;',
        danger: 'border-color:#dc2626;',
        warning: 'border-color:#f59e0b;',
    };

    const variantHeaderStyles = {
        default: '',
        primary: 'background:#2563eb; color:white; border-color:#2563eb;',
        success: 'background:#16a34a; color:white; border-color:#16a34a;',
        danger: 'background:#dc2626; color:white; border-color:#dc2626;',
        warning: 'background:#f59e0b; color:#1e293b; border-color:#f59e0b;',
    };

    // ---- Hover ----
    const hoverStyles = hoverable ? `
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        cursor: pointer;
    ` : '';

    // ---- Image ----
    const imageHTML = image ? `
        <div class="card-image" style="overflow:hidden; ${imagePosition === 'bottom' ? 'order:2;' : ''}">
            <img src="${image}" alt="${imageAlt}" style="width:100%; height:auto; display:block;">
        </div>
    ` : '';

    // ---- Header ----
    const headerHTML = header ? `
        <div class="card-header" style="padding:12px 20px; border-bottom:1px solid var(--gray-200); background:var(--gray-50); ${variantHeaderStyles[variant] || variantHeaderStyles.default}">
            ${header}
        </div>
    ` : '';

    // ---- Footer ----
    const footerHTML = footer ? `
        <div class="card-footer" style="padding:12px 20px; border-top:1px solid var(--gray-200); background:var(--gray-50);">
            ${footer}
        </div>
    ` : '';

    // ---- Build Card ----
    const imageTop = imagePosition === 'top' ? imageHTML : '';
    const imageBottom = imagePosition === 'bottom' ? imageHTML : '';

    return `
        <div class="card ${className}" style="background:var(--white); border:1px solid var(--gray-200); border-radius:12px; overflow:hidden; box-shadow:var(--shadow-sm); ${variantStyles[variant] || variantStyles.default} ${hoverStyles}" ${onClick ? `onclick="${onClick.toString()}()"` : ''}>
            ${imageTop}
            ${headerHTML}
            <div class="card-body" style="padding:20px;">
                ${body}
            </div>
            ${footerHTML}
            ${imageBottom}
        </div>

        <!-- Card Styles -->
        <style>
            .card:hover {
            ${hoverable ? 'transform: translateY(-4px); box-shadow: var(--shadow-md);' : ''}
            }
            [data-theme="dark"] .card {
                background: #1e293b;
                border-color: #334155;
            }
            [data-theme="dark"] .card .card-header {
                background: #0f172a;
                border-color: #334155;
            }
            [data-theme="dark"] .card .card-footer {
                background: #0f172a;
                border-color: #334155;
            }
        </style>
    ;
}

/**
 * Create a simple menu item card
 * @param {Object} item - Menu item data
 * @param {string} language - 'en' or 'am'
 * @param {Function} onAddToCart - Add to cart callback
 * @returns {string} Menu card HTML
 */
export function createMenuItemCard(item, language = 'en', onAddToCart = null) {
    const name = item.name[language] || item.name.en;
    const description = item.description[language] || item.description.en;

    return createCard({
        variant: 'default',
        hoverable: true,
        className: 'menu-item-card',
        image: item.image || null,
        imageAlt: name,
        imagePosition: 'top',
        header: 
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:600; font-size:16px;">${name}</span>
                <span class="menu-category" style="font-size:11px; color:#2563eb; font-weight:500; text-transform:uppercase; letter-spacing:0.04em;">${item.category}</span>
            </div>
        ,
        body: 
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:14px; color:var(--gray-500); margin-bottom:4px;">${description || ''}</div>
                    <div style="font-size:20px; font-weight:700; color:#2563eb;">${item.price} ብር</div>
                    ${item.preparationTime ? <div style="font-size:12px; color:var(--gray-400);"><i class="fas fa-clock"></i> ${item.preparationTime} min</div> : ''}
                </div>
                <div>
                    ${item.availability !== false ? 
                        <button class="btn-add-to-cart" style="padding:8px 16px; background:#2563eb; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer; transition:all 0.2s;">
                            <i class="fas fa-plus"></i> Add
                        </button>
                     : 
                        <span style="font-size:12px; color:#dc2626; font-weight:600;">Unavailable</span>
                    }
                </div>
            </div>
        `,
        onClick: null,
    });
}

/**
 * Render card to a container element
 * @param {string|Element} container - Container selector or element
 * @param {Object} options - Same as createCard options
 */
export function renderCard(container, options = {}) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) {
        console.warn('Card container not found');
        return;
    }
    el.innerHTML = createCard(options);
}

export default {
    createCard,
    createMenuItemCard,
    renderCard,
};
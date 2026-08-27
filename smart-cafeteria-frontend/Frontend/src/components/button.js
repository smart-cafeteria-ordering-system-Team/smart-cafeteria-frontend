/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - BUTTON COMPONENT
 * ================================================================
 * Pure UI Component - Renders styled buttons.
 * ================================================================
 */

/**
 * Create button HTML
 * @param {Object} options - Button configuration
 * @param {string} options.label - Button label
 * @param {string} options.variant - 'primary', 'outline', 'success', 'danger', 'warning', 'ghost'
 * @param {string} options.size - 'sm', 'md', 'lg'
 * @param {string} options.icon - Icon class (e.g., 'fas fa-plus')
 * @param {string} options.iconPosition - 'left', 'right'
 * @param {string} options.type - 'button', 'submit', 'reset'
 * @param {boolean} options.isLoading - Loading state
 * @param {boolean} options.isDisabled - Disabled state
 * @param {boolean} options.isFullWidth - Full width
 * @param {string} options.href - Link href (makes button an anchor)
 * @param {Function} options.onClick - Click callback
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.id - Button ID
 * @returns {string} Button HTML
 */
export function createButton(options = {}) {
    const {
        label = 'Button',
        variant = 'primary',
        size = 'md',
        icon = null,
        iconPosition = 'left',
        type = 'button',
        isLoading = false,
        isDisabled = false,
        isFullWidth = false,
        href = null,
        onClick = null,
        className = '',
        id = null,
    } = options;

    // ---- Variant Styles ----
    const variants = {
        primary: {
            background: '#2563eb',
            color: '#ffffff',
            border: '2px solid #2563eb',
            hover: 'background:#1d4ed8; border-color:#1d4ed8;',
        },
        outline: {
            background: 'transparent',
            color: '#2563eb',
            border: '2px solid #2563eb',
            hover: 'background:#2563eb; color:#ffffff;',
        },
        success: {
            background: '#16a34a',
            color: '#ffffff',
            border: '2px solid #16a34a',
            hover: 'background:#15803d; border-color:#15803d;',
        },
        danger: {
            background: '#dc2626',
            color: '#ffffff',
            border: '2px solid #dc2626',
            hover: 'background:#b91c1c; border-color:#b91c1c;',
        },
        warning: {
            background: '#f59e0b',
            color: '#1e293b',
            border: '2px solid #f59e0b',
            hover: 'background:#d97706; border-color:#d97706;',
        },
        ghost: {
            background: 'transparent',
            color: '#64748b',
            border: '2px solid transparent',
            hover: 'background:#f1f5f9;',
        },
    };

    const variantStyles = variants[variant] || variants.primary;

    // ---- Size Styles ----
    const sizes = {
        sm: 'padding:6px 14px; font-size:12px;',
        md: 'padding:10px 20px; font-size:14px;',
        lg: 'padding:14px 28px; font-size:16px;',
    };
    const sizeStyles = sizes[size] || sizes.md;

    // ---- Icon ----
    const iconHTML = icon ? `
        <i class="${icon}" style="${iconPosition === 'right' ? 'order:2;' : ''}"></i>
    ` : '';

    // ---- Loading Spinner ----
    const spinnerHTML = isLoading ? `
        <i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>
    ` : '';

    // ---- Disabled ----
    const disabledAttr = isDisabled || isLoading ? 'disabled' : '';
    const disabledStyles = isDisabled || isLoading ? 'opacity:0.6; cursor:not-allowed;' : '';

    // ---- Full Width ----
    const fullWidthStyles = isFullWidth ? 'width:100%; justify-content:center;' : '';

    // ---- Click Handler ----
    const clickHandler = onClick && !isDisabled && !isLoading ? `onclick="${onClick.toString()}()"` : '';
    // ---- Build Button ----
    const content = 
        ${spinnerHTML}
        ${iconPosition === 'left' ? iconHTML : ''}
        <span>${label}</span>
        ${iconPosition === 'right' ? iconHTML : ''}
    ;

    const styles = 
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:6px;
        font-family:'Poppins',sans-serif;
        font-weight:600;
        border-radius:8px;
        cursor:pointer;
        transition:all 0.25s ease;
        text-decoration:none;
        ${sizeStyles}
        ${variantStyles.background ? 'background:' + variantStyles.background + ';' : ''}
        color:${variantStyles.color};
        border:${variantStyles.border || '2px solid transparent'};
        ${disabledStyles}
        ${fullWidthStyles}
        ${className}
    ;

    if (href) {
        return 
            <a href="${href}" id="${id || ''}" style="${styles}" ${clickHandler}>
                ${content}
            </a>
        ;
    }

    return 
        <button type="${type}" id="${id || ''}" style="${styles}" ${disabledAttr} ${clickHandler}>
            ${content}
        </button>
    ;
}

/**
 * Create a group of buttons
 * @param {Array} buttons - Array of button options
 * @param {string} direction - 'horizontal', 'vertical'
 * @param {string} gap - Gap size (e.g., '8px')
 * @returns {string} Button group HTML
 */
export function createButtonGroup(buttons, direction = 'horizontal', gap = '8px') {
    const buttonsHTML = buttons.map(btn => createButton(btn)).join('');

    const directionStyles = direction === 'vertical'
        ? 'flex-direction:column; align-items:stretch;'
        : 'flex-direction:row; flex-wrap:wrap;';

    return 
        <div class="btn-group" style="display:flex; ${directionStyles} gap:${gap};">
            ${buttonsHTML}
        </div>
    ;
}

/**
 * Render button to a container element
 * @param {string|Element} container - Container selector or element
 * @param {Object} options - Same as createButton options
 */
export function renderButton(container, options = {}) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) {
        console.warn('Button container not found');
        return;
    }
    el.innerHTML = createButton(options);
}

export default {
    createButton,
    createButtonGroup,
    renderButton,
};
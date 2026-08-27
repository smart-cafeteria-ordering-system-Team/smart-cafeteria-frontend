/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - RATING COMPONENT
 * ================================================================
 * Pure UI Component - Renders star ratings.
 * ================================================================
 */

/**
 * Create rating stars HTML
 * @param {Object} options - Rating configuration
 * @param {number} options.value - Rating value (0-5)
 * @param {number} options.max - Max rating (default: 5)
 * @param {boolean} options.isEditable - Allow user to rate
 * @param {string} options.size - 'sm', 'md', 'lg'
 * @param {string} options.color - Star color
 * @param {string} options.emptyColor - Empty star color
 * @param {Function} options.onRate - Rate callback (receives value)
 * @param {boolean} options.showLabel - Show rating label
 * @param {string} options.label - Custom label
 * @param {string} options.className - Additional CSS classes
 * @returns {string} Rating HTML
 */
export function createRating(options = {}) {
    const {
        value = 0,
        max = 5,
        isEditable = false,
        size = 'md',
        color = '#f59e0b',
        emptyColor = '#d1d5db',
        onRate = null,
        showLabel = false,
        label = '',
        className = '',
    } = options;

    // ---- Size ----
    const sizes = {
        sm: 'font-size:16px;',
        md: 'font-size:24px;',
        lg: 'font-size:32px;',
    };
    const sizeStyles = sizes[size] || sizes.md;

    // ---- Build Stars ----
    let starsHTML = '';
    for (let i = 1; i <= max; i++) {
        const isActive = i <= Math.round(value);
        const starValue = i;

        const clickAttr = isEditable && onRate ? `onclick="${onRate.toString()}(${starValue})"` : '';
        const hoverAttr = isEditable ? `
            onmouseenter="this.style.color='${color}'"
            onmouseleave="this.style.color='${isActive ? color : emptyColor}'"
        ` : '';

        starsHTML += `
            <span class="star ${isActive ? 'active' : ''}" 
                  data-value="${starValue}"
                  style="cursor:${isEditable ? 'pointer' : 'default'}; 
                         color:${isActive ? color : emptyColor}; 
                         transition:color 0.15s ease;
                         ${sizeStyles}"
                  ${clickAttr}
                  ${hoverAttr}>
                <i class="${isActive ? 'fas' : 'far'} fa-star"></i>
            </span>
        `;
    }

    // ---- Label ----
    const labelHTML = showLabel ? `
        <span class="rating-label" style="font-size:14px; color:var(--gray-500); font-weight:500; margin-left:8px;">
            ${label || `${Math.round(value)} / ${max}`}
        </span>
    ` : '';

    return `
        <div class="rating ${className}" style="display:inline-flex; align-items:center; gap:2px;">
            ${starsHTML}
            ${labelHTML}
        </div>

        <!-- Rating Styles -->
        <style>
            .rating .star {
                display: inline-block;
            }
            .rating .star:hover ~ .star {
                color: var(--gray-300) !important;
            }
            .rating .star.active {
                color: ${color} !important;
            }
            [data-theme="dark"] .rating .star {
                color: ${emptyColor};
            }
            [data-theme="dark"] .rating .star.active {
                color: ${color} !important;
            }
        </style>
    `;
}

/**
 * Create rating summary (average + count)
 * @param {Object} options - Summary configuration
 * @param {number} options.average - Average rating
 * @param {number} options.count - Number of ratings
 * @param {string} options.size - 'sm', 'md', 'lg'
 * @returns {string} Rating summary HTML
 */
export function createRatingSummary(options = {}) {
    const {
        average = 0,
        count = 0,
        size = 'md',
    } = options;
    return 
        <div class="rating-summary" style="display:flex; align-items:center; gap:8px;">
            ${createRating({ value: average, size: size, showLabel: false })}
            <span style="font-size:14px; color:var(--gray-600);">
                ${average.toFixed(1)} 
                <span style="color:var(--gray-400);">(${count} ${count === 1 ? 'review' : 'reviews'})</span>
            </span>
        </div>
    ;
}

export default {
    createRating,
    createRatingSummary,
};
/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - FORM COMPONENT
 * ================================================================
 * Pure UI Component - Renders form elements.
 * ================================================================
 */

/**
 * Create form field HTML
 * @param {Object} options - Field configuration
 * @param {string} options.type - 'text', 'email', 'password', 'number', 'textarea', 'select', 'checkbox', 'radio'
 * @param {string} options.id - Field ID
 * @param {string} options.label - Field label
 * @param {string} options.name - Field name
 * @param {string} options.value - Field value
 * @param {string} options.placeholder - Placeholder text
 * @param {boolean} options.required - Required field
 * @param {string} options.hint - Help text
 * @param {string} options.error - Error message
 * @param {Array} options.options - Options for select/radio [{ value, label }]
 * @param {string} options.className - Additional CSS classes
 * @param {boolean} options.isDisabled - Disabled state
 * @param {Function} options.onChange - Change callback
 * @param {Function} options.onInput - Input callback
 * @param {Function} options.onBlur - Blur callback
 * @returns {string} Form field HTML
 */
export function createFormField(options = {}) {
    const {
        type = 'text',
        id = 'field-' + Date.now(),
        label = '',
        name = '',
        value = '',
        placeholder = '',
        required = false,
        hint = '',
        error = '',
        options: selectOptions = [],
        className = '',
        isDisabled = false,
        onChange = null,
        onInput = null,
        onBlur = null,
    } = options;

    // ---- Build Input ----
    let inputHTML = '';

    const commonAttrs = `
        id="${id}"
        name="${name || id}"
        class="form-control ${error ? 'error' : ''} ${className}"
        ${isDisabled ? 'disabled' : ''}
        ${required ? 'required' : ''}
        ${onChange ? `onchange="${onChange.toString()}()"` : ''}
        ${onInput ? `oninput="${onInput.toString()}()"` : ''}
        ${onBlur ? `onblur="${onBlur.toString()}()"` : ''}
    `;

    switch (type) {
        case 'textarea':
            inputHTML = `
                <textarea ${commonAttrs} placeholder="${placeholder}" rows="4">${value}</textarea>
            `;
            break;

        case 'select':
            const optionsHTML = selectOptions.map(opt => `
                <option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>
            `).join('');
            inputHTML = `
                <select ${commonAttrs}>
                    <option value="">Select...</option>
                    ${optionsHTML}
                </select>
            `;
            break;

        case 'checkbox':
            inputHTML = `
                <input type="checkbox" ${commonAttrs} ${value ? 'checked' : ''}>
            `;
            break;

        case 'radio':
            const radioOptionsHTML = selectOptions.map(opt => `
                <label style="display:flex; align-items:center; gap:6px; font-weight:400; cursor:pointer;">
                    <input type="radio" name="${name || id}" value="${opt.value}" ${value === opt.value ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                    ${opt.label}
                </label>
            `).join('');
            inputHTML = `
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                    ${radioOptionsHTML}
                </div>
            `;
            break;

        default:
            inputHTML = `
                <input type="${type}" ${commonAttrs} value="${value}" placeholder="${placeholder}">
            `;
            break;
    }
    // ---- Build Field ----
    const labelHTML = label ? 
        <label for="${id}" style="display:block; font-weight:600; font-size:14px; color:var(--gray-700); margin-bottom:4px;">
            ${label} ${required ? '<span style="color:#dc2626;">*</span>' : ''}
        </label>
     : '';

    const hintHTML = hint ? 
        <div class="form-hint" style="font-size:12px; color:var(--gray-500); margin-top:4px;">${hint}</div>
     : '';

    const errorHTML = error ? 
        <div class="form-error" style="font-size:12px; color:#dc2626; margin-top:4px;">
            <i class="fas fa-exclamation-circle"></i> ${error}
        </div>
     : '';

    return 
        <div class="form-group" style="margin-bottom:16px;">
            ${labelHTML}
            ${inputHTML}
            ${hintHTML}
            ${errorHTML}
        </div>

        <!-- Form Field Styles -->
        <style>
            .form-control {
                width: 100%;
                padding: 10px 14px;
                font-family: 'Poppins', sans-serif;
                font-size: 14px;
                color: var(--gray-800);
                background: var(--white);
                border: 2px solid var(--gray-200);
                border-radius: 8px;
                transition: border-color 0.2s, box-shadow 0.2s;
                outline: none;
            }
            .form-control:focus {
                border-color: #2563eb;
                box-shadow: 0 0 0 4px rgba(37,99,235,0.12);
            }
            .form-control.error {
                border-color: #dc2626;
            }
            .form-control.error:focus {
                box-shadow: 0 0 0 4px rgba(220,38,38,0.12);
            }
            .form-control:disabled {
                background: var(--gray-100);
                cursor: not-allowed;
            }
            select.form-control {
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='2' fill='none'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 14px center;
                padding-right: 40px;
            }
            textarea.form-control {
                resize: vertical;
                min-height: 80px;
            }
            [data-theme="dark"] .form-control {
                background: #0f172a;
                border-color: #334155;
                color: #e2e8f0;
            }
            [data-theme="dark"] .form-control:focus {
                border-color: #3b82f6;
            }
            [data-theme="dark"] .form-control:disabled {
                background: #1e293b;
            }
        </style>
    ;
}

/**
 * Create a complete form
 * @param {Object} options - Form configuration
 * @param {string} options.id - Form ID
 * @param {Array} options.fields - Array of field options
 * @param {string} options.submitLabel - Submit button label
 * @param {string} options.cancelLabel - Cancel button label
 * @param {Function} options.onSubmit - Submit callback
 * @param {Function} options.onCancel - Cancel callback
 * @param {string} options.className - Additional CSS classes
 * @returns {string} Form HTML
 */
export function createForm(options = {}) {
    const {
        id = 'form-' + Date.now(),
        fields = [],
        submitLabel = 'Submit',
        cancelLabel = 'Cancel',
        onSubmit = null,
        onCancel = null,
        className = '',
    } = options;

    const fieldsHTML = fields.map(field => createFormField(field)).join('');

    const submitBtn = onSubmit ? 
        <button type="submit" class="btn btn-primary" style="padding:10px 24px; background:#2563eb; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer; transition:all 0.2s;">
            ${submitLabel}
        </button>
     : '';
     const cancelBtn = onCancel ? 
        <button type="button" class="btn btn-ghost" style="padding:10px 24px; background:transparent; color:var(--gray-600); border:2px solid var(--gray-200); border-radius:8px; font-weight:600; cursor:pointer; transition:all 0.2s;">
            ${cancelLabel}
        </button>
     : '';

    return 
        <form id="${id}" class="${className}" ${onSubmit ? onsubmit="event.preventDefault(); ${onSubmit.toString()}()" : ''}>
            ${fieldsHTML}
            <div style="display:flex; gap:8px; margin-top:16px;">
                ${submitBtn}
                ${cancelBtn}
            </div>
        </form>
    ;
}

export default {
    createFormField,
    createForm,
};
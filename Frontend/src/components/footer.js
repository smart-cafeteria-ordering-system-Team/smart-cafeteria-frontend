/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - FOOTER COMPONENT
 * ================================================================
 * Pure UI Component - Renders the footer.
 * ================================================================
 */

/**
 * Create footer HTML
 * @param {Object} options - Footer configuration
 * @param {string} options.logoText - Logo text
 * @param {string} options.logoIcon - Logo icon class
 * @param {string} options.copyrightYear - Year (default: 2026)
 * @param {string} options.companyName - Company/institution name
 * @param {Array} options.developers - [{ name, university }]
 * @param {string} options.description - Footer description
 * @param {Array} options.quickLinks - [{ label, href }]
 * @param {Array} options.roleLinks - [{ label, href }]
 * @param {Object} options.contact - { email, phone, address }
 * @param {Array} options.socialLinks - [{ icon, href, label }]
 * @param {string} options.language - 'en' or 'am'
 * @returns {string} Footer HTML
 */
export function createFooter(options = {}) {
    const {
        logoText = 'SmartCafeteria',
        logoIcon = 'fas fa-utensils',
        copyrightYear = '2026',
        companyName = 'Debre Berhan University',
        developers = [
            { name: 'Kidus Birhanu', university: 'Arbaminch University' },
            { name: 'Sintayehu Begashaw', university: 'Dredewa University' },
            { name: 'Wondesen Gemechu', university: 'Debre Tabor University' },
        ],
        description = 'Modern cafeteria ordering system that makes food ordering fast, simple, and efficient.',
        quickLinks = [
            { label: 'Home', href: '/index.html' },
            { label: 'Menu', href: '/src/pages/customer/menu.html' },
            { label: 'Login', href: '/src/pages/common/login.html' },
            { label: 'Register', href: '/src/pages/common/register.html' },
        ],
        roleLinks = [
            { label: 'Customer', href: '/src/pages/customer/menu.html' },
            { label: 'Kitchen', href: '/src/pages/kitchen/dashboard.html' },
            { label: 'Admin', href: '/src/pages/admin/dashboard.html' },
        ],
        contact = {
            email: 'info@smartcafeteria.com',
            phone: '+251 912 345 678',
            address: 'Debre Berhan, Ethiopia',
        },
        socialLinks = [
            { icon: 'fa-facebook-f', href: '#', label: 'Facebook' },
            { icon: 'fa-twitter', href: '#', label: 'Twitter' },
            { icon: 'fa-linkedin-in', href: '#', label: 'LinkedIn' },
            { icon: 'fa-github', href: '#', label: 'GitHub' },
        ],
        language = 'en',
    } = options;

    // ---- Developers Text ----
    const developerNames = developers.map(d => d.name).join(', ');

    // ---- Build Quick Links ----
    const quickLinksHTML = quickLinks.map(link => `
        <a href="${link.href}">${link.label}</a>
    `).join('');

    // ---- Build Role Links ----
    const roleLinksHTML = roleLinks.map(link => `
        <a href="${link.href}">${link.label}</a>
    `).join('');

    // ---- Build Social Links ----
    const socialLinksHTML = socialLinks.map(link => `
        <a href="${link.href}" aria-label="${link.label}">
            <i class="fab ${link.icon}"></i>
        </a>
    `).join('');

    // ---- Build Footer ----
    return `
        <footer class="footer" style="background:#0f172a; color:#e5e7eb; padding:48px 0 24px;">
            <div class="container">

                <!-- Footer Grid -->
                <div style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:32px; margin-bottom:24px;">

                    <!-- Column 1: Brand -->
                    <div>
                       <div class="footer-logo" style="font-size:22px; font-weight:700; color:#2563eb; margin-bottom:8px;">
                            <i class="${logoIcon}"></i> <span style="color:#ffffff;">${logoText}</span>
                        </div>
                        <p style="color:#94a3b8; font-size:14px; line-height:1.6; margin-bottom:12px;">
                            ${description}
                        </p>
                        <div class="social-links" style="display:flex; gap:8px;">
                            ${socialLinksHTML}
                        </div>
                    </div>

                    <!-- Column 2: Quick Links -->
                    <div>
                        <h4 style="color:#ffffff; font-size:16px; font-weight:600; margin-bottom:12px;">Quick Links</h4>
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            ${quickLinksHTML}
                        </div>
                    </div>

                    <!-- Column 3: Roles -->
                    <div>
                        <h4 style="color:#ffffff; font-size:16px; font-weight:600; margin-bottom:12px;">Roles</h4>
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            ${roleLinksHTML}
                        </div>
                    </div>

                    <!-- Column 4: Contact -->
                    <div>
                        <h4 style="color:#ffffff; font-size:16px; font-weight:600; margin-bottom:12px;">Contact</h4>
                        <div style="display:flex; flex-direction:column; gap:4px; color:#94a3b8; font-size:14px;">
                            <p><i class="fas fa-envelope" style="width:20px;"></i> ${contact.email}</p>
                            <p><i class="fas fa-phone" style="width:20px;"></i> ${contact.phone}</p>
                            <p><i class="fas fa-map-marker-alt" style="width:20px;"></i> ${contact.address}</p>
                        </div>
                    </div>
                </div>

                <!-- Footer Bottom -->
                <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:20px; text-align:center; font-size:13px; color:#64748b;">
                    <p>
                        &copy; ${copyrightYear} <strong style="color:#e5e7eb;">${logoText}</strong>.
                        Developed by
                        <span style="color:#2563eb; font-weight:500;">${developerNames}</span>
                        <span style="color:#64748b;">| ${companyName}</span>
                    </p>
                </div>
            </div>
        </footer>

        <!-- Footer Styles -->
        <style>
            .footer a {
                color: #94a3b8;
                text-decoration: none;
                font-size: 14px;
                transition: color 0.2s;
            }
            .footer a:hover {
                color: #ffffff;
            }
            .footer .social-links a {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                background: rgba(255,255,255,0.06);
                border-radius: 50%;
                color: #94a3b8;
                font-size: 16px;
                transition: all 0.2s;
            }
            .footer .social-links a:hover {
                background: #2563eb;
                color: #ffffff;
            }
            @media (max-width: 768px) {
                .footer > div > div:first-child {
                    grid-template-columns: 1fr !important;
                    text-align: center;
                }
                .footer .social-links {
                    justify-content: center;
                }
            }
        </style>
    `;
}
 /**
 * Render footer to a container element
 * @param {string|Element} container - Container selector or element
 * @param {Object} options - Same as createFooter options
 */
export function renderFooter(container, options = {}) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) {
        console.warn('Footer container not found');
        return;
    }
    el.innerHTML = createFooter(options);
}

export default {
    createFooter,
    renderFooter,
};
const CHAPA_API_URL = 'https://api.chapa.co/v1';

function readableMessage(message) {
    if (message == null) return 'Chapa request failed';
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.map(readableMessage).join(', ');
    if (typeof message === 'object') {
        return Object.entries(message)
            .map(([key, value]) => Array.isArray(value)
                ? `${key}: ${value.join(', ')}`
                : `${key}: ${readableMessage(value)}`)
            .join('; ');
    }
    return String(message);
}

function isEmailValidationError(data) {
    if (!data || typeof data !== 'object') return false;
    const message = data.message;
    if (!message || typeof message !== 'object') return false;
    return Object.prototype.hasOwnProperty.call(message, 'email');
}

const getSecretKey = () => process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-VOsIXBW26DEMsxpUkwwb1eQMZSHZXujQ';

const chapaRequest = async (path, options = {}) => {
    const secretKey = getSecretKey();
    if (!secretKey) {
        const error = new Error('CHAPA_SECRET_KEY is not configured');
        error.statusCode = 500;
        throw error;
    }

    const response = await fetch(`${CHAPA_API_URL}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });

    let data = {};
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok || data.status !== 'success') {
        const error = new Error(readableMessage(data.message));
        error.statusCode = response.status || 502;
        error.chapa = data;
        error.isEmailValidationError = response.status === 400 && isEmailValidationError(data);
        throw error;
    }

    return data;
};

exports.initialize = (payload) => chapaRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify(payload)
});

exports.verify = (txRef) => chapaRequest(`/transaction/verify/${encodeURIComponent(txRef)}`);

exports.initializeTelebirr = (payload) => chapaRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({ ...payload, payment_method: 'telebirr' })
});

// ============================================================
//  Phase 7 Chapa API (named helpers used by chapa.controller)
// ============================================================

/**
 * Initialize a Chapa transaction. Returns { data: { checkout_url, tx_ref } }.
 */
exports.initializePayment = (payload) =>
    chapaRequest('/transaction/initialize', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

/**
 * Verify a previously initialized transaction by its tx_ref.
 * Returns { data: { status, amount, currency, reference, tx_ref } }.
 */
exports.verifyPayment = (txRef) =>
    chapaRequest(`/transaction/verify/${encodeURIComponent(txRef)}`);

/**
 * Validate an incoming Chapa webhook using the shared webhook secret.
 *
 * Chapa signs webhooks with HMAC-SHA256 using the secret hash configured in
 * the Chapa dashboard (CHAPA_WEBHOOK_SECRET):
 *  - `x-chapa-signature` => HMAC-SHA256 of the raw event payload.
 *  - `chapa-signature`   => HMAC-SHA256 of the secret hash itself (origin
 *                           marker, independent of the payload).
 * If either signature matches, the webhook is considered authentic.
 *
 * @param {object} opts
 * @param {string|Buffer} opts.rawBody - the raw (unparsed) request body
 * @param {string|null} opts.xSignature - value of the `x-chapa-signature` header
 * @param {string|null} opts.chapaSignature - value of the `chapa-signature` header
 * @returns {boolean} true when the webhook signature is valid
 */
exports.validateWebhook = ({ rawBody = '', xSignature = null, chapaSignature = null } = {}) => {
    const crypto = require('crypto');
    const secret = process.env.CHAPA_WEBHOOK_SECRET || process.env.CHAPA_SECRET_KEY;
    if (!secret) return false;

    const body = Buffer.isBuffer(rawBody) ? rawBody.toString() : String(rawBody || '');

    const hmacHex = (data) => crypto
        .createHmac('sha256', secret)
        .update(String(data))
        .digest('hex');

    const safeEqual = (expectedHex, providedHex) => {
        if (!providedHex) return false;
        const a = Buffer.from(String(expectedHex).replace(/^sha256=|^hmac\s+/i, ''), 'hex');
        const b = Buffer.from(String(providedHex).replace(/^sha256=|^hmac\s+/i, ''), 'hex');
        return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
    };

    if (safeEqual(hmacHex(body), xSignature)) return true;
    if (safeEqual(hmacHex(secret), chapaSignature)) return true;
    return false;
};
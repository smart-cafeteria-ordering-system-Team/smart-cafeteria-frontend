const CHAPA_API_URL = 'https://api.chapa.co/v1';

const chapaRequest = async (path, options = {}) => {
    if (!process.env.CHAPA_SECRET_KEY) {
        const error = new Error('CHAPA_SECRET_KEY is not configured');
        error.statusCode = 500;
        throw error;
    }

    const response = await fetch(`${CHAPA_API_URL}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
        const error = new Error(data.message || 'Chapa request failed');
        error.statusCode = response.status || 502;
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
 * Chapa signs webhooks with an HMAC-SHA256 over the raw request body using
 * the webhook signing secret as the key, delivered in the
 * `x-chapa-signature` (or `chapa-signature`) header.
 *
 * @param {object} opts
 * @param {string} opts.rawBody - the raw (unparsed) request body as a string/Buffer
 * @param {string|null} opts.signature - the signature header value
 * @returns {boolean} true when the webhook signature is valid
 */
exports.validateWebhook = ({ rawBody = '', signature = null } = {}) => {
    if (!process.env.CHAPA_WEBHOOK_SECRET) {
        const error = new Error('CHAPA_WEBHOOK_SECRET is not configured');
        error.statusCode = 500;
        throw error;
    }
    if (!signature) return false;

    const crypto = require('crypto');
    const body = Buffer.isBuffer(rawBody) ? rawBody.toString() : String(rawBody || '');
    const expected = crypto
        .createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

    const provided = String(signature).replace(/^sha256=|^hmac\s+/i, '');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(provided, 'hex');

    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
};
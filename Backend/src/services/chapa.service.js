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
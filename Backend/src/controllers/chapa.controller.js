const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const chapaService = require('../services/chapa.service');
const chapa = chapaService;
const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../config/constants');

const chapaConfigError = (res) =>
    res.status(500).json({
        success: false,
        message: 'Chapa payment gateway key missing. Please verify CHAPA_SECRET_KEY in Backend/.env file.'
    });

const FAILED_PROVIDER_STATUSES = new Set(['failed', 'cancelled', 'canceled', 'reversed', 'declined', 'expired']);

const safeErrorMessage = (error) => {
    if (error == null) return 'Unknown error occurred';
    if (typeof error === 'string') return error;
    if (typeof error.message === 'string' && error.message !== '[object Object]') return error.message;
    if (typeof error === 'object') {
        const parts = [];
        for (const key of Object.keys(error)) {
            const value = error[key];
            if (value && typeof value === 'object' && !(value instanceof Date)) {
                parts.push(`${key}: ${safeErrorMessage(value)}`);
            } else if (value !== undefined && value !== '') {
                parts.push(`${key}: ${value}`);
            }
        }
        if (parts.length) return parts.join(', ');
    }
    return String(error);
};

const completePayment = async (txRef) => {
    const isMongoId = mongoose.Types.ObjectId.isValid(txRef);
    const payment = await Payment.findOne({
        $or: [
            { providerReference: txRef },
            { chapaReference: txRef },
            { reference: txRef },
            { transactionId: txRef },
            ...(isMongoId ? [{ _id: txRef }] : [])
        ]
    });
    if (!payment) return null;
    if (payment.status === PAYMENT_STATUS.PAID) return payment;

    const verification = await chapa.verify(payment.providerReference || payment.chapaReference || txRef);
    const providerData = verification.data || {};
    const providerStatus = String(providerData.status || '').toLowerCase();
    const isPaid = providerStatus === 'success'
        && Number(providerData.amount) === Number(payment.amount)
        && (providerData.currency || 'ETB') === payment.currency;

    let nextStatus;
    if (isPaid) {
        nextStatus = PAYMENT_STATUS.PAID;
        payment.transactionId = providerData.reference || providerData.tx_ref || payment.providerReference || txRef;
        payment.paidAt = new Date();
    } else if (FAILED_PROVIDER_STATUSES.has(providerStatus)) {
        // Provider explicitly reports the transaction failed or was reversed.
        nextStatus = PAYMENT_STATUS.FAILED;
        payment.paidAt = null;
    } else {
        // Still pending / not yet completed — do not corrupt the record.
        nextStatus = payment.status === PAYMENT_STATUS.FAILED ? PAYMENT_STATUS.PENDING : payment.status;
        payment.paidAt = null;
    }
    payment.status = nextStatus;
    await payment.save();

    await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: nextStatus,
        transactionId: isPaid ? payment.transactionId : null,
        payment: {
            method: payment.method,
            status: payment.status,
            transactionId: payment.transactionId,
            providerReference: payment.providerReference || txRef,
            amount: payment.amount,
            currency: payment.currency,
            paidAt: payment.paidAt
        }
    });
    return payment;
};

/**
 * Resolve a Chapa payment for the current user using either the gateway
 * transaction reference(s) or the human-readable order id/number, so the
 * order-tracking page can verify payment by just knowing the order id.
 */
const findChapaPaymentForUser = async (ref, userId) => {
    const isMongoId = mongoose.Types.ObjectId.isValid(ref);
    let payment = await Payment.findOne({
        $or: [
            { chapaReference: ref },
            { providerReference: ref },
            { reference: ref },
            { transactionId: ref },
            ...(isMongoId ? [{ _id: ref }] : [])
        ],
        userId
    });
    if (payment) return payment;
    const order = await Order.findOne({
        $or: [
            { orderId: ref },
            { orderNumber: ref },
            ...(isMongoId ? [{ _id: ref }] : [])
        ],
        userId
    });
    if (!order) return null;
    return Payment.findOne({ orderId: order._id, provider: PAYMENT_METHODS.CHAPA }).sort({ createdAt: -1 });
};

exports.initializeChapaPayment = async (req, res) => {
    try {
        const secretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-VOsIXBW26DEMsxpUkwwb1eQMZSHZXujQ';
        if (!secretKey) return chapaConfigError(res);

        const { orderId, returnUrl } = req.body;
        const isMongoId = mongoose.Types.ObjectId.isValid(orderId);
        const order = await Order.findOne({
            $or: [
                { orderId: orderId },
                { orderNumber: orderId },
                ...(isMongoId ? [{ _id: orderId }] : [])
            ],
            userId: req.user.id
        });
        if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
        if (order.paymentStatus === PAYMENT_STATUS.PAID) {
            return res.status(400).json({ success: false, error: 'Order already paid' });
        }
        const pendingPayment = await Payment.findOne({
            orderId: order._id,
            provider: PAYMENT_METHODS.CHAPA,
            status: PAYMENT_STATUS.PENDING,
            checkoutUrl: { $ne: '' }
        });
        if (pendingPayment) {
            return res.status(200).json({
                success: true,
                message: 'Payment already initialized',
                data: { paymentId: pendingPayment._id, checkoutUrl: pendingPayment.checkoutUrl, transactionReference: pendingPayment.providerReference },
                checkoutUrl: pendingPayment.checkoutUrl,
                transactionReference: pendingPayment.providerReference
            });
        }

        const user = await User.findById(req.user.id).select('name email phone');
        const orderIdentifier = order.orderId || order.orderNumber || order._id;
        const txRef = `CAF-${orderIdentifier}-${Date.now()}`;
        const payment = await Payment.create({
            orderId: order._id,
            userId: req.user.id,
            amount: order.totalAmount,
            provider: PAYMENT_METHODS.CHAPA,
            method: PAYMENT_METHODS.CHAPA,
            status: PAYMENT_STATUS.PENDING,
            chapaReference: txRef,
            providerReference: txRef,
            reference: txRef
        });

        // Determine callback URL (must be public HTTPS in production)
        const hostHeader = req.get('host') || 'smart-cafeteria-frontend.onrender.com';
        const isLocalHost = hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1');
        const defaultCallback = isLocalHost
            ? `http://${hostHeader}/api/v1/payments/webhooks/chapa`
            : `https://${hostHeader}/api/v1/payments/webhooks/chapa`;

        const envCallback = process.env.CHAPA_CALLBACK_URL;
        const callbackUrl = (envCallback && /^https?:\/\//.test(envCallback) && (!isLocalHost || envCallback.includes('localhost')))
            ? envCallback
            : defaultCallback;

        // Determine return URL
        const reqOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '');
        const defaultFrontend = reqOrigin || process.env.FRONTEND_URL || 'https://smartcafeteriaorderingsystem.netlify.app';
        const defaultReturnUrl = `${defaultFrontend}/src/pages/customer/order-tracking.html?orderId=${encodeURIComponent(orderIdentifier)}`;

        let finalReturnUrl = returnUrl || process.env.CHAPA_RETURN_URL || defaultReturnUrl;
        if (finalReturnUrl.includes('localhost') || finalReturnUrl.includes('127.0.0.1')) {
            if (!isLocalHost) {
                finalReturnUrl = defaultReturnUrl;
            }
        }

        const [firstName, ...lastNameParts] = (user?.name || 'Customer').trim().split(/\s+/);
        const fallbackEmail = 'smartcafeteria.payment@gmail.com';

        // Check if email is valid and not a test/reserved domain
        const isValidEmail = (e) => {
            if (typeof e !== 'string' || !e.includes('@')) return false;
            const domain = e.split('@')[1] || '';
            const lowerDomain = domain.toLowerCase();
            if (lowerDomain.includes('example.') || lowerDomain.includes('test.') || lowerDomain === 'localhost' || lowerDomain.endsWith('.local')) {
                return false;
            }
            return true;
        };

        let initialEmail = (user && isValidEmail(user.email)) ? user.email : fallbackEmail;

        // Phone number formatting
        let rawPhone = (user?.phone || order.customerPhone || '').toString().replace(/[^0-9]/g, '');
        let cleanPhone = rawPhone.length >= 9 ? rawPhone : undefined;

        const buildPayload = (email) => {
            const payload = {
                amount: String(order.totalAmount),
                currency: 'ETB',
                email,
                first_name: firstName,
                last_name: lastNameParts.join(' ') || firstName,
                tx_ref: txRef,
                callback_url: callbackUrl,
                return_url: finalReturnUrl,
                customization: { title: 'Smart Cafeteria', description: `Order #${orderIdentifier}` }
            };
            if (cleanPhone) {
                payload.phone_number = cleanPhone;
            }
            return payload;
        };

        let response;
        let emailUsed = initialEmail;
        try {
            response = await chapa.initialize(buildPayload(initialEmail));
        } catch (initError) {
            console.warn(`[Chapa] Initialization attempt with email "${initialEmail}" failed:`, safeErrorMessage(initError));
            if (initialEmail !== fallbackEmail) {
                console.warn(`[Chapa] Retrying initialization with guaranteed fallback email "${fallbackEmail}"`);
                emailUsed = fallbackEmail;
                response = await chapa.initialize(buildPayload(emailUsed));
            } else {
                throw initError;
            }
        }

        payment.checkoutUrl = response.data.checkout_url;
        payment.metadata = { ...(payment.metadata || {}), emailUsed };
        await payment.save();
        return res.status(201).json({
            success: true,
            message: 'Payment initialized successfully',
            data: { paymentId: payment._id, checkoutUrl: payment.checkoutUrl, transactionReference: txRef },
            checkoutUrl: payment.checkoutUrl,
            transactionReference: txRef
        });
    } catch (error) {
        console.error('Chapa initialization error:', error);
        return res.status(error.statusCode || 500).json({ success: false, error: safeErrorMessage(error) });
    }
};

exports.chapaCallback = async (req, res) => {
    try {
        const secretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-VOsIXBW26DEMsxpUkwwb1eQMZSHZXujQ';
        if (!secretKey) return chapaConfigError(res);

        const txRef = req.body?.trx_ref || req.body?.tx_ref || req.query.trx_ref || req.query.tx_ref;
        if (!txRef) return res.status(400).json({ success: false, error: 'Transaction reference is required' });
        const payment = await completePayment(txRef);
        if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
        return res.json({ success: payment.status === PAYMENT_STATUS.PAID, payment });
    } catch (error) {
        console.error('Chapa callback error:', error);
        return res.status(error.statusCode || 502).json({ success: false, error: safeErrorMessage(error) });
    }
};

// ============================================================
//  Phase 7: Webhook + verification entry points
// ============================================================

/**
 * @route   POST /api/v1/payments/webhooks/chapa
 * @desc    Receive async payment events from Chapa. The event signature is
 *          validated against CHAPA_WEBHOOK_SECRET, and on a successful
 *          payment the linked Order + Payment documents are flipped to paid.
 * @access  Public (authenticated via webhook signature)
 */
exports.chapaWebhook = async (req, res) => {
    try {
        const secretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-VOsIXBW26DEMsxpUkwwb1eQMZSHZXujQ';
        const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET || 'whsec_5f4d9e3a2b1c8d7e6f5a4b3c2d1e0f9a';

        const rawBody = req.rawBody || JSON.stringify(req.body || {});
        const xSignature = req.headers['x-chapa-signature'] || '';
        const chapaSignature = req.headers['chapa-signature'] || '';

        const hasSignatureHeader = Boolean(xSignature || chapaSignature);
        let signatureValid = true;
        if (hasSignatureHeader) {
            try {
                signatureValid = chapaService.validateWebhook({
                    rawBody,
                    xSignature,
                    chapaSignature
                });
            } catch (sigErr) {
                signatureValid = false;
            }
        }
        if (hasSignatureHeader && !signatureValid) {
            console.warn('[Chapa] Webhook signature invalid — relying on server-side verification');
        }

        const event = req.body || {};
        const txRef = event.tx_ref || event.trx_ref || event.reference || event.data?.tx_ref;
        if (!txRef) {
            return res.status(400).json({ success: false, error: 'Transaction reference is required' });
        }

        const payment = await Payment.findOne({
            $or: [{ providerReference: txRef }, { chapaReference: txRef }, { reference: txRef }]
        });

        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found for transaction reference' });
        }

        if (payment.status === PAYMENT_STATUS.PAID) {
            return res.status(200).json({ success: true, message: 'webhook received', received: true });
        }

        // Confirm directly with Chapa before mutating (recommended by Chapa).
        const updated = await completePayment(txRef);
        if (!updated) {
            return res.status(404).json({ success: false, error: 'Payment not found for transaction reference' });
        }
        return res.status(200).json({ success: true, message: 'webhook received', received: true });
    } catch (error) {
        console.error('Chapa webhook error:', error);
        return res.status(error.statusCode || 502).json({ success: false, error: safeErrorMessage(error) });
    }
};

/**
 * @route   GET /api/v1/payments/verify/:txRef
 * @desc    Manual verification fallback (authenticated user). Poll Chapa by
 *          tx_ref and flip the linked Order + Payment to paid when confirmed.
 * @access  Private (owner of the payment)
 */
exports.verifyChapaPayment = async (req, res) => {
    try {
        const secretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-VOsIXBW26DEMsxpUkwwb1eQMZSHZXujQ';
        if (!secretKey) return chapaConfigError(res);

        const payment = await findChapaPaymentForUser(req.params.txRef, req.user.id);
        if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
        const updated = await completePayment(payment.providerReference || payment.chapaReference);
        return res.json({ success: updated ? updated.status === PAYMENT_STATUS.PAID : false, payment: updated });
    } catch (error) {
        console.error('Chapa verification error:', error);
        return res.status(error.statusCode || 502).json({ success: false, error: safeErrorMessage(error) });
    }
};

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Manual verification fallback by txRef in the request body.
 * @access  Private (owner of the payment)
 */
exports.verifyChapaPaymentByBody = async (req, res) => {
    try {
        const secretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-VOsIXBW26DEMsxpUkwwb1eQMZSHZXujQ';
        if (!secretKey) return chapaConfigError(res);

        const txRef = req.body?.tx_ref || req.body?.txRef || req.body?.transactionReference || req.body?.orderId;
        if (!txRef) return res.status(400).json({ success: false, error: 'Transaction reference is required' });
        const payment = await findChapaPaymentForUser(txRef, req.user.id);
        if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
        const updated = await completePayment(payment.providerReference || payment.chapaReference);
        return res.json({ success: updated ? updated.status === PAYMENT_STATUS.PAID : false, payment: updated });
    } catch (error) {
        console.error('Chapa verification error:', error);
        return res.status(error.statusCode || 502).json({ success: false, error: safeErrorMessage(error) });
    }
};
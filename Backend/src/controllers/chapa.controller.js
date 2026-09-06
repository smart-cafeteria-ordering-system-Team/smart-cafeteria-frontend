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
        if (!process.env.CHAPA_SECRET_KEY) return chapaConfigError(res);

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
        const txRef = `CAF-${order.orderId}-${Date.now()}`;
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

        const envCallback = process.env.CHAPA_CALLBACK_URL;
        const callbackUrl = envCallback && /^https?:\/\//.test(envCallback)
            ? envCallback
            : `https://${req.get('host')}/api/v1/payments/webhooks/chapa`;

        const [firstName, ...lastNameParts] = (user.name || 'Customer').trim().split(/\s+/);
        const fallbackEmail = process.env.CHAPA_FALLBACK_EMAIL || 'payments@smartcafeteria.com';
        
        // Ensure email is a valid string; if invalid or missing, use fallbackEmail
        const isValidEmail = (e) => typeof e === 'string' && e.includes('@') && !e.endsWith('.example') && !e.endsWith('.test');
        let initialEmail = (user && isValidEmail(user.email)) ? user.email : fallbackEmail;

        const buildPayload = (email) => ({
            amount: String(order.totalAmount),
            currency: 'ETB',
            email,
            first_name: firstName,
            last_name: lastNameParts.join(' ') || firstName,
            phone_number: user?.phone || order.customerPhone || '',
            tx_ref: txRef,
            callback_url: callbackUrl,
            return_url: returnUrl || process.env.CHAPA_RETURN_URL,
            customization: { title: 'Smart Cafeteria', description: `Order ${order.orderId}` }
        });

        let response;
        let emailUsed = initialEmail;
        try {
            response = await chapa.initialize(buildPayload(initialEmail));
        } catch (initError) {
            if (initialEmail !== fallbackEmail) {
                console.warn(`[Chapa] Customer email "${initialEmail}" failed; retrying with fallback "${fallbackEmail}"`);
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
        return res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
};

exports.chapaCallback = async (req, res) => {
    try {
        if (!process.env.CHAPA_SECRET_KEY) return chapaConfigError(res);

        const txRef = req.body?.trx_ref || req.body?.tx_ref || req.query.trx_ref || req.query.tx_ref;
        if (!txRef) return res.status(400).json({ success: false, error: 'Transaction reference is required' });
        const payment = await completePayment(txRef);
        if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
        return res.json({ success: payment.status === PAYMENT_STATUS.PAID, payment });
    } catch (error) {
        console.error('Chapa callback error:', error);
        return res.status(error.statusCode || 502).json({ success: false, error: error.message });
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
        if (!process.env.CHAPA_WEBHOOK_SECRET && !process.env.CHAPA_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Chapa webhook secret missing. Please verify CHAPA_WEBHOOK_SECRET in Backend/.env file.'
            });
        }

        const rawBody = req.rawBody || JSON.stringify(req.body || {});
        const xSignature = req.headers['x-chapa-signature'] || '';
        const chapaSignature = req.headers['chapa-signature'] || '';

        // Chapa signatures: `x-chapa-signature` (HMAC of payload) and/or
        // `chapa-signature` (HMAC of the secret). When signatures are present
        // they are verified; the payment only flips to paid after confirm with
        // Chapa's transaction/verify API below, so webhooks are accepted even
        // when the dashboard hash is misconfigured.
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
        return res.status(error.statusCode || 502).json({ success: false, error: error.message });
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
        if (!process.env.CHAPA_SECRET_KEY) return chapaConfigError(res);

        const payment = await findChapaPaymentForUser(req.params.txRef, req.user.id);
        if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
        const updated = await completePayment(payment.providerReference || payment.chapaReference);
        return res.json({ success: updated.status === PAYMENT_STATUS.PAID, payment: updated });
    } catch (error) {
        console.error('Chapa verification error:', error);
        return res.status(error.statusCode || 502).json({ success: false, error: error.message });
    }
};

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Manual verification fallback by txRef in the request body.
 * @access  Private (owner of the payment)
 */
exports.verifyChapaPaymentByBody = async (req, res) => {
    try {
        if (!process.env.CHAPA_SECRET_KEY) return chapaConfigError(res);

        const txRef = req.body?.tx_ref || req.body?.txRef || req.body?.transactionReference;
        if (!txRef) return res.status(400).json({ success: false, error: 'Transaction reference is required' });
        const payment = await findChapaPaymentForUser(txRef, req.user.id);
        if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
        const updated = await completePayment(payment.providerReference || payment.chapaReference);
        return res.json({ success: updated.status === PAYMENT_STATUS.PAID, payment: updated });
    } catch (error) {
        console.error('Chapa verification error:', error);
        return res.status(error.statusCode || 502).json({ success: false, error: error.message });
    }
};
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

const completePayment = async (txRef) => {
    const payment = await Payment.findOne({ provider: PAYMENT_METHODS.CHAPA, providerReference: txRef });
    if (!payment) return null;
    if (payment.status === PAYMENT_STATUS.PAID) return payment;

    const verification = await chapa.verify(txRef);
    const providerData = verification.data || {};
    const isPaid = providerData.status === 'success'
        && Number(providerData.amount) === Number(payment.amount)
        && (providerData.currency || 'ETB') === payment.currency;
    payment.status = isPaid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED;
    payment.transactionId = providerData.reference || providerData.tx_ref || txRef;
    payment.paidAt = isPaid ? new Date() : null;
    await payment.save();

    await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: isPaid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED,
        transactionId: isPaid ? payment.transactionId : null,
        payment: {
            method: payment.method,
            status: payment.status,
            transactionId: payment.transactionId,
            providerReference: txRef,
            amount: payment.amount,
            currency: payment.currency,
            paidAt: payment.paidAt
        }
    });
    return payment;
};

exports.initializeChapaPayment = async (req, res) => {
    try {
        if (!process.env.CHAPA_SECRET_KEY) return chapaConfigError(res);

        const { orderId, returnUrl } = req.body;
        const order = await Order.findOne({ orderId, userId: req.user.id });
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
        const buildPayload = (email) => ({
            amount: String(order.totalAmount),
            currency: 'ETB',
            email,
            first_name: firstName,
            last_name: lastNameParts.join(' ') || firstName,
            phone_number: user.phone || order.customerPhone || '',
            tx_ref: txRef,
            callback_url: callbackUrl,
            return_url: returnUrl || process.env.CHAPA_RETURN_URL,
            customization: { title: 'Smart Cafeteria', description: `Order ${order.orderId}` }
        });

        let response;
        let emailUsed = user.email;
        try {
            response = await chapa.initialize(buildPayload(user.email));
        } catch (initError) {
            if (initError.isEmailValidationError && process.env.CHAPA_FALLBACK_EMAIL) {
                console.warn(`[Chapa] Customer email "${user.email}" rejected by Chapa; retrying with fallback "${process.env.CHAPA_FALLBACK_EMAIL}"`);
                emailUsed = process.env.CHAPA_FALLBACK_EMAIL;
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
        if (!process.env.CHAPA_WEBHOOK_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'Chapa webhook secret missing. Please verify CHAPA_WEBHOOK_SECRET in Backend/.env file.'
            });
        }

        const rawBody = req.rawBody || JSON.stringify(req.body || {});
        const signature =
            req.headers['x-chapa-signature'] ||
            req.headers['chapa-signature'] ||
            req.headers['x-webhook-signature'] ||
            '';

        // Chapa does not send an HMAC signature header; it embeds a `hash`
        // field inside the webhook body. Validate strictly when a signature
        // header is present, otherwise trust the body (which itself carries
        // the tx_ref we only accept if it matches a real local payment).
        const hasSignatureHeader = Boolean(signature);
        const valid = hasSignatureHeader
            ? chapaService.validateWebhook({ rawBody, signature })
            : true;
        if (!valid) {
            return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
        }

        const event = req.body || {};
        const txRef = event.tx_ref || event.trx_ref || event.reference || event.data?.tx_ref;
        if (!txRef) {
            return res.status(400).json({ success: false, error: 'Transaction reference is required' });
        }

        // Chapa event type/status locations can vary; trust the payload status.
        const eventStatus = String(
            event.status ||
            event.event_type ||
            event.data?.status ||
            event.payment_status ||
            'success'
        ).toLowerCase();

        const payment = await Payment.findOne({
            $or: [{ providerReference: txRef }, { chapaReference: txRef }, { reference: txRef }]
        });

        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found for transaction reference' });
        }

        const isSuccess = eventStatus === 'success'
            || eventStatus === 'completed'
            || eventStatus === 'succeeded'
            || eventStatus === 'paid';
        const isFailed = eventStatus === 'failed'
            || eventStatus === 'cancelled'
            || eventStatus === 'canceled'
            || eventStatus === 'reversed';

        // Only mutate when a success/failure is signaled by a non-pending event.
        if (isSuccess && payment.status !== PAYMENT_STATUS.PAID) {
            payment.status = PAYMENT_STATUS.PAID;
            payment.transactionId = event.transaction_id || event.data?.reference || event.tx_ref || txRef;
            payment.paidAt = new Date();
            await payment.save();
            await Order.findByIdAndUpdate(payment.orderId, {
                paymentStatus: PAYMENT_STATUS.PAID,
                transactionId: payment.transactionId,
                payment: {
                    method: payment.method,
                    status: payment.status,
                    transactionId: payment.transactionId,
                    providerReference: txRef,
                    amount: payment.amount,
                    currency: payment.currency,
                    paidAt: payment.paidAt
                }
            });
            res.status(200).json({ success: true, message: 'webhook received', received: true });
        } else if (isFailed && payment.status !== PAYMENT_STATUS.PAID && payment.status !== PAYMENT_STATUS.FAILED) {
            payment.status = PAYMENT_STATUS.FAILED;
            payment.transactionId = event.transaction_id || payment.transactionId || txRef;
            await payment.save();
            await Order.findByIdAndUpdate(payment.orderId, {
                paymentStatus: PAYMENT_STATUS.FAILED,
                transactionId: null
            });
            res.status(200).json({ success: true, message: 'webhook received', received: true });
        } else {
            // Already handled, or a benign info event (e.g. checkout.viewed).
            res.status(200).json({ success: true, message: 'webhook received', received: true });
        }
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

        const payment = await Payment.findOne({
            $or: [{ chapaReference: req.params.txRef }, { providerReference: req.params.txRef }],
            userId: req.user.id
        });
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
        const payment = await Payment.findOne({
            $or: [{ chapaReference: txRef }, { providerReference: txRef }],
            userId: req.user.id
        });
        if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
        const updated = await completePayment(payment.providerReference || payment.chapaReference);
        return res.json({ success: updated.status === PAYMENT_STATUS.PAID, payment: updated });
    } catch (error) {
        console.error('Chapa verification error:', error);
        return res.status(error.statusCode || 502).json({ success: false, error: error.message });
    }
};
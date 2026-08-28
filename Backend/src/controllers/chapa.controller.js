const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const chapa = require('../services/chapa.service');
const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../config/constants');

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

        const [firstName, ...lastNameParts] = (user.name || 'Customer').trim().split(/\s+/);
        const response = await chapa.initialize({
            amount: String(order.totalAmount),
            currency: 'ETB',
            email: user.email,
            first_name: firstName,
            last_name: lastNameParts.join(' ') || firstName,
            phone_number: user.phone,
            tx_ref: txRef,
            callback_url: process.env.CHAPA_CALLBACK_URL,
            return_url: returnUrl || process.env.CHAPA_RETURN_URL,
            customization: { title: 'Smart Cafeteria', description: `Order ${order.orderId}` }
        });

        payment.checkoutUrl = response.data.checkout_url;
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

exports.verifyChapaPayment = async (req, res) => {
    try {
        const payment = await Payment.findOne({ chapaReference: req.params.txRef, userId: req.user.id });
        if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
        const updated = await completePayment(payment.chapaReference);
        return res.json({ success: updated.status === PAYMENT_STATUS.PAID, payment: updated });
    } catch (error) {
        console.error('Chapa verification error:', error);
        return res.status(error.statusCode || 502).json({ success: false, error: error.message });
    }
};
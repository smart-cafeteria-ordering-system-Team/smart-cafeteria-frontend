const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const telebirr = require('../services/telebirr.service');
const { PAYMENT_METHODS, PAYMENT_STATUS } = require('../config/constants');

exports.initializeTelebirrPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findOne({ orderId, userId: req.user.id });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.paymentStatus === PAYMENT_STATUS.PAID) {
            return res.status(400).json({ success: false, message: 'Order has already been paid.' });
        }
        const pendingPayment = await Payment.findOne({
            orderId: order._id,
            provider: PAYMENT_METHODS.TELEBIRR,
            status: PAYMENT_STATUS.PENDING,
            checkoutUrl: { $ne: '' }
        });
        if (pendingPayment) {
            return res.status(200).json({ success: true, message: 'Payment already initialized', data: { paymentId: pendingPayment._id, checkoutUrl: pendingPayment.checkoutUrl } });
        }
        const user = await User.findById(req.user.id).select('name email phone');
        const providerReference = `CAF-${order.orderId}-${Date.now()}`;
        const payment = await Payment.create({
            orderId: order._id,
            userId: req.user.id,
            provider: PAYMENT_METHODS.TELEBIRR,
            method: PAYMENT_METHODS.TELEBIRR,
            amount: order.totalAmount,
            currency: 'ETB',
            status: PAYMENT_STATUS.PENDING,
            providerReference,
            metadata: { name: user.name, email: user.email, phone: user.phone }
        });
        const providerResponse = await telebirr.initializePayment({
            amount: order.totalAmount,
            currency: 'ETB',
            providerReference,
            customer: user
        });
        payment.checkoutUrl = providerResponse.checkoutUrl || '';
        await payment.save();
        return res.status(201).json({ success: true, message: 'Payment initialized successfully', data: { paymentId: payment._id, checkoutUrl: payment.checkoutUrl } });
    } catch (error) {
        return res.status(error.statusCode || 502).json({ success: false, message: error.message });
    }
};

exports.telebirrCallback = async (req, res) => {
    const providerReference = req.body?.providerReference || req.body?.transactionId || req.query.providerReference;
    if (!providerReference) return res.status(400).json({ success: false, message: 'Provider reference is required' });
    const payment = await Payment.findOne({ provider: PAYMENT_METHODS.TELEBIRR, providerReference });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status === PAYMENT_STATUS.PAID) return res.json({ success: true, payment });
    const result = await telebirr.verifyPayment(providerReference);
    const providerStatus = result.data?.status || result.status;
    const providerAmount = result.data?.amount || result.amount;
    const providerCurrency = result.data?.currency || result.currency || 'ETB';
    const paid = providerStatus === 'success' && Number(providerAmount) === Number(payment.amount) && providerCurrency === payment.currency;
    payment.status = paid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED;
    payment.transactionId = result.transactionId || providerReference;
    payment.paidAt = paid ? new Date() : null;
    await payment.save();
    await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: payment.status, transactionId: paid ? payment.transactionId : null });
    return res.json({ success: paid, payment });
};
const chapa = require('./chapa.service');

const initializePayment = (payload) => chapa.initializeTelebirr(payload);
const verifyPayment = (reference) => chapa.verify(reference);

module.exports = { initializePayment, verifyPayment };
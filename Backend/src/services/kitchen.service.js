const Order = require("../models/Order");
const { ORDER_STATUS } = require("../utils/constants");
const { updateOrderStatus } = require("./order.service");

const getKitchenQueue = async () => {
    return await Order.find({
        status: {
            $in: [
                ORDER_STATUS.PENDING,
                ORDER_STATUS.PREPARING
            ]
        }
    }).sort({ createdAt: 1 });
};

const markOrderPreparing = async (orderId) => {
    return await updateOrderStatus(
        orderId,
        ORDER_STATUS.PREPARING
    );
};

const markOrderReady = async (orderId) => {
    return await updateOrderStatus(
        orderId,
        ORDER_STATUS.READY
    );
};
module.exports = { getKitchenQueue, markOrderPreparing, markOrderReady };

const express = require("express");
const router = express.Router();
const {
    placeOrder,
    getCustomerOrders,
    getVendorOrders,
    updateOrderStatus,
    cancelOrder
} = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/authMiddleware");

// 1. Customer Routes (customer aur vendor dono access kar sakte hain)
router.post("/", protect, authorize("customer", "vendor"), placeOrder);
router.get("/customer", protect, authorize("customer", "vendor"), getCustomerOrders);
router.put("/:id/cancel", protect, authorize("customer", "vendor"), cancelOrder);

// 2. Vendor Routes (Sirf vendor access kar sakta hai)
router.get("/vendor", protect, authorize("vendor"), getVendorOrders);
router.put("/:id/status", protect, authorize("vendor"), updateOrderStatus);

module.exports = router;

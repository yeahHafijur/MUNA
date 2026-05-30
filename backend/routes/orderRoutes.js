const express = require("express");
const router = express.Router();
const {
    placeOrder,
    getCustomerOrders,
    getVendorOrders,
    updateOrderStatus
} = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/authMiddleware");

// 1. Customer Routes (Sirf customer access kar sakta hai)
router.post("/", protect, authorize("customer"), placeOrder);
router.get("/customer", protect, authorize("customer"), getCustomerOrders);

// 2. Vendor Routes (Sirf vendor access kar sakta hai)
router.get("/vendor", protect, authorize("vendor"), getVendorOrders);
router.put("/:id/status", protect, authorize("vendor"), updateOrderStatus);

module.exports = router;

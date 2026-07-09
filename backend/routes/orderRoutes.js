const express = require("express");
const router = express.Router();
const {
    placeOrder,
    getCustomerOrders,
    getVendorOrders,
    updateOrderStatus,
    cancelOrder,
    getActiveOrder
} = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/active", protect, getActiveOrder);
router.post("/", protect, authorize("customer", "vendor"), placeOrder);
router.get("/customer", protect, authorize("customer", "vendor"), getCustomerOrders);
router.put("/:id/cancel", protect, authorize("customer", "vendor"), cancelOrder);

// 2. Vendor Routes (Sirf vendor access kar sakta hai)
router.get("/vendor", protect, authorize("vendor"), getVendorOrders);
router.put("/:id/status", protect, authorize("vendor"), updateOrderStatus);

// 3. Admin Routes (Super Admin)
const { getAllOrdersForAdmin } = require("../controllers/orderController");
router.get("/admin/all", protect, authorize("super_admin"), getAllOrdersForAdmin);

module.exports = router;

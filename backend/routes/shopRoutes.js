const express = require("express");
const router = express.Router();

const { getAllShops, getShopById, createShop, updateShop, getMyShop } = require("../controllers/shopController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getAllShops);
router.get("/my-shop", protect, authorize("vendor"), getMyShop);
router.get("/:id", getShopById);

router.post("/", protect, authorize("vendor", "super_admin"), createShop);
router.put("/:id", protect, authorize("vendor", "super_admin"), updateShop);

module.exports = router;
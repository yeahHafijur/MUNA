const express = require("express");
const router = express.Router();

const { getAllShops, getShopById, createShop, updateShop, getMyShop, calculateDelivery, updateShopImage } = require("../controllers/shopController");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", getAllShops);
router.get("/my-shop", protect, authorize("vendor"), getMyShop);
router.get("/:id", getShopById);
router.post("/:id/calculate-delivery", calculateDelivery);

router.post("/", protect, authorize("vendor", "super_admin"), createShop);
router.put("/:id", protect, authorize("vendor", "super_admin"), updateShop);
router.put("/:id/image", protect, authorize("vendor", "super_admin"), upload.single("image"), updateShopImage);

module.exports = router;
const express = require("express");
const router = express.Router();
const { addToWishlist, removeFromWishlist, getWishlist, getLocations, saveLocation, deleteLocation } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.get("/wishlist", protect, getWishlist);
router.post("/wishlist/:id", protect, addToWishlist);
router.delete("/wishlist/:id", protect, removeFromWishlist);

router.get("/locations", protect, getLocations);
router.post("/locations", protect, saveLocation);
router.delete("/locations/:id", protect, deleteLocation);

module.exports = router;

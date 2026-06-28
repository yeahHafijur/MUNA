const express = require("express");
const router = express.Router();
const { addToWishlist, removeFromWishlist, getWishlist } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.get("/wishlist", protect, getWishlist);
router.post("/wishlist/:id", protect, addToWishlist);
router.delete("/wishlist/:id", protect, removeFromWishlist);

module.exports = router;

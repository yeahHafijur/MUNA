const express = require("express");
const router = express.Router();
const { addToWishlist, removeFromWishlist } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/wishlist/:id", protect, addToWishlist);
router.delete("/wishlist/:id", protect, removeFromWishlist);

module.exports = router;

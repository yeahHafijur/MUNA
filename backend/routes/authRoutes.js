const express = require("express");
const router = express.Router();
const { sendOTP, verifyOTP, googleLogin, savePlayerId } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/google-login", googleLogin);
router.post("/save-player-id", protect, savePlayerId);

module.exports = router;
const express = require("express");
const router = express.Router();
const { sendOTP, verifyOTP, googleLogin } = require("../controllers/authController");

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/google-login", googleLogin);

module.exports = router;
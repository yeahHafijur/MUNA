const express = require("express");
const router = express.Router();
const { googleLogin, savePlayerId } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/google-login", googleLogin);
router.post("/save-player-id", protect, savePlayerId);

module.exports = router;
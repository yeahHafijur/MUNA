const express = require("express");
const router = express.Router();
const { googleLogin, savePlayerId, saveLocation, deleteLocation } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/google-login", googleLogin);
router.post("/save-player-id", protect, savePlayerId);
router.post("/save-location", protect, saveLocation);
router.delete("/delete-location/:id", protect, deleteLocation);

module.exports = router;
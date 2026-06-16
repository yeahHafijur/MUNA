const express = require("express");
const router = express.Router();
const { googleLogin, saveLocation, deleteLocation } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/google-login", googleLogin);
router.post("/save-location", protect, saveLocation);
router.delete("/delete-location/:id", protect, deleteLocation);

module.exports = router;
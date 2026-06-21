const express = require("express");
const router = express.Router();
const { googleLogin, saveLocation, deleteLocation, saveFcmToken, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/google-login", googleLogin);
router.post("/fcm-token", protect, saveFcmToken);
router.post("/save-location", protect, saveLocation);
router.delete("/delete-location/:id", protect, deleteLocation);
router.put("/update-profile", protect, updateProfile);

module.exports = router;
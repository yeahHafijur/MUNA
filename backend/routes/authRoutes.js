const express = require("express");
const router = express.Router();
const { googleLogin, logout, saveLocation, deleteLocation, saveFcmToken, updateProfile, deleteAccount } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/google-login", googleLogin);
router.post("/logout", logout);
router.post("/fcm-token", protect, saveFcmToken);
router.post("/save-location", protect, saveLocation);
router.delete("/delete-location/:id", protect, deleteLocation);
router.put("/update-profile", protect, updateProfile);
router.delete("/delete-account", protect, deleteAccount);

module.exports = router;
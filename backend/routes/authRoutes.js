const express = require("express");
const router = express.Router();
const { googleLogin, logout, saveLocation, deleteLocation, saveFcmToken, updateProfile, deleteAccount } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Soft-protect: tries to set req.user but never blocks the request
const optionalProtect = async (req, res, next) => {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers.authorization?.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");
        }
    } catch { /* token expired or invalid — that's fine for logout */ }
    next();
};

router.post("/google-login", googleLogin);
router.post("/logout", optionalProtect, logout);
router.post("/fcm-token", protect, saveFcmToken);
router.post("/save-location", protect, saveLocation);
router.delete("/delete-location/:id", protect, deleteLocation);
router.put("/update-profile", protect, updateProfile);
router.delete("/delete-account", protect, deleteAccount);

module.exports = router;
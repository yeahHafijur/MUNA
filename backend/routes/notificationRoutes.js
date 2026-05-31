const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Endpoint for saving a web push subscription
router.post('/subscribe', protect, async (req, res) => {
    try {
        const subscription = req.body;
        
        // Find user and update pushSubscription
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.pushSubscription = subscription;
        await user.save();

        res.status(201).json({ message: "Subscription saved successfully." });
    } catch (error) {
        console.error("Error saving subscription:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;

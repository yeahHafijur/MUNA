const jwt = require("jsonwebtoken");
const User = require('../models/User');

// Temporary in-memory store for OTPs { phone: { otp, expiresAt } }
const otpStore = new Map();

// Generate Token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

const sendOTP = async (req, res) => {
    const { phone } = req.body;

    if (!phone || phone.length < 10) {
        return res.status(400).json({ message: "Please enter a valid 10-digit phone number" });
    }

    // Generate random 6-digit OTP
    let otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send real SMS if FAST2SMS_API_KEY is available and it's not the admin test number
    if (process.env.FAST2SMS_API_KEY && phone !== "9999999999") {
        try {
            const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&flash=0&numbers=${phone}`;
            const response = await fetch(url);
            const smsData = await response.json();
            
            if (!smsData.return) {
                return res.status(500).json({ message: "Failed to send SMS: " + smsData.message });
            }
        } catch (err) {
            console.error("Fast2SMS Error:", err);
            return res.status(500).json({ message: "SMS Gateway server error" });
        }
    } else {
        // Fallback for testing without API key or for admin number
        otp = "123456";
        console.log(`[Mock SMS] OTP for ${phone} is: ${otp}`);
    }

    // Check if user exists
    const userExists = await User.findOne({ phone });

    // Store OTP with 5 mins expiry
    otpStore.set(phone, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
    });

    res.status(200).json({ 
        message: "OTP sent successfully",
        isNewUser: !userExists
    });
};

const verifyOTP = async (req, res) => {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ message: "Phone number and OTP are required" });
    }

    const storedData = otpStore.get(phone);

    if (!storedData) {
        return res.status(400).json({ message: "OTP expired or not requested" });
    }

    if (Date.now() > storedData.expiresAt) {
        otpStore.delete(phone);
        return res.status(400).json({ message: "OTP has expired" });
    }

    if (storedData.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP matches, delete it
    otpStore.delete(phone);

    // Check if user exists
    let user = await User.findOne({ phone });

    if (!user) {
        // If it's a new user, create them
        user = await User.create({
            name: name || "New User",
            phone: phone,
            role: "customer"
        });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
        message: "Login successful!",
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        savedLocations: user.savedLocations,
        token: token
    });
};

// Google Sign-In: Verify Google credential token and login/register user
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ message: "Google credential is required" });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload) {
            return res.status(401).json({ message: "Invalid Google token" });
        }

        const { email, name, picture, sub: googleId } = payload;

        if (!email) {
            return res.status(400).json({ message: "No email address found in Google account" });
        }

        // Check if user already exists with this email
        let user = await User.findOne({ email });

        if (!user) {
            // Create new user from Google info
            user = await User.create({
                name: name || "Google User",
                email: email,
                googleId: googleId,
                profilePic: picture,
                role: "customer"
            });
            console.log(`[Google Auth] New user registered: ${email}`);
        } else {
            // Update existing user with Google info if missing
            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (picture && !user.profilePic) {
                user.profilePic = picture;
            }
            await user.save();
        }

        const token = generateToken(user._id, user.role);

        res.status(200).json({
            message: "Login successful!",
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            profilePic: user.profilePic,
            savedLocations: user.savedLocations,
            token: token
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ message: "Google login failed: " + (error.message || error.toString()), stack: error.stack });
    }
};

// Removed savePlayerId logic
// Save a new location for the user
const saveLocation = async (req, res) => {
    try {
        const { name, lat, lng, address } = req.body;
        
        if (!name || !lat || !lng) {
            return res.status(400).json({ message: "Name, latitude, and longitude are required" });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.savedLocations.push({ name, lat, lng, address });
        await user.save();

        res.status(200).json({ message: "Location saved successfully", savedLocations: user.savedLocations });
    } catch (error) {
        console.error("[SaveLocation] Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a saved location
const deleteLocation = async (req, res) => {
    try {
        const { id } = req.params; // This will be the index or _id of the location
        
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Remove by sub-document id
        user.savedLocations = user.savedLocations.filter(loc => loc._id.toString() !== id);
        await user.save();

        res.status(200).json({ message: "Location deleted successfully", savedLocations: user.savedLocations });
    } catch (error) {
        console.error("[DeleteLocation] Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Save FCM token for push notifications
const saveFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) {
            return res.status(400).json({ message: "FCM token is required" });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.fcmTokens) {
            user.fcmTokens = [];
        }

        // Add token if not already present
        if (!user.fcmTokens.includes(fcmToken)) {
            // Keep only the latest 5 tokens to prevent unbounded growth
            if (user.fcmTokens.length >= 5) {
                user.fcmTokens.shift();
            }
            user.fcmTokens.push(fcmToken);
            await user.save();
        }

        res.status(200).json({ message: "FCM token saved successfully" });
    } catch (error) {
        console.error("[SaveFcmToken] Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update user profile (Name & Phone)
const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Name is required" });
        }
        
        if (!phone || !phone.trim() || phone.length < 10) {
            return res.status(400).json({ message: "Valid phone number is required" });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.name = name.trim();
        user.phone = phone.trim();
        
        await user.save();

        res.status(200).json({ 
            message: "Profile updated successfully", 
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profilePic: user.profilePic,
                savedLocations: user.savedLocations
            }
        });
    } catch (error) {
        console.error("[UpdateProfile] Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete User Account
const deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // If user is a vendor or admin, block deletion for safety (require manual intervention)
        if (user.role === 'super_admin') {
            return res.status(403).json({ message: "Super admin cannot be deleted" });
        }
        if (user.role === 'vendor') {
            return res.status(403).json({ message: "Vendors must contact support to delete their account and shop." });
        }

        await user.deleteOne();
        res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("[DeleteAccount] Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    sendOTP,
    verifyOTP,
    googleLogin,
    saveLocation,
    deleteLocation,
    saveFcmToken,
    updateProfile
};

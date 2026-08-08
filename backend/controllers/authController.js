const jwt = require("jsonwebtoken");
const User = require('../models/User');



// Generate Token
const generateToken = (id, role, tokenVersion) => {
    return jwt.sign({ id, role, tv: tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: '7d',
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

        const token = generateToken(user._id, user.role, user.tokenVersion);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', // Use strict to prevent CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

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
        res.status(500).json({ message: "Google login failed. Please try again." });
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

// Update user profile (Name & Email)
const updateProfile = async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Name is required" });
        }
        
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (email && email.trim() !== user.email) {
            const trimmedEmail = email.trim();
            const existing = await User.findOne({ email: trimmedEmail });
            if (existing && existing._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: "This email is already registered" });
            }
            user.email = trimmedEmail;
        }

        if (phone && phone.trim() !== user.phone) {
            const trimmedPhone = phone.trim();
            const existing = await User.findOne({ phone: trimmedPhone });
            if (existing && existing._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: "This phone number is already registered" });
            }
            user.phone = trimmedPhone;
        }

        user.name = name.trim();
        
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

        // Revoke any outstanding JWTs before deleting the account
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();
        await user.deleteOne();
        res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("[DeleteAccount] Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id; 
        const productId = req.params.id;

        await User.findByIdAndUpdate(userId, {
            $addToSet: { wishlist: productId }
        });

        res.status(200).json({ message: 'Added to wishlist' });
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const productId = req.params.id;

        await User.findByIdAndUpdate(userId, {
            $pull: { wishlist: productId }
        });

        res.status(200).json({ message: 'Removed from wishlist' });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const user = await User.findById(userId).populate({
            path: 'wishlist',
            populate: { path: 'category' } // Just in case we need category details
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user.wishlist);
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        res.status(500).json({ message: 'Server error fetching wishlist' });
    }
};

const logout = async (req, res) => {
    try {
        // Best-effort FCM token cleanup (req.user may be available if token is valid)
        const { fcmToken } = req.body || {};
        if (req.user) {
            if (fcmToken) {
                const { removeFcmToken } = require('../utils/notificationService');
                await removeFcmToken(req.user._id, fcmToken);
            }
            // Revoke this session's token so it can't be replayed if stolen
            await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
        }

        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0),
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error("Logout Error:", error);
        // Still clear the cookie even if FCM cleanup fails
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0),
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.status(200).json({ message: 'Logged out successfully' });
    }
};

const getLocations = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user.savedLocations || []);
    } catch (error) {
        console.error("Error fetching locations:", error);
        res.status(500).json({ message: 'Server error fetching locations' });
    }
};

module.exports = {
    googleLogin,
    logout,
    saveLocation,
    deleteLocation,
    getLocations,
    saveFcmToken,
    updateProfile,
    deleteAccount,
    addToWishlist,
    removeFromWishlist,
    getWishlist
};

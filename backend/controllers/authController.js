const jwt = require("jsonwebtoken");
const User = require('../models/User');

// Temporary in-memory store for OTPs { phone: { otp, expiresAt } }
const otpStore = new Map();

// Generate Token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
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
                return res.status(500).json({ message: "SMS bhejne me dikkat aayi: " + smsData.message });
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
        token: token
    });
};

module.exports = { sendOTP, verifyOTP };

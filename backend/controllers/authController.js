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

    // Generate a fixed OTP for testing purposes
    const otp = "123456";

    // Check if user exists
    const userExists = await User.findOne({ phone });

    // Store OTP with 5 mins expiry
    otpStore.set(phone, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
    });

    console.log(`[Mock SMS] OTP for ${phone} is: ${otp}`);

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

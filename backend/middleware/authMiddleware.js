const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 1. Protect Logic: Token verify karna
const protect = async (req, res, next) => {
    let token = req.cookies?.token;

    // Fallback for mobile app or postman if needed
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (token && token !== "null" && token !== "undefined") {
        try {

            // JWT Secret se token ko verify karte hain
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Token me user ki ID hoti hai, usse hum database se user nikal kar request me save kar rahe hain
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({ message: "Not authorized, user not found" });
            }

            // Agar sab theek hai toh agle step (controller) par jane do
            next();
        } catch (error) {
            console.error("Token verification error:", error);
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};

// 2. Authorize Logic: User ka role check karna
const authorize = (...roles) => {
    return (req, res, next) => {
        // Agar request me user nahi hai ya uska role allowed roles me nahi hai
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: You don't have permission to access this" });
        }
        // Agar role allowed hai toh aage jane do
        next();
    };
};

module.exports = { protect, authorize };

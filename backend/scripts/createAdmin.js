const mongoose = require("mongoose");
const User = require("../models/User");
const dotenv = require('dotenv');

dotenv.config();

// MongoDB URI
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/muna"; // Replace with your actual URI if different

const createSuperAdmin = async () => {
    try {
        console.log("🔗 Connecting to Database...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Database Connected!");

        // Master admin details
        const name = "Super Admin";
        const phone = "9999999999"; // Default phone for admin
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ phone });
        if (existingAdmin) {
            console.log("⚠️ Master Admin pehle se bana hua hai.");
            process.exit(0);
        }

        // Create the user
        const newAdmin = await User.create({
            name,
            phone,
            role: "super_admin"
        });

        console.log("🎉 Master Admin ban gaya!");
        console.log("-----------------------------------------");
        console.log(`Phone: ${phone}`);
        console.log(`OTP (Mock): 123456`);
        console.log("-----------------------------------------");
        console.log("Ab aap frontend se login kar sakte hain.");

        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

createSuperAdmin();

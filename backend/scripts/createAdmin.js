const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// MongoDB URI
const MONGO_URI = "mongodb://127.0.0.1:27017/muna"; // Replace with your actual URI if different

const createSuperAdmin = async () => {
    try {
        console.log("🔗 Connecting to Database...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Database Connected!");

        // Master admin details
        const name = "Super Admin";
        const email = "admin@muna.com";
        const password = "admin";
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            console.log("⚠️ Master Admin pehle se bana hua hai.");
            process.exit(0);
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the user
        const newAdmin = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "super_admin"
        });

        console.log("🎉 Master Admin ban gaya!");
        console.log("-----------------------------------------");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log("-----------------------------------------");
        console.log("Ab aap 'npm start' karke frontend se login kar sakte hain.");

        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

createSuperAdmin();

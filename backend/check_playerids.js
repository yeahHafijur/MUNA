// Debug script: Check if any user has onesignalPlayerId saved
const mongoose = require('mongoose');
require('dotenv').config();

// Use the production MONGO_URI from Render
const MONGO_URI = process.env.MONGO_URI_PROD || process.env.MONGO_URI;

async function checkPlayerIds() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB:", MONGO_URI);

        const User = require('./models/User');
        
        // Find all users
        const allUsers = await User.find({}, 'name phone email role onesignalPlayerId');
        
        console.log("\n=== ALL USERS ===");
        allUsers.forEach(u => {
            console.log(`- ${u.name} | Role: ${u.role} | Phone: ${u.phone || 'N/A'} | PlayerID: ${u.onesignalPlayerId || '❌ NOT SET'}`);
        });

        const usersWithId = allUsers.filter(u => u.onesignalPlayerId);
        console.log(`\n✅ Users with OneSignal Player ID: ${usersWithId.length}/${allUsers.length}`);
        
        if (usersWithId.length === 0) {
            console.log("⚠️  NO user has a Player ID saved! The frontend sync is not working.");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

checkPlayerIds();

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10);
        console.log("Recent Users (Last 10):");
        recentUsers.forEach(u => {
            console.log(`- ${u.name} | Role: ${u.role} | Email: ${u.email} | Phone: ${u.phone} | CreatedAt: ${u.createdAt}`);
        });
        
        process.exit();
    });

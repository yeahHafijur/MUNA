const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect("mongodb+srv://yhz01012004_db_user:xJaSdREG247oyMCJ@munacluster.dmjrufn.mongodb.net/muna?retryWrites=true&w=majority")
    .then(async () => {
        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10);
        console.log("Recent Users (Last 10):");
        recentUsers.forEach(u => {
            console.log(`- ${u.name} | Role: ${u.role} | Email: ${u.email} | Phone: ${u.phone} | CreatedAt: ${u.createdAt}`);
        });
        
        process.exit();
    });

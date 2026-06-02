require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const vendors = await User.find({ role: 'vendor' }).sort({ createdAt: -1 }).limit(5);
        console.log("Recent Vendors:");
        vendors.forEach(v => {
            console.log(`- ${v.name}: Phone: ${v.phone}, Email: ${v.email || 'MISSING'}`);
        });
        
        // Let's also check customers
        const customers = await User.find({ role: 'customer' }).sort({ createdAt: -1 }).limit(5);
        console.log("\nRecent Customers:");
        customers.forEach(c => {
            console.log(`- ${c.name}: Phone: ${c.phone}, Email: ${c.email}`);
        });

        process.exit();
    });

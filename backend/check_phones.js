require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const customers = await User.find({ role: 'customer' }).sort({ createdAt: -1 }).limit(5);
        console.log("Recent Customers:");
        customers.forEach(c => {
            console.log(`- ${c.name}: Phone: ${c.phone}, Email: ${c.email}`);
        });

        process.exit();
    });

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('customerId', 'name phone email');
        console.log("Recent Orders:");
        recentOrders.forEach(o => {
            console.log(`Order ID: ${o._id}`);
            console.log(`Customer: ${o.customerId?.name} | Phone: ${o.customerId?.phone} | Email: ${o.customerId?.email}`);
            console.log('---');
        });
        
        process.exit();
    });

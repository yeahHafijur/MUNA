const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');

mongoose.connect("mongodb+srv://yhz01012004_db_user:xJaSdREG247oyMCJ@munacluster.dmjrufn.mongodb.net/muna?retryWrites=true&w=majority")
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

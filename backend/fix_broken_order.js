require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        // Update the broken order to point to the vendor's actual account ID
        const order = await Order.findById('6a1ee7379a6468055a63a335');
        if (order) {
            order.customerId = '6a1ee5de9a6468055a63a332'; // Rahmatullah Talukdar (Vendor)
            await order.save();
            console.log("Fixed broken order customer reference.");
        }
        process.exit();
    });

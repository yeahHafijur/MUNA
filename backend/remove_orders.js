require('dotenv').config();
const mongoose = require('mongoose');
const Shop = require('./models/Shop');
const Order = require('./models/Order');

async function removePendingOrders() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const shop = await Shop.findOne({ name: "Asha's Eco Decor" });
        if (!shop) {
            console.log("Shop not found");
            process.exit(0);
        }

        console.log(`Found shop: ${shop.name} with ID: ${shop._id}`);

        const result = await Order.deleteMany({
            shopId: shop._id,
            status: 'pending'
        });

        console.log(`Deleted ${result.deletedCount} pending orders for ${shop.name}.`);
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

removePendingOrders();

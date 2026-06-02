require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Shop = require('./models/Shop');
const Product = require('./models/Product');
const Order = require('./models/Order');

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/muna")
    .then(async () => {
        console.log("MongoDB Connected. Starting DB Cleanup...");

        try {
            await User.deleteMany({});
            console.log("🗑️ Users deleted.");

            await Shop.deleteMany({});
            console.log("🗑️ Shops deleted.");

            await Product.deleteMany({});
            console.log("🗑️ Products deleted (Master Godown is safe).");

            await Order.deleteMany({});
            console.log("🗑️ Orders deleted.");

            console.log("✅ Database reset complete!");
            process.exit();
        } catch (error) {
            console.log("Error during cleanup:", error);
            process.exit(1);
        }
    })
    .catch((err) => console.log("Connection Error:", err));

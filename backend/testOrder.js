const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Shop = require('./models/Shop');
const Product = require('./models/Product');

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const shop = await Shop.findOne({ name: "Quick Kart" });
        if (shop) {
            console.log(`Shop: ${shop.name}`);
            const products = await Product.find({ shopId: shop._id });
            for (const p of products) {
                console.log(`- ${p.name}: price=${p.price} inStock=${p.inStock}`);
            }
        }
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
};

runTest();

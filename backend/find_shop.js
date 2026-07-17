require('dotenv').config();
const mongoose = require('mongoose');
const Shop = require('./models/Shop');

async function findShops() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const shops = await Shop.find({ name: { $regex: /asha/i } });
        console.log(shops.map(s => s.name));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
findShops();

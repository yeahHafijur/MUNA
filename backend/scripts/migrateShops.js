require('dotenv').config();
const mongoose = require('mongoose');
const Shop = require('./models/Shop');
const Category = require('./models/Category');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/muna').then(async () => {
    console.log("Connected to DB.");

    const rawCategories = await Shop.distinct('category');
    console.log("Raw shop categories:", rawCategories);

    // The categories the user wants to keep as proper standard options
    const validNames = ['Coding', 'Cyber Cafe', 'Fertilizer And Seed', 'Meat Shop', 'Nursery', 'Grocery', 'General'];

    // 1. Seed them into the Category schema (for Superadmin Dashboard)
    for (const name of validNames) {
        const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, type: 'shop' });
        if (!exists) {
            await Category.create({ name, type: 'shop', isActive: true });
            console.log(`[+] Created shop category in Godown: ${name}`);
        }
    }

    // 2. Update existing shops
    const shops = await Shop.find({});
    let updatedCount = 0;
    
    for (const shop of shops) {
        let cat = (shop.category || "").trim();
        
        // Fix casing to match our validNames
        if (cat.toLowerCase() === 'grocery') cat = 'Grocery';
        if (cat.toLowerCase() === 'coding') cat = 'Coding';
        if (cat.toLowerCase() === 'nursery') cat = 'Nursery';
        if (cat.toLowerCase() === 'meat shop') cat = 'Meat Shop';
        if (cat.toLowerCase() === 'cyber cafe') cat = 'Cyber Cafe';
        if (cat.toLowerCase() === 'fertilizer and seed') cat = 'Fertilizer And Seed';

        // If it's not one of our standard names, default to General
        if (!validNames.includes(cat)) {
            cat = 'General';
        }

        if (shop.category !== cat) {
            shop.category = cat;
            await shop.save();
            console.log(`[Shop] Updated '${shop.name}' -> ${cat}`);
            updatedCount++;
        }
    }

    console.log(`Migration completed. Updated ${updatedCount} shops.`);
    process.exit(0);
}).catch(console.error);

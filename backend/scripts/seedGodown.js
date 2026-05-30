const mongoose = require("mongoose");
const Product = require("../models/Product");
const MasterProduct = require("../models/MasterProduct");

const MONGO_URI = "mongodb://127.0.0.1:27017/muna";

const seedGodown = async () => {
    try {
        console.log("🔗 Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected!");

        const allProducts = await Product.find({});
        console.log(`📦 Found ${allProducts.length} total products in shops.`);

        let addedCount = 0;
        let duplicateCount = 0;

        for (const product of allProducts) {
            try {
                const exists = await MasterProduct.findOne({ name: { $regex: new RegExp('^' + product.name + '$', 'i') } });
                if (!exists) {
                    await MasterProduct.create({
                        name: product.name,
                        category: product.category,
                        image: product.image
                    });
                    addedCount++;
                } else {
                    duplicateCount++;
                }
            } catch (err) {
                console.log(`⚠️ Error with ${product.name}: ${err.message}`);
            }
        }

        console.log("-----------------------------------------");
        console.log(`🎉 Godown Seeding Complete!`);
        console.log(`✅ Added to Godown: ${addedCount}`);
        console.log(`🔁 Duplicates skipped: ${duplicateCount}`);
        console.log("-----------------------------------------");

        process.exit(0);
    } catch (error) {
        console.error("❌ Fatal Error:", error);
        process.exit(1);
    }
};

seedGodown();

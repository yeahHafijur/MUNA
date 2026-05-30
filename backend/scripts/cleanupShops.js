const mongoose = require("mongoose");
const Shop = require("../models/Shop");
const Product = require("../models/Product");

const MONGO_URI = "mongodb://127.0.0.1:27017/muna";

const cleanupShops = async () => {
    try {
        console.log("🔗 Connecting to Database...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected!");

        // 1. QuickKart dukan dhundho
        const quickKart = await Shop.findOne({ name: /QuickKart/i });
        if (!quickKart) {
            console.log("❌ QuickKart naam ki koi dukan nahi mili! Pehle Admin Dashboard se bana lo.");
            process.exit(1);
        }
        console.log(`✅ QuickKart mili: ${quickKart.name} (ID: ${quickKart._id})`);

        // 2. Saare existing products ko QuickKart me move karo
        const allProducts = await Product.find({});
        console.log(`📦 Total products in DB: ${allProducts.length}`);

        let moved = 0;
        for (const product of allProducts) {
            if (product.shopId.toString() !== quickKart._id.toString()) {
                product.shopId = quickKart._id;
                await product.save();
                moved++;
            }
        }
        console.log(`✅ ${moved} products ko QuickKart me move kar diya.`);

        // 3. Baaki saari dukanen delete karo (QuickKart chhod ke)
        const deleteResult = await Shop.deleteMany({ _id: { $ne: quickKart._id } });
        console.log(`🗑️ ${deleteResult.deletedCount} purani dukanen delete ho gayi.`);

        // 4. Final summary
        const finalProducts = await Product.find({ shopId: quickKart._id });
        console.log("\n-----------------------------------------");
        console.log(`🏪 QuickKart me ab total ${finalProducts.length} products hain:`);
        finalProducts.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.name} — ₹${p.price} (${p.inStock ? 'In Stock' : 'Out of Stock'})`);
        });
        console.log("-----------------------------------------");
        console.log("🎉 Done! Ab sirf QuickKart hi dikhegi.");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

cleanupShops();

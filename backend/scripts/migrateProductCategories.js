require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const ItemCategory = require('../models/ItemCategory');

async function migrateProductCategories() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const products = await Product.find({ category: { $type: "string" } });
        console.log(`Found ${products.length} products with string categories.`);

        let updated = 0;
        let failed = 0;

        for (const product of products) {
            if (mongoose.Types.ObjectId.isValid(product.category)) {
                // Already valid objectId string, just cast it later if schema changes
                continue;
            }

            // Find matching category by name
            const cat = await ItemCategory.findOne({ name: new RegExp('^' + product.category + '$', 'i') });
            if (cat) {
                product.category = cat._id;
                await product.save();
                updated++;
            } else {
                console.log(`No category found for name: ${product.category}`);
                failed++;
            }
        }

        console.log(`Migration completed. Updated: ${updated}, Failed/Unmatched: ${failed}`);
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrateProductCategories();

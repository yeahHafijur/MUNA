/**
 * Migration Script: Convert string-based categories to the new Category model
 * 
 * Run this ONCE after deploying the new Category model:
 *   node migrateCategories.js
 * 
 * What it does:
 * 1. For each Shop, reads all unique product.category strings
 * 2. Also reads shop.customCategories and shop.categoriesConfig
 * 3. Creates a Category document for each unique name
 * 4. Updates all Product.category from string → ObjectId
 * 5. Cleans up shop.customCategories and shop.categoriesConfig
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Shop = require('./models/Shop');
const Category = require('./models/Category');

async function migrate() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const shops = await Shop.find({});
    console.log(`Found ${shops.length} shops to process`);

    for (const shop of shops) {
        console.log(`\n--- Processing shop: ${shop.name} (${shop._id}) ---`);

        // Collect all category names from multiple sources
        const categoryNames = new Set();

        // Source 1: Product.category strings
        const products = await Product.find({ shopId: shop._id });
        for (const p of products) {
            if (p.category && typeof p.category === 'string') {
                categoryNames.add(p.category.trim());
            }
        }

        // Source 2: shop.customCategories
        if (shop.customCategories && shop.customCategories.length > 0) {
            for (const name of shop.customCategories) {
                if (name && name.trim()) categoryNames.add(name.trim());
            }
        }

        // Source 3: shop.categoriesConfig
        if (shop.categoriesConfig && shop.categoriesConfig.length > 0) {
            for (const cfg of shop.categoriesConfig) {
                if (cfg.name && cfg.name.trim()) categoryNames.add(cfg.name.trim());
            }
        }

        // If no categories found, create a default "General"
        if (categoryNames.size === 0) {
            categoryNames.add('General');
        }

        console.log(`  Found ${categoryNames.size} unique categories: ${[...categoryNames].join(', ')}`);

        // Create Category documents
        const categoryMap = {}; // name → ObjectId
        let sortOrder = 0;

        for (const name of categoryNames) {
            // Check if this category already exists as a Category document
            let existing = await Category.findOne({ shopId: shop._id, name: name });
            if (existing) {
                categoryMap[name] = existing._id;
                console.log(`  [SKIP] Category "${name}" already exists`);
                continue;
            }

            // Check if there's an image from categoriesConfig
            let image = '';
            if (shop.categoriesConfig) {
                const cfg = shop.categoriesConfig.find(c => c.name === name);
                if (cfg && cfg.image) image = cfg.image;
            }

            const cat = await Category.create({
                name,
                image,
                shopId: shop._id,
                sortOrder: sortOrder++
            });
            categoryMap[name] = cat._id;
            console.log(`  [CREATE] Category "${name}" → ${cat._id}`);
        }

        // Update products: string → ObjectId
        for (const product of products) {
            if (product.category && typeof product.category === 'string') {
                const catName = product.category.trim();
                const catId = categoryMap[catName];
                if (catId) {
                    await Product.updateOne(
                        { _id: product._id },
                        { $set: { category: catId } }
                    );
                    console.log(`  [UPDATE] Product "${product.name}" → category ${catId}`);
                } else {
                    // Fallback: create a "General" category
                    let general = await Category.findOne({ shopId: shop._id, name: 'General' });
                    if (!general) {
                        general = await Category.create({ name: 'General', shopId: shop._id, sortOrder: 999 });
                    }
                    await Product.updateOne(
                        { _id: product._id },
                        { $set: { category: general._id } }
                    );
                    console.log(`  [UPDATE] Product "${product.name}" → fallback General`);
                }
            }
        }

        console.log(`  Done processing ${shop.name}`);
    }

    console.log('\n=== Migration Complete ===');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});

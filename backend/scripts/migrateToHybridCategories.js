const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const Shop = require('./models/Shop');
const ShopCategory = require('./models/ShopCategory');
const ItemCategory = require('./models/ItemCategory');
const Product = require('./models/Product');

// Old Category model (read-only for migration)
const OldCategory = mongoose.model('Category', new mongoose.Schema({
    name: String,
    image: String,
    shopId: mongoose.Schema.Types.ObjectId,
    sortOrder: Number
}), 'categories');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // ═══════════════════════════════════════════════════
        // STEP 1: Create ShopCategories from unique shop.category strings
        // ═══════════════════════════════════════════════════
        console.log("\n═══ STEP 1: Creating ShopCategories ═══");
        const shops = await Shop.find();
        const uniqueShopCats = [...new Set(shops.map(s => s.category || 'General'))];

        let order = 0;
        for (const catName of uniqueShopCats) {
            try {
                const existing = await ShopCategory.findOne({ name: catName });
                if (!existing) {
                    await ShopCategory.create({ name: catName, sortOrder: order++ });
                    console.log(`  ✅ Created ShopCategory: ${catName}`);
                } else {
                    console.log(`  ⏭️  ShopCategory already exists: ${catName}`);
                }
            } catch (err) {
                console.log(`  ❌ Failed to create ShopCategory ${catName}: ${err.message}`);
            }
        }

        // ═══════════════════════════════════════════════════
        // STEP 2: Link shops to their ShopCategory
        // ═══════════════════════════════════════════════════
        console.log("\n═══ STEP 2: Linking shops to ShopCategories ═══");
        for (const shop of shops) {
            const catName = shop.category || 'General';
            const shopCat = await ShopCategory.findOne({ name: catName });
            if (shopCat && !shop.shopCategoryId) {
                shop.shopCategoryId = shopCat._id;
                await shop.save();
                console.log(`  ✅ Linked ${shop.name} → ${catName}`);
            }
        }

        // ═══════════════════════════════════════════════════
        // STEP 3: Migrate old Categories to ItemCategories
        // ═══════════════════════════════════════════════════
        console.log("\n═══ STEP 3: Migrating old Categories to ItemCategories ═══");
        const oldCategories = await OldCategory.find();
        console.log(`  Found ${oldCategories.length} old categories to migrate`);

        for (const oldCat of oldCategories) {
            try {
                // Find vendor for this shop
                const shop = await Shop.findById(oldCat.shopId);
                if (!shop) {
                    console.log(`  ⏭️  Skipping orphan category: ${oldCat.name} (shopId: ${oldCat.shopId})`);
                    continue;
                }

                const existing = await ItemCategory.findOne({ name: oldCat.name, shopId: oldCat.shopId });
                if (!existing) {
                    const newCat = await ItemCategory.create({
                        name: oldCat.name,
                        image: oldCat.image || '',
                        isGlobal: false,
                        shopId: oldCat.shopId,
                        vendorId: shop.vendorId,
                        sortOrder: oldCat.sortOrder || 0
                    });
                    console.log(`  ✅ Migrated: ${oldCat.name} (shop: ${shop.name}) → ${newCat._id}`);

                    // Update products that reference the old category ID
                    const updateResult = await Product.updateMany(
                        { category: oldCat._id.toString() },
                        { category: newCat._id }
                    );
                    if (updateResult.modifiedCount > 0) {
                        console.log(`     📦 Updated ${updateResult.modifiedCount} products`);
                    }
                } else {
                    console.log(`  ⏭️  ItemCategory already exists: ${oldCat.name} for ${shop.name}`);
                    // Still update products pointing to old ID
                    await Product.updateMany(
                        { category: oldCat._id.toString() },
                        { category: existing._id }
                    );
                }
            } catch (err) {
                console.log(`  ❌ Failed to migrate ${oldCat.name}: ${err.message}`);
            }
        }

        // ═══════════════════════════════════════════════════
        // STEP 4: Seed Global Item Categories
        // ═══════════════════════════════════════════════════
        console.log("\n═══ STEP 4: Seeding Global Item Categories ═══");
        const globalCats = ['General', 'Beverages', 'Snacks', 'Dairy', 'Grocery', 'Bakery', 'Meat & Poultry', 'Personal Care', 'Stationery', 'Electronics', 'Household'];

        let gOrder = 0;
        for (const catName of globalCats) {
            try {
                const existing = await ItemCategory.findOne({ name: catName, isGlobal: true });
                if (!existing) {
                    await ItemCategory.create({
                        name: catName,
                        isGlobal: true,
                        shopId: null,
                        vendorId: null,
                        sortOrder: gOrder++
                    });
                    console.log(`  ✅ Seeded global: ${catName}`);
                } else {
                    console.log(`  ⏭️  Global already exists: ${catName}`);
                }
            } catch (err) {
                console.log(`  ❌ Failed to seed ${catName}: ${err.message}`);
            }
        }

        // ═══════════════════════════════════════════════════
        // STEP 5: Handle products with string categories (legacy)
        // ═══════════════════════════════════════════════════
        console.log("\n═══ STEP 5: Fixing legacy string categories in products ═══");
        const allProducts = await Product.find();
        let fixed = 0;
        for (const product of allProducts) {
            if (typeof product.category === 'string' && !mongoose.Types.ObjectId.isValid(product.category)) {
                // It's a plain string like "General". Try to find matching ItemCategory
                const catName = product.category || 'General';
                // First try shop-specific
                let itemCat = await ItemCategory.findOne({ name: catName, shopId: product.shopId });
                // Fallback to global
                if (!itemCat) {
                    itemCat = await ItemCategory.findOne({ name: catName, isGlobal: true });
                }
                // Final fallback to "General" global
                if (!itemCat) {
                    itemCat = await ItemCategory.findOne({ name: 'General', isGlobal: true });
                }
                if (itemCat) {
                    product.category = itemCat._id;
                    await product.save();
                    fixed++;
                }
            }
        }
        console.log(`  ✅ Fixed ${fixed} products with string categories`);

        console.log("\n✅ Migration complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
};

migrate();

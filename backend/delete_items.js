require('dotenv').config();
const mongoose = require('mongoose');

async function resetShops() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        const Shop = require('./models/Shop');
        const Product = require('./models/Product');
        const ItemCategory = require('./models/ItemCategory');

        const talukdarShop = await Shop.findOne({ name: { $regex: /Talukdar seed/i } });
        
        if (!talukdarShop) {
            console.log('Could not find Talukdar seed shop. Found these shops instead:');
            const allShops = await Shop.find({}, 'name');
            console.log(allShops.map(s => s.name));
            process.exit(1);
        }

        console.log('Found Talukdar Shop with ID:', talukdarShop._id, 'and name:', talukdarShop.name);

        const productsToDelete = await Product.countDocuments({ shopId: { $ne: talukdarShop._id } });
        const categoriesToDelete = await ItemCategory.countDocuments({ shopId: { $ne: talukdarShop._id } });

        console.log(`Going to delete ${productsToDelete} products and ${categoriesToDelete} categories.`);

        await Product.deleteMany({ shopId: { $ne: talukdarShop._id } });
        await ItemCategory.deleteMany({ shopId: { $ne: talukdarShop._id } });

        console.log('Deletion complete.');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
resetShops();

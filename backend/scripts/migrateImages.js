require('dotenv').config();
const mongoose = require('mongoose');
const { uploadBase64 } = require('./utils/cloudinary');
const Product = require('./models/Product');
const MasterProduct = require('./models/MasterProduct');
const Shop = require('./models/Shop');

async function migrateImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Image Migration");

    // Migrate Shops
    const shops = await Shop.find({ image: { $regex: /^data:image/ } });
    console.log(`Found ${shops.length} shops with base64 images.`);
    for (const shop of shops) {
      console.log(`Uploading image for shop: ${shop.name}`);
      const result = await uploadBase64(shop.image, 'muna/shops');
      shop.image = result.secure_url;
      await shop.save();
    }

    // Migrate Products
    const products = await Product.find({ image: { $regex: /^data:image/ } });
    console.log(`Found ${products.length} products with base64 images.`);
    for (const prod of products) {
      console.log(`Uploading image for product: ${prod.name}`);
      const result = await uploadBase64(prod.image, 'muna/products');
      prod.image = result.secure_url;
      await prod.save();
    }

    // Migrate MasterProducts
    const masterProds = await MasterProduct.find({ image: { $regex: /^data:image/ } });
    console.log(`Found ${masterProds.length} master products with base64 images.`);
    for (const mp of masterProds) {
      console.log(`Uploading image for master product: ${mp.name}`);
      const result = await uploadBase64(mp.image, 'muna/products');
      mp.image = result.secure_url;
      await mp.save();
    }

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateImages();

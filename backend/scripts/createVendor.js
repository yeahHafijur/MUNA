const mongoose = require('mongoose');
const dotenv = require('dotenv');
const readline = require('readline');
const User = require('../models/User');
const Shop = require('../models/Shop');

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createVendor = async () => {
    try {
        console.log("🔗 Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/muna");
        console.log("✅ Database Connected\n");

        console.log("--- 🏪 CREATE NEW VENDOR ---");
        const vendorName = await question("Vendor Full Name: ");
        const vendorPhone = await question("Vendor Phone (for login): ");
        console.log("\n--- 🏬 SHOP DETAILS ---");
        const shopName = await question("Shop Name: ");
        const shopAddress = await question("Shop Full Address: ");

        // 1. Check if vendor exists
        const existingUser = await User.findOne({ phone: vendorPhone });
        if (existingUser) {
            console.log("\n❌ Error: A user with this phone number already exists!");
            process.exit(1);
        }

        // 3. Create Vendor User
        const vendor = await User.create({
            name: vendorName,
            phone: vendorPhone,
            role: 'vendor'
        });
        console.log(`\n✅ Vendor Created: ${vendor.name} (${vendor.phone})`);

        // 4. Create Shop for Vendor
        const shop = await Shop.create({
            name: shopName,
            address: shopAddress,
            vendorId: vendor._id
        });
        console.log(`✅ Shop Created: ${shop.name} at ${shop.address}`);
        
        console.log("\n🎉 ALL DONE! The vendor can now login using their phone number and OTP.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

createVendor();

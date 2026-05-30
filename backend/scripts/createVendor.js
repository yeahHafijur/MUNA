const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
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
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Database Connected\n");

        console.log("--- 🏪 CREATE NEW VENDOR ---");
        const vendorName = await question("Vendor Full Name: ");
        const vendorEmail = await question("Vendor Email (for login): ");
        const vendorPassword = await question("Vendor Password (for login): ");
        console.log("\n--- 🏬 SHOP DETAILS ---");
        const shopName = await question("Shop Name: ");
        const shopAddress = await question("Shop Full Address: ");

        // 1. Check if vendor exists
        const existingUser = await User.findOne({ email: vendorEmail });
        if (existingUser) {
            console.log("\n❌ Error: A user with this email already exists!");
            process.exit(1);
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(vendorPassword, salt);

        // 3. Create Vendor User
        const vendor = await User.create({
            name: vendorName,
            email: vendorEmail,
            password: hashedPassword,
            role: 'vendor'
        });
        console.log(`\n✅ Vendor Created: ${vendor.name} (${vendor.email})`);

        // 4. Create Shop for Vendor
        const shop = await Shop.create({
            name: shopName,
            address: shopAddress,
            vendorId: vendor._id
        });
        console.log(`✅ Shop Created: ${shop.name} at ${shop.address}`);
        
        console.log("\n🎉 ALL DONE! The vendor can now login using the email and password.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

createVendor();

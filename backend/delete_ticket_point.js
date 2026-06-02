const mongoose = require('mongoose');
const Shop = require('./models/Shop');
const User = require('./models/User');

mongoose.connect("mongodb+srv://yhz01012004_db_user:xJaSdREG247oyMCJ@munacluster.dmjrufn.mongodb.net/muna?retryWrites=true&w=majority")
    .then(async () => {
        // Find the shop with name matching 'ticket point' (case insensitive)
        const shop = await Shop.findOne({ name: { $regex: /ticket point/i } });
        
        if (shop) {
            console.log("Found shop:", shop.name, "| ID:", shop._id);
            // Optionally find the associated vendor
            const vendor = await User.findById(shop.vendorId);
            if (vendor) {
                console.log("Found vendor:", vendor.name, "| ID:", vendor._id);
                // Delete vendor
                await User.findByIdAndDelete(vendor._id);
                console.log("Vendor deleted.");
            }
            // Delete shop
            await Shop.findByIdAndDelete(shop._id);
            console.log("Shop deleted.");
        } else {
            console.log("Shop 'ticket point' not found.");
        }
        process.exit();
    });

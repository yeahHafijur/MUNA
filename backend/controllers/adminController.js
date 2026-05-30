const User = require("../models/User");
const Shop = require("../models/Shop");
const bcrypt = require("bcryptjs");

// 1. Onboard Vendor & Shop (Super Admin only)
const onboardVendorAndShop = async (req, res) => {
    try {
        const { vendorName, vendorEmail, vendorPassword, shopName, shopAddress, shopCategory, shopLat, shopLng } = req.body;

        // Security Check: Sirf super_admin yeh kar sakta hai
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Aapke paas ye power nahi hai." });
        }

        // Check if vendor email already exists
        const existingUser = await User.findOne({ email: vendorEmail });
        if (existingUser) {
            return res.status(400).json({ message: "Is email se pehle se koi user/vendor bana hua hai." });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(vendorPassword, salt);

        // 1. Create the Vendor Account
        const vendor = await User.create({
            name: vendorName,
            email: vendorEmail,
            password: hashedPassword,
            role: "vendor"
        });

        // 2. Prepare Shop Location (if provided)
        let locationData = undefined;
        if (shopLat && shopLng) {
            locationData = {
                type: 'Point',
                coordinates: [parseFloat(shopLng), parseFloat(shopLat)] // [Lng, Lat] format for GeoJSON
            };
        }

        // 3. Create the Shop
        const shop = await Shop.create({
            name: shopName,
            address: shopAddress,
            category: shopCategory || "General",
            location: locationData,
            vendorId: vendor._id
        });

        res.status(201).json({
            message: "Vendor aur Shop dono successfully onboard ho gaye!",
            vendor: { name: vendor.name, email: vendor.email },
            shop: { name: shop.name, address: shop.address }
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    onboardVendorAndShop
};

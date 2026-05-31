const User = require("../models/User");
const Shop = require("../models/Shop");

// 1. Onboard Vendor & Shop (Super Admin only)
const onboardVendorAndShop = async (req, res) => {
    try {
        const { vendorName, vendorPhone, shopName, shopAddress, shopCategory, shopLat, shopLng } = req.body;

        // Security Check: Sirf super_admin yeh kar sakta hai
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Aapke paas ye power nahi hai." });
        }

        if (!vendorPhone || vendorPhone.length < 10) {
            return res.status(400).json({ message: "Valid 10-digit phone number zaroori hai." });
        }

        // Check if vendor phone already exists
        const existingUser = await User.findOne({ phone: vendorPhone });
        if (existingUser) {
            return res.status(400).json({ message: "Is phone number se pehle se koi user/vendor bana hua hai." });
        }

        // 1. Create the Vendor Account
        const vendor = await User.create({
            name: vendorName,
            phone: vendorPhone,
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
            vendor: { name: vendor.name, phone: vendor.phone },
            shop: { name: shop.name, address: shop.address }
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    onboardVendorAndShop
};

const User = require("../models/User");
const Shop = require("../models/Shop");

// 1. Onboard Vendor & Shop (Super Admin only)
const onboardVendorAndShop = async (req, res) => {
    try {
        const { vendorName, vendorEmail, vendorPhone, shopName, shopAddress, shopCategory, shopLat, shopLng, udyamNumber, openTime, closeTime } = req.body;

        // Security Check: Sirf super_admin yeh kar sakta hai
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "You do not have permission to perform this action." });
        }

        if (!vendorEmail || !vendorPhone || vendorPhone.length < 10) {
            return res.status(400).json({ message: "Valid Email and 10-digit phone number are required." });
        }

        if (!shopLat || !shopLng) {
            return res.status(400).json({ message: "Shop Latitude and Longitude are required for delivery calculations." });
        }

        if (!openTime || !closeTime) {
            return res.status(400).json({ message: "Shop Open Time and Close Time are mandatory." });
        }

        const cleanEmail = vendorEmail.trim().toLowerCase();

        // Check if vendor email already exists
        let vendor = await User.findOne({ email: cleanEmail });
        
        if (vendor) {
            if (vendor.role === "super_admin") {
                return res.status(400).json({ message: "This email is a super admin. Cannot downgrade to vendor." });
            }
            // Upgrade existing user to vendor
            vendor.role = "vendor";
            vendor.name = vendorName;
            vendor.phone = vendorPhone;
            await vendor.save();
        } else {
            // Create new Vendor Account
            vendor = await User.create({
                name: vendorName,
                email: cleanEmail,
                phone: vendorPhone,
                role: "vendor"
            });
        }

        // 2. Prepare Shop Location
        const locationData = {
            type: 'Point',
            coordinates: [parseFloat(shopLng), parseFloat(shopLat)] // [Lng, Lat] format for GeoJSON
        };

        // 3. Create the Shop
        const shop = await Shop.create({
            name: shopName,
            address: shopAddress,
            category: shopCategory || "General",
            udyamNumber: udyamNumber || "",
            location: locationData,
            vendorId: vendor._id,
            autoSchedule: {
                enabled: true,
                openTime: openTime,
                closeTime: closeTime
            }
        });

        res.status(201).json({
            message: "Vendor and Shop successfully onboarded!",
            vendor: { name: vendor.name, phone: vendor.phone },
            shop: { name: shop.name, address: shop.address }
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    onboardVendorAndShop
};

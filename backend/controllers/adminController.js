const User = require("../models/User");
const Shop = require("../models/Shop");
const { sendAndSaveNotification } = require('../utils/notificationService');

// 1. Onboard Vendor & Shop (Super Admin only)
const onboardVendorAndShop = async (req, res) => {
    try {
        const { vendorName, vendorEmail, vendorPhone, shopName, shopAddress, shopCategory, shopCategoryId, shopLat, shopLng, udyamNumber, openTime, closeTime } = req.body;

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

        // 3. Validate ShopCategory if provided
        let resolvedCategoryId = null;
        if (shopCategoryId) {
            const ShopCategory = require('../models/ShopCategory');
            const catExists = await ShopCategory.findById(shopCategoryId);
            if (!catExists) {
                return res.status(400).json({ message: "Invalid shop category selected." });
            }
            resolvedCategoryId = catExists._id;
        }

        // 4. Handle Image Upload
        let finalImageUrl = req.body.existingImage || "";
        if (req.file) {
            const { uploadStream } = require('../utils/cloudinary');
            const result = await uploadStream(req.file.buffer, 'muna/shops');
            finalImageUrl = result.secure_url;
        }

        // 5. Create the Shop
        const shop = await Shop.create({
            name: shopName,
            address: shopAddress,
            category: shopCategory || "General",
            shopCategoryId: resolvedCategoryId,
            udyamNumber: udyamNumber || "",
            location: locationData,
            vendorId: vendor._id,
            image: finalImageUrl,
            autoSchedule: {
                enabled: true,
                openTime: openTime,
                closeTime: closeTime
            }
        });

        // 5. If this came from a vendor request, mark it as approved
        const { requestId } = req.body;
        if (requestId) {
            const VendorRequest = require('../models/VendorRequest');
            await VendorRequest.findByIdAndUpdate(requestId, { status: 'approved' });
        }

        res.status(201).json({
            message: "Vendor and Shop successfully onboarded!",
            vendor: { name: vendor.name, phone: vendor.phone },
            shop: { name: shop.name, address: shop.address }
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// 2. Broadcast Notification to Users (Super Admin only)
const broadcastNotification = async (req, res) => {
    try {
        const { title, message, targetAudience } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Title is required." });
        }
        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Message is required." });
        }

        const validAudiences = ['all', 'customers', 'vendors'];
        const audience = validAudiences.includes(targetAudience) ? targetAudience : 'all';

        // Build query based on target audience
        let filter = {};
        if (audience === 'customers') {
            filter.role = 'customer';
        } else if (audience === 'vendors') {
            filter.role = 'vendor';
        }
        // 'all' = no filter, everyone gets it

        // Only get users who have at least one FCM token (they can receive pushes)
        const users = await User.find(filter).select('_id').lean();
        const userIds = users.map(u => u._id);

        if (userIds.length === 0) {
            return res.status(400).json({ message: "No users found for the selected audience." });
        }

        // Fire-and-forget: send notifications in the background
        sendAndSaveNotification(
            userIds,
            title.trim(),
            message.trim(),
            { actionUrl: "/notifications", route: "/notifications", type: "broadcast" }
        );

        res.status(200).json({
            message: `Broadcast sent to ${userIds.length} ${audience === 'all' ? 'users' : audience}!`,
            recipientCount: userIds.length
        });

    } catch (error) {
        console.error("broadcastNotification error:", error);
        res.status(500).json({ message: "Failed to send broadcast." });
    }
};

module.exports = {
    onboardVendorAndShop,
    broadcastNotification
};


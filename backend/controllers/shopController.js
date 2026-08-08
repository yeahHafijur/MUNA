const Shop = require("../models/Shop");
const { getDistanceFromLatLonInKm } = require('../utils/geo');


const getAllShops = async (req, res) => {
    try {
        let filter = { isActive: true }; // Only active shops by default
        let query = Shop.find(filter).select('name address image category isOpen location rating udyamNumber').limit(1000);
        const shops = await query.lean();
        res.status(200).json(shops);
    } catch (error) {
        res.status(500).json({ message: "Server Error" })
    }
};

const getAllShopsForAdmin = async (req, res) => {
    try {
        const query = Shop.find({})
            .select('name address image category isOpen isActive location rating udyamNumber vendorId autoSchedule')
            .populate('vendorId', 'name email phone');
        const shops = await query.lean();
        res.status(200).json(shops);
    } catch (error) {
        res.status(500).json({ message: "Server Error" })
    }
};

const getShopById = async (req, res) => {
    try {
        // Public endpoint — only expose the vendor's display name, never email/phone
        const shop = await Shop.findById(req.params.id).populate('vendorId', 'name').lean();
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }
        res.status(200).json(shop);
    } catch (error) {
        console.error("calculateDelivery error:", error); res.status(500).json({ message: "Server error" });
    }
};

// controllers/shopController.js me createShop function ko thoda sa update karein:

const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ vendorId: req.user._id }).lean();
        if (!shop) {
            return res.status(404).json({ message: "You don't have any shop" });
        }
        res.status(200).json(shop);
    } catch (error) {
        console.error("calculateDelivery error:", error); res.status(500).json({ message: "Server error" });
    }
};

const createShop = async (req, res) => {
    try {
        // Nayi fields lat aur lng ko bhi request body se nikalein
        const { name, address, image, lat, lng } = req.body;

        if (!name || !address) {
            return res.status(400).json({ message: "Please provide shop name and address" });
        }

        const existingShop = await Shop.findOne({ vendorId: req.user._id });
        if (existingShop) {
            return res.status(400).json({ message: "A vendor can only create one shop" });
        }

        // Location object banayein agar lat aur lng diye gaye hain
        let locationData = undefined;
        if (lat && lng) {
            locationData = {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)] // [Longitude, Latitude]
            };
        }

        let finalImage = image;
        if (image && image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(image, 'muna/shops');
            finalImage = result.secure_url;
        }

        const shop = await Shop.create({
            name,
            address,
            image: finalImage,
            location: locationData, // location save kar rahe hain
            vendorId: req.user._id
        });

        res.status(201).json(shop);
    } catch (error) {
        console.error("calculateDelivery error:", error); res.status(500).json({ message: "Server error" });
    }
};


const updateShop = async (req, res) => {
    try {
        const { name, address, image } = req.body;
        const shop = await Shop.findById(req.params.id);
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }
        // Security Check: Kya ye shop ishi logged-in vendor ki hai? (Ya fir super_admin hai?)
        const isOwner = shop.vendorId && shop.vendorId.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Not authorized to update this shop" });
        }
        // Super admin can change name, vendor cannot
        if (req.user.role === 'super_admin' && req.body.name) {
            shop.name = req.body.name;
        }
        
        // Update User info if passed
        if (req.body.vendorName || req.body.vendorEmail || req.body.vendorPhone) {
            const User = require('../models/User');
            const vendor = await User.findById(shop.vendorId);
            if (vendor) {
                if (req.body.vendorName) vendor.name = req.body.vendorName;
                if (req.body.vendorEmail) vendor.email = req.body.vendorEmail;
                if (req.body.vendorPhone) vendor.phone = req.body.vendorPhone;
                await vendor.save();
            }
        }
        
        shop.address = req.body.address || shop.address;
        
        let newImage = req.body.image || shop.image;
        if (req.body.image && req.body.image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(req.body.image, 'muna/shops');
            newImage = result.secure_url;
        }
        shop.image = newImage;
        
        if (req.body.category !== undefined) shop.category = req.body.category;
        if (req.body.udyamNumber !== undefined) shop.udyamNumber = req.body.udyamNumber;
        if (req.body.isActive !== undefined) shop.isActive = req.body.isActive;
        
        if (req.body.lat !== undefined && req.body.lng !== undefined) {
            shop.location = {
                type: 'Point',
                coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)]
            };
        }

        if (req.body.customCategories !== undefined) {
            shop.customCategories = req.body.customCategories;
        }
        if (req.body.categoriesConfig !== undefined) {
            shop.categoriesConfig = req.body.categoriesConfig;
        }
        if (req.body.isOpen !== undefined) {
            shop.isOpen = req.body.isOpen;
        }
        if (req.body.deliverySettings !== undefined) {
            shop.deliverySettings = {
                ...shop.deliverySettings,
                ...req.body.deliverySettings
            };
        }
        if (req.body.autoSchedule !== undefined) {
            shop.autoSchedule = {
                ...shop.autoSchedule,
                ...req.body.autoSchedule
            };
        }
        
        const updatedShop = await shop.save();
        res.status(200).json(updatedShop);
    } catch (error) {
        console.error("calculateDelivery error:", error); res.status(500).json({ message: "Server error" });
    }
};

const updateShopImage = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }
        const isOwner = shop.vendorId && shop.vendorId.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Not authorized to update this shop" });
        }
        
        if (!req.file) {
            return res.status(400).json({ message: "Image upload failed" });
        }

        const { uploadStream } = require('../utils/cloudinary');
        const result = await uploadStream(req.file.buffer, 'muna/shops');
        shop.image = result.secure_url;
        
        const updatedShop = await shop.save();
        
        res.status(200).json(updatedShop);
    } catch (error) {
        console.error("calculateDelivery error:", error); res.status(500).json({ message: "Server error" });
    }
};



const calculateDelivery = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        if (!lat || !lng) {
            return res.status(400).json({ message: "Latitude and Longitude are required" });
        }

        const shop = await Shop.findById(req.params.id).select('location deliverySettings').lean();
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        const shopLat = shop.location?.coordinates?.[1] || 28.6139;
        const shopLng = shop.location?.coordinates?.[0] || 77.2090;

        const distance = getDistanceFromLatLonInKm(shopLat, shopLng, parseFloat(lat), parseFloat(lng));
        
        const settings = shop.deliverySettings || { minimumCharge: 10, minimumDistance: 2, chargePerKm: 5, maxRange: 5 };
        const maxRange = settings.maxRange || 5;

        if (distance > maxRange) {
            return res.status(400).json({ message: `Ye address shop ki delivery range (${maxRange} km) se bahar hai. Aapki doori: ${distance.toFixed(1)} km.` });
        }
        
        let fee = settings.minimumCharge;
        if (distance > settings.minimumDistance) {
            const extraKm = Math.ceil(distance - settings.minimumDistance);
            fee += (extraKm * settings.chargePerKm);
        }

        res.status(200).json({ distance: parseFloat(distance.toFixed(2)), deliveryFee: fee });
    } catch (error) {
        console.error("calculateDelivery error:", error); res.status(500).json({ message: "Server error" });
    }
};

const deleteShop = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        const isOwner = shop.vendorId && shop.vendorId.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Not authorized to delete this shop" });
        }

        const shopId = shop._id;
        const vendorId = shop.vendorId;

        // Cascade Delete
        const MasterProduct = require('../models/MasterProduct');
        const ShopCategory = require('../models/ShopCategory');
        const User = require('../models/User');

        await MasterProduct.deleteMany({ shopId });
        await ShopCategory.deleteMany({ shopId });
        await shop.deleteOne();

        // Check if vendor has other shops
        const otherShops = await Shop.countDocuments({ vendorId });
        if (otherShops === 0) {
            await User.findByIdAndUpdate(vendorId, { role: 'customer' });
        }

        res.status(200).json({ message: "Shop deleted successfully" });
    } catch (error) {
        console.error("calculateDelivery error:", error); res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getAllShops,
    getAllShopsForAdmin,
    getShopById,
    getMyShop,
    createShop,
    updateShop,
    calculateDelivery,
    updateShopImage,
    deleteShop
};

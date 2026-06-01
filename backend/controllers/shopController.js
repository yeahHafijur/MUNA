const Shop = require("../models/Shop");


const getAllShops = async (req, res) => {
    try {
        const shops = await Shop.find({}).populate('vendorId', 'name email phone');
        res.status(200).json(shops);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message })
    }
};

const getShopById = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id).populate('vendorId', 'name email phone');
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }
        res.status(200).json(shop);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// controllers/shopController.js me createShop function ko thoda sa update karein:

const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (!shop) {
            return res.status(404).json({ message: "You don't have any shop" });
        }
        res.status(200).json(shop);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
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

        const shop = await Shop.create({
            name,
            address,
            image,
            location: locationData, // location save kar rahe hain
            vendorId: req.user._id
        });

        res.status(201).json(shop);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
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
        if (shop.vendorId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Not authorized to update this shop" });
        }
        // Jo data naya aya hai usse update karo, warna purana hi rehne do
        shop.name = req.body.name || shop.name;
        shop.address = req.body.address || shop.address;
        shop.image = req.body.image || shop.image;
        if (req.body.customCategories !== undefined) {
            shop.customCategories = req.body.customCategories;
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
        
        const updatedShop = await shop.save();
        res.status(200).json(updatedShop);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateShopImage = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }
        if (shop.vendorId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Not authorized to update this shop" });
        }
        
        if (!req.file) {
            return res.status(400).json({ message: "Image upload failed" });
        }

        shop.image = req.file.path; // Cloudinary URL
        const updatedShop = await shop.save();
        
        res.status(200).json(updatedShop);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

const calculateDelivery = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        if (!lat || !lng) {
            return res.status(400).json({ message: "Latitude and Longitude are required" });
        }

        const shop = await Shop.findById(req.params.id);
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        const shopLat = shop.location?.coordinates?.[1] || 28.6139;
        const shopLng = shop.location?.coordinates?.[0] || 77.2090;

        const distance = getDistanceFromLatLonInKm(shopLat, shopLng, parseFloat(lat), parseFloat(lng));
        
        const settings = shop.deliverySettings || { minimumCharge: 10, minimumDistance: 2, chargePerKm: 5 };
        
        let fee = settings.minimumCharge;
        if (distance > settings.minimumDistance) {
            const extraKm = Math.ceil(distance - settings.minimumDistance);
            fee += (extraKm * settings.chargePerKm);
        }

        res.status(200).json({ distance: parseFloat(distance.toFixed(2)), deliveryFee: fee });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getAllShops,
    getShopById,
    getMyShop,
    createShop,
    updateShop,
    calculateDelivery,
    updateShopImage
};

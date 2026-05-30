const Shop = require("../models/Shop");


const getAllShops = async (req, res) => {
    try {
        const shops = await Shop.find({}).populate('vendorId', 'name email');
        res.status(200).json(shops);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message })
    }
};

const getShopById = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id).populate('vendorId', 'name email');
        if (!shop) {
            return res.status(404).json({ message: "Shop nahi mili" });
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
            return res.status(404).json({ message: "Aapki koi shop nahi hai" });
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
            return res.status(400).json({ message: "Ek vendor sirf ek hi shop bana sakta hai" });
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
            return res.status(404).json({ message: "Shop nahi mili" });
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
        
        const updatedShop = await shop.save();
        res.status(200).json(updatedShop);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getAllShops,
    getShopById,
    getMyShop,
    createShop,
    updateShop
};

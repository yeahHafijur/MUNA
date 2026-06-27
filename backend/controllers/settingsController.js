const Settings = require('../models/Settings');

// Get Navbar Message
const getNavbarMessage = async (req, res) => {
    try {
        let setting = await Settings.findOne({ key: 'navbarMessage' });
        if (!setting) {
            // Default fallback
            setting = { value: { line1: 'Your local market,', line2: 'delivered in minutes ⚡' } };
        }
        res.status(200).json(setting.value);
    } catch (error) {
        console.error("Error fetching navbar message:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update Navbar Message
const updateNavbarMessage = async (req, res) => {
    try {
        const { line1, line2 } = req.body;
        
        let setting = await Settings.findOne({ key: 'navbarMessage' });
        
        if (setting) {
            setting.value = { line1, line2 };
            setting.markModified('value');
            await setting.save();
        } else {
            setting = await Settings.create({
                key: 'navbarMessage',
                value: { line1, line2 }
            });
        }
        
        res.status(200).json({ message: "Navbar message updated successfully", data: setting.value });
    } catch (error) {
        console.error("Error updating navbar message:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get Featured Items (array of master product IDs for homepage carousel)
const getFeaturedItems = async (req, res) => {
    try {
        const MasterProduct = require('../models/MasterProduct');
        let setting = await Settings.findOne({ key: 'featuredItems' });
        if (!setting || !Array.isArray(setting.value)) {
            return res.status(200).json([]);
        }
        // Fetch actual product data for the stored IDs
        const products = await MasterProduct.find({ _id: { $in: setting.value } });
        // Maintain the saved order
        const ordered = setting.value
            .map(id => products.find(p => p._id.toString() === id.toString()))
            .filter(Boolean);
        res.status(200).json(ordered);
    } catch (error) {
        console.error("Error fetching featured items:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update Featured Items (Super Admin only)
const updateFeaturedItems = async (req, res) => {
    try {
        const { itemIds } = req.body; // Array of master product IDs
        let setting = await Settings.findOne({ key: 'featuredItems' });
        if (setting) {
            setting.value = itemIds || [];
            setting.markModified('value');
            await setting.save();
        } else {
            setting = await Settings.create({
                key: 'featuredItems',
                value: itemIds || []
            });
        }
        res.status(200).json({ message: "Featured items updated", data: setting.value });
    } catch (error) {
        console.error("Error updating featured items:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getNavbarMessage,
    updateNavbarMessage,
    getFeaturedItems,
    updateFeaturedItems
};

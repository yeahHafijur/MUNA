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

module.exports = {
    getNavbarMessage,
    updateNavbarMessage
};

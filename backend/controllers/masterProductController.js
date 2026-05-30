const MasterProduct = require('../models/MasterProduct');

// Get all products from the global godown
const getAllMasterProducts = async (req, res) => {
    try {
        const query = req.query.search || '';
        let filter = {};
        if (query) {
            filter.name = { $regex: query, $options: 'i' };
        }
        
        const products = await MasterProduct.find(filter).sort({ name: 1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getAllMasterProducts
};

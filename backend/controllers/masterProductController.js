const MasterProduct = require('../models/MasterProduct');

// Get all products from the global godown
const getAllMasterProducts = async (req, res) => {
    try {
        const query = req.query.search || '';
        const status = req.query.status;
        let filter = {};
        if (query) {
            filter.name = { $regex: query, $options: 'i' };
        }
        if (status) {
            filter.status = status;
        }
        
        const products = await MasterProduct.find(filter).sort({ name: 1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Create a new master product (Super Admin only)
const createMasterProduct = async (req, res) => {
    try {
        const { name, category } = req.body;
        const image = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : req.body.image;

        const newProduct = await MasterProduct.create({
            name,
            category,
            image
        });

        res.status(201).json({ message: "Product added to Godown successfully", product: newProduct });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Update an existing master product (Super Admin only)
const updateMasterProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category } = req.body;
        
        const product = await MasterProduct.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found in Godown" });
        }

        product.name = name || product.name;
        product.category = category || product.category;

        if (req.file) {
            product.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        } else if (req.body.image !== undefined) {
             product.image = req.body.image;
        }

        const updatedProduct = await product.save();
        res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a master product (Super Admin only)
const deleteMasterProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await MasterProduct.findByIdAndDelete(id);
        
        if (!product) {
            return res.status(404).json({ message: "Product not found in Godown" });
        }

        res.status(200).json({ message: "Product deleted successfully from Godown" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Approve a master product (Super Admin only)
const approveMasterProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await MasterProduct.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
        
        if (!product) {
            return res.status(404).json({ message: "Product not found in Godown" });
        }

        res.status(200).json({ message: "Product approved successfully", product });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getAllMasterProducts,
    createMasterProduct,
    updateMasterProduct,
    deleteMasterProduct,
    approveMasterProduct
};

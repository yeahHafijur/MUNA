const MasterProduct = require('../models/MasterProduct');

// Get all products from the global godown
const getAllMasterProducts = async (req, res) => {
    try {
        const query = req.query.search || '';
        const status = req.query.status;
        let filter = {};
        if (query) {
            if (query.length > 100) {
                return res.status(400).json({ message: "Search query is too long" });
            }
            // Escape regex metacharacters to prevent ReDoS / regex injection
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.name = { $regex: escaped, $options: 'i' };
        }
        if (status) {
            filter.status = status;
        }
        
        const products = await MasterProduct.find(filter).sort({ name: 1 }).limit(500);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Create a new master product (Super Admin only)
const createMasterProduct = async (req, res) => {
    try {
        const { name, category, price, quantity } = req.body;
        let image = req.body.image || '';
        if (req.files && req.files['image']) {
            image = `data:${req.files['image'][0].mimetype};base64,${req.files['image'][0].buffer.toString('base64')}`;
        }

        let gallery = [];
        if (req.files && req.files['gallery']) {
            gallery = req.files['gallery'].map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
        } else if (req.body.gallery) {
            gallery = Array.isArray(req.body.gallery) ? req.body.gallery : [req.body.gallery];
        }

        const newProduct = await MasterProduct.create({
            name,
            category,
            price: price || 0,
            quantity: quantity || '',
            image,
            gallery
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
        const { name, category, price, quantity } = req.body;
        
        const product = await MasterProduct.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found in Godown" });
        }

        product.name = name || product.name;
        product.category = category || product.category;
        if (price !== undefined) product.price = price;
        if (quantity !== undefined) product.quantity = quantity;

        if (req.files && req.files['image']) {
            product.image = `data:${req.files['image'][0].mimetype};base64,${req.files['image'][0].buffer.toString('base64')}`;
        } else if (req.body.image !== undefined) {
             product.image = req.body.image;
        }

        if (req.files && req.files['gallery']) {
            product.gallery = req.files['gallery'].map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
        } else if (req.body.gallery) {
            product.gallery = Array.isArray(req.body.gallery) ? req.body.gallery : [req.body.gallery];
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

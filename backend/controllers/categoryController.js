const Category = require('../models/Category');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

// Get all categories for a shop (Public)
const getCategoriesByShop = async (req, res) => {
    try {
        const categories = await Category.find({ shopId: req.params.shopId }).sort({ sortOrder: 1, name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Create a new category (Vendor only)
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (!shop) {
            return res.status(404).json({ message: "You don't have a shop" });
        }

        let image = '';
        if (req.file) {
            const { uploadStream } = require('../utils/cloudinary');
            const result = await uploadStream(req.file.buffer, 'muna/categories');
            image = result.secure_url;
        } else if (req.body.image && req.body.image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(req.body.image, 'muna/categories');
            image = result.secure_url;
        }

        // Get next sort order
        const maxSort = await Category.findOne({ shopId: shop._id }).sort({ sortOrder: -1 });
        const sortOrder = maxSort ? maxSort.sortOrder + 1 : 0;

        const category = await Category.create({
            name: name.trim(),
            image,
            shopId: shop._id,
            sortOrder
        });

        res.status(201).json(category);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A category with this name already exists in your shop" });
        }
        res.status(500).json({ message: "Server error" });
    }
};

// Update a category (Vendor only)
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (!shop || category.shopId.toString() !== shop._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (req.body.name) category.name = req.body.name.trim();
        if (req.body.sortOrder !== undefined) category.sortOrder = req.body.sortOrder;

        // Handle image upload
        if (req.file) {
            const { uploadStream } = require('../utils/cloudinary');
            const result = await uploadStream(req.file.buffer, 'muna/categories');
            category.image = result.secure_url;
        } else if (req.body.image && req.body.image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(req.body.image, 'muna/categories');
            category.image = result.secure_url;
        } else if (req.body.image === '') {
            category.image = '';
        }

        const updated = await category.save();
        res.status(200).json(updated);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A category with this name already exists" });
        }
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a category (Vendor only — block if products exist)
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (!shop || category.shopId.toString() !== shop._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Check if any products use this category
        const productCount = await Product.countDocuments({ category: category._id });
        if (productCount > 0) {
            return res.status(400).json({
                message: `Cannot delete: ${productCount} product(s) are assigned to this category. Reassign them first.`
            });
        }

        await category.deleteOne();
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Bulk reorder categories (Vendor only)
const reorderCategories = async (req, res) => {
    try {
        const { orderedIds } = req.body; // Array of category IDs in desired order
        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ message: "orderedIds must be an array" });
        }

        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (!shop) {
            return res.status(404).json({ message: "You don't have a shop" });
        }

        const bulkOps = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id, shopId: shop._id },
                update: { sortOrder: index }
            }
        }));

        await Category.bulkWrite(bulkOps);
        const categories = await Category.find({ shopId: shop._id }).sort({ sortOrder: 1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getCategoriesByShop,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories
};

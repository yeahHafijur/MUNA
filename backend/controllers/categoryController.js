const ItemCategory = require('../models/ItemCategory');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

// Get all item categories for a shop (Public)
// Returns: global categories + this shop's custom categories
const getCategoriesByShop = async (req, res) => {
    try {
        const categories = await ItemCategory.find({
            $or: [
                { shopId: req.params.shopId },
                { isGlobal: true }
            ]
        }).sort({ sortOrder: 1, name: 1 }).lean();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Get only global item categories (Public)
const getGlobalCategories = async (req, res) => {
    try {
        const categories = await ItemCategory.find({ isGlobal: true }).sort({ sortOrder: 1, name: 1 }).lean();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Create a custom item category (Vendor or Super Admin)
// SECURITY: Always force isGlobal to false for shop-specific categories
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Category name is required" });
        }

        let shop;
        if (req.user.role === 'super_admin') {
            if (!req.body.shopId) {
                return res.status(400).json({ message: "shopId is required for super_admin" });
            }
            shop = await Shop.findById(req.body.shopId);
        } else {
            shop = await Shop.findOne({ vendorId: req.user._id });
        }

        if (!shop) {
            return res.status(404).json({ message: req.user.role === 'super_admin' ? "Shop not found" : "You don't have a shop" });
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

        // Get next sort order for this shop's custom categories
        const maxSort = await ItemCategory.findOne({ shopId: shop._id }).sort({ sortOrder: -1 });
        const sortOrder = maxSort ? maxSort.sortOrder + 1 : 0;

        const category = await ItemCategory.create({
            name: name.trim(),
            image,
            isGlobal: false,        // SECURITY: Always false for shop-specific
            shopId: shop._id,
            vendorId: shop.vendorId, // bind to shop's vendor
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

// Create a global item category (Super Admin only)
const createGlobalCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Category name is required" });
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

        const maxSort = await ItemCategory.findOne({ isGlobal: true }).sort({ sortOrder: -1 });
        const sortOrder = maxSort ? maxSort.sortOrder + 1 : 0;

        const category = await ItemCategory.create({
            name: name.trim(),
            image,
            isGlobal: true,
            shopId: null,
            vendorId: null,
            sortOrder
        });

        res.status(201).json(category);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A global category with this name already exists" });
        }
        res.status(500).json({ message: "Server error" });
    }
};

// Update a category (Vendor can edit own custom, Super Admin can edit any)
const updateCategory = async (req, res) => {
    try {
        const category = await ItemCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const isSuperAdmin = req.user.role === 'super_admin';

        // If it's a global category, only super admin can edit
        if (category.isGlobal && !isSuperAdmin) {
            return res.status(403).json({ message: "Only admin can edit global categories" });
        }

        // If it's a vendor category, verify ownership
        if (!category.isGlobal && !isSuperAdmin) {
            if (!category.vendorId || category.vendorId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Not authorized" });
            }
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

// Delete a category (Vendor can delete own custom, Super Admin can delete any)
const deleteCategory = async (req, res) => {
    try {
        const category = await ItemCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const isSuperAdmin = req.user.role === 'super_admin';

        if (category.isGlobal && !isSuperAdmin) {
            return res.status(403).json({ message: "Only admin can delete global categories" });
        }

        if (!category.isGlobal && !isSuperAdmin) {
            if (!category.vendorId || category.vendorId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Not authorized" });
            }
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

// Bulk reorder categories (Vendor only — their custom cats)
const reorderCategories = async (req, res) => {
    try {
        const { orderedIds } = req.body;
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

        await ItemCategory.bulkWrite(bulkOps);
        const categories = await ItemCategory.find({
            $or: [{ isGlobal: true }, { shopId: shop._id }]
        }).sort({ isGlobal: -1, sortOrder: 1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getCategoriesByShop,
    getGlobalCategories,
    createCategory,
    createGlobalCategory,
    updateCategory,
    deleteCategory,
    reorderCategories
};

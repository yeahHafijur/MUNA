const ShopCategory = require('../models/ShopCategory');

// GET all shop categories (Public)
const getAllShopCategories = async (req, res) => {
    try {
        const categories = await ShopCategory.find().sort({ sortOrder: 1, name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// POST create shop category (Super Admin only)
const createShopCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Category name is required" });
        }

        let image = '';
        if (req.file) {
            const { uploadStream } = require('../utils/cloudinary');
            const result = await uploadStream(req.file.buffer, 'muna/shop-categories');
            image = result.secure_url;
        } else if (req.body.image && req.body.image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(req.body.image, 'muna/shop-categories');
            image = result.secure_url;
        }

        const maxSort = await ShopCategory.findOne().sort({ sortOrder: -1 });
        const sortOrder = maxSort ? maxSort.sortOrder + 1 : 0;

        const category = await ShopCategory.create({
            name: name.trim(),
            image,
            sortOrder
        });

        res.status(201).json(category);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A shop category with this name already exists" });
        }
        res.status(500).json({ message: "Server error" });
    }
};

// PUT update shop category (Super Admin only)
const updateShopCategory = async (req, res) => {
    try {
        const category = await ShopCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Shop category not found" });
        }

        if (req.body.name) category.name = req.body.name.trim();
        if (req.body.sortOrder !== undefined) category.sortOrder = req.body.sortOrder;

        if (req.file) {
            const { uploadStream } = require('../utils/cloudinary');
            const result = await uploadStream(req.file.buffer, 'muna/shop-categories');
            category.image = result.secure_url;
        } else if (req.body.image && req.body.image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(req.body.image, 'muna/shop-categories');
            category.image = result.secure_url;
        } else if (req.body.image === '') {
            category.image = '';
        }

        const updated = await category.save();
        res.status(200).json(updated);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A shop category with this name already exists" });
        }
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE shop category (Super Admin only)
const deleteShopCategory = async (req, res) => {
    try {
        const category = await ShopCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Shop category not found" });
        }

        // Check if any shops use this category
        const Shop = require('../models/Shop');
        const shopCount = await Shop.countDocuments({ shopCategoryId: category._id });
        if (shopCount > 0) {
            return res.status(400).json({
                message: `Cannot delete: ${shopCount} shop(s) are using this category. Reassign them first.`
            });
        }

        await category.deleteOne();
        res.status(200).json({ message: "Shop category deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getAllShopCategories,
    createShopCategory,
    updateShopCategory,
    deleteShopCategory
};

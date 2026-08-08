const Product = require('../models/Product');
const Shop = require('../models/Shop');
const ItemCategory = require('../models/ItemCategory');
const AuditLog = require('../models/AuditLog');

// ── Helper: Create audit log entry ──
const logAction = async (adminId, shopId, action, targetId, targetName, details = null) => {
    try {
        await AuditLog.create({ adminId, shopId, action, targetId, targetName, details });
    } catch (err) {
        console.error('[AuditLog] Failed to write log:', err.message);
    }
};

// ── Helper: Escape regex metacharacters (prevents ReDoS / regex injection) ──
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Helper: Clamp pagination params ──
const clampPagination = (page, limit, defaultLimit, maxLimit) => ({
    page: Math.max(parseInt(page) || 1, 1),
    limit: Math.min(Math.max(parseInt(limit) || defaultLimit, 1), maxLimit)
});

// ══════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════

// GET /api/admin/catalog/:shopId/products
// Paginated, with optional search and category filter
const getShopProducts = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { search, categoryId } = req.query;
        const { page, limit } = clampPagination(req.query.page, req.query.limit, 50, 100);

        const shop = await Shop.findById(shopId).lean();
        if (!shop) return res.status(404).json({ message: "Shop not found" });

        const filter = { shopId };
        if (categoryId) filter.category = categoryId;
        if (search && search.length <= 100) {
            filter.name = { $regex: escapeRegex(String(search)), $options: 'i' };
        }

        const skip = (page - 1) * limit;
        const total = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .sort({ inStock: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Populate category names
        const mongoose = require('mongoose');
        const categoryIds = products
            .map(p => p.category)
            .filter(c => mongoose.Types.ObjectId.isValid(c));

        const categories = await ItemCategory.find({ _id: { $in: categoryIds } }).lean();
        const catMap = new Map(categories.map(c => [c._id.toString(), c]));

        const populatedProducts = products.map(p => {
            if (p.category && catMap.has(p.category.toString())) {
                p.category = catMap.get(p.category.toString());
            }
            return p;
        });

        res.status(200).json({
            products: populatedProducts,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            shop: { _id: shop._id, name: shop.name }
        });
    } catch (error) {
        console.error('[AdminCatalog] getShopProducts error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/admin/catalog/:shopId/products
const createProduct = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { name, price, categoryId, description, quantity } = req.body;

        const shop = await Shop.findById(shopId).lean();
        if (!shop) return res.status(404).json({ message: "Shop not found" });

        let image = req.body.image || '';
        if (req.files && req.files['image']) {
            const { uploadStream } = require('../utils/cloudinary');
            const result = await uploadStream(req.files['image'][0].buffer, 'muna/products');
            image = result.secure_url;
        } else if (image && image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(image, 'muna/products');
            image = result.secure_url;
        }

        let galleryUrls = [];
        if (req.files && req.files['gallery']) {
            const { uploadStream } = require('../utils/cloudinary');
            for (const file of req.files['gallery']) {
                const result = await uploadStream(file.buffer, 'muna/products');
                galleryUrls.push(result.secure_url);
            }
        }

        const product = await Product.create({
            name,
            price: Number(price),
            category: categoryId,
            description: description || '',
            quantity: quantity || '',
            image,
            gallery: galleryUrls,
            shopId: shop._id
        });

        await logAction(req.user._id, shop._id, 'product_added', product._id, name);
        res.status(201).json(product);
    } catch (error) {
        console.error('[AdminCatalog] createProduct error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/admin/catalog/:shopId/products/import-multiple
const importMultipleProducts = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { masterProductIds } = req.body;

        if (!masterProductIds || !Array.isArray(masterProductIds) || masterProductIds.length === 0) {
            return res.status(400).json({ message: "No items selected for import" });
        }

        const shop = await Shop.findById(shopId).lean();
        if (!shop) return res.status(404).json({ message: "Shop not found" });

        const MasterProduct = require('../models/MasterProduct');
        const masterProducts = await MasterProduct.find({ _id: { $in: masterProductIds } }).lean();

        if (masterProducts.length === 0) {
            return res.status(404).json({ message: "Selected godown items not found" });
        }

        const newProducts = masterProducts.map(mp => ({
            name: mp.name,
            price: mp.price || 0,
            category: mp.category,
            quantity: mp.quantity || '',
            image: mp.image,
            gallery: mp.gallery || [],
            stock: mp.stock || 0,
            shopId: shop._id,
            inStock: true
        }));

        const inserted = await Product.insertMany(newProducts);
        await logAction(req.user._id, shop._id, 'multiple_products_imported', null, `${inserted.length} items from godown`);

        res.status(201).json({ message: `Successfully imported ${inserted.length} items`, products: inserted });
    } catch (error) {
        console.error('[AdminCatalog] importMultipleProducts error:', error);
        res.status(500).json({ message: "Server error during multiple import" });
    }
};

// PUT /api/admin/catalog/products/:id
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const changedFields = [];

        if (req.body.name && req.body.name !== product.name) {
            changedFields.push('name');
            product.name = req.body.name;
        }
        if (req.body.price !== undefined && Number(req.body.price) !== product.price) {
            changedFields.push('price');
            product.price = Number(req.body.price);
        }
        if (req.body.description !== undefined) {
            changedFields.push('description');
            product.description = req.body.description;
        }
        if (req.body.quantity !== undefined) {
            changedFields.push('quantity');
            product.quantity = req.body.quantity;
        }
        if (req.body.categoryId) {
            changedFields.push('category');
            product.category = req.body.categoryId;
        }
        if (req.body.inStock !== undefined) {
            changedFields.push('inStock');
            product.inStock = req.body.inStock;
        }
        if (req.body.isHidden !== undefined) {
            changedFields.push('isHidden');
            product.isHidden = req.body.isHidden;
        }

        // Handle image upload
        if (req.files && req.files['image']) {
            const { uploadStream } = require('../utils/cloudinary');
            const result = await uploadStream(req.files['image'][0].buffer, 'muna/products');
            product.image = result.secure_url;
            changedFields.push('image');
        } else if (req.body.image && req.body.image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(req.body.image, 'muna/products');
            product.image = result.secure_url;
            changedFields.push('image');
        } else if (req.body.image === '') {
            product.image = '';
            changedFields.push('image_removed');
        }

        // Handle gallery
        if (req.files && req.files['gallery']) {
            const { uploadStream } = require('../utils/cloudinary');
            let newGallery = [];
            for (const file of req.files['gallery']) {
                const result = await uploadStream(file.buffer, 'muna/products');
                newGallery.push(result.secure_url);
            }
            product.gallery = newGallery;
            changedFields.push('gallery');
        }

        const updated = await product.save();

        const actionType = changedFields.includes('image') || changedFields.includes('image_removed')
            ? 'image_changed' : 'product_edited';
        await logAction(req.user._id, product.shopId, actionType, product._id, product.name, { changedFields });

        res.status(200).json(updated);
    } catch (error) {
        console.error('[AdminCatalog] updateProduct error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/admin/catalog/products/:id
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const { shopId, name, _id } = product;
        await product.deleteOne();

        await logAction(req.user._id, shopId, 'product_deleted', _id, name);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error('[AdminCatalog] deleteProduct error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/admin/catalog/products/:id/stock
const toggleStock = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        product.inStock = !product.inStock;
        await product.save();

        await logAction(req.user._id, product.shopId, 'product_edited', product._id, product.name, {
            changedFields: ['inStock'], newValue: product.inStock
        });

        res.status(200).json(product);
    } catch (error) {
        console.error('[AdminCatalog] toggleStock error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/admin/catalog/products/:id/visibility
const toggleVisibility = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        product.isHidden = !product.isHidden;
        await product.save();

        await logAction(req.user._id, product.shopId, 'product_edited', product._id, product.name, {
            changedFields: ['isHidden'], newValue: product.isHidden
        });

        res.status(200).json(product);
    } catch (error) {
        console.error('[AdminCatalog] toggleVisibility error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════

// GET /api/admin/catalog/:shopId/categories
const getShopCategories = async (req, res) => {
    try {
        const { shopId } = req.params;
        const categories = await ItemCategory.find({ shopId }).sort({ sortOrder: 1, name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        console.error('[AdminCatalog] getShopCategories error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/admin/catalog/:shopId/categories
const createCategory = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: "Category name is required" });

        const shop = await Shop.findById(shopId).lean();
        if (!shop) return res.status(404).json({ message: "Shop not found" });

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

        const maxSort = await ItemCategory.findOne({ shopId: shop._id }).sort({ sortOrder: -1 });
        const sortOrder = maxSort ? maxSort.sortOrder + 1 : 0;

        const category = await ItemCategory.create({
            name: name.trim(),
            image,
            isGlobal: false,
            shopId: shop._id,
            vendorId: shop.vendorId,
            sortOrder
        });

        await logAction(req.user._id, shop._id, 'category_added', category._id, name.trim());
        res.status(201).json(category);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A category with this name already exists in this shop" });
        }
        console.error('[AdminCatalog] createCategory error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/admin/catalog/categories/:id
const updateCategory = async (req, res) => {
    try {
        const category = await ItemCategory.findById(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        if (req.body.name) category.name = req.body.name.trim();
        if (req.body.sortOrder !== undefined) category.sortOrder = req.body.sortOrder;

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
        await logAction(req.user._id, category.shopId, 'category_edited', category._id, category.name);
        res.status(200).json(updated);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A category with this name already exists" });
        }
        console.error('[AdminCatalog] updateCategory error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/admin/catalog/categories/:id?force=true
const deleteCategory = async (req, res) => {
    try {
        const category = await ItemCategory.findById(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        const productCount = await Product.countDocuments({ category: category._id });

        if (productCount > 0 && req.query.force !== 'true') {
            return res.status(400).json({
                message: `This category has ${productCount} product(s). Are you sure you want to delete it?`,
                productCount,
                requiresConfirmation: true
            });
        }

        const { shopId, name, _id } = category;
        await category.deleteOne();

        await logAction(req.user._id, shopId, 'category_deleted', _id, name, { productCount });
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error('[AdminCatalog] deleteCategory error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/admin/catalog/:shopId/categories/reorder
const reorderCategories = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { orderedIds } = req.body;
        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ message: "orderedIds must be an array" });
        }

        const bulkOps = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id, shopId },
                update: { sortOrder: index }
            }
        }));

        await ItemCategory.bulkWrite(bulkOps);
        const categories = await ItemCategory.find({ shopId }).sort({ sortOrder: 1, name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        console.error('[AdminCatalog] reorderCategories error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════
//  AUDIT LOGS
// ══════════════════════════════════════

// GET /api/admin/catalog/:shopId/audit-logs
const getAuditLogs = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { page, limit } = clampPagination(req.query.page, req.query.limit, 30, 100);

        const skip = (page - 1) * limit;
        const total = await AuditLog.countDocuments({ shopId });
        const logs = await AuditLog.find({ shopId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .populate('adminId', 'name email')
            .lean();

        res.status(200).json({
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('[AdminCatalog] getAuditLogs error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════
//  PRODUCT APPROVALS (PENDING VENDOR UPLOADS)
// ══════════════════════════════════════

// GET /api/admin/catalog/products/pending
const getPendingProducts = async (req, res) => {
    try {
        const pendingProducts = await Product.find({ approvalStatus: 'pending' })
            .populate('shopId', 'name vendorId location')
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json(pendingProducts);
    } catch (error) {
        console.error('[AdminCatalog] getPendingProducts error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/admin/catalog/products/:id/approve
const approveProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        product.approvalStatus = 'approved';
        await product.save();

        // Check if it exists in Godown, if not, add it automatically
        const MasterProduct = require('../models/MasterProduct');
        const existingMaster = await MasterProduct.findOne({ name: product.name });
        
        // Ensure category resolves to a string for Godown
        let catName = 'General';
        if (product.category) {
            if (typeof product.category === 'string') {
                catName = product.category;
            } else if (product.category.name) {
                catName = product.category.name; // In case it's populated
            } else {
                const ItemCategory = require('../models/ItemCategory');
                const catDoc = await ItemCategory.findById(product.category);
                if (catDoc) catName = catDoc.name;
            }
        }

        if (!existingMaster) {
            await MasterProduct.create({
                name: product.name,
                category: catName,
                price: product.price || 0,
                quantity: product.quantity || '',
                image: product.image,
                gallery: product.gallery || [],
                status: 'approved'
            });
        }

        res.status(200).json({ message: "Product approved and added to godown", product });
    } catch (error) {
        console.error('[AdminCatalog] approveProduct error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/admin/catalog/products/:id/reject
const rejectProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        product.approvalStatus = 'rejected';
        await product.save();

        res.status(200).json({ message: "Product rejected", product });
    } catch (error) {
        console.error('[AdminCatalog] rejectProduct error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getShopProducts,
    createProduct,
    importMultipleProducts,
    updateProduct,
    deleteProduct,
    toggleStock,
    toggleVisibility,
    getShopCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getAuditLogs,
    getPendingProducts,
    approveProduct,
    rejectProduct
};

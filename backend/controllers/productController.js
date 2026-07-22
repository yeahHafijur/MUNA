const Product = require('../models/Product');
const Shop = require('../models/Shop');
const MasterProduct = require('../models/MasterProduct');

const getBestsellers = async (req, res) => {
    try {
        const { lat, lng, radius = 100 } = req.query;

        if (!lat || !lng) {
            const globalBest = await Product.find({ inStock: true, approvalStatus: 'approved' })
                .sort({ salesCount: -1, isFeatured: -1 })
                .limit(12)
                .populate('shopId', 'name')
                .lean();
            return res.status(200).json(globalBest);
        }

        // 1. Find nearby shops (ignoring isActive to support legacy data)
        const nearbyShops = await Shop.find({
            'location.coordinates': {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseFloat(radius) * 1000
                }
            }
        }).select('_id').lean();

        const shopIds = nearbyShops.map(s => s._id);

        if (shopIds.length === 0) {
            return res.status(200).json([]); // No nearby shops
        }

        // 2. Fetch products from these shops, sorted by salesCount
        const bestsellers = await Product.find({
            shopId: { $in: shopIds },
            inStock: true,
            approvalStatus: 'approved'
        })
        .sort({ salesCount: -1, isFeatured: -1 })
        .limit(12)
        .populate('shopId', 'name')
        .lean();

        res.status(200).json(bestsellers);
    } catch (error) {
        console.error("Bestsellers Error:", error);
        res.status(500).json({ message: "Server error while fetching bestsellers" });
    }
};

const getProductsByShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const products = await Product.find({
            shopId: shopId,
            approvalStatus: 'approved'
        }).lean();
        if (!products || products.length === 0) {
            return res.status(404).json({ message: "no products found" })
        }

        const mongoose = require('mongoose');
        const ItemCategory = require('../models/ItemCategory');
        
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

        res.status(200).json(populatedProducts);

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        })
    }
};
const createProduct = async (req, res) => {
    try {
        const { name, price, category, categoryId, stock, quantity } = req.body;
        
        let image = req.body.image;
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

        const shop = await Shop.findOne({
            vendorId: req.user._id
        });
        if (!shop) {
            return res.status(400).json({
                message: "You are not a shop owner, create a shop first to add product"
            })
        }

        // Resolve category: prefer categoryId (ObjectId), fallback to string
        const resolvedCategory = categoryId || category || "General";

        // Check if item already exists in Godown (case-insensitive)
        const MasterProduct = require('../models/MasterProduct');
        let godownItem = null;
        if (name && typeof name === 'string') {
            // Escape regex chars to prevent regex crashes
            const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            godownItem = await MasterProduct.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } }).lean();
        }
        const status = godownItem ? 'approved' : 'pending';

        const product = await Product.create({
            name,
            price,
            category: resolvedCategory,
            quantity: quantity || '',
            image,
            gallery: galleryUrls,
            stock: stock || 0,
            shopId: shop._id,
            inStock: req.body.inStock !== undefined ? (req.body.inStock === 'true' || req.body.inStock === true) : true,
            approvalStatus: status
        });
        res.status(200).json(product);
    } catch (error) {
        console.error("Create Product Error:", error);
        res.status(500).json({ message: error.message || "Server error while creating product" });
    }
};

const getVendorCatalog = async (req, res) => {
    try {
        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        
        const products = await Product.find({ shopId: shop._id }).lean();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const importMultipleProducts = async (req, res) => {
    try {
        const { masterProductIds } = req.body;

        if (!masterProductIds || !Array.isArray(masterProductIds) || masterProductIds.length === 0) {
            return res.status(400).json({ message: "No items selected for import" });
        }

        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (!shop) {
            return res.status(400).json({ message: "You must create a shop first" });
        }

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
            inStock: true,
            approvalStatus: 'approved'
        }));

        const inserted = await Product.insertMany(newProducts);

        res.status(201).json({ message: `Successfully imported ${inserted.length} items`, products: inserted });
    } catch (error) {
        console.error("Vendor importMultipleProducts error:", error);
        res.status(500).json({ message: "Server error during multiple import" });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }
        if (product.shopId.toString() !== shop._id.toString()) {
            return res.status(403).json({ message: "You cannot update products of another shop!" });
        }
        product.name = req.body.name || product.name;
        product.price = req.body.price !== undefined ? req.body.price : product.price;
        if (req.body.quantity !== undefined) {
            product.quantity = req.body.quantity;
        }
        
        // Support both categoryId (ObjectId) and legacy category (string)
        if (req.body.categoryId) {
            product.category = req.body.categoryId;
        } else if (req.body.category) {
            product.category = req.body.category;
        }
        
        // Handle image: multipart file, base64, or URL
        if (req.files && req.files['image']) {
            const { uploadStream } = require('../utils/cloudinary');
            const result = await uploadStream(req.files['image'][0].buffer, 'muna/products');
            product.image = result.secure_url;
        } else if (req.body.image && req.body.image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(req.body.image, 'muna/products');
            product.image = result.secure_url;
        } else if (req.body.image) {
            product.image = req.body.image;
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
        } else if (req.body.gallery) {
            // If gallery is passed as an array of strings/URLs
            product.gallery = Array.isArray(req.body.gallery) ? req.body.gallery : [req.body.gallery];
        }

        product.inStock = req.body.inStock !== undefined ? req.body.inStock : product.inStock;
        const updatedProduct = await product.save();
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
// 4. Delete Product (Private)
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }
        if (product.shopId.toString() !== shop._id.toString()) {
            return res.status(403).json({ message: "You cannot delete products of another shop!" });
        }
        await product.deleteOne();
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const getProductDetail = async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findById(id).lean();

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Only allow viewing if approved (or if the requester is the vendor, but customer app doesn't send token, so we restrict to approved)
        if (product.approvalStatus && product.approvalStatus !== 'approved') {
            return res.status(404).json({ message: 'Product not found or pending approval' });
        }

        // Populate category manually if needed since we use mixed schema types for legacy
        if (product.category) {
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(product.category)) {
                const Category = require('../models/ItemCategory');
                try {
                    const catInfo = await Category.findById(product.category).lean();
                    if (catInfo) product.category = catInfo;
                } catch (err) {}
            }
        }

        res.status(200).json(product);
    } catch (error) {
        console.error("Error fetching product detail:", error);
        res.status(500).json({ message: 'Server error fetching product details' });
    }
};

module.exports = {
    getBestsellers,
    getProductsByShop,
    createProduct,
    importMultipleProducts,
    updateProduct,
    deleteProduct,
    getProductDetail,
    getVendorCatalog
};

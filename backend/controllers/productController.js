const Product = require('../models/Product');
const Shop = require('../models/Shop');
const MasterProduct = require('../models/MasterProduct');

const getBestsellers = async (req, res) => {
    try {
        const { lat, lng, radius = 100 } = req.query;

        if (!lat || !lng) {
            // Return top global products if no location provided (Fallback)
            const globalBest = await Product.find({ inStock: true })
                .sort({ salesCount: -1, isFeatured: -1 })
                .limit(12)
                .populate('shopId', 'name')
                .lean();
            return res.status(200).json(globalBest);
        }

        // 1. Find nearby active shops
        const nearbyShops = await Shop.find({
            isActive: true,
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseFloat(50000) * 1000 // 50,000 km covers the whole earth
                }
            }
        }).select('_id');

        const shopIds = nearbyShops.map(s => s._id);

        if (shopIds.length === 0) {
            return res.status(200).json([]); // No nearby shops
        }

        // 2. Fetch products from these shops, sorted by salesCount
        const bestsellers = await Product.find({
            shopId: { $in: shopIds },
            inStock: true
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
            shopId: shopId
        });
        if (!products || products.length === 0) {
            return res.status(404).json({ message: "no products found" })
        }

        // Manually populate category since the field is Mixed
        const mongoose = require('mongoose');
        const Category = require('../models/ItemCategory');
        const populatedProducts = await Promise.all(products.map(async p => {
            const prodObj = p.toObject();
            if (prodObj.category && mongoose.Types.ObjectId.isValid(prodObj.category)) {
                try {
                    const catInfo = await Category.findById(prodObj.category);
                    if (catInfo) prodObj.category = catInfo;
                } catch (err) { }
            }
            return prodObj;
        }));

        res.status(200).json(populatedProducts);

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        })
    }
};
const createProduct = async (req, res) => {
    try {
        const { name, price, category, categoryId, stock } = req.body;
        
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
        const resolvedCategory = categoryId || category;

        // --- MASTER GODOWN LOGIC ---
        try {
            const catName = typeof resolvedCategory === 'string' ? resolvedCategory : (category || 'General');
            await MasterProduct.create({
                name,
                category: catName,
                image,
                gallery: galleryUrls
            });
            console.log(`[Godown] New item pushed to approvals: ${name}`);
        } catch (err) {
            console.error("Master Godown error:", err);
        }
        // ---------------------------

        const product = await Product.create({
            name,
            price,
            category: resolvedCategory,
            image,
            gallery: galleryUrls,
            stock,
            shopId: shop._id
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (product.shopId.toString() !== shop._id.toString()) {
            return res.status(403).json({ message: "You cannot update products of another shop!" });
        }
        product.name = req.body.name || product.name;
        product.price = req.body.price !== undefined ? req.body.price : product.price;
        
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
        
        // Use .lean() for faster execution since we only need to read the data
        const product = await Product.findById(id).lean();

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
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
    updateProduct,
    deleteProduct,
    getProductDetail
};

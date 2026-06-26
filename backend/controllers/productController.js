const Product = require('../models/Product');
const Shop = require('../models/Shop');
const MasterProduct = require('../models/MasterProduct');

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
        if (req.file) {
            const { uploadStream } = require('../utils/cloudinary');
            const result = await uploadStream(req.file.buffer, 'muna/products');
            image = result.secure_url;
        } else if (image && image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(image, 'muna/products');
            image = result.secure_url;
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
                image
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
        if (req.file) {
            const { uploadStream } = require('../utils/cloudinary');
            const result = await uploadStream(req.file.buffer, 'muna/products');
            product.image = result.secure_url;
        } else if (req.body.image && req.body.image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(req.body.image, 'muna/products');
            product.image = result.secure_url;
        } else if (req.body.image) {
            product.image = req.body.image;
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
module.exports = {
    getProductsByShop,
    createProduct,
    updateProduct,
    deleteProduct
};

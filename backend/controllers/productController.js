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
        res.status(200).json(products);

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        })
    }
};
const createProduct = async (req, res) => {
    try {
        const { name, price, category, stock } = req.body;
        
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
                message: "You are not a shop owner,create a shop first to add product"
            })
        }

        // --- MASTER GODOWN LOGIC ---
        // Push every new item to the master godown as pending, regardless of whether it exists
        try {
            await MasterProduct.create({
                name,
                category,
                image
            });
            console.log(`📦 [Godown] New item pushed to approvals: ${name}`);
        } catch (err) {
            console.error("Master Godown error:", err);
            // Non-blocking error, continue to create product for shop
        }
        // ---------------------------

        const product = await Product.create({
            name,
            price,
            category,
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
        product.price = req.body.price || product.price;
        product.category = req.body.category || product.category;
        
        let newImage = req.body.image || product.image;
        if (req.body.image && req.body.image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(req.body.image, 'muna/products');
            newImage = result.secure_url;
        }
        product.image = newImage;
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

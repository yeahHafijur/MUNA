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
            message: "Server error", error: error.message
        })
    }
};
const createProduct = async (req, res) => {
    try {
        const { name, price, category, stock } = req.body;
        
        // Agar file upload hui hai toh uska path lo, warna agar direct link aaya hai toh wo lo
        const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

        const shop = await Shop.findOne({
            vendorId: req.user._id
        });
        if (!shop) {
            return res.status(400).json({
                message: "You are not a shop owner,create a shop first to add product"
            })
        }

        // --- MASTER GODOWN LOGIC ---
        // Check if this product already exists in the master godown
        try {
            const existingMaster = await MasterProduct.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });
            if (!existingMaster) {
                // Auto-contribute to global Godown
                await MasterProduct.create({
                    name,
                    category,
                    image
                });
                console.log(`📦 [Godown] New item auto-added: ${name}`);
            }
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
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product nahi mila" });
        }
        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (product.shopId.toString() !== shop._id.toString()) {
            return res.status(403).json({ message: "Aap kisi aur ki shop ka product update nahi kar sakte!" });
        }
        product.name = req.body.name || product.name;
        product.price = req.body.price || product.price;
        product.category = req.body.category || product.category;
        product.image = req.body.image || product.image;
        product.inStock = req.body.inStock !== undefined ? req.body.inStock : product.inStock;
        const updatedProduct = await product.save();
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
// 4. Delete Product (Private)
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product nahi mila" });
        }
        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (product.shopId.toString() !== shop._id.toString()) {
            return res.status(403).json({ message: "Aap kisi aur ki shop ka product delete nahi kar sakte!" });
        }
        await product.deleteOne();
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
module.exports = {
    getProductsByShop,
    createProduct,
    updateProduct,
    deleteProduct
};

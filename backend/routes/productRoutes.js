const express = require("express");
const router = express.Router();
const {
    getProductsByShop,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductDetail
} = require('../controllers/productController');
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require('../middleware/uploadMiddleware');

// Get single product detail
router.get("/detail/:id", getProductDetail);

// 1. Public Route: Get products by shop (Yeh wala gayab ho gaya tha)
router.get("/:shopId", getProductsByShop);

// 2. Protected Routes: Vendor apne products ko manage kare
router.post("/", protect, authorize("vendor"), upload.single('image'), createProduct);

// Yahan galti se deleteProduct likh diya tha, isey updateProduct karna hai
router.put("/:id", protect, authorize("vendor"), upload.single('image'), updateProduct);

// Aur ye naya route delete ke liye add karna hai
router.delete("/:id", protect, authorize("vendor"), deleteProduct);

module.exports = router;

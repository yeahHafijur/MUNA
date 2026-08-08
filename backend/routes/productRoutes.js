const express = require("express");
const router = express.Router();
const {
    getProductsByShop,
    createProduct,
    importMultipleProducts,
    updateProduct,
    deleteProduct,
    getProductDetail,
    getVendorCatalog
} = require('../controllers/productController');
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require('../middleware/uploadMiddleware');
const { validateUploadedImages } = upload;

// Get single product detail
router.get("/detail/:id", getProductDetail);

// Get bestsellers based on location
router.get("/bestsellers", require('../controllers/productController').getBestsellers);

// 1. Public Route: Get products by shop (Yeh wala gayab ho gaya tha)
router.get("/:shopId", getProductsByShop);

// 2. Protected Routes: Vendor apne products ko manage kare
const productUploadFields = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 4 }]);

router.get("/vendor/catalog", protect, authorize("vendor"), getVendorCatalog);
router.post("/", protect, authorize("vendor"), productUploadFields, validateUploadedImages, createProduct);
router.post("/import-multiple", protect, authorize("vendor"), importMultipleProducts);

// Yahan galti se deleteProduct likh diya tha, isey updateProduct karna hai
router.put("/:id", protect, authorize("vendor"), productUploadFields, validateUploadedImages, updateProduct);

// Aur ye naya route delete ke liye add karna hai
router.delete("/:id", protect, authorize("vendor"), deleteProduct);

module.exports = router;

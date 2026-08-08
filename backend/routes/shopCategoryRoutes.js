const express = require("express");
const router = express.Router();
const {
    getAllShopCategories,
    createShopCategory,
    updateShopCategory,
    deleteShopCategory
} = require('../controllers/shopCategoryController');
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require('../middleware/uploadMiddleware');
const { validateUploadedImages } = upload;

// Public: Get all shop categories
router.get("/", getAllShopCategories);

// Super Admin: Create shop category
router.post("/", protect, authorize("super_admin"), upload.single('image'), validateUploadedImages, createShopCategory);

// Super Admin: Update shop category
router.put("/:id", protect, authorize("super_admin"), upload.single('image'), validateUploadedImages, updateShopCategory);

// Super Admin: Delete shop category
router.delete("/:id", protect, authorize("super_admin"), deleteShopCategory);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
    getCategoriesByShop,
    getGlobalCategories,
    createCategory,
    createGlobalCategory,
    updateCategory,
    deleteCategory,
    reorderCategories
} = require('../controllers/categoryController');
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require('../middleware/uploadMiddleware');
const { validateUploadedImages } = upload;

// Public: Get global item categories only
router.get("/global", getGlobalCategories);

// Vendor: Reorder categories
router.put("/reorder/bulk", protect, authorize("vendor"), reorderCategories);

// Public: Get categories for a shop (global + custom)
router.get("/:shopId", getCategoriesByShop);

// Vendor or Super Admin: Create custom item category
router.post("/", protect, authorize("vendor", "super_admin"), upload.single('image'), validateUploadedImages, createCategory);

// Super Admin: Create global item category
router.post("/global", protect, authorize("super_admin"), upload.single('image'), validateUploadedImages, createGlobalCategory);

// Vendor or Super Admin: Update category
router.put("/:id", protect, authorize("vendor", "super_admin"), upload.single('image'), validateUploadedImages, updateCategory);

// Vendor or Super Admin: Delete category
router.delete("/:id", protect, authorize("vendor", "super_admin"), deleteCategory);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
    getCategoriesByShop,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories
} = require('../controllers/categoryController');
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require('../middleware/uploadMiddleware');

// Public: Get categories for a shop
router.get("/:shopId", getCategoriesByShop);

// Vendor: Create category
router.post("/", protect, authorize("vendor"), upload.single('image'), createCategory);

// Vendor: Update category
router.put("/:id", protect, authorize("vendor"), upload.single('image'), updateCategory);

// Vendor: Delete category
router.delete("/:id", protect, authorize("vendor"), deleteCategory);

// Vendor: Reorder categories
router.put("/reorder/bulk", protect, authorize("vendor"), reorderCategories);

module.exports = router;

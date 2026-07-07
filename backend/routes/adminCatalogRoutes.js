const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    getShopProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleStock,
    toggleVisibility,
    getShopCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getAuditLogs
} = require('../controllers/adminCatalogController');

// All routes require super_admin
const auth = [protect, authorize('super_admin')];
const productUploadFields = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 4 }]);

// ── Products ──
router.get('/:shopId/products', ...auth, getShopProducts);
router.post('/:shopId/products', ...auth, productUploadFields, createProduct);
router.put('/products/:id', ...auth, productUploadFields, updateProduct);
router.delete('/products/:id', ...auth, deleteProduct);
router.patch('/products/:id/stock', ...auth, toggleStock);
router.patch('/products/:id/visibility', ...auth, toggleVisibility);

// ── Categories ──
router.get('/:shopId/categories', ...auth, getShopCategories);
router.post('/:shopId/categories', ...auth, upload.single('image'), createCategory);
router.put('/categories/:id', ...auth, upload.single('image'), updateCategory);
router.delete('/categories/:id', ...auth, deleteCategory);
router.put('/:shopId/categories/reorder', ...auth, reorderCategories);

// ── Audit Logs ──
router.get('/:shopId/audit-logs', ...auth, getAuditLogs);

module.exports = router;

const express = require('express');
const router = express.Router();
const { 
    getAllMasterProducts, 
    createMasterProduct, 
    updateMasterProduct, 
    deleteMasterProduct,
    approveMasterProduct
} = require('../controllers/masterProductController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// GET /api/master-products (Public or authenticated, depending on usage. Currently public/all users can see)
router.get('/', getAllMasterProducts);

// Super Admin Only Routes
router.post('/', protect, authorize('super_admin'), upload.single('image'), createMasterProduct);
router.put('/:id', protect, authorize('super_admin'), upload.single('image'), updateMasterProduct);
router.put('/:id/approve', protect, authorize('super_admin'), approveMasterProduct);
router.delete('/:id', protect, authorize('super_admin'), deleteMasterProduct);

module.exports = router;

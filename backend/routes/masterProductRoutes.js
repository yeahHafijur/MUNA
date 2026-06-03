const express = require('express');
const router = express.Router();
const { 
    getAllMasterProducts, 
    createMasterProduct, 
    updateMasterProduct, 
    deleteMasterProduct 
} = require('../controllers/masterProductController');
const { protect, superAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// GET /api/master-products (Public or authenticated, depending on usage. Currently public/all users can see)
router.get('/', getAllMasterProducts);

// Super Admin Only Routes
router.post('/', protect, superAdmin, upload.single('image'), createMasterProduct);
router.put('/:id', protect, superAdmin, upload.single('image'), updateMasterProduct);
router.delete('/:id', protect, superAdmin, deleteMasterProduct);

module.exports = router;

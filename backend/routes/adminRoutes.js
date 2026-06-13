const express = require('express');
const router = express.Router();
const { onboardVendorAndShop } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route to onboard a new vendor and their shop
// /api/admin/onboard
router.post('/onboard', protect, authorize('super_admin'), onboardVendorAndShop);

module.exports = router;

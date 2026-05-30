const express = require('express');
const router = express.Router();
const { onboardVendorAndShop } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Route to onboard a new vendor and their shop
// /api/admin/onboard
router.post('/onboard', protect, onboardVendorAndShop);

module.exports = router;

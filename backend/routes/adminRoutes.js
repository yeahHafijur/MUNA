const express = require('express');
const router = express.Router();
const { onboardVendorAndShop, broadcastNotification } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Route to onboard a new vendor and their shop
// /api/admin/onboard
router.post('/onboard', protect, authorize('super_admin'), upload.single('image'), onboardVendorAndShop);

// Route to broadcast notification to users
// /api/admin/broadcast
router.post('/broadcast', protect, authorize('super_admin'), broadcastNotification);

module.exports = router;

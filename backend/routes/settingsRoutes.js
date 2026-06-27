const express = require('express');
const router = express.Router();
const { getNavbarMessage, updateNavbarMessage, getFeaturedItems, updateFeaturedItems } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to get navbar message
router.get('/navbar-message', getNavbarMessage);

// Protected route (SuperAdmin) to update navbar message
router.put('/navbar-message', protect, authorize('super_admin'), updateNavbarMessage);

// Featured items for homepage carousel
router.get('/featured-items', getFeaturedItems);
router.put('/featured-items', protect, authorize('super_admin'), updateFeaturedItems);

module.exports = router;

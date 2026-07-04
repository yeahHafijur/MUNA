const express = require('express');
const router = express.Router();
const { getBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getBanners)
    .post(protect, authorize('superadmin', 'admin'), createBanner);

router.route('/:id')
    .put(protect, authorize('superadmin', 'admin'), updateBanner)
    .delete(protect, authorize('superadmin', 'admin'), deleteBanner);

module.exports = router;

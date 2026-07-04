const express = require('express');
const router = express.Router();
const { getBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getBanners)
    .post(protect, authorize('super_admin', 'admin'), createBanner);

router.route('/:id')
    .put(protect, authorize('super_admin', 'admin'), updateBanner)
    .delete(protect, authorize('super_admin', 'admin'), deleteBanner);

module.exports = router;

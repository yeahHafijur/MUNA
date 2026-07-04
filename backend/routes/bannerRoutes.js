const express = require('express');
const router = express.Router();
const { getBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(getBanners)
    .post(protect, authorize('super_admin', 'admin'), upload.single('image'), createBanner);

router.route('/:id')
    .put(protect, authorize('super_admin', 'admin'), upload.single('image'), updateBanner)
    .delete(protect, authorize('super_admin', 'admin'), deleteBanner);

module.exports = router;

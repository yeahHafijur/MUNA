const express = require('express');
const router = express.Router();
const { getBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateUploadedImages } = upload;

router.route('/')
    .get(getBanners)
    .post(protect, authorize('super_admin'), upload.single('image'), validateUploadedImages, createBanner);

router.route('/:id')
    .put(protect, authorize('super_admin'), upload.single('image'), validateUploadedImages, updateBanner)
    .delete(protect, authorize('super_admin'), deleteBanner);

module.exports = router;

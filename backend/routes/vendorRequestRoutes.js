const express = require('express');
const router = express.Router();
const {
    createVendorRequest,
    getVendorRequests,
    updateVendorRequestStatus
} = require('../controllers/vendorRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateUploadedImages } = upload;

// Customer: Submit a new vendor request
router.post('/', protect, upload.single('image'), validateUploadedImages, createVendorRequest);

// Super Admin: Get all requests
router.get('/', protect, authorize('super_admin'), getVendorRequests);

// Super Admin: Update request status
router.put('/:id/status', protect, authorize('super_admin'), updateVendorRequestStatus);

module.exports = router;

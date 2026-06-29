const express = require('express');
const router = express.Router();
const { postItem, getNearbyItems, getMyItems, updateStatus, deleteItem, getItemById } = require('../controllers/liveBazarController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public route to get nearby items
router.get('/', getNearbyItems);

// Protected routes
router.post('/', protect, upload.single('image'), postItem);
router.get('/me', protect, getMyItems);
router.put('/:id/status', protect, updateStatus);
router.delete('/:id', protect, deleteItem);
router.get('/:id', getItemById);

module.exports = router;

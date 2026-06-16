const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
} = require('../controllers/notificationController');

// Get all notifications for user
router.get('/', protect, getNotifications);

// Mark a specific notification as read
router.put('/:id/read', protect, markAsRead);

// Mark all notifications as read
router.put('/read-all', protect, markAllAsRead);

// Delete a notification
router.delete('/:id', protect, deleteNotification);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getNotifications, 
    getUnreadCount,
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
} = require('../controllers/notificationController');

// Get all notifications for user
router.get('/', protect, getNotifications);

// Get unread notification count
router.get('/unread-count', protect, getUnreadCount);

// Mark all notifications as read
router.put('/read-all', protect, markAllAsRead);

// Mark a specific notification as read
router.put('/:id/read', protect, markAsRead);

// Delete a notification
router.delete('/:id', protect, deleteNotification);

module.exports = router;

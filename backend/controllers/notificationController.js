const Notification = require('../models/Notification');

// Get all notifications for the logged-in user
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50); // Get latest 50 notifications
            
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Server error while fetching notifications." });
    }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
        res.status(200).json({ count });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Mark a single notification as read
const markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId: req.user._id },
            { isRead: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        
        res.status(200).json(notification);
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Mark all notifications as read for the user
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true }
        );
        res.status(200).json({ message: "All notifications marked as read." });
    } catch (error) {
        console.error("Error marking all as read:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a notification
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        
        res.status(200).json({ message: "Notification deleted." });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};

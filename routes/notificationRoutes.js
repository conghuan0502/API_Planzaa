const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all notification routes
router.use(protect);

// Get all notifications for the authenticated user (with pagination and filters)
router.get('/', notificationController.getNotifications);

// Get notification statistics
router.get('/stats', notificationController.getNotificationStats);

// Mark a specific notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Delete a specific notification
router.delete('/:id', notificationController.deleteNotification);

// Clear all read notifications
router.delete('/clear-all', notificationController.clearAllRead);

module.exports = router;

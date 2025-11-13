const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         type:
 *           type: string
 *           enum: [host_announcement, event_created, event_updated, event_cancelled, event_reminder_24h, event_reminder_2h, event_reminder_30m, rsvp_confirmed, rsvp_declined, rsvp_maybe, weather_alert, system]
 *         title:
 *           type: string
 *         body:
 *           type: string
 *         data:
 *           type: object
 *         isRead:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user's notifications
 *     description: Retrieve paginated list of notifications for the authenticated user
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notifications per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Filter to show only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     totalCount:
 *                       type: number
 *                     unreadCount:
 *                       type: number
 *                     hasMore:
 *                       type: boolean
 *                     currentPage:
 *                       type: number
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const skip = (page - 1) * limit;

    console.log(`📬 Fetching notifications for user ${userId} - page: ${page}, limit: ${limit}, unreadOnly: ${unreadOnly}`);

    // Build query
    const query = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    // Get notifications with pagination
    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, isRead: false })
    ]);

    // Transform _id to id for frontend compatibility
    const transformedNotifications = notifications.map(notification => ({
      ...notification,
      id: notification._id.toString()
    }));

    const hasMore = skip + notifications.length < totalCount;

    console.log(`✅ Retrieved ${notifications.length} notifications (${unreadCount} unread)`);

    res.status(200).json({
      status: 'success',
      data: {
        notifications: transformedNotifications,
        totalCount,
        unreadCount,
        hasMore,
        currentPage: page
      }
    });

  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Error fetching notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     description: Get total, unread, and read count for the authenticated user
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 */
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalCount, unreadCount] = await Promise.all([
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false })
    ]);

    const readCount = totalCount - unreadCount;

    console.log(`📊 Notification stats for user ${userId}: ${unreadCount} unread, ${readCount} read`);

    res.status(200).json({
      status: 'success',
      data: {
        totalCount,
        unreadCount,
        readCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching notification stats:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Error fetching notification stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid notification ID'
      });
    }

    const notification = await Notification.findOne({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found'
      });
    }

    if (notification.isRead) {
      return res.status(200).json({
        status: 'success',
        message: 'Notification already marked as read',
        data: {
          notification: {
            ...notification.toObject(),
            id: notification._id.toString()
          }
        }
      });
    }

    await notification.markAsRead();

    console.log(`✅ Notification ${id} marked as read`);

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: {
        notification: {
          ...notification.toObject(),
          id: notification._id.toString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Error marking notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Mark all notifications for the authenticated user as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.markAllAsReadForUser(userId);

    console.log(`✅ Marked ${result.modifiedCount} notifications as read for user ${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Error marking all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     description: Delete a specific notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid notification ID'
      });
    }

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found'
      });
    }

    console.log(`✅ Notification ${id} deleted`);

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Error deleting notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/notifications/clear-all:
 *   delete:
 *     summary: Clear all read notifications
 *     description: Delete all read notifications for the authenticated user
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Read notifications cleared
 */
exports.clearAllRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({ userId, isRead: true });

    console.log(`✅ Deleted ${result.deletedCount} read notifications for user ${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'All read notifications cleared',
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('❌ Error clearing read notifications:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Error clearing read notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to create a notification (used by other controllers)
exports.createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    console.log(`📬 Notification created: ${notification._id} for user ${notification.userId}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

// Helper function to create notifications for multiple users
exports.createNotificationsForUsers = async (userIds, notificationTemplate) => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      ...notificationTemplate
    }));

    const result = await Notification.insertMany(notifications);
    console.log(`📬 Created ${result.length} notifications`);
    return result;
  } catch (error) {
    console.error('❌ Error creating notifications for users:', error);
    throw error;
  }
};

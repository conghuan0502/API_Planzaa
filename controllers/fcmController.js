const { getMessaging } = require('../config/firebase');
const Event = require('../models/eventModel');
const User = require('../models/userModel');

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationPayload:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Notification title
 *         body:
 *           type: string
 *           description: Notification body/message
 *         data:
 *           type: object
 *           description: Additional data payload
 *         imageUrl:
 *           type: string
 *           description: Optional image URL for notification
 *     
 *     SendNotificationRequest:
 *       type: object
 *       required:
 *         - tokens
 *         - title
 *         - body
 *       properties:
 *         tokens:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of FCM registration tokens
 *         title:
 *           type: string
 *           description: Notification title
 *         body:
 *           type: string
 *           description: Notification body/message
 *         data:
 *           type: object
 *           description: Additional data payload
 *         imageUrl:
 *           type: string
 *           description: Optional image URL for notification
 */

/**
 * @swagger
 * /api/fcm/send:
 *   post:
 *     summary: Send push notification to specific tokens
 *     description: Send a push notification to a list of FCM registration tokens
 *     tags: [FCM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendNotificationRequest'
 *     responses:
 *       200:
 *         description: Notification sent successfully
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
 *                     successCount:
 *                       type: number
 *                       description: Number of successful notifications
 *                     failureCount:
 *                       type: number
 *                       description: Number of failed notifications
 *                     results:
 *                       type: array
 *                       description: Detailed results for each token
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 */
// Send push notification to specific tokens
exports.sendNotification = async (req, res) => {
  try {
    const { tokens, title, body, data = {}, imageUrl } = req.body;

    // Validate required parameters
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Tokens array is required and must not be empty'
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        status: 'fail',
        message: 'Title and body are required'
      });
    }

    // Get Firebase messaging service
    const messaging = getMessaging();

    // Prepare notification payload
    const payload = {
      notification: {
        title: title,
        body: body,
        ...(imageUrl && { image: imageUrl })
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'event_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    // Send notification to multiple tokens
    const response = await messaging.sendMulticast({
      tokens: tokens,
      ...payload
    });

    // Process results
    const results = response.responses.map((result, index) => ({
      token: tokens[index],
      success: result.success,
      error: result.error?.code || null,
      messageId: result.messageId || null
    }));

    const successCount = response.successCount;
    const failureCount = response.failureCount;

    // Log results
    console.log(`📱 FCM Notification Results: ${successCount} success, ${failureCount} failed`);

    res.status(200).json({
      status: 'success',
      data: {
        successCount,
        failureCount,
        results
      }
    });

  } catch (error) {
    console.error('❌ FCM Send Error:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Error sending notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/fcm/event/{eventId}:
 *   post:
 *     summary: Send notification to event participants
 *     description: Send a push notification to all participants of a specific event
 *     tags: [FCM]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *                 description: Notification title
 *               body:
 *                 type: string
 *                 description: Notification body/message
 *               data:
 *                 type: object
 *                 description: Additional data payload
 *               imageUrl:
 *                 type: string
 *                 description: Optional image URL for notification
 *     responses:
 *       200:
 *         description: Notification sent to event participants
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
 *                     eventId:
 *                       type: string
 *                     participantCount:
 *                       type: number
 *                     successCount:
 *                       type: number
 *                     failureCount:
 *                       type: number
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Send notification to event participants
exports.sendEventNotification = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, body, data = {}, imageUrl } = req.body;

    // Validate required parameters
    if (!title || !body) {
      return res.status(400).json({
        status: 'fail',
        message: 'Title and body are required'
      });
    }

    // Find the event and populate participants
    const event = await Event.findById(eventId).populate('participants', 'fcmToken name email');
    
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Extract FCM tokens from participants
    const tokens = event.participants
      .filter(participant => participant.fcmToken)
      .map(participant => participant.fcmToken);

    if (tokens.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'No participants with valid FCM tokens found'
      });
    }

    // Get Firebase messaging service
    const messaging = getMessaging();

    // Prepare notification payload with event data
    const payload = {
      notification: {
        title: title,
        body: body,
        ...(imageUrl && { image: imageUrl })
      },
      data: {
        ...data,
        eventId: eventId,
        eventTitle: event.title,
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'event_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    // Send notification to event participants
    const response = await messaging.sendMulticast({
      tokens: tokens,
      ...payload
    });

    // Process results
    const results = response.responses.map((result, index) => ({
      token: tokens[index],
      success: result.success,
      error: result.error?.code || null,
      messageId: result.messageId || null
    }));

    const successCount = response.successCount;
    const failureCount = response.failureCount;

    // Log results
    console.log(`📱 Event Notification Results for ${event.title}: ${successCount} success, ${failureCount} failed`);

    res.status(200).json({
      status: 'success',
      data: {
        eventId: eventId,
        eventTitle: event.title,
        participantCount: event.participants.length,
        successCount,
        failureCount,
        results
      }
    });

  } catch (error) {
    console.error('❌ FCM Event Notification Error:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Error sending event notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/fcm/user/{userId}:
 *   post:
 *     summary: Send notification to a specific user
 *     description: Send a push notification to a specific user by their ID
 *     tags: [FCM]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *             type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *                 description: Notification title
 *               body:
 *                 type: string
 *                 description: Notification body/message
 *               data:
 *                 type: object
 *                 description: Additional data payload
 *               imageUrl:
 *                 type: string
 *                 description: Optional image URL for notification
 *     responses:
 *       200:
 *         description: Notification sent to user
 *         content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: success
 *                   data:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       userName:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       messageId:
 *                         type: string
 *       404:
 *         description: User not found or no FCM token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 */
// Send notification to a specific user
exports.sendUserNotification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, body, data = {}, imageUrl } = req.body;

    // Validate required parameters
    if (!title || !body) {
      return res.status(400).json({
        status: 'fail',
        message: 'Title and body are required'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    if (!user.fcmToken) {
      return res.status(404).json({
        status: 'fail',
        message: 'User does not have an FCM token registered'
      });
    }

    // Get Firebase messaging service
    const messaging = getMessaging();

    // Prepare notification payload
    const payload = {
      token: user.fcmToken,
      notification: {
        title: title,
        body: body,
        ...(imageUrl && { image: imageUrl })
      },
      data: {
        ...data,
        userId: userId,
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'event_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    // Send notification
    const response = await messaging.send(payload);

    // Log result
    console.log(`📱 User Notification sent to ${user.name}: ${response}`);

    res.status(200).json({
      status: 'success',
      data: {
        userId: userId,
        userName: user.name,
        success: true,
        messageId: response
      }
    });

  } catch (error) {
    console.error('❌ FCM User Notification Error:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Error sending user notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/fcm/reminder/test:
 *   post:
 *     summary: Test reminder notifications for an event
 *     description: Manually trigger reminder notifications for testing purposes
 *     tags: [FCM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - reminderType
 *             properties:
 *               eventId:
 *                 type: string
 *                 description: Event ID to send reminder for
 *               reminderType:
 *                 type: string
 *                 enum: [24h, 2h, 30m]
 *                 description: Type of reminder to send
 *     responses:
 *       200:
 *         description: Reminder sent successfully
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
 *                     eventId:
 *                       type: string
 *                     reminderType:
 *                       type: string
 *                     successCount:
 *                       type: number
 *                     failureCount:
 *                       type: number
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Test reminder notification for an event
exports.testEventReminder = async (req, res) => {
  try {
    const { eventId, reminderType } = req.body;

    if (!eventId || !reminderType) {
      return res.status(400).json({
        status: 'fail',
        message: 'Event ID and reminder type are required'
      });
    }

    if (!['24h', '2h', '30m'].includes(reminderType)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Reminder type must be one of: 24h, 2h, 30m'
      });
    }

    const Event = require('../models/eventModel');
    const event = await Event.findById(eventId).populate('participants', 'fcmToken name notificationSettings');
    
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Import notification scheduler
    const notificationScheduler = require('../services/notificationScheduler');
    
    // Send reminder notification
    await notificationScheduler.sendEventReminder(event, reminderType);

    // Filter eligible participants for response
    const eligibleParticipants = event.participants.filter(participant => 
      participant.fcmToken && 
      participant.notificationSettings?.eventReminders !== false &&
      participant.notificationSettings?.pushNotifications !== false
    );

    res.status(200).json({
      status: 'success',
      data: {
        eventId: eventId,
        eventTitle: event.title,
        reminderType: reminderType,
        eligibleParticipants: eligibleParticipants.length,
        message: `${reminderType} reminder sent successfully`
      }
    });

  } catch (error) {
    console.error('❌ FCM Test Reminder Error:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Error sending test reminder',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/fcm/reminder/status:
 *   get:
 *     summary: Get reminder scheduler status
 *     description: Get the current status of the notification scheduler
 *     tags: [FCM]
 *     responses:
 *       200:
 *         description: Scheduler status retrieved successfully
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
 *                     isRunning:
 *                       type: boolean
 *                     activeJobs:
 *                       type: array
 *                       items:
 *                         type: string
 *                     uptime:
 *                       type: number
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get reminder scheduler status
exports.getReminderStatus = async (req, res) => {
  try {
    const notificationScheduler = require('../services/notificationScheduler');
    const status = notificationScheduler.getStatus();

    res.status(200).json({
      status: 'success',
      data: status
    });
  } catch (error) {
    console.error('❌ FCM Reminder Status Error:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Error getting reminder status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to send automatic event notifications
exports.sendAutomaticEventNotification = async (eventId, notificationType, additionalData = {}) => {
  try {
    const event = await Event.findById(eventId).populate('participants', 'fcmToken name email');
    
    if (!event) {
      console.log(`❌ Event ${eventId} not found for automatic notification`);
      return;
    }

    // Extract FCM tokens from participants
    const tokens = event.participants
      .filter(participant => participant.fcmToken)
      .map(participant => participant.fcmToken);

    if (tokens.length === 0) {
      console.log(`⚠️ No participants with FCM tokens for event ${event.title}`);
      return;
    }

    // Get Firebase messaging service
    const messaging = getMessaging();

    // Prepare notification based on type
    let title, body;
    switch (notificationType) {
      case 'event_created':
        title = 'New Event Created!';
        body = `"${event.title}" has been created. Check it out!`;
        break;
      case 'event_updated':
        title = 'Event Updated';
        body = `"${event.title}" has been updated.`;
        break;
      case 'event_cancelled':
        title = 'Event Cancelled';
        body = `"${event.title}" has been cancelled.`;
        break;
      case 'event_reminder':
        title = 'Event Reminder';
        body = `"${event.title}" is coming up soon!`;
        break;
      case 'weather_alert':
        title = 'Weather Alert';
        body = `Weather update for "${event.title}": ${additionalData.weatherDescription || 'Check the latest forecast'}`;
        break;
      default:
        title = 'Event Notification';
        body = `Update for "${event.title}"`;
    }

    // Prepare notification payload
    const payload = {
      notification: {
        title: title,
        body: body
      },
      data: {
        eventId: eventId,
        eventTitle: event.title,
        notificationType: notificationType,
        timestamp: new Date().toISOString(),
        ...additionalData
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'event_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    // Send notification to event participants
    const response = await messaging.sendMulticast({
      tokens: tokens,
      ...payload
    });

    console.log(`📱 Automatic ${notificationType} notification sent for "${event.title}": ${response.successCount} success, ${response.failureCount} failed`);

    return response;

  } catch (error) {
    console.error(`❌ Error sending automatic ${notificationType} notification:`, error);
    throw error;
  }
};

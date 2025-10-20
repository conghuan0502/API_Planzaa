const express = require('express');
const fcmController = require('../controllers/fcmController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

// Apply authentication middleware to all FCM routes
router.use(protect);

// Send push notification to specific tokens
router.post('/send', fcmController.sendNotification);

// Send notification to event participants
router.post('/event/:eventId', fcmController.sendEventNotification);

// Send notification to a specific user
router.post('/user/:userId', fcmController.sendUserNotification);

// Reminder notification routes
router.post('/reminder/test', fcmController.testEventReminder);
router.get('/reminder/status', fcmController.getReminderStatus);

module.exports = router;

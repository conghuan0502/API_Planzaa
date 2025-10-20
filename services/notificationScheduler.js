const cron = require('node-cron');
const Event = require('../models/eventModel');
const { sendAutomaticEventNotification } = require('../controllers/fcmController');

class NotificationScheduler {
  constructor() {
    this.isRunning = false;
    this.jobs = new Map();
  }

  /**
   * Start the notification scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Notification scheduler is already running');
      return;
    }

    console.log('🕐 Starting notification scheduler...');

    // Run every minute to check for upcoming events
    const checkRemindersJob = cron.schedule('* * * * *', async () => {
      await this.checkAndSendReminders();
    }, {
      scheduled: false
    });

    checkRemindersJob.start();
    this.jobs.set('checkReminders', checkRemindersJob);
    this.isRunning = true;

    console.log('✅ Notification scheduler started successfully');
  }

  /**
   * Stop the notification scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Notification scheduler is not running');
      return;
    }

    console.log('🛑 Stopping notification scheduler...');

    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`   Stopped job: ${name}`);
    });

    this.jobs.clear();
    this.isRunning = false;

    console.log('✅ Notification scheduler stopped successfully');
  }

  /**
   * Check for events that need reminder notifications
   */
  async checkAndSendReminders() {
    try {
      const now = new Date();
      
      // Check for 24-hour reminders
      await this.check24HourReminders(now);
      
      // Check for 2-hour reminders
      await this.check2HourReminders(now);
      
      // Check for 30-minute reminders
      await this.check30MinuteReminders(now);

    } catch (error) {
      console.error('❌ Error in notification scheduler:', error.message);
    }
  }

  /**
   * Check for events that need 24-hour reminders
   */
  async check24HourReminders(now) {
    const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    const twentyFourHoursBuffer = new Date(now.getTime() + (24 * 60 * 60 * 1000) + (60 * 1000)); // 1 minute buffer

    try {
      const events = await Event.find({
        startDate: {
          $gte: twentyFourHoursFromNow,
          $lte: twentyFourHoursBuffer
        },
        'reminders.sent24h': { $ne: true }, // Haven't sent 24h reminder yet
        status: { $ne: 'cancelled' }
      }).populate('participants', 'fcmToken name notificationSettings');

      for (const event of events) {
        await this.sendEventReminder(event, '24h');
        
        // Mark 24h reminder as sent
        await Event.findByIdAndUpdate(event._id, {
          $set: { 'reminders.sent24h': true }
        });
      }

      if (events.length > 0) {
        console.log(`📅 Sent 24h reminders for ${events.length} events`);
      }

    } catch (error) {
      console.error('❌ Error checking 24h reminders:', error.message);
    }
  }

  /**
   * Check for events that need 2-hour reminders
   */
  async check2HourReminders(now) {
    const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    const twoHoursBuffer = new Date(now.getTime() + (2 * 60 * 60 * 1000) + (60 * 1000)); // 1 minute buffer

    try {
      const events = await Event.find({
        startDate: {
          $gte: twoHoursFromNow,
          $lte: twoHoursBuffer
        },
        'reminders.sent2h': { $ne: true }, // Haven't sent 2h reminder yet
        status: { $ne: 'cancelled' }
      }).populate('participants', 'fcmToken name notificationSettings');

      for (const event of events) {
        await this.sendEventReminder(event, '2h');
        
        // Mark 2h reminder as sent
        await Event.findByIdAndUpdate(event._id, {
          $set: { 'reminders.sent2h': true }
        });
      }

      if (events.length > 0) {
        console.log(`⏰ Sent 2h reminders for ${events.length} events`);
      }

    } catch (error) {
      console.error('❌ Error checking 2h reminders:', error.message);
    }
  }

  /**
   * Check for events that need 30-minute reminders
   */
  async check30MinuteReminders(now) {
    const thirtyMinutesFromNow = new Date(now.getTime() + (30 * 60 * 1000));
    const thirtyMinutesBuffer = new Date(now.getTime() + (30 * 60 * 1000) + (60 * 1000)); // 1 minute buffer

    try {
      const events = await Event.find({
        startDate: {
          $gte: thirtyMinutesFromNow,
          $lte: thirtyMinutesBuffer
        },
        'reminders.sent30m': { $ne: true }, // Haven't sent 30m reminder yet
        status: { $ne: 'cancelled' }
      }).populate('participants', 'fcmToken name notificationSettings');

      for (const event of events) {
        await this.sendEventReminder(event, '30m');
        
        // Mark 30m reminder as sent
        await Event.findByIdAndUpdate(event._id, {
          $set: { 'reminders.sent30m': true }
        });
      }

      if (events.length > 0) {
        console.log(`🚀 Sent 30m reminders for ${events.length} events`);
      }

    } catch (error) {
      console.error('❌ Error checking 30m reminders:', error.message);
    }
  }

  /**
   * Send reminder notification for a specific event
   */
  async sendEventReminder(event, reminderType) {
    try {
      // Filter participants who have notifications enabled
      const eligibleParticipants = event.participants.filter(participant => 
        participant.fcmToken && 
        participant.notificationSettings?.eventReminders !== false &&
        participant.notificationSettings?.pushNotifications !== false
      );

      if (eligibleParticipants.length === 0) {
        console.log(`⚠️ No eligible participants for ${reminderType} reminder: ${event.title}`);
        return;
      }

      // Prepare reminder message based on type
      const reminderData = this.getReminderMessage(event, reminderType);

      // Send notification to eligible participants
      const tokens = eligibleParticipants.map(p => p.fcmToken);
      
      const { getMessaging } = require('../config/firebase');
      const messaging = getMessaging();

      const payload = {
        notification: {
          title: reminderData.title,
          body: reminderData.body
        },
        data: {
          eventId: event._id.toString(),
          eventTitle: event.title,
          notificationType: `event_reminder_${reminderType}`,
          reminderType: reminderType,
          eventStartTime: event.startDate.toISOString(),
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'event_reminders',
            icon: 'ic_notification'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              category: 'EVENT_REMINDER'
            }
          }
        }
      };

      const response = await messaging.sendMulticast({
        tokens: tokens,
        ...payload
      });

      console.log(`📱 ${reminderType} reminder sent for "${event.title}": ${response.successCount} success, ${response.failureCount} failed`);

      // Log failed tokens for cleanup
      if (response.failureCount > 0) {
        response.responses.forEach((result, index) => {
          if (!result.success && result.error?.code === 'messaging/invalid-registration-token') {
            console.log(`⚠️ Invalid token for participant ${eligibleParticipants[index].name}: ${tokens[index]}`);
          }
        });
      }

    } catch (error) {
      console.error(`❌ Error sending ${reminderType} reminder for event ${event.title}:`, error.message);
    }
  }

  /**
   * Get reminder message based on type and event details
   */
  getReminderMessage(event, reminderType) {
    const eventTime = new Date(event.startDate);
    const timeString = eventTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    switch (reminderType) {
      case '24h':
        return {
          title: 'Event Tomorrow! 📅',
          body: `"${event.title}" is tomorrow at ${timeString}. Don't forget to attend!`
        };
      
      case '2h':
        return {
          title: 'Event Starting Soon! ⏰',
          body: `"${event.title}" starts in 2 hours at ${timeString}. Get ready!`
        };
      
      case '30m':
        return {
          title: 'Event Starting Very Soon! 🚀',
          body: `"${event.title}" starts in 30 minutes at ${timeString}. Time to go!`
        };
      
      default:
        return {
          title: 'Event Reminder',
          body: `"${event.title}" is coming up soon!`
        };
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }
}

// Create singleton instance
const notificationScheduler = new NotificationScheduler();

module.exports = notificationScheduler;

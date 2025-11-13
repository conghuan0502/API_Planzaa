const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must belong to a user'],
    index: true
  },
  type: {
    type: String,
    enum: [
      'host_announcement',
      'event_created',
      'event_updated',
      'event_cancelled',
      'event_reminder_24h',
      'event_reminder_2h',
      'event_reminder_30m',
      'rsvp_confirmed',
      'rsvp_declined',
      'rsvp_maybe',
      'weather_alert',
      'system'
    ],
    required: [true, 'Notification must have a type']
  },
  title: {
    type: String,
    required: [true, 'Notification must have a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  body: {
    type: String,
    required: [true, 'Notification must have a body'],
    trim: true,
    maxlength: [500, 'Body cannot be more than 500 characters']
  },
  data: {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    eventTitle: String,
    hostName: String,
    actionUrl: String,
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    },
    // Additional metadata can be added here
    metadata: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  // FCM tracking
  fcmMessageId: {
    type: String,
    default: null
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'sent'
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

// Virtual for checking if notification is recent (within 24 hours)
notificationSchema.virtual('isRecent').get(function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > oneDayAgo;
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, isRead: false });
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsReadForUser = async function(userId) {
  return await this.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to delete old notifications (older than 30 days)
notificationSchema.statics.deleteOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return await this.deleteMany({ createdAt: { $lt: cutoffDate }, isRead: true });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

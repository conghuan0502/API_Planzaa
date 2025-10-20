# Event Reminder System

This document outlines the implementation of automated pre-event reminder notifications (24h, 2h, 30min) for the Event Management API.

## Overview

The reminder system automatically sends push notifications to event participants at specific intervals before their events start:
- **24 hours before** - "Event Tomorrow!" notification
- **2 hours before** - "Event Starting Soon!" notification  
- **30 minutes before** - "Event Starting Very Soon!" notification

## Implementation Details

### 1. Dependencies
- `node-cron` - For scheduling reminder checks
- `firebase-admin` - For sending push notifications
- Existing FCM integration

### 2. Files Created/Modified

#### New Files:
- `services/notificationScheduler.js` - Core reminder scheduling service
- `test-reminders.js` - Comprehensive reminder system testing
- `REMINDER_SYSTEM.md` - This documentation

#### Modified Files:
- `models/eventModel.js` - Added reminder tracking fields
- `controllers/fcmController.js` - Added reminder testing endpoints
- `routes/fcmRoutes.js` - Added reminder API routes
- `app.js` - Initialize notification scheduler on startup
- `package.json` - Added reminder test script

## How It Works

### 1. Automatic Scheduling
The notification scheduler runs as a background service that:
- Checks every minute for events needing reminders
- Compares current time with event start times
- Sends appropriate notifications based on timing
- Tracks sent reminders to prevent duplicates

### 2. Reminder Timing Logic
```javascript
// 24-hour reminder: 24h ± 1 minute before event
const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));

// 2-hour reminder: 2h ± 1 minute before event  
const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));

// 30-minute reminder: 30m ± 1 minute before event
const thirtyMinutesFromNow = new Date(now.getTime() + (30 * 60 * 1000));
```

### 3. Database Tracking
Each event has a `reminders` field that tracks:
```javascript
reminders: {
  sent24h: false,    // 24-hour reminder sent
  sent2h: false,     // 2-hour reminder sent  
  sent30m: false,    // 30-minute reminder sent
  lastChecked: null  // Last time reminders were checked
}
```

### 4. User Preferences
Reminders respect user notification settings:
- Only sent to users with valid FCM tokens
- Respects `eventReminders` preference (default: enabled)
- Respects `pushNotifications` preference (default: enabled)

## API Endpoints

### 1. Test Reminder Notification
```
POST /api/fcm/reminder/test
```
Manually trigger a reminder notification for testing.

**Request Body:**
```json
{
  "eventId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "reminderType": "24h"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "eventId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "eventTitle": "Team Meeting",
    "reminderType": "24h",
    "eligibleParticipants": 5,
    "message": "24h reminder sent successfully"
  }
}
```

### 2. Get Scheduler Status
```
GET /api/fcm/reminder/status
```
Get the current status of the notification scheduler.

**Response:**
```json
{
  "status": "success",
  "data": {
    "isRunning": true,
    "activeJobs": ["checkReminders"],
    "uptime": 3600000
  }
}
```

## Notification Messages

### 24-Hour Reminder
- **Title**: "Event Tomorrow! 📅"
- **Body**: "{Event Title} is tomorrow at {Time}. Don't forget to attend!"
- **Example**: "Team Meeting is tomorrow at 2:00 PM. Don't forget to attend!"

### 2-Hour Reminder  
- **Title**: "Event Starting Soon! ⏰"
- **Body**: "{Event Title} starts in 2 hours at {Time}. Get ready!"
- **Example**: "Team Meeting starts in 2 hours at 2:00 PM. Get ready!"

### 30-Minute Reminder
- **Title**: "Event Starting Very Soon! 🚀"
- **Body**: "{Event Title} starts in 30 minutes at {Time}. Time to go!"
- **Example**: "Team Meeting starts in 30 minutes at 2:00 PM. Time to go!"

## Notification Payload Structure

```javascript
{
  notification: {
    title: "Event Tomorrow! 📅",
    body: "Team Meeting is tomorrow at 2:00 PM. Don't forget to attend!"
  },
  data: {
    eventId: "64f8a1b2c3d4e5f6a7b8c9d0",
    eventTitle: "Team Meeting",
    notificationType: "event_reminder_24h",
    reminderType: "24h",
    eventStartTime: "2024-01-15T14:00:00.000Z",
    timestamp: "2024-01-14T14:00:00.000Z"
  },
  android: {
    priority: "high",
    notification: {
      sound: "default",
      channelId: "event_reminders",
      icon: "ic_notification"
    }
  },
  apns: {
    payload: {
      aps: {
        sound: "default",
        badge: 1,
        category: "EVENT_REMINDER"
      }
    }
  }
}
```

## React Native Integration

### 1. Handle Reminder Notifications
```javascript
import messaging from '@react-native-firebase/messaging';

// Handle reminder notifications
messaging().onMessage(async remoteMessage => {
  if (remoteMessage.data.notificationType?.startsWith('event_reminder_')) {
    const reminderType = remoteMessage.data.reminderType;
    const eventId = remoteMessage.data.eventId;
    
    // Handle different reminder types
    switch (reminderType) {
      case '24h':
        showEventReminder(remoteMessage, 'tomorrow');
        break;
      case '2h':
        showEventReminder(remoteMessage, 'in 2 hours');
        break;
      case '30m':
        showEventReminder(remoteMessage, 'in 30 minutes');
        break;
    }
  }
});

// Handle notification taps
messaging().onNotificationOpenedApp(remoteMessage => {
  if (remoteMessage.data.notificationType?.startsWith('event_reminder_')) {
    const eventId = remoteMessage.data.eventId;
    // Navigate to event details
    navigation.navigate('EventDetails', { eventId });
  }
});
```

### 2. Custom Notification Channel (Android)
```javascript
// Create notification channel for event reminders
import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';

if (Platform.OS === 'android') {
  PushNotification.createChannel({
    channelId: 'event_reminders',
    channelName: 'Event Reminders',
    channelDescription: 'Notifications for upcoming events',
    importance: 4, // High importance
    vibrate: true,
  });
}
```

## Testing

### 1. Run Reminder Tests
```bash
npm run test:reminders
```

### 2. Test with Real Events
Create events with specific start times to test reminders:
```javascript
// Event starting in 25 hours (will trigger 24h reminder)
const eventStart = new Date(Date.now() + (25 * 60 * 60 * 1000));

// Event starting in 2.5 hours (will trigger 2h reminder)
const eventStart = new Date(Date.now() + (2.5 * 60 * 60 * 1000));

// Event starting in 35 minutes (will trigger 30m reminder)
const eventStart = new Date(Date.now() + (35 * 60 * 1000));
```

### 3. Manual Testing
Use the test endpoint to manually trigger reminders:
```bash
curl -X POST http://localhost:3000/api/fcm/reminder/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "YOUR_EVENT_ID",
    "reminderType": "24h"
  }'
```

## Monitoring and Logging

### 1. Scheduler Logs
The scheduler logs its activities:
```
🕐 Starting notification scheduler...
📅 Sent 24h reminders for 3 events
⏰ Sent 2h reminders for 1 events  
🚀 Sent 30m reminders for 2 events
```

### 2. Notification Results
Each reminder batch logs results:
```
📱 24h reminder sent for "Team Meeting": 5 success, 0 failed
```

### 3. Error Handling
Invalid tokens are logged for cleanup:
```
⚠️ Invalid token for participant John Doe: expired_token_123
```

## Performance Considerations

### 1. Efficient Queries
- Uses MongoDB indexes on `startDate` and reminder fields
- Batches notifications using Firebase multicast
- Limits queries to 1-minute time windows

### 2. Resource Management
- Runs every minute (not continuously)
- Stops duplicate notifications with database flags
- Handles errors gracefully without affecting main app

### 3. Scalability
- Can handle thousands of events
- Efficient database queries with proper indexing
- Firebase handles notification delivery scaling

## Configuration

### 1. Scheduler Settings
```javascript
// Check reminders every minute
cron.schedule('* * * * *', checkAndSendReminders)

// Time buffers for reminder windows (1 minute)
const buffer = 60 * 1000; // 1 minute in milliseconds
```

### 2. Notification Settings
- Reminders respect user preferences
- High priority for Android notifications
- Sound and badge enabled for iOS

## Troubleshooting

### Common Issues

1. **Reminders Not Sending**
   - Check if scheduler is running: `GET /api/fcm/reminder/status`
   - Verify user FCM tokens are valid
   - Check user notification preferences

2. **Duplicate Reminders**
   - Database flags prevent duplicates
   - Check reminder tracking fields in events

3. **Scheduler Not Starting**
   - Check Firebase initialization
   - Verify MongoDB connection
   - Check for JavaScript errors

### Debug Steps
1. Check scheduler status
2. Verify event start times
3. Test with manual reminder endpoint
4. Check Firebase console for delivery reports
5. Verify user notification settings

## Future Enhancements

1. **Custom Reminder Times** - Allow users to set custom reminder intervals
2. **Smart Timing** - Send reminders at optimal times based on user activity
3. **Location Reminders** - Send reminders when user is near event location
4. **Weather Integration** - Include weather in reminder messages
5. **Recurring Events** - Support for recurring event reminders
6. **Reminder Analytics** - Track reminder effectiveness and user engagement

The reminder system is now fully functional and ready for production use! 🎉

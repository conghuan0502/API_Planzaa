# Firebase Cloud Messaging (FCM) Integration

This document outlines the complete implementation of Firebase Cloud Messaging (FCM) push notifications in the Event Management API.

## Overview

The FCM integration provides comprehensive push notification capabilities:
1. **Automatic Notifications** - Send notifications when events are created, updated, or cancelled
2. **Manual Notifications** - Send custom notifications to users, events, or specific tokens
3. **User Management** - Register and manage FCM tokens for users
4. **Notification Settings** - Allow users to customize their notification preferences

## AI Context: How the Notification System Works

### Core Architecture
The notification system operates on a **user-centric permission model** where:
- Each user has individual notification preferences stored in their profile
- FCM tokens are linked to specific user accounts and devices
- Notifications are filtered based on user settings before sending
- The system respects user privacy by checking preferences before any notification dispatch

### Notification Flow
1. **Event Trigger** → System checks if notification should be sent
2. **User Filtering** → Only users with appropriate settings receive notifications
3. **Token Validation** → Valid FCM tokens are identified
4. **Notification Dispatch** → Messages are sent via Firebase Cloud Messaging
5. **Error Handling** → Invalid tokens are cleaned up automatically

### Permission Levels
- **Global Push Notifications**: Master switch for all notifications
- **Event Updates**: Notifications when events are modified
- **Event Reminders**: Scheduled notifications before events
- **Weather Alerts**: Weather-related notifications for events

## Implementation Details

### 1. Dependencies
- `firebase-admin` - Already installed (v13.5.0)
- Firebase environment variables (configured in .env file)

### 2. Files Created/Modified

#### New Files:
- `config/firebase.js` - Firebase Admin SDK configuration
- `controllers/fcmController.js` - FCM notification logic
- `routes/fcmRoutes.js` - FCM API routes
- `test-fcm.js` - FCM testing script
- `FCM_INTEGRATION.md` - This documentation

#### Modified Files:
- `models/userModel.js` - Added FCM token and notification settings
- `controllers/userController.js` - Added FCM token management
- `controllers/eventController.js` - Added automatic notifications
- `routes/userRoutes.js` - Added FCM token endpoints
- `app.js` - Added Firebase initialization and FCM routes
- `package.json` - Added FCM test script

## API Endpoints

### FCM Routes (Protected)

#### 1. Send Notification to Tokens
```
POST /api/fcm/send
```
Send notification to specific FCM tokens.

**Request Body:**
```json
{
  "tokens": ["token1", "token2"],
  "title": "Notification Title",
  "body": "Notification message",
  "data": {
    "custom": "data"
  },
  "imageUrl": "https://example.com/image.jpg" // Optional
}
```

#### 2. Send Notification to Event Participants
```
POST /api/fcm/event/:eventId
```
Send notification to all participants of a specific event.

**Request Body:**
```json
{
  "title": "Event Update",
  "body": "Your event has been updated!",
  "data": {
    "eventId": "event_id",
    "action": "view_event"
  }
}
```

#### 3. Send Notification to User
```
POST /api/fcm/user/:userId
```
Send notification to a specific user by their ID.

**Request Body:**
```json
{
  "title": "Personal Message",
  "body": "Hello from the system!",
  "data": {
    "type": "personal"
  }
}
```

### User Routes (Protected)

#### 4. Update FCM Token
```
POST /api/users/fcm-token
```
Register or update user's FCM token.

**Request Body:**
```json
{
  "fcmToken": "user_fcm_token_here"
}
```

#### 5. Update Notification Settings
```
PATCH /api/users/notification-settings
```
Update user's notification preferences.

**Request Body:**
```json
{
  "eventUpdates": true,
  "eventReminders": true,
  "weatherAlerts": false,
  "pushNotifications": true
}
```

## Automatic Notifications

The system automatically sends notifications for:

### Event Created
- **Trigger**: When a new event is created
- **Recipients**: All event participants
- **Title**: "New Event Created!"
- **Body**: "{Event Title} has been created. Check it out!"

### Event Updated
- **Trigger**: When an event is updated
- **Recipients**: All event participants
- **Title**: "Event Updated"
- **Body**: "{Event Title} has been updated."

### Event Cancelled
- **Trigger**: When an event is deleted
- **Recipients**: All event participants
- **Title**: "Event Cancelled"
- **Body**: "{Event Title} has been cancelled."

### Weather Alerts
- **Trigger**: When weather data is updated for events
- **Recipients**: Event participants with weather alerts enabled
- **Title**: "Weather Alert"
- **Body**: "Weather update for {Event Title}: {Weather Description}"

## User Model Updates

### FCM Token Field
```javascript
fcmToken: {
  type: String,
  default: null,
  index: true
}
```

### Notification Settings
```javascript
notificationSettings: {
  eventUpdates: {
    type: Boolean,
    default: true
  },
  eventReminders: {
    type: Boolean,
    default: true
  },
  weatherAlerts: {
    type: Boolean,
    default: true
  },
  pushNotifications: {
    type: Boolean,
    default: true
  }
}
```

### How Notification Settings Work

#### Setting Hierarchy
1. **pushNotifications** (Master Switch)
   - If `false`, NO notifications are sent regardless of other settings
   - Acts as a global opt-out for the user
   - Must be `true` for any notifications to be delivered

2. **eventUpdates** (Event Modification Notifications)
   - Controls notifications when events are created, updated, or cancelled
   - Only active when `pushNotifications` is `true`
   - Affects: Event creation, updates, cancellations

3. **eventReminders** (Scheduled Reminders)
   - Controls pre-event reminder notifications
   - Only active when `pushNotifications` is `true`
   - Affects: Scheduled reminders before events start

4. **weatherAlerts** (Weather Notifications)
   - Controls weather-related notifications for events
   - Only active when `pushNotifications` is `true`
   - Affects: Weather updates, alerts, and forecasts

#### Setting Logic Flow
```javascript
// Pseudo-code for notification filtering
function shouldSendNotification(user, notificationType) {
  // Master switch check
  if (!user.notificationSettings.pushNotifications) {
    return false;
  }
  
  // Specific setting checks
  switch(notificationType) {
    case 'event_update':
      return user.notificationSettings.eventUpdates;
    case 'event_reminder':
      return user.notificationSettings.eventReminders;
    case 'weather_alert':
      return user.notificationSettings.weatherAlerts;
    default:
      return true; // For manual notifications
  }
}
```

#### User Experience Impact
- **Granular Control**: Users can disable specific notification types while keeping others
- **Privacy Respect**: Users have full control over what notifications they receive
- **Battery Optimization**: Users can disable non-essential notifications to save battery
- **Re-engagement**: Users can re-enable notifications through settings at any time

## Notification Payload Structure

### Standard Notification
```javascript
{
  notification: {
    title: "Notification Title",
    body: "Notification message",
    image: "https://example.com/image.jpg" // Optional
  },
  data: {
    eventId: "event_id",
    eventTitle: "Event Name",
    notificationType: "event_update",
    timestamp: "2024-01-15T10:30:00.000Z",
    customData: "value"
  },
  android: {
    priority: "high",
    notification: {
      sound: "default",
      channelId: "event_notifications"
    }
  },
  apns: {
    payload: {
      aps: {
        sound: "default",
        badge: 1,
        category: "EVENT_UPDATE"
      }
    }
  }
}
```

## React Native Integration

### 1. Install Dependencies
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### 2. Complete FCM Setup with Context

#### Initialize FCM Service
```javascript
// services/FCMService.js
import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FCMService {
  constructor() {
    this.token = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Request permission first
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission denied');
        return false;
      }

      // Get FCM token
      await this.getToken();
      
      // Set up message handlers
      this.setupMessageHandlers();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('FCM initialization failed:', error);
      return false;
    }
  }

  async requestPermission() {
    if (Platform.OS === 'android') {
      const granted = await messaging().requestPermission({
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      });
      return granted === messaging.AuthorizationStatus.AUTHORIZED;
    }
    return true;
  }

  async getToken() {
    try {
      this.token = await messaging().getToken();
      console.log('FCM Token:', this.token);
      
      // Store token locally
      await AsyncStorage.setItem('fcm_token', this.token);
      
      // Send to backend
      await this.sendTokenToBackend(this.token);
      
      return this.token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  async sendTokenToBackend(token) {
    try {
      const userToken = await AsyncStorage.getItem('user_token');
      if (!userToken) {
        console.log('No user token found, skipping FCM token registration');
        return;
      }

      const response = await fetch('YOUR_API_URL/api/users/fcm-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fcmToken: token })
      });

      if (response.ok) {
        console.log('FCM token registered successfully');
      } else {
        console.error('Failed to register FCM token:', response.status);
      }
    } catch (error) {
      console.error('Error sending FCM token to backend:', error);
    }
  }

  setupMessageHandlers() {
    // Handle foreground messages
    this.unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message received:', remoteMessage);
      this.handleForegroundMessage(remoteMessage);
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message received:', remoteMessage);
      this.handleBackgroundMessage(remoteMessage);
    });

    // Handle notification taps when app is in background
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification tapped (background):', remoteMessage);
      this.handleNotificationTap(remoteMessage);
    });

    // Handle notification taps when app is completely closed
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification tapped (closed):', remoteMessage);
          this.handleNotificationTap(remoteMessage);
        }
      });
  }

  handleForegroundMessage(remoteMessage) {
    // Show in-app notification or custom UI
    Alert.alert(
      remoteMessage.notification?.title || 'New Notification',
      remoteMessage.notification?.body || 'You have a new message',
      [
        {
          text: 'View',
          onPress: () => this.handleNotificationTap(remoteMessage)
        },
        { text: 'Dismiss', style: 'cancel' }
      ]
    );
  }

  handleBackgroundMessage(remoteMessage) {
    // Process background message
    // You can update local storage, show local notification, etc.
    console.log('Processing background message:', remoteMessage);
  }

  handleNotificationTap(remoteMessage) {
    // Navigate based on notification data
    const { eventId, notificationType, customData } = remoteMessage.data || {};
    
    if (eventId) {
      // Navigate to event details
      // navigation.navigate('EventDetails', { eventId });
      console.log('Navigate to event:', eventId);
    } else if (notificationType === 'settings') {
      // Navigate to settings
      // navigation.navigate('Settings');
      console.log('Navigate to settings');
    }
  }

  async updateNotificationSettings(settings) {
    try {
      const userToken = await AsyncStorage.getItem('user_token');
      if (!userToken) return;

      const response = await fetch('YOUR_API_URL/api/users/notification-settings', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        console.log('Notification settings updated');
        return true;
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
    return false;
  }

  destroy() {
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
    }
  }
}

export default new FCMService();
```

#### App Integration
```javascript
// App.js or your main component
import React, { useEffect } from 'react';
import FCMService from './services/FCMService';

const App = () => {
  useEffect(() => {
    // Initialize FCM when app starts
    FCMService.initialize();

    // Cleanup on unmount
    return () => {
      FCMService.destroy();
    };
  }, []);

  return (
    // Your app components
  );
};
```

#### Settings Screen Integration
```javascript
// components/NotificationSettings.js
import React, { useState, useEffect } from 'react';
import { View, Switch, Text, StyleSheet } from 'react-native';
import FCMService from '../services/FCMService';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    eventUpdates: true,
    eventReminders: true,
    weatherAlerts: true
  });

  useEffect(() => {
    // Load current settings from backend
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Fetch current settings from your API
    // Implementation depends on your API structure
  };

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Update backend
    await FCMService.updateNotificationSettings(newSettings);
  };

  return (
    <View style={styles.container}>
      <View style={styles.settingRow}>
        <Text>Push Notifications</Text>
        <Switch
          value={settings.pushNotifications}
          onValueChange={(value) => handleSettingChange('pushNotifications', value)}
        />
      </View>
      
      <View style={styles.settingRow}>
        <Text>Event Updates</Text>
        <Switch
          value={settings.eventUpdates}
          onValueChange={(value) => handleSettingChange('eventUpdates', value)}
          disabled={!settings.pushNotifications}
        />
      </View>
      
      <View style={styles.settingRow}>
        <Text>Event Reminders</Text>
        <Switch
          value={settings.eventReminders}
          onValueChange={(value) => handleSettingChange('eventReminders', value)}
          disabled={!settings.pushNotifications}
        />
      </View>
      
      <View style={styles.settingRow}>
        <Text>Weather Alerts</Text>
        <Switch
          value={settings.weatherAlerts}
          onValueChange={(value) => handleSettingChange('weatherAlerts', value)}
          disabled={!settings.pushNotifications}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default NotificationSettings;
```

### 3. Advanced Features

#### Token Refresh Handling
```javascript
// Handle token refresh
messaging().onTokenRefresh(async (token) => {
  console.log('FCM token refreshed:', token);
  await FCMService.sendTokenToBackend(token);
});
```

#### Deep Linking Integration
```javascript
// Handle deep links from notifications
import { Linking } from 'react-native';

const handleDeepLink = (url) => {
  // Parse URL and navigate accordingly
  if (url.includes('event/')) {
    const eventId = url.split('event/')[1];
    // navigation.navigate('EventDetails', { eventId });
  }
};

// Set up deep link listener
useEffect(() => {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });

  return () => subscription?.remove();
}, []);
```

## Testing

### 1. Run FCM Test
```bash
npm run test:fcm
```

### 2. Test with Real Tokens
Add test FCM tokens to your `.env` file:
```env
TEST_FCM_TOKEN=your_real_fcm_token_here
TEST_FCM_TOKEN_1=token_1_here
TEST_FCM_TOKEN_2=token_2_here
```

### 3. Test API Endpoints
Use the Swagger documentation at `/api-docs` to test FCM endpoints.

## Error Handling

The FCM integration includes comprehensive error handling:

### Common FCM Errors
- `messaging/invalid-registration-token` - Invalid or expired FCM token
- `messaging/registration-token-not-registered` - Token no longer valid
- `messaging/mismatched-credential` - Wrong Firebase project
- `messaging/invalid-package-name` - Wrong app package name

### Error Response Format
```json
{
  "status": "fail",
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

## Security Considerations

1. **Authentication Required**: All FCM endpoints require user authentication
2. **Token Validation**: FCM tokens are validated before sending notifications
3. **Rate Limiting**: Standard API rate limiting applies to FCM endpoints
4. **Error Logging**: FCM errors are logged but don't expose sensitive information

## Performance Optimization

1. **Non-blocking Notifications**: FCM failures don't affect main operations
2. **Batch Operations**: Use multicast for sending to multiple tokens
3. **Token Cleanup**: Handle invalid tokens gracefully
4. **Caching**: User notification settings are cached

## Monitoring and Analytics

### Logging
- FCM notification results are logged with success/failure counts
- Error details are logged for debugging
- User notification preferences are tracked

### Metrics to Monitor
- Notification delivery rates
- Token validity rates
- User engagement with notifications
- Error frequency and types

## AI Context: System Architecture & Decision Making

### Notification Decision Tree
When the AI needs to send notifications, it should follow this decision process:

```
1. Is the user authenticated and has valid FCM token?
   ├─ NO → Skip notification
   └─ YES → Continue to step 2

2. Check user.notificationSettings.pushNotifications
   ├─ FALSE → Skip notification (master switch off)
   └─ TRUE → Continue to step 3

3. Determine notification type and check specific setting:
   ├─ event_update → Check user.notificationSettings.eventUpdates
   ├─ event_reminder → Check user.notificationSettings.eventReminders
   ├─ weather_alert → Check user.notificationSettings.weatherAlerts
   └─ manual → Always send (respects master switch only)

4. If all checks pass → Send notification
5. If any check fails → Skip notification
```

### Key AI Considerations

#### When to Send Notifications
- **Event Creation**: Send to all participants with `eventUpdates: true`
- **Event Updates**: Send to all participants with `eventUpdates: true`
- **Event Cancellation**: Send to all participants with `eventUpdates: true`
- **Weather Alerts**: Send only to users with `weatherAlerts: true`
- **Manual Notifications**: Send to specified users (respects master switch)

#### User Privacy & Experience
- **Never send notifications to users who have disabled them**
- **Respect granular settings** - users can disable specific types
- **Handle token refresh** - automatically update expired tokens
- **Clean up invalid tokens** - remove tokens that are no longer valid

#### Error Handling Strategy
- **Non-blocking**: FCM failures should not affect main operations
- **Graceful degradation**: Continue app functionality if notifications fail
- **Logging**: Record notification attempts and results for debugging
- **Retry logic**: Implement retry for transient failures

### Database Schema Context
```javascript
// User model includes these FCM-related fields:
{
  fcmToken: String, // Current FCM token for the device
  notificationSettings: {
    pushNotifications: Boolean, // Master switch
    eventUpdates: Boolean,      // Event modification notifications
    eventReminders: Boolean,    // Pre-event reminders
    weatherAlerts: Boolean      // Weather-related notifications
  }
}
```

### API Integration Points
- **Token Registration**: `POST /api/users/fcm-token`
- **Settings Update**: `PATCH /api/users/notification-settings`
- **Manual Notifications**: `POST /api/fcm/send`
- **Event Notifications**: `POST /api/fcm/event/:eventId`
- **User Notifications**: `POST /api/fcm/user/:userId`

## Future Enhancements

1. **Scheduled Notifications**: Send notifications at specific times
2. **Notification Templates**: Predefined notification formats
3. **A/B Testing**: Test different notification styles
4. **Analytics Integration**: Track notification effectiveness
5. **Rich Notifications**: Support for images, actions, and rich content
6. **Notification History**: Store and retrieve notification history

## Troubleshooting

### Common Issues

1. **Notifications Not Received**
   - Check FCM token validity
   - Verify notification permissions
   - Check notification settings

2. **Invalid Token Errors**
   - Tokens expire and need refresh
   - App reinstall generates new tokens
   - Handle token refresh in app

3. **Firebase Configuration Issues**
   - Verify service account key
   - Check Firebase project settings
   - Ensure correct package name

### Debug Steps
1. Run `npm run test:fcm` to test basic functionality
2. Check Firebase console for delivery reports
3. Verify FCM tokens in user database
4. Test with single token before multicast

## Environment Variables

Your existing Firebase environment variables are sufficient:
```env
# Required Firebase configuration (already set up)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
firebase_private_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
firebase_client_ID=your_client_id

# Optional: Test FCM tokens for testing
TEST_FCM_TOKEN=your_test_token_here
TEST_FCM_TOKEN_1=test_token_1
TEST_FCM_TOKEN_2=test_token_2
```

**Note**: The configuration now uses your existing environment variables instead of the service key file, which is more secure and production-ready.

The FCM integration is now fully functional and ready for use with your React Native application!

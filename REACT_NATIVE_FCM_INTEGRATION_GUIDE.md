# React Native FCM Integration Guide

This comprehensive guide will help React Native developers integrate Firebase Cloud Messaging (FCM) with the Event Management API. The guide covers setup, implementation, and best practices for push notifications in your React Native application.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Firebase Project Setup](#firebase-project-setup)
4. [React Native Setup](#react-native-setup)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Implementation Steps](#implementation-steps)
7. [Code Examples](#code-examples)
8. [Notification Types](#notification-types)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Overview

The Event Management API provides comprehensive FCM support with the following features:

- **User-specific notifications**: Send notifications to individual users
- **Event-based notifications**: Send notifications to all event participants
- **Bulk notifications**: Send notifications to multiple tokens at once
- **Automatic reminders**: Scheduled notifications for upcoming events (24h, 2h, 30m)
- **Notification settings**: User-controlled notification preferences
- **Rich notifications**: Support for images, custom data, and platform-specific settings

## Prerequisites

Before starting, ensure you have:

- Node.js (v14 or higher)
- React Native development environment set up
- Firebase project with FCM enabled
- Android Studio (for Android development)
- Xcode (for iOS development)
- Basic understanding of React Native and Firebase

## Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Cloud Messaging in the project settings

### 2. Add Android App

1. Click "Add app" → Android
2. Enter your package name (e.g., `com.yourapp.eventmanager`)
3. Download `google-services.json`
4. Place it in `android/app/` directory

### 3. Add iOS App

1. Click "Add app" → iOS
2. Enter your bundle ID (e.g., `com.yourapp.eventmanager`)
3. Download `GoogleService-Info.plist`
4. Add it to your iOS project in Xcode

### 4. Get Server Key

1. Go to Project Settings → Cloud Messaging
2. Copy the Server Key (you'll need this for your backend)

## React Native Setup

### 1. Install Dependencies

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
# For iOS
cd ios && pod install
```

### 2. Android Configuration

#### Update `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

#### Update `android/app/build.gradle`:
```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.3.1')
    implementation 'com.google.firebase:firebase-messaging'
}
```

#### Update `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<application>
    <service
        android:name="io.invertase.firebase.messaging.RNFirebaseMessagingService"
        android:exported="false">
        <intent-filter>
            <action android:name="com.google.firebase.MESSAGING_EVENT" />
        </intent-filter>
    </service>
</application>
```

### 3. iOS Configuration

#### Update `ios/YourApp/AppDelegate.m`:
```objc
#import <Firebase.h>
#import <RNFirebase.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  [RNFirebaseMessaging didReceiveRemoteNotification:launchOptions];
  // ... rest of your code
}
```

## API Endpoints Reference

### Base URL
```
https://your-api-domain.com/api
```

### Authentication
All FCM endpoints require Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

### Available Endpoints

#### 1. Update FCM Token
**POST** `/users/fcm-token`

Register or update user's FCM token for push notifications. This endpoint should be called:
- When the app starts and gets a new FCM token
- When the FCM token refreshes (typically every 6 months)
- After user login to ensure token is registered

**Request Body:**
```json
{
  "fcmToken": "your-fcm-token-here"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "FCM token updated successfully",
    "fcmToken": "your-fcm-token-here"
  }
}
```

**Error Responses:**
```json
// 400 - Invalid token
{
  "status": "fail",
  "message": "FCM token is required"
}

// 401 - Unauthorized
{
  "status": "fail",
  "message": "Please log in to access this resource"
}
```

#### 2. Send Notification to User
**POST** `/fcm/user/{userId}`

Send notification to a specific user.

**Request Body:**
```json
{
  "title": "Notification Title",
  "body": "Notification message",
  "data": {
    "customKey": "customValue"
  },
  "imageUrl": "https://example.com/image.jpg"
}
```

#### 3. Send Notification to Event Participants
**POST** `/fcm/event/{eventId}`

Send notification to all event participants.

**Request Body:**
```json
{
  "title": "Event Update",
  "body": "The event has been updated",
  "data": {
    "eventId": "event-id-here"
  }
}
```

#### 4. Send Bulk Notifications
**POST** `/fcm/send`

Send notifications to multiple tokens.

**Request Body:**
```json
{
  "tokens": ["token1", "token2", "token3"],
  "title": "Bulk Notification",
  "body": "Message for multiple users",
  "data": {
    "type": "bulk"
  }
}
```

#### 5. Send Host Announcement
**POST** `/fcm/event/{eventId}/host-announcement`

Send a custom notification message from the event host to all event participants.

**Request Body:**
```json
{
  "message": "Due to heavy rain, the event will be delayed by 30 minutes. Please arrive at 3:30 PM instead.",
  "title": "Event Update",
  "priority": "high"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "eventId": "event-id-here",
    "eventTitle": "Summer BBQ Party",
    "hostName": "John Doe",
    "participantCount": 15,
    "eligibleParticipants": 12,
    "successCount": 12,
    "failureCount": 0,
    "message": "Host announcement sent successfully"
  }
}
```

#### 6. Update Notification Settings
**PATCH** `/users/notification-settings`

Update user's notification preferences. These settings control which types of notifications the user will receive.

**Request Body:**
```json
{
  "eventUpdates": true,        // Notifications for event changes
  "eventReminders": true,       // Reminder notifications (24h, 2h, 30m)
  "weatherAlerts": false,       // Weather-related notifications
  "pushNotifications": true    // Master switch for all push notifications
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "notificationSettings": {
      "eventUpdates": true,
      "eventReminders": true,
      "weatherAlerts": false,
      "pushNotifications": true
    }
  }
}
```

**Error Responses:**
```json
// 400 - Invalid settings
{
  "status": "fail",
  "message": "Invalid notification settings"
}

// 401 - Unauthorized
{
  "status": "fail",
  "message": "Please log in to access this resource"
}
```

**Settings Behavior:**
- `pushNotifications: false` - Disables ALL push notifications
- `eventUpdates: false` - No notifications for event changes
- `eventReminders: false` - No reminder notifications
- `weatherAlerts: false` - No weather-related notifications

## Implementation Steps

### Step 1: Initialize Firebase

Create `src/services/firebase.js`:

```javascript
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

class FirebaseService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Request permission for iOS
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          throw new Error('Notification permission denied');
        }
      }

      // Get FCM token
      const token = await messaging().getToken();
      console.log('FCM Token:', token);

      this.initialized = true;
      return token;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  }

  async getToken() {
    return await messaging().getToken();
  }

  onTokenRefresh(callback) {
    return messaging().onTokenRefresh(callback);
  }

  onMessage(callback) {
    return messaging().onMessage(callback);
  }

  onNotificationOpenedApp(callback) {
    return messaging().onNotificationOpenedApp(callback);
  }

  getInitialNotification() {
    return messaging().getInitialNotification();
  }
}

export default new FirebaseService();
```

### Step 2: Create FCM Token Manager

Create `src/services/fcmTokenManager.js`:

```javascript
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './api';

class FCMTokenManager {
  constructor() {
    this.currentToken = null;
    this.isInitialized = false;
  }

  /**
   * Initialize FCM token management
   * Call this when the app starts or user logs in
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Get current token
      const token = await messaging().getToken();
      this.currentToken = token;

      // Register token with server
      await this.registerToken(token);

      // Set up token refresh listener
      this.setupTokenRefreshListener();

      this.isInitialized = true;
      console.log('✅ FCM Token Manager initialized');
    } catch (error) {
      console.error('❌ FCM Token Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register FCM token with the server
   */
  async registerToken(token) {
    try {
      if (!token) {
        throw new Error('FCM token is required');
      }

      // Check if token has changed
      const lastToken = await AsyncStorage.getItem('lastFCMToken');
      if (lastToken === token) {
        console.log('📱 FCM token unchanged, skipping registration');
        return;
      }

      // Register with server
      await ApiService.updateFCMToken(token);
      
      // Store token locally
      await AsyncStorage.setItem('lastFCMToken', token);
      this.currentToken = token;

      console.log('✅ FCM token registered successfully');
    } catch (error) {
      console.error('❌ FCM token registration failed:', error);
      throw error;
    }
  }

  /**
   * Set up listener for token refresh
   */
  setupTokenRefreshListener() {
    messaging().onTokenRefresh(async (newToken) => {
      try {
        console.log('🔄 FCM token refreshed:', newToken);
        
        // Register new token
        await this.registerToken(newToken);
        
        // Update local storage
        await AsyncStorage.setItem('lastFCMToken', newToken);
        this.currentToken = newToken;
        
        console.log('✅ FCM token refresh completed');
      } catch (error) {
        console.error('❌ FCM token refresh failed:', error);
      }
    });
  }

  /**
   * Get current FCM token
   */
  async getCurrentToken() {
    if (!this.currentToken) {
      this.currentToken = await messaging().getToken();
    }
    return this.currentToken;
  }

  /**
   * Force token refresh
   */
  async refreshToken() {
    try {
      const newToken = await messaging().getToken();
      await this.registerToken(newToken);
      return newToken;
    } catch (error) {
      console.error('❌ Force token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Clear stored token (call on logout)
   */
  async clearToken() {
    try {
      await AsyncStorage.removeItem('lastFCMToken');
      this.currentToken = null;
      this.isInitialized = false;
      console.log('✅ FCM token cleared');
    } catch (error) {
      console.error('❌ FCM token clear failed:', error);
    }
  }
}

export default new FCMTokenManager();
```

### Step 3: Create Notification Settings Manager

Create `src/services/notificationSettingsManager.js`:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './api';

class NotificationSettingsManager {
  constructor() {
    this.settings = {
      eventUpdates: true,
      eventReminders: true,
      weatherAlerts: true,
      pushNotifications: true
    };
    this.isInitialized = false;
  }

  /**
   * Initialize notification settings
   * Load settings from server and cache locally
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Try to load from server first
      const serverSettings = await this.loadFromServer();
      if (serverSettings) {
        this.settings = serverSettings;
      } else {
        // Fallback to cached settings
        await this.loadFromCache();
      }

      // Cache settings locally
      await this.saveToCache(this.settings);
      
      this.isInitialized = true;
      console.log('✅ Notification Settings Manager initialized');
    } catch (error) {
      console.error('❌ Notification Settings Manager initialization failed:', error);
      // Use default settings
      this.isInitialized = true;
    }
  }

  /**
   * Load settings from server
   */
  async loadFromServer() {
    try {
      const response = await ApiService.getNotificationSettings();
      return response.data.user.notificationSettings;
    } catch (error) {
      console.error('Failed to load settings from server:', error);
      return null;
    }
  }

  /**
   * Load settings from local cache
   */
  async loadFromCache() {
    try {
      const cachedSettings = await AsyncStorage.getItem('notificationSettings');
      if (cachedSettings) {
        this.settings = JSON.parse(cachedSettings);
        console.log('📱 Loaded notification settings from cache');
      }
    } catch (error) {
      console.error('Failed to load settings from cache:', error);
    }
  }

  /**
   * Save settings to local cache
   */
  async saveToCache(settings) {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to cache:', error);
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(newSettings) {
    try {
      // Validate settings
      const validatedSettings = this.validateSettings(newSettings);
      
      // Update server
      await ApiService.updateNotificationSettings(validatedSettings);
      
      // Update local state
      this.settings = { ...this.settings, ...validatedSettings };
      
      // Cache locally
      await this.saveToCache(this.settings);
      
      console.log('✅ Notification settings updated:', validatedSettings);
      return this.settings;
    } catch (error) {
      console.error('❌ Failed to update notification settings:', error);
      throw error;
    }
  }

  /**
   * Update a single setting
   */
  async updateSetting(key, value) {
    const newSettings = { [key]: value };
    return await this.updateSettings(newSettings);
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Get a specific setting
   */
  getSetting(key) {
    return this.settings[key];
  }

  /**
   * Validate settings object
   */
  validateSettings(settings) {
    const validKeys = ['eventUpdates', 'eventReminders', 'weatherAlerts', 'pushNotifications'];
    const validatedSettings = {};

    for (const key of validKeys) {
      if (settings.hasOwnProperty(key)) {
        if (typeof settings[key] === 'boolean') {
          validatedSettings[key] = settings[key];
        } else {
          throw new Error(`Invalid value for ${key}: must be boolean`);
        }
      }
    }

    return validatedSettings;
  }

  /**
   * Reset to default settings
   */
  async resetToDefaults() {
    const defaultSettings = {
      eventUpdates: true,
      eventReminders: true,
      weatherAlerts: true,
      pushNotifications: true
    };

    return await this.updateSettings(defaultSettings);
  }

  /**
   * Check if notifications are enabled
   */
  areNotificationsEnabled() {
    return this.settings.pushNotifications;
  }

  /**
   * Check if specific notification type is enabled
   */
  isNotificationTypeEnabled(type) {
    return this.settings.pushNotifications && this.settings[type];
  }
}

export default new NotificationSettingsManager();
```

### Step 4: Create API Service

Create `src/services/api.js`:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-api-domain.com/api';

class ApiService {
  async getAuthToken() {
    return await AsyncStorage.getItem('authToken');
  }

  async makeRequest(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // FCM Token Management
  async updateFCMToken(token) {
    return this.makeRequest('/users/fcm-token', {
      method: 'POST',
      body: JSON.stringify({ fcmToken: token }),
    });
  }

  // Notification Settings
  async updateNotificationSettings(settings) {
    return this.makeRequest('/users/notification-settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  async getNotificationSettings() {
    return this.makeRequest('/users/profile');
  }

  // Send Notifications (for testing)
  async sendUserNotification(userId, notification) {
    return this.makeRequest(`/fcm/user/${userId}`, {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  async sendEventNotification(eventId, notification) {
    return this.makeRequest(`/fcm/event/${eventId}`, {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  // Host announcement (only for event hosts)
  async sendHostAnnouncement(eventId, announcement) {
    return this.makeRequest(`/fcm/event/${eventId}/host-announcement`, {
      method: 'POST',
      body: JSON.stringify(announcement),
    });
  }
}

export default new ApiService();
```

### Step 3: Create Notification Handler

Create `src/services/notificationHandler.js`:

```javascript
import { Alert, Linking } from 'react-native';
import messaging from '@react-native-firebase/messaging';

class NotificationHandler {
  constructor() {
    this.setupNotificationHandlers();
  }

  setupNotificationHandlers() {
    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground message received:', remoteMessage);
      this.handleForegroundNotification(remoteMessage);
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // Handle initial notification (app opened from quit state)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Initial notification:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });
  }

  handleForegroundNotification(remoteMessage) {
    const { notification, data } = remoteMessage;
    
    // Show local alert for foreground notifications
    Alert.alert(
      notification?.title || 'Notification',
      notification?.body || 'You have a new notification',
      [
        {
          text: 'View',
          onPress: () => this.handleNotificationPress(remoteMessage),
        },
        { text: 'Dismiss', style: 'cancel' },
      ]
    );
  }

  handleNotificationPress(remoteMessage) {
    const { data } = remoteMessage;
    
    if (data) {
      // Handle different notification types
      switch (data.notificationType) {
        case 'event_created':
        case 'event_updated':
        case 'event_reminder_24h':
        case 'event_reminder_2h':
        case 'event_reminder_30m':
          this.navigateToEvent(data.eventId);
          break;
        
        case 'host_announcement':
          this.navigateToEvent(data.eventId);
          break;
        
        case 'weather_alert':
          this.navigateToWeather(data.eventId);
          break;
        
        default:
          this.navigateToHome();
      }
    }
  }

  navigateToEvent(eventId) {
    // Implement navigation to event details
    console.log('Navigate to event:', eventId);
    // Example: NavigationService.navigate('EventDetails', { eventId });
  }

  navigateToWeather(eventId) {
    // Implement navigation to weather details
    console.log('Navigate to weather for event:', eventId);
  }

  navigateToHome() {
    // Implement navigation to home
    console.log('Navigate to home');
  }

  // Request notification permission
  async requestPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
  }
}

export default new NotificationHandler();
```

### Step 4: Create Notification Settings Component

Create `src/components/NotificationSettings.js`:

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import ApiService from '../services/api';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    eventUpdates: true,
    eventReminders: true,
    weatherAlerts: true,
    pushNotifications: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await ApiService.getNotificationSettings();
      setSettings(response.data.user.notificationSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      setLoading(true);
      await ApiService.updateNotificationSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      // Revert on error
      setSettings(settings);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>
      
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Push Notifications</Text>
        <Switch
          value={settings.pushNotifications}
          onValueChange={(value) => updateSetting('pushNotifications', value)}
          disabled={loading}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Event Updates</Text>
        <Switch
          value={settings.eventUpdates}
          onValueChange={(value) => updateSetting('eventUpdates', value)}
          disabled={loading || !settings.pushNotifications}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Event Reminders</Text>
        <Switch
          value={settings.eventReminders}
          onValueChange={(value) => updateSetting('eventReminders', value)}
          disabled={loading || !settings.pushNotifications}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Weather Alerts</Text>
        <Switch
          value={settings.weatherAlerts}
          onValueChange={(value) => updateSetting('weatherAlerts', value)}
          disabled={loading || !settings.pushNotifications}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
});

export default NotificationSettings;
```

### Step 5: Create Host Announcement Component

Create `src/components/HostAnnouncement.js`:

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Picker,
} from 'react-native';
import ApiService from '../services/api';

const HostAnnouncement = ({ eventId, eventTitle, onAnnouncementSent }) => {
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('Event Update');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);

  const handleSendAnnouncement = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.sendHostAnnouncement(eventId, {
        message: message.trim(),
        title: title.trim() || 'Host Announcement',
        priority: priority,
      });

      Alert.alert(
        'Success',
        `Announcement sent to ${response.data.eligibleParticipants} participants`,
        [
          {
            text: 'OK',
            onPress: () => {
              setMessage('');
              setTitle('Event Update');
              setPriority('normal');
              onAnnouncementSent && onAnnouncementSent(response.data);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending announcement:', error);
      Alert.alert('Error', 'Failed to send announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { label: 'Low Priority', value: 'low' },
    { label: 'Normal Priority', value: 'normal' },
    { label: 'High Priority', value: 'high' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Send Announcement</Text>
      <Text style={styles.eventTitle}>{eventTitle}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Title (Optional)</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Event Update"
          maxLength={50}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={priority}
            onValueChange={setPriority}
            style={styles.picker}
          >
            {priorityOptions.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Message *</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          value={message}
          onChangeText={setMessage}
          placeholder="Enter your announcement message..."
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.characterCount}>
          {message.length}/500 characters
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.sendButton,
          loading && styles.sendButtonDisabled,
        ]}
        onPress={handleSendAnnouncement}
        disabled={loading || !message.trim()}
      >
        <Text style={styles.sendButtonText}>
          {loading ? 'Sending...' : 'Send Announcement'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Information</Text>
        <Text style={styles.infoText}>
          • Only event hosts can send announcements
        </Text>
        <Text style={styles.infoText}>
          • Messages are sent to all event participants
        </Text>
        <Text style={styles.infoText}>
          • High priority messages appear with urgent styling
        </Text>
        <Text style={styles.infoText}>
          • Participants can disable announcements in settings
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  eventTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  sendButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
});

export default HostAnnouncement;
```

### Step 7: Initialize in App Component

Update your main `App.js`:

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import FirebaseService from './src/services/firebase';
import FCMTokenManager from './src/services/fcmTokenManager';
import NotificationSettingsManager from './src/services/notificationSettingsManager';
import NotificationHandler from './src/services/notificationHandler';

const App = () => {
  const [initialized, setInitialized] = useState(false);
  const [initializationStep, setInitializationStep] = useState('Starting...');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setInitializationStep('Initializing Firebase...');
      
      // Initialize Firebase
      await FirebaseService.initialize();
      
      setInitializationStep('Setting up FCM token...');
      
      // Initialize FCM token management
      await FCMTokenManager.initialize();
      
      setInitializationStep('Loading notification settings...');
      
      // Initialize notification settings
      await NotificationSettingsManager.initialize();
      
      setInitializationStep('Setting up notification handlers...');
      
      // Initialize notification handlers
      NotificationHandler.setupNotificationHandlers();
      
      setInitialized(true);
      console.log('✅ App initialization completed successfully');
    } catch (error) {
      console.error('❌ App initialization error:', error);
      Alert.alert('Error', 'Failed to initialize notifications');
    }
  };

  if (!initialized) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>
          Initializing App...
        </Text>
        <Text style={{ fontSize: 14, color: '#666' }}>
          {initializationStep}
        </Text>
      </View>
    );
  }

  return (
    // Your app components here
    <View>
      <Text>Your App Content</Text>
    </View>
  );
};

export default App;
```

### Step 8: Enhanced Notification Settings Component

Update `src/components/NotificationSettings.js` to use the new manager:

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import NotificationSettingsManager from '../services/notificationSettingsManager';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    eventUpdates: true,
    eventReminders: true,
    weatherAlerts: true,
    pushNotifications: true,
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Initialize settings manager if not already done
      await NotificationSettingsManager.initialize();
      
      // Get current settings
      const currentSettings = NotificationSettingsManager.getSettings();
      setSettings(currentSettings);
      setInitialized(true);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      setLoading(true);
      await NotificationSettingsManager.updateSetting(key, value);
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      // Revert on error
      setSettings(settings);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = async () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all notification settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const defaultSettings = await NotificationSettingsManager.resetToDefaults();
              setSettings(defaultSettings);
              Alert.alert('Success', 'Settings reset to defaults');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!initialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Text style={styles.settingDescription}>
            Master switch for all push notifications
          </Text>
        </View>
        <Switch
          value={settings.pushNotifications}
          onValueChange={(value) => updateSetting('pushNotifications', value)}
          disabled={loading}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Event Updates</Text>
          <Text style={styles.settingDescription}>
            Notifications when events are created, updated, or cancelled
          </Text>
        </View>
        <Switch
          value={settings.eventUpdates}
          onValueChange={(value) => updateSetting('eventUpdates', value)}
          disabled={loading || !settings.pushNotifications}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Event Reminders</Text>
          <Text style={styles.settingDescription}>
            Reminder notifications (24h, 2h, 30m before events)
          </Text>
        </View>
        <Switch
          value={settings.eventReminders}
          onValueChange={(value) => updateSetting('eventReminders', value)}
          disabled={loading || !settings.pushNotifications}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Weather Alerts</Text>
          <Text style={styles.settingDescription}>
            Weather updates and alerts for upcoming events
          </Text>
        </View>
        <Switch
          value={settings.weatherAlerts}
          onValueChange={(value) => updateSetting('weatherAlerts', value)}
          disabled={loading || !settings.pushNotifications}
        />
      </View>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetToDefaults}
        disabled={loading}
      >
        <Text style={styles.resetButtonText}>Reset to Defaults</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Information</Text>
        <Text style={styles.infoText}>
          • Settings are automatically synced with the server
        </Text>
        <Text style={styles.infoText}>
          • Changes take effect immediately
        </Text>
        <Text style={styles.infoText}>
          • You can change these settings anytime
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
});

export default NotificationSettings;
```

## Notification Types

The API supports various notification types:

### 1. Event Notifications
- **Event Created**: When a new event is created
- **Event Updated**: When event details are modified
- **Event Cancelled**: When an event is cancelled

### 2. Reminder Notifications
- **24-hour reminder**: Sent 24 hours before event
- **2-hour reminder**: Sent 2 hours before event
- **30-minute reminder**: Sent 30 minutes before event

### 3. Weather Alerts
- Weather updates for upcoming events
- Severe weather warnings

### 4. Host Announcements
- Custom messages from event hosts to all participants
- Priority levels (low, normal, high)
- Real-time updates for event changes

### 5. Custom Notifications
- Bulk notifications to multiple users
- User-specific messages

## FCM Token & Notification Settings Management

### FCM Token Management

The FCM token is a unique identifier that allows the server to send push notifications to a specific device. Here's how to properly manage it:

#### When to Register FCM Token:
1. **App Launch**: Register token when the app starts
2. **User Login**: Register token after successful authentication
3. **Token Refresh**: Automatically handle token refresh (every 6 months)
4. **App Update**: Re-register after app updates

#### Token Lifecycle:
```javascript
// 1. Get FCM token
const token = await messaging().getToken();

// 2. Register with server
await FCMTokenManager.registerToken(token);

// 3. Handle token refresh automatically
FCMTokenManager.setupTokenRefreshListener();

// 4. Clear token on logout
await FCMTokenManager.clearToken();
```

#### Best Practices for Token Management:
- **Cache locally**: Store token in AsyncStorage to avoid unnecessary API calls
- **Handle errors**: Implement retry logic for failed registrations
- **Monitor changes**: Listen for token refresh events
- **Clean up**: Clear tokens on user logout

### Notification Settings Management

Notification settings allow users to control which types of notifications they receive:

#### Available Settings:
- **`pushNotifications`**: Master switch for all notifications
- **`eventUpdates`**: Notifications for event changes
- **`eventReminders`**: Reminder notifications (24h, 2h, 30m)
- **`weatherAlerts`**: Weather-related notifications

#### Settings Hierarchy:
```
pushNotifications (master)
├── eventUpdates
├── eventReminders
└── weatherAlerts
```

#### Implementation Pattern:
```javascript
// Check if notifications are enabled
if (NotificationSettingsManager.areNotificationsEnabled()) {
  // Check specific notification type
  if (NotificationSettingsManager.isNotificationTypeEnabled('eventUpdates')) {
    // Send notification
  }
}
```

#### Settings Synchronization:
- **Server First**: Load settings from server on app start
- **Local Cache**: Store settings locally for offline access
- **Real-time Updates**: Sync changes immediately with server
- **Fallback**: Use default settings if server is unavailable

## Best Practices

### 1. Token Management
- Always update FCM token when it refreshes
- Handle token refresh in background
- Remove invalid tokens from your backend
- Cache tokens locally to reduce API calls
- Implement retry logic for failed registrations

### 2. Permission Handling
- Request notification permission at appropriate times
- Explain why notifications are needed
- Provide settings to disable notifications

### 3. Notification Design
- Use clear, actionable titles
- Keep messages concise and relevant
- Include relevant data for deep linking

### 4. Error Handling
- Handle network errors gracefully
- Implement retry logic for failed requests
- Log errors for debugging

### 5. Performance
- Don't send too many notifications
- Respect user's notification preferences
- Use batch operations when possible

## Troubleshooting

### Common Issues

#### 1. Token Not Generated
**Problem**: FCM token is null or undefined
**Solution**: 
- Ensure Firebase is properly configured
- Check if notifications are enabled
- Verify app is properly signed

#### 2. Notifications Not Received
**Problem**: Notifications not appearing on device
**Solution**:
- Check notification permissions
- Verify FCM token is registered on server
- Test with Firebase Console

#### 3. Background Notifications Not Working
**Problem**: Notifications only work in foreground
**Solution**:
- Check Android notification channels
- Verify iOS notification settings
- Test with different notification types

#### 4. Deep Linking Issues
**Problem**: Tapping notification doesn't navigate correctly
**Solution**:
- Check notification data payload
- Verify navigation logic
- Test with different app states

### Debug Commands

```bash
# Check FCM token
adb logcat | grep "FCM"

# Check notification permissions
adb shell dumpsys notification

# Test notification
curl -X POST "https://your-api.com/api/fcm/send" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tokens": ["YOUR_FCM_TOKEN"],
    "title": "Test Notification",
    "body": "This is a test message"
  }'
```

## Testing

### 1. Test FCM Token Registration
```javascript
// Add this to your app for testing
const testFCMToken = async () => {
  const token = await FirebaseService.getToken();
  console.log('FCM Token:', token);
  
  try {
    await ApiService.updateFCMToken(token);
    Alert.alert('Success', 'FCM token registered successfully');
  } catch (error) {
    Alert.alert('Error', 'Failed to register FCM token');
  }
};
```

### 2. Test Notification Reception
```javascript
// Add this to test notification handling
const testNotification = () => {
  FirebaseService.onMessage((remoteMessage) => {
    console.log('Test notification received:', remoteMessage);
    Alert.alert('Notification', remoteMessage.notification?.body);
  });
};
```

### 3. Test Host Announcement
```javascript
// Add this to test host announcement functionality
const testHostAnnouncement = async (eventId) => {
  try {
    const response = await ApiService.sendHostAnnouncement(eventId, {
      message: 'This is a test announcement from the host.',
      title: 'Test Announcement',
      priority: 'normal'
    });
    
    console.log('Host announcement sent:', response);
    Alert.alert('Success', `Sent to ${response.data.eligibleParticipants} participants`);
  } catch (error) {
    console.error('Host announcement error:', error);
    Alert.alert('Error', 'Failed to send host announcement');
  }
};
```

## Conclusion

This guide provides a comprehensive foundation for integrating FCM with your React Native app and the Event Management API. The implementation includes proper error handling, user preferences, and follows React Native best practices.

For additional support or questions, refer to:
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Documentation](https://rnfirebase.io/)
- [React Native Documentation](https://reactnative.dev/)

Remember to test thoroughly on both Android and iOS devices, and consider user experience when implementing notification features.

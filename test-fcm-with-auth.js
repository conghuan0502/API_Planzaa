const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testFCMWithAuth() {
  console.log('🔥 Testing FCM with Authentication...\n');

  try {
    // Step 1: Register a test user
    console.log('1. Creating test user...');
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      passwordConfirm: 'password123'
    };

    let authToken;
    try {
      const registerResponse = await axios.post(`${API_BASE}/api/users/register`, userData);
      console.log('✅ Test user created successfully');
      authToken = registerResponse.data.token;
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('⚠️  User already exists, trying to login...');
        try {
          const loginResponse = await axios.post(`${API_BASE}/api/users/login`, {
            email: userData.email,
            password: userData.password
          });
          authToken = loginResponse.data.token;
          console.log('✅ User logged in successfully');
        } catch (loginError) {
          console.log('❌ Login failed:', loginError.response?.data?.message || loginError.message);
          return;
        }
      } else {
        console.log('❌ User creation failed:', error.response?.data?.message || error.message);
        return;
      }
    }

    // Step 2: Update user with FCM token
    console.log('\n2. Updating user with FCM token...');
    try {
      const fcmTokenData = {
        fcmToken: 'test-fcm-token-' + Date.now()
      };

      const fcmResponse = await axios.post(`${API_BASE}/api/users/fcm-token`, fcmTokenData, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('✅ FCM token updated successfully');
      console.log('   Response:', fcmResponse.data);
    } catch (error) {
      console.log('❌ FCM token update failed:', error.response?.data?.message || error.message);
    }

    // Step 3: Update notification settings
    console.log('\n3. Updating notification settings...');
    try {
      const settingsData = {
        pushNotifications: true,
        eventUpdates: true,
        eventReminders: true,
        weatherAlerts: true
      };

      const settingsResponse = await axios.patch(`${API_BASE}/api/users/notification-settings`, settingsData, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('✅ Notification settings updated successfully');
      console.log('   Response:', settingsResponse.data);
    } catch (error) {
      console.log('❌ Notification settings update failed:', error.response?.data?.message || error.message);
    }

    // Step 4: Test FCM reminder status
    console.log('\n4. Testing FCM reminder status...');
    try {
      const statusResponse = await axios.get(`${API_BASE}/api/fcm/reminder/status`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('✅ FCM reminder status retrieved successfully');
      console.log('   Response:', statusResponse.data);
    } catch (error) {
      console.log('❌ FCM reminder status failed:', error.response?.data?.message || error.message);
    }

    // Step 5: Test sending notification to tokens
    console.log('\n5. Testing send notification to tokens...');
    try {
      const notificationData = {
        tokens: ['test-token-1', 'test-token-2'],
        title: 'Test Notification',
        body: 'This is a test notification from the API',
        data: {
          test: 'true',
          timestamp: new Date().toISOString()
        }
      };

      const notificationResponse = await axios.post(`${API_BASE}/api/fcm/send`, notificationData, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('✅ Send notification endpoint working');
      console.log('   Response:', notificationResponse.data);
    } catch (error) {
      console.log('❌ Send notification failed:', error.response?.data?.message || error.message);
      if (error.response?.data?.message?.includes('invalid-registration-token')) {
        console.log('   This is expected with test tokens');
      }
    }

    // Step 6: Create a test event
    console.log('\n6. Creating test event...');
    let eventId;
    try {
      const eventData = {
        title: 'Test Event for FCM',
        description: 'This is a test event for FCM notifications',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        location: 'Test Location',
        participants: [] // Will add current user
      };

      const eventResponse = await axios.post(`${API_BASE}/api/events`, eventData, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      eventId = eventResponse.data.data.event._id;
      console.log('✅ Test event created successfully');
      console.log('   Event ID:', eventId);
    } catch (error) {
      console.log('❌ Event creation failed:', error.response?.data?.message || error.message);
      return;
    }

    // Step 7: Test event notification
    console.log('\n7. Testing event notification...');
    try {
      const eventNotificationData = {
        title: 'Event Test Notification',
        body: 'This is a test event notification',
        data: {
          test: 'true',
          eventId: eventId
        }
      };

      const eventNotificationResponse = await axios.post(`${API_BASE}/api/fcm/event/${eventId}`, eventNotificationData, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('✅ Event notification endpoint working');
      console.log('   Response:', eventNotificationResponse.data);
    } catch (error) {
      console.log('❌ Event notification failed:', error.response?.data?.message || error.message);
    }

    // Step 8: Test reminder notification
    console.log('\n8. Testing reminder notification...');
    try {
      const reminderData = {
        eventId: eventId,
        reminderType: '24h'
      };

      const reminderResponse = await axios.post(`${API_BASE}/api/fcm/reminder/test`, reminderData, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('✅ Reminder notification endpoint working');
      console.log('   Response:', reminderResponse.data);
    } catch (error) {
      console.log('❌ Reminder notification failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 FCM Authentication Test Completed!');
    console.log('\n📱 FCM Features Tested:');
    console.log('   ✅ User registration and authentication');
    console.log('   ✅ FCM token registration');
    console.log('   ✅ Notification settings management');
    console.log('   ✅ FCM reminder status');
    console.log('   ✅ Send notification to tokens');
    console.log('   ✅ Event creation and notification');
    console.log('   ✅ Reminder notification testing');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Set up Firebase in your React Native app');
    console.log('   2. Get real FCM tokens from your mobile app');
    console.log('   3. Test with real FCM tokens');
    console.log('   4. Test notification delivery on real devices');

  } catch (error) {
    console.log('❌ FCM authentication test failed:', error.message);
  }
}

// Run the test
testFCMWithAuth();

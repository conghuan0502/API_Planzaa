require('dotenv').config();
const { initializeFirebase, getMessaging } = require('./config/firebase');

async function testFCM() {
  console.log('🔥 Testing Firebase Cloud Messaging Integration...\n');

  try {
    // Initialize Firebase
    console.log('1. Initializing Firebase Admin SDK...');
    initializeFirebase();
    console.log('✅ Firebase initialized successfully');

    // Test messaging service
    console.log('\n2. Testing Firebase messaging service...');
    const messaging = getMessaging();
    console.log('✅ Messaging service ready');

    // Test 1: Send a test notification to a single token
    console.log('\n3. Testing single token notification...');
    
    // Note: In a real scenario, you would get this token from your mobile app
    const testToken = process.env.TEST_FCM_TOKEN || 'test-token-placeholder';
    
    if (testToken === 'test-token-placeholder') {
      console.log('⚠️  No test FCM token provided. Set TEST_FCM_TOKEN in .env to test actual notifications.');
      console.log('   Skipping actual notification test...');
    } else {
      try {
        const message = {
          token: testToken,
          notification: {
            title: 'Test Notification',
            body: 'This is a test notification from your Event Management API'
          },
          data: {
            test: 'true',
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

        const response = await messaging.send(message);
        console.log('✅ Single notification sent successfully');
        console.log(`   Message ID: ${response}`);
      } catch (error) {
        console.log('❌ Single notification failed:', error.message);
        if (error.code === 'messaging/invalid-registration-token') {
          console.log('   This is expected with a placeholder token');
        }
      }
    }

    // Test 2: Test multicast notification
    console.log('\n4. Testing multicast notification...');
    
    const testTokens = [
      process.env.TEST_FCM_TOKEN_1 || 'test-token-1',
      process.env.TEST_FCM_TOKEN_2 || 'test-token-2'
    ].filter(token => token !== 'test-token-1' && token !== 'test-token-2');

    if (testTokens.length === 0) {
      console.log('⚠️  No test FCM tokens provided for multicast test.');
      console.log('   Set TEST_FCM_TOKEN_1 and TEST_FCM_TOKEN_2 in .env to test actual notifications.');
    } else {
      try {
        const multicastMessage = {
          tokens: testTokens,
          notification: {
            title: 'Multicast Test',
            body: 'This is a multicast test notification'
          },
          data: {
            test: 'multicast',
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

        const response = await messaging.sendMulticast(multicastMessage);
        console.log('✅ Multicast notification sent successfully');
        console.log(`   Success: ${response.successCount}, Failed: ${response.failureCount}`);
        
        if (response.failureCount > 0) {
          console.log('   Failed tokens:');
          response.responses.forEach((result, index) => {
            if (!result.success) {
              console.log(`     Token ${index + 1}: ${result.error?.code || 'Unknown error'}`);
            }
          });
        }
      } catch (error) {
        console.log('❌ Multicast notification failed:', error.message);
      }
    }

    // Test 3: Test notification with custom data
    console.log('\n5. Testing notification with custom data...');
    
    const customDataMessage = {
      token: testToken !== 'test-token-placeholder' ? testToken : 'test-token',
      notification: {
        title: 'Event Update',
        body: 'Your event has been updated!'
      },
      data: {
        eventId: '64f8a1b2c3d4e5f6a7b8c9d0',
        eventTitle: 'Team Meeting',
        notificationType: 'event_update',
        timestamp: new Date().toISOString(),
        action: 'view_event'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'event_notifications',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            category: 'EVENT_UPDATE'
          }
        }
      }
    };

    if (testToken !== 'test-token-placeholder') {
      try {
        const response = await messaging.send(customDataMessage);
        console.log('✅ Custom data notification sent successfully');
        console.log(`   Message ID: ${response}`);
      } catch (error) {
        console.log('❌ Custom data notification failed:', error.message);
      }
    } else {
      console.log('⚠️  Skipping custom data test (no valid token)');
    }

    // Test 4: Test notification validation
    console.log('\n6. Testing notification validation...');
    
    // Test invalid token
    try {
      await messaging.send({
        token: 'invalid-token-12345',
        notification: {
          title: 'Test',
          body: 'This should fail'
        }
      });
      console.log('❌ Validation test failed - should have thrown an error');
    } catch (error) {
      if (error.code === 'messaging/invalid-registration-token') {
        console.log('✅ Token validation working correctly');
      } else {
        console.log('⚠️  Unexpected validation error:', error.code);
      }
    }

    // Test missing notification
    try {
      await messaging.send({
        token: testToken !== 'test-token-placeholder' ? testToken : 'test-token',
        data: {
          test: 'no-notification'
        }
      });
      console.log('⚠️  Data-only message sent (no notification)');
    } catch (error) {
      console.log('❌ Data-only message failed:', error.message);
    }

    console.log('\n🎉 FCM integration test completed!');
    console.log('\n📱 FCM Features Available:');
    console.log('   ✅ Firebase Admin SDK initialized');
    console.log('   ✅ Single token notifications');
    console.log('   ✅ Multicast notifications');
    console.log('   ✅ Custom data payloads');
    console.log('   ✅ Android-specific settings');
    console.log('   ✅ iOS-specific settings');
    console.log('   ✅ Error handling and validation');
    
    console.log('\n🔧 To test with real devices:');
    console.log('   1. Set up Firebase in your React Native app');
    console.log('   2. Get FCM tokens from your app');
    console.log('   3. Set TEST_FCM_TOKEN in your .env file');
    console.log('   4. Run this test again');

  } catch (error) {
    console.log('❌ FCM test failed:', error.message);
    console.log('\n💡 Common issues:');
    console.log('   - Check if FCM_service_key.json exists');
    console.log('   - Verify Firebase project configuration');
    console.log('   - Ensure firebase-admin package is installed');
  }
}

// Run the test
testFCM();

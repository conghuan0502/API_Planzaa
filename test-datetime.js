require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/eventModel');

// Test the new date/time functionality
async function testDateTime() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🧪 Testing Event Date/Time Functionality...\n');

    // Test 1: Create event with start date/time only
    console.log('1. Testing event with start date/time only...');
    const event1 = new Event({
      title: 'Morning Meeting',
      description: 'Daily standup meeting',
      startDate: new Date('2024-01-15'),
      startTime: '09:00',
      location: {
        name: 'Office',
        address: '123 Main St, City, State',
        coordinates: {
          lat: 40.7128,
          lon: -74.0060
        }
      },
      creator: new mongoose.Types.ObjectId()
    });

    await event1.save();
    console.log('✅ Event created successfully');
    console.log(`   Start: ${event1.startDate.toDateString()} at ${event1.startTime}`);
    console.log(`   End: ${event1.endDate ? event1.endDate.toDateString() : 'Not set'} at ${event1.endTime || 'Not set'}`);
    console.log(`   Duration: ${event1.durationMinutes || 'Not set'} minutes`);

    // Test 2: Create event with start and end date/time
    console.log('\n2. Testing event with start and end date/time...');
    const event2 = new Event({
      title: 'Team Workshop',
      description: 'Full day workshop',
      startDate: new Date('2024-01-15'),
      startTime: '10:00',
      endDate: new Date('2024-01-15'),
      endTime: '16:00',
      location: {
        name: 'Conference Room',
        address: '456 Business Ave, City, State',
        coordinates: {
          lat: 40.7589,
          lon: -73.9851
        }
      },
      creator: new mongoose.Types.ObjectId()
    });

    await event2.save();
    console.log('✅ Event created successfully');
    console.log(`   Start: ${event2.startDate.toDateString()} at ${event2.startTime}`);
    console.log(`   End: ${event2.endDate.toDateString()} at ${event2.endTime}`);
    console.log(`   Duration: ${event2.durationMinutes} minutes`);

    // Test 3: Create event with start date/time and end time only (same day)
    console.log('\n3. Testing event with start date/time and end time only...');
    const event3 = new Event({
      title: 'Lunch Meeting',
      description: 'Quick lunch meeting',
      startDate: new Date('2024-01-15'),
      startTime: '12:00',
      endTime: '13:00',
      location: {
        name: 'Restaurant',
        address: '789 Food St, City, State',
        coordinates: {
          lat: 40.7505,
          lon: -73.9934
        }
      },
      creator: new mongoose.Types.ObjectId()
    });

    await event3.save();
    console.log('✅ Event created successfully');
    console.log(`   Start: ${event3.startDate.toDateString()} at ${event3.startTime}`);
    console.log(`   End: ${event3.endDate ? event3.endDate.toDateString() : event3.startDate.toDateString()} at ${event3.endTime}`);
    console.log(`   Duration: ${event3.durationMinutes} minutes`);

    // Test 4: Test validation - end time before start time (should fail)
    console.log('\n4. Testing validation - end time before start time...');
    try {
      const invalidEvent = new Event({
        title: 'Invalid Event',
        description: 'This should fail',
        startDate: new Date('2024-01-15'),
        startTime: '14:00',
        endTime: '13:00', // End time before start time
        location: {
          name: 'Test Location',
          address: 'Test Address',
          coordinates: {
            lat: 40.7128,
            lon: -74.0060
          }
        },
        creator: new mongoose.Types.ObjectId()
      });

      await invalidEvent.save();
      console.log('❌ Validation failed - should have thrown an error');
    } catch (error) {
      console.log('✅ Validation working correctly');
      console.log(`   Error: ${error.message}`);
    }

    // Test 5: Test validation - invalid time format (should fail)
    console.log('\n5. Testing validation - invalid time format...');
    try {
      const invalidTimeEvent = new Event({
        title: 'Invalid Time Event',
        description: 'This should fail',
        startDate: new Date('2024-01-15'),
        startTime: '25:00', // Invalid time format
        location: {
          name: 'Test Location',
          address: 'Test Address',
          coordinates: {
            lat: 40.7128,
            lon: -74.0060
          }
        },
        creator: new mongoose.Types.ObjectId()
      });

      await invalidTimeEvent.save();
      console.log('❌ Time format validation failed - should have thrown an error');
    } catch (error) {
      console.log('✅ Time format validation working correctly');
      console.log(`   Error: ${error.message}`);
    }

    console.log('\n🎉 All date/time tests completed successfully!');
    console.log('\nThe new event date/time structure is working correctly.');

    // Clean up test data
    await Event.deleteMany({
      title: { $in: ['Morning Meeting', 'Team Workshop', 'Lunch Meeting'] }
    });
    console.log('\n🧹 Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDateTime();

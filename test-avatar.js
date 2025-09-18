const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

// Test avatar functionality
async function testAvatar() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a unique email using timestamp
    const timestamp = Date.now();
    const uniqueEmail = `test${timestamp}@example.com`;

    // Create a test user
    const testUser = new User({
      name: 'Test User',
      email: uniqueEmail,
      password: 'password123',
      avatar: {
        url: 'https://res.cloudinary.com/test/image/upload/v1234567890/avatar_test123.jpg',
        cloudinaryId: 'avatar_test123'
      }
    });

    // Save the user
    await testUser.save();
    console.log('Test user created with avatar:', testUser.avatar);

    // Find the user and verify avatar
    const foundUser = await User.findById(testUser._id);
    console.log('Found user avatar:', foundUser.avatar);

    // Test virtual fields
    console.log('User age:', foundUser.age);

    // Clean up - delete test user
    await User.findByIdAndDelete(testUser._id);
    console.log('Test user deleted');

    console.log('Avatar functionality test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testAvatar();

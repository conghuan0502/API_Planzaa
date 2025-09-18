require('dotenv').config();
const cloudinary = require('./config/cloudinary');

async function testCloudinaryConnection() {
  try {
    console.log('Testing Cloudinary connection...');
    
    // Test configuration
    console.log('Cloudinary Config:');
    console.log('- Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing');
    console.log('- API Key:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
    console.log('- API Secret:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
    
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('\n❌ Missing Cloudinary environment variables!');
      console.error('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
      return;
    }
    
    // Test API connection by getting account info
    const result = await cloudinary.api.ping();
    console.log('\n✅ Cloudinary connection successful!');
    console.log('Response:', result);
    
    // Test upload capabilities (optional - creates a test image)
    console.log('\nTesting upload capabilities...');
    const uploadResult = await cloudinary.uploader.upload(
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwZmYwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlRlc3Q8L3RleHQ+PC9zdmc+',
      {
        folder: 'test',
        public_id: 'test-connection',
        resource_type: 'image'
      }
    );
    
    console.log('✅ Test upload successful!');
    console.log('Uploaded image URL:', uploadResult.secure_url);
    
    // Clean up test image
    await cloudinary.uploader.destroy('test/test-connection');
    console.log('✅ Test image cleaned up');
    
  } catch (error) {
    console.error('\n❌ Cloudinary test failed:', error.message);
    
    if (error.message.includes('Invalid API credentials')) {
      console.error('Please check your Cloudinary API credentials in the .env file');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('Network error - please check your internet connection');
    }
  }
}

// Run the test
testCloudinaryConnection();

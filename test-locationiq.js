require('dotenv').config();
const axios = require('axios');

// Test LocationIQ API integration
async function testLocationIQ() {
  const apiKey = process.env.LOCATIONIQ_API_KEY;
  
  if (!apiKey) {
    console.log('❌ LOCATIONIQ_API_KEY not found in environment variables');
    console.log('Please add your LocationIQ API key to your .env file');
    return;
  }

  console.log('🧪 Testing LocationIQ API Integration...\n');

  try {
    // Test 1: Search locations
    console.log('1. Testing location search...');
    const searchResponse = await axios.get('https://api.locationiq.com/v1/search', {
      params: {
        key: apiKey,
        q: 'Central Park',
        format: 'json',
        limit: 3,
        addressdetails: 1
      }
    });
    console.log('✅ Search successful - Found', searchResponse.data.length, 'locations');
    console.log('   First result:', searchResponse.data[0].display_name);

    // Test 2: Reverse geocoding
    console.log('\n2. Testing reverse geocoding...');
    const reverseResponse = await axios.get('https://api.locationiq.com/v1/reverse', {
      params: {
        key: apiKey,
        lat: '40.7829',
        lon: '-73.9654',
        format: 'json',
        addressdetails: 1
      }
    });
    console.log('✅ Reverse geocoding successful');
    console.log('   Address:', reverseResponse.data.display_name);

    console.log('\n🎉 All LocationIQ API tests passed!');
    console.log('\nYour API key is working correctly.');
    console.log('You can now use the location endpoints in your application.');

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.error || error.message);
    
    if (error.response?.status === 403) {
      console.log('\n💡 This might be due to:');
      console.log('   - Invalid API key');
      console.log('   - API quota exceeded');
      console.log('   - Account not activated');
    }
  }
}

// Run the test
testLocationIQ();

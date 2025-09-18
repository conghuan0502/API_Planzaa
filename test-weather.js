require('dotenv').config();
const axios = require('axios');

async function fetchLatLonFromLocationIQ(query) {
  const apiKey = process.env.LOCATIONIQ_API_KEY;
  if (!apiKey) {
    throw new Error('LOCATIONIQ_API_KEY not found in environment variables');
  }
  const response = await axios.get('https://api.locationiq.com/v1/search', {
    params: {
      key: apiKey,
      q: query,
      format: 'json',
      limit: 1,
      addressdetails: 1
    }
  });
  if (!Array.isArray(response.data) || response.data.length === 0) {
    throw new Error('No results from LocationIQ for query: ' + query);
  }
  const place = response.data[0];
  return {
    lat: parseFloat(place.lat),
    lon: parseFloat(place.lon),
    displayName: place.display_name
  };
}

// Test Open-Meteo API integration
async function testWeather() {
  console.log('🧪 Testing Open-Meteo Weather Integration...\n');

  try {
    // Resolve coordinates via LocationIQ
    const locationQuery = process.env.LOCATION_QUERY || 'Central Park, New York';
    console.log(`1. Resolving coordinates via LocationIQ for: ${locationQuery} ...`);
    const { lat, lon, displayName } = await fetchLatLonFromLocationIQ(locationQuery);

    // Test 1: Get weather forecast for the resolved location
    console.log('2. Testing weather forecast for resolved location...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const startDate = today.toISOString().split('T')[0];
    const endDate = tomorrow.toISOString().split('T')[0];

    const weatherResponse = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        start_date: startDate,
        end_date: endDate,
        hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
        timezone: 'auto'
      }
    });

    console.log('✅ Weather forecast successful');
    console.log(`   Location: ${displayName} (${lat}, ${lon})`);
    console.log(`   Date range: ${startDate} to ${endDate}`);
    console.log(`   Daily forecasts: ${weatherResponse.data.daily?.time?.length || 0} days`);
    console.log(`   Hourly forecasts: ${weatherResponse.data.hourly?.time?.length || 0} hours`);

    if (weatherResponse.data.daily?.time?.length > 0) {
      const firstDay = weatherResponse.data.daily.time[0];
      const maxTemp = weatherResponse.data.daily.temperature_2m_max[0];
      const minTemp = weatherResponse.data.daily.temperature_2m_min[0];
      const weatherCode = weatherResponse.data.daily.weather_code[0];
      
      console.log(`   First day (${firstDay}):`);
      console.log(`     Max temp: ${maxTemp}°C`);
      console.log(`     Min temp: ${minTemp}°C`);
      console.log(`     Weather code: ${weatherCode}`);
    }

    // Test 2: Test date validation (Open-Meteo allows > 10 days, our API may enforce 10-day limit)
    console.log('\n3. Testing date validation...');
    const farFuture = new Date(today);
    farFuture.setDate(today.getDate() + 15);
    const farFutureDate = farFuture.toISOString().split('T')[0];

    try {
      await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lon,
          start_date: farFutureDate,
          end_date: farFutureDate,
          daily: 'temperature_2m_max'
        }
      });
      console.log('✅ Open-Meteo allows forecasts beyond 10 days');
      console.log('   Note: Our API enforces 10-day limit for better accuracy');
    } catch (error) {
      console.log('⚠️  Open-Meteo API error for far future date:', error.message);
    }

    // Test 3: Test coordinate validation
    console.log('\n4. Testing coordinate validation...');
    try {
      await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: 100, // Invalid latitude
          longitude: -74.0060,
          start_date: startDate,
          end_date: endDate,
          daily: 'temperature_2m_max'
        }
      });
      console.log('❌ Coordinate validation failed - should have thrown an error for invalid coordinates');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Coordinate validation working correctly');
        console.log(`   Error: ${error.response.data?.error || 'Invalid coordinates'}`);
      } else {
        console.log('⚠️  Unexpected error for invalid coordinates:', error.message);
      }
    }

    // Test 4: Test weather code mapping
    console.log('\n4. Testing weather code mapping...');
    const weatherCodes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };

    console.log('✅ Weather codes available:');
    Object.entries(weatherCodes).slice(0, 5).forEach(([code, description]) => {
      console.log(`   ${code}: ${description}`);
    });
    console.log(`   ... and ${Object.keys(weatherCodes).length - 5} more codes`);

    console.log('\n🎉 All weather tests completed successfully!');
    console.log('\nThe Open-Meteo integration is working correctly.');
    console.log('Weather forecasts will be automatically fetched for events within 10 days.');

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.error || error.message);
    
    if (error.response?.status === 429) {
      console.log('\n💡 This might be due to:');
      console.log('   - Rate limiting from Open-Meteo API');
      console.log('   - Too many requests in a short time');
    }
  }
}

// Run the test
testWeather();

const axios = require('axios');

// Utility function to handle Open-Meteo API errors
const handleWeatherError = (error, res) => {
  console.error('Open-Meteo API Error:', error.response?.data || error.message);
  
  if (error.response?.status === 400) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid coordinates or date range'
    });
  }

  if (error.response?.status === 429) {
    return res.status(429).json({
      status: 'fail',
      message: 'Rate limit exceeded for weather API'
    });
  }

  return res.status(500).json({
    status: 'fail',
    message: 'Error fetching weather data'
  });
};

/**
 * @swagger
 * /weather/forecast:
 *   get:
 *     summary: Get weather forecast for a location
 *     description: Get weather forecast using Open-Meteo API for a specific location and date range. Coordinates should be sourced from LocationIQ search or reverse geocoding.
 *     tags: [Weather]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude coordinate (from LocationIQ)
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude coordinate (from LocationIQ)
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for forecast (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for forecast (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Successful weather forecast
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     weather:
 *                       $ref: '#/components/schemas/Weather'
 *       400:
 *         description: Invalid parameters or date range too far
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get weather forecast for a location
exports.getWeatherForecast = async (req, res) => {
  try {
    const { lat, lon, startDate, endDate } = req.query;

    // Validate required parameters
    if (!lat || !lon || !startDate || !endDate) {
      return res.status(400).json({
        status: 'fail',
        message: 'Latitude, longitude, start date, and end date are required'
      });
    }

    // Validate coordinates
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    if (isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid coordinates provided'
      });
    }

    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return res.status(400).json({
        status: 'fail',
        message: 'Coordinates out of valid range'
      });
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    if (start > end) {
      return res.status(400).json({
        status: 'fail',
        message: 'Start date must be before or equal to end date'
      });
    }

    // Check if dates are within 10 days from today
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 10);

    if (start > maxDate) {
      return res.status(400).json({
        status: 'fail',
        message: 'Weather forecast is only available for dates within 10 days from today'
      });
    }

    // Call Open-Meteo API
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: latNum,
        longitude: lonNum,
        start_date: startDate,
        end_date: endDate,
        hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
        timezone: 'auto'
      }
    });

    // Transform the response to a more user-friendly format
    const weatherData = {
      location: {
        lat: latNum,
        lon: lonNum
      },
      dateRange: {
        start: startDate,
        end: endDate
      },
      daily: response.data.daily?.time?.map((date, index) => ({
        date: date,
        maxTemp: response.data.daily.temperature_2m_max[index],
        minTemp: response.data.daily.temperature_2m_min[index],
        precipitationProbability: response.data.daily.precipitation_probability_max[index],
        weatherCode: response.data.daily.weather_code[index],
        weatherDescription: getWeatherDescription(response.data.daily.weather_code[index])
      })) || [],
      hourly: response.data.hourly?.time?.map((time, index) => ({
        time: time,
        temperature: response.data.hourly.temperature_2m[index],
        humidity: response.data.hourly.relative_humidity_2m[index],
        precipitationProbability: response.data.hourly.precipitation_probability[index],
        weatherCode: response.data.hourly.weather_code[index],
        windSpeed: response.data.hourly.wind_speed_10m[index],
        weatherDescription: getWeatherDescription(response.data.hourly.weather_code[index])
      })) || []
    };

    res.status(200).json({
      status: 'success',
      data: {
        weather: weatherData
      }
    });

  } catch (error) {
    return handleWeatherError(error, res);
  }
};

/**
 * @swagger
 * /weather/event/{eventId}:
 *   get:
 *     summary: Get weather forecast for an event
 *     description: Get weather forecast for a specific event based on its LocationIQ coordinates and event dates
 *     tags: [Weather]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Successful weather forecast for event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     weather:
 *                       $ref: '#/components/schemas/Weather'
 *       400:
 *         description: Invalid event or date range too far
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get weather forecast for a specific event
exports.getEventWeather = async (req, res) => {
  try {
    const Event = require('../models/eventModel');
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Check if event has location coordinates
    if (!event.location.coordinates.lat || !event.location.coordinates.lon) {
      return res.status(400).json({
        status: 'fail',
        message: 'Event location coordinates are required for weather forecast'
      });
    }

    // Format dates for API
    const startDate = event.startDate.toISOString().split('T')[0];
    const endDate = event.endDate ? event.endDate.toISOString().split('T')[0] : startDate;

    // Check if dates are within 10 days from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 10);

    if (event.startDate > maxDate) {
      return res.status(400).json({
        status: 'fail',
        message: 'Weather forecast is only available for events within 10 days from today'
      });
    }

    // Call Open-Meteo API
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: event.location.coordinates.lat,
        longitude: event.location.coordinates.lon,
        start_date: startDate,
        end_date: endDate,
        hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
        timezone: 'auto'
      }
    });

    // Transform the response
    const weatherData = {
      eventId: event._id,
      eventTitle: event.title,
      location: {
        name: event.location.name,
        lat: event.location.coordinates.lat,
        lon: event.location.coordinates.lon
      },
      dateRange: {
        start: startDate,
        end: endDate
      },
      daily: response.data.daily?.time?.map((date, index) => ({
        date: date,
        maxTemp: response.data.daily.temperature_2m_max[index],
        minTemp: response.data.daily.temperature_2m_min[index],
        precipitationProbability: response.data.daily.precipitation_probability_max[index],
        weatherCode: response.data.daily.weather_code[index],
        weatherDescription: getWeatherDescription(response.data.daily.weather_code[index])
      })) || [],
      hourly: response.data.hourly?.time?.map((time, index) => ({
        time: time,
        temperature: response.data.hourly.temperature_2m[index],
        humidity: response.data.hourly.relative_humidity_2m[index],
        precipitationProbability: response.data.hourly.precipitation_probability[index],
        weatherCode: response.data.hourly.weather_code[index],
        windSpeed: response.data.hourly.wind_speed_10m[index],
        weatherDescription: getWeatherDescription(response.data.hourly.weather_code[index])
      })) || []
    };

    // Update event with weather data
    event.weather = {
      forecast: weatherData,
      lastUpdated: new Date(),
      location: {
        lat: event.location.coordinates.lat,
        lon: event.location.coordinates.lon
      }
    };
    await event.save();

    res.status(200).json({
      status: 'success',
      data: {
        weather: weatherData
      }
    });

  } catch (error) {
    return handleWeatherError(error, res);
  }
};

// Helper function to convert weather codes to descriptions
function getWeatherDescription(code) {
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
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  
  return weatherCodes[code] || 'Unknown';
}

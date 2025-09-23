const express = require('express');
const weatherController = require('../controllers/weatherController');
const { weatherCache } = require('../middleware/cacheMiddleware');

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

// Get weather forecast for a location (cached for 30 minutes)
router.get('/forecast', weatherCache(1800), weatherController.getWeatherForecast);

// Get weather forecast for a specific event (cached for 15 minutes)
router.get('/event/:eventId', weatherCache(900), weatherController.getEventWeather);

module.exports = router;

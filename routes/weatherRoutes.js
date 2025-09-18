const express = require('express');
const weatherController = require('../controllers/weatherController');

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

// Get weather forecast for a location
router.get('/forecast', weatherController.getWeatherForecast);

// Get weather forecast for a specific event
router.get('/event/:eventId', weatherController.getEventWeather);

module.exports = router;

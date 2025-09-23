const express = require('express');
const locationController = require('../controllers/locationController');
const { locationCache } = require('../middleware/cacheMiddleware');

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

// Search locations (cached for 1 hour)
router.get('/search', locationCache(3600), locationController.searchLocations);

// Get location details by coordinates (cached for 1 hour)
router.get('/details', locationCache(3600), locationController.getLocationDetails);

// Get nearby places (cached for 30 minutes)
router.get('/nearby', locationCache(1800), locationController.getNearbyPlaces);

module.exports = router;

const express = require('express');
const locationController = require('../controllers/locationController');

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

// Search locations
router.get('/search', locationController.searchLocations);

// Get location details by coordinates (reverse geocoding)
router.get('/details', locationController.getLocationDetails);

// Get nearby places
router.get('/nearby', locationController.getNearbyPlaces);

module.exports = router;

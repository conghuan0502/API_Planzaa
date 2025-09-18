const axios = require('axios');

// Utility function to handle LocationIQ API errors
const handleLocationIQError = (error, res) => {
  console.error('LocationIQ API Error:', error.response?.data || error.message);
  
  if (error.response?.status === 403) {
    return res.status(403).json({
      status: 'fail',
      message: 'Invalid LocationIQ API key or quota exceeded'
    });
  }

  if (error.response?.status === 429) {
    return res.status(429).json({
      status: 'fail',
      message: 'Rate limit exceeded for LocationIQ API'
    });
  }

  if (error.response?.status === 400) {
    return res.status(400).json({
      status: 'fail',
      message: error.response.data?.error || 'Invalid request parameters'
    });
  }

  return res.status(500).json({
    status: 'fail',
    message: 'Error processing location request'
  });
};

/**
 * @swagger
 * /locations/search:
 *   get:
 *     summary: Search locations using LocationIQ API
 *     description: Search for places by name or address using LocationIQ geocoding service
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (place name, address, etc.)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results to return
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           default: json
 *         description: Response format
 *     responses:
 *       200:
 *         description: Successful search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: object
 *                   properties:
 *                     locations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           place_id:
 *                             type: string
 *                           display_name:
 *                             type: string
 *                           lat:
 *                             type: string
 *                           lon:
 *                             type: string
 *                           type:
 *                             type: string
 *                           importance:
 *                             type: number
 *                           address:
 *                             type: object
 *       400:
 *         description: Missing query parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error or API key not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Search locations using LocationIQ API
exports.searchLocations = async (req, res) => {
  try {
    const { query, limit = 10, format = 'json' } = req.query;

    if (!query) {
      return res.status(400).json({
        status: 'fail',
        message: 'Query parameter is required'
      });
    }

    const locationIQApiKey = process.env.LOCATIONIQ_API_KEY;
    
    if (!locationIQApiKey) {
      return res.status(500).json({
        status: 'fail',
        message: 'LocationIQ API key not configured'
      });
    }

    const response = await axios.get('https://api.locationiq.com/v1/search', {
      params: {
        key: locationIQApiKey,
        q: query,
        format: format,
        limit: limit,
        addressdetails: 1,
        accept_language: 'en'
      }
    });

    // Transform the response to a more user-friendly format
    const locations = response.data.map(place => ({
      place_id: place.place_id,
      display_name: place.display_name,
      lat: place.lat,
      lon: place.lon,
      type: place.type,
      importance: place.importance,
      address: {
        house_number: place.address?.house_number,
        road: place.address?.road,
        neighbourhood: place.address?.neighbourhood,
        suburb: place.address?.suburb,
        city: place.address?.city,
        state: place.address?.state,
        country: place.address?.country,
        postcode: place.address?.postcode
      }
    }));

    res.status(200).json({
      status: 'success',
      results: locations.length,
      data: {
        locations
      }
    });

  } catch (error) {
    return handleLocationIQError(error, res);
  }
};

/**
 * @swagger
 * /locations/details:
 *   get:
 *     summary: Get location details by coordinates (reverse geocoding)
 *     description: Get address details from latitude and longitude coordinates using LocationIQ reverse geocoding
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude coordinate
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude coordinate
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           default: json
 *         description: Response format
 *     responses:
 *       200:
 *         description: Successful location details
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
 *                     location:
 *                       type: object
 *                       properties:
 *                         place_id:
 *                           type: string
 *                         display_name:
 *                           type: string
 *                         lat:
 *                           type: string
 *                         lon:
 *                           type: string
 *                         address:
 *                           type: object
 *       400:
 *         description: Missing coordinates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error or API key not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get location details by coordinates
exports.getLocationDetails = async (req, res) => {
  try {
    const { lat, lon, format = 'json' } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        status: 'fail',
        message: 'Latitude and longitude parameters are required'
      });
    }

    const locationIQApiKey = process.env.LOCATIONIQ_API_KEY;
    
    if (!locationIQApiKey) {
      return res.status(500).json({
        status: 'fail',
        message: 'LocationIQ API key not configured'
      });
    }

    const response = await axios.get('https://api.locationiq.com/v1/reverse', {
      params: {
        key: locationIQApiKey,
        lat: lat,
        lon: lon,
        format: format,
        addressdetails: 1,
        accept_language: 'en'
      }
    });

    const locationDetails = {
      place_id: response.data.place_id,
      display_name: response.data.display_name,
      lat: response.data.lat,
      lon: response.data.lon,
      address: response.data.address
    };

    res.status(200).json({
      status: 'success',
      data: {
        location: locationDetails
      }
    });

  } catch (error) {
    return handleLocationIQError(error, res);
  }
};

/**
 * @swagger
 * /locations/nearby:
 *   get:
 *     summary: Get nearby places by coordinates
 *     description: Find places near a specific location using LocationIQ nearby search
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude coordinate
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude coordinate
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           default: 1000
 *         description: Search radius in meters
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: Successful nearby places results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 8
 *                 data:
 *                   type: object
 *                   properties:
 *                     places:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           place_id:
 *                             type: string
 *                           display_name:
 *                             type: string
 *                           lat:
 *                             type: string
 *                           lon:
 *                             type: string
 *                           type:
 *                             type: string
 *                           distance:
 *                             type: number
 *       400:
 *         description: Missing coordinates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error or API key not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get nearby places
exports.getNearbyPlaces = async (req, res) => {
  try {
    const { lat, lon, radius = 1000, limit = 10 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        status: 'fail',
        message: 'Latitude and longitude parameters are required'
      });
    }

    const locationIQApiKey = process.env.LOCATIONIQ_API_KEY;
    
    if (!locationIQApiKey) {
      return res.status(500).json({
        status: 'fail',
        message: 'LocationIQ API key not configured'
      });
    }

    const response = await axios.get('https://api.locationiq.com/v1/nearby', {
      params: {
        key: locationIQApiKey,
        lat: lat,
        lon: lon,
        radius: radius,
        limit: limit,
        format: 'json'
      }
    });

    const nearbyPlaces = response.data.map(place => ({
      place_id: place.place_id,
      display_name: place.display_name,
      lat: place.lat,
      lon: place.lon,
      type: place.type,
      distance: place.distance
    }));

    res.status(200).json({
      status: 'success',
      results: nearbyPlaces.length,
      data: {
        places: nearbyPlaces
      }
    });

  } catch (error) {
    return handleLocationIQError(error, res);
  }
};

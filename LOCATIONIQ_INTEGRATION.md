# LocationIQ Integration Implementation

This document outlines the complete implementation of LocationIQ integration into the Event Management API for location search functionality.

## Overview

The LocationIQ integration provides three main functionalities:
1. **Location Search** - Search for places by name or address
2. **Reverse Geocoding** - Get address details from coordinates
3. **Nearby Places** - Find places near a specific location

## Implementation Details

### 1. Dependencies Added
- `axios` - For making HTTP requests to LocationIQ API

### 2. New Files Created

#### `controllers/locationController.js`
- `searchLocations()` - Search locations by query string
- `getLocationDetails()` - Get location details by coordinates
- `getNearbyPlaces()` - Get nearby places by coordinates
- Comprehensive error handling for LocationIQ API responses
- Swagger documentation for all endpoints

#### `routes/locationRoutes.js`
- `/api/locations/search` - Location search endpoint
- `/api/locations/details` - Reverse geocoding endpoint
- `/api/locations/nearby` - Nearby places endpoint

#### `test-locationiq.js`
- Test script to verify LocationIQ API integration
- Tests both search and reverse geocoding functionality

### 3. Modified Files

#### `models/eventModel.js`
Updated the location field from a simple string to a comprehensive object:
```javascript
location: {
  name: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  place_id: { type: String, default: null },
  display_name: { type: String, default: null }
}
```

#### `controllers/eventController.js`
- Added validation for the new location structure in `createEvent()`
- Ensures all required location fields are provided

#### `app.js`
- Added location routes to the application
- Routes are accessible at `/api/locations/*`

#### `swagger.js`
- Updated Event schema to reflect new location structure
- Added comprehensive documentation for location endpoints

#### `package.json`
- Added `test:locationiq` script for testing the integration

#### `README.md`
- Added LocationIQ setup instructions
- Added location endpoint documentation
- Added usage examples and event location structure

## API Endpoints

### 1. Search Locations
```
GET /api/locations/search?query=Central Park&limit=10
```

**Parameters:**
- `query` (required) - Search query string
- `limit` (optional) - Maximum results (default: 10)
- `format` (optional) - Response format (default: json)

**Response:**
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "locations": [
      {
        "place_id": "123456789",
        "display_name": "Central Park, New York, NY, USA",
        "lat": "40.7829",
        "lon": "-73.9654",
        "type": "park",
        "importance": 0.8,
        "address": {
          "city": "New York",
          "state": "NY",
          "country": "USA"
        }
      }
    ]
  }
}
```

### 2. Get Location Details (Reverse Geocoding)
```
GET /api/locations/details?lat=40.7829&lon=-73.9654
```

**Parameters:**
- `lat` (required) - Latitude coordinate
- `lon` (required) - Longitude coordinate
- `format` (optional) - Response format (default: json)

**Response:**
```json
{
  "status": "success",
  "data": {
    "location": {
      "place_id": "123456789",
      "display_name": "Central Park, New York, NY, USA",
      "lat": "40.7829",
      "lon": "-73.9654",
      "address": {
        "city": "New York",
        "state": "NY",
        "country": "USA"
      }
    }
  }
}
```

### 3. Get Nearby Places
```
GET /api/locations/nearby?lat=40.7829&lon=-73.9654&radius=1000&limit=10
```

**Parameters:**
- `lat` (required) - Latitude coordinate
- `lon` (required) - Longitude coordinate
- `radius` (optional) - Search radius in meters (default: 1000)
- `limit` (optional) - Maximum results (default: 10)

**Response:**
```json
{
  "status": "success",
  "results": 8,
  "data": {
    "places": [
      {
        "place_id": "123456789",
        "display_name": "Central Park Zoo",
        "lat": "40.7683",
        "lon": "-73.9716",
        "type": "zoo",
        "distance": 250
      }
    ]
  }
}
```

## Event Structure

When creating events, the structure must now include:

```json
{
  "title": "Tech Meetup",
  "description": "A great tech meetup",
  "startDate": "2024-01-15T00:00:00.000Z",
  "startTime": "14:30",
  "endDate": "2024-01-15T00:00:00.000Z",
  "endTime": "16:30",
  "location": {
    "name": "Central Park",
    "address": "Central Park, New York, NY, USA",
    "coordinates": {
      "lat": 40.7829,
      "lon": -73.9654
    },
    "place_id": "123456789",
    "display_name": "Central Park, New York, NY, USA"
  }
}
```

**Note:** 
- `startDate` and `startTime` are required
- `endDate` and `endTime` are optional
- Time format must be HH:MM (24-hour format, e.g., 14:30 for 2:30 PM)
- If end date/time is provided, it must be after the start date/time

## Setup Instructions

### 1. Get LocationIQ API Key
1. Sign up at [https://locationiq.com/](https://locationiq.com/)
2. Get your free API key from the dashboard
3. Add to your `.env` file:
   ```
   LOCATIONIQ_API_KEY=your_api_key_here
   ```

### 2. Test the Integration
```bash
npm run test:locationiq
```

### 3. Start the Server
```bash
npm run dev
```

## Error Handling

The integration includes comprehensive error handling for:
- Missing API key
- Invalid API key
- Rate limiting (429 errors)
- Quota exceeded (403 errors)
- Invalid request parameters (400 errors)
- Network errors

## React Native Integration

For React Native app integration, you can use these endpoints to:

1. **Location Search**: Allow users to search for event locations
2. **Auto-complete**: Provide location suggestions as users type
3. **Map Integration**: Use coordinates for map markers
4. **Address Validation**: Ensure locations are valid before creating events

### Example React Native Usage:
```javascript
// Search locations
const searchLocations = async (query) => {
  const response = await fetch(`/api/locations/search?query=${encodeURIComponent(query)}`);
  const data = await response.json();
  return data.data.locations;
};

// Get location details
const getLocationDetails = async (lat, lon) => {
  const response = await fetch(`/api/locations/details?lat=${lat}&lon=${lon}`);
  const data = await response.json();
  return data.data.location;
};
```

## Security Considerations

1. **API Key Protection**: The LocationIQ API key is stored in environment variables
2. **Rate Limiting**: The API includes rate limiting to prevent abuse
3. **Input Validation**: All location endpoints validate required parameters
4. **Error Sanitization**: Error messages don't expose sensitive information

## Future Enhancements

Potential improvements for the LocationIQ integration:
1. **Caching**: Cache frequently searched locations
2. **Geolocation**: Add user's current location detection
3. **Distance Calculation**: Calculate distances between locations
4. **Location Categories**: Filter locations by type (restaurant, park, etc.)
5. **Autocomplete**: Implement location autocomplete functionality

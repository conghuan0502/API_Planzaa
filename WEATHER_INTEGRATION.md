# Open-Meteo Weather Integration Implementation

This document outlines the complete implementation of Open-Meteo weather integration into the Event Management API for weather forecasting functionality.

## Overview

The Open-Meteo integration provides weather forecasting capabilities for events:
1. **Automatic Weather Fetching** - Weather data is automatically fetched when creating events within 10 days
2. **Location-Based Forecasts** - Get weather forecasts for any location using coordinates
3. **Event-Specific Weather** - Get weather forecasts for specific events
4. **Comprehensive Weather Data** - Temperature, humidity, precipitation probability, wind speed, and weather conditions

## Implementation Details

### 1. Dependencies
- `axios` - Already installed for LocationIQ integration, also used for Open-Meteo API calls

### 2. New Files Created

#### `controllers/weatherController.js`
- `getWeatherForecast()` - Get weather forecast for a location and date range
- `getEventWeather()` - Get weather forecast for a specific event
- Comprehensive error handling for Open-Meteo API responses
- Weather code mapping to human-readable descriptions
- Swagger documentation for all endpoints

#### `routes/weatherRoutes.js`
- `/api/weather/forecast` - Weather forecast endpoint
- `/api/weather/event/:eventId` - Event-specific weather endpoint

#### `test-weather.js`
- Test script to verify Open-Meteo API integration
- Tests weather fetching, date validation, and coordinate validation

### 3. Modified Files

#### `models/eventModel.js`
Added weather field to event schema:
```javascript
weather: {
  forecast: {
    type: Array,
    default: []
  },
  lastUpdated: {
    type: Date,
    default: null
  },
  location: {
    lat: {
      type: Number,
      default: null
    },
    lon: {
      type: Number,
      default: null
    }
  }
}
```

#### `controllers/eventController.js`
- Enhanced `createEvent()` function to automatically fetch weather data for events within 10 days
- Weather fetching is non-blocking (event creation succeeds even if weather fetch fails)

#### `app.js`
- Added weather routes to the application
- Routes are accessible at `/api/weather/*`

#### `swagger.js`
- Updated Event schema to include weather field
- Added comprehensive documentation for weather endpoints

#### `package.json`
- Added `test:weather` script for testing the integration

#### `README.md`
- Added weather integration documentation
- Added usage examples and weather data structure
- Added testing instructions

## API Endpoints

### 1. Get Weather Forecast for Location
```
GET /api/weather/forecast?lat=40.7128&lon=-74.0060&startDate=2024-01-15&endDate=2024-01-16
```

**Parameters:**
- `lat` (required) - Latitude coordinate
- `lon` (required) - Longitude coordinate
- `startDate` (required) - Start date for forecast (YYYY-MM-DD)
- `endDate` (required) - End date for forecast (YYYY-MM-DD)

**Response:**
```json
{
  "status": "success",
  "data": {
    "weather": {
      "location": {
        "lat": 40.7128,
        "lon": -74.0060
      },
      "dateRange": {
        "start": "2024-01-15",
        "end": "2024-01-16"
      },
      "daily": [
        {
          "date": "2024-01-15",
          "maxTemp": 25.5,
          "minTemp": 18.2,
          "precipitationProbability": 30,
          "weatherCode": 2,
          "weatherDescription": "Partly cloudy"
        }
      ],
      "hourly": [
        {
          "time": "2024-01-15T09:00",
          "temperature": 20.1,
          "humidity": 65,
          "precipitationProbability": 25,
          "weatherCode": 2,
          "windSpeed": 12.5,
          "weatherDescription": "Partly cloudy"
        }
      ]
    }
  }
}
```

### 2. Get Weather Forecast for Event
```
GET /api/weather/event/64f8a1b2c3d4e5f6a7b8c9d0
```

**Parameters:**
- `eventId` (required) - Event ID in the URL path

**Response:**
```json
{
  "status": "success",
  "data": {
    "weather": {
      "eventId": "64f8a1b2c3d4e5f6a7b8c9d0",
      "eventTitle": "Team Meeting",
      "location": {
        "name": "Central Park",
        "lat": 40.7829,
        "lon": -73.9654
      },
      "dateRange": {
        "start": "2024-01-15",
        "end": "2024-01-15"
      },
      "daily": [...],
      "hourly": [...]
    }
  }
}
```

## Weather Data Structure

### Daily Forecast
- `date` - Date in YYYY-MM-DD format
- `maxTemp` - Maximum temperature in Celsius
- `minTemp` - Minimum temperature in Celsius
- `precipitationProbability` - Probability of precipitation (0-100)
- `weatherCode` - Numerical weather code
- `weatherDescription` - Human-readable weather description

### Hourly Forecast
- `time` - Timestamp in ISO format
- `temperature` - Temperature in Celsius
- `humidity` - Relative humidity percentage
- `precipitationProbability` - Probability of precipitation (0-100)
- `weatherCode` - Numerical weather code
- `windSpeed` - Wind speed in km/h
- `weatherDescription` - Human-readable weather description

## Weather Codes

The API includes comprehensive weather code mapping:

| Code | Description |
|------|-------------|
| 0 | Clear sky |
| 1 | Mainly clear |
| 2 | Partly cloudy |
| 3 | Overcast |
| 45 | Foggy |
| 48 | Depositing rime fog |
| 51 | Light drizzle |
| 53 | Moderate drizzle |
| 55 | Dense drizzle |
| 61 | Slight rain |
| 63 | Moderate rain |
| 65 | Heavy rain |
| 71 | Slight snow fall |
| 73 | Moderate snow fall |
| 75 | Heavy snow fall |
| 80 | Slight rain showers |
| 81 | Moderate rain showers |
| 82 | Violent rain showers |
| 95 | Thunderstorm |
| 96 | Thunderstorm with slight hail |
| 99 | Thunderstorm with heavy hail |

## Validation Rules

### Date Validation
- Weather forecasts are only available for dates within 10 days from today
- Start date must be before or equal to end date
- Date format must be YYYY-MM-DD

### Coordinate Validation
- Latitude must be between -90 and 90
- Longitude must be between -180 and 180
- Coordinates must be valid numbers

### Event Validation
- Event must exist in the database
- Event must have valid location coordinates
- Event start date must be within 10 days from today

## Automatic Weather Fetching

When creating events, the system automatically:

1. **Checks Date Range**: Verifies if the event is within 10 days from today
2. **Fetches Weather Data**: Calls Open-Meteo API with event location and dates
3. **Transforms Data**: Converts API response to user-friendly format
4. **Stores Weather**: Saves weather data to the event document
5. **Handles Errors**: Gracefully handles weather fetch failures without affecting event creation

## Error Handling

The integration includes comprehensive error handling for:
- Invalid coordinates
- Date range too far (beyond 10 days)
- Invalid date formats
- Missing required parameters
- Network errors
- API rate limiting

## React Native Integration

For React Native app integration, you can use these endpoints to:

1. **Event Creation**: Weather data is automatically included when creating events
2. **Weather Display**: Show weather information in event details
3. **Weather Updates**: Refresh weather data for existing events
4. **Location Planning**: Check weather before choosing event locations

### Example React Native Usage:
```javascript
// Get weather for an event
const getEventWeather = async (eventId) => {
  const response = await fetch(`/api/weather/event/${eventId}`);
  const data = await response.json();
  return data.data.weather;
};

// Get weather for a location
const getLocationWeather = async (lat, lon, startDate, endDate) => {
  const response = await fetch(
    `/api/weather/forecast?lat=${lat}&lon=${lon}&startDate=${startDate}&endDate=${endDate}`
  );
  const data = await response.json();
  return data.data.weather;
};
```

## Setup Instructions

### 1. No API Key Required
Open-Meteo is a free weather API that doesn't require an API key, making setup simple.

### 2. Test the Integration
```bash
npm run test:weather
```

### 3. Start the Server
```bash
npm run dev
```

## Limitations

1. **Date Range**: Weather forecasts are only available for dates within 10 days from today
2. **Rate Limiting**: Open-Meteo has rate limits that may affect high-volume usage
3. **Accuracy**: Weather forecasts are predictions and may not be 100% accurate
4. **Coverage**: Some remote locations may have limited weather data

## Future Enhancements

Potential improvements for the weather integration:
1. **Caching**: Cache weather data to reduce API calls
2. **Weather Alerts**: Add severe weather alerts for events
3. **Historical Data**: Include historical weather data for past events
4. **Multiple Providers**: Add support for multiple weather data providers
5. **Weather Icons**: Include weather icons for better UI representation
6. **Push Notifications**: Send weather updates to event participants

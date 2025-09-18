# Event Management API

A comprehensive REST API for managing events, users, and event participation.

## Features

- User authentication and authorization
- Event creation, management, and participation
- **Event posters (required) and image albums (optional)**
- JWT-based security
- Comprehensive API documentation with Swagger
- Pagination, filtering, and sorting for events
- Rate limiting and security middleware

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (create a `.env` file):
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=90d
   LOCATIONIQ_API_KEY=your_locationiq_api_key
   

   ```
4. Start the server:
   ```bash
   npm start
   ```

## API Documentation

### Swagger UI

Once the server is running, you can access the interactive API documentation at:

**http://localhost:3000/api-docs**

The Swagger UI provides:
- Complete API endpoint documentation
- Interactive testing of all endpoints
- Request/response schemas
- Authentication requirements
- Example requests and responses

### API Endpoints

#### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (protected)
- `PATCH /api/users/profile` - Update user profile (protected)

#### Events
- `GET /api/events` - Get all events with filtering and pagination (protected)
- `POST /api/events` - Create a new event with poster (protected, multipart/form-data)
- `GET /api/events/:id` - Get a specific event (protected)
- `PATCH /api/events/:id` - Update an event (protected, creator only)
- `DELETE /api/events/:id` - Delete an event (protected, creator only)
- `POST /api/events/join/:inviteLink` - Join an event using invite link (protected)

#### Event Album
- `GET /api/events/:id/album` - Get all images from an event album (protected)
- `POST /api/events/:id/album` - Upload a single image to event album (protected, multipart/form-data)
- `POST /api/events/:id/album/multiple` - Upload multiple images to event album (protected, multipart/form-data)
- `DELETE /api/events/:id/album/:imageId` - Delete an image from event album (protected, creator or image owner)
- `PATCH /api/events/:id/album/:imageId` - Update image description (protected, creator or image owner)

#### Locations (LocationIQ Integration)
- `GET /api/locations/search` - Search locations by query string
- `GET /api/locations/details` - Get location details by coordinates (reverse geocoding)
- `GET /api/locations/nearby` - Get nearby places by coordinates

#### Weather (Open-Meteo Integration)
- `GET /api/weather/forecast` - Get weather forecast for a location
- `GET /api/weather/event/:eventId` - Get weather forecast for a specific event



## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Query Parameters for Events

When fetching events, you can use the following query parameters:

- `page` - Page number (default: 1)
- `limit` - Number of events per page (default: 10)
- `sort` - Sort field: `date`, `createdAt`, or `title` (default: `date`)
- `order` - Sort order: `asc` or `desc` (default: `asc`)
- `search` - Search term for title or description
- `location` - Filter by location

Example:
```
GET /api/events?page=1&limit=5&sort=date&order=desc&search=tech&location=New York
```

## Error Handling

The API returns consistent error responses with the following structure:

```json
{
  "status": "error",
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## LocationIQ Integration

This API integrates with LocationIQ for location search and geocoding functionality. The integration provides:

### Features
- **Location Search**: Search for places by name or address
- **Reverse Geocoding**: Get address details from coordinates
- **Nearby Places**: Find places near a specific location

### Setup
1. Sign up for a free LocationIQ account at [https://locationiq.com/](https://locationiq.com/)
2. Get your API key from the dashboard
3. Add the API key to your `.env` file as `LOCATIONIQ_API_KEY`

### Usage Examples

#### Search Locations
```bash
GET /api/locations/search?query=Central Park&limit=5
```

#### Get Location Details
```bash
GET /api/locations/details?lat=40.7829&lon=-73.9654
```

#### Get Nearby Places
```bash
GET /api/locations/nearby?lat=40.7829&lon=-73.9654&radius=1000&limit=10
```

### Event Structure
When creating events, the structure should now include:

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

**Note:** Event creation now requires a poster image to be uploaded using `multipart/form-data` with the field name `poster`.

**Note:** 
- `startDate` and `startTime` are required
- `endDate` and `endTime` are optional
- Time format must be HH:MM (24-hour format, e.g., 14:30 for 2:30 PM)
- If end date/time is provided, it must be after the start date/time

## Weather Integration

This API integrates with Open-Meteo for weather forecasting functionality. The integration provides:

### Features
- **Automatic Weather Fetching**: Weather data is automatically fetched when creating events within 10 days
- **Location-Based Forecasts**: Get weather forecasts for any location using coordinates
- **Event-Specific Weather**: Get weather forecasts for specific events
- **Comprehensive Data**: Temperature, humidity, precipitation probability, wind speed, and weather conditions

### Limitations
- Weather forecasts are only available for dates within 10 days from today
- Requires valid location coordinates (latitude and longitude)

### Usage Examples

#### Get Weather Forecast for Location
```bash
GET /api/weather/forecast?lat=40.7128&lon=-74.0060&startDate=2024-01-15&endDate=2024-01-16
```

#### Get Weather Forecast for Event
```bash
GET /api/weather/event/64f8a1b2c3d4e5f6a7b8c9d0
```

### Weather Data Structure
```json
{
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
```

## Testing

The API includes several test scripts to verify functionality:

### LocationIQ Integration Test
```bash
npm run test:locationiq
```
This test verifies that the LocationIQ API integration is working correctly.

### Date/Time Functionality Test
```bash
npm run test:datetime
```
This test verifies that the new event date/time structure works correctly, including:
- Creating events with start date/time only
- Creating events with start and end date/time
- Validation of time formats
- Validation that end time is after start time

### Weather Integration Test
```bash
npm run test:weather
```
This test verifies that the Open-Meteo weather integration works correctly, including:
- Fetching weather forecasts for locations
- Date validation (10-day limit)
- Coordinate validation
- Weather code mapping

### Event Album Test
```bash
npm run test:album
```
This test verifies that the event album functionality works correctly, including:
- Single image upload to event album
- Multiple image upload (up to 10 images)
- Image retrieval with URLs
- Image description updates
- Image deletion
- Local file storage integration

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- XSS protection
- NoSQL injection protection
- Parameter pollution protection
- Security headers with Helmet

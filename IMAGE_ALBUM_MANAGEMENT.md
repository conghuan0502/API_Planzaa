# Image Album Management Guide

This guide explains how to use the image album functionality for events. Event creators and participants can upload, view, update, and delete images in the event album.

## Overview

The image album system allows event participants to share photos and memories from events. Each event can have multiple images with metadata like uploader information, descriptions, and timestamps.

## Features

- **Image Upload**: Upload single or multiple images to event albums
- **Image Metadata**: Each image includes uploader info, description, and upload timestamp
- **Access Control**: Only event creators and participants can upload images
- **Image Management**: Update descriptions and delete images (creator or image owner only)
- **Album Toggle**: Event creators can enable/disable the album feature per event
- **Cloudinary Integration**: Images are stored on Cloudinary for reliable delivery
- **Caching**: Album endpoints are cached for improved performance

## API Endpoints

### Create Event

**POST** `/api/events`

Create a new event with a poster image. When an event is created, it initializes with an empty image album that participants can later populate.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (string, required): Event title
- `description` (string, required): Event description
- `location` (string/JSON, required): Location object as JSON string with structure:
  ```json
  {
    "name": "Venue Name",
    "address": "123 Main St, City, Country",
    "coordinates": {
      "lat": 40.7128,
      "lon": -74.0060
    }
  }
  ```
- `startDate` (date, required): Event start date (ISO 8601 format)
- `startTime` (string, required): Event start time in HH:MM format (e.g., "14:30")
- `endDate` (date, optional): Event end date (ISO 8601 format)
- `endTime` (string, optional): Event end time in HH:MM format (e.g., "16:30")
- `poster` (file, required): Event poster image
  - Supported formats: JPEG, PNG, GIF, WebP
  - Maximum file size: 5MB
- `maxParticipants` (number, optional): Maximum number of participants
- `isPublic` (boolean, optional): Whether the event is public (default: true)
- `rsvpRequired` (boolean, optional): Whether RSVP is required to join
- `dressCode` (string, optional): Dress code for the event
- `spotifyPlaylist` (string/JSON, optional): Spotify playlist object as JSON string
- `isAlbumImageEnable` (boolean, optional): Enable/disable album image feature for this event (default: true)

**Example Request (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('title', 'Summer Music Festival 2024');
formData.append('description', 'Join us for an amazing day of music, food, and fun!');
formData.append('location', JSON.stringify({
  name: 'Central Park',
  address: 'Central Park, New York, NY 10024',
  coordinates: {
    lat: 40.7829,
    lon: -73.9654
  }
}));
formData.append('startDate', '2024-07-15');
formData.append('startTime', '14:00');
formData.append('endDate', '2024-07-15');
formData.append('endTime', '22:00');
formData.append('poster', posterFile); // File object
formData.append('maxParticipants', '500');
formData.append('isPublic', 'true');
formData.append('dressCode', 'Casual summer attire');
formData.append('isAlbumImageEnable', 'true'); // Enable album feature

const response = await fetch('https://api.example.com/api/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Success Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "event": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Summer Music Festival 2024",
      "description": "Join us for an amazing day of music, food, and fun!",
      "location": {
        "name": "Central Park",
        "address": "Central Park, New York, NY 10024",
        "coordinates": {
          "lat": 40.7829,
          "lon": -73.9654
        }
      },
      "startDate": "2024-07-15T00:00:00.000Z",
      "startTime": "14:00",
      "endDate": "2024-07-15T00:00:00.000Z",
      "endTime": "22:00",
      "dressCode": "Casual summer attire",
      "poster": {
        "originalName": "festival-poster.jpg",
        "fileName": "poster_507f1f77bcf86cd799439011_1234567890.jpg",
        "fileSize": 458392,
        "mimeType": "image/jpeg",
        "cloudinaryId": "events/posters/507f1f77bcf86cd799439011_1234567890",
        "filePath": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/posters/507f1f77bcf86cd799439011_1234567890.jpg",
        "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/posters/507f1f77bcf86cd799439011_1234567890.jpg"
      },
      "creator": "507f1f77bcf86cd799439012",
      "participants": [],
      "imageAlbum": [],
      "todoList": [],
      "maxParticipants": 500,
      "isPublic": true,
      "rsvpRequired": false,
      "isAlbumImageEnable": true,
      "status": "active",
      "inviteLink": "abc123def456",
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-10T10:00:00.000Z",
      "weather": {
        "forecast": {
          "location": {
            "lat": 40.7829,
            "lon": -73.9654
          },
          "dateRange": {
            "start": "2024-07-15",
            "end": "2024-07-15"
          },
          "daily": [
            {
              "date": "2024-07-15",
              "maxTemp": 28.5,
              "minTemp": 20.3,
              "precipitationProbability": 10,
              "weatherCode": 1
            }
          ],
          "hourly": []
        },
        "lastUpdated": "2024-01-10T10:00:00.000Z",
        "location": {
          "lat": 40.7829,
          "lon": -73.9654
        }
      }
    }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid input data or missing required fields
  ```json
  {
    "status": "fail",
    "message": "Location must include name, address, and coordinates (lat, lon)"
  }
  ```

- `400 Bad Request`: Invalid time format
  ```json
  {
    "status": "fail",
    "message": "Start time must be in HH:MM format (e.g., 14:30)"
  }
  ```

- `400 Bad Request`: Missing poster
  ```json
  {
    "status": "fail",
    "message": "Event poster is required"
  }
  ```

- `401 Unauthorized`: Missing or invalid authentication token
  ```json
  {
    "status": "fail",
    "message": "Please log in to access this resource"
  }
  ```

**Notes:**
- The event is created with an empty `imageAlbum` array
- Weather forecast is automatically fetched if the event is within 10 days
- An invite link is automatically generated for the event
- The creator is automatically added to the event
- FCM notifications are sent to participants (if configured)
- Cache is invalidated for user's event lists

---

### Get Album Images

**GET** `/api/events/{eventId}/album`

Retrieve all images from an event's album.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `eventId` (path, required): The ID of the event

**Note:** This endpoint is cached for 5 minutes (300 seconds) to improve performance. Cache is automatically invalidated when images are added, updated, or deleted.

**Response:**
```json
{
  "status": "success",
  "data": {
    "images": [
      {
        "imageId": "550e8400-e29b-41d4-a716-446655440000",
        "originalName": "party-photo.jpg",
        "fileName": "event_123_550e8400-e29b-41d4-a716-446655440000.jpg",
        "fileSize": 245678,
        "mimeType": "image/jpeg",
        "cloudinaryId": "events/album/123/550e8400-e29b-41d4-a716-446655440000",
        "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/album/123/550e8400-e29b-41d4-a716-446655440000.jpg",
        "uploadedBy": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "uploadedAt": "2024-01-15T10:30:00.000Z",
        "description": "Great party moment!"
      }
    ],
    "count": 1
  }
}
```

**Error Responses:**

- `404 Not Found`: Event not found
  ```json
  {
    "status": "fail",
    "message": "Event not found"
  }
  ```

- `401 Unauthorized`: Missing or invalid authentication token
  ```json
  {
    "status": "fail",
    "message": "Please log in to access this resource"
  }
  ```

---

### Upload Single Image

**POST** `/api/events/{eventId}/album`

Upload a single image to the event album.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Parameters:**
- `eventId` (path, required): The ID of the event

**Form Data:**
- `image` (file, required): Image file to upload
  - Supported formats: All image types (JPEG, PNG, GIF, WebP, etc.)
  - Maximum file size: 5MB
  - Field name must be `image`
- `description` (string, optional): Optional description for the image

**Authorization:**
- User must be the event creator OR a participant of the event
- Album image feature must be enabled for the event (`isAlbumImageEnable: true`)

**Example Request (cURL):**
```bash
curl -X POST \
  https://api.example.com/api/events/507f1f77bcf86cd799439011/album \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/photo.jpg" \
  -F "description=Amazing sunset at the event"
```

**Example Request (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('description', 'Amazing sunset at the event');

const response = await fetch('https://api.example.com/api/events/507f1f77bcf86cd799439011/album', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Success Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "image": {
      "imageId": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "photo.jpg",
      "fileName": "event_507f1f77bcf86cd799439011_550e8400-e29b-41d4-a716-446655440000.jpg",
      "fileSize": 245678,
      "mimeType": "image/jpeg",
      "cloudinaryId": "events/album/507f1f77bcf86cd799439011/550e8400-e29b-41d4-a716-446655440000",
      "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/album/507f1f77bcf86cd799439011/550e8400-e29b-41d4-a716-446655440000.jpg",
      "uploadedBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith"
      },
      "uploadedAt": "2024-01-15T10:30:00.000Z",
      "description": "Amazing sunset at the event"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request`: No image file provided or invalid file
  ```json
  {
    "status": "fail",
    "message": "No image file provided"
  }
  ```

- `400 Bad Request`: File size too large
  ```json
  {
    "status": "fail",
    "message": "File size too large. Maximum size is 5MB"
  }
  ```

- `400 Bad Request`: Invalid file type
  ```json
  {
    "status": "fail",
    "message": "Only image files are allowed"
  }
  ```

- `403 Forbidden`: Album feature is disabled for this event
  ```json
  {
    "status": "fail",
    "message": "Album image feature is disabled for this event"
  }
  ```

- `403 Forbidden`: User is not authorized to upload images
  ```json
  {
    "status": "fail",
    "message": "You must be a participant or creator to upload images to this event album"
  }
  ```

- `404 Not Found`: Event not found
  ```json
  {
    "status": "fail",
    "message": "Event not found"
  }
  ```

- `500 Internal Server Error`: Upload failed
  ```json
  {
    "status": "fail",
    "message": "Error uploading album image: [error details]"
  }
  ```

---

### Upload Multiple Images

**POST** `/api/events/{eventId}/album/multiple`

Upload multiple images to the event album in a single request.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Parameters:**
- `eventId` (path, required): The ID of the event

**Form Data:**
- `images` (file[], required): Array of image files to upload
  - Supported formats: All image types (JPEG, PNG, GIF, WebP, etc.)
  - Maximum file size per image: 5MB
  - Maximum number of files: 10
  - Field name must be `images` (plural)

**Authorization:**
- User must be the event creator OR a participant of the event
- Album image feature must be enabled for the event (`isAlbumImageEnable: true`)

**Example Request (cURL):**
```bash
curl -X POST \
  https://api.example.com/api/events/507f1f77bcf86cd799439011/album/multiple \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "images=@/path/to/photo1.jpg" \
  -F "images=@/path/to/photo2.jpg" \
  -F "images=@/path/to/photo3.jpg"
```

**Example Request (JavaScript/Fetch):**
```javascript
const formData = new FormData();
fileInput.files.forEach(file => {
  formData.append('images', file);
});

const response = await fetch('https://api.example.com/api/events/507f1f77bcf86cd799439011/album/multiple', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Success Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "images": [
      {
        "imageId": "550e8400-e29b-41d4-a716-446655440000",
        "originalName": "photo1.jpg",
        "fileName": "event_507f1f77bcf86cd799439011_550e8400-e29b-41d4-a716-446655440000.jpg",
        "fileSize": 245678,
        "mimeType": "image/jpeg",
        "cloudinaryId": "events/album/507f1f77bcf86cd799439011/550e8400-e29b-41d4-a716-446655440000",
        "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/album/507f1f77bcf86cd799439011/550e8400-e29b-41d4-a716-446655440000.jpg",
        "uploadedBy": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Jane Smith"
        },
        "uploadedAt": "2024-01-15T10:30:00.000Z",
        "description": null
      },
      {
        "imageId": "660e8400-e29b-41d4-a716-446655440001",
        "originalName": "photo2.jpg",
        "fileName": "event_507f1f77bcf86cd799439011_660e8400-e29b-41d4-a716-446655440001.jpg",
        "fileSize": 312456,
        "mimeType": "image/jpeg",
        "cloudinaryId": "events/album/507f1f77bcf86cd799439011/660e8400-e29b-41d4-a716-446655440001",
        "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/album/507f1f77bcf86cd799439011/660e8400-e29b-41d4-a716-446655440001.jpg",
        "uploadedBy": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Jane Smith"
        },
        "uploadedAt": "2024-01-15T10:30:05.000Z",
        "description": null
      }
    ],
    "count": 2
  }
}
```

**Error Responses:**

- `400 Bad Request`: No image files provided
  ```json
  {
    "status": "fail",
    "message": "No image files provided"
  }
  ```

- `400 Bad Request`: Too many files
  ```json
  {
    "status": "fail",
    "message": "Too many files. Maximum is 10 files"
  }
  ```

- `403 Forbidden`: Album feature is disabled for this event
  ```json
  {
    "status": "fail",
    "message": "Album image feature is disabled for this event"
  }
  ```

- `403 Forbidden`: User is not authorized to upload images
  ```json
  {
    "status": "fail",
    "message": "You must be a participant or creator to upload images to this event album"
  }
  ```

- `404 Not Found`: Event not found
  ```json
  {
    "status": "fail",
    "message": "Event not found"
  }
  ```

**Note:** If some images fail to upload, the successful ones will still be added to the album. The response will only include successfully uploaded images.

---

### Update Image Description

**PATCH** `/api/events/{eventId}/album/{imageId}`

Update the description of an image in the event album.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Parameters:**
- `eventId` (path, required): The ID of the event
- `imageId` (path, required): The ID of the image to update

**Request Body:**
```json
{
  "description": "Updated description for this image"
}
```

**Authorization:**
- User must be the event creator OR the user who uploaded the image

**Example Request (cURL):**
```bash
curl -X PATCH \
  https://api.example.com/api/events/507f1f77bcf86cd799439011/album/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description for this image"
  }'
```

**Example Request (JavaScript/Fetch):**
```javascript
const response = await fetch('https://api.example.com/api/events/507f1f77bcf86cd799439011/album/550e8400-e29b-41d4-a716-446655440000', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    description: 'Updated description for this image'
  })
});
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "image": {
      "imageId": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "photo.jpg",
      "fileName": "event_507f1f77bcf86cd799439011_550e8400-e29b-41d4-a716-446655440000.jpg",
      "fileSize": 245678,
      "mimeType": "image/jpeg",
      "cloudinaryId": "events/album/507f1f77bcf86cd799439011/550e8400-e29b-41d4-a716-446655440000",
      "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/album/507f1f77bcf86cd799439011/550e8400-e29b-41d4-a716-446655440000.jpg",
      "uploadedBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith"
      },
      "uploadedAt": "2024-01-15T10:30:00.000Z",
      "description": "Updated description for this image"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid request body
  ```json
  {
    "status": "fail",
    "message": "Invalid input data"
  }
  ```

- `403 Forbidden`: User is not authorized to update this image
  ```json
  {
    "status": "fail",
    "message": "You are not authorized to update this image"
  }
  ```

- `404 Not Found`: Event or image not found
  ```json
  {
    "status": "fail",
    "message": "Event not found"
  }
  ```
  or
  ```json
  {
    "status": "fail",
    "message": "Image not found in event album"
  }
  ```

- `500 Internal Server Error`: Update failed
  ```json
  {
    "status": "fail",
    "message": "Error updating album image description: [error details]"
  }
  ```

---

### Delete Image

**DELETE** `/api/events/{eventId}/album/{imageId}`

Delete an image from the event album. This will also remove the image from Cloudinary storage.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `eventId` (path, required): The ID of the event
- `imageId` (path, required): The ID of the image to delete

**Authorization:**
- User must be the event creator OR the user who uploaded the image

**Example Request (cURL):**
```bash
curl -X DELETE \
  https://api.example.com/api/events/507f1f77bcf86cd799439011/album/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Request (JavaScript/Fetch):**
```javascript
const response = await fetch('https://api.example.com/api/events/507f1f77bcf86cd799439011/album/550e8400-e29b-41d4-a716-446655440000', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Image deleted successfully"
}
```

**Error Responses:**

- `403 Forbidden`: User is not authorized to delete this image
  ```json
  {
    "status": "fail",
    "message": "You are not authorized to delete this image"
  }
  ```

- `404 Not Found`: Event or image not found
  ```json
  {
    "status": "fail",
    "message": "Event not found"
  }
  ```
  or
  ```json
  {
    "status": "fail",
    "message": "Image not found in event album"
  }
  ```

- `500 Internal Server Error`: Deletion failed
  ```json
  {
    "status": "fail",
    "message": "Error deleting album image: [error details]"
  }
  ```

---

## Image Object Schema

Each image in the album has the following structure:

```typescript
interface AlbumImage {
  imageId: string;              // Unique identifier for the image (UUID)
  originalName: string;         // Original filename from upload
  fileName: string;              // Generated filename on server
  fileSize: number;              // File size in bytes
  mimeType: string;              // MIME type (e.g., "image/jpeg")
  cloudinaryId: string;          // Cloudinary storage ID
  url: string;                   // Direct URL to access the image
  uploadedBy: {                 // User who uploaded the image
    _id: string;
    name: string;
    email?: string;
  };
  uploadedAt: string;            // ISO 8601 timestamp
  description: string | null;   // Optional description
}
```

## File Upload Constraints

- **File Types**: Only image files are allowed (JPEG, PNG, GIF, WebP, BMP, etc.)
- **Maximum File Size**: 5MB per image
- **Maximum Files**: 10 images per multiple upload request
- **Field Names**: 
  - Single upload: `image` (singular)
  - Multiple upload: `images` (plural)

## Album Feature Toggle

Event creators have the ability to enable or disable the album image feature for their events using the `isAlbumImageEnable` field.

### How It Works

- **Default State**: When creating an event, `isAlbumImageEnable` defaults to `true` (enabled)
- **Setting on Creation**: Include `isAlbumImageEnable: false` in the event creation request to disable the feature
- **Updating Later**: Use the event update endpoint (`PATCH /api/events/{eventId}`) to toggle the feature on/off
- **Effect**: When disabled, all album upload endpoints will return a 403 error

### Example: Creating an Event with Album Disabled

```javascript
const formData = new FormData();
formData.append('title', 'Private Meeting');
formData.append('description', 'Confidential business meeting');
// ... other required fields
formData.append('isAlbumImageEnable', 'false'); // Disable album feature
formData.append('poster', posterFile);

const response = await fetch('https://api.example.com/api/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Example: Enabling Album for Existing Event

```javascript
const response = await fetch('https://api.example.com/api/events/507f1f77bcf86cd799439011', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    isAlbumImageEnable: true
  })
});
```

### Use Cases

- **Privacy**: Disable albums for confidential or private events
- **Control**: Prevent unwanted photo sharing at certain events
- **Professional Events**: Keep business meetings photo-free
- **Selective Sharing**: Only enable for social events where photo sharing is desired

---

## Authorization Rules

### Upload Images
- ✅ Event creator
- ✅ Event participants
- ✅ Album feature must be enabled (`isAlbumImageEnable: true`)
- ❌ Other users
- ❌ When album feature is disabled

### View Images
- ✅ Event creator
- ✅ Event participants
- ❌ Other users (unless event is public and they have access)

### Update Image Description
- ✅ Event creator
- ✅ Image uploader (owner)
- ❌ Other participants

### Delete Image
- ✅ Event creator
- ✅ Image uploader (owner)
- ❌ Other participants

## Caching

Album endpoints use caching to improve performance:

- **GET `/api/events/{eventId}/album`**: Cached for 5 minutes (300 seconds)
- Cache is automatically invalidated when:
  - Images are uploaded (single or multiple)
  - Image descriptions are updated
  - Images are deleted

Cache keys follow the pattern: `user:{userId}:album:{eventId}`

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "status": "fail",
  "message": "Error description"
}
```

Common HTTP status codes:
- `200 OK`: Successful operation
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input or file constraints violated
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User lacks permission for the operation
- `404 Not Found`: Event or image not found
- `500 Internal Server Error`: Server-side error occurred

## Best Practices

1. **Image Optimization**: Compress images before uploading to reduce file size and improve upload speed
2. **Descriptive Names**: Use meaningful descriptions to help organize and search images
3. **Batch Uploads**: Use the multiple upload endpoint when adding several images at once
4. **Error Handling**: Always handle upload errors gracefully and provide user feedback
5. **Progress Indicators**: Show upload progress for better user experience, especially for multiple images
6. **Image Validation**: Validate image dimensions and file size on the client side before uploading

## Example Integration

### React Native Example

```javascript
import * as ImagePicker from 'expo-image-picker';

const uploadEventImage = async (eventId, imageUri, description = '') => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  });
  formData.append('description', description);

  try {
    const response = await fetch(
      `https://api.example.com/api/events/${eventId}/album`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      }
    );

    const data = await response.json();
    if (data.status === 'success') {
      console.log('Image uploaded:', data.data.image);
      return data.data.image;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Usage
const pickAndUploadImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled) {
    await uploadEventImage(eventId, result.assets[0].uri, 'Event photo');
  }
};
```

### Web Example (React)

```javascript
const uploadMultipleImages = async (eventId, files) => {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('images', file);
  });

  try {
    const response = await fetch(
      `https://api.example.com/api/events/${eventId}/album/multiple`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      }
    );

    const data = await response.json();
    if (data.status === 'success') {
      console.log(`Uploaded ${data.data.count} images`);
      return data.data.images;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Usage with file input
const handleFileChange = async (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    await uploadMultipleImages(eventId, files);
  }
};
```

## Notes

- Images are stored on Cloudinary, ensuring reliable delivery and automatic optimization
- Each image gets a unique UUID (`imageId`) for identification
- Image URLs are permanent and can be used directly in image tags
- The `uploadedBy` field is automatically populated with the authenticated user's information
- Descriptions are optional and can be added or updated later
- When deleting an image, it's removed from both the database and Cloudinary storage
- **Album Toggle**: The `isAlbumImageEnable` field allows event creators to control whether participants can upload images. This is useful for maintaining privacy or controlling content at certain events.


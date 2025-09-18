# Cloudinary Integration

This document explains how Cloudinary has been integrated into the Event Management API for image uploads.

## Overview

Cloudinary has been implemented to replace local file storage for all image uploads in the application. This provides:
- Better scalability and performance
- Automatic image optimization and transformations
- CDN delivery for faster loading
- No local storage management required

## Setup

### 1. Install Dependencies

The Cloudinary package has been added to the project:
```bash
npm install cloudinary
```

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Get Cloudinary Credentials

1. Sign up for a free Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Go to your Dashboard
3. Copy your Cloud Name, API Key, and API Secret
4. Add them to your `.env` file

## Implementation Details

### Configuration (`config/cloudinary.js`)
- Sets up Cloudinary SDK with environment variables
- Exports configured cloudinary instance

### File Upload Utils (`utils/fileUpload.js`)
- **uploadPoster()**: Uploads event posters to `event-posters` folder
- **uploadAlbumImage()**: Uploads album images to `event-albums/{eventId}` folder
- **uploadMultipleImages()**: Handles multiple image uploads
- **deleteFile()**: Deletes images from Cloudinary using public_id
- **getFileUrl()**: Returns Cloudinary URLs directly

### Image Transformations
- **Posters**: Resized to 800x600 with auto quality optimization
- **Album Images**: Resized to 1200x800 with auto quality optimization
- All images are automatically optimized for web delivery

### Database Schema Updates
The Event model now stores:
- `cloudinaryId`: Cloudinary public_id for deletion
- `url`: Direct Cloudinary URL (no need for base URL construction)

## API Endpoints

### Event Poster Upload
```
POST /events
Content-Type: multipart/form-data
Body: poster (file)
```

### Single Album Image Upload
```
POST /events/:id/album
Content-Type: multipart/form-data
Body: image (file), description (optional)
```

### Multiple Album Images Upload
```
POST /events/:id/album/multiple
Content-Type: multipart/form-data
Body: images (files array)
```

## Response Format

### Single Image Upload Response
```json
{
  "status": "success",
  "data": {
    "image": {
      "imageId": "uuid",
      "originalName": "photo.jpg",
      "fileName": "cloudinary_public_id",
      "fileSize": 123456,
      "mimeType": "image/jpeg",
      "cloudinaryId": "event-albums/eventId/album_eventId_uuid",
      "url": "https://res.cloudinary.com/cloud_name/image/upload/...",
      "uploadedBy": {
        "_id": "user_id",
        "name": "User Name"
      },
      "description": "Optional description"
    }
  }
}
```

### Multiple Images Upload Response
```json
{
  "status": "success",
  "data": {
    "images": [
      {
        "imageId": "uuid1",
        "originalName": "photo1.jpg",
        "fileName": "cloudinary_public_id1",
        "fileSize": 123456,
        "mimeType": "image/jpeg",
        "cloudinaryId": "event-albums/eventId/album_eventId_uuid1",
        "url": "https://res.cloudinary.com/cloud_name/image/upload/...",
        "uploadedBy": {
          "_id": "user_id",
          "name": "User Name"
        }
      }
    ],
    "count": 1
  }
}
```

## Benefits

1. **Performance**: Images are served from Cloudinary's global CDN
2. **Scalability**: No local storage limitations
3. **Optimization**: Automatic image compression and format optimization
4. **Reliability**: Cloudinary's infrastructure ensures high availability
5. **Cost-effective**: Free tier includes generous limits for development

## Migration Notes

If migrating from local storage:
1. Existing local files will need to be uploaded to Cloudinary
2. Database records may need to be updated with Cloudinary URLs
3. The `cloudinaryId` field should be added to existing image records for proper deletion

## Error Handling

The implementation includes comprehensive error handling for:
- Upload failures
- Invalid file types
- File size limits
- Network issues
- Cloudinary API errors

All errors are logged and appropriate HTTP status codes are returned to the client.

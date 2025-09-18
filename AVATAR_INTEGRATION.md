# Avatar Integration Guide

This guide explains how to use the new avatar functionality added to the user model.

## Overview

The avatar system allows users to upload and manage profile pictures. Avatars are stored in Cloudinary and optimized for web use.

## Features

- **Avatar Upload**: Users can upload profile pictures (JPG, PNG, GIF)
- **Automatic Optimization**: Images are automatically resized to 300x300px with face detection
- **Cloud Storage**: Avatars are stored securely in Cloudinary
- **Automatic Cleanup**: Old avatars are automatically deleted when replaced
- **File Validation**: Only image files up to 5MB are accepted

## API Endpoints

### Update User Avatar

**PATCH** `/api/users/avatar`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Body:**
- `avatar`: Image file (JPG, PNG, GIF, max 5MB)

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": {
        "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/avatar_user123.jpg",
        "cloudinaryId": "avatar_user123"
      },
      "dateOfBirth": "1990-01-15",
      "age": 33,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## User Model Changes

The user model now includes an `avatar` field:

```javascript
avatar: {
  url: {
    type: String,
    default: null
  },
  cloudinaryId: {
    type: String,
    default: null
  }
}
```

## File Upload Configuration

### Avatar Upload Middleware

```javascript
const { uploadAvatar } = require('../middleware/uploadMiddleware');

// Use in routes
router.patch('/avatar', uploadAvatar, updateAvatar);
```

### Avatar Upload Function

```javascript
const { uploadAvatar } = require('../utils/fileUpload');

// Upload avatar to Cloudinary
const result = await uploadAvatar(file);
```

## Cloudinary Configuration

Avatars are uploaded to the `user-avatars` folder in Cloudinary with:
- **Dimensions**: 300x300px (square)
- **Crop**: Fill with face detection gravity
- **Quality**: Auto-optimized
- **Format**: Original format preserved

## Error Handling

Common error responses:

**400 - Invalid File:**
```json
{
  "status": "fail",
  "message": "Please upload an image file"
}
```

**400 - File Too Large:**
```json
{
  "status": "fail",
  "message": "File size too large. Maximum size is 5MB"
}
```

**400 - Invalid File Type:**
```json
{
  "status": "fail",
  "message": "Only image files are allowed"
}
```

## Frontend Integration

### HTML Form Example

```html
<form action="/api/users/avatar" method="POST" enctype="multipart/form-data">
  <input type="file" name="avatar" accept="image/*" required>
  <button type="submit">Update Avatar</button>
</form>
```

### JavaScript Example

```javascript
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);

fetch('/api/users/avatar', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Avatar updated:', data.data.user.avatar);
})
.catch(error => console.error('Error:', error));
```

### React Example

```jsx
import { useState } from 'react';

const AvatarUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/users/avatar', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        console.log('Avatar updated successfully');
        // Update local state or trigger refresh
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Uploading...' : 'Update Avatar'}
      </button>
    </form>
  );
};
```

## Testing

Run the avatar test to verify functionality:

```bash
node test-avatar.js
```

## Security Considerations

- **Authentication Required**: Avatar updates require valid JWT token
- **File Type Validation**: Only image files are accepted
- **File Size Limits**: Maximum 5MB per file
- **Automatic Cleanup**: Old avatars are deleted to prevent storage bloat

## Performance

- **Image Optimization**: Automatic resizing and compression
- **CDN Delivery**: Cloudinary provides global CDN for fast image delivery
- **Lazy Loading**: Consider implementing lazy loading for avatars in lists

## Troubleshooting

### Common Issues

1. **"Please upload an image file"**
   - Ensure the file is an actual image (JPG, PNG, GIF)
   - Check that the form field name is `avatar`

2. **"File size too large"**
   - Compress the image before upload
   - Ensure file is under 5MB

3. **"Not authorized"**
   - Verify JWT token is valid and included in Authorization header
   - Check that user is logged in

4. **Upload fails**
   - Verify Cloudinary configuration
   - Check network connectivity
   - Review server logs for detailed error messages

### Debug Mode

Enable detailed logging by setting environment variable:
```bash
DEBUG=app:avatar
```

## Future Enhancements

Potential improvements for the avatar system:

- **Multiple Avatar Sizes**: Generate thumbnails for different use cases
- **Avatar Cropping**: Allow users to crop/position their avatar
- **Avatar History**: Keep track of previous avatars
- **Bulk Avatar Operations**: Support for multiple user avatar updates
- **Avatar Templates**: Pre-defined avatar options for users
- **Avatar Validation**: AI-powered content moderation for uploaded images

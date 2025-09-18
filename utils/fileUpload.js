const cloudinary = require('../config/cloudinary');
const { v4: uuidv4 } = require('uuid');

// Upload poster to Cloudinary
const uploadPoster = async (file) => {
  try {
    // Convert buffer to base64 string
    const base64String = file.buffer.toString('base64');
    const dataURI = `data:${file.mimetype};base64,${base64String}`;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'event-posters',
      public_id: `poster_${uuidv4()}`,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 600, crop: 'fill' },
        { quality: 'auto' }
      ]
    });
    
    return {
      fileName: result.public_id,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath: result.secure_url,
      cloudinaryId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Error uploading poster to Cloudinary:', error);
    throw new Error('Failed to upload poster to Cloudinary');
  }
};

// Upload image to album on Cloudinary
const uploadAlbumImage = async (file, eventId) => {
  try {
    // Convert buffer to base64 string
    const base64String = file.buffer.toString('base64');
    const dataURI = `data:${file.mimetype};base64,${base64String}`;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: `event-albums/${eventId}`,
      public_id: `album_${eventId}_${uuidv4()}`,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'fill' },
        { quality: 'auto' }
      ]
    });
    
    return {
      fileName: result.public_id,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath: result.secure_url,
      cloudinaryId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Error uploading album image to Cloudinary:', error);
    throw new Error('Failed to upload image to album on Cloudinary');
  }
};

// Upload avatar to Cloudinary
const uploadAvatar = async (file) => {
  try {
    // Convert buffer to base64 string
    const base64String = file.buffer.toString('base64');
    const dataURI = `data:${file.mimetype};base64,${base64String}`;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'user-avatars',
      public_id: `avatar_${uuidv4()}`,
      resource_type: 'image',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]
    });
    
    return {
      fileName: result.public_id,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath: result.secure_url,
      cloudinaryId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Error uploading avatar to Cloudinary:', error);
    throw new Error('Failed to upload avatar to Cloudinary');
  }
};

// Delete file from Cloudinary
const deleteFile = async (cloudinaryId) => {
  try {
    if (!cloudinaryId) {
      return false;
    }
    
    const result = await cloudinary.uploader.destroy(cloudinaryId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
};

// Get file URL (now returns Cloudinary URL directly)
const getFileUrl = (filePath) => {
  return filePath; // Cloudinary URLs are already complete
};

// Upload multiple images to Cloudinary
const uploadMultipleImages = async (files, eventId) => {
  try {
    const uploadPromises = files.map(file => uploadAlbumImage(file, eventId));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading multiple images to Cloudinary:', error);
    throw new Error('Failed to upload multiple images to Cloudinary');
  }
};

module.exports = {
  uploadPoster,
  uploadAlbumImage,
  uploadAvatar,
  uploadMultipleImages,
  deleteFile,
  getFileUrl
};

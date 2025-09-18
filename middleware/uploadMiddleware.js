const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type - only allow images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files per request
  }
});

// Middleware for single poster upload
const uploadPoster = upload.single('poster');

// Middleware for single album image upload
const uploadAlbumImage = upload.single('image');

// Middleware for single avatar upload
const uploadAvatar = upload.single('avatar');

// Middleware for multiple album images upload
const uploadMultipleAlbumImages = upload.array('images', 10);

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'fail',
        message: 'File size too large. Maximum size is 5MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'fail',
        message: 'Too many files. Maximum is 10 files'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'fail',
        message: 'Unexpected file field'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      status: 'fail',
      message: 'Only image files are allowed'
    });
  }
  
  next(error);
};

module.exports = {
  uploadPoster,
  uploadAlbumImage,
  uploadAvatar,
  uploadMultipleAlbumImages,
  handleUploadError
};

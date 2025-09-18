const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { uploadAvatar, deleteFile } = require('../utils/fileUpload');

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Create and send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth,
        age: user.age
      }
    }
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    console.log('--- New User Registration ---');
    console.log('Request Body:', req.body);

    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      dateOfBirth: req.body.dateOfBirth
    });

    console.log('User created successfully:', newUser._id);
    createSendToken(newUser, 201, res);
  } catch (error) {
    console.error('--- Registration Error ---');
    console.error('Error:', error.message);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }

    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }

    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('createdEvents')
      .populate('joinedEvents');

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    // Filter out unwanted fields that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email', 'dateOfBirth');
    
    // Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      filteredBody,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update user avatar
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please upload an image file'
      });
    }

    // Get current user to check if they have an existing avatar
    const currentUser = await User.findById(req.user._id);
    
    // Upload new avatar to Cloudinary
    const uploadResult = await uploadAvatar(req.file);
    
    // Delete old avatar from Cloudinary if it exists
    if (currentUser.avatar && currentUser.avatar.cloudinaryId) {
      await deleteFile(currentUser.avatar.cloudinaryId);
    }
    
    // Update user with new avatar
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: {
          url: uploadResult.filePath,
          cloudinaryId: uploadResult.cloudinaryId
        }
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Avatar update error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Helper function to filter object
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
}; 
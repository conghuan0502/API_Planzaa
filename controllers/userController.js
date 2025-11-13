const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const { uploadAvatar, deleteFile } = require('../utils/fileUpload');
const { invalidateUserCache } = require('../utils/cacheHelpers');
const { generateOTP, sendOTPEmail } = require('../services/emailService');

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

    // Invalidate user cache after successful update
    invalidateUserCache(req.user._id.toString(), ['user:.*:profile']);

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

    // Invalidate user cache after successful avatar update
    invalidateUserCache(req.user._id.toString(), ['user:.*:profile', 'user:.*:avatar']);

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

/**
 * @swagger
 * /api/users/fcm-token:
 *   post:
 *     summary: Update user's FCM token
 *     description: Register or update the user's Firebase Cloud Messaging token for push notifications
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 description: Firebase Cloud Messaging registration token
 *     responses:
 *       200:
 *         description: FCM token updated successfully
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
 *                     message:
 *                       type: string
 *                       example: FCM token updated successfully
 *                     fcmToken:
 *                       type: string
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Update user's FCM token
exports.updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        status: 'fail',
        message: 'FCM token is required'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { fcmToken: fcmToken },
      { new: true, runValidators: true }
    );

    // Invalidate user cache
    invalidateUserCache(req.user._id.toString(), ['user:.*:profile']);

    res.status(200).json({
      status: 'success',
      data: {
        message: 'FCM token updated successfully',
        fcmToken: updatedUser.fcmToken
      }
    });
  } catch (error) {
    console.error('FCM token update error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/notification-settings:
 *   patch:
 *     summary: Update user's notification settings
 *     description: Update the user's notification preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventUpdates:
 *                 type: boolean
 *                 description: Receive notifications for event updates
 *               eventReminders:
 *                 type: boolean
 *                 description: Receive event reminder notifications
 *               weatherAlerts:
 *                 type: boolean
 *                 description: Receive weather alert notifications
 *               pushNotifications:
 *                 type: boolean
 *                 description: Enable/disable all push notifications
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
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
 *                     notificationSettings:
 *                       type: object
 *                       properties:
 *                         eventUpdates:
 *                           type: boolean
 *                         eventReminders:
 *                           type: boolean
 *                         weatherAlerts:
 *                           type: boolean
 *                         pushNotifications:
 *                           type: boolean
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Update user's notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const allowedFields = ['eventUpdates', 'eventReminders', 'weatherAlerts', 'pushNotifications'];
    const filteredBody = filterObj(req.body, ...allowedFields);

    if (Object.keys(filteredBody).length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'No valid notification settings provided'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: {
          ...Object.keys(filteredBody).reduce((acc, key) => {
            acc[`notificationSettings.${key}`] = filteredBody[key];
            return acc;
          }, {})
        }
      },
      { new: true, runValidators: true }
    );

    // Invalidate user cache
    invalidateUserCache(req.user._id.toString(), ['user:.*:profile']);

    res.status(200).json({
      status: 'success',
      data: {
        notificationSettings: updatedUser.notificationSettings
      }
    });
  } catch (error) {
    console.error('Notification settings update error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/request-otp:
 *   post:
 *     summary: Request OTP for password reset
 *     description: Send an OTP code to user's email for password reset
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: OTP sent to your email
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Request OTP for password reset
exports.requestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that email address'
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Hash OTP before storing in database
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Set OTP and expiration time (10 minutes from now)
    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    try {
      await sendOTPEmail(user.email, user.name, otp);

      res.status(200).json({
        status: 'success',
        message: 'OTP sent to your email'
      });
    } catch (emailError) {
      // If email fails, remove OTP from database
      user.resetPasswordOTP = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Email sending error:', emailError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     description: Reset user's password using the OTP code sent to their email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john@example.com
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP code received via email
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (minimum 8 characters)
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *       400:
 *         description: Invalid request or OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Reset password with OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email, OTP, and new password'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 8 characters long'
      });
    }

    // Hash the provided OTP to compare with stored hash
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Find user with matching email, OTP, and non-expired OTP
    const user = await User.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordOTP +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired OTP'
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
}; 
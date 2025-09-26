const Event = require('../models/eventModel');
const User = require('../models/userModel');
const { uploadPoster, uploadAlbumImage, deleteFile, getFileUrl } = require('../utils/fileUpload');
const { invalidateEventCache, invalidateUserCache } = require('../utils/cacheHelpers');
const { v4: uuidv4 } = require('uuid');

// Create new event
exports.createEvent = async (req, res) => {
  try {
    // Handle JSON string fields from FormData
    console.log('Received body:', req.body);
    console.log('Received file:', req.file);

    // Handle JSON string fields from FormData
    try {
      if (req.body.location && typeof req.body.location === 'string') {
        req.body.location = JSON.parse(req.body.location);
      }
      if (req.body.todoItems && typeof req.body.todoItems === 'string') {
        req.body.todoItems = JSON.parse(req.body.todoItems);
      }
    } catch (parseError) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid JSON format in form data fields.'
      });
    }

    // Validate location data
    if (!req.body.location || !req.body.location.name || !req.body.location.address || 
        !req.body.location.coordinates || !req.body.location.coordinates.lat || !req.body.location.coordinates.lon) {
      return res.status(400).json({
        status: 'fail',
        message: 'Location must include name, address, and coordinates (lat, lon)'
      });
    }

    // Validate start date and time
    if (!req.body.startDate || !req.body.startTime) {
      return res.status(400).json({
        status: 'fail',
        message: 'Start date and start time are required'
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(req.body.startTime)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Start time must be in HH:MM format (e.g., 14:30)'
      });
    }

    if (req.body.endTime && !timeRegex.test(req.body.endTime)) {
      return res.status(400).json({
        status: 'fail',
        message: 'End time must be in HH:MM format (e.g., 16:30)'
      });
    }

    // Validate poster upload
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'Event poster is required'
      });
    }

    // Upload poster
    const posterResult = await uploadPoster(req.file);

    // Ensure we preserve LocationIQ lat/lon as numbers
    const location = {
      ...req.body.location,
      coordinates: {
        lat: Number(req.body.location.coordinates.lat),
        lon: Number(req.body.location.coordinates.lon)
      }
    };

    const newEvent = await Event.create({
      ...req.body,
      location,
      poster: posterResult,
      creator: req.user._id
    });

    // Add event to user's createdEvents
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdEvents: newEvent._id }
    });

    // Invalidate cache after successful event creation
    invalidateEventCache(null, ['user:.*:my-events']);
    invalidateUserCache(req.user._id.toString(), ['user:.*:my-events']);

    // Try to fetch weather data if event is within 10 days
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 10);

      if (newEvent.startDate <= maxDate) {
        const axios = require('axios');
        const startDate = newEvent.startDate.toISOString().split('T')[0];
        const endDate = newEvent.endDate ? newEvent.endDate.toISOString().split('T')[0] : startDate;

        const weatherResponse = await axios.get('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude: newEvent.location.coordinates.lat,
            longitude: newEvent.location.coordinates.lon,
            start_date: startDate,
            end_date: endDate,
            hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m',
            daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
            timezone: 'auto'
          }
        });

        // Transform weather data
        const weatherData = {
          location: {
            lat: newEvent.location.coordinates.lat,
            lon: newEvent.location.coordinates.lon
          },
          dateRange: {
            start: startDate,
            end: endDate
          },
          daily: weatherResponse.data.daily?.time?.map((date, index) => ({
            date: date,
            maxTemp: weatherResponse.data.daily.temperature_2m_max[index],
            minTemp: weatherResponse.data.daily.temperature_2m_min[index],
            precipitationProbability: weatherResponse.data.daily.precipitation_probability_max[index],
            weatherCode: weatherResponse.data.daily.weather_code[index]
          })) || [],
          hourly: weatherResponse.data.hourly?.time?.map((time, index) => ({
            time: time,
            temperature: weatherResponse.data.hourly.temperature_2m[index],
            humidity: weatherResponse.data.hourly.relative_humidity_2m[index],
            precipitationProbability: weatherResponse.data.hourly.precipitation_probability[index],
            weatherCode: weatherResponse.data.hourly.weather_code[index],
            windSpeed: weatherResponse.data.hourly.wind_speed_10m[index]
          })) || []
        };

        // Update event with weather data
        newEvent.weather = {
          forecast: weatherData,
          lastUpdated: new Date(),
          location: {
            lat: newEvent.location.coordinates.lat,
            lon: newEvent.location.coordinates.lon
          }
        };
        await newEvent.save();
      }
    } catch (weatherError) {
      console.log('Weather data fetch failed:', weatherError.message);
      // Don't fail the event creation if weather fetch fails
    }

    // Poster URL is already included from Cloudinary
    const eventWithPosterUrl = {
      ...newEvent.toObject(),
      poster: {
        ...newEvent.poster,
        url: newEvent.poster.filePath
      }
    };

    res.status(201).json({
      status: 'success',
      data: {
        event: eventWithPosterUrl
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    // Build query
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // Visibility filter: by default only public events appear in general feeds/search
    const baseFilter = JSON.parse(queryStr);
    const visibilityFilter = req.query.includePrivate === 'true'
      ? { $or: [
          { isPublic: true },
          { creator: req.user._id },
          { 'participants.user': req.user._id }
        ] }
      : { isPublic: true };

    // Search filter across title and description (case-insensitive)
    const andClauses = [baseFilter, visibilityFilter];
    if (req.query.search) {
      andClauses.push({
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    const finalFilter = { $and: andClauses };

    let query = Event.find(finalFilter)
      .populate('creator', 'name email')
      .populate('participants.user', 'name email');

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    const events = await query;

    res.status(200).json({
      status: 'success',
      results: events.length,
      data: {
        events
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get events created by the authenticated user
exports.getMyEvents = async (req, res) => {
  try {
    // Build query for user's created events
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Base filter: only events created by the user
    const baseFilter = { creator: req.user._id };

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    const additionalFilters = JSON.parse(queryStr);

    // Combine filters
    const finalFilter = { $and: [baseFilter, additionalFilters] };

    let query = Event.find(finalFilter)
      .populate('creator', 'name email')
      .populate('participants.user', 'name email');

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    const events = await query;

    res.status(200).json({
      status: 'success',
      results: events.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(events.length / limit),
        totalEvents: events.length,
        hasNextPage: events.length === limit,
        hasPrevPage: page > 1
      },
      data: {
        events
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get events that the authenticated user has joined
exports.getJoinedEvents = async (req, res) => {
  try {
    // Build query for user's joined events
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Base filter: only events where the user is a participant
    const baseFilter = { 'participants.user': req.user._id };

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    const additionalFilters = JSON.parse(queryStr);

    // Combine filters
    const finalFilter = { $and: [baseFilter, additionalFilters] };

    let query = Event.find(finalFilter)
      .populate('creator', 'name email')
      .populate('participants.user', 'name email');

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    const events = await query;

    res.status(200).json({
      status: 'success',
      results: events.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(events.length / limit),
        totalEvents: events.length,
        hasNextPage: events.length === limit,
        hasPrevPage: page > 1
      },
      data: {
        events
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get single event
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('participants.user', 'name email');

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Enforce private visibility: only creator or participants can view a private event by ID
    if (!event.isPublic) {
      const isCreator = event.creator && event.creator._id.toString() === req.user._id.toString();
      const isParticipant = event.participants && event.participants.some(p => p.user.toString() === req.user._id.toString());
      if (!isCreator && !isParticipant) {
        return res.status(403).json({
          status: 'fail',
          message: 'This event is private. Access requires an invite link or membership.'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        event
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Check if user is the creator
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this event'
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Invalidate cache after successful event update
    invalidateEventCache(req.params.id, ['user:.*:my-events']);
    invalidateUserCache(req.user._id.toString(), ['user:.*:my-events']);

    res.status(200).json({
      status: 'success',
      data: {
        event: updatedEvent
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Check if user is the creator
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this event'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    // Remove event from user's createdEvents
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { createdEvents: req.params.id }
    });

    // Remove event from all participants' joinedEvents
    await User.updateMany(
      { joinedEvents: req.params.id },
      { $pull: { joinedEvents: req.params.id } }
    );

    // Invalidate cache after successful event deletion
    invalidateEventCache(req.params.id, ['user:.*:my-events', 'user:.*:joinedEvents']);
    invalidateUserCache(req.user._id.toString(), ['user:.*:my-events']);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Join event via invite link
exports.joinEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ inviteLink: req.params.inviteLink });

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid invite link or event not found'
      });
    }

    if (event.status !== 'active') {
      return res.status(400).json({
        status: 'fail',
        message: 'This event is no longer active'
      });
    }

    // Check if user is already a participant
    if (event.participants.some(p => p.user.toString() === req.user._id.toString())) {
      return res.status(400).json({
        status: 'fail',
        message: 'You are already a participant in this event'
      });
    }

    // Check if event has reached maximum participants
    if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
      return res.status(400).json({
        status: 'fail',
        message: 'Event has reached maximum participants'
      });
    }

    // Enforce RSVP requirement
    if (event.rsvpRequired && !req.body.status) {
      return res.status(400).json({
        status: 'fail',
        message: 'RSVP status is required to join this event'
      });
    }

    // Add user to event participants with status
    event.participants.push({
      user: req.user._id,
      status: req.body.status || 'yes'  // Use the status from request or default to 'yes'
    });
    await event.save();

    // Add event to user's joinedEvents
    await User.findByIdAndUpdate(req.user._id, {
      $push: { joinedEvents: event._id }
    });

    // Invalidate cache after successful event join
    invalidateEventCache(event._id.toString(), ['user:.*:joinedEvents']);
    invalidateUserCache(req.user._id.toString(), ['user:.*:joinedEvents']);

    res.status(200).json({
      status: 'success',
      data: {
        event
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// View event details via invite link (open access, no auth required)
exports.getEventByInviteLink = async (req, res) => {
  try {
    const event = await Event.findOne({ inviteLink: req.params.inviteLink })
      .populate('creator', 'name email')
      .populate('participants.user', 'name email');

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { event }
    });
  } catch (error) {
    return res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Join a public event by ID (no invite required)
exports.joinPublicEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    if (!event.isPublic) {
      return res.status(403).json({
        status: 'fail',
        message: 'This event is private. Use an invite link to join.'
      });
    }

    if (event.status !== 'active') {
      return res.status(400).json({
        status: 'fail',
        message: 'This event is no longer active'
      });
    }

    // Already participating?
    if (event.participants.some(p => p.user.toString() === req.user._id.toString())) {
      return res.status(400).json({
        status: 'fail',
        message: 'You are already a participant in this event'
      });
    }

    if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
      return res.status(400).json({
        status: 'fail',
        message: 'Event has reached maximum participants'
      });
    }

    if (event.rsvpRequired && !req.body.status) {
      return res.status(400).json({
        status: 'fail',
        message: 'RSVP status is required to join this event'
      });
    }

    event.participants.push({
      user: req.user._id,
      status: req.body.status || 'yes'
    });
    await event.save();

    await User.findByIdAndUpdate(req.user._id, { $push: { joinedEvents: event._id } });

    return res.status(200).json({
      status: 'success',
      data: { event }
    });
  } catch (error) {
    return res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Upload image to event album
exports.uploadAlbumImage = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Check if user is a participant or creator
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isParticipant = event.participants.some(p => p.user.toString() === req.user._id.toString());

    if (!isCreator && !isParticipant) {
      return res.status(403).json({
        status: 'fail',
        message: 'You must be a participant or creator to upload images to this event album'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'No image file provided'
      });
    }

    // Upload to album
    const uploadResult = await uploadAlbumImage(req.file, event._id);

    // Create image record
    const imageData = {
      imageId: uuidv4(),
      originalName: uploadResult.originalName,
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize,
      mimeType: uploadResult.mimeType,
      cloudinaryId: uploadResult.cloudinaryId,
      url: uploadResult.filePath,
      uploadedBy: req.user._id,
      description: req.body.description || null
    };

    // Add to event's image album
    event.imageAlbum.push(imageData);
    await event.save();

    res.status(201).json({
      status: 'success',
      data: {
        image: {
          ...imageData,
          uploadedBy: {
            _id: req.user._id,
            name: req.user.name
          }
        }
      }
    });
  } catch (error) {
    console.error('Error uploading album image:', error);
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Upload multiple images to event album
exports.uploadMultipleAlbumImages = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Check if user is a participant or creator
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isParticipant = event.participants.some(p => p.user.toString() === req.user._id.toString());

    if (!isCreator && !isParticipant) {
      return res.status(403).json({
        status: 'fail',
        message: 'You must be a participant or creator to upload images to this event album'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'No image files provided'
      });
    }

    const uploadedImages = [];

    // Upload each image
    for (const file of req.files) {
      try {
        // Upload to album
        const uploadResult = await uploadAlbumImage(file, event._id);

        // Create image record
        const imageData = {
          imageId: uuidv4(),
          originalName: uploadResult.originalName,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          cloudinaryId: uploadResult.cloudinaryId,
          url: uploadResult.filePath,
          uploadedBy: req.user._id,
          description: null
        };

        // Add to event's image album
        event.imageAlbum.push(imageData);
        uploadedImages.push(imageData);
      } catch (uploadError) {
        console.error('Error uploading individual image:', uploadError);
        // Continue with other images even if one fails
      }
    }

    await event.save();

    // Add user info to all uploaded images
    const imagesWithUserInfo = uploadedImages.map((image) => ({
      ...image,
      uploadedBy: {
        _id: req.user._id,
        name: req.user.name
      }
    }));

    res.status(201).json({
      status: 'success',
      data: {
        images: imagesWithUserInfo,
        count: imagesWithUserInfo.length
      }
    });
  } catch (error) {
    console.error('Error uploading multiple album images:', error);
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get event album images
exports.getAlbumImages = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('imageAlbum.uploadedBy', 'name email');

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Images already have URLs from Cloudinary
    const imagesWithUrls = event.imageAlbum.map((image) => ({
      ...image.toObject()
    }));

    res.status(200).json({
      status: 'success',
      data: {
        images: imagesWithUrls,
        count: imagesWithUrls.length
      }
    });
  } catch (error) {
    console.error('Error getting album images:', error);
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Delete image from event album
exports.deleteAlbumImage = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Find the image in the album
    const imageIndex = event.imageAlbum.findIndex(img => img.imageId === req.params.imageId);

    if (imageIndex === -1) {
      return res.status(404).json({
        status: 'fail',
        message: 'Image not found in event album'
      });
    }

    const image = event.imageAlbum[imageIndex];

    // Check if user is authorized to delete the image
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isImageOwner = image.uploadedBy.toString() === req.user._id.toString();

    if (!isCreator && !isImageOwner) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this image'
      });
    }

    // Delete file from Cloudinary
    if (image.cloudinaryId) {
      await deleteFile(image.cloudinaryId);
    }

    // Remove from event album
    event.imageAlbum.splice(imageIndex, 1);
    await event.save();

    res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting album image:', error);
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update image description
exports.updateAlbumImageDescription = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Find the image in the album
    const image = event.imageAlbum.find(img => img.imageId === req.params.imageId);

    if (!image) {
      return res.status(404).json({
        status: 'fail',
        message: 'Image not found in event album'
      });
    }

    // Check if user is authorized to update the image
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isImageOwner = image.uploadedBy.toString() === req.user._id.toString();

    if (!isCreator && !isImageOwner) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this image'
      });
    }

    // Update description
    image.description = req.body.description || null;
    await event.save();

    res.status(200).json({
      status: 'success',
      data: {
        image: {
          ...image.toObject(),
          uploadedBy: {
            _id: req.user._id,
            name: req.user.name
          }
        }
      }
    });
  } catch (error) {
    console.error('Error updating album image description:', error);
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

// ===== TODO LIST MANAGEMENT =====

// Add a new todo item to an event
exports.addTodo = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Check if user is authorized (creator or participant)
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isParticipant = event.participants.some(p => p.user.toString() === req.user._id.toString());

    if (!isCreator && !isParticipant) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to add todos to this event'
      });
    }

    // Validate required fields
    if (!req.body.description) {
      return res.status(400).json({
        status: 'fail',
        message: 'Todo description is required'
      });
    }

    // Validate priority if provided
    if (req.body.priority && !['low', 'medium', 'high'].includes(req.body.priority)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Priority must be low, medium, or high'
      });
    }

    // Add todo item
    const newTodo = {
      description: req.body.description,
      assignedTo: req.body.assignedTo || null,
      dueDate: req.body.dueDate || null,
      priority: req.body.priority || 'medium',
      notes: req.body.notes || null,
      createdBy: req.user._id
    };

    event.todoList.push(newTodo);
    await event.save();

    // Populate user references for response
    await event.populate('todoList.createdBy', 'name email');
    await event.populate('todoList.assignedTo', 'name email');

    const addedTodo = event.todoList[event.todoList.length - 1];

    // Invalidate cache after successful todo addition
    invalidateEventCache(req.params.id, ['user:.*:todos:.*']);

    res.status(201).json({
      status: 'success',
      data: {
        todo: addedTodo
      }
    });
  } catch (error) {
    console.error('Error adding todo:', error);
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update a todo item
exports.updateTodo = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Find the todo item
    const todo = event.todoList.id(req.params.todoId);

    if (!todo) {
      return res.status(404).json({
        status: 'fail',
        message: 'Todo item not found'
      });
    }

    // Check if user is authorized (creator, participant, or assigned to the todo)
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isParticipant = event.participants.some(p => p.user.toString() === req.user._id.toString());
    const isAssigned = todo.assignedTo && todo.assignedTo.toString() === req.user._id.toString();

    if (!isCreator && !isParticipant && !isAssigned) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this todo'
      });
    }

    // Validate priority if provided
    if (req.body.priority && !['low', 'medium', 'high'].includes(req.body.priority)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Priority must be low, medium, or high'
      });
    }

    // Update todo item
    const updates = {};
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.completed !== undefined) updates.completed = req.body.completed;
    if (req.body.assignedTo !== undefined) updates.assignedTo = req.body.assignedTo;
    if (req.body.dueDate !== undefined) updates.dueDate = req.body.dueDate;
    if (req.body.priority !== undefined) updates.priority = req.body.priority;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;

    // Handle completion timestamp
    if (updates.completed && !todo.completed) {
      updates.completedAt = new Date();
    } else if (updates.completed === false) {
      updates.completedAt = null;
    }

    Object.assign(todo, updates);
    await event.save();

    // Populate user references for response
    await event.populate('todoList.createdBy', 'name email');
    await event.populate('todoList.assignedTo', 'name email');

    // Invalidate cache after successful todo update
    invalidateEventCache(req.params.id, ['user:.*:todos:.*']);

    res.status(200).json({
      status: 'success',
      data: {
        todo: todo
      }
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Delete a todo item
exports.deleteTodo = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Find the todo item
    const todo = event.todoList.id(req.params.todoId);

    if (!todo) {
      return res.status(404).json({
        status: 'fail',
        message: 'Todo item not found'
      });
    }

    // Check if user is authorized (creator or the person who created the todo)
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isTodoCreator = todo.createdBy.toString() === req.user._id.toString();

    if (!isCreator && !isTodoCreator) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this todo'
      });
    }

    // Remove todo item
    todo.remove();
    await event.save();

    // Invalidate cache after successful todo deletion
    invalidateEventCache(req.params.id, ['user:.*:todos:.*']);

    res.status(200).json({
      status: 'success',
      message: 'Todo item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get todo list for an event
exports.getTodoList = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('todoList.createdBy', 'name email')
      .populate('todoList.assignedTo', 'name email');

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }

    // Check if user is authorized (creator or participant)
    const isCreator = event.creator.toString() === req.user._id.toString();
    const isParticipant = event.participants.some(p => p.user.toString() === req.user._id.toString());

    if (!isCreator && !isParticipant) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view todos for this event'
      });
    }

    // Get todo statistics
    const todoStats = event.todoStats;
    const overdueTodos = event.overdueTodos;

    res.status(200).json({
      status: 'success',
      data: {
        todos: event.todoList,
        stats: todoStats,
        overdue: overdueTodos
      }
    });
  } catch (error) {
    console.error('Error getting todo list:', error);
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};
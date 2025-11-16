const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { uploadPoster, uploadAlbumImage: uploadAlbumImageMiddleware, uploadMultipleAlbumImages: uploadMultipleAlbumImagesMiddleware, handleUploadError } = require('../middleware/uploadMiddleware');
const { eventsCache, userCache, invalidateCache } = require('../middleware/cacheMiddleware');
const {
  createEvent,
  getAllEvents,
  getMyEvents,
  getJoinedEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  getEventByInviteLink,
  joinPublicEvent,
  updateRsvp,
  leaveEvent,
  uploadAlbumImage,
  uploadMultipleAlbumImages,
  getAlbumImages,
  deleteAlbumImage,
  updateAlbumImageDescription,
  addTodo,
  updateTodo,
  deleteTodo,
  getTodoList
} = require('../controllers/eventController');

const router = express.Router();
const jsonParser = express.json();

/**
 * @swagger
 * /events/public/by-invite/{inviteLink}:
 *   get:
 *     summary: Publicly view an event by invite link (no auth required)
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: inviteLink
 *         required: true
 *         schema:
 *           type: string
 *         description: Event invite link
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management endpoints
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events with filtering and pagination
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of events per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [date, createdAt, title]
 *           default: date
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title or description
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 results:
 *                   type: integer
 *                   description: Number of events returned
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalEvents:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - date
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 description: Event title
 *                 example: "Tech Meetup 2024"
 *               description:
 *                 type: string
 *                 description: Event description
 *                 example: "A great opportunity to network with tech professionals"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Event date and time
 *                 example: "2024-12-25T18:00:00.000Z"
 *               location:
 *                 type: string
 *                 description: Event location
 *                 example: "123 Main St, City, Country"
 *               maxParticipants:
 *                 type: number
 *                 description: Maximum number of participants
 *                 example: 50
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /events/my-events:
 *   get:
 *     summary: Get all events created by the authenticated user
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of events per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [date, createdAt, title]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title or description
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, cancelled, completed]
 *         description: Filter by event status
 *     responses:
 *       200:
 *         description: User's events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 results:
 *                   type: integer
 *                   description: Number of events returned
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalEvents:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /events/joined-events:
 *   get:
 *     summary: Get all events that the authenticated user has joined with complete event data
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of events per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [date, createdAt, title]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title or description
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, cancelled, completed]
 *         description: Filter by event status
 *     responses:
 *       200:
 *         description: User's joined events retrieved successfully with complete data including poster, playlist, weather, todos, and image album
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 results:
 *                   type: integer
 *                   description: Number of events returned
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalEvents:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Event'
 *                           - type: object
 *                             properties:
 *                               poster:
 *                                 type: object
 *                                 properties:
 *                                   url:
 *                                     type: string
 *                                     description: Direct URL to the event poster image
 *                               spotifyPlaylist:
 *                                 type: object
 *                                 properties:
 *                                   embedUrl:
 *                                     type: string
 *                                     description: Spotify embed URL for the playlist
 *                               confirmedParticipantsCount:
 *                                 type: number
 *                                 description: Number of confirmed participants
 *                               formattedStartDateTime:
 *                                 type: string
 *                                 format: date-time
 *                                 description: Formatted start date and time
 *                               formattedEndDateTime:
 *                                 type: string
 *                                 format: date-time
 *                                 description: Formatted end date and time
 *                               durationMinutes:
 *                                 type: number
 *                                 description: Event duration in minutes
 *                               todoStats:
 *                                 type: object
 *                                 properties:
 *                                   total:
 *                                     type: number
 *                                   completed:
 *                                     type: number
 *                                   pending:
 *                                     type: number
 *                                   highPriority:
 *                                     type: number
 *                                   completionRate:
 *                                     type: number
 *                               overdueTodos:
 *                                 type: array
 *                                 items:
 *                                   $ref: '#/components/schemas/TodoItem'
 *                               userParticipantStatus:
 *                                 type: string
 *                                 enum: [yes, no, maybe]
 *                                 description: Current user's participation status
 *                               userJoinedAt:
 *                                 type: string
 *                                 format: date-time
 *                                 description: When the current user joined the event
 *                               imageAlbum:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     imageId:
 *                                       type: string
 *                                     url:
 *                                       type: string
 *                                       description: Direct URL to the image
 *                                     uploadedBy:
 *                                       type: object
 *                                       properties:
 *                                         name:
 *                                           type: string
 *                                         email:
 *                                           type: string
 *                                     uploadedAt:
 *                                       type: string
 *                                       format: date-time
 *                                     description:
 *                                       type: string
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get a specific event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Event title
 *                 example: "Updated Tech Meetup 2024"
 *               description:
 *                 type: string
 *                 description: Event description
 *                 example: "Updated description for the tech meetup"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Event date and time
 *                 example: "2024-12-25T19:00:00.000Z"
 *               location:
 *                 type: string
 *                 description: Event location
 *                 example: "456 Oak St, City, Country"
 *               maxParticipants:
 *                 type: number
 *                 description: Maximum number of participants
 *                 example: 75
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to update this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       204:
 *         description: Event deleted successfully
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to delete this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /events/join/{inviteLink}:
 *   post:
 *     summary: Join an event using invite link
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inviteLink
 *         required: true
 *         schema:
 *           type: string
 *         description: Event invite link
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [yes, no, maybe]
 *                 description: RSVP status (required if event.rsvpRequired is true, optional otherwise - defaults to 'yes')
 *                 example: "yes"
 *     responses:
 *       200:
 *         description: Successfully joined the event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Successfully joined the event"
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid invite link, already joined, or missing required RSVP status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * tags:
 *   name: Event Album
 *   description: Image album management endpoints for events
 */

/**
 * @swagger
 * /events/{id}/album:
 *   get:
 *     summary: Get all images from an event album
 *     tags: [Event Album]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event album images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           imageId:
 *                             type: string
 *                           originalName:
 *                             type: string
 *                           fileName:
 *                             type: string
 *                           fileSize:
 *                             type: number
 *                           mimeType:
 *                             type: string
 *                           uploadedBy:
 *                             type: object
 *                           uploadedAt:
 *                             type: string
 *                             format: date-time
 *                           description:
 *                             type: string
 *                           url:
 *                             type: string
 *                     count:
 *                       type: number
 *       404:
 *         description: Event not found
 *   post:
 *     summary: Upload a single image to event album
 *     tags: [Event Album]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *               description:
 *                 type: string
 *                 description: Optional description for the image
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *       400:
 *         description: Invalid file or no file provided
 *       403:
 *         description: Not authorized to upload to this event
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /events/{id}/album/multiple:
 *   post:
 *     summary: Upload multiple images to event album
 *     tags: [Event Album]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple image files to upload
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 *       400:
 *         description: Invalid files or no files provided
 *       403:
 *         description: Not authorized to upload to this event
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /events/{id}/album/{imageId}:
 *   delete:
 *     summary: Delete an image from event album
 *     tags: [Event Album]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       403:
 *         description: Not authorized to delete this image
 *       404:
 *         description: Event or image not found
 *   patch:
 *     summary: Update image description
 *     tags: [Event Album]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: New description for the image
 *     responses:
 *       200:
 *         description: Image description updated successfully
 *       403:
 *         description: Not authorized to update this image
 *       404:
 *         description: Event or image not found
 */

/**
 * @swagger
 * /events/{id}/todos:
 *   get:
 *     summary: Get todo list for an event
 *     tags: [Event Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Todo list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     todos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TodoItem'
 *                     stats:
 *                       $ref: '#/components/schemas/TodoStats'
 *                     overdue:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TodoItem'
 *       403:
 *         description: Not authorized to view todos for this event
 *       404:
 *         description: Event not found
 *   post:
 *     summary: Add a new todo item to an event
 *     tags: [Event Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 description: Todo item description
 *                 example: "Buy decorations"
 *               assignedTo:
 *                 type: string
 *                 description: User ID to assign the todo to
 *                 example: "507f1f77bcf86cd799439011"
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Due date for the todo
 *                 example: "2024-01-15"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Priority level of the todo
 *               notes:
 *                 type: string
 *                 description: Additional notes for the todo
 *                 example: "Get balloons and streamers"
 *     responses:
 *       201:
 *         description: Todo item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     todo:
 *                       $ref: '#/components/schemas/TodoItem'
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Not authorized to add todos to this event
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /events/{id}/todos/{todoId}:
 *   patch:
 *     summary: Update a todo item
 *     tags: [Event Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: path
 *         name: todoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Todo item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Todo item description
 *               completed:
 *                 type: boolean
 *                 description: Whether the todo is completed
 *               assignedTo:
 *                 type: string
 *                 description: User ID to assign the todo to
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Due date for the todo
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Priority level of the todo
 *               notes:
 *                 type: string
 *                 description: Additional notes for the todo
 *     responses:
 *       200:
 *         description: Todo item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     todo:
 *                       $ref: '#/components/schemas/TodoItem'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to update this todo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event or todo item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete a todo item
 *     tags: [Event Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: path
 *         name: todoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Todo item ID
 *     responses:
 *       200:
 *         description: Todo item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Todo item deleted successfully"
 *       403:
 *         description: Not authorized to delete this todo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event or todo item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /events/{id}/join:
 *   post:
 *     summary: Join a public event by ID
 *     description: Join a public event directly by event ID. Only works for public events (isPublic=true). For private events, use the invite link endpoint.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [yes, no, maybe]
 *                 description: RSVP status (required if event.rsvpRequired is true, optional otherwise - defaults to 'yes')
 *                 example: "yes"
 *     responses:
 *       200:
 *         description: Successfully joined the event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     event:
 *                       $ref: '#/components/schemas/Event'
 *       400:
 *         description: Event is not public, already joined, event not active, missing required RSVP status, or event at capacity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Event is private (use invite link instead)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /events/{id}/rsvp:
 *   patch:
 *     summary: Update RSVP status for an event
 *     description: Update your RSVP status (yes/no/maybe) for an event you have already joined
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [yes, no, maybe]
 *                 description: New RSVP status
 *                 example: "maybe"
 *     responses:
 *       200:
 *         description: RSVP status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     event:
 *                       $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid RSVP status or user is not a participant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Leave an event
 *     description: Remove yourself from an event's participant list
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Successfully left the event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Successfully left the event"
 *       400:
 *         description: User is not a participant of this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Public routes for open access via invite link
router.get('/public/by-invite/:inviteLink', getEventByInviteLink);
// Protect all other routes
router.use(protect);

// Event routes
router.route('/')
  .get(eventsCache(300), getAllEvents) // Cache for 5 minutes
  .post(uploadPoster, handleUploadError, invalidateCache(['events:.*', 'user:.*:my-events']), createEvent);

// Get user's created events
router.get('/my-events', userCache(180), getMyEvents); // Cache for 3 minutes

// Get user's joined events
router.get('/joined-events', userCache(180), getJoinedEvents); // Cache for 3 minutes

router.route('/:id')
  .get(eventsCache(600), getEvent) // Cache for 10 minutes
  .patch(jsonParser, invalidateCache(['events:.*', 'user:.*:my-events']), updateEvent)
  .delete(invalidateCache(['events:.*', 'user:.*:my-events']), deleteEvent);

// Join event route
router.post('/join/:inviteLink', joinEvent);
// Join public event without invite
router.post('/:id/join', joinPublicEvent);

// RSVP routes
router.patch('/:id/rsvp', jsonParser, invalidateCache(['events:.*', 'user:.*:joinedEvents']), updateRsvp);
router.delete('/:id/rsvp', invalidateCache(['events:.*', 'user:.*:joinedEvents']), leaveEvent);

// Album routes
router.route('/:id/album')
  .get(userCache(300), getAlbumImages) // Cache for 5 minutes
  .post(uploadAlbumImageMiddleware, handleUploadError, invalidateCache(['user:.*:album:.*']), uploadAlbumImage);

router.post('/:id/album/multiple', uploadMultipleAlbumImagesMiddleware, handleUploadError, invalidateCache(['user:.*:album:.*']), uploadMultipleAlbumImages);

router.route('/:id/album/:imageId')
  .delete(invalidateCache(['user:.*:album:.*']), deleteAlbumImage)
  .patch(jsonParser, invalidateCache(['user:.*:album:.*']), updateAlbumImageDescription);

// Todo list routes
router.route('/:id/todos')
  .get(userCache(300), getTodoList) // Cache for 5 minutes
  .post(jsonParser, invalidateCache(['user:.*:todos:.*']), addTodo);

router.route('/:id/todos/:todoId')
  .patch(jsonParser, invalidateCache(['user:.*:todos:.*']), updateTodo)
  .delete(invalidateCache(['user:.*:todos:.*']), deleteTodo);

module.exports = router; 
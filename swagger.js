const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management API',
      version: '1.0.0',
      description: 'A comprehensive REST API for managing events, users, and event participation',
      contact: {
        name: 'API Support',
        email: 'support@eventapp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            avatar: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'Avatar image URL'
                },
                cloudinaryId: {
                  type: 'string',
                  description: 'Cloudinary public ID for the avatar'
                }
              },
              description: 'User profile picture information'
            },
            password: {
              type: 'string',
              description: 'User password (min 8 characters)'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'User date of birth (must be at least 13 years old)'
            },
            age: {
              type: 'integer',
              description: 'Calculated age from date of birth (virtual field)'
            },
            createdEvents: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of event IDs created by the user'
            },
            joinedEvents: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of event IDs the user has joined'
            },
            fcmToken: {
              type: 'string',
              description: 'Firebase Cloud Messaging token for push notifications'
            },
            notificationSettings: {
              type: 'object',
              properties: {
                eventUpdates: {
                  type: 'boolean',
                  description: 'Receive event update notifications',
                  default: true
                },
                eventReminders: {
                  type: 'boolean',
                  description: 'Receive event reminder notifications',
                  default: true
                },
                weatherAlerts: {
                  type: 'boolean',
                  description: 'Receive weather alert notifications',
                  default: true
                },
                pushNotifications: {
                  type: 'boolean',
                  description: 'Enable push notifications',
                  default: true
                }
              },
              description: 'User notification preferences'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Event: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Event ID'
            },
            title: {
              type: 'string',
              description: 'Event title'
            },
            description: {
              type: 'string',
              description: 'Event description'
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Event start date'
            },
            startTime: {
              type: 'string',
              description: 'Event start time in HH:MM format (e.g., 14:30)'
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'Event end date (optional)'
            },
                         endTime: {
               type: 'string',
               description: 'Event end time in HH:MM format (e.g., 16:30) (optional)'
             },
             weather: {
               type: 'object',
               properties: {
                 forecast: {
                   type: 'array',
                   description: 'Weather forecast data'
                 },
                 lastUpdated: {
                   type: 'string',
                   format: 'date-time',
                   description: 'When weather data was last updated'
                 },
                 location: {
                   type: 'object',
                   properties: {
                     lat: {
                       type: 'number',
                       description: 'Weather location latitude (from LocationIQ)'
                     },
                     lon: {
                       type: 'number',
                       description: 'Weather location longitude (from LocationIQ)'
                     }
                   }
                 }
               },
               description: 'Weather forecast information (auto-populated for events within 10 days using LocationIQ coordinates)'
             },
            location: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Location name'
                },
                address: {
                  type: 'string',
                  description: 'Full address'
                },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: {
                      type: 'number',
                      description: 'Latitude'
                    },
                    lon: {
                      type: 'number',
                      description: 'Longitude'
                    }
                  }
                },
                place_id: {
                  type: 'string',
                  description: 'LocationIQ place ID'
                },
                display_name: {
                  type: 'string',
                  description: 'Display name from LocationIQ'
                }
              },
              description: 'Event location with detailed information'
            },
            maxParticipants: {
              type: 'number',
              description: 'Maximum number of participants allowed'
            },
            participants: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Participant'
              },
              description: 'Array of participants with RSVP status'
            },
            imageAlbum: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AlbumImage'
              },
              description: 'Event photo album'
            },
            reminders: {
              type: 'object',
              properties: {
                sent24h: {
                  type: 'boolean',
                  description: 'Whether 24-hour reminder was sent',
                  default: false
                },
                sent2h: {
                  type: 'boolean',
                  description: 'Whether 2-hour reminder was sent',
                  default: false
                },
                sent30m: {
                  type: 'boolean',
                  description: 'Whether 30-minute reminder was sent',
                  default: false
                },
                lastChecked: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Last time reminders were checked'
                }
              },
              description: 'Event reminder tracking'
            },
            status: {
              type: 'string',
              enum: ['active', 'cancelled', 'completed'],
              description: 'Event status',
              default: 'active'
            },
            creator: {
              type: 'string',
              description: 'User ID of the event creator'
            },
            inviteLink: {
              type: 'string',
              description: 'Unique invite link for the event'
            },
            isPublic: {
              type: 'boolean',
              description: 'Whether the event is public and discoverable',
              default: true
            },
            rsvpRequired: {
              type: 'boolean',
              description: 'Whether RSVP status is required to join',
              default: false
            },
            todoList: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/TodoItem'
              },
              description: 'Array of todo items for the event'
            },
            spotifyPlaylist: {
              $ref: '#/components/schemas/SpotifyPlaylist',
              description: 'Optional Spotify playlist for the event'
            },
            dressCode: {
              type: 'string',
              description: 'Optional dress code for the event'
            },
            poster: {
              type: 'object',
              properties: {
                fileName: {
                  type: 'string',
                  description: 'Name of the poster file'
                },
                originalName: {
                  type: 'string',
                  description: 'Original filename'
                },
                fileSize: {
                  type: 'integer',
                  description: 'File size in bytes'
                },
                mimeType: {
                  type: 'string',
                  description: 'MIME type of the file'
                },
                cloudinaryId: {
                  type: 'string',
                  description: 'Cloudinary public ID'
                },
                filePath: {
                  type: 'string',
                  description: 'Full file path/URL'
                },
                uploadedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'When the poster was uploaded'
                }
              },
              description: 'Event poster information'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        SpotifyPlaylist: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Spotify playlist ID'
            },
            name: {
              type: 'string',
              description: 'Playlist name'
            },
            description: {
              type: 'string',
              description: 'Playlist description'
            },
            imageUrl: {
              type: 'string',
              description: 'URL to playlist cover image'
            },
            trackCount: {
              type: 'integer',
              description: 'Number of tracks in the playlist'
            },
            owner: {
              type: 'string',
              description: 'Playlist owner display name'
            },
            url: {
              type: 'string',
              description: 'Spotify playlist URL'
            },
            playlistId: {
              type: 'string',
              description: 'Spotify playlist ID (duplicate of id field)'
            },
            embedUrl: {
              type: 'string',
              description: 'Spotify embed URL for the playlist'
            }
          }
        },
        TodoItem: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Todo item ID'
            },
            description: {
              type: 'string',
              description: 'Todo item description'
            },
            completed: {
              type: 'boolean',
              description: 'Whether the todo is completed'
            },
            assignedTo: {
              type: 'string',
              description: 'User ID assigned to the todo'
            },
            createdBy: {
              type: 'string',
              description: 'User ID who created the todo'
            },
            dueDate: {
              type: 'string',
              format: 'date',
              description: 'Due date for the todo'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Priority level of the todo'
            },
            notes: {
              type: 'string',
              description: 'Additional notes for the todo'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the todo was created'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the todo was completed'
            }
          }
        },
        TodoStats: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of todo items'
            },
            completed: {
              type: 'integer',
              description: 'Number of completed todo items'
            },
            pending: {
              type: 'integer',
              description: 'Number of pending todo items'
            },
            highPriority: {
              type: 'integer',
              description: 'Number of high priority pending todos'
            },
            completionRate: {
              type: 'integer',
              description: 'Completion rate as a percentage'
            }
          }
        },
        WeatherDaily: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
            maxTemp: { type: 'number', description: 'Max temperature (°C)' },
            minTemp: { type: 'number', description: 'Min temperature (°C)' },
            precipitationProbability: { type: 'number', description: 'Max precipitation probability (%)' },
            weatherCode: { type: 'integer', description: 'Weather code' },
            weatherDescription: { type: 'string', description: 'Weather description' }
          }
        },
        WeatherHourly: {
          type: 'object',
          properties: {
            time: { type: 'string', description: 'Time (ISO)' },
            temperature: { type: 'number', description: 'Temperature (°C)' },
            humidity: { type: 'number', description: 'Relative humidity (%)' },
            precipitationProbability: { type: 'number', description: 'Precipitation probability (%)' },
            weatherCode: { type: 'integer', description: 'Weather code' },
            windSpeed: { type: 'number', description: 'Wind speed (10m) m/s' },
            weatherDescription: { type: 'string', description: 'Weather description' }
          }
        },
        Weather: {
          type: 'object',
          properties: {
            location: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lon: { type: 'number' },
                name: { type: 'string', description: 'Optional display name' }
              }
            },
            dateRange: {
              type: 'object',
              properties: {
                start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
              }
            },
            daily: {
              type: 'array',
              items: { $ref: '#/components/schemas/WeatherDaily' }
            },
            hourly: {
              type: 'array',
              items: { $ref: '#/components/schemas/WeatherHourly' }
            }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Notification ID'
            },
            userId: {
              type: 'string',
              description: 'User ID who receives the notification'
            },
            type: {
              type: 'string',
              enum: ['host_announcement', 'event_created', 'event_updated', 'event_cancelled', 'event_reminder_24h', 'event_reminder_2h', 'event_reminder_30m', 'rsvp_confirmed', 'rsvp_declined', 'rsvp_maybe', 'weather_alert', 'system'],
              description: 'Type of notification'
            },
            title: {
              type: 'string',
              description: 'Notification title (max 100 characters)'
            },
            body: {
              type: 'string',
              description: 'Notification body text (max 500 characters)'
            },
            data: {
              type: 'object',
              properties: {
                eventId: {
                  type: 'string',
                  description: 'Related event ID'
                },
                eventTitle: {
                  type: 'string',
                  description: 'Related event title'
                },
                hostName: {
                  type: 'string',
                  description: 'Event host name'
                },
                actionUrl: {
                  type: 'string',
                  description: 'URL for notification action'
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'normal', 'high'],
                  description: 'Notification priority'
                },
                metadata: {
                  type: 'object',
                  description: 'Additional metadata'
                }
              },
              description: 'Notification data payload'
            },
            isRead: {
              type: 'boolean',
              description: 'Whether notification has been read',
              default: false
            },
            readAt: {
              type: 'string',
              format: 'date-time',
              description: 'When notification was marked as read'
            },
            fcmMessageId: {
              type: 'string',
              description: 'Firebase Cloud Messaging message ID'
            },
            deliveryStatus: {
              type: 'string',
              enum: ['pending', 'sent', 'delivered', 'failed'],
              description: 'Notification delivery status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        NotificationStats: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of notifications'
            },
            unread: {
              type: 'integer',
              description: 'Number of unread notifications'
            },
            read: {
              type: 'integer',
              description: 'Number of read notifications'
            },
            byType: {
              type: 'object',
              description: 'Count of notifications by type'
            }
          }
        },
        AlbumImage: {
          type: 'object',
          properties: {
            imageId: {
              type: 'string',
              description: 'Unique image identifier'
            },
            originalName: {
              type: 'string',
              description: 'Original filename'
            },
            fileName: {
              type: 'string',
              description: 'Stored filename'
            },
            fileSize: {
              type: 'integer',
              description: 'File size in bytes'
            },
            mimeType: {
              type: 'string',
              description: 'MIME type (e.g., image/jpeg, image/png)'
            },
            cloudinaryId: {
              type: 'string',
              description: 'Cloudinary public ID'
            },
            url: {
              type: 'string',
              description: 'Image URL'
            },
            uploadedBy: {
              type: 'string',
              description: 'User ID who uploaded the image'
            },
            uploadedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When image was uploaded'
            },
            description: {
              type: 'string',
              description: 'Optional image description'
            }
          }
        },
        Participant: {
          type: 'object',
          properties: {
            user: {
              type: 'string',
              description: 'User ID of participant'
            },
            status: {
              type: 'string',
              enum: ['yes', 'no', 'maybe'],
              description: 'RSVP status'
            },
            joinedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When user joined the event'
            }
          }
        },
        Location: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Location name'
            },
            address: {
              type: 'string',
              description: 'Full address'
            },
            coordinates: {
              type: 'object',
              properties: {
                lat: {
                  type: 'number',
                  description: 'Latitude'
                },
                lon: {
                  type: 'number',
                  description: 'Longitude'
                }
              }
            },
            place_id: {
              type: 'string',
              description: 'LocationIQ place ID'
            },
            display_name: {
              type: 'string',
              description: 'Display name from LocationIQ'
            }
          }
        },
        LocationSearchResult: {
          type: 'object',
          properties: {
            place_id: {
              type: 'string',
              description: 'Unique place identifier'
            },
            display_name: {
              type: 'string',
              description: 'Full display name of the location'
            },
            lat: {
              type: 'string',
              description: 'Latitude'
            },
            lon: {
              type: 'string',
              description: 'Longitude'
            },
            type: {
              type: 'string',
              description: 'Type of location (e.g., city, venue)'
            },
            address: {
              type: 'object',
              description: 'Detailed address components'
            }
          }
        },
        FCMNotification: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Notification title'
            },
            body: {
              type: 'string',
              description: 'Notification body'
            },
            data: {
              type: 'object',
              description: 'Additional data payload'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Error status'
            },
            message: {
              type: 'string',
              description: 'Error message'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

// Add tags definition
const tags = [
  {
    name: 'Users',
    description: 'User management and authentication endpoints'
  },
  {
    name: 'Events',
    description: 'Event management endpoints'
  },
  {
    name: 'Event Album',
    description: 'Image album management endpoints for events'
  },
  {
    name: 'Event Todos',
    description: 'Todo list management endpoints for events'
  },
  {
    name: 'Locations',
    description: 'Location search and geocoding endpoints using LocationIQ'
  },
  {
    name: 'Weather',
    description: 'Weather forecast endpoints using Open-Meteo API'
  },
  {
    name: 'FCM',
    description: 'Firebase Cloud Messaging push notification endpoints'
  },
  {
    name: 'Notifications',
    description: 'In-app notification management endpoints'
  }
];

// Merge tags into options
options.definition.tags = tags;

const specs = swaggerJsdoc(options);

module.exports = specs;

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
                type: 'string'
              },
              description: 'Array of user IDs participating in the event'
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

const specs = swaggerJsdoc(options);

module.exports = specs;

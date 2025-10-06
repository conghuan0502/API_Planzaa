# React Native Event API Guide

This guide provides comprehensive documentation for fetching user events in a React Native application. It includes all necessary endpoints, request/response examples, and implementation details.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Get User's Created Events

### Endpoint
```
GET /api/events/my-events
```

### Description
Retrieves all events created by the authenticated user with complete event data including poster, playlist, weather, todos, and image album.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 10 | Number of events per page |
| `sort` | string | createdAt | Sort field (date, createdAt, title) |
| `search` | string | - | Search term for title or description |
| `location` | string | - | Filter by location |
| `status` | string | - | Filter by event status (active, cancelled, completed) |

### Example Request
```javascript
// React Native fetch example
const fetchMyEvents = async (token, page = 1, limit = 10) => {
  try {
    const response = await fetch(`http://localhost:3000/api/events/my-events?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching my events:', error);
    throw error;
  }
};
```

### Example Response
```json
{
  "status": "success",
  "results": 2,
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalEvents": 2,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "data": {
    "events": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Tech Meetup 2024",
        "description": "A great opportunity to network with tech professionals",
        "location": {
          "name": "Tech Hub",
          "address": "123 Tech Street, San Francisco, CA",
          "coordinates": {
            "lat": 37.7749,
            "lon": -122.4194
          }
        },
        "startDate": "2024-12-31T00:00:00.000Z",
        "startTime": "18:00",
        "endDate": "2024-12-31T00:00:00.000Z",
        "endTime": "21:00",
        "dressCode": "Business Casual",
        "spotifyPlaylist": {
          "url": "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
          "playlistId": "37i9dQZF1DXcBWIGoYBM5M",
          "embedUrl": "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M"
        },
        "weather": {
          "forecast": {
            "location": {
              "lat": 37.7749,
              "lon": -122.4194
            },
            "dateRange": {
              "start": "2024-12-31",
              "end": "2024-12-31"
            },
            "daily": [
              {
                "date": "2024-12-31",
                "maxTemp": 22,
                "minTemp": 15,
                "precipitationProbability": 10,
                "weatherCode": 1
              }
            ]
          },
          "lastUpdated": "2024-01-15T10:30:00.000Z"
        },
        "poster": {
          "fileName": "poster_1234567890.jpg",
          "originalName": "tech-meetup-poster.jpg",
          "fileSize": 1024000,
          "mimeType": "image/jpeg",
          "cloudinaryId": "events/posters/poster_1234567890",
          "filePath": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/posters/poster_1234567890.jpg",
          "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/posters/poster_1234567890.jpg",
          "uploadedAt": "2024-01-15T10:30:00.000Z"
        },
        "imageAlbum": [
          {
            "imageId": "img_1234567890",
            "originalName": "event-photo-1.jpg",
            "fileName": "album_1234567890.jpg",
            "fileSize": 512000,
            "mimeType": "image/jpeg",
            "cloudinaryId": "events/albums/album_1234567890",
            "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/albums/album_1234567890.jpg",
            "uploadedBy": {
              "_id": "507f1f77bcf86cd799439012",
              "name": "John Doe",
              "email": "john@example.com"
            },
            "uploadedAt": "2024-01-15T11:00:00.000Z",
            "description": "Great networking session"
          }
        ],
        "todoList": [
          {
            "_id": "507f1f77bcf86cd799439013",
            "description": "Set up registration table",
            "completed": false,
            "assignedTo": {
              "_id": "507f1f77bcf86cd799439012",
              "name": "John Doe",
              "email": "john@example.com"
            },
            "createdBy": {
              "_id": "507f1f77bcf86cd799439011",
              "name": "Event Creator",
              "email": "creator@example.com"
            },
            "dueDate": "2024-12-30T00:00:00.000Z",
            "priority": "high",
            "notes": "Need to arrive 30 minutes early",
            "createdAt": "2024-01-15T10:30:00.000Z",
            "completedAt": null
          }
        ],
        "creator": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Event Creator",
          "email": "creator@example.com",
          "avatar": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/avatars/avatar_1234567890.jpg"
        },
        "participants": [
          {
            "user": {
              "_id": "507f1f77bcf86cd799439012",
              "name": "John Doe",
              "email": "john@example.com",
              "avatar": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/avatars/avatar_1234567891.jpg"
            },
            "status": "yes",
            "joinedAt": "2024-01-15T10:30:00.000Z"
          }
        ],
        "inviteLink": "507f1f77bcf86cd799439011-1642248600000",
        "isPublic": true,
        "rsvpRequired": false,
        "maxParticipants": 50,
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "confirmedParticipantsCount": 1,
        "formattedStartDateTime": "2024-12-31T18:00:00.000Z",
        "formattedEndDateTime": "2024-12-31T21:00:00.000Z",
        "durationMinutes": 180,
        "todoStats": {
          "total": 1,
          "completed": 0,
          "pending": 1,
          "highPriority": 1,
          "completionRate": 0
        },
        "overdueTodos": []
      }
    ]
  }
}
```

---

## 2. Get User's Joined Events

### Endpoint
```
GET /api/events/joined-events
```

### Description
Retrieves all events that the authenticated user has joined by accepting invite links, with complete event data including poster, playlist, weather, todos, and image album.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 10 | Number of events per page |
| `sort` | string | createdAt | Sort field (date, createdAt, title) |
| `search` | string | - | Search term for title or description |
| `location` | string | - | Filter by location |
| `status` | string | - | Filter by event status (active, cancelled, completed) |

### Example Request
```javascript
// React Native fetch example
const fetchJoinedEvents = async (token, page = 1, limit = 10) => {
  try {
    const response = await fetch(`http://localhost:3000/api/events/joined-events?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching joined events:', error);
    throw error;
  }
};
```

### Example Response
```json
{
  "status": "success",
  "results": 1,
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalEvents": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "data": {
    "events": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "title": "Music Festival 2024",
        "description": "Annual music festival with top artists",
        "location": {
          "name": "Central Park",
          "address": "Central Park, New York, NY",
          "coordinates": {
            "lat": 40.7829,
            "lon": -73.9654
          }
        },
        "startDate": "2024-07-15T00:00:00.000Z",
        "startTime": "14:00",
        "endDate": "2024-07-15T00:00:00.000Z",
        "endTime": "23:00",
        "dressCode": "Casual",
        "spotifyPlaylist": {
          "url": "https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd",
          "playlistId": "37i9dQZF1DX0XUsuxWHRQd",
          "embedUrl": "https://open.spotify.com/embed/playlist/37i9dQZF1DX0XUsuxWHRQd"
        },
        "weather": {
          "forecast": {
            "location": {
              "lat": 40.7829,
              "lon": -73.9654
            },
            "dateRange": {
              "start": "2024-07-15",
              "end": "2024-07-15"
            },
            "daily": [
              {
                "date": "2024-07-15",
                "maxTemp": 28,
                "minTemp": 20,
                "precipitationProbability": 5,
                "weatherCode": 0
              }
            ]
          },
          "lastUpdated": "2024-01-15T10:30:00.000Z"
        },
        "poster": {
          "fileName": "festival_poster_1234567890.jpg",
          "originalName": "music-festival-poster.jpg",
          "fileSize": 2048000,
          "mimeType": "image/jpeg",
          "cloudinaryId": "events/posters/festival_poster_1234567890",
          "filePath": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/posters/festival_poster_1234567890.jpg",
          "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/posters/festival_poster_1234567890.jpg",
          "uploadedAt": "2024-01-15T10:30:00.000Z"
        },
        "imageAlbum": [
          {
            "imageId": "img_festival_1234567890",
            "originalName": "festival-moment.jpg",
            "fileName": "album_festival_1234567890.jpg",
            "fileSize": 1024000,
            "mimeType": "image/jpeg",
            "cloudinaryId": "events/albums/album_festival_1234567890",
            "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/albums/album_festival_1234567890.jpg",
            "uploadedBy": {
              "_id": "507f1f77bcf86cd799439015",
              "name": "Jane Smith",
              "email": "jane@example.com"
            },
            "uploadedAt": "2024-01-15T12:00:00.000Z",
            "description": "Amazing performance"
          }
        ],
        "todoList": [
          {
            "_id": "507f1f77bcf86cd799439016",
            "description": "Bring sunscreen and water",
            "completed": true,
            "assignedTo": {
              "_id": "507f1f77bcf86cd799439012",
              "name": "John Doe",
              "email": "john@example.com"
            },
            "createdBy": {
              "_id": "507f1f77bcf86cd799439015",
              "name": "Jane Smith",
              "email": "jane@example.com"
            },
            "dueDate": "2024-07-14T00:00:00.000Z",
            "priority": "medium",
            "notes": "Essential items for outdoor event",
            "createdAt": "2024-01-15T10:30:00.000Z",
            "completedAt": "2024-01-15T11:00:00.000Z"
          }
        ],
        "creator": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Jane Smith",
          "email": "jane@example.com",
          "avatar": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/avatars/avatar_1234567892.jpg"
        },
        "participants": [
          {
            "user": {
              "_id": "507f1f77bcf86cd799439012",
              "name": "John Doe",
              "email": "john@example.com",
              "avatar": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/avatars/avatar_1234567891.jpg"
            },
            "status": "yes",
            "joinedAt": "2024-01-15T10:30:00.000Z"
          }
        ],
        "inviteLink": "507f1f77bcf86cd799439014-1642248600000",
        "isPublic": true,
        "rsvpRequired": true,
        "maxParticipants": 1000,
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "confirmedParticipantsCount": 1,
        "formattedStartDateTime": "2024-07-15T14:00:00.000Z",
        "formattedEndDateTime": "2024-07-15T23:00:00.000Z",
        "durationMinutes": 540,
        "todoStats": {
          "total": 1,
          "completed": 1,
          "pending": 0,
          "highPriority": 0,
          "completionRate": 100
        },
        "overdueTodos": [],
        "userParticipantStatus": "yes",
        "userJoinedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

## 3. Complete React Native Implementation

### Authentication Service
```javascript
// services/AuthService.js
class AuthService {
  static async login(email, password) {
    try {
      const response = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        return data.token;
      }
      throw new Error(data.message);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
}

export default AuthService;
```

### Event Service
```javascript
// services/EventService.js
class EventService {
  static async getMyEvents(token, page = 1, limit = 10, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await fetch(`http://localhost:3000/api/events/my-events?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching my events:', error);
      throw error;
    }
  }

  static async getJoinedEvents(token, page = 1, limit = 10, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await fetch(`http://localhost:3000/api/events/joined-events?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching joined events:', error);
      throw error;
    }
  }
}

export default EventService;
```

### React Native Component Example
```javascript
// components/EventList.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import EventService from '../services/EventService';

const EventList = ({ token, eventType = 'my-events' }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchEvents = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const response = eventType === 'my-events' 
        ? await EventService.getMyEvents(token, pageNum, 10)
        : await EventService.getJoinedEvents(token, pageNum, 10);
      
      if (response.status === 'success') {
        const newEvents = response.data.events;
        setEvents(prev => reset ? newEvents : [...prev, ...newEvents]);
        setHasMore(response.pagination.hasNextPage);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1, true);
  }, [token, eventType]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchEvents(nextPage);
    }
  };

  const renderEvent = ({ item }) => (
    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.title}</Text>
      <Text style={{ fontSize: 14, color: '#666' }}>{item.description}</Text>
      <Text style={{ fontSize: 12, color: '#999' }}>
        {new Date(item.formattedStartDateTime).toLocaleDateString()}
      </Text>
      {item.poster?.url && (
        <Text style={{ fontSize: 12, color: '#007AFF' }}>Poster Available</Text>
      )}
      {item.spotifyPlaylist?.embedUrl && (
        <Text style={{ fontSize: 12, color: '#1DB954' }}>Playlist Available</Text>
      )}
    </View>
  );

  return (
    <FlatList
      data={events}
      renderItem={renderEvent}
      keyExtractor={(item) => item._id}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <ActivityIndicator /> : null}
    />
  );
};

export default EventList;
```

---

## 4. Error Handling

### Common Error Responses
```json
// 401 Unauthorized
{
  "status": "fail",
  "message": "You are not logged in. Please log in to get access."
}

// 400 Bad Request
{
  "status": "fail",
  "message": "Invalid input data"
}

// 500 Internal Server Error
{
  "status": "fail",
  "message": "Internal server error"
}
```

### Error Handling Implementation
```javascript
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    switch (status) {
      case 401:
        // Redirect to login
        break;
      case 400:
        // Show validation error
        break;
      case 500:
        // Show server error
        break;
      default:
        // Show generic error
        break;
    }
  } else {
    // Network error
    console.error('Network error:', error.message);
  }
};
```

---

## 5. Data Models

### Event Object Structure
```typescript
interface Event {
  _id: string;
  title: string;
  description: string;
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lon: number;
    };
  };
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime?: string;
  dressCode?: string;
  spotifyPlaylist?: {
    url: string;
    playlistId: string;
    embedUrl: string;
  };
  weather?: {
    forecast: any;
    lastUpdated: string;
  };
  poster: {
    url: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
  };
  imageAlbum: Array<{
    imageId: string;
    url: string;
    uploadedBy: {
      name: string;
      email: string;
    };
    uploadedAt: string;
    description?: string;
  }>;
  todoList: Array<{
    _id: string;
    description: string;
    completed: boolean;
    assignedTo?: {
      name: string;
      email: string;
    };
    createdBy: {
      name: string;
      email: string;
    };
    dueDate?: string;
    priority: 'low' | 'medium' | 'high';
    notes?: string;
  }>;
  creator: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  participants: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    status: 'yes' | 'no' | 'maybe';
    joinedAt: string;
  }>;
  confirmedParticipantsCount: number;
  formattedStartDateTime: string;
  formattedEndDateTime?: string;
  durationMinutes?: number;
  todoStats: {
    total: number;
    completed: number;
    pending: number;
    highPriority: number;
    completionRate: number;
  };
  overdueTodos: Array<any>;
  userParticipantStatus?: 'yes' | 'no' | 'maybe';
  userJoinedAt?: string;
  status: 'active' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}
```

---

## 6. Usage Examples

### Fetching Events with Filters
```javascript
// Search for events
const searchEvents = async (token, searchTerm) => {
  const response = await EventService.getMyEvents(token, 1, 10, {
    search: searchTerm,
    status: 'active'
  });
  return response;
};

// Filter by location
const getEventsByLocation = async (token, location) => {
  const response = await EventService.getJoinedEvents(token, 1, 10, {
    location: location
  });
  return response;
};

// Sort by date
const getEventsByDate = async (token) => {
  const response = await EventService.getMyEvents(token, 1, 10, {
    sort: 'date'
  });
  return response;
};
```

### Pagination Implementation
```javascript
const useEventPagination = (token, eventType) => {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadEvents = async (pageNum = 1, reset = false) => {
    setLoading(true);
    try {
      const response = eventType === 'my-events'
        ? await EventService.getMyEvents(token, pageNum, 10)
        : await EventService.getJoinedEvents(token, pageNum, 10);
      
      if (response.status === 'success') {
        const newEvents = response.data.events;
        setEvents(prev => reset ? newEvents : [...prev, ...newEvents]);
        setHasMore(response.pagination.hasNextPage);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadEvents(nextPage);
    }
  };

  const refresh = () => {
    setPage(1);
    loadEvents(1, true);
  };

  return { events, loading, hasMore, loadMore, refresh };
};
```

This comprehensive guide provides all the information needed for AI assistants to understand and implement the event fetching functionality in your React Native application.

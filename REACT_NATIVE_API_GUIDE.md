# React Native API Integration Guide

## Event Management API for React Native

This guide provides comprehensive instructions for integrating the Event Management API with your React Native application. The API provides features for user authentication, event management, location services, weather information, and image uploads.

## Table of Contents

1. [API Overview](#api-overview)
2. [Base Configuration](#base-configuration)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Error Handling](#error-handling)
6. [File Upload](#file-upload)
7. [Complete Examples](#complete-examples)
8. [Best Practices](#best-practices)

## API Overview

### Base URL
```
http://your-server-domain:5000/api
```

### Available Endpoints
- **Users**: `/users` - Registration, login, profile management
- **Events**: `/events` - Event CRUD operations, joining events
- **Locations**: `/locations` - Location search and details
- **Weather**: `/weather` - Weather forecasts for events
- **Documentation**: `/api-docs` - Swagger API documentation

### Features
- JWT Authentication
- Image upload with Cloudinary
- Location services with LocationIQ
- Weather integration
- Event album management
- Rate limiting and security

## Base Configuration

### 1. Install Required Dependencies

```bash
npm install axios react-native-document-picker react-native-image-picker @react-native-async-storage/async-storage
```

### 2. Create API Configuration

Create `src/services/api.js`:

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base configuration
const API_BASE_URL = 'http://your-server-domain:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      // Navigate to login screen
      // navigation.navigate('Login');
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Create API Service Classes

Create `src/services/authService.js`:

```javascript
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  async register(userData) {
    try {
      const response = await api.post('/users/register', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async login(credentials) {
    try {
      const response = await api.post('/users/login', credentials);
      const { token, data } = response.data;
      
      // Store token
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(data));
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getProfile() {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await api.patch('/users/profile', profileData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return new Error('An unexpected error occurred');
  }
}

export default new AuthService();
```

## Authentication

### Login Screen Example

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AuthService from '../services/authService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.login({ email, password });
      Alert.alert('Success', 'Login successful!');
      // Navigate to main app
      navigation.replace('MainApp');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
  },
});

export default LoginScreen;
```

### Registration Screen Example

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AuthService from '../services/authService';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        dateOfBirth: dateOfBirth.toISOString().split('T')[0], // Format as YYYY-MM-DD
      };

      await AuthService.register(userData);
      Alert.alert('Success', 'Registration successful! Please login.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name *"
        value={formData.name}
        onChangeText={(value) => handleInputChange('name', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Email *"
        value={formData.email}
        onChangeText={(value) => handleInputChange('email', value)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password *"
        value={formData.password}
        onChangeText={(value) => handleInputChange('password', value)}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password *"
        value={formData.confirmPassword}
        onChangeText={(value) => handleInputChange('confirmPassword', value)}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateButtonText}>
          Date of Birth: {dateOfBirth.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating Account...' : 'Register'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth}
          mode="date"
          onChange={handleDateChange}
          maximumDate={new Date()} // Cannot select future dates
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 50,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
  },
});

export default RegisterScreen;
```

## API Endpoints

### Event Service

Create `src/services/eventService.js`:

```javascript
import api from './api';

class EventService {
  // Get all events with filtering and pagination
  async getEvents(params = {}) {
    try {
      const response = await api.get('/events', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get single event
  async getEvent(eventId) {
    try {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new event
  async createEvent(eventData, posterImage = null) {
    try {
      const formData = new FormData();
      
      // Add event data
      Object.keys(eventData).forEach(key => {
        formData.append(key, eventData[key]);
      });
      
      // Add poster image if provided
      if (posterImage) {
        formData.append('poster', {
          uri: posterImage.uri,
          type: posterImage.type || 'image/jpeg',
          name: posterImage.fileName || 'poster.jpg',
        });
      }

      const response = await api.post('/events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update event
  async updateEvent(eventId, eventData) {
    try {
      const response = await api.patch(`/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete event
  async deleteEvent(eventId) {
    try {
      await api.delete(`/events/${eventId}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Join event using invite link
  async joinEvent(inviteLink) {
    try {
      const response = await api.post(`/events/join/${inviteLink}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Album management
  async getAlbumImages(eventId) {
    try {
      const response = await api.get(`/events/${eventId}/album`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadAlbumImage(eventId, image, description = '') {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || 'image.jpg',
      });
      
      if (description) {
        formData.append('description', description);
      }

      const response = await api.post(`/events/${eventId}/album`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadMultipleAlbumImages(eventId, images) {
    try {
      const formData = new FormData();
      
      images.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || `image_${index}.jpg`,
        });
      });

      const response = await api.post(`/events/${eventId}/album/multiple`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteAlbumImage(eventId, imageId) {
    try {
      await api.delete(`/events/${eventId}/album/${imageId}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateAlbumImageDescription(eventId, imageId, description) {
    try {
      const response = await api.patch(`/events/${eventId}/album/${imageId}`, {
        description,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return new Error('An unexpected error occurred');
  }
}

export default new EventService();
```

### Location Service

Create `src/services/locationService.js`:

```javascript
import api from './api';

class LocationService {
  // Search locations
  async searchLocations(query) {
    try {
      const response = await api.get('/locations/search', {
        params: { query },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get location details by coordinates
  async getLocationDetails(lat, lon) {
    try {
      const response = await api.get('/locations/details', {
        params: { lat, lon },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get nearby places
  async getNearbyPlaces(lat, lon, radius = 5000) {
    try {
      const response = await api.get('/locations/nearby', {
        params: { lat, lon, radius },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return new Error('An unexpected error occurred');
  }
}

export default new LocationService();
```

### Weather Service

Create `src/services/weatherService.js`:

```javascript
import api from './api';

class WeatherService {
  // Get weather forecast for a location
  async getWeatherForecast(lat, lon) {
    try {
      const response = await api.get('/weather/forecast', {
        params: { lat, lon },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get weather forecast for a specific event
  async getEventWeather(eventId) {
    try {
      const response = await api.get(`/weather/event/${eventId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return new Error('An unexpected error occurred');
  }
}

export default new WeatherService();
```

## Error Handling

Create `src/utils/errorHandler.js`:

```javascript
export class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return new APIError(data.message || 'Bad request', status, 'BAD_REQUEST');
      case 401:
        return new APIError('Unauthorized access', status, 'UNAUTHORIZED');
      case 403:
        return new APIError('Access forbidden', status, 'FORBIDDEN');
      case 404:
        return new APIError('Resource not found', status, 'NOT_FOUND');
      case 409:
        return new APIError(data.message || 'Conflict', status, 'CONFLICT');
      case 422:
        return new APIError(data.message || 'Validation error', status, 'VALIDATION_ERROR');
      case 429:
        return new APIError('Too many requests', status, 'RATE_LIMIT');
      case 500:
        return new APIError('Internal server error', status, 'SERVER_ERROR');
      default:
        return new APIError(data.message || 'Unknown error', status, 'UNKNOWN');
    }
  } else if (error.request) {
    // Network error
    return new APIError('Network error - please check your connection', 0, 'NETWORK_ERROR');
  } else {
    // Other error
    return new APIError(error.message || 'An unexpected error occurred', 0, 'UNKNOWN');
  }
};
```

## File Upload

### Image Picker Utility

Create `src/utils/imagePicker.js`:

```javascript
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

export const pickImage = async (options = {}) => {
  const defaultOptions = {
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
    includeBase64: false,
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const result = await launchImageLibrary(finalOptions);
    
    if (result.didCancel) {
      return null;
    }
    
    if (result.errorCode) {
      throw new Error(result.errorMessage);
    }
    
    if (result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    throw new Error(`Failed to pick image: ${error.message}`);
  }
};

export const takePhoto = async (options = {}) => {
  const defaultOptions = {
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
    includeBase64: false,
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const result = await launchCamera(finalOptions);
    
    if (result.didCancel) {
      return null;
    }
    
    if (result.errorCode) {
      throw new Error(result.errorMessage);
    }
    
    if (result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    throw new Error(`Failed to take photo: ${error.message}`);
  }
};
```

## Complete Examples

### Event List Screen

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import EventService from '../services/eventService';

const EventListScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadEvents = async (pageNum = 1, refresh = false) => {
    try {
      const response = await EventService.getEvents({
        page: pageNum,
        limit: 10,
        sort: 'date',
        order: 'asc',
      });

      const { data, pagination } = response.data;
      
      if (refresh) {
        setEvents(data);
      } else {
        setEvents(prev => [...prev, ...data]);
      }
      
      setHasMore(pagination.hasNextPage);
      setPage(pageNum);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadEvents(page + 1);
    }
  };

  const renderEvent = ({ item }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { eventId: item._id })}
    >
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDate}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
      <Text style={styles.eventLocation}>{item.location}</Text>
      <Text style={styles.eventDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.eventMeta}>
        <Text style={styles.participants}>
          {item.participants?.length || 0} participants
        </Text>
        <Text style={styles.maxParticipants}>
          Max: {item.maxParticipants || 'Unlimited'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text>No events found</Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateEvent')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  eventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  participants: {
    fontSize: 12,
    color: '#007AFF',
  },
  maxParticipants: {
    fontSize: 12,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default EventListScreen;
```

### Create Event Screen

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import EventService from '../services/eventService';
import LocationService from '../services/locationService';
import { pickImage } from '../utils/imagePicker';

const CreateEventScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    maxParticipants: '',
  });
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [posterImage, setPosterImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleImagePick = async () => {
    try {
      const image = await pickImage();
      if (image) {
        setPosterImage(image);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        ...formData,
        date: date.toISOString(),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
      };

      await EventService.createEvent(eventData, posterImage);
      Alert.alert('Success', 'Event created successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create New Event</Text>

      <TextInput
        style={styles.input}
        placeholder="Event Title *"
        value={formData.title}
        onChangeText={(value) => handleInputChange('title', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Description *"
        value={formData.description}
        onChangeText={(value) => handleInputChange('description', value)}
        multiline
        numberOfLines={4}
      />

      <TextInput
        style={styles.input}
        placeholder="Location *"
        value={formData.location}
        onChangeText={(value) => handleInputChange('location', value)}
      />

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateButtonText}>
          Date: {date.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Max Participants (optional)"
        value={formData.maxParticipants}
        onChangeText={(value) => handleInputChange('maxParticipants', value)}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
        <Text style={styles.imageButtonText}>Select Poster Image</Text>
      </TouchableOpacity>

      {posterImage && (
        <Image source={{ uri: posterImage.uri }} style={styles.previewImage} />
      )}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Creating...' : 'Create Event'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          onChange={handleDateChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  imageButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  imageButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default CreateEventScreen;
```

### Profile Update Screen

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AuthService from '../services/authService';

const ProfileUpdateScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await AuthService.getProfile();
      const user = response.data.user;
      setUserProfile(user);
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      if (user.dateOfBirth) {
        setDateOfBirth(new Date(user.dateOfBirth));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        dateOfBirth: dateOfBirth.toISOString().split('T')[0],
      };

      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      await AuthService.updateProfile(updateData);
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Update Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name *"
        value={formData.name}
        onChangeText={(value) => handleInputChange('name', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Email *"
        value={formData.email}
        onChangeText={(value) => handleInputChange('email', value)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateButtonText}>
          Date of Birth: {dateOfBirth.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Change Password (Optional)</Text>

      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={formData.newPassword}
        onChangeText={(value) => handleInputChange('newPassword', value)}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        value={formData.confirmPassword}
        onChangeText={(value) => handleInputChange('confirmPassword', value)}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleUpdateProfile}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Updating...' : 'Update Profile'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth}
          mode="date"
          onChange={handleDateChange}
          maximumDate={new Date()} // Cannot select future dates
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ProfileUpdateScreen;
```

## Best Practices

### 1. Error Handling
- Always wrap API calls in try-catch blocks
- Provide user-friendly error messages
- Handle network errors gracefully
- Implement retry logic for failed requests

### 2. Loading States
- Show loading indicators during API calls
- Disable buttons during requests
- Provide feedback for long operations

### 3. Data Caching
- Cache frequently accessed data
- Implement offline support where possible
- Use AsyncStorage for persistent data

### 4. Security
- Never store sensitive data in plain text
- Validate all user inputs
- Use HTTPS in production
- Implement proper token management

### 5. Performance
- Implement pagination for large datasets
- Optimize image uploads
- Use lazy loading for images
- Minimize API calls

### 6. User Experience
- Provide clear feedback for all actions
- Implement pull-to-refresh
- Show empty states
- Handle edge cases gracefully

## Environment Configuration

Create `.env` file for your React Native app:

```env
API_BASE_URL=http://your-server-domain:5000/api
```

## Testing

### API Testing with Postman

1. Import the Swagger documentation from `/api-docs`
2. Set up environment variables
3. Test all endpoints with proper authentication
4. Verify error responses

### React Native Testing

```javascript
// Example test for EventService
import EventService from '../services/eventService';

describe('EventService', () => {
  it('should fetch events successfully', async () => {
    const mockResponse = {
      data: {
        status: 'success',
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalEvents: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    };

    // Mock axios
    jest.spyOn(api, 'get').mockResolvedValue(mockResponse);

    const result = await EventService.getEvents();
    expect(result.data).toEqual(mockResponse.data);
  });
});
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your server has CORS properly configured
2. **Authentication Issues**: Check token format and expiration
3. **Image Upload Failures**: Verify file size and format restrictions
4. **Network Timeouts**: Adjust timeout settings for slow connections

### Debug Tips

1. Use console.log to debug API responses
2. Check network tab in React Native debugger
3. Verify API base URL configuration
4. Test endpoints with Postman first

This guide provides a comprehensive foundation for integrating the Event Management API with your React Native application. Remember to adapt the code examples to your specific project structure and requirements.

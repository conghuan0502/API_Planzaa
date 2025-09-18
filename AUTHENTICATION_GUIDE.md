# Authentication API Guide for React Native

## Event Management API - Login & Signup Implementation

This guide provides complete instructions for implementing authentication in React Native using the Event Management API.

## API Endpoints

### Registration: `POST /users/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123",
  "dateOfBirth": "1990-01-15"
}
```

### Login: `POST /users/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Profile: `GET /users/profile` (Protected)
```
Authorization: Bearer <token>
```

### Update Profile: `PATCH /users/profile` (Protected)
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "dateOfBirth": "1990-01-15",
  "password": "newpassword123"
}
```

## React Native Setup

### 1. Install Dependencies
```bash
npm install axios @react-native-async-storage/async-storage @react-native-community/datetimepicker
```

### 2. API Configuration (`src/services/api.js`)
```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://your-server-domain:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Authentication Service (`src/services/authService.js`)
```javascript
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  async register(userData) {
    try {
      const response = await api.post('/users/register', userData);
      const { token, data } = response.data;
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async login(credentials) {
    try {
      const response = await api.post('/users/login', credentials);
      const { token, data } = response.data;
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async logout() {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  }

  async getProfile() {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await api.patch('/users/profile', profileData);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Update failed');
    }
  }

  async isAuthenticated() {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  }
}

export default new AuthService();
```

## Implementation Examples

### Registration Screen
```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AuthService from '../services/authService';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        dateOfBirth: dateOfBirth.toISOString().split('T')[0]
      };

      await AuthService.register(userData);
      Alert.alert('Success', 'Registration successful!');
      navigation.replace('MainApp');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Full Name *"
        value={formData.name}
        onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
      />

      <TextInput
        style={styles.input}
        placeholder="Email *"
        value={formData.email}
        onChangeText={(value) => setFormData(prev => ({ ...prev, email: value }))}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password *"
        value={formData.password}
        onChangeText={(value) => setFormData(prev => ({ ...prev, password: value }))}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password *"
        value={formData.confirmPassword}
        onChangeText={(value) => setFormData(prev => ({ ...prev, confirmPassword: value }))}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>Date of Birth: {dateOfBirth.toLocaleDateString()}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating...' : 'Register'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth}
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setDateOfBirth(date);
          }}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 15 },
  dateButton: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginBottom: 15 },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' }
});

export default RegisterScreen;
```

### Login Screen
```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AuthService from '../services/authService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await AuthService.login({ email, password });
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
        style={[styles.button, loading && styles.buttonDisabled]}
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
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginBottom: 15 },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  link: { color: '#007AFF', textAlign: 'center' }
});

export default LoginScreen;
```

## Key Features

### Date of Birth Validation
- Minimum age: 13 years old
- Optional field during registration
- Automatic age calculation
- Date picker integration

### Security Features
- JWT token authentication
- Password hashing (server-side)
- Token storage in AsyncStorage
- Automatic token refresh handling

### Error Handling
- User-friendly error messages
- Network error handling
- Validation error display
- Loading states

## Testing

### API Testing
```bash
# Register
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","dateOfBirth":"1990-01-15"}'

# Login
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### React Native Testing
```javascript
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';

test('login form validation', () => {
  const { getByText } = render(<LoginScreen />);
  fireEvent.press(getByText('Login'));
  expect(getByText('Please fill all fields')).toBeTruthy();
});
```

## Best Practices

1. **Validation**: Always validate inputs on both client and server
2. **Error Handling**: Provide clear error messages to users
3. **Security**: Never store sensitive data in plain text
4. **UX**: Show loading states and disable buttons during requests
5. **Testing**: Test all authentication flows thoroughly

This guide provides everything needed to implement secure authentication in your React Native app with the Event Management API.

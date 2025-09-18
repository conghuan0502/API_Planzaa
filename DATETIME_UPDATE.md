# Event Date/Time Structure Update

This document outlines the complete update to the event date/time structure, replacing the single date and time fields with more flexible start and end date/time fields.

## Overview

The event model has been updated to support:
- **Start Date and Time** (required) - When the event begins
- **End Date and Time** (optional) - When the event ends
- **Flexible scheduling** - Events can span multiple days or just a few hours
- **Automatic validation** - Ensures end time is after start time
- **Virtual fields** - Provides calculated duration and formatted date/time objects

## Changes Made

### 1. Updated Event Model (`models/eventModel.js`)

#### Old Structure:
```javascript
date: {
  type: Date,
  required: [true, 'Please provide event date']
},
time: {
  type: String,
  required: [true, 'Please provide event time']
}
```

#### New Structure:
```javascript
startDate: {
  type: Date,
  required: [true, 'Please provide event start date']
},
startTime: {
  type: String,
  required: [true, 'Please provide event start time']
},
endDate: {
  type: Date,
  default: null
},
endTime: {
  type: String,
  default: null
}
```

### 2. Added Validation

#### Time Format Validation:
- Time must be in HH:MM format (24-hour format)
- Examples: "09:00", "14:30", "23:45"
- Invalid formats: "9:00", "2:30 PM", "25:00"

#### Date/Time Logic Validation:
- End date/time must be after start date/time
- If only end time is provided, it uses the start date
- If only end date is provided, it uses the start time

### 3. Added Virtual Fields

#### `formattedStartDateTime`
- Returns a JavaScript Date object with start date and time combined
- Useful for calculations and comparisons

#### `formattedEndDateTime`
- Returns a JavaScript Date object with end date and time combined
- Returns null if no end date/time is set

#### `durationMinutes`
- Calculates the duration of the event in minutes
- Returns null if no end time is set

### 4. Updated Event Controller (`controllers/eventController.js`)

#### Enhanced Validation:
- Validates that start date and time are provided
- Validates time format using regex pattern
- Provides clear error messages for validation failures

### 5. Updated Documentation

#### Swagger Documentation (`swagger.js`):
- Updated Event schema to reflect new date/time structure
- Added descriptions for all new fields
- Marked optional fields appropriately

#### README.md:
- Updated event structure examples
- Added testing section
- Included validation rules and format requirements

#### LOCATIONIQ_INTEGRATION.md:
- Updated event structure examples
- Maintained consistency with new date/time format

### 6. Added Testing

#### Test Script (`test-datetime.js`):
- Tests event creation with start date/time only
- Tests event creation with start and end date/time
- Tests validation of time formats
- Tests validation that end time is after start time
- Includes cleanup of test data

## Usage Examples

### 1. Event with Start Date/Time Only
```json
{
  "title": "Quick Meeting",
  "description": "Brief team sync",
  "startDate": "2024-01-15T00:00:00.000Z",
  "startTime": "10:00",
  "location": {
    "name": "Conference Room",
    "address": "123 Main St",
    "coordinates": {
      "lat": 40.7128,
      "lon": -74.0060
    }
  }
}
```

### 2. Event with Start and End Date/Time
```json
{
  "title": "Team Workshop",
  "description": "Full day workshop",
  "startDate": "2024-01-15T00:00:00.000Z",
  "startTime": "09:00",
  "endDate": "2024-01-15T00:00:00.000Z",
  "endTime": "17:00",
  "location": {
    "name": "Training Center",
    "address": "456 Business Ave",
    "coordinates": {
      "lat": 40.7589,
      "lon": -73.9851
    }
  }
}
```

### 3. Multi-Day Event
```json
{
  "title": "Conference",
  "description": "Annual tech conference",
  "startDate": "2024-01-15T00:00:00.000Z",
  "startTime": "09:00",
  "endDate": "2024-01-17T00:00:00.000Z",
  "endTime": "18:00",
  "location": {
    "name": "Convention Center",
    "address": "789 Event Blvd",
    "coordinates": {
      "lat": 40.7505,
      "lon": -73.9934
    }
  }
}
```

## Validation Rules

### Required Fields:
- `startDate` - Must be a valid date
- `startTime` - Must be in HH:MM format

### Optional Fields:
- `endDate` - If provided, must be a valid date
- `endTime` - If provided, must be in HH:MM format

### Validation Logic:
1. **Time Format**: Must match pattern `/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/`
2. **Date/Time Logic**: End date/time must be after start date/time
3. **Flexible End Time**: If only end time is provided, uses start date
4. **Flexible End Date**: If only end date is provided, uses start time

## Virtual Fields Usage

### In Controllers:
```javascript
// Get event duration
const duration = event.durationMinutes; // Returns minutes or null

// Get formatted start date/time
const startDateTime = event.formattedStartDateTime; // Returns Date object

// Get formatted end date/time
const endDateTime = event.formattedEndDateTime; // Returns Date object or null
```

### In Queries:
```javascript
// Find events longer than 2 hours
const longEvents = await Event.find({
  $expr: {
    $gt: ['$durationMinutes', 120]
  }
});

// Find events starting today
const todayEvents = await Event.find({
  startDate: {
    $gte: new Date().setHours(0, 0, 0, 0),
    $lt: new Date().setHours(23, 59, 59, 999)
  }
});
```

## Migration Considerations

### For Existing Data:
- Existing events with `date` and `time` fields will need to be migrated
- Consider creating a migration script to:
  - Copy `date` to `startDate`
  - Copy `time` to `startTime`
  - Set `endDate` and `endTime` to null

### Migration Script Example:
```javascript
// Migration script for existing events
const migrateEvents = async () => {
  const events = await Event.find({ date: { $exists: true } });
  
  for (const event of events) {
    event.startDate = event.date;
    event.startTime = event.time;
    event.endDate = null;
    event.endTime = null;
    
    // Remove old fields
    event.date = undefined;
    event.time = undefined;
    
    await event.save();
  }
};
```

## Testing

### Run Tests:
```bash
# Test date/time functionality
npm run test:datetime

# Test LocationIQ integration
npm run test:locationiq
```

### Test Coverage:
- ✅ Event creation with start date/time only
- ✅ Event creation with start and end date/time
- ✅ Event creation with start date/time and end time only
- ✅ Validation of time format
- ✅ Validation that end time is after start time
- ✅ Virtual field calculations
- ✅ Error handling for invalid data

## Benefits

1. **Flexibility**: Support for multi-day events and precise time scheduling
2. **Validation**: Automatic validation of date/time logic
3. **Calculations**: Built-in duration calculation
4. **Backward Compatibility**: Optional end date/time maintains simplicity
5. **User Experience**: Better event scheduling for React Native app users

## Future Enhancements

Potential improvements for the date/time functionality:
1. **Recurring Events**: Support for weekly, monthly, or custom recurring patterns
2. **Time Zones**: Support for different time zones
3. **Calendar Integration**: Export events to calendar formats
4. **Conflict Detection**: Check for scheduling conflicts
5. **Reminder System**: Built-in reminder functionality

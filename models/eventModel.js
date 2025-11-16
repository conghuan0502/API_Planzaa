const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide event title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide event description'],
    trim: true
  },
  location: {
    name: {
      type: String,
      required: [true, 'Please provide event location name']
    },
    address: {
      type: String,
      required: [true, 'Please provide event location address']
    },
    coordinates: {
      lat: {
        type: Number,
        required: [true, 'Please provide latitude']
      },
      lon: {
        type: Number,
        required: [true, 'Please provide longitude']
      }
    },
    place_id: {
      type: String,
      default: null
    },
    display_name: {
      type: String,
      default: null
    }
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide event start date']
  },
  startTime: {
    type: String,
    required: [true, 'Please provide event start time'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:MM format (e.g., 14:30)'
    }
  },
  endDate: {
    type: Date,
    default: null
  },
  endTime: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow null/undefined
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:MM format (e.g., 16:30)'
    }
  },
  dressCode: {
    type: String,
    trim: true,
    default: null
  },
  // Optional Spotify playlist information for the event
  spotifyPlaylist: {
    id: {
      type: String,
      trim: true,
      default: null
    },
    name: {
      type: String,
      trim: true,
      default: null
    },
    description: {
      type: String,
      trim: true,
      default: null
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null
    },
    trackCount: {
      type: Number,
      default: null
    },
    owner: {
      type: String,
      trim: true,
      default: null
    },
    url: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^(https?:\/\/)?(open\.spotify\.com\/playlist\/|spotify:playlist:)/.test(v);
        },
        message: 'Must be a valid Spotify playlist URL or URI'
      }
    },
    playlistId: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^[A-Za-z0-9]{22}$/.test(v);
        },
        message: 'Invalid Spotify playlist ID'
      }
    },
    embedUrl: {
      type: String,
      trim: true,
      default: null
    }
  },
  weather: {
    forecast: {
      type: Array,
      default: []
    },
    lastUpdated: {
      type: Date,
      default: null
    },
    location: {
      lat: {
        type: Number,
        default: null
      },
      lon: {
        type: Number,
        default: null
      }
    }
  },
  reminders: {
    sent24h: {
      type: Boolean,
      default: false
    },
    sent2h: {
      type: Boolean,
      default: false
    },
    sent30m: {
      type: Boolean,
      default: false
    },
    lastChecked: {
      type: Date,
      default: null
    }
  },
  poster: {
    fileName: {
      type: String,
      required: [true, 'Event poster is required']
    },
    originalName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    cloudinaryId: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  imageAlbum: [{
    imageId: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    cloudinaryId: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      trim: true,
      default: null
    }
  }],

  creator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Event must belong to a user']
  },
  participants: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['yes', 'no', 'maybe'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  inviteLink: {
    type: String,
    unique: true
  },
  // Visibility controls
  isPublic: {
    type: Boolean,
    default: true
  },
  // RSVP requirement is independent from visibility
  rsvpRequired: {
    type: Boolean,
    default: false
  },
  maxParticipants: {
    type: Number,
    default: null
  },
  todoList: [{
    description: {
      type: String,
      required: [true, 'Todo item description is required'],
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    dueDate: {
      type: Date,
      default: null
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    notes: {
      type: String,
      trim: true,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    }
  }],
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for confirmed participants count
eventSchema.virtual('confirmedParticipantsCount').get(function() {
  return this.participants.filter(participant => participant.status === 'yes').length;
});

// Virtual field for formatted start date and time
eventSchema.virtual('formattedStartDateTime').get(function() {
  if (!this.startDate || !this.startTime) return null;
  const date = new Date(this.startDate);
  const [hours, minutes] = this.startTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Virtual field for formatted end date and time
eventSchema.virtual('formattedEndDateTime').get(function() {
  if (!this.endDate && !this.endTime) return null;
  
  const date = new Date(this.endDate || this.startDate);
  if (this.endTime) {
    const [hours, minutes] = this.endTime.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  return date;
});

// Virtual field for event duration in minutes
eventSchema.virtual('durationMinutes').get(function() {
  const start = this.formattedStartDateTime;
  const end = this.formattedEndDateTime;
  
  if (!start || !end) return null;
  
  const diffMs = end - start;
  return Math.round(diffMs / (1000 * 60));
});

// Virtual field for Spotify embed URL
eventSchema.virtual('spotifyEmbedUrl').get(function() {
  const id = this.spotifyPlaylist && this.spotifyPlaylist.playlistId;
  if (!id) return null;
  return `https://open.spotify.com/embed/playlist/${id}`;
});

// Virtual fields for todo list statistics
eventSchema.virtual('todoStats').get(function() {
  const total = this.todoList.length;
  const completed = this.todoList.filter(todo => todo.completed).length;
  const pending = total - completed;
  const highPriority = this.todoList.filter(todo => !todo.completed && todo.priority === 'high').length;
  
  return {
    total,
    completed,
    pending,
    highPriority,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  };
});

// Virtual field for overdue todos
eventSchema.virtual('overdueTodos').get(function() {
  const now = new Date();
  return this.todoList.filter(todo => 
    !todo.completed && 
    todo.dueDate && 
    new Date(todo.dueDate) < now
  );
});

// Method to add a new todo item
eventSchema.methods.addTodo = function(todoData) {
  this.todoList.push({
    ...todoData,
    createdAt: new Date()
  });
  return this.save();
};

// Method to mark a todo as completed
eventSchema.methods.completeTodo = function(todoId) {
  const todo = this.todoList.id(todoId);
  if (todo) {
    todo.completed = true;
    todo.completedAt = new Date();
    return this.save();
  }
  throw new Error('Todo item not found');
};

// Method to update a todo item
eventSchema.methods.updateTodo = function(todoId, updates) {
  const todo = this.todoList.id(todoId);
  if (todo) {
    Object.assign(todo, updates);
    if (updates.completed && !todo.completedAt) {
      todo.completedAt = new Date();
    } else if (!updates.completed) {
      todo.completedAt = null;
    }
    return this.save();
  }
  throw new Error('Todo item not found');
};

// Method to delete a todo item
eventSchema.methods.deleteTodo = function(todoId) {
  const todo = this.todoList.id(todoId);
  if (todo) {
    this.todoList.pull(todoId);
    return this.save();
  }
  throw new Error('Todo item not found');
};

// Validate end date/time is after start date/time
eventSchema.pre('save', function(next) {
  // Derive Spotify playlist ID from URL/URI if provided
  if (this.spotifyPlaylist && this.spotifyPlaylist.url) {
    const raw = this.spotifyPlaylist.url;
    let match = null;
    if (/open\.spotify\.com\/playlist\//.test(raw)) {
      match = raw.match(/playlist\/([A-Za-z0-9]{22})/);
    } else if (/^spotify:playlist:/.test(raw)) {
      match = raw.match(/^spotify:playlist:([A-Za-z0-9]{22})/);
    }
    if (match && match[1]) {
      this.spotifyPlaylist.playlistId = match[1];
    }
  }

  // Create invite link if not exists
  if (!this.inviteLink) {
    this.inviteLink = `${this._id}-${Date.now()}`;
  }

  // Validate end date/time if provided
  if (this.endDate || this.endTime) {
    const startDateTime = new Date(this.startDate);
    const startTimeParts = this.startTime.split(':');
    startDateTime.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]), 0);

    let endDateTime;
    if (this.endDate) {
      endDateTime = new Date(this.endDate);
    } else {
      endDateTime = new Date(this.startDate);
    }

    if (this.endTime) {
      const endTimeParts = this.endTime.split(':');
      endDateTime.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0);
    }

    if (endDateTime <= startDateTime) {
      return next(new Error('End date/time must be after start date/time'));
    }
  }

  next();
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event; 
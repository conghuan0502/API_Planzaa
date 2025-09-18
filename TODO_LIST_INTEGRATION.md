# Todo List Integration Guide

This guide explains how to use the new todo list functionality added to the event model.

## Overview

The todo list system allows event creators and participants to manage tasks and responsibilities for events. Each event can have multiple todo items with various properties like priority, due dates, assignments, and completion status.

## Features

- **Optional Todo Lists**: Todo lists are completely optional when creating events
- **Rich Todo Items**: Each todo includes description, priority, due date, assignments, and notes
- **Collaborative Management**: Event creators and participants can add/edit todos
- **Smart Statistics**: Automatic calculation of completion rates and overdue items
- **Priority Management**: Three priority levels (low, medium, high)
- **User Assignment**: Assign todos to specific participants
- **Completion Tracking**: Track when todos are completed with timestamps

## API Endpoints

### Get Todo List

**GET** `/api/events/{eventId}/todos`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "todos": [
      {
        "_id": "todo_id",
        "description": "Buy decorations",
        "completed": false,
        "assignedTo": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdBy": {
          "_id": "user_id",
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "dueDate": "2024-01-30T00:00:00.000Z",
        "priority": "high",
        "notes": "Get balloons and streamers",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "completedAt": null
      }
    ],
    "stats": {
      "total": 5,
      "completed": 2,
      "pending": 3,
      "highPriority": 1,
      "completionRate": 40
    },
    "overdue": [
      {
        "_id": "overdue_todo_id",
        "description": "Send invitations",
        "dueDate": "2024-01-20T00:00:00.000Z"
      }
    ]
  }
}
```

### Add Todo Item

**POST** `/api/events/{eventId}/todos`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "description": "Buy decorations",
  "assignedTo": "user_id_optional",
  "dueDate": "2024-01-30",
  "priority": "high",
  "notes": "Get balloons and streamers"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "todo": {
      "_id": "new_todo_id",
      "description": "Buy decorations",
      "completed": false,
      "assignedTo": null,
      "createdBy": {
        "_id": "user_id",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "dueDate": "2024-01-30T00:00:00.000Z",
      "priority": "high",
      "notes": "Get balloons and streamers",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "completedAt": null
    }
  }
}
```

### Update Todo Item

**PATCH** `/api/events/{eventId}/todos/{todoId}`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "completed": true,
  "priority": "medium",
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "todo": {
      "_id": "todo_id",
      "description": "Buy decorations",
      "completed": true,
      "priority": "medium",
      "notes": "Updated notes",
      "completedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Delete Todo Item

**DELETE** `/api/events/{eventId}/todos/{todoId}`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "status": "success",
  "message": "Todo item deleted successfully"
}
```

## Event Model Changes

The event model now includes a `todoList` field:

```javascript
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
}]
```

## Virtual Fields

### Todo Statistics
```javascript
event.todoStats
// Returns: { total, completed, pending, highPriority, completionRate }
```

### Overdue Todos
```javascript
event.overdueTodos
// Returns: Array of todos with due dates in the past
```

## Instance Methods

### Add Todo
```javascript
await event.addTodo({
  description: 'New task',
  priority: 'high',
  dueDate: new Date('2024-01-30'),
  createdBy: userId
});
```

### Complete Todo
```javascript
await event.completeTodo(todoId);
```

### Update Todo
```javascript
await event.updateTodo(todoId, {
  completed: true,
  priority: 'medium'
});
```

### Delete Todo
```javascript
await event.deleteTodo(todoId);
```

## Authorization Rules

### Adding Todos
- Event creator ✅
- Event participants ✅
- Others ❌

### Updating Todos
- Event creator ✅
- Event participants ✅
- Assigned user ✅
- Others ❌

### Deleting Todos
- Event creator ✅
- Todo creator ✅
- Others ❌

### Viewing Todos
- Event creator ✅
- Event participants ✅
- Others ❌

## Frontend Integration

### React Component Example

```jsx
import { useState, useEffect } from 'react';

const TodoList = ({ eventId, token }) => {
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, [eventId]);

  const fetchTodos = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/todos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setTodos(data.data.todos);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (todoData) => {
    try {
      const response = await fetch(`/api/events/${eventId}/todos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(todoData)
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setTodos([...todos, data.data.todo]);
        fetchTodos(); // Refresh stats
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodo = async (todoId, completed) => {
    try {
      const response = await fetch(`/api/events/${eventId}/todos/${todoId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed })
      });
      
      if (response.ok) {
        fetchTodos(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  if (loading) return <div>Loading todos...</div>;

  return (
    <div className="todo-list">
      <div className="todo-stats">
        <h3>Progress: {stats.completionRate}%</h3>
        <p>{stats.completed} of {stats.total} completed</p>
        <p>{stats.highPriority} high priority pending</p>
      </div>
      
      <div className="todos">
        {todos.map(todo => (
          <div key={todo._id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={(e) => toggleTodo(todo._id, e.target.checked)}
            />
            <span className={`priority priority-${todo.priority}`}>
              {todo.priority}
            </span>
            <span className="description">{todo.description}</span>
            {todo.dueDate && (
              <span className={`due-date ${new Date(todo.dueDate) < new Date() ? 'overdue' : ''}`}>
                {new Date(todo.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### HTML Form Example

```html
<form id="addTodoForm">
  <input type="text" name="description" placeholder="Todo description" required>
  <select name="priority">
    <option value="low">Low</option>
    <option value="medium" selected>Medium</option>
    <option value="high">High</option>
  </select>
  <input type="date" name="dueDate">
  <textarea name="notes" placeholder="Additional notes"></textarea>
  <button type="submit">Add Todo</button>
</form>

<script>
document.getElementById('addTodoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const todoData = {
    description: formData.get('description'),
    priority: formData.get('priority'),
    dueDate: formData.get('dueDate') || null,
    notes: formData.get('notes') || null
  };

  try {
    const response = await fetch(`/api/events/${eventId}/todos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(todoData)
    });
    
    if (response.ok) {
      // Refresh todo list
      location.reload();
    }
  } catch (error) {
    console.error('Error adding todo:', error);
  }
});
</script>
```

## Testing

Run the todo functionality test:

```bash
node test-todo.js
```

## Error Handling

Common error responses:

**400 - Invalid Input:**
```json
{
  "status": "fail",
  "message": "Todo description is required"
}
```

**403 - Not Authorized:**
```json
{
  "status": "fail",
  "message": "You are not authorized to add todos to this event"
}
```

**404 - Not Found:**
```json
{
  "status": "fail",
  "message": "Event not found"
}
```

## Performance Considerations

- **Lazy Loading**: Consider loading todos only when needed
- **Pagination**: For events with many todos, implement pagination
- **Real-time Updates**: Use WebSockets for collaborative todo management
- **Caching**: Cache todo statistics for frequently accessed events

## Security Features

- **Authentication Required**: All todo operations require valid JWT token
- **Authorization Checks**: Users can only modify todos they're authorized for
- **Input Validation**: All todo data is validated before processing
- **User Reference Validation**: Assigned users must be valid participants

## Future Enhancements

Potential improvements for the todo system:

- **Todo Categories**: Group todos by type (decorations, food, logistics)
- **Recurring Todos**: Support for repeating tasks
- **Todo Dependencies**: Chain todos that depend on each other
- **File Attachments**: Allow files to be attached to todos
- **Todo Comments**: Add discussion threads to todos
- **Bulk Operations**: Support for multiple todo updates
- **Todo Templates**: Pre-defined todo lists for common event types
- **Integration**: Connect with external task management tools

## Migration Notes

For existing events:
- Todo lists are optional and won't affect existing events
- No database migration required
- New events can include todo lists from creation
- Existing events can have todos added at any time

## Troubleshooting

### Common Issues

1. **"Todo description is required"**
   - Ensure the description field is included in the request
   - Check that the field name is exactly `description`

2. **"Not authorized to add todos"**
   - Verify the user is the event creator or participant
   - Check that the JWT token is valid

3. **"Event not found"**
   - Verify the event ID in the URL
   - Ensure the event exists and is accessible

4. **Todo not updating**
   - Check that the todo ID is correct
   - Verify the user has permission to update the todo

### Debug Mode

Enable detailed logging:
```bash
DEBUG=app:todo
```

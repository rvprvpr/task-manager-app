# Task Manager App

A simple full-stack task manager application with React frontend, Node.js/Express backend, and SQLite database.

## Project Structure

```
task-manager/
├── frontend/          # React application (TypeScript + Tailwind CSS)
├── backend/           # Node.js/Express API
├── database/          # SQLite database files and schema
├── tests/            # Automated tests
└── README.md         # This file
```

## Phase 1 Features

- **Database**: SQLite with simplified schema (id, title, description, priority, created_at)
- **Backend**: Express API with validation and error handling
- **API Endpoints**: 
  - `POST /api/tasks` - Create new task
  - `GET /api/tasks` - Get all tasks
  - `GET /api/tasks/:id` - Get task by ID
  - `GET /health` - Health check
- **Tests**: Comprehensive test suite for database and API

## Prerequisites (macOS)

1. **Node.js** (version 16 or higher)
   ```bash
   # Install using Homebrew
   brew install node
   
   # Or download from https://nodejs.org/
   ```

2. **Git** (optional, for version control)
   ```bash
   brew install git
   ```

## Installation & Setup

### 1. Install Backend Dependencies

```bash
cd task-manager/backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Running the Application

### Backend Server

```bash
cd task-manager/backend
npm run dev
```

The backend server will start on `http://localhost:3001`

**Available endpoints:**
- Health check: `GET http://localhost:3001/health`
- Create task: `POST http://localhost:3001/api/tasks`
- Get all tasks: `GET http://localhost:3001/api/tasks`
- Get task by ID: `GET http://localhost:3001/api/tasks/:id`
- Update task: `PUT http://localhost:3001/api/tasks/:id` (title, description, priority)
- Delete task: `DELETE http://localhost:3001/api/tasks/:id`
### Frontend Development Server

```bash
cd task-manager/frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

## Testing

### Run All Tests

```bash
cd task-manager/backend
npm test
```

### Run Specific Test Files

```bash
# Database tests only
npm test tests/database.test.js

# API tests only
npm test tests/api.test.js
```

### Test Coverage

The test suite covers:
- ✅ Database schema validation (correct columns and constraints)
- ✅ Valid task insertion with all fields
- ✅ Valid task insertion with minimal fields
- ✅ Invalid task rejection (missing title, invalid priority)
- ✅ API endpoint validation and error handling
- ✅ Task retrieval operations

## API Usage Examples

### Create a Task

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project",
    "description": "Finish the task manager app",
    "priority": "high"
  }'
```

### Get All Tasks

```bash
curl http://localhost:3001/api/tasks
```

### Get Task by ID

```bash
curl http://localhost:3001/api/tasks/1
### Update Task

```bash
curl -X PUT http://localhost:3001/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title",
    "priority": "high"
  }'
```

### Delete Task

```bash
curl -X DELETE http://localhost:3001/api/tasks/1
```

### Frontend UI Notes

- Task list includes filter by priority and sort controls (by date or priority).
- Tasks can be edited via an inline modal with validation and deleted with a confirmation prompt.
- Pagination is deferred to a future phase to keep implementation minimal and ACU-efficient.

```

## Database Schema

```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL CHECK(length(title) > 0 AND length(title) <= 255),
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Validation Rules

- **Title**: Required, 1-255 characters
- **Description**: Optional, up to 1000 characters
- **Priority**: Optional, must be 'low', 'medium', or 'high' (default: 'medium')

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process using port 3001
   lsof -ti:3001 | xargs kill -9
   ```

2. **Database permission errors**
   ```bash
   # Ensure database directory is writable
   chmod 755 task-manager/database
   ```

3. **Node modules issues**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

## Development Notes

- Database file is created automatically at `database/tasks.db`
- Server auto-restarts on file changes (using nodemon)
- Tests use isolated test databases that are cleaned up automatically
- All API responses follow consistent JSON format with `success`, `data`, and `message` fields

## Next Steps (Phase 2)

- Frontend UI components for task creation
- Form validation and user feedback
- Integration between frontend and backend
- Enhanced error handling and user experience

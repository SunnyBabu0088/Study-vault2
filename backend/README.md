# StudyVault Backend

## Overview
Production-ready Node.js + Express REST API for the StudyVault frontend with PostgreSQL database, Socket.IO real-time messaging, and comprehensive authentication.

## Features
- **Database**: PostgreSQL with UUID primary keys, proper indexes, and cascading deletes
- **Authentication**: JWT-based auth with HTTP-only cookies, bcrypt password hashing
- **Authorization**: Protected routes with `requireAuth` middleware
- **Validation**: Comprehensive input validation for all endpoints
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **CORS**: Configured for specific frontend origin with credentials
- **Rate Limiting**: Auth endpoint rate limiting to prevent brute force attacks
- **Security**: Helmet.js for security headers, password hashing, no sensitive data exposure
- **Real-time**: Socket.IO integration for live chat messaging
- **File Uploads**: Base64 file upload handling with local storage
- **Streak System**: Daily streak tracking for user engagement

## Setup

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
```env
DATABASE_URL=postgres://username:password@localhost:5432/studyvault
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
COOKIE_SECURE=false
UPLOAD_DIR=uploads
UPLOAD_MAX_SIZE_MB=10
```

3. Install dependencies:
```bash
npm install
```

4. Create PostgreSQL database:
```bash
createdb studyvault
```

5. Start the server:
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The database schema will be automatically initialized on first run.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Study Tasks
- `GET /api/tasks` - List user's tasks (paginated)
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/complete` - Toggle task completion

### Quick Notes
- `GET /api/notes` - List user's notes (paginated)
- `GET /api/notes/:id` - Get specific note
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Startup Wall Posts
- `GET /api/posts` - List posts (user's own + public)
- `GET /api/posts/:id` - Get specific post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Interactions
- `POST /api/interactions/posts/:id/like` - Like a post
- `DELETE /api/interactions/posts/:id/like` - Unlike a post
- `POST /api/interactions/posts/:id/save` - Save a post
- `DELETE /api/interactions/posts/:id/save` - Unsave a post
- `POST /api/interactions/posts/:id/suggestions` - Add suggestion to post
- `GET /api/interactions/posts/:id/suggestions` - Get suggestions for post

### Conversations
- `GET /api/conversations` - List user's conversations
- `GET /api/conversations/:id` - Get specific conversation
- `POST /api/conversations` - Create new conversation

### Messages
- `GET /api/conversations/:id/messages` - Get messages for conversation
- `POST /api/conversations/:id/messages` - Send message
- `PATCH /api/messages/:id/read` - Mark message as read

### Uploads
- `POST /api/uploads` - Upload file (base64)
- `GET /api/uploads/:id` - Get upload details
- `DELETE /api/uploads/:id` - Delete upload

### Health
- `GET /api/health` - API health check

## Socket.IO Events

### Client → Server
- `join_conversation` - Join a conversation room
- `send_message` - Send a message
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `message_read` - Mark message as read

### Server → Client
- `new_message` - New message received
- `typing_start` - Someone is typing
- `typing_stop` - Typing stopped
- `message_read` - Message read acknowledgement

## Database Schema

### Tables
- `users` - User accounts with streak tracking
- `user_sessions` - Session management (future use)
- `notes` - Quick notes with themes
- `study_tasks` - Study tasks with priorities
- `conversations` - Chat conversations
- `conversation_members` - Many-to-many conversation participants
- `messages` - Chat messages with read receipts
- `startup_posts` - Startup wall posts
- `post_likes` - Post likes (unique per user/post)
- `post_saves` - Post saves (unique per user/post)
- `post_suggestions` - Post suggestions
- `uploads` - File upload metadata

## Architecture

### Layers
- **Routes** (`src/routes/`) - API route definitions
- **Controllers** (`src/controllers/`) - Request handlers
- **Services** (`src/services/`) - Business logic
- **Middleware** (`src/middleware/`) - Auth, validation, error handling
- **Utils** (`src/utils/`) - JWT, validators, response helpers
- **Config** (`src/config/`) - Database, environment, schema

### Key Features
- All responses follow consistent JSON format: `{ success: boolean, data/error: any }`
- All errors include proper HTTP status codes
- Passwords are hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- All user inputs are validated and sanitized
- SQL injection prevented with parameterized queries
- No sensitive data (passwords, tokens) exposed in responses

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start with nodemon (auto-reload)
- `npm run migrate` - Run database migrations (if using db-migrate)

### Environment Variables
See `.env.example` for all available configuration options.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
3. Set `COOKIE_SECURE=true` for HTTPS
4. Configure production `DATABASE_URL`
5. Set `FRONTEND_URL` to your production frontend URL
6. Use a process manager like PM2:
```bash
pm2 start src/server.js --name studyvault-api
```

## Security Considerations
- Never commit `.env` file
- Use strong JWT secrets in production
- Enable HTTPS in production
- Regularly update dependencies
- Monitor rate limits and adjust as needed
- Implement refresh token rotation for enhanced security
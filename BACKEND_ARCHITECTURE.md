# StudyVault Backend Architecture Plan

## Overview

This plan keeps the existing HTML/CSS/JavaScript frontend visually unchanged while defining a production-ready backend architecture for StudyVault on top of the current Node.js + Express + PostgreSQL + Socket.IO stack.

The current project already uses PostgreSQL through the existing backend folder, migrations, and pg client. That is the correct database choice for this system and should remain the primary data store.

## 1. Architectural goals

- Preserve the current UI exactly as-is.
- Keep the backend modular and production-ready.
- Use PostgreSQL as the source of truth for persistent data.
- Use Socket.IO for chat, typing indicators, and message events.
- Use a layered structure aligned with the current project: routes → controllers → services → repositories/models → database.
- Keep auth session-based and cookie-friendly for the existing frontend behavior.

## 2. Recommended technology stack

- Runtime: Node.js
- Web framework: Express
- Database: PostgreSQL
- Realtime: Socket.IO
- Auth: JWT access tokens in HttpOnly cookies + refresh-token support
- File storage: S3-compatible object storage (Cloudflare R2 / AWS S3) for production; local filesystem only for development
- Validation: schema-based validation with zod (recommended) or the current validator utilities if keeping the implementation minimal
- Logging: structured request and error logging
- Process management: PM2 or container-based deployment in production

## 3. Proposed project architecture

```text
backend/
  src/
    app.js
    server.js
    config/
      database.js
      env.js
      storage.js
    routes/
      authRoutes.js
      profileRoutes.js
      taskRoutes.js
      noteRoutes.js
      postRoutes.js
      interactionRoutes.js
      conversationRoutes.js
      messageRoutes.js
      uploadRoutes.js
      healthRoutes.js
    controllers/
      authController.js
      profileController.js
      taskController.js
      noteController.js
      postController.js
      interactionController.js
      conversationController.js
      messageController.js
      uploadController.js
      healthController.js
    services/
      authService.js
      userService.js
      taskService.js
      noteService.js
      postService.js
      interactionService.js
      conversationService.js
      messageService.js
      streakService.js
      uploadService.js
    middleware/
      authMiddleware.js
      errorHandler.js
      notFound.js
      validate.js
      rateLimiter.js
      uploadMiddleware.js
    utils/
      jwt.js
      validators.js
      response.js
      logger.js
      crypto.js
    socket/
      index.js
      handlers.js
      events.js
```

## 4. Database schema / models

The current migrations already cover users, notes, study tasks, conversations, conversation_members, and messages. The architecture below extends that foundation.

### Core tables

#### users
- id UUID PK
- username VARCHAR(30) NOT NULL
- email VARCHAR(255) UNIQUE NOT NULL
- password_hash TEXT NOT NULL
- phone VARCHAR(40)
- roll_number VARCHAR(50)
- avatar_url TEXT
- streak_count INT NOT NULL DEFAULT 0
- last_chat_date DATE NULL
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()

#### user_sessions
- id UUID PK
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- refresh_token_hash TEXT NOT NULL
- user_agent TEXT
- ip_address INET
- expires_at TIMESTAMPTZ NOT NULL
- created_at TIMESTAMPTZ DEFAULT NOW()
- revoked_at TIMESTAMPTZ NULL

#### study_tasks
- id UUID PK
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- subject TEXT NOT NULL
- title TEXT NOT NULL
- content TEXT NOT NULL
- priority VARCHAR(10) NOT NULL
- due_date DATE NULL
- completed BOOLEAN NOT NULL DEFAULT FALSE
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()

#### notes
- id UUID PK
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- title TEXT NOT NULL
- content TEXT NOT NULL
- theme TEXT NOT NULL
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()

#### startup_posts
- id UUID PK
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- title TEXT NOT NULL
- content TEXT NOT NULL
- hashtags TEXT NULL
- visibility VARCHAR(20) NOT NULL DEFAULT 'public'
- scheduled_date TIMESTAMPTZ NULL
- media_url TEXT NULL
- media_type VARCHAR(20) NULL
- category VARCHAR(30) NOT NULL DEFAULT 'startup'
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()

#### post_likes
- id UUID PK
- post_id UUID NOT NULL REFERENCES startup_posts(id) ON DELETE CASCADE
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- created_at TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(post_id, user_id)

#### post_saves
- id UUID PK
- post_id UUID NOT NULL REFERENCES startup_posts(id) ON DELETE CASCADE
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- created_at TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(post_id, user_id)

#### post_suggestions
- id UUID PK
- post_id UUID NOT NULL REFERENCES startup_posts(id) ON DELETE CASCADE
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- content TEXT NOT NULL
- created_at TIMESTAMPTZ DEFAULT NOW()

#### conversations
- id UUID PK
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()

#### conversation_members
- conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- joined_at TIMESTAMPTZ DEFAULT NOW()
- PRIMARY KEY(conversation_id, user_id)

#### messages
- id UUID PK
- conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE
- sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- content TEXT NOT NULL
- created_at TIMESTAMPTZ DEFAULT NOW()
- read_at TIMESTAMPTZ NULL

#### uploads
- id UUID PK
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- original_name TEXT NOT NULL
- stored_name TEXT NOT NULL
- mime_type TEXT NOT NULL
- size_bytes BIGINT NOT NULL
- bucket TEXT NOT NULL
- object_key TEXT NOT NULL
- created_at TIMESTAMPTZ DEFAULT NOW()

## 5. API route structure

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- GET /api/auth/me

### Profile
- GET /api/profile
- PUT /api/profile

### Study tasks
- GET /api/tasks
- GET /api/tasks/:id
- POST /api/tasks
- PUT /api/tasks/:id
- PATCH /api/tasks/:id/complete
- DELETE /api/tasks/:id

### Quick notes
- GET /api/notes
- GET /api/notes/:id
- POST /api/notes
- PUT /api/notes/:id
- DELETE /api/notes/:id

### Startup Wall posts
- GET /api/posts
- GET /api/posts/:id
- POST /api/posts
- PUT /api/posts/:id
- DELETE /api/posts/:id

### Post interactions
- POST /api/posts/:id/like
- DELETE /api/posts/:id/like
- POST /api/posts/:id/save
- DELETE /api/posts/:id/save
- POST /api/posts/:id/suggestions
- GET /api/posts/:id/suggestions

### Conversations and messages
- GET /api/conversations
- POST /api/conversations
- GET /api/conversations/:id
- GET /api/conversations/:id/messages
- POST /api/conversations/:id/messages
- PATCH /api/messages/:id/read

### Media uploads
- POST /api/uploads
- GET /api/uploads/:id
- DELETE /api/uploads/:id

### Health
- GET /api/health

## 6. Controller structure

Each controller should be thin and focused only on request/response handling.

### Responsibilities by controller
- authController: register, login, logout, refresh, me
- profileController: get/update profile
- taskController: list/create/update/delete/complete tasks
- noteController: list/create/update/delete notes
- postController: list/create/update/delete posts
- interactionController: like, unlike, save, unsave, add suggestion, list suggestions
- conversationController: list/create/get conversation
- messageController: list/create/read receipt
- uploadController: upload file, create metadata record, delete file metadata
- healthController: readiness and health checks

### Controller contract
- Validate request payloads at the boundary.
- Call one service method.
- Return normalized JSON payloads.
- Delegate all errors to a centralized error middleware.

## 7. Service structure

Services contain all business logic and database access.

### Service map
- authService: password hashing, token issuance, refresh-token rotation
- userService: profile reads/writes, lookup by email/id/username
- taskService: task CRUD and completion logic
- noteService: note CRUD
- postService: startup-post CRUD and ownership checks
- interactionService: like/save/suggestion operations and aggregate counts
- conversationService: conversation lookup, participant membership, creation
- messageService: message create/list/read updates
- streakService: streak calculation based on chat activity
- uploadService: file storage integration and metadata persistence

### Service rules
- Services should not handle HTTP directly.
- Services should return domain objects or DTOs.
- Services should be reusable by both REST and Socket.IO handlers.

## 8. Authentication and session structure

### Recommended auth model
- Access token: short-lived JWT stored in an HttpOnly secure cookie named token
- Refresh token: long-lived random token stored hashed in user_sessions
- Refresh flow: rotate refresh tokens on each use and revoke old ones
- Logout: clear the access cookie and revoke the current refresh token

### Why this fits the current frontend
- The current frontend already uses credentials: include and cookie-based auth semantics.
- This keeps the browser behavior aligned with the current app without exposing tokens to JavaScript.

### Auth middleware
- requireAuth should:
  - read token from cookie or Authorization header
  - verify JWT
  - attach user identity to req.user
  - load the current user from the database
  - reject expired/invalid sessions cleanly

## 9. Validation strategy

Use schema-based validation at the controller boundary.

### Validation layers
- Request validation for REST routes
- Socket payload validation for Socket.IO events
- Database-level constraints for integrity
- Business-rule validation in services

### Recommended validation rules
- Auth: email format, password length, username constraints
- Profile: username/email/phone/roll number format
- Tasks: subject/title/content/priority required
- Notes: title/content/theme required
- Posts: title/content/visibility required
- Messages: non-empty content and maximum length
- Conversations: at least one valid participant

### Recommended implementation approach
- Use zod schemas for request and socket payloads.
- Keep the current validator utilities as a minimal fallback if a full dependency migration is not desired.

## 10. Error-handling strategy

### Central error handling
- A single error middleware should normalize all failures.
- Use explicit status codes:
  - 400 validation failure
  - 401 authentication failure
  - 403 authorization failure
  - 404 missing resource
  - 409 duplicate conflict
  - 500 unexpected server error

### Response format
- Return a stable JSON shape such as:
  - success: false
  - error: message
  - details: optional validation details

### Logging
- Log request IDs, user IDs, and error codes.
- Do not expose raw stack traces to the client in production.

## 11. File and media storage strategy

### Production-ready plan
- Store files in an S3-compatible object storage service such as Cloudflare R2 or AWS S3.
- Store the object metadata in PostgreSQL.
- Return signed URLs to the frontend when needed.

### Why this is preferred
- It is scalable and production-safe.
- It avoids writing uploaded media to local disk in production.
- It works well with the existing backend architecture.

### Development fallback
- Use a local uploads folder during development if object storage is not yet configured.

### Media handling rules
- Validate file type and size before upload.
- Support image and video uploads for startup posts.
- Store public or private visibility per object as needed.

## 12. Socket.IO event structure

Socket.IO should be used strictly for realtime features and should rely on the same services as REST endpoints.

### Connection behavior
- Authenticate using the same JWT cookie or auth token passed during handshake.
- Join a private room per user and per conversation.

### Event map
- join_conversation
  - Payload: { conversationId }
  - Purpose: join the conversation room
- leave_conversation
  - Payload: { conversationId }
  - Purpose: leave the room
- send_message
  - Payload: { conversationId, content }
  - Purpose: persist message and broadcast to the conversation room
- typing_start
  - Payload: { conversationId }
  - Purpose: notify other participants that a user is typing
- typing_stop
  - Payload: { conversationId }
  - Purpose: stop typing notification
- message_read
  - Payload: { messageId }
  - Purpose: update read state and broadcast read acknowledgement
- new_message
  - Broadcast payload: message object
- typing_status_changed
  - Broadcast payload: { conversationId, userId, username, isTyping }
- message_read_updated
  - Broadcast payload: { messageId, conversationId, readerId, readAt }

### Socket design rule
- Socket events should never bypass validation or persistence logic.
- The same message service used by REST should be called from Socket.IO events.

## 13. Environment variable structure

Use a single env configuration layer.

### Required variables
- NODE_ENV=development|production
- PORT=5000
- DATABASE_URL=postgres://...
- JWT_SECRET=...
- JWT_REFRESH_SECRET=...
- FRONTEND_URL=http://localhost:5500
- COOKIE_SECURE=true|false
- STORAGE_PROVIDER=local|s3
- S3_BUCKET=...
- S3_REGION=...
- S3_ACCESS_KEY_ID=...
- S3_SECRET_ACCESS_KEY=...
- S3_ENDPOINT=...
- UPLOAD_MAX_SIZE_MB=10
- LOG_LEVEL=info

### Environment handling
- Store config in a dedicated config/env module.
- Fail fast on missing required variables in production.
- Keep defaults only for development.

## 14. Feature-to-backend responsibility mapping

| Feature | Backend responsibility |
| --- | --- |
| User profile | Persist profile fields in users, expose GET/PUT /api/profile, keep auth user identity authoritative |
| Study tasks | CRUD via /api/tasks, completion updates, ownership checks, pagination |
| Quick notes | CRUD via /api/notes, per-user ownership, theme persistence |
| Startup Wall posts | CRUD via /api/posts, visibility filtering, media references, ownership |
| Likes | Create/delete row in post_likes, aggregate counts, prevent duplicate likes |
| Saves | Create/delete row in post_saves, aggregate counts, prevent duplicate saves |
| Suggestions | Create/list suggestions in post_suggestions, attach to a post |
| Conversations | Create or lookup conversation, manage conversation_members, list conversations per user |
| Messages | Persist messages, return conversation history, support realtime broadcast |
| Typing status | Emit typing_start/typing_stop via Socket.IO without persistent storage |
| Read status | Update messages.read_at and broadcast read receipts |
| Streaks | Calculate and update streak_count and last_chat_date after chat activity |
| Media uploads | Validate, store, persist metadata, and return a reference URL for startup posts |

## 15. Migration plan

### Phase 1
- Keep the current auth, profile, task, note, conversation, and message structure.
- Add refresh-token/session support.
- Add streak fields to users.

### Phase 2
- Add startup_posts, post_likes, post_saves, and post_suggestions tables.
- Add upload metadata support.

### Phase 3
- Add production storage integration and deployment hardening.
- Add rate limiting, monitoring, and observability.

## 16. Implementation principles

- Do not change the existing UI behavior.
- Keep the frontend contract stable and compatible with the current HTML/JS code.
- Prefer small, focused services over large controllers.
- Ensure all writes are authenticated and scoped to the current user.
- Normalize all responses so the frontend can consume them without major changes.

## 17. Recommended final state

The backend should ultimately provide:
- secure authentication and session management
- persistent task and note storage
- persistent startup-post interactions
- reliable chat and message persistence
- realtime typing and read-state updates
- media upload support with object storage
- a clean, modular backend structure that can evolve without altering the UI

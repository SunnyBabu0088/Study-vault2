# Backend Integration Audit

## Executive summary

The project has a partial backend integration layer, but the current frontend still depends on the local in-memory fallback for several core flows. The backend itself already exposes routes for auth, notes, tasks, profile, conversations, and messages, but the UI is not consistently consuming them. The highest-risk issues are authentication/session handling, conversation creation, and persistence gaps for notes, tasks, startup posts, and social interactions.

## 1) Current integration inventory

### Frontend features currently using real API endpoints

- [Study_vault.html](Study_vault.html)
  - Task list loading: GET /api/tasks?limit=50&page=1
  - Task completion: PATCH /api/tasks/:id/complete
  - Task deletion: DELETE /api/tasks/:id
  - Note list loading: GET /api/notes?limit=50&page=1

- [Study.html](Study.html)
  - Profile loading: GET /api/profile
  - Profile saving: PUT /api/profile
  - Conversation creation: POST /api/conversations
  - Message loading: GET /api/conversations/:id/messages
  - Chat transport: Socket.IO events for join, send, typing, and read

### Frontend features still using the in-memory dataSdk

- [Study.html](Study.html)
  - Note creation
  - Study task creation
  - Startup wall post creation
  - Private chat message submission is socket-based, not REST-based, and is not persisted to a backend store
  - Likes, saves, suggestions, and share actions
  - Media attachment preview only; no upload persistence

- [Study_vault.html](Study_vault.html)
  - Note creation
  - Study task creation
  - Startup wall post creation
  - Profile save
  - Private chat message creation
  - Likes, saves, suggestions, and share actions

## 2) Endpoint coverage audit

### API endpoints called by the frontend that may not exist

- No currently-called frontend route appears to be completely missing from the backend implementation.
- The more important issue is that several features the UI expects to be persistent do not have backend endpoints at all, even though the frontend tries to use them indirectly through the in-memory fallback.

### Backend endpoints that exist but are not used by the frontend

- Auth endpoints:
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/logout
  - GET /api/auth/me

- Additional task endpoints:
  - GET /api/tasks/:id
  - PUT /api/tasks/:id

- Additional note endpoints:
  - GET /api/notes/:id
  - PUT /api/notes/:id
  - DELETE /api/notes/:id

- Conversation listing:
  - GET /api/conversations

- Message read tracking:
  - PATCH /api/messages/:id/read

- Health endpoint:
  - GET /api/health

## 3) Detailed findings

### Finding 1 — Authentication and session flow are not wired to the UI
- Problem: The frontend never calls the auth endpoints, so the protected API routes are effectively unusable without a manually prepared cookie/session.
- File/location: [Study.html](Study.html), [Study_vault.html](Study_vault.html), [backend/src/routes/authRoutes.js](backend/src/routes/authRoutes.js), [backend/src/middleware/authMiddleware.js](backend/src/middleware/authMiddleware.js)
- Current behavior: The UI uses fetch with credentials but does not perform login, registration, or session bootstrap. Protected requests will return 401 if no valid token cookie is present.
- Expected behavior: The app should authenticate users first, store the auth cookie, and then call protected endpoints.
- Severity: Critical
- Recommended solution: Add a real auth flow that calls /api/auth/login, /api/auth/register, /api/auth/me, and /api/auth/logout; handle 401 responses by prompting the user to sign in again.
- Dependencies/blockers: Existing backend auth routes, cookie-based session handling, and frontend auth screens.

### Finding 2 — Conversation creation is broken by a missing service helper
- Problem: Creating a conversation can fail at runtime because the backend calls a user lookup method that does not exist.
- File/location: [backend/src/services/conversationService.js](backend/src/services/conversationService.js), [backend/src/services/userService.js](backend/src/services/userService.js)
- Current behavior: POST /api/conversations reaches getOrCreateConversation, which calls getUsersByUsernames, but that method is missing from the user service.
- Expected behavior: A conversation should be created or reused based on the supplied participant usernames.
- Severity: Critical
- Recommended solution: Implement getUsersByUsernames in the user service and ensure username normalization and duplicate handling are correct.
- Dependencies/blockers: Existing users table and conversation schema.

### Finding 3 — Task persistence is incomplete
- Problem: The UI creates study tasks through the in-memory SDK instead of the backend task API.
- File/location: [Study.html](Study.html), [Study_vault.html](Study_vault.html), [backend/src/controllers/taskController.js](backend/src/controllers/taskController.js), [backend/src/services/taskService.js](backend/src/services/taskService.js)
- Current behavior: Tasks are created locally and only partially reflected in the UI, while the backend already supports create, list, complete, and delete operations.
- Expected behavior: Creating a task should persist to the database and be immediately visible on reload.
- Severity: High
- Recommended solution: Route task creation through POST /api/tasks and keep task state synchronized between the UI and the backend.
- Dependencies/blockers: Authentication session and task table availability.

### Finding 4 — Quick Notes persistence is incomplete
- Problem: Notes are created locally and not reliably persisted through the backend note endpoints.
- File/location: [Study.html](Study.html), [Study_vault.html](Study_vault.html), [backend/src/controllers/noteController.js](backend/src/controllers/noteController.js), [backend/src/services/noteService.js](backend/src/services/noteService.js)
- Current behavior: The frontend uses the in-memory SDK for note creation, while the backend already has a note API. The notes list may load from the backend, but create/update/delete operations are not consistently wired.
- Expected behavior: Notes should be saved to the notes table and survive reloads and cross-session usage.
- Severity: High
- Recommended solution: Replace the SDK-based note creation flow with POST /api/notes and keep note state in sync with backend responses.
- Dependencies/blockers: Authentication session and notes table availability.

### Finding 5 — Profile persistence is unreliable
- Problem: Profile updates are not consistently tied to a real authenticated user session and can silently fall back to local state.
- File/location: [Study.html](Study.html), [Study_vault.html](Study_vault.html), [backend/src/controllers/profileController.js](backend/src/controllers/profileController.js), [backend/src/services/userService.js](backend/src/services/userService.js)
- Current behavior: [Study.html](Study.html) saves profile through /api/profile, but the app does not guarantee a valid auth session. [Study_vault.html](Study_vault.html) still saves profile only locally.
- Expected behavior: Profile edits should be saved to the users table and reloaded correctly after refresh.
- Severity: High
- Recommended solution: Ensure profile save and load are only executed after authentication succeeds and keep the profile model in sync with backend data.
- Dependencies/blockers: Login/auth flow and users table.

### Finding 6 — Startup Wall posts are not persisted to the backend
- Problem: Startup ideas are stored only in memory and never reach a database-backed endpoint.
- File/location: [Study.html](Study.html), [Study_vault.html](Study_vault.html)
- Current behavior: The startup form creates a post record through the in-memory SDK with category startup, but there is no backend posts table or endpoint for it.
- Expected behavior: Startup posts should be stored server-side and available to other sessions.
- Severity: High
- Recommended solution: Add posts storage and a dedicated backend API for create/list/update/delete operations.
- Dependencies/blockers: New database table, new controller/service/routes, and UI wiring.

### Finding 7 — Likes, saves, suggestions, and sharing are local-only
- Problem: These social interactions are not backed by any server-side persistence.
- File/location: [Study.html](Study.html), [Study_vault.html](Study_vault.html)
- Current behavior: Clicking like/save/suggest/share updates local record properties or clipboard state only. No backend endpoint or model exists for these interactions.
- Expected behavior: These actions should persist per user and be visible across sessions.
- Severity: High
- Recommended solution: Add backend models and endpoints for post interactions, then connect the UI actions to those endpoints.
- Dependencies/blockers: New tables, services, and routes.

### Finding 8 — File, image, and video upload handling is not implemented
- Problem: The UI supports media selection, but nothing is uploaded to the backend.
- File/location: [Study.html](Study.html), [Study_vault.html](Study_vault.html)
- Current behavior: The frontend reads files into Data URLs and stores them in memory. No upload endpoint, storage layer, or multipart handling exists in the backend.
- Expected behavior: Media uploads should be saved to a storage service or server path and referenced by the post record.
- Severity: High
- Recommended solution: Add a file-upload endpoint and a storage strategy before wiring the UI to it.
- Dependencies/blockers: File upload middleware, storage service, and new media table or storage path.

### Finding 9 — Chat integration is only partially connected to the backend
- Problem: The chat UI is using sockets, but the overall messaging flow is not fully aligned with the backend’s conversation and message service design.
- File/location: [Study.html](Study.html), [backend/src/socket.js](backend/src/socket.js), [backend/src/controllers/messageController.js](backend/src/controllers/messageController.js)
- Current behavior: The frontend connects to Socket.IO, but the app lacks a reliable authenticated session bootstrap; message history is loaded via REST and message sending is emitted via socket. Conversation listing and read-state APIs are not used by the UI.
- Expected behavior: Chat should work end-to-end with authenticated users, conversation membership, message persistence, and read receipts.
- Severity: High
- Recommended solution: Ensure login/session flow works first, then make the frontend consume conversation listing, message history, and read events consistently.
- Dependencies/blockers: Auth flow, conversation membership handling, and browser cookie support.

### Finding 10 — Database schema is missing several persistence models
- Problem: The current migrations cover users, notes, tasks, conversations, members, and messages, but not startup posts, likes, saves, suggestions, or uploaded media.
- File/location: [backend/migrations](backend/migrations)
- Current behavior: The UI expects social and media features, but the database has no corresponding tables.
- Expected behavior: Every feature that the UI exposes should have matching server-side persistence.
- Severity: High
- Recommended solution: Add the missing migrations and align the schema with the frontend feature set.
- Dependencies/blockers: Database migration tooling and schema review.

### Finding 11 — CORS and credentials handling are not reliable for the current setup
- Problem: The backend’s CORS config can reject browser credentialed requests depending on the frontend origin and protocol.
- File/location: [backend/src/app.js](backend/src/app.js), [backend/src/socket.js](backend/src/socket.js), [backend/.env.example](backend/.env.example)
- Current behavior: CORS is configured with credentials enabled and an origin that defaults to * or FRONTEND_URL. In practice, credentialed requests from a different origin or protocol can fail.
- Expected behavior: Browser requests should be accepted from the actual frontend origin and cookie-based auth should be preserved.
- Severity: High
- Recommended solution: Set a fixed frontend origin in the environment and ensure the same origin is used by both the HTTP API and Socket.IO client.
- Dependencies/blockers: Frontend URL configuration and matching dev server port.

### Finding 12 — Environment variables and startup configuration are incomplete
- Problem: The backend depends on a real .env file and a valid JWT secret, but the repository only provides an example file.
- File/location: [backend/.env.example](backend/.env.example), [backend/src/config/database.js](backend/src/config/database.js), [backend/src/server.js](backend/src/server.js)
- Current behavior: The backend reads DATABASE_URL, PORT, NODE_ENV, FRONTEND_URL, and JWT_SECRET at runtime. If any are missing, startup or auth will fail.
- Expected behavior: The app should start cleanly in development and production with documented environment values.
- Severity: Medium
- Recommended solution: Provide a real .env for local development and document required values clearly.
- Dependencies/blockers: Local environment setup and database availability.

### Finding 13 — Database connection handling is brittle
- Problem: The app exits on unexpected DB errors and does not handle missing database connectivity gracefully.
- File/location: [backend/src/config/database.js](backend/src/config/database.js)
- Current behavior: Any unexpected Postgres error exits the process. No retry or health check bootstrap is present.
- Expected behavior: The server should fail gracefully and provide a useful startup error if the database is unavailable.
- Severity: Medium
- Recommended solution: Add startup health checks, better error messages, and retry handling for transient DB failures.
- Dependencies/blockers: Database availability and operational monitoring.

### Finding 14 — Duplicate and inconsistent data flow across the UI
- Problem: The frontend uses multiple state sources for the same concept, which can cause stale or divergent UI state.
- File/location: [Study.html](Study.html), [Study_vault.html](Study_vault.html)
- Current behavior: [Study_vault.html](Study_vault.html) uses separate arrays for notes, tasks, and records; [Study.html](Study.html) uses the SDK data callback plus DOM values and local profile objects. The UI can drift from the backend state.
- Expected behavior: A single source of truth should drive the UI, and backend data should be normalized before rendering.
- Severity: Medium
- Recommended solution: Define one consistent state model per feature and refresh it from the backend after each mutation.
- Dependencies/blockers: Frontend refactor and API contract alignment.

### Finding 15 — Error handling is too weak for a real backend-backed app
- Problem: Many failures are only logged to the console or silently ignored.
- File/location: [Study.html](Study.html), [Study_vault.html](Study_vault.html), [backend/src/middleware/errorHandler.js](backend/src/middleware/errorHandler.js)
- Current behavior: The frontend often catches errors and only logs them, while the backend returns generic error payloads. Users do not see clear feedback for failed requests.
- Expected behavior: Frontend and backend should surface actionable errors consistently.
- Severity: Medium
- Recommended solution: Add consistent error payloads, user-facing messages, and centralized handling of 401/403/409/500 responses.
- Dependencies/blockers: Frontend UX copy and backend error contract.

## 4) Summary of the biggest blockers

1. No reliable authenticated session flow for the UI.
2. Conversation creation is broken because of a missing service helper.
3. Core persistence features (tasks, notes, startup posts, social actions, media) are still local-only or not fully wired.
4. The database schema does not yet cover several features the UI already exposes.
5. CORS, cookies, and environment setup are not yet aligned for a real multi-origin frontend/backend setup.

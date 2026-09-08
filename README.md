# StudyVault 📚

StudyVault is a study companion single-page web application combining a **task tracker**, **quick notes notebook**, **1:1 study chat**, and a **startup idea wall** into one dashboard.

The application uses a **React 18** frontend and a **Node.js + Express + PostgreSQL + Socket.IO** backend.

---

## 1. Architecture

```text
React SPA Frontend (Vite + Tailwind CSS + lucide-react)
       ↓ (HTTP REST / WebSocket Socket.IO with HttpOnly Cookies)
Express Backend (Routes → Controllers → Services → Middleware)
       ↓
PostgreSQL Database (Source of Truth for Persistent Data)
```

- **Database as Source of Truth**: All tasks, notes, startup posts, social interactions (likes/saves/suggestions), profile details, conversations, and chat history are stored in PostgreSQL.
- **React Context State**: `StudyContext.jsx` acts as the frontend state cache and sync layer.
- **Authentication**: JWT access tokens stored in secure `HttpOnly` cookies.
- **Realtime Layer**: Socket.IO for chat messaging, typing indicators, online presence, and read receipts.

---

## 2. Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18, Vite, Tailwind CSS v4, lucide-react, Socket.IO client |
| **Backend** | Node.js, Express |
| **Realtime** | Socket.IO (WebSockets + HTTP Polling) |
| **Database** | PostgreSQL (`pg` driver) |
| **Authentication** | JWT in `HttpOnly` cookies (`token`) |
| **Uploads** | Multer local filesystem storage (`uploads/`) with database metadata |

---

## 3. Getting Started & Setup

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** server running locally (e.g. `localhost:5432`)

### 1. PostgreSQL Setup

Ensure a PostgreSQL database exists:

```sql
CREATE DATABASE studyvault;
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Ensure `.env` matches your local database credentials:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/studyvault
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
COOKIE_SECURE=false
UPLOAD_DIR=uploads
UPLOAD_MAX_SIZE_MB=10
```

Start the API backend:

```bash
npm run dev
```

The database tables are automatically initialized on startup via `initializeSchema()`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs at **`http://localhost:5500`** and automatically proxies `/api`, `/uploads`, and `/socket.io` to the Express backend at `http://localhost:5000`.

---

## 4. Database Migrations

Database tables are created automatically on startup or can be run via migrations:

- `users`: User identity, password hash, profile details, and chat streak tracking.
- `user_sessions`: Refresh token hashes and user agent metadata.
- `study_tasks`: Database-backed tasks with completion status, priority, and due dates.
- `notes`: Quick notes with themes (Lavender, Sunrise, Mint, Midnight).
- `startup_posts`: Startup Wall posts with hashtags, visibility, scheduled dates, and media references.
- `post_likes`: Post likes (1 per user per post).
- `post_saves`: Post saves (1 per user per post).
- `post_suggestions`: Ideas and suggestions submitted on posts.
- `conversations`: Chat conversation metadata.
- `conversation_members`: Junction table mapping users to conversations.
- `messages`: Chat message history with timestamps and read receipts.
- `uploads`: File metadata (original name, stored UUID name, MIME type, size).

Migration scripts are located in `backend/migrations/`.

---

## 5. Authentication Flow

- **Registration**: `POST /api/auth/register` creates user with `bcrypt` password hashing (12 rounds) and sets `HttpOnly` JWT cookie.
- **Login**: `POST /api/auth/login` verifies credentials and issues `token` cookie.
- **Logout**: `POST /api/auth/logout` clears the cookie and resets frontend context.
- **Session Check**: `GET /api/auth/me` validates existing cookie on initial load.
- **Security**: JWT tokens are never exposed in `localStorage` or `sessionStorage`.

---

## 6. Media Uploads

- **Endpoint**: `POST /api/uploads` (multipart/form-data with field `file`).
- **Allowed Types**: Images (`jpeg`, `png`, `gif`, `webp`) and Videos (`mp4`, `quicktime`, `webm`).
- **Storage**: Saved with UUID filenames in `backend/uploads/` directory; accessible via `/uploads/<filename>`.
- **Post Association**: Post creation references uploaded media URL in `media_url`.

---

## 7. Socket.IO & Realtime Chat

- **Handshake Auth**: Socket.IO extracts JWT token from `cookie` header and validates user.
- **Events**:
  - Client → Server: `join_conversation`, `send_message`, `typing_start`, `typing_stop`, `message_read`.
  - Server → Client: `new_message`, `typing_start`, `typing_stop`, `message_read`, `user_status`.
- **Streak Calculation**: Sending a chat message automatically calculates daily streaks and updates user profile state.

---

## 8. API Endpoint Summary

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user & set cookie |
| `POST` | `/api/auth/logout` | Logout user & clear cookie |
| `GET` | `/api/auth/me` | Fetch authenticated session |
| `GET` | `/api/profile` | Get current user profile |
| `PUT` | `/api/profile` | Update profile details |
| `GET` | `/api/tasks` | List study tasks |
| `POST` | `/api/tasks` | Create new study task |
| `GET` | `/api/tasks/:id` | Get task details |
| `PUT` | `/api/tasks/:id` | Update task |
| `PATCH` | `/api/tasks/:id/complete` | Toggle task completion |
| `DELETE` | `/api/tasks/:id` | Delete study task |
| `GET` | `/api/notes` | List quick notes |
| `POST` | `/api/notes` | Create quick note |
| `GET` | `/api/notes/:id` | Get note details |
| `PUT` | `/api/notes/:id` | Update quick note |
| `DELETE` | `/api/notes/:id` | Delete quick note |
| `GET` | `/api/posts` | List Startup Wall posts |
| `POST` | `/api/posts` | Create new startup post |
| `GET` | `/api/posts/:id` | Get post details |
| `PUT` | `/api/posts/:id` | Update startup post |
| `DELETE` | `/api/posts/:id` | Delete startup post |
| `POST` | `/api/interactions/posts/:id/like` | Like a post |
| `DELETE` | `/api/interactions/posts/:id/like` | Unlike a post |
| `POST` | `/api/interactions/posts/:id/save` | Save a post |
| `DELETE` | `/api/interactions/posts/:id/save` | Unsave a post |
| `GET` | `/api/interactions/posts/:id/suggestions` | List post suggestions |
| `POST` | `/api/interactions/posts/:id/suggestions` | Add suggestion to post |
| `GET` | `/api/conversations` | List user conversations |
| `POST` | `/api/conversations` | Get or create conversation |
| `GET` | `/api/conversations/:id/messages` | Fetch conversation messages |
| `PATCH` | `/api/messages/:id/read` | Mark message as read |
| `POST` | `/api/uploads` | Upload media file |
| `GET` | `/api/health` | Health check endpoint |

---

## 9. Development & Production Commands

### Frontend

```bash
cd frontend
npm run dev     # Start Vite dev server on port 5500
npm run build   # Build production assets to frontend/dist
```

### Backend

```bash
cd backend
npm run dev     # Start backend API with nodemon on port 5000
npm start       # Start backend API in production mode
```

---

## 10. Docker Setup 🐳

StudyVault provides a production-ready and developer-friendly Docker configuration with separate compose flows for local development and optimized production deployment.

### Prerequisites

- **Docker** Engine (24.0+)
- **Docker Compose** (v2.20+)

---

### Quick Start (Development)

1. **Clone the repository and copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Start the entire stack with a single command**:
   ```bash
   docker compose up --build
   ```

3. **Access the application**:
   - **Frontend**: [http://localhost:5500](http://localhost:5500) (with Vite Hot Module Replacement)
   - **Backend API**: [http://localhost:5000](http://localhost:5000) (with live nodemon reloads)
   - **PostgreSQL**: `localhost:5432`

---

### Services Architecture

| Service | Container Name | Image / Build | Port Mapping | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `db` | `studyvault-db` | `postgres:16-alpine` | `5432:5432` | PostgreSQL database with health checks & persistent data |
| `backend` | `studyvault-backend` | `backend/Dockerfile.dev` | `5000:5000` | Node.js Express API & Socket.IO server |
| `frontend` | `studyvault-frontend` | `frontend/Dockerfile.dev` | `5500:5500` | React 18 SPA on Vite with proxy to backend |

---

### Production Deployment

In production, frontend assets are compiled into a high-performance, minimal `nginx:1.27-alpine` container that serves static assets with gzip compression and proxies `/api`, `/uploads`, and `/socket.io` to the non-root Node.js backend container.

1. **Configure production environment**:
   ```bash
   cp .env.example .env
   # Edit .env and set strong JWT secrets and passwords
   ```

2. **Launch production containers in detached mode**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

3. **Access production app**:
   - Web application: [http://localhost:5500](http://localhost:5500) (or configured `$FRONTEND_PORT`)
   - Nginx handles reverse proxying internally so no direct backend exposure is needed.

---

### Useful Docker Commands

```bash
# Start all containers in background
docker compose up -d

# Rebuild images after adding packages
docker compose up --build

# View live streaming logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Check container health and status
docker compose ps

# Stop all containers
docker compose stop

# Stop and remove containers, networks, and maintain persistent volumes
docker compose down

# Stop and wipe everything including database volumes (fresh reset)
docker compose down -v

# Run database migrations manually inside backend container
docker compose exec backend npm run migrate

# Run PostgreSQL client directly inside database container
docker compose exec db psql -U postgres -d studyvault

# Open interactive shell in backend container
docker compose exec backend sh

# Open interactive shell in frontend container
docker compose exec frontend sh
```

---

### Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `POSTGRES_USER` | `postgres` | Database superuser username |
| `POSTGRES_PASSWORD` | `postgres_secure_password` | Database superuser password |
| `POSTGRES_DB` | `studyvault` | Database name |
| `POSTGRES_PORT` | `5432` | Host port mapped to database |
| `DATABASE_URL` | `postgres://...` | Connection URI passed to backend |
| `DATABASE_SSL` | `false` | Enable/disable SSL for database connections |
| `PORT` | `5000` | Backend API port |
| `NODE_ENV` | `development` / `production` | Node runtime mode |
| `JWT_SECRET` | *required in prod* | Secret key for signing JWT tokens |
| `JWT_REFRESH_SECRET` | *required in prod* | Secret key for refresh tokens |
| `FRONTEND_URL` | `http://localhost:5500` | Allowed CORS origin |
| `COOKIE_SECURE` | `false` (`true` for HTTPS) | Require HTTPS for auth cookies |
| `UPLOAD_DIR` | `uploads` | Directory for uploaded media |
| `UPLOAD_MAX_SIZE_MB` | `10` | Max file size for uploads in MB |
| `VITE_PROXY_TARGET` | `http://backend:5000` | Backend service hostname within Docker network |

---

### Troubleshooting

- **Port 5000 or 5500 already in use**:
  Ensure local instances outside Docker are stopped (`Ctrl+C`), or change the mapped host port in `.env` (e.g. `PORT=5001`).
- **Database startup race condition**:
  The backend container uses `depends_on: db: condition: service_healthy` and verifies `pg_isready` before starting, eliminating boot race conditions.
- **File changes not reflecting**:
  Vite inside Docker development mode has `CHOKIDAR_USEPOLLING: "true"` enabled for reliable hot reloading across Windows/WSL/Linux filesystem mounts.
- **Database reset**:
  To reset the schema and re-run initializations from scratch:
  ```bash
  docker compose down -v
  docker compose up --build
  ```

# StudyVault 📚

StudyVault is a study companion app that combines a **task tracker**, **quick notes notebook**, **1:1 study chat**, and a **startup idea wall** in one dashboard. It was originally built as a static HTML/CSS/JS page and has been converted into a modern **React** single-page application powered by a **Node.js/Express + PostgreSQL + Socket.IO** backend.

---

## Features

- **Study Vault dashboard**
  - Story-style contact strip with presence indicators
  - Live statistics: total tasks, open tasks, high-priority tasks
  - Notebook for quick notes with theme-colored cards (Lavender, Sunrise, Mint, Midnight)
  - Add study items (subject, priority, details, due date)
  - Collection of tasks with **All / Open / Done** filters, complete + delete actions
- **Study chat**
  - Contact list (Aarav, Maya, Kabir)
  - Real-time messaging over **Socket.IO** with typing indicators
  - **Streak tracking** — chat daily to keep your streak alive; missing days costs a week
- **Startup wall**
  - Post ideas with hashtags, visibility (public/private), and scheduling
  - Image/video upload support
  - Like, save, share (copy to clipboard), and extend an idea into a new post
  - Suggest improvements on posts and view existing suggestions
- **Profile**
  - Edit username, email, phone, and roll number

---

## Tech Stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React 18, Vite, Tailwind CSS v4, lucide-react icons, Socket.IO client |
| Backend    | Node.js, Express                                                   |
| Realtime   | Socket.IO (websocket + polling transports)                        |
| Database   | PostgreSQL (`pg` driver)                                           |
| Auth       | JWT in HTTP-only cookies                                           |

---

## Project Structure

```
Study-vault/
├── backend/                  # Express + Socket.IO + PostgreSQL API
│   └── src/
│       ├── app.js            # Express app, middleware, route mounting
│       ├── server.js         # Server bootstrap + graceful shutdown
│       ├── socket.js         # Socket.IO chat wiring
│       ├── config/           # env, database pool, schema
│       ├── controllers/      # request handlers
│       ├── services/         # business logic + queries
│       ├── middleware/       # auth, validation, rate limiting, uploads
│       ├── routes/           # API route definitions
│       └── utils/            # jwt, response helpers, validators
│
├── frontend/                 # React SPA (converted from Study_vault.html)
│   ├── index.html
│   ├── vite.config.js        # dev server + API/socket proxy
│   └── src/
│       ├── api/              # fetch wrapper + socket singleton
│       ├── components/       # Vault, Messages, Startup, Profile views
│       ├── context/          # StudyContext (global state + actions)
│       ├── App.jsx
│       └── main.jsx
│
├── Study_vault.html          # Original Canva-based HTML (reference)
├── Study.html                # Local REST/socket HTML version (reference)
├── BACKEND_ARCHITECTURE.md
├── BACKEND_INTEGRATION_AUDIT.md
└── SECURITY_AUDIT.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (tested on v24)
- **PostgreSQL** running locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # or set DATABASE_URL/PORT manually
npm run dev               # starts API on http://localhost:5000
```

Default backend configuration (see `backend/src/config/env.js`):

```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/studyvault
FRONTEND_URL=http://localhost:5500
UPLOAD_DIR=uploads
```

The schema is initialized automatically on startup (`initializeSchema`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev               # starts Vite dev server on http://localhost:5500
```

The Vite dev server proxies `/api`, `/uploads`, and `/socket.io` to `http://localhost:5000`, so cookies and WebSockets work without extra CORS setup.

Open **http://localhost:5500** to use the app.

### Production build

```bash
cd frontend
npm run build             # outputs static site to frontend/dist
```

---

## API Overview

All routes are mounted under `/api` and require a valid JWT cookie (`token`) set by `POST /api/auth/login`.

| Method | Endpoint                                        | Description                         |
| ------ | ----------------------------------------------- | ----------------------------------- |
| POST   | `/api/auth/register`                            | Create account                      |
| POST   | `/api/auth/login`                               | Log in, sets cookie                 |
| POST   | `/api/auth/logout`                              | Clear session                       |
| GET    | `/api/tasks`                                    | List tasks (paginated)              |
| POST   | `/api/tasks`                                    | Create task                         |
| PATCH  | `/api/tasks/:id/complete`                       | Toggle completion                   |
| DELETE | `/api/tasks/:id`                                | Delete task                         |
| GET    | `/api/notes`                                    | List notes                          |
| POST   | `/api/notes`                                    | Create note                         |
| GET    | `/api/posts`                                    | List posts                          |
| POST   | `/api/posts`                                    | Create post                         |
| GET    | `/api/profile`                                  | Get profile                         |
| PUT    | `/api/profile`                                  | Update profile                      |
| POST   | `/api/conversations`                            | Get or create a conversation        |
| GET    | `/api/conversations/:id/messages`               | Conversation history                |
| POST   | `/api/uploads`                                  | Upload media (multipart)            |
| POST   | `/api/interactions/posts/:id/like`              | Like a post                         |
| DELETE | `/api/interactions/posts/:id/like`              | Unlike a post                       |
| POST   | `/api/interactions/posts/:id/save`              | Save a post                         |
| DELETE | `/api/interactions/posts/:id/save`              | Unsave a post                       |
| GET    | `/api/interactions/posts/:id/suggestions`       | List suggestions                    |
| POST   | `/api/interactions/posts/:id/suggestions`       | Add a suggestion                    |
| GET    | `/api/health`                                   | Health check                        |

### Socket.IO events (chat)

Client emits: `join_conversation`, `send_message`, `typing_start`, `typing_stop`, `message_read`.
Server emits: `new_message`, `typing_start`, `typing_stop`, `message_read`, `user_status`.

---

## How the React conversion works

The original static page manipulated the DOM directly (template cloning, `innerHTML`, `querySelector`). The React version keeps the same look and behavior but is fully component-driven:

- Global state lives in `frontend/src/context/StudyContext.jsx` (tasks, notes, posts, profile, active view/filter, chat state) and exposes actions that wrap the REST + Socket.IO calls.
- Every view is a component: `VaultView`, `MessagesView`, `StartupView`, `ProfileView`, composed of smaller ones (`StoriesStrip`, `StatCards`, `Notebook`, `StudyEntry`, `Collection`, `PostCard`, `ChatPage`…).
- Styling keeps the original design tokens (CSS custom properties) plus Tailwind utility classes.
- Real-time chat connects lazily when a conversation is opened and is cleaned up when leaving the messages view.

---

## License

Private project — no license specified.

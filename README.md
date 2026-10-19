# Connectify — Real-Time Group Chat Web Application

> *"Every conversation brings us closer."*

Connectify is a full-stack, production-ready real-time group chat web application built using the **MERN stack** (MongoDB, Express.js, React.js with Vite, Node.js) and **Socket.IO**. It features a modern interface inspired by WhatsApp Web, Discord, and Slack, with an intuitive three-column layout, group administration, 1-on-1 direct messaging, online presence tracking, typing indicators, image attachments, message reactions, and JWT-authenticated sessions.

---

## 📑 Table of Contents

1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [Architecture & Folder Structure](#-architecture--folder-structure)
4. [Prerequisites](#-prerequisites)
5. [Local Installation & Setup](#-local-installation--setup)
6. [Environment Configuration](#-environment-configuration)
7. [Database Setup & Seeding](#-database-setup--seeding)
8. [Running the Application](#-running-the-application)
9. [REST API Documentation](#-rest-api-documentation)
10. [Socket.IO Events](#-socketio-events)
11. [Testing & Quality Assurance](#-testing--quality-assurance)
12. [Deployment Guide](#-deployment-guide)
13. [License](#-license)

---

## ✨ Features

### 🔐 Authentication & Profile Management
- **Secure Registration & Login**: User registration with unique username/email validation, password confirmation, and secure password hashing using `bcryptjs`.
- **JWT Authentication**: Token-based authentication using HTTP cookies and Authorization Bearer headers with automatic persistent sessions across refreshes.
- **Profile Customization**: Edit display name, custom bio, and upload custom profile avatars (supporting local disk uploads and optional Cloudinary storage).
- **Protected Routes**: Client-side route guards (`ProtectedRoute`, `PublicRoute`) and backend authentication middleware (`protect`).

### 💬 Messaging & Real-Time Interaction
- **Instant Messaging**: Sub-second real-time message dispatching powered by Socket.IO with MongoDB persistence.
- **Direct & Group Chats**: Seamlessly switch between 1-on-1 private conversations and multi-member group rooms.
- **Typing Indicators**: Real-time "is typing..." indicators.
- **Live Presence (Online/Offline)**: Live tracking of user socket connections with green indicator pills and "Last seen" timestamps.
- **Message Read Receipts**: Double-check status tracking when messages are read by participants.
- **Emoji Reactions**: Interactive emoji picker and instant emoji reaction badges (👍, ❤️, 😂, 😮, 😢, 🔥).
- **Reply & Quote**: Threaded message quoting displaying parent message previews.
- **Edit & Soft Delete**: Edit your own sent messages with an `(edited)` indicator, or soft-delete messages with audit safety.
- **Photo Attachments**: Upload and preview images directly in conversations with image preview cards.

### 👥 Group Management & Admin Controls
- **Create Groups**: Choose group name, custom description, group avatar, and invite multiple registered users.
- **Role-Based Authorization**: Group creators are automatically assigned as **Admin**.
- **Admin Privileges**: Only admins can update group information, add new members, and remove members.
- **System Activity Messages**: Automatic event chips for group creations, member joins, leaves, and removals.
- **Leave Group**: Members can exit groups at any time with automatic admin reassignment if needed.

### 🔍 Search & Notifications
- **Global & Local Search**: Filter conversations in the sidebar by name or message text; search registered users to start new chats; search historical messages within an active conversation.
- **In-App Notifications**: Interactive notification center alerting users when added to groups or mentioned.
- **Unread Counters**: Dynamic unread message badges on conversation items.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v6
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Networking**: Axios
- **Real-Time**: Socket.IO Client
- **Dates**: date-fns
- **Emoji Picker**: emoji-picker-react

### Backend
- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Engine**: Socket.IO
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **File Uploads**: Multer with local disk storage and optional Cloudinary integration
- **Security**: Helmet, CORS, Express Rate Limit, Cookie Parser

---

## 📁 Architecture & Folder Structure

```
connectify/
├── client/                     # Frontend React (Vite) Application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── AddMemberModal.jsx
│   │   │   ├── ChatArea.jsx
│   │   │   ├── CreateGroupModal.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── InfoPanel.jsx
│   │   │   ├── MessageItem.jsx
│   │   │   ├── NewDirectModal.jsx
│   │   │   ├── NotificationsModal.jsx
│   │   │   ├── ProfileModal.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── UserAvatar.jsx
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ChatContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── pages/              # Application views
│   │   │   ├── ChatDashboard.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── NotFoundPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── services/           # Axios API services
│   │   │   └── api.js
│   │   ├── utils/              # Helper utilities
│   │   │   └── helpers.js
│   │   ├── App.jsx             # Router and Global Providers
│   │   ├── index.css           # Tailwind CSS directives
│   │   └── main.jsx            # React root
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vercel.json             # Vercel SPA rewrite config
│   ├── vite.config.js
│   └── .env.example
│
├── server/                     # Backend Node.js / Express Server
│   ├── config/                 # Database & Cloudinary configurations
│   │   ├── cloudinary.js
│   │   └── db.js
│   ├── controllers/            # Route business logic
│   │   ├── authController.js
│   │   ├── conversationController.js
│   │   ├── messageController.js
│   │   ├── notificationController.js
│   │   └── userController.js
│   ├── middleware/             # Auth, Upload & Error handling
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── upload.js
│   ├── models/                 # Mongoose models
│   │   ├── Conversation.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   └── User.js
│   ├── routes/                 # REST API endpoints
│   │   ├── authRoutes.js
│   │   ├── conversationRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── userRoutes.js
│   ├── scripts/                # Database seed scripts
│   │   └── seed.js
│   ├── sockets/                # Socket.IO handlers
│   │   └── socketHandler.js
│   ├── tests/                  # Automated integration tests
│   │   └── api.test.js
│   ├── uploads/                # Local uploaded attachments
│   ├── app.js                  # Express app definition
│   ├── server.js               # HTTP & Socket.IO server entry
│   ├── package.json
│   └── .env.example
│
├── .gitignore
├── package.json                # Root orchestration & scripts
└── README.md
```

---

## 📦 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**
- **MongoDB**: A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URL or local MongoDB instance (`mongodb://127.0.0.1:27017/connectify`).

---

## 🚀 Local Installation & Setup

### 1. Clone or Open the Repository
```bash
git clone https://github.com/your-username/connectify.git
cd connectify
```

### 2. Install Dependencies
Run the unified installer script from the root directory:
```bash
npm run install:all
```
*(Alternatively, run `npm install` inside both `server/` and `client/` directories).*

---

## ⚙️ Environment Configuration

### Server Configuration (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/connectify
JWT_SECRET=connectify_development_secret_key_384729104712049
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional: Cloudinary credentials (if empty, local disk storage /uploads is used automatically)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Client Configuration (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🗄 Database Setup & Seeding

### Using MongoDB Atlas (Recommended for Cloud / College Demos)
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (M0).
3. Under **Database Access**, create a user and password.
4. Under **Network Access**, add IP address `0.0.0.0/0` (allow access from anywhere).
5. In your cluster dashboard, click **Connect** -> **Drivers** -> copy connection string.
6. Paste the string into `server/.env` under `MONGODB_URI`.

### Seed Demo Accounts & Conversations
To quickly populate the database with demo users, conversations, and realistic messages for demonstration:
```bash
npm run seed
```

**Pre-seeded Demo Accounts:**
| Username | Password | Full Name | Role |
| :--- | :--- | :--- | :--- |
| `demo_user` | `connectify123` | Alex Morgan | Group Admin / Creator |
| `sarah_connor` | `connectify123` | Sarah Connor | Member |
| `marcus_v` | `connectify123` | Marcus Vance | Member |
| `elena_r` | `connectify123` | Elena Rostova | Member |

---

## 💻 Running the Application

### Option A: Run Both Client & Server Concurrently (Recommended)
From the root directory:
```bash
npm run dev
```

### Option B: Run Separately
In terminal 1 (Backend):
```bash
cd server
npm run dev
```
In terminal 2 (Frontend):
```bash
cd client
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT |
| `POST` | `/api/auth/logout` | Private | Clear authentication cookie |
| `GET` | `/api/auth/me` | Private | Get authenticated user profile |

### Users (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/search?q=:query` | Private | Search registered users by name/username |
| `GET` | `/api/users/:id` | Private | Get public profile by user ID |
| `PATCH` | `/api/users/profile` | Private | Update user display name and bio |
| `POST` | `/api/users/avatar` | Private | Upload profile avatar photo |

### Conversations (`/api/conversations`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/conversations` | Private | List all conversations for current user |
| `POST` | `/api/conversations` | Private | Create a direct or group conversation |
| `GET` | `/api/conversations/:id` | Private | Get single conversation details |
| `PATCH` | `/api/conversations/:id` | Admin | Update group name, description, avatar |
| `POST` | `/api/conversations/:id/members` | Admin | Add member(s) to group |
| `DELETE` | `/api/conversations/:id/members/:userId` | Admin | Remove member from group |
| `POST` | `/api/conversations/:id/leave` | Private | Leave group conversation |

### Messages (`/api/messages`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/messages/:conversationId` | Private | Fetch messages with pagination & search |
| `POST` | `/api/messages` | Private | Send text or photo message |
| `PATCH` | `/api/messages/:id` | Private | Edit own message |
| `DELETE` | `/api/messages/:id` | Author/Admin | Soft delete message |
| `POST` | `/api/messages/:id/read` | Private | Mark message as read |
| `POST` | `/api/messages/:id/react` | Private | Toggle emoji reaction |

### Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Private | Fetch user notifications |
| `PATCH` | `/api/notifications/:id/read` | Private | Mark single notification as read |
| `PATCH` | `/api/notifications/read-all` | Private | Mark all notifications as read |

---

## ⚡ Socket.IO Events

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join_conversation` | Client ➔ Server | `{ conversationId }` | Validates membership & joins conversation room |
| `leave_conversation` | Client ➔ Server | `{ conversationId }` | Leaves conversation room |
| `send_message` | Client ➔ Server | `{ conversationId, text, attachments, replyTo }` | Saves to DB & broadcasts to room |
| `receive_message` | Server ➔ Client | `MessageObject` | Emits new message to conversation members |
| `typing_start` | Client ➔ Server | `{ conversationId }` | Broadcasts typing status to active room |
| `typing_stop` | Client ➔ Server | `{ conversationId }` | Clears typing status |
| `online_users_list` | Server ➔ Client | `[userIds]` | Sends list of currently online user IDs |
| `user_online` | Server ➔ Client | `{ userId, user }` | Broadcasts user connection presence |
| `user_offline` | Server ➔ Client | `{ userId, lastSeen }` | Broadcasts user disconnection presence |
| `message_read` | Client ➔ Server ➔ Client | `{ conversationId, messageId, userId }` | Broadcasts read receipt status |
| `message_reaction` | Client ➔ Server ➔ Client | `{ conversationId, messageId, emoji }` | Updates and broadcasts emoji reactions |
| `message_edited` | Client ➔ Server ➔ Client | `{ conversationId, message }` | Broadcasts edited message text |
| `message_deleted` | Client ➔ Server ➔ Client | `{ conversationId, messageId, deletedAt }` | Broadcasts message deletion |

---

## 🧪 Testing & Quality Assurance

Automated backend unit and integration tests are implemented with **Jest**, **Supertest**, and **mongodb-memory-server** (no external MongoDB process required).

Run the tests from the root directory:
```bash
npm run test
```
Or inside the `server/` folder:
```bash
cd server
npm test
```

### Verified Test Coverage:
- `GET /api/health` health check status
- `POST /api/auth/register` user registration & bcrypt password hashing
- `POST /api/auth/login` token generation and verification
- Invalid credential rejection
- Conversation creation, membership authorization, and message posting workflows

---

## 🚢 Deployment Guide

### Deploying Frontend to Vercel
1. Push repository to GitHub.
2. Log into [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your `connectify` GitHub repository.
4. Set **Root Directory** to `client`.
5. Set Environment Variables:
   - `VITE_API_URL`: Your deployed backend URL + `/api` (e.g. `https://connectify-backend.onrender.com/api`)
   - `VITE_SOCKET_URL`: Your deployed backend URL (e.g. `https://connectify-backend.onrender.com`)
6. Click **Deploy**. The included `client/vercel.json` ensures full SPA routing support.

### Deploying Backend to Render
1. Log into [render.com](https://render.com) and click **New Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB Atlas URI
   - `JWT_SECRET`: A long random secret string
   - `CLIENT_URL`: Your Vercel frontend domain (e.g. `https://connectify.vercel.app`)
5. Click **Create Web Service**.

---

## 📄 License

This project is licensed under the MIT License — open-source for personal and educational use.

# Pulse Chat — CS 314 Term Project

A real-time instant messaging application built with the MERN stack + Socket.IO.

---

## Project Structure

```
chat-app/
├── backend/          # Node.js + Express + MongoDB + Socket.IO
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/      # JWT auth middleware
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── socket/          # Socket.IO handler
│   │   └── index.js         # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── api/             # Axios client
│   │   ├── context/         # Auth + Socket contexts
│   │   ├── pages/           # AuthPage, ProfilePage, ChatPage
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Setup

### 1. MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user and whitelist your IP (or use `0.0.0.0/0`)
3. Copy the connection string

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET
npm install
npm run dev        # runs on port 5000
```

**.env** (fill in your values):
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxx.mongodb.net/chatapp
JWT_SECRET=change_this_to_a_random_secret_string
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# .env already points to http://localhost:5000 by default
npm install
npm run dev        # runs on port 5173
```

Open **http://localhost:5173** in your browser.

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | — | Register |
| POST | /api/auth/login | — | Login |
| POST | /api/auth/logout | ✓ | Logout |
| GET | /api/auth/userinfo | ✓ | Get current user |
| POST | /api/auth/update-profile | ✓ | Update name + color |
| POST | /api/contacts/search | ✓ | Search users |
| GET | /api/contacts/all-contacts | ✓ | All users except self |
| GET | /api/contacts/get-contacts-for-list | ✓ | DM list sorted by time |
| DELETE | /api/contacts/delete-dm/:dmId | ✓ | Delete conversation |
| POST | /api/messages/get-messages | ✓ | Message history |

**Socket.IO Events:**
- `sendMessage` (client → server): `{ sender, recipient, content, messageType }`
- `receiveMessage` (server → client): full message object with populated user fields

---

## Features

- ✅ User registration & login (bcrypt passwords, JWT HTTP-only cookies)
- ✅ Profile setup (first/last name, accent color)
- ✅ Real-time messaging via Socket.IO
- ✅ Contact search
- ✅ Conversation list sorted by last message
- ✅ Delete conversations
- ✅ Automatic re-auth on page reload
- ✅ Protected routes (unauthenticated users redirected to login)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | CSS Modules |
| HTTP Client | Axios |
| Real-time | Socket.IO Client |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Real-time | Socket.IO Server |

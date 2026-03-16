# COMP3133 - Lab Test 1: Real-Time Chat Application

A full-stack real-time chat application built with Node.js, Express, Socket.io, and MongoDB.

## Features

### 1. GitHub Repository 
Code is maintained in a GitHub repository with regular commits tracking project progress.

### 2. Working Signup Page 
- Registration form collects username, first name, last name, and password
- Password confirmation field with 4-character minimum validation
- Usernames are checked for uniqueness before creation
- Passwords are hashed with **bcryptjs** (salt rounds: 10) before storage
- User data is saved to MongoDB via the `POST /api/auth/signup` endpoint
- Redirects to login page on successful registration

### 3. Working Login/Logout 
- Login authenticates against MongoDB using bcrypt password comparison
- On successful login, user session is stored in `localStorage` (`chatUser` key containing username, firstname, lastname)
- Logout clears `localStorage` and redirects to the login page
- Auth pages redirect to chat if a session already exists; chat page redirects to login if no session is found

### 4. MongoDB Validation 
- **User schema**: `username` is required and enforced as `unique`; `firstname`, `lastname`, and `password` are all required with trimming
- **GroupMessage schema**: `from_user`, `room`, and `message` are all required
- **PrivateMessage schema**: `from_user`, `to_user`, and `message` are all required
- Duplicate username attempts return a `400` error with a descriptive message

### 5. Room Join/Leave 
- Five predefined rooms: **devops**, **cloud computing**, **covid19**, **sports**, **nodeJS**
- Users click a room in the sidebar to join; the server tracks active users per room in memory
- System messages notify all room members when a user joins or leaves
- A "Leave Room" button lets users exit their current room
- The active user list in the sidebar updates in real time via Socket.io

### 6. Typing Indicator 
- **Room chat**: emits `typing` / `stopTyping` events; displays "[username] is typing..." to other room members
- **Private chat**: emits `privateTyping` / `privateStopTyping` events; displays indicator only to the recipient
- Uses a 1-second debounce timeout — the indicator clears automatically when the user stops typing

### 7. Chat Functionality with MongoDB Storage 
- **Room messages**: sent via Socket.io `chatMessage` event, saved to the `GroupMessage` collection, and broadcast to all users in the room
- **Private messages**: sent via `privateMessage` event, saved to the `PrivateMessage` collection, and delivered only to the sender and recipient
- Message history is loaded from MongoDB when joining a room (up to 100 messages) or opening a private chat
- Messages display the sender's name, text, and timestamp; the current user's messages are right-aligned with a purple gradient bubble
- XSS protection via an `escapeHtml()` utility that sanitizes all user-generated content before rendering

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express 5 |
| Real-Time | Socket.io 4 |
| Database | MongoDB Atlas + Mongoose 9 |
| Auth | bcryptjs |
| Frontend | HTML5, Bootstrap 5, jQuery 3, Font Awesome 6 |

## Project Structure

```
LabTest1/
├── models/
│   ├── User.js              # User schema with password hashing
│   ├── GroupMessage.js       # Room message schema
│   └── PrivateMessage.js     # Private message schema
├── routes/
│   └── auth.js               # Signup, login, and user list endpoints
├── view/
│   ├── login.html            # Login page
│   ├── signup.html           # Registration page
│   ├── chat.html             # Main chat interface
│   ├── css/
│   │   └── style.css         # Application styles
│   └── js/
│       └── chat.js           # Client-side Socket.io and chat logic
├── server.js                 # Express server, Socket.io setup, MongoDB connection
├── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate and return user data |
| `GET`  | `/api/auth/users` | List all registered users |
| `GET`  | `/api/rooms` | Get available chat rooms |
| `GET`  | `/api/messages/:room` | Get message history for a room |
| `GET`  | `/api/private-messages/:user1/:user2` | Get private message history between two users |

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `joinRoom` | Client -> Server | Join a chat room |
| `leaveRoom` | Client -> Server | Leave the current room |
| `chatMessage` | Bidirectional | Send/receive room messages |
| `privateMessage` | Bidirectional | Send/receive direct messages |
| `typing` / `stopTyping` | Bidirectional | Room typing indicators |
| `privateTyping` / `privateStopTyping` | Bidirectional | Private chat typing indicators |
| `roomUsers` | Server -> Client | Updated list of users in a room |
| `message` | Server -> Client | System notifications (join/leave/disconnect) |

## Getting Started

### Prerequisites
- Node.js (v18+)
- A MongoDB Atlas cluster (connection string is configured in `server.js`)

### Installation

```bash
npm install
```

### Running the Application

```bash
# Development (auto-reload with nodemon)
npm run dev

# Production
npm start
```

The server starts on **http://localhost:3000**. Opening the root URL redirects to the login page.

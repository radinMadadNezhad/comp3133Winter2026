const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');

// Import models
const GroupMessage = require('./models/GroupMessage');
const PrivateMessage = require('./models/PrivateMessage');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'view')));

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://rad1383in_db_user:radin@cluster0.sa8nldl.mongodb.net/chat_app?appName=Cluster0';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Predefined chat rooms
const ROOMS = ['devops', 'cloud computing', 'covid19', 'sports', 'nodeJS'];

// Get available rooms
app.get('/api/rooms', (req, res) => {
    res.json(ROOMS);
});

// Get messages for a room
app.get('/api/messages/:room', async (req, res) => {
    try {
        const messages = await GroupMessage.find({ room: req.params.room })
            .sort({ date_sent: 1 })
            .limit(100);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

// Get private messages between two users
app.get('/api/private-messages/:user1/:user2', async (req, res) => {
    try {
        const messages = await PrivateMessage.find({
            $or: [
                { from_user: req.params.user1, to_user: req.params.user2 },
                { from_user: req.params.user2, to_user: req.params.user1 }
            ]
        }).sort({ date_sent: 1 }).limit(100);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching private messages' });
    }
});

// Socket.io connection handling
const users = {}; // Store connected users { socketId: { username, room } }

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // User joins a room
    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);
        users[socket.id] = { username, room };

        // Notify others in the room
        socket.to(room).emit('message', {
            from_user: 'System',
            message: `${username} has joined the room`,
            date_sent: new Date()
        });

        // Send room users list
        const roomUsers = Object.values(users).filter(u => u.room === room).map(u => u.username);
        io.to(room).emit('roomUsers', roomUsers);

        console.log(`${username} joined room: ${room}`);
    });

    // User leaves a room
    socket.on('leaveRoom', () => {
        const user = users[socket.id];
        if (user) {
            socket.leave(user.room);

            // Notify others in the room
            socket.to(user.room).emit('message', {
                from_user: 'System',
                message: `${user.username} has left the room`,
                date_sent: new Date()
            });

            // Update room users list
            const roomUsers = Object.values(users).filter(u => u.room === user.room && u.username !== user.username).map(u => u.username);
            io.to(user.room).emit('roomUsers', roomUsers);

            delete users[socket.id];
        }
    });

    // Handle chat messages
    socket.on('chatMessage', async ({ message }) => {
        const user = users[socket.id];
        if (user) {
            const msgData = {
                from_user: user.username,
                room: user.room,
                message: message,
                date_sent: new Date()
            };

            // Save to database
            try {
                const groupMessage = new GroupMessage(msgData);
                await groupMessage.save();
            } catch (error) {
                console.error('Error saving message:', error);
            }

            // Broadcast to room
            io.to(user.room).emit('message', msgData);
        }
    });

    // Handle private messages
    socket.on('privateMessage', async ({ to_user, message }) => {
        const user = users[socket.id];
        if (user) {
            const msgData = {
                from_user: user.username,
                to_user: to_user,
                message: message,
                date_sent: new Date()
            };

            // Save to database
            try {
                const privateMessage = new PrivateMessage(msgData);
                await privateMessage.save();
            } catch (error) {
                console.error('Error saving private message:', error);
            }

            // Find recipient's socket
            const recipientSocketId = Object.keys(users).find(
                id => users[id].username === to_user
            );

            // Send to sender
            socket.emit('privateMessage', msgData);

            // Send to recipient if online
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('privateMessage', msgData);
            }
        }
    });

    // Typing indicator
    socket.on('typing', () => {
        const user = users[socket.id];
        if (user) {
            socket.to(user.room).emit('typing', { username: user.username });
        }
    });

    // Stop typing indicator
    socket.on('stopTyping', () => {
        const user = users[socket.id];
        if (user) {
            socket.to(user.room).emit('stopTyping', { username: user.username });
        }
    });

    // Private typing indicator
    socket.on('privateTyping', ({ to_user }) => {
        const user = users[socket.id];
        if (user) {
            const recipientSocketId = Object.keys(users).find(
                id => users[id].username === to_user
            );
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('privateTyping', { username: user.username });
            }
        }
    });

    // Private stop typing indicator
    socket.on('privateStopTyping', ({ to_user }) => {
        const user = users[socket.id];
        if (user) {
            const recipientSocketId = Object.keys(users).find(
                id => users[id].username === to_user
            );
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('privateStopTyping', { username: user.username });
            }
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            socket.to(user.room).emit('message', {
                from_user: 'System',
                message: `${user.username} has disconnected`,
                date_sent: new Date()
            });

            // Update room users list
            const roomUsers = Object.values(users).filter(u => u.room === user.room && u.username !== user.username).map(u => u.username);
            io.to(user.room).emit('roomUsers', roomUsers);

            delete users[socket.id];
        }
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

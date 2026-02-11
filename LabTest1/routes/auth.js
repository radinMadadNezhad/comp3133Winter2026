const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { username, firstname, lastname, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create new user
        const user = new User({
            username,
            firstname,
            lastname,
            password
        });

        await user.save();

        res.status(201).json({
            message: 'User created successfully',
            user: {
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        res.json({
            message: 'Login successful',
            user: {
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Get all users (for private messaging)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'username firstname lastname');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
});

module.exports = router;

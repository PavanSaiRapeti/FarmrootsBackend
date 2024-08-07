const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { data } = require('autoprefixer');
const { User } = require('../models/AllCollection');
const getNextSequence = require('../middleware/auth');
require('dotenv').config();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        console.log('===> user',user,req.body)
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials', isAuthenticated: false });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials', isAuthenticated: false });
        }
       console.log('==>12',user);
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not set');
            return res.status(500).json({ message: 'Server error', isAuthenticated: false });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('==>token',token);
        user.token = token;
        await user.save();
        res.status(200).json({ message: 'Login successful', isAuthenticated: true, token ,data: { first: user.first, last: user.last, email: user.email },userId: user.userId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', isAuthenticated: false });
    }
});

router.post('/register', async (req, res) => {
    try {
        const {first , last , email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await getNextSequence('userId');
        const newUser = new User({ userId, first , last , email , password: hashedPassword });
        await newUser.save();
        res.status(200).json({ isRegistered: true });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers['authorization'].split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedToken.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'Profile fetched successfully', data: user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/validateToken', async (req, res) => {
    try {
        const token = req?.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedToken.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ valid: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
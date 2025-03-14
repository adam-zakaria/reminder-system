const express = require('express');
const { login, register } = require('../services/authService');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Login route
router.post('/login', login);

// Register route
router.post('/register', register);

module.exports = router;

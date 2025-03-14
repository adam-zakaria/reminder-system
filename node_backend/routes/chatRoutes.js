const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { sendMessage, getChatThread } = require('../services/chatService');

const router = express.Router();

// Send a new chat message and store conversation
router.post('/', authenticate, sendMessage);

// Get the chat thread for a specific conversation
router.get('/:threadId', authenticate, getChatThread);

module.exports = router;

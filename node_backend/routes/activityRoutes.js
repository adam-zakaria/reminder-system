const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { getActivities } = require('../services/activityService');

const router = express.Router();

// Get available activity types
router.get('/', authenticate, getActivities);

module.exports = router;
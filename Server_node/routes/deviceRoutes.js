const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const {
  getLightCategories,
  createUserClientMapping,
  getUserClientMappings,
} = require('../services/deviceService');

const router = express.Router();

// Get light categories options (related to devices)
router.get('/light-categories', getLightCategories);

// Get user-client mappings (which user is linked to which device)
router.get('/userClientMappings', authenticate, getUserClientMappings);

// Create a new user-client mapping (link user to a device)
router.post('/userClientMappings', authenticate, createUserClientMapping);

module.exports = router;

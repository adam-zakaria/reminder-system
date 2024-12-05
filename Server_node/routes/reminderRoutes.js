const express = require('express');
const { authenticate, checkSuperuser } = require('../middleware/authMiddleware');
const {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  shareReminder,
  unshareReminder,
} = require('../services/reminderService');

const router = express.Router();

// Get all reminders (filtered by user role)
router.get('/', authenticate, getReminders);

// Create a new reminder
router.post('/', authenticate, createReminder);

// Get a specific reminder by ID
router.get('/:id', authenticate, getReminderById);

// Update a reminder by ID
router.put('/:id', authenticate, updateReminder);

// Delete a reminder by ID
router.delete('/:id', authenticate, deleteReminder);

// Share a reminder with other users
router.post('/share', authenticate, checkSuperuser, shareReminder);

// Unshare a reminder
router.delete('/unshare/:id', authenticate, checkSuperuser, unshareReminder);

module.exports = router;

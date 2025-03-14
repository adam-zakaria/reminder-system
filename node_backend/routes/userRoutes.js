const express = require('express');
const { authenticate, checkSuperuser } = require('../middleware/authMiddleware');
const {
  register,
  login,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../services/userService');

const router = express.Router();

// User login
router.post('/login', login);

// User registration
router.post('/register', register);

// Get all users (superuser only)
router.get('/', authenticate, checkSuperuser, getUsers);

// Get a user by ID (superuser only)
router.get('/:id', authenticate, checkSuperuser, getUserById);

// Update user by ID (superuser only)
router.put('/:id', authenticate, checkSuperuser, updateUser);

// Delete user by ID (superuser only)
router.delete('/:id', authenticate, checkSuperuser, deleteUser);

module.exports = router;

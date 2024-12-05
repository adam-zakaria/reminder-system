const bcrypt = require('bcrypt');
const { db } = require('../models');

// Register a new user
async function registerUser(userData) {
  const { username, email, password, role } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await db.users.create({ username, email, password: hashedPassword, role });
  return user;
}

// Get all users
async function getUsers() {
  const users = await db.users.findAll();
  return users;
}

// Update a user by ID
async function updateUser(userId, updateData) {
  const { password } = updateData;
  if (password) updateData.password = await bcrypt.hash(password, 10);
  const [updated] = await db.users.update(updateData, { where: { id: userId } });
  if (updated) {
    return db.users.findByPk(userId);
  } else {
    throw new Error('User not found');
  }
}

module.exports = { registerUser, getUsers, updateUser };

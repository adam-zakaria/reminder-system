const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../models');
const JWT_SECRET = process.env.JWT_SECRET;

// Login function
async function loginUser(email, password) {
  const user = await db.users.findOne({ where: { email } });
  if (!user) throw new Error('User not found');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Invalid password');

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  return { token, role: user.role, username: user.username };
}

// JWT authentication middleware
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.users.findByPk(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
}

// Superuser check middleware
async function checkSuperuser(req, res, next) {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await db.users.findByPk(decoded.userId);
  if (user.role !== 'superuser') return res.status(403).json({ error: 'Access denied' });
  next();
}

module.exports = { loginUser, authenticate, checkSuperuser };

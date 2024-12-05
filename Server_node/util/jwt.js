const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

exports.signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
exports.verifyToken = (token) => jwt.verify(token, JWT_SECRET);

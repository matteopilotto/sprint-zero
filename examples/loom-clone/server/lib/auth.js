// Token creation and the two auth checks.
// requireAuth reads the Authorization header only.
// requireAuthForFile is used by exactly one route (GET /recordings/:id/file) and
// also accepts ?token=, because a <video> tag or download link cannot send a header.
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, TOKEN_LIFETIME } = require('../config');
const { sendError } = require('./helpers');

function createToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { algorithm: 'HS256', expiresIn: TOKEN_LIFETIME });
}

function tokenFromHeader(req) {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
  return match ? match[1].trim() : null;
}

// Returns the user row for a valid token, or null.
function userForToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub) || null;
  } catch (err) {
    return null;
  }
}

function authenticate(req, res, next, token) {
  const user = userForToken(token);
  if (!user) return sendError(res, 401, 'unauthorized', 'Invalid or expired token.');
  req.user = user;
  next();
}

function requireAuth(req, res, next) {
  authenticate(req, res, next, tokenFromHeader(req));
}

function requireAuthForFile(req, res, next) {
  authenticate(req, res, next, tokenFromHeader(req) || req.query.token);
}

module.exports = { createToken, requireAuth, requireAuthForFile };

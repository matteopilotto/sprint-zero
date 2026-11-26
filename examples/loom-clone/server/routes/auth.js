// Accounts: sign up, log in, and "who am I". Logging out is client-side (discard the token).
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { createToken, requireAuth } = require('../lib/auth');
const { timestamp, sendError, toUser } = require('../lib/helpers');

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

router.post('/signup', (req, res) => {
  const body = req.body || {};
  const email = cleanEmail(body.email);
  const password = body.password;

  if (!EMAIL_PATTERN.test(email)) {
    return sendError(res, 400, 'invalid_input', 'Enter a valid email address.');
  }
  if (typeof password !== 'string' || password.length < 8) {
    return sendError(res, 400, 'invalid_input', 'Password must be at least 8 characters.');
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return sendError(res, 409, 'email_taken', 'That email is already registered.');
  }

  const user = {
    id: crypto.randomUUID(),
    email,
    password_hash: bcrypt.hashSync(password, 10),
    created_at: timestamp(),
  };
  db.prepare(
    'INSERT INTO users (id, email, password_hash, created_at) VALUES (@id, @email, @password_hash, @created_at)'
  ).run(user);

  res.status(201).json({ access_token: createToken(user.id), user: toUser(user) });
});

router.post('/login', (req, res) => {
  const body = req.body || {};
  const email = cleanEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return sendError(res, 401, 'invalid_credentials', 'Email or password is incorrect.');
  }

  res.json({ access_token: createToken(user.id), user: toUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: toUser(req.user) });
});

module.exports = router;

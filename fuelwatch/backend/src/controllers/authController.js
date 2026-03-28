const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');
const { newId, now } = require('../utils/helpers');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email is already registered.' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const id = newId();
  const ts = now();

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'user', 1, ?, ?)
  `).run(id, name, email, password_hash, ts, ts);

  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
  const token = signToken(user);

  return res.status(201).json({ user, token });
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = signToken(user);
  return res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  });
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };

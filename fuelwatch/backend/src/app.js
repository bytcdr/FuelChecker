require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

// Initialise Passport strategies (registers Google, Facebook, Apple if configured)
const passport = require('./config/passport');

const app = express();

// CORS — must be before session / passport
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Session — required for the OAuth redirect handshake only; not used after JWT is issued
app.use(session({
  secret: process.env.SESSION_SECRET || 'fuelwatch_session_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 10 * 60 * 1000 }, // 10-min window for OAuth dance
}));

// Passport initialisation
app.use(passport.initialize());
app.use(passport.session());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded proof images statically
const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'FuelWatch API' }));

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use(errorHandler);

module.exports = app;

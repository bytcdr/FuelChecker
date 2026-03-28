const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { register, login, me, oauthSuccess, oauthFailure } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../validators/authValidator');

// ─── Local auth (admin / fallback) ───────────────────────────────────────────
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/me', requireAuth, me);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/failure' }),
  oauthSuccess
);

// ─── Shared failure handler ───────────────────────────────────────────────────
router.get('/failure', oauthFailure);

module.exports = router;

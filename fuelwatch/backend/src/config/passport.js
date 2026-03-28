const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database');
const { newId, now } = require('../utils/helpers');

/**
 * Find an existing user by OAuth provider ID, or by email, or create a new one.
 */
function findOrCreateOAuthUser(provider, providerId, email, displayName) {
  let user = db.prepare(
    'SELECT * FROM users WHERE provider = ? AND provider_id = ?'
  ).get(provider, providerId);

  if (user) return user;

  if (email) {
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (user) {
      db.prepare(
        'UPDATE users SET provider = ?, provider_id = ?, updated_at = ? WHERE id = ?'
      ).run(provider, providerId, now(), user.id);
      return db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    }
  }

  const id = newId();
  const ts = now();
  db.prepare(`
    INSERT INTO users
      (id, name, email, password_hash, role, is_active, provider, provider_id, created_at, updated_at)
    VALUES (?, ?, ?, '', 'user', 1, ?, ?, ?, ?)
  `).run(id, displayName || email || 'User', email || null, provider, providerId, ts, ts);

  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

// ─── Google ──────────────────────────────────────────────────────────────────
// Guard against double-registration (can happen if module is required from multiple files)
const isGoogleRegistered = passport._strategies && passport._strategies['google'];

if (!isGoogleRegistered && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id') {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || null;
        const user = findOrCreateOAuthUser('google', profile.id, email, profile.displayName);
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  ));
  console.log('[Auth] Google OAuth strategy registered.');
} else if (isGoogleRegistered) {
  // already registered — skip silently
} else {
  console.warn('[Auth] GOOGLE_CLIENT_ID not set — Google sign-in will not work.');
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  done(null, user || false);
});

module.exports = passport;

/**
 * Find an existing user by OAuth provider ID, or by email, or create a new one.
 * This handles first-time OAuth logins and links accounts by email.
 */
function findOrCreateOAuthUser(provider, providerId, email, displayName) {
  // 1. Try to find by provider + provider_id (fastest, most specific)
  let user = db.prepare(
    'SELECT * FROM users WHERE provider = ? AND provider_id = ?'
  ).get(provider, providerId);

  if (user) return user;

  // 2. Try to find by email (links OAuth to an existing account)
  if (email) {
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (user) {
      // Link this OAuth provider to the existing account
      db.prepare(
        'UPDATE users SET provider = ?, provider_id = ?, updated_at = ? WHERE id = ?'
      ).run(provider, providerId, now(), user.id);
      return db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    }
  }

  // 3. Create a new user
  const id = newId();
  const ts = now();
  db.prepare(`
    INSERT INTO users
      (id, name, email, password_hash, role, is_active, provider, provider_id, created_at, updated_at)
    VALUES (?, ?, ?, '', 'user', 1, ?, ?, ?, ?)
  `).run(id, displayName || email || 'User', email || null, provider, providerId, ts, ts);

  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

// ─── Google ─────────────────────────────────────────────────────────────────

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id') {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || null;
        const user = findOrCreateOAuthUser('google', profile.id, email, profile.displayName);
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  ));
  console.log('[Auth] Google OAuth strategy registered.');
}

// ─── Facebook ────────────────────────────────────────────────────────────────

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_ID !== 'your_facebook_app_id') {
  passport.use(new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'displayName', 'emails'],
    },
    (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || null;
        const user = findOrCreateOAuthUser('facebook', profile.id, email, profile.displayName);
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  ));
  console.log('[Auth] Facebook OAuth strategy registered.');
}

// ─── Apple (optional) ────────────────────────────────────────────────────────
// Only registered if all required Apple env vars are present.

if (
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY_PATH
) {
  let AppleStrategy;
  try {
    AppleStrategy = require('passport-apple');
  } catch {
    console.warn('[Auth] passport-apple not installed. Skipping Apple strategy.');
  }

  if (AppleStrategy) {
    const keyPath = path.resolve(process.env.APPLE_PRIVATE_KEY_PATH);
    const privateKeyString = fs.existsSync(keyPath) ? fs.readFileSync(keyPath, 'utf8') : null;

    if (privateKeyString) {
      passport.use(new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyString,
          callbackURL: process.env.APPLE_CALLBACK_URL,
          passReqToCallback: true,
        },
        (req, _accessToken, _refreshToken, idToken, profile, done) => {
          try {
            // Apple only sends name on first login — read it from the request body
            const firstName = req.body?.user ? JSON.parse(req.body.user)?.name?.firstName : '';
            const lastName  = req.body?.user ? JSON.parse(req.body.user)?.name?.lastName  : '';
            const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Apple User';
            const email = idToken?.email || profile?.email || null;
            const appleId = idToken?.sub || profile?.id;

            const user = findOrCreateOAuthUser('apple', appleId, email, displayName);
            done(null, user);
          } catch (err) {
            done(err);
          }
        }
      ));
      console.log('[Auth] Apple Sign In strategy registered.');
    } else {
      console.warn('[Auth] Apple private key file not found. Skipping Apple strategy.');
    }
  }
}

// Passport session serialization (used only during the OAuth redirect dance)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  done(null, user || false);
});

module.exports = passport;

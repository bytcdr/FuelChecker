const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Middleware: require a valid JWT token.
 * Attaches req.user = { id, name, email, role }
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?').get(payload.id);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User account is inactive or not found.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Middleware: require the authenticated user to have the admin role.
 * Must be used AFTER requireAuth.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

/**
 * Middleware: optionally attach req.user if a valid token is present.
 * Does not block the request if no token is provided.
 */
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?').get(payload.id);
    if (user && user.is_active) req.user = user;
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };

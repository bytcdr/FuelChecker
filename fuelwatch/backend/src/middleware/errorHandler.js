/**
 * Global Express error handler.
 * Must be the last middleware registered in app.js.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.message || err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size exceeds the allowed limit.' });
  }

  // Validation errors from express-validator are handled in controllers, but fallback:
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'An unexpected server error occurred.';

  res.status(status).json({ error: message });
}

module.exports = errorHandler;

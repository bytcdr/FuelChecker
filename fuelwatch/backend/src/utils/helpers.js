const { v4: uuidv4 } = require('uuid');

/**
 * Format a date value to ISO string for SQLite storage.
 */
function toISOString(date = new Date()) {
  return new Date(date).toISOString();
}

/**
 * Generate a new UUID v4.
 */
function newId() {
  return uuidv4();
}

/**
 * Return current UTC datetime as ISO string.
 */
function now() {
  return new Date().toISOString();
}

/**
 * Check if a date string is older than N days.
 */
function isOlderThanDays(dateStr, days) {
  const date = new Date(dateStr);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date < cutoff;
}

/**
 * Calculate minutes elapsed since a date string.
 */
function minutesSince(dateStr) {
  return (Date.now() - new Date(dateStr).getTime()) / 60000;
}

module.exports = { toISOString, newId, now, isOlderThanDays, minutesSince };

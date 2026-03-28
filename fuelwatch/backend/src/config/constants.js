module.exports = {
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
  },
  SUBMISSION_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },
  REPORT_STATUS: {
    OPEN: 'open',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed',
  },
  DEFAULT_FUEL_PRODUCTS: [
    'Unleaded',
    'Premium',
    'Diesel',
    'Diesel Plus',
    'Kerosene',
  ],
  // Prices older than this many days are marked stale
  STALE_PRICE_DAYS: parseInt(process.env.STALE_PRICE_DAYS || '7', 10),
  // Minimum minutes between same-user same-station-product submissions
  SPAM_INTERVAL_MINUTES: parseInt(process.env.SPAM_INTERVAL_MINUTES || '30', 10),
  MAX_FILE_SIZE_BYTES: (parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10)) * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

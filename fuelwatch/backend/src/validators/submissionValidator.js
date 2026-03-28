const { body } = require('express-validator');

const submissionValidator = [
  body('station_id').notEmpty().withMessage('station_id is required.'),
  body('fuel_product_id').notEmpty().withMessage('fuel_product_id is required.'),
  body('submitted_price')
    .isFloat({ gt: 0 })
    .withMessage('submitted_price must be a number greater than 0.'),
  body('observed_at')
    .isISO8601()
    .withMessage('observed_at must be a valid ISO 8601 date.')
    .custom((value) => {
      const observed = new Date(value);
      const now = new Date();
      // Allow up to 1 minute in the future to account for clock skew
      const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);
      if (observed > oneMinuteFromNow) {
        throw new Error('observed_at cannot be in the future.');
      }
      return true;
    }),
];

module.exports = { submissionValidator };

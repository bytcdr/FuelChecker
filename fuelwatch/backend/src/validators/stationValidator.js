const { body } = require('express-validator');

const stationValidator = [
  body('name').trim().notEmpty().withMessage('Station name is required.'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required.'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required.'),
];

module.exports = { stationValidator };

const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/stations', require('./stations'));
router.use('/fuel-products', require('./fuelProducts'));
router.use('/submissions', require('./submissions'));
router.use('/prices', require('./prices'));
router.use('/reports', require('./reports'));
router.use('/admin', require('./admin'));

module.exports = router;

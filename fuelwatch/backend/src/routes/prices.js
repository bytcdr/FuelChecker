const express = require('express');
const router = express.Router();
const { getPricesByStation, getRecentHistory } = require('../controllers/priceController');

router.get('/station/:stationId', getPricesByStation);
router.get('/station/:stationId/history', getRecentHistory);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getStations, getStation, createStation, updateStation, deactivateStation, getBrands, getBarangays,
} = require('../controllers/stationController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { stationValidator } = require('../validators/stationValidator');

router.get('/', getStations);
router.get('/meta/brands', getBrands);
router.get('/meta/barangays', getBarangays);
router.get('/:id', getStation);
router.post('/', requireAuth, requireAdmin, stationValidator, createStation);
router.put('/:id', requireAuth, requireAdmin, updateStation);
router.delete('/:id', requireAuth, requireAdmin, deactivateStation);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getStations, getStation, getBrands, getCities, getBarangays,
  submitStation, getMyStationSubmissions,
  getPendingStations, getAllStationsAdmin, approveStation, rejectStation,
  createStation, updateStation, deactivateStation,
} = require('../controllers/stationController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { stationValidator } = require('../validators/stationValidator');

// ── Specific routes must come BEFORE /:id wildcard ───────────────────────────

// Public meta
router.get('/meta/brands',       getBrands);
router.get('/meta/cities',       getCities);
router.get('/meta/barangays',    getBarangays);

// Authenticated user — specific paths before /:id
router.post('/submit',           requireAuth, stationValidator, submitStation);
router.get('/my/submissions',    requireAuth, getMyStationSubmissions);

// Admin — specific paths before /:id
router.get('/admin/all',         requireAuth, requireAdmin, getAllStationsAdmin);
router.get('/admin/pending',     requireAuth, requireAdmin, getPendingStations);

// ── Wildcard / parameterised routes ──────────────────────────────────────────

// Public list & detail
router.get('/',                  getStations);
router.get('/:id',               getStation);

// Admin CRUD (approve/reject have extra segment so no collision)
router.put('/:id/approve',       requireAuth, requireAdmin, approveStation);
router.put('/:id/reject',        requireAuth, requireAdmin, rejectStation);
router.post('/',                 requireAuth, requireAdmin, stationValidator, createStation);
router.put('/:id',               requireAuth, requireAdmin, updateStation);
router.delete('/:id',            requireAuth, requireAdmin, deactivateStation);

module.exports = router;

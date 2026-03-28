const express = require('express');
const router = express.Router();
const { getFuelProducts, getAllFuelProducts, createFuelProduct, updateFuelProduct } = require('../controllers/fuelProductController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', getFuelProducts);
router.get('/all', requireAuth, requireAdmin, getAllFuelProducts);
router.post('/', requireAuth, requireAdmin, createFuelProduct);
router.put('/:id', requireAuth, requireAdmin, updateFuelProduct);

module.exports = router;

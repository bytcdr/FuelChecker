const express = require('express');
const router = express.Router();
const { getDashboard, getUsers, updateUser } = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth, requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);

module.exports = router;

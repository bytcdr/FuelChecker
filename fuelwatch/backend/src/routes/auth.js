const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../validators/authValidator');

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/me', requireAuth, me);

module.exports = router;

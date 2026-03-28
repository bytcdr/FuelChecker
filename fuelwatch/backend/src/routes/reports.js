const express = require('express');
const router = express.Router();
const { createReport, getReports, updateReportStatus } = require('../controllers/reportController');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, createReport);
router.get('/', requireAuth, requireAdmin, getReports);
router.put('/:id/status', requireAuth, requireAdmin, updateReportStatus);

module.exports = router;

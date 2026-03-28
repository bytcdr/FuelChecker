const express = require('express');
const router = express.Router();
const {
  getMySubmissions,
  submitPrice,
  getPendingSubmissions,
  getAllSubmissions,
  approveSubmission,
  rejectSubmission,
  editAndApproveSubmission,
} = require('../controllers/submissionController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { submissionValidator } = require('../validators/submissionValidator');
const upload = require('../middleware/upload');

router.get('/my', requireAuth, getMySubmissions);
router.post('/', requireAuth, upload.single('proof_image'), submissionValidator, submitPrice);
router.get('/pending', requireAuth, requireAdmin, getPendingSubmissions);
router.get('/', requireAuth, requireAdmin, getAllSubmissions);
router.put('/:id/approve', requireAuth, requireAdmin, approveSubmission);
router.put('/:id/reject', requireAuth, requireAdmin, rejectSubmission);
router.put('/:id/edit', requireAuth, requireAdmin, editAndApproveSubmission);

module.exports = router;

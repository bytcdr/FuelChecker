const { validationResult } = require('express-validator');
const db = require('../config/database');
const { newId, now, minutesSince } = require('../utils/helpers');
const { SUBMISSION_STATUS, SPAM_INTERVAL_MINUTES } = require('../config/constants');

function getMySubmissions(req, res) {
  const submissions = db.prepare(`
    SELECT ps.*, s.name AS station_name, fp.name AS product_name
    FROM price_submissions ps
    JOIN stations s ON ps.station_id = s.id
    JOIN fuel_products fp ON ps.fuel_product_id = fp.id
    WHERE ps.submitted_by = ?
    ORDER BY ps.created_at DESC
    LIMIT 100
  `).all(req.user.id);

  return res.json({ submissions });
}

function submitPrice(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { station_id, fuel_product_id, submitted_price, observed_at, notes } = req.body;

  // Verify station and product exist
  const station = db.prepare('SELECT id FROM stations WHERE id = ? AND is_active = 1').get(station_id);
  if (!station) {
    return res.status(400).json({ error: 'Station not found or inactive.' });
  }

  const product = db.prepare('SELECT id FROM fuel_products WHERE id = ? AND is_active = 1').get(fuel_product_id);
  if (!product) {
    return res.status(400).json({ error: 'Fuel product not found or inactive.' });
  }

  const submitterId = req.user ? req.user.id : null;

  // Spam prevention applies only to logged-in users
  if (submitterId) {
    const recent = db.prepare(`
      SELECT created_at FROM price_submissions
      WHERE submitted_by = ? AND station_id = ? AND fuel_product_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(submitterId, station_id, fuel_product_id);

    if (recent && minutesSince(recent.created_at) < SPAM_INTERVAL_MINUTES) {
      return res.status(429).json({
        error: `Please wait ${SPAM_INTERVAL_MINUTES} minutes before submitting again for the same station and fuel product.`,
      });
    }
  }

  const proof_image_path = req.file ? `/uploads/${req.file.filename}` : null;
  const id = newId();
  const ts = now();

  db.prepare(`
    INSERT INTO price_submissions
      (id, station_id, fuel_product_id, submitted_price, observed_at, submitted_by, proof_image_path, notes, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(id, station_id, fuel_product_id, submitted_price, observed_at, submitterId, proof_image_path, notes || null, ts, ts);

  const submission = db.prepare('SELECT * FROM price_submissions WHERE id = ?').get(id);
  return res.status(201).json({ submission });
}

function getPendingSubmissions(req, res) {
  const submissions = db.prepare(`
    SELECT ps.*, s.name AS station_name, s.brand AS station_brand,
           fp.name AS product_name, u.name AS submitter_name, u.email AS submitter_email
    FROM price_submissions ps
    JOIN stations s ON ps.station_id = s.id
    JOIN fuel_products fp ON ps.fuel_product_id = fp.id
    LEFT JOIN users u ON ps.submitted_by = u.id
    WHERE ps.status = 'pending'
    ORDER BY ps.created_at ASC
  `).all();

  return res.json({ submissions });
}

function getAllSubmissions(req, res) {
  const { status, station_id } = req.query;
  let query = `
    SELECT ps.*, s.name AS station_name, s.brand AS station_brand,
           fp.name AS product_name, u.name AS submitter_name, u.email AS submitter_email
    FROM price_submissions ps
    JOIN stations s ON ps.station_id = s.id
    JOIN fuel_products fp ON ps.fuel_product_id = fp.id
    LEFT JOIN users u ON ps.submitted_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) { query += ' AND ps.status = ?'; params.push(status); }
  if (station_id) { query += ' AND ps.station_id = ?'; params.push(station_id); }

  query += ' ORDER BY ps.created_at DESC LIMIT 200';

  const submissions = db.prepare(query).all(...params);
  return res.json({ submissions });
}

function approveSubmission(req, res) {
  const submission = db.prepare('SELECT * FROM price_submissions WHERE id = ?').get(req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found.' });
  }
  if (submission.status !== SUBMISSION_STATUS.PENDING) {
    return res.status(400).json({ error: 'Only pending submissions can be approved.' });
  }

  const ts = now();

  // Approve the submission
  db.prepare(`
    UPDATE price_submissions SET
      status = 'approved', moderated_by = ?, moderated_at = ?, updated_at = ?
    WHERE id = ?
  `).run(req.user.id, ts, ts, submission.id);

  // Upsert displayed_prices for this station+product
  const existing = db.prepare(
    'SELECT id FROM displayed_prices WHERE station_id = ? AND fuel_product_id = ?'
  ).get(submission.station_id, submission.fuel_product_id);

  if (existing) {
    db.prepare(`
      UPDATE displayed_prices SET
        price_submission_id = ?, current_price = ?, effective_at = ?, is_stale = 0, updated_at = ?
      WHERE id = ?
    `).run(submission.id, submission.submitted_price, submission.observed_at, ts, existing.id);
  } else {
    db.prepare(`
      INSERT INTO displayed_prices
        (id, station_id, fuel_product_id, price_submission_id, current_price, effective_at, is_stale, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(newId(), submission.station_id, submission.fuel_product_id, submission.id, submission.submitted_price, submission.observed_at, ts, ts);
  }

  const updated = db.prepare('SELECT * FROM price_submissions WHERE id = ?').get(submission.id);
  return res.json({ submission: updated, message: 'Submission approved.' });
}

function rejectSubmission(req, res) {
  const submission = db.prepare('SELECT * FROM price_submissions WHERE id = ?').get(req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found.' });
  }
  if (submission.status !== SUBMISSION_STATUS.PENDING) {
    return res.status(400).json({ error: 'Only pending submissions can be rejected.' });
  }

  const { moderation_notes } = req.body;
  const ts = now();

  db.prepare(`
    UPDATE price_submissions SET
      status = 'rejected', moderation_notes = ?, moderated_by = ?, moderated_at = ?, updated_at = ?
    WHERE id = ?
  `).run(moderation_notes || null, req.user.id, ts, ts, submission.id);

  const updated = db.prepare('SELECT * FROM price_submissions WHERE id = ?').get(submission.id);
  return res.json({ submission: updated, message: 'Submission rejected.' });
}

function editAndApproveSubmission(req, res) {
  const submission = db.prepare('SELECT * FROM price_submissions WHERE id = ?').get(req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found.' });
  }

  const { submitted_price, observed_at, moderation_notes } = req.body;
  const ts = now();

  // Update submission fields and approve
  db.prepare(`
    UPDATE price_submissions SET
      submitted_price = COALESCE(?, submitted_price),
      observed_at = COALESCE(?, observed_at),
      moderation_notes = COALESCE(?, moderation_notes),
      status = 'approved',
      moderated_by = ?, moderated_at = ?, updated_at = ?
    WHERE id = ?
  `).run(submitted_price ?? null, observed_at ?? null, moderation_notes ?? null, req.user.id, ts, ts, submission.id);

  const updated = db.prepare('SELECT * FROM price_submissions WHERE id = ?').get(submission.id);

  // Upsert displayed_prices
  const existing = db.prepare(
    'SELECT id FROM displayed_prices WHERE station_id = ? AND fuel_product_id = ?'
  ).get(submission.station_id, submission.fuel_product_id);

  const finalPrice = updated.submitted_price;
  const finalDate = updated.observed_at;

  if (existing) {
    db.prepare(`
      UPDATE displayed_prices SET
        price_submission_id = ?, current_price = ?, effective_at = ?, is_stale = 0, updated_at = ?
      WHERE id = ?
    `).run(updated.id, finalPrice, finalDate, ts, existing.id);
  } else {
    db.prepare(`
      INSERT INTO displayed_prices
        (id, station_id, fuel_product_id, price_submission_id, current_price, effective_at, is_stale, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(newId(), submission.station_id, submission.fuel_product_id, updated.id, finalPrice, finalDate, ts, ts);
  }

  return res.json({ submission: updated, message: 'Submission edited and approved.' });
}

module.exports = {
  getMySubmissions,
  submitPrice,
  getPendingSubmissions,
  getAllSubmissions,
  approveSubmission,
  rejectSubmission,
  editAndApproveSubmission,
};

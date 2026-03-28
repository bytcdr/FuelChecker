const db = require('../config/database');
const { newId, now } = require('../utils/helpers');

function createReport(req, res) {
  const { station_id, price_submission_id, reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Reason is required.' });
  }
  if (!station_id && !price_submission_id) {
    return res.status(400).json({ error: 'station_id or price_submission_id is required.' });
  }

  const id = newId();
  const ts = now();
  const reported_by = req.user ? req.user.id : null;

  db.prepare(`
    INSERT INTO reports (id, station_id, price_submission_id, reported_by, reason, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
  `).run(id, station_id || null, price_submission_id || null, reported_by, reason.trim(), ts, ts);

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
  return res.status(201).json({ report });
}

function getReports(req, res) {
  const { status } = req.query;
  let query = `
    SELECT r.*, s.name AS station_name, u.name AS reporter_name
    FROM reports r
    LEFT JOIN stations s ON r.station_id = s.id
    LEFT JOIN users u ON r.reported_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) { query += ' AND r.status = ?'; params.push(status); }

  query += ' ORDER BY r.created_at DESC';

  const reports = db.prepare(query).all(...params);
  return res.json({ reports });
}

function updateReportStatus(req, res) {
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  const { status } = req.body;
  const allowed = ['open', 'resolved', 'dismissed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  db.prepare('UPDATE reports SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, now(), req.params.id);

  const updated = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  return res.json({ report: updated });
}

module.exports = { createReport, getReports, updateReportStatus };

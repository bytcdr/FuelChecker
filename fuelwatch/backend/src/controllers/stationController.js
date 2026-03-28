const { validationResult } = require('express-validator');
const db = require('../config/database');
const { newId, now } = require('../utils/helpers');

// ─── Public ──────────────────────────────────────────────────────────────────

function getStations(req, res) {
  const { search, brand, barangay } = req.query;

  let query = "SELECT * FROM stations WHERE is_active = 1 AND status = 'approved'";
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR brand LIKE ? OR barangay LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (brand)    { query += ' AND brand = ?';    params.push(brand); }
  if (barangay) { query += ' AND barangay = ?'; params.push(barangay); }

  query += ' ORDER BY name ASC';
  return res.json({ stations: db.prepare(query).all(...params) });
}

function getStation(req, res) {
  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
  if (!station) return res.status(404).json({ error: 'Station not found.' });
  return res.json({ station });
}

function getBrands(req, res) {
  const brands = db.prepare(
    "SELECT DISTINCT brand FROM stations WHERE is_active = 1 AND status = 'approved' AND brand IS NOT NULL ORDER BY brand"
  ).all().map((r) => r.brand);
  return res.json({ brands });
}

function getBarangays(req, res) {
  const barangays = db.prepare(
    "SELECT DISTINCT barangay FROM stations WHERE is_active = 1 AND status = 'approved' AND barangay IS NOT NULL ORDER BY barangay"
  ).all().map((r) => r.barangay);
  return res.json({ barangays });
}

// ─── User: submit a new station for approval ─────────────────────────────────

function submitStation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, brand, address, barangay, city, province, latitude, longitude, notes } = req.body;
  const id = newId();
  const ts = now();

  db.prepare(`
    INSERT INTO stations
      (id, name, brand, address, barangay, city, province, latitude, longitude,
       is_active, status, submitted_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending', ?, ?, ?)
  `).run(
    id, name, brand || null, address || null, barangay || null,
    city || 'Tuguegarao', province || 'Cagayan',
    latitude, longitude,
    req.user.id, ts, ts,
  );

  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(id);
  return res.status(201).json({ station, message: 'Station submitted for admin approval.' });
}

function getMyStationSubmissions(req, res) {
  const stations = db.prepare(`
    SELECT * FROM stations WHERE submitted_by = ? ORDER BY created_at DESC
  `).all(req.user.id);
  return res.json({ stations });
}

// ─── Admin: manage all stations ───────────────────────────────────────────────

function getPendingStations(req, res) {
  const stations = db.prepare(`
    SELECT s.*, u.name AS submitter_name, u.email AS submitter_email
    FROM stations s
    LEFT JOIN users u ON s.submitted_by = u.id
    WHERE s.status = 'pending'
    ORDER BY s.created_at ASC
  `).all();
  return res.json({ stations });
}

function getAllStationsAdmin(req, res) {
  const { status } = req.query;
  let query = `
    SELECT s.*, u.name AS submitter_name
    FROM stations s LEFT JOIN users u ON s.submitted_by = u.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND s.status = ?'; params.push(status); }
  query += ' ORDER BY s.created_at DESC';
  return res.json({ stations: db.prepare(query).all(...params) });
}

function approveStation(req, res) {
  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
  if (!station) return res.status(404).json({ error: 'Station not found.' });
  if (station.status !== 'pending') return res.status(400).json({ error: 'Only pending stations can be approved.' });

  db.prepare(`
    UPDATE stations SET status = 'approved', rejection_note = NULL, updated_at = ? WHERE id = ?
  `).run(now(), station.id);

  return res.json({ station: db.prepare('SELECT * FROM stations WHERE id = ?').get(station.id), message: 'Station approved.' });
}

function rejectStation(req, res) {
  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
  if (!station) return res.status(404).json({ error: 'Station not found.' });
  if (station.status !== 'pending') return res.status(400).json({ error: 'Only pending stations can be rejected.' });

  const { rejection_note } = req.body;

  db.prepare(`
    UPDATE stations SET status = 'rejected', rejection_note = ?, updated_at = ? WHERE id = ?
  `).run(rejection_note || null, now(), station.id);

  return res.json({ station: db.prepare('SELECT * FROM stations WHERE id = ?').get(station.id), message: 'Station rejected.' });
}

function createStation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, brand, address, barangay, city, province, latitude, longitude } = req.body;
  const id = newId();
  const ts = now();

  db.prepare(`
    INSERT INTO stations
      (id, name, brand, address, barangay, city, province, latitude, longitude, is_active, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'approved', ?, ?)
  `).run(id, name, brand || null, address || null, barangay || null,
    city || 'Tuguegarao', province || 'Cagayan', latitude, longitude, ts, ts);

  return res.status(201).json({ station: db.prepare('SELECT * FROM stations WHERE id = ?').get(id) });
}

function updateStation(req, res) {
  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
  if (!station) return res.status(404).json({ error: 'Station not found.' });

  const { name, brand, address, barangay, city, province, latitude, longitude, is_active, status } = req.body;

  // Convert boolean is_active to SQLite integer (better-sqlite3 rejects JS booleans)
  const isActiveInt = is_active !== undefined && is_active !== null ? (is_active ? 1 : 0) : null;

  db.prepare(`
    UPDATE stations SET
      name = COALESCE(?, name), brand = COALESCE(?, brand), address = COALESCE(?, address),
      barangay = COALESCE(?, barangay), city = COALESCE(?, city), province = COALESCE(?, province),
      latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude),
      is_active = COALESCE(?, is_active), status = COALESCE(?, status),
      updated_at = ?
    WHERE id = ?
  `).run(
    name ?? null, brand ?? null, address ?? null, barangay ?? null,
    city ?? null, province ?? null, latitude ?? null, longitude ?? null,
    isActiveInt, status ?? null, now(), req.params.id,
  );

  return res.json({ station: db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id) });
}

function deactivateStation(req, res) {
  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
  if (!station) return res.status(404).json({ error: 'Station not found.' });
  db.prepare('UPDATE stations SET is_active = 0, updated_at = ? WHERE id = ?').run(now(), req.params.id);
  return res.json({ message: 'Station deactivated.' });
}

module.exports = {
  getStations, getStation, getBrands, getBarangays,
  submitStation, getMyStationSubmissions,
  getPendingStations, getAllStationsAdmin, approveStation, rejectStation,
  createStation, updateStation, deactivateStation,
};

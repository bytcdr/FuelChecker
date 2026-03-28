const { validationResult } = require('express-validator');
const db = require('../config/database');
const { newId, now } = require('../utils/helpers');

function getStations(req, res) {
  const { search, brand, barangay } = req.query;

  let query = 'SELECT * FROM stations WHERE is_active = 1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR brand LIKE ? OR barangay LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (brand) {
    query += ' AND brand = ?';
    params.push(brand);
  }
  if (barangay) {
    query += ' AND barangay = ?';
    params.push(barangay);
  }

  query += ' ORDER BY name ASC';
  const stations = db.prepare(query).all(...params);
  return res.json({ stations });
}

function getStation(req, res) {
  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
  if (!station) {
    return res.status(404).json({ error: 'Station not found.' });
  }
  return res.json({ station });
}

function createStation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, brand, address, barangay, city, province, latitude, longitude } = req.body;
  const id = newId();
  const ts = now();

  db.prepare(`
    INSERT INTO stations (id, name, brand, address, barangay, city, province, latitude, longitude, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    id, name, brand || null, address || null, barangay || null,
    city || 'Tuguegarao', province || 'Cagayan',
    latitude, longitude, ts, ts,
  );

  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(id);
  return res.status(201).json({ station });
}

function updateStation(req, res) {
  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
  if (!station) {
    return res.status(404).json({ error: 'Station not found.' });
  }

  const { name, brand, address, barangay, city, province, latitude, longitude, is_active } = req.body;

  db.prepare(`
    UPDATE stations SET
      name = COALESCE(?, name),
      brand = COALESCE(?, brand),
      address = COALESCE(?, address),
      barangay = COALESCE(?, barangay),
      city = COALESCE(?, city),
      province = COALESCE(?, province),
      latitude = COALESCE(?, latitude),
      longitude = COALESCE(?, longitude),
      is_active = COALESCE(?, is_active),
      updated_at = ?
    WHERE id = ?
  `).run(
    name ?? null, brand ?? null, address ?? null, barangay ?? null,
    city ?? null, province ?? null, latitude ?? null, longitude ?? null,
    is_active ?? null, now(), req.params.id,
  );

  const updated = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
  return res.json({ station: updated });
}

function deactivateStation(req, res) {
  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
  if (!station) {
    return res.status(404).json({ error: 'Station not found.' });
  }

  db.prepare('UPDATE stations SET is_active = 0, updated_at = ? WHERE id = ?')
    .run(now(), req.params.id);

  return res.json({ message: 'Station deactivated.' });
}

function getBrands(req, res) {
  const brands = db.prepare(
    "SELECT DISTINCT brand FROM stations WHERE is_active = 1 AND brand IS NOT NULL ORDER BY brand"
  ).all().map((r) => r.brand);
  return res.json({ brands });
}

function getBarangays(req, res) {
  const barangays = db.prepare(
    "SELECT DISTINCT barangay FROM stations WHERE is_active = 1 AND barangay IS NOT NULL ORDER BY barangay"
  ).all().map((r) => r.barangay);
  return res.json({ barangays });
}

module.exports = { getStations, getStation, createStation, updateStation, deactivateStation, getBrands, getBarangays };

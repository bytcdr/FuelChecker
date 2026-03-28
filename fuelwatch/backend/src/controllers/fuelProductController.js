const { validationResult } = require('express-validator');
const { body } = require('express-validator');
const db = require('../config/database');
const { newId, now } = require('../utils/helpers');

function getFuelProducts(req, res) {
  const products = db.prepare('SELECT * FROM fuel_products WHERE is_active = 1 ORDER BY name').all();
  return res.json({ fuel_products: products });
}

function getAllFuelProducts(req, res) {
  const products = db.prepare('SELECT * FROM fuel_products ORDER BY name').all();
  return res.json({ fuel_products: products });
}

function createFuelProduct(req, res) {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required.' });
  }

  const existing = db.prepare('SELECT id FROM fuel_products WHERE name = ?').get(name.trim());
  if (existing) {
    return res.status(409).json({ error: 'Fuel product already exists.' });
  }

  const id = newId();
  const ts = now();
  db.prepare('INSERT INTO fuel_products (id, name, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?)')
    .run(id, name.trim(), ts, ts);

  const product = db.prepare('SELECT * FROM fuel_products WHERE id = ?').get(id);
  return res.status(201).json({ fuel_product: product });
}

function updateFuelProduct(req, res) {
  const product = db.prepare('SELECT * FROM fuel_products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Fuel product not found.' });
  }

  const { name, is_active } = req.body;

  db.prepare(`
    UPDATE fuel_products SET
      name = COALESCE(?, name),
      is_active = COALESCE(?, is_active),
      updated_at = ?
    WHERE id = ?
  `).run(name ?? null, is_active ?? null, now(), req.params.id);

  const updated = db.prepare('SELECT * FROM fuel_products WHERE id = ?').get(req.params.id);
  return res.json({ fuel_product: updated });
}

module.exports = { getFuelProducts, getAllFuelProducts, createFuelProduct, updateFuelProduct };

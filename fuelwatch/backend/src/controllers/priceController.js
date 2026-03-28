const db = require('../config/database');
const { isOlderThanDays } = require('../utils/helpers');
const { STALE_PRICE_DAYS } = require('../config/constants');

function getPricesByStation(req, res) {
  const { stationId } = req.params;

  const station = db.prepare('SELECT id FROM stations WHERE id = ?').get(stationId);
  if (!station) {
    return res.status(404).json({ error: 'Station not found.' });
  }

  const prices = db.prepare(`
    SELECT dp.*, fp.name AS product_name, ps.observed_at, ps.submitted_price,
           ps.notes AS submission_notes
    FROM displayed_prices dp
    JOIN fuel_products fp ON dp.fuel_product_id = fp.id
    JOIN price_submissions ps ON dp.price_submission_id = ps.id
    WHERE dp.station_id = ?
    ORDER BY fp.name ASC
  `).all(stationId);

  // Refresh stale flags based on current threshold
  const updatedPrices = prices.map((p) => ({
    ...p,
    is_stale: isOlderThanDays(p.effective_at, STALE_PRICE_DAYS) ? 1 : 0,
  }));

  return res.json({ prices: updatedPrices });
}

function getRecentHistory(req, res) {
  const { stationId } = req.params;
  const { product_id } = req.query;

  let query = `
    SELECT ps.*, fp.name AS product_name, u.name AS submitter_name
    FROM price_submissions ps
    JOIN fuel_products fp ON ps.fuel_product_id = fp.id
    LEFT JOIN users u ON ps.submitted_by = u.id
    WHERE ps.station_id = ? AND ps.status = 'approved'
  `;
  const params = [stationId];

  if (product_id) {
    query += ' AND ps.fuel_product_id = ?';
    params.push(product_id);
  }

  query += ' ORDER BY ps.observed_at DESC LIMIT 30';

  const history = db.prepare(query).all(...params);
  return res.json({ history });
}

module.exports = { getPricesByStation, getRecentHistory };

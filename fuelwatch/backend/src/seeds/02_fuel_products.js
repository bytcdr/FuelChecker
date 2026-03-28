const db = require('../config/database');
const { newId, now } = require('../utils/helpers');
const { DEFAULT_FUEL_PRODUCTS } = require('../config/constants');

function seedFuelProducts() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO fuel_products (id, name, is_active, created_at, updated_at)
    VALUES (?, ?, 1, ?, ?)
  `);

  for (const name of DEFAULT_FUEL_PRODUCTS) {
    insert.run(newId(), name, now(), now());
  }

  console.log(`  Inserted ${DEFAULT_FUEL_PRODUCTS.length} fuel products.`);
}

module.exports = seedFuelProducts;

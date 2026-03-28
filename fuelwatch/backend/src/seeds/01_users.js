const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { newId, now } = require('../utils/helpers');

async function seedUsers() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@fuelwatch.local');
  if (existing) {
    console.log('  Admin user already exists, skipping.');
    return;
  }

  const passwordHash = await bcrypt.hash('admin1234', 10);

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(newId(), 'FuelWatch Admin', 'admin@fuelwatch.local', passwordHash, 'admin', now(), now());

  console.log('  Created admin user: admin@fuelwatch.local / admin1234');
}

module.exports = seedUsers;

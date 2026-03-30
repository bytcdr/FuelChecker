const db = require('../config/database');

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    is_active INTEGER NOT NULL DEFAULT 1,
    provider TEXT,
    provider_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    address TEXT,
    barangay TEXT,
    city TEXT,
    province TEXT NOT NULL DEFAULT 'Philippines',
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'approved',
    submitted_by TEXT,
    rejection_note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS fuel_products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS price_submissions (
    id TEXT PRIMARY KEY,
    station_id TEXT NOT NULL,
    fuel_product_id TEXT NOT NULL,
    submitted_price REAL NOT NULL,
    observed_at TEXT NOT NULL,
    submitted_by TEXT,
    proof_image_path TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    moderation_notes TEXT,
    moderated_by TEXT,
    moderated_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (station_id) REFERENCES stations(id),
    FOREIGN KEY (fuel_product_id) REFERENCES fuel_products(id),
    FOREIGN KEY (submitted_by) REFERENCES users(id),
    FOREIGN KEY (moderated_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS displayed_prices (
    id TEXT PRIMARY KEY,
    station_id TEXT NOT NULL,
    fuel_product_id TEXT NOT NULL,
    price_submission_id TEXT NOT NULL,
    current_price REAL NOT NULL,
    effective_at TEXT NOT NULL,
    is_stale INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (station_id) REFERENCES stations(id),
    FOREIGN KEY (fuel_product_id) REFERENCES fuel_products(id),
    FOREIGN KEY (price_submission_id) REFERENCES price_submissions(id),
    UNIQUE(station_id, fuel_product_id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    station_id TEXT,
    price_submission_id TEXT,
    reported_by TEXT,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (station_id) REFERENCES stations(id),
    FOREIGN KEY (price_submission_id) REFERENCES price_submissions(id),
    FOREIGN KEY (reported_by) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_submissions_station ON price_submissions(station_id);
  CREATE INDEX IF NOT EXISTS idx_submissions_status ON price_submissions(status);
  CREATE INDEX IF NOT EXISTS idx_submissions_user ON price_submissions(submitted_by);
  CREATE INDEX IF NOT EXISTS idx_displayed_station ON displayed_prices(station_id);
  CREATE INDEX IF NOT EXISTS idx_stations_active ON stations(is_active);
`;

function runMigrations() {
  db.exec(schema);

  // Additive migrations for existing databases — safe to run repeatedly
  const addColumns = [
    "ALTER TABLE users ADD COLUMN provider TEXT",
    "ALTER TABLE users ADD COLUMN provider_id TEXT",
    "ALTER TABLE stations ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'",
    "ALTER TABLE stations ADD COLUMN submitted_by TEXT",
    "ALTER TABLE stations ADD COLUMN rejection_note TEXT",
  ];
  for (const sql of addColumns) {
    try { db.exec(sql); } catch { /* column already exists */ }
  }

  // Widen city/province columns to allow NULL (SQLite requires table recreation)
  const cityInfo = db.prepare("PRAGMA table_info(stations)").all();
  const cityCol  = cityInfo.find((c) => c.name === 'city');
  if (cityCol && cityCol.notnull === 1) {
    db.exec(`
      PRAGMA foreign_keys=OFF;
      BEGIN;
      CREATE TABLE stations_migrated (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        brand        TEXT,
        address      TEXT,
        barangay     TEXT,
        city         TEXT,
        province     TEXT NOT NULL DEFAULT 'Philippines',
        latitude     REAL NOT NULL,
        longitude    REAL NOT NULL,
        is_active    INTEGER NOT NULL DEFAULT 1,
        status       TEXT NOT NULL DEFAULT 'approved',
        submitted_by TEXT,
        rejection_note TEXT,
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO stations_migrated SELECT
        id, name, brand, address, barangay,
        NULLIF(TRIM(city), ''), COALESCE(NULLIF(TRIM(province), ''), 'Philippines'),
        latitude, longitude, is_active, status, submitted_by, rejection_note,
        created_at, updated_at
      FROM stations;
      DROP TABLE stations;
      ALTER TABLE stations_migrated RENAME TO stations;
      CREATE INDEX IF NOT EXISTS idx_stations_active ON stations(is_active);
      COMMIT;
      PRAGMA foreign_keys=ON;
    `);
  }

  console.log('Database migrations applied successfully.');
}

module.exports = { runMigrations };

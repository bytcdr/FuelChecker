/**
 * osm_import.js
 *
 * Fetches all fuel/gas stations in Tuguegarao City from OpenStreetMap
 * via the Overpass API, wipes existing station data, and imports the
 * real-world records as approved stations.
 *
 * Usage:
 *   node src/seeds/osm_import.js
 *
 * Requires network access to https://overpass-api.de
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const db      = require('../config/database');
const { runMigrations } = require('../db/schema');
const { newId, now } = require('../utils/helpers');

// ─── Bounding box for Tuguegarao City (slightly generous) ────────────────────
const BBOX = {
  south: 17.540,
  west:  121.660,
  north: 17.690,
  east:  121.830,
};

// ─── Brand name normalisation ─────────────────────────────────────────────────
const BRAND_MAP = [
  [/petron/i,   'Petron'],
  [/shell/i,    'Shell'],
  [/caltex/i,   'Caltex'],
  [/phoenix/i,  'Phoenix'],
  [/\bptt\b/i,  'PTT'],
  [/flying.?v/i,'Flying V'],
  [/seaoil/i,   'Seaoil'],
  [/jetti/i,    'Jetti'],
  [/total/i,    'Total'],
  [/unioil/i,   'Unioil'],
  [/clean.?fuel/i, 'Clean Fuel'],
  [/duramax/i,  'Duramax'],
];

function normaliseBrand(raw) {
  if (!raw) return null;
  for (const [re, canonical] of BRAND_MAP) {
    if (re.test(raw)) return canonical;
  }
  // Return the raw brand capitalised if it's reasonably short
  return raw.length <= 30 ? raw : null;
}

function detectBrand(tags) {
  return normaliseBrand(tags.brand)
      || normaliseBrand(tags.operator)
      || normaliseBrand(tags.name)
      || null;
}

// ─── Build a human-readable address from OSM tags ────────────────────────────
function buildAddress(tags) {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'] || tags['addr:road'],
  ].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

function buildBarangay(tags) {
  return tags['addr:suburb']
      || tags['addr:village']
      || tags['addr:neighbourhood']
      || tags['addr:quarter']
      || null;
}

// ─── Overpass query ───────────────────────────────────────────────────────────
function buildQuery() {
  const { south, west, north, east } = BBOX;
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:60];
(
  node["amenity"="fuel"](${bbox});
  way["amenity"="fuel"](${bbox});
  relation["amenity"="fuel"](${bbox});
);
out center tags;`;
}

async function fetchOSM() {
  const query = buildQuery();
  const url   = 'https://overpass-api.de/api/interpreter';

  console.log('\n[OSM] Querying Overpass API …');
  console.log(`[OSM] Bounding box: ${BBOX.south},${BBOX.west} → ${BBOX.north},${BBOX.east}`);

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    throw new Error(`Overpass API returned ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  return json.elements || [];
}

// ─── Parse OSM element → station row ─────────────────────────────────────────
function parseElement(el) {
  const tags = el.tags || {};

  // Coordinates: nodes have lat/lon directly; ways/relations expose a center
  const lat = el.lat  ?? el.center?.lat;
  const lon = el.lon  ?? el.center?.lon;

  if (!lat || !lon) return null;           // skip if no position
  if (tags.access === 'private') return null; // skip private stations

  const name = tags.name || tags['name:en'] || null;
  if (!name) return null;                  // skip unnamed features

  return {
    osm_id:   `${el.type}/${el.id}`,
    name,
    brand:    detectBrand(tags),
    address:  buildAddress(tags),
    barangay: buildBarangay(tags),
    city:     tags['addr:city'] || 'Tuguegarao',
    province: tags['addr:province'] || 'Cagayan',
    latitude:  lat,
    longitude: lon,
  };
}

// ─── Database operations ──────────────────────────────────────────────────────
function clearExistingStations() {
  console.log('\n[DB] Clearing existing station data …');
  // Delete in FK-safe order
  db.exec("DELETE FROM displayed_prices");
  db.exec("DELETE FROM price_submissions");
  db.exec("DELETE FROM reports WHERE station_id IS NOT NULL");
  db.exec("DELETE FROM stations");
  console.log('[DB] Cleared: displayed_prices, price_submissions, stations.');
}

function importStations(stations) {
  const insert = db.prepare(`
    INSERT INTO stations
      (id, name, brand, address, barangay, city, province,
       latitude, longitude, is_active, status, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'approved', ?, ?)
  `);

  const insertMany = db.transaction((rows) => {
    for (const s of rows) {
      insert.run(
        newId(), s.name, s.brand, s.address, s.barangay,
        s.city, s.province, s.latitude, s.longitude,
        now(), now(),
      );
    }
  });

  insertMany(stations);
  console.log(`[DB] Inserted ${stations.length} stations.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  FuelWatch — OpenStreetMap Station Import');
  console.log('═══════════════════════════════════════════════════════');

  runMigrations();

  let elements;
  try {
    elements = await fetchOSM();
  } catch (err) {
    console.error('\n[Error] Failed to fetch from Overpass API:', err.message);
    console.error('Make sure you have internet access and try again.');
    process.exit(1);
  }

  console.log(`[OSM] Retrieved ${elements.length} raw element(s).`);

  const stations = elements.map(parseElement).filter(Boolean);
  console.log(`[OSM] ${stations.length} valid station(s) after filtering.`);

  if (stations.length === 0) {
    console.warn('[Warning] No stations found. The database will NOT be cleared.');
    process.exit(0);
  }

  // Preview
  console.log('\n[Preview] First 10 stations:');
  stations.slice(0, 10).forEach((s, i) =>
    console.log(`  ${i + 1}. ${s.name.padEnd(40)} ${s.brand || '—'} (${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)})`),
  );
  if (stations.length > 10) console.log(`  … and ${stations.length - 10} more.`);

  clearExistingStations();
  importStations(stations);

  console.log('\n✅  Import complete!');
  console.log(`    ${stations.length} fuel station(s) imported from OpenStreetMap.`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});

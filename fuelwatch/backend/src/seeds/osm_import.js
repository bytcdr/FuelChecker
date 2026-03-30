/**
 * osm_import.js
 *
 * Fetches all fuel/gas stations in Regions I, II, III and CAR (Northern &
 * Central Luzon) from OpenStreetMap via the Overpass API, wipes existing
 * station data, and imports the real-world records as approved stations.
 *
 * Coverage:
 *   Region I   (Ilocos)         – Ilocos Norte, Ilocos Sur, La Union, Pangasinan
 *   Region II  (Cagayan Valley) – Batanes, Cagayan, Isabela, Nueva Vizcaya, Quirino
 *   Region III (Central Luzon)  – Aurora, Bataan, Bulacan, Nueva Ecija, Pampanga,
 *                                  Tarlac, Zambales
 *   CAR        (Cordillera)     – Abra, Apayao, Benguet, Ifugao, Kalinga,
 *                                  Mountain Province
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

// ─── Bounding box for Regions I, II & CAR (Northern Luzon) ─────────────────
// South: bottom of Pangasinan (Region I); North: Batanes tip (Region II);
// West: Ilocos coast; East: Cagayan/Isabela east coast.
const REGION_BBOXES = [
  { name: 'Regions I, II & CAR', south: 15.5, west: 119.5, north: 20.8, east: 122.6 },
];

// Provinces in scope — used to reject stations whose OSM province tag falls
// outside the three target regions even if they slip inside the bbox.
const ALLOWED_PROVINCES = new Set([
  // Region I – Ilocos
  'ilocos norte', 'ilocos sur', 'la union', 'pangasinan',
  // Region II – Cagayan Valley
  'batanes', 'cagayan', 'isabela', 'nueva vizcaya', 'quirino',
  // CAR – Cordillera Administrative Region
  'abra', 'apayao', 'benguet', 'ifugao', 'kalinga', 'mountain province',
]);

// ─── Brand name normalisation ─────────────────────────────────────────────────
const BRAND_MAP = [
  [/petron/i,        'Petron'],
  [/shell/i,         'Shell'],
  [/caltex/i,        'Caltex'],
  [/phoenix/i,       'Phoenix'],
  [/\bptt\b/i,       'PTT'],
  [/flying.?v/i,     'Flying V'],
  [/seaoil/i,        'Seaoil'],
  [/jetti/i,         'Jetti'],
  [/total/i,         'Total'],
  [/unioil/i,        'Unioil'],
  [/clean.?fuel/i,   'Clean Fuel'],
  [/duramax/i,       'Duramax'],
  [/eastern.?pet/i,  'Eastern Petroleum'],
  [/pnoc/i,          'PNOC'],
  [/filoil/i,        'FilOil'],
];

function normaliseBrand(raw) {
  if (!raw) return null;
  for (const [re, canonical] of BRAND_MAP) {
    if (re.test(raw)) return canonical;
  }
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

function buildCity(tags) {
  return tags['addr:city']
      || tags['addr:town']
      || tags['addr:municipality']
      || null;
}

function buildProvince(tags) {
  return tags['addr:province']
      || tags['addr:state']
      || tags['addr:county']
      || null;
}

// ─── Overpass query for a single bounding box ─────────────────────────────────
function buildQuery({ south, west, north, east }) {
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:120];
(
  node["amenity"="fuel"](${bbox});
  way["amenity"="fuel"](${bbox});
  relation["amenity"="fuel"](${bbox});
);
out center tags;`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRegion(region, retries = 3) {
  const query = buildQuery(region);
  const url   = 'https://overpass-api.de/api/interpreter';

  console.log(`\n[OSM] Querying ${region.name} (${region.south},${region.west} → ${region.north},${region.east}) …`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    `data=${encodeURIComponent(query)}`,
    });

    if (res.status === 429) {
      const wait = attempt * 15000;
      console.log(`[OSM] Rate-limited. Waiting ${wait / 1000}s before retry ${attempt}/${retries} …`);
      await sleep(wait);
      continue;
    }

    if (!res.ok) {
      throw new Error(`Overpass API returned ${res.status} for ${region.name}: ${await res.text()}`);
    }

    const json = await res.json();
    const elements = json.elements || [];
    console.log(`[OSM] ${region.name}: ${elements.length} raw element(s).`);
    return elements;
  }

  throw new Error(`All ${retries} attempts failed for ${region.name} (rate limited).`);
}

// ─── Parse OSM element → station row ─────────────────────────────────────────
function parseElement(el) {
  const tags = el.tags || {};

  const lat = el.lat  ?? el.center?.lat;
  const lon = el.lon  ?? el.center?.lon;

  if (!lat || !lon) return null;
  if (tags.access === 'private') return null;

  const name = tags.name || tags['name:en'] || null;
  if (!name) return null;

  const province = buildProvince(tags) || 'Philippines';

  // If the element has a province tag, reject it if it's outside scope.
  // Elements without a province tag are kept (they're inside the bbox).
  if (buildProvince(tags) && !ALLOWED_PROVINCES.has(province.toLowerCase())) {
    return null;
  }

  return {
    osm_id:   `${el.type}/${el.id}`,
    name,
    brand:    detectBrand(tags),
    address:  buildAddress(tags),
    barangay: buildBarangay(tags),
    city:     buildCity(tags) || null,          // nullable after migration
    province,                                   // NOT NULL fallback
    latitude:  lat,
    longitude: lon,
  };
}

// ─── Database operations ──────────────────────────────────────────────────────
function clearExistingStations() {
  console.log('\n[DB] Clearing existing station data …');
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
  console.log('  FuelWatch — OSM Import: Regions I, II & CAR');
  console.log('═══════════════════════════════════════════════════════');

  runMigrations();

  // Fetch all regions, deduplicating by OSM element id
  const seen     = new Map();  // osm_id → parsed station
  let totalRaw   = 0;

  for (let i = 0; i < REGION_BBOXES.length; i++) {
    const region = REGION_BBOXES[i];
    if (i > 0) {
      console.log('[OSM] Pausing 10s between regions to respect rate limits…');
      await sleep(10000);
    }
    let elements;
    try {
      elements = await fetchRegion(region);
    } catch (err) {
      console.error(`[Error] Failed to fetch ${region.name}:`, err.message);
      console.error('Skipping this region and continuing…');
      continue;
    }
    totalRaw += elements.length;

    for (const el of elements) {
      const osmId = `${el.type}/${el.id}`;
      if (seen.has(osmId)) continue;       // deduplicate overlap zones
      const parsed = parseElement(el);
      if (parsed) seen.set(osmId, parsed);
    }
  }

  const stations = [...seen.values()];

  console.log(`\n[OSM] ${totalRaw} raw element(s) fetched across all regions.`);
  console.log(`[OSM] ${stations.length} unique valid station(s) after deduplication & filtering.`);

  if (stations.length === 0) {
    console.warn('[Warning] No stations found. The database will NOT be cleared.');
    process.exit(0);
  }

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

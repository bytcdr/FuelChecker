const db = require('../config/database');
const { newId, now } = require('../utils/helpers');

/**
 * TODO: Replace these placeholder stations with verified Tuguegarao station data.
 * Coordinates are approximate — update lat/lng from Google Maps / OSM for accuracy.
 * Each station needs: name, brand, address, barangay, latitude, longitude
 *
 * Tuguegarao City center: ~17.6132°N, 121.7270°E
 */
const STATIONS = [
  // --- CENTRO AREA ---
  {
    name: 'Petron Station - Centro 10',
    brand: 'Petron',
    address: 'Mabini Street, Centro 10',
    barangay: 'Centro 10',
    latitude: 17.6130,
    longitude: 121.7248,
  },
  {
    name: 'Shell Service Station - Rizal St',
    brand: 'Shell',
    address: 'Rizal Street, Centro 12',
    barangay: 'Centro 12',
    latitude: 17.6148,
    longitude: 121.7265,
  },
  {
    name: 'Caltex Tuguegarao - Luna Street',
    brand: 'Caltex',
    address: 'Luna Street, Centro 1',
    barangay: 'Centro 1',
    latitude: 17.6115,
    longitude: 121.7230,
  },
  {
    name: 'Phoenix Petroleum - Centro 4',
    brand: 'Phoenix',
    address: 'Centro 4, Tuguegarao City',
    barangay: 'Centro 4',
    latitude: 17.6120,
    longitude: 121.7280,
  },
  // --- HIGHWAY / SOUTH ---
  {
    name: 'Phoenix Petroleum - Carig Sur',
    brand: 'Phoenix',
    address: 'Maharlika Highway, Carig Sur',
    barangay: 'Carig Sur',
    latitude: 17.5985,
    longitude: 121.7305,
  },
  {
    name: 'PTT Philippines - Annafunan East',
    brand: 'PTT',
    address: 'Maharlika Highway, Annafunan East',
    barangay: 'Annafunan East',
    latitude: 17.6080,
    longitude: 121.7350,
  },
  {
    name: 'Shell Station - Leonarda',
    brand: 'Shell',
    address: 'Leonarda, Tuguegarao City',
    barangay: 'Leonarda',
    latitude: 17.5910,
    longitude: 121.7395,
  },
  {
    name: 'Caltex - Bagay Road',
    brand: 'Caltex',
    address: 'Bagay Road, Bagay',
    barangay: 'Bagay',
    latitude: 17.6055,
    longitude: 121.7185,
  },
  // --- NORTH / HIGHWAY ---
  {
    name: 'Flying V - Ugac Norte',
    brand: 'Flying V',
    address: 'Ugac Norte, Tuguegarao City',
    barangay: 'Ugac Norte',
    latitude: 17.6210,
    longitude: 121.7240,
  },
  {
    name: 'Seaoil - Larion Alto',
    brand: 'Seaoil',
    address: 'Larion Alto, Tuguegarao City',
    barangay: 'Larion Alto',
    latitude: 17.6255,
    longitude: 121.7155,
  },
  {
    name: 'Petron Station - Tagga',
    brand: 'Petron',
    address: 'Tagga, Tuguegarao City',
    barangay: 'Tagga',
    latitude: 17.6305,
    longitude: 121.7210,
  },
  {
    name: 'Jetti Petroleum - Buntun Highway',
    brand: 'Jetti',
    address: 'Buntun Highway, Buntun',
    barangay: 'Buntun',
    latitude: 17.6350,
    longitude: 121.7290,
  },
  // --- WEST SIDE ---
  {
    name: 'Seaoil - Larion Bajo',
    brand: 'Seaoil',
    address: 'Larion Bajo, Tuguegarao City',
    barangay: 'Larion Bajo',
    latitude: 17.6190,
    longitude: 121.7120,
  },
  {
    name: 'Flying V - Annafunan West',
    brand: 'Flying V',
    address: 'Annafunan West, Tuguegarao City',
    barangay: 'Annafunan West',
    latitude: 17.6070,
    longitude: 121.7200,
  },
  {
    name: 'Petron Station - Ugac Sur',
    brand: 'Petron',
    address: 'Ugac Sur, Tuguegarao City',
    barangay: 'Ugac Sur',
    latitude: 17.6160,
    longitude: 121.7330,
  },
];

function seedStations() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO stations
      (id, name, brand, address, barangay, city, province, latitude, longitude, is_active, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, 'Tuguegarao', 'Cagayan', ?, ?, 1, ?, ?)
  `);

  for (const station of STATIONS) {
    insert.run(
      newId(),
      station.name,
      station.brand,
      station.address,
      station.barangay,
      station.latitude,
      station.longitude,
      now(),
      now(),
    );
  }

  console.log(`  Inserted ${STATIONS.length} sample stations.`);
  console.log('  NOTE: Update coordinates and details with verified data when available.');
}

module.exports = seedStations;

require('dotenv').config();
const { runMigrations } = require('../db/schema');
const seedUsers = require('./01_users');
const seedFuelProducts = require('./02_fuel_products');

async function runSeeds() {
  console.log('Running migrations...');
  runMigrations();

  console.log('Seeding users...');
  await seedUsers();

  console.log('Seeding fuel products...');
  seedFuelProducts();

  console.log('\nAll seeds completed successfully!');
  console.log('\nDefault admin credentials:');
  console.log('  Email:    admin@fuelwatch.local');
  console.log('  Password: admin1234');
  console.log('\nNote: Run "npm run osm-import" separately to populate stations from OpenStreetMap.');
}

runSeeds().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

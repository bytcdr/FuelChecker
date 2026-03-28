require('dotenv').config();
const { runMigrations } = require('./schema');

runMigrations();

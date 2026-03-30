require('dotenv').config();
const { runMigrations } = require('./db/schema');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Always run additive migrations on startup so the DB schema stays current
runMigrations();

const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`FuelWatch API running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

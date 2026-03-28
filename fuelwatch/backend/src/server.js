require('dotenv').config();
const { runMigrations } = require('./db/schema');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Always run additive migrations on startup so the DB schema stays current
runMigrations();

app.listen(PORT, () => {
  console.log(`FuelWatch API running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

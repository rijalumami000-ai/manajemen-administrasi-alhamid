const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT
});

async function run() {
  try {
    console.log('Running migration to add peringkat_manual...');
    await pool.query('ALTER TABLE rapor_santri ADD COLUMN IF NOT EXISTS peringkat_manual INTEGER;');
    console.log('Migration successful.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

run();

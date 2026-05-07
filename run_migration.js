const fs = require('fs');
const path = require('path');
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
    const sqlPath = path.join(__dirname, 'sql', 'add_manajemen_nilai.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running migration...');
    
    // Split the SQL into statements and run them, or just run the whole string if pg supports it.
    // pg supports multiple statements in one query call.
    // But since `UNIQUE NULLS NOT DISTINCT` might fail on PG < 15, let's fix that in the file first.
    
    await pool.query(sql);
    console.log('Migration successful.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

run();

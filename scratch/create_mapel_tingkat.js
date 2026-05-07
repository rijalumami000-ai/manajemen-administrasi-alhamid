const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool();

async function main() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mapel_tingkat (
        tingkat INTEGER NOT NULL,
        mata_pelajaran_id INTEGER NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
        UNIQUE(tingkat, mata_pelajaran_id)
      );
    `);
    console.log("Table mapel_tingkat created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    pool.end();
  }
}

main();

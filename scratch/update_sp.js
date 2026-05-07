require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool();

async function run() {
  try {
    const res = await pool.query("SELECT * FROM setting_kriteria_nilai WHERE mata_pelajaran_id IS NOT NULL");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();

require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool();
  try {
    const result = await pool.query(
      "select to_regclass('public.kelas') as kelas, to_regclass('public.santri') as santri, current_database() as db"
    );
    console.log(result.rows[0]);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();

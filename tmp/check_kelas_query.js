require('dotenv').config();
const db = require('../db');

(async () => {
  try {
    const result = await db.query('SELECT * FROM kelas ORDER BY jenis, nama LIMIT 5');
    console.log(result.rows);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (db.pool) {
      await db.pool.end();
    }
  }
})();

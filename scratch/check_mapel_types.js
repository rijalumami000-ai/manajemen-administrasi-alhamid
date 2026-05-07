const db = require('../db');

async function checkMapel() {
  try {
    const res = await db.query('SELECT id, nama, jenis FROM mata_pelajaran ORDER BY nama');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkMapel();

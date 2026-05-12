const db = require('../db');

async function run() {
  const result = await db.query("SELECT * FROM kelas WHERE jenis='Diniyah' ORDER BY nama");
  console.table(result.rows);
  process.exit();
}
run();

const db = require('../db');
async function run() {
  const mapel = await db.query('SELECT id FROM mata_pelajaran WHERE jenis = \'Reguler\' LIMIT 1');
  const ta = await db.query('SELECT id FROM tahun_ajaran LIMIT 1');
  const kat = await db.query('SELECT id FROM kategori_evaluasi LIMIT 1');
  console.log({ mapel: mapel.rows[0]?.id, ta: ta.rows[0]?.id, kat: kat.rows[0]?.id });
  process.exit(0);
}
run();

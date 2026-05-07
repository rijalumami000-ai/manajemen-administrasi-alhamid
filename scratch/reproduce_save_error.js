const db = require('../db');

async function testInsert() {
  const data = {
    tingkat: 2,
    mata_pelajaran_id: 10,
    jenis_mapel: 'Muhafadzoh',
    tipe_input: 'Teks',
    konfigurasi: [
      { bab: 'باب التوكيد', predikat: "Rodi'" }
    ]
  };

  try {
    console.log('Attempting test insert...');
    const res = await db.query(
      `INSERT INTO setting_kriteria_nilai (kelas_id, mata_pelajaran_id, tingkat, jenis_mapel, tipe_input, konfigurasi)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [null, data.mata_pelajaran_id, data.tingkat, data.jenis_mapel, data.tipe_input, JSON.stringify(data.konfigurasi)]
    );
    console.log('Success:', res.rows[0]);
  } catch (err) {
    console.error('FAILED with error:', err.message);
    console.error('Error Code:', err.code);
    console.error('Error Detail:', err.detail);
  } finally {
    process.exit();
  }
}

testInsert();

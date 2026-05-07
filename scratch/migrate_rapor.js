const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool();
async function run() {
  try {
    await pool.query('ALTER TABLE mata_pelajaran ADD COLUMN IF NOT EXISTS nama_arab VARCHAR(255)');
    await pool.query('ALTER TABLE kelas ADD COLUMN IF NOT EXISTS mustahiq_id INTEGER REFERENCES guru(id)');
    await pool.query('ALTER TABLE kelas ADD COLUMN IF NOT EXISTS muhafadzoh_mapel_id INTEGER REFERENCES mata_pelajaran(id)');
    await pool.query('ALTER TABLE kelas ADD COLUMN IF NOT EXISTS qiroatul_mapel_id INTEGER REFERENCES mata_pelajaran(id)');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rapor_santri (
        id SERIAL PRIMARY KEY,
        santri_id INTEGER REFERENCES santri(id) ON DELETE CASCADE,
        tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
        kategori_evaluasi_id INTEGER REFERENCES kategori_evaluasi(id) ON DELETE CASCADE,
        sakit INTEGER DEFAULT 0,
        izin INTEGER DEFAULT 0,
        alpa INTEGER DEFAULT 0,
        keaktifan VARCHAR(2),
        akhlaq VARCHAR(2),
        kerapihan VARCHAR(2),
        catatan TEXT,
        UNIQUE(santri_id, tahun_ajaran_id, kategori_evaluasi_id)
      )
    `);
    console.log('Database schema updated successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();

const db = require('../db');

async function up() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Membuat tabel absensi_bulanan_santri...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS absensi_bulanan_santri (
        id SERIAL PRIMARY KEY,
        santri_id INTEGER NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
        tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
        kategori_evaluasi_id INTEGER NOT NULL REFERENCES kategori_evaluasi(id) ON DELETE CASCADE,
        bulan VARCHAR(20) NOT NULL,
        sakit INTEGER DEFAULT 0,
        izin INTEGER DEFAULT 0,
        alpa INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_santri_ta_kategori_bulan UNIQUE (santri_id, tahun_ajaran_id, kategori_evaluasi_id, bulan)
      );
    `);
    console.log('✅ Tabel absensi_bulanan_santri berhasil dibuat');

    console.log('📝 Memulai migrasi data absensi lama dari rapor_santri...');
    // Ambil data absensi lama yang bernilai > 0
    const oldDataRes = await client.query(`
      SELECT r.santri_id, r.tahun_ajaran_id, r.kategori_evaluasi_id, r.sakit, r.izin, r.alpa, k.nama as kategori_nama
      FROM rapor_santri r
      JOIN kategori_evaluasi k ON r.kategori_evaluasi_id = k.id
      WHERE COALESCE(r.sakit, 0) > 0 OR COALESCE(r.izin, 0) > 0 OR COALESCE(r.alpa, 0) > 0
    `);

    console.log(`🔍 Ditemukan ${oldDataRes.rows.length} data absensi lama untuk dimigrasikan.`);

    let migratedCount = 0;
    for (const row of oldDataRes.rows) {
      // Tentukan bulan default berdasarkan semester
      const isGenap = row.kategori_nama.toLowerCase().includes('genap');
      const bulanDefault = isGenap ? 'Januari' : 'Juli';

      await client.query(`
        INSERT INTO absensi_bulanan_santri (santri_id, tahun_ajaran_id, kategori_evaluasi_id, bulan, sakit, izin, alpa)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (santri_id, tahun_ajaran_id, kategori_evaluasi_id, bulan) 
        DO UPDATE SET
          sakit = COALESCE(absensi_bulanan_santri.sakit, 0) + EXCLUDED.sakit,
          izin = COALESCE(absensi_bulanan_santri.izin, 0) + EXCLUDED.izin,
          alpa = COALESCE(absensi_bulanan_santri.alpa, 0) + EXCLUDED.alpa
      `, [
        row.santri_id,
        row.tahun_ajaran_id,
        row.kategori_evaluasi_id,
        bulanDefault,
        row.sakit || 0,
        row.izin || 0,
        row.alpa || 0
      ]);
      migratedCount++;
    }

    console.log(`✅ Berhasil memigrasikan ${migratedCount} data ke tabel detail bulanan.`);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error saat migrasi up:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Menghapus tabel absensi_bulanan_santri...');
    await client.query(`DROP TABLE IF EXISTS absensi_bulanan_santri;`);
    console.log('✅ Tabel absensi_bulanan_santri berhasil dihapus');

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error saat migrasi down:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Execution block
const command = process.argv[2];
if (require.main === module) {
  if (command === 'up') {
    up()
      .then(() => {
        console.log('✅ Migrasi selesai');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Migrasi gagal:', error);
        process.exit(1);
      });
  } else if (command === 'down') {
    down()
      .then(() => {
        console.log('✅ Rollback selesai');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Rollback gagal:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage: node add_absensi_bulanan_table.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };

const db = require('../db');

async function up() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Membuat tabel konfigurasi_setoran_kelas...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS konfigurasi_setoran_kelas (
        id SERIAL PRIMARY KEY,
        kelas_id INTEGER NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
        tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
        kategori_evaluasi_id INTEGER NOT NULL REFERENCES kategori_evaluasi(id) ON DELETE CASCADE,
        mustahiq_id INTEGER REFERENCES guru(id) ON DELETE SET NULL,
        tipe_setoran VARCHAR(20) DEFAULT 'Angka',
        mode_frekuensi VARCHAR(30) DEFAULT 'mingguan',
        interval_hari INTEGER DEFAULT 7,
        target_per_setoran INTEGER DEFAULT 10,
        catatan TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_konfigurasi_setoran_kelas UNIQUE (kelas_id, tahun_ajaran_id, kategori_evaluasi_id)
      );
    `);

    console.log('📝 Membuat tabel riwayat_setoran_nadzom...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS riwayat_setoran_nadzom (
        id SERIAL PRIMARY KEY,
        santri_id INTEGER NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
        kelas_id INTEGER NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
        tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
        kategori_evaluasi_id INTEGER NOT NULL REFERENCES kategori_evaluasi(id) ON DELETE CASCADE,
        mustahiq_id INTEGER REFERENCES guru(id) ON DELETE SET NULL,
        tanggal_setor DATE NOT NULL DEFAULT CURRENT_DATE,
        tipe_setoran VARCHAR(20) DEFAULT 'Angka',
        bait_awal INTEGER DEFAULT 0,
        bait_akhir INTEGER DEFAULT 0,
        jumlah_bait INTEGER DEFAULT 0,
        nama_bab VARCHAR(255),
        status_kelancaran VARCHAR(30) DEFAULT 'Lancar',
        catatan TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('📝 Menambahkan index performa untuk setoran...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_riwayat_setoran_santri 
        ON riwayat_setoran_nadzom (santri_id, tahun_ajaran_id, kategori_evaluasi_id);
      CREATE INDEX IF NOT EXISTS idx_riwayat_setoran_kelas 
        ON riwayat_setoran_nadzom (kelas_id, tahun_ajaran_id, kategori_evaluasi_id);
      CREATE INDEX IF NOT EXISTS idx_riwayat_setoran_tanggal 
        ON riwayat_setoran_nadzom (tanggal_setor);
    `);

    await client.query('COMMIT');
    console.log('✅ Migrasi tabel setoran hafalan nadzom berhasil dijalankan.');
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

    console.log('📝 Menghapus tabel riwayat_setoran_nadzom...');
    await client.query('DROP TABLE IF EXISTS riwayat_setoran_nadzom CASCADE;');

    console.log('📝 Menghapus tabel konfigurasi_setoran_kelas...');
    await client.query('DROP TABLE IF EXISTS konfigurasi_setoran_kelas CASCADE;');

    await client.query('COMMIT');
    console.log('✅ Migrasi rollback berhasil dijalankan.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error saat migrasi down:', error);
    throw error;
  } finally {
    client.release();
  }
}

const command = process.argv[2];
if (require.main === module) {
  if (command === 'up') {
    up()
      .then(() => {
        console.log('✅ Selesai.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('❌ Gagal:', err);
        process.exit(1);
      });
  } else if (command === 'down') {
    down()
      .then(() => {
        console.log('✅ Selesai.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('❌ Gagal:', err);
        process.exit(1);
      });
  } else {
    console.log('Gunakan: node migrations/add_setoran_hafalan_nadzom.js up|down');
    process.exit(0);
  }
}

module.exports = { up, down };

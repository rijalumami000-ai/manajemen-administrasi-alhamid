const db = require('../db');

async function up() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    console.log('📝 [1/2] Menambahkan kolom NIK Orang Tua (orangtua)...');
    await client.query(`
      ALTER TABLE orangtua
        ADD COLUMN IF NOT EXISTS nik_ayah VARCHAR(50),
        ADD COLUMN IF NOT EXISTS nik_ibu VARCHAR(50);
    `);
    console.log('✅ Kolom NIK Orang Tua berhasil ditambahkan.');

    console.log('📝 [2/2] Menambahkan kolom identitas, administratif, dan kelulusan (santri)...');
    await client.query(`
      ALTER TABLE santri
        ADD COLUMN IF NOT EXISTS anak_ke INTEGER,
        ADD COLUMN IF NOT EXISTS agama VARCHAR(50) DEFAULT 'Islam',
        ADD COLUMN IF NOT EXISTS status_keluarga VARCHAR(50) DEFAULT 'Kandung',
        ADD COLUMN IF NOT EXISTS status_masuk VARCHAR(50) DEFAULT 'Baru',
        ADD COLUMN IF NOT EXISTS pesantren_sebelumnya VARCHAR(200),
        ADD COLUMN IF NOT EXISTS sekolah_asal_nama VARCHAR(200),
        ADD COLUMN IF NOT EXISTS sekolah_asal_alamat TEXT,
        ADD COLUMN IF NOT EXISTS diterima_kelas_madin VARCHAR(100),
        ADD COLUMN IF NOT EXISTS diterima_tanggal_madin DATE,
        ADD COLUMN IF NOT EXISTS diterima_tahun_madin VARCHAR(20),
        ADD COLUMN IF NOT EXISTS keluar_madin_tanggal DATE,
        ADD COLUMN IF NOT EXISTS keluar_madin_tahun VARCHAR(20),
        ADD COLUMN IF NOT EXISTS keluar_madin_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS keluar_pondok_tanggal DATE,
        ADD COLUMN IF NOT EXISTS keluar_pondok_tahun VARCHAR(20),
        ADD COLUMN IF NOT EXISTS keluar_pondok_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS keluar_sekolah_tingkat VARCHAR(50),
        ADD COLUMN IF NOT EXISTS keluar_sekolah_tanggal DATE,
        ADD COLUMN IF NOT EXISTS keluar_sekolah_tahun VARCHAR(20),
        ADD COLUMN IF NOT EXISTS keluar_sekolah_status VARCHAR(50);
    `);
    console.log('✅ Kolom Buku Induk Santri berhasil ditambahkan.');

    await client.query('COMMIT');
    console.log('🎉 Migrasi Buku Induk Santri selesai!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migrasi Buku Induk Santri gagal:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    // Non-destructive rollback intentionally left empty to preserve student data
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { up, down };

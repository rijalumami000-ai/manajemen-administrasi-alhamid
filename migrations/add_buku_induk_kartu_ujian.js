const db = require('../db');
const path = require('path');
const fs = require('fs');

async function up() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    console.log('📝 [1/4] Menambahkan kolom foto_url dan tahun_masuk ke tabel santri...');
    await client.query(`ALTER TABLE santri ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500)`);
    await client.query(`ALTER TABLE santri ADD COLUMN IF NOT EXISTS tahun_masuk INTEGER`);
    console.log('✅ Kolom foto_url dan tahun_masuk berhasil ditambahkan.');

    console.log('📝 [2/4] Membuat tabel peserta_ujian...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS peserta_ujian (
        id SERIAL PRIMARY KEY,
        tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
        semester VARCHAR(10) NOT NULL CHECK (semester IN ('Ganjil', 'Genap')),
        santri_id INTEGER NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
        kelas_diniyah_id INTEGER REFERENCES kelas(id) ON DELETE SET NULL,
        no_peserta VARCHAR(20) NOT NULL,
        urutan_kelas INTEGER,
        urutan_di_kelas INTEGER,
        urutan_global INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (tahun_ajaran_id, semester, santri_id)
      )
    `);
    console.log('✅ Tabel peserta_ujian berhasil dibuat.');

    console.log('📝 [3/4] Membuat index untuk peserta_ujian...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_peserta_ujian_tahun_semester ON peserta_ujian(tahun_ajaran_id, semester)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_peserta_ujian_santri ON peserta_ujian(santri_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_peserta_ujian_kelas ON peserta_ujian(kelas_diniyah_id)`);
    console.log('✅ Index berhasil dibuat.');

    console.log('📝 [4/4] Menambahkan key-value pengaturan kartu ujian ke system_settings...');
    await client.query(`
      INSERT INTO system_settings (key, value) VALUES
        ('kartu_ujian_judul_1', 'UJIAN SEMESTER GENAP'),
        ('kartu_ujian_judul_2', 'MADRASAH DINIYAH AL-HAMID'),
        ('kartu_ujian_ketua_panitia', 'Ust. Ahmad Syukron Rosyid'),
        ('kartu_ujian_lokasi', 'Cintamulya'),
        ('kartu_ujian_ttd_url', ''),
        ('kartu_ujian_stempel_url', ''),
        ('kartu_ujian_logo_url', ''),
        ('kartu_ujian_judul_kartu', 'KARTU PESERTA UJIAN TULIS')
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('✅ Setting kartu ujian berhasil ditambahkan.');

    await client.query('COMMIT');
    console.log('🎉 Migrasi selesai!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migrasi gagal:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    console.log('📝 Rollback: Menghapus tabel peserta_ujian...');
    await client.query(`DROP TABLE IF EXISTS peserta_ujian CASCADE`);

    console.log('📝 Rollback: Menghapus kolom foto_url dan tahun_masuk dari santri...');
    await client.query(`ALTER TABLE santri DROP COLUMN IF EXISTS foto_url`);
    await client.query(`ALTER TABLE santri DROP COLUMN IF EXISTS tahun_masuk`);

    console.log('📝 Rollback: Menghapus setting kartu ujian...');
    await client.query(`
      DELETE FROM system_settings WHERE key IN (
        'kartu_ujian_judul_1','kartu_ujian_judul_2','kartu_ujian_ketua_panitia',
        'kartu_ujian_lokasi','kartu_ujian_ttd_url','kartu_ujian_stempel_url',
        'kartu_ujian_logo_url','kartu_ujian_judul_kartu'
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Rollback selesai.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback gagal:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const command = process.argv[2];
  if (command === 'up') {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
  } else if (command === 'down') {
    down().then(() => process.exit(0)).catch(() => process.exit(1));
  } else {
    console.log('Usage: node add_buku_induk_kartu_ujian.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };

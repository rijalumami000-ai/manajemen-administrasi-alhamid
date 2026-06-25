const fs = require('fs');
const path = require('path');
const db = require('../../db');

async function initDatabase() {
  // Run main init.sql
  const initPath = path.join(__dirname, '..', '..', 'sql', 'init.sql');
  if (fs.existsSync(initPath)) {
    const sql = fs.readFileSync(initPath, 'utf8');
    await db.query(sql);
    console.log('✓ Main database schema initialized');
  } else {
    console.warn('Database init file not found:', initPath);
  }

  // Run auth_schema.sql
  const authPath = path.join(__dirname, '..', '..', 'sql', 'auth_schema.sql');
  if (fs.existsSync(authPath)) {
    const authSql = fs.readFileSync(authPath, 'utf8');
    await db.query(authSql);
    console.log('✓ Authentication schema initialized');
  } else {
    console.log('⚠ Authentication schema file not found (optional)');
  }

  // Run lembar_ujian.sql
  const lembarUjianPath = path.join(__dirname, '..', '..', 'sql', 'lembar_ujian.sql');
  if (fs.existsSync(lembarUjianPath)) {
    const lembarUjianSql = fs.readFileSync(lembarUjianPath, 'utf8');
    await db.query(lembarUjianSql);
    console.log('✓ Lembar Ujian schema initialized');
  } else {
    console.log('⚠ Lembar Ujian schema file not found');
  }

  // Run performance_indexes.sql (idempotent — all IF NOT EXISTS)
  const indexPath = path.join(__dirname, '..', '..', 'sql', 'performance_indexes.sql');
  if (fs.existsSync(indexPath)) {
    // Strip the SELECT at end (not valid in batch query context)
    let indexSql = fs.readFileSync(indexPath, 'utf8');
    // Remove everything from SELECT onwards (verification query — not needed on init)
    const selectIdx = indexSql.indexOf('SELECT\n    schemaname');
    if (selectIdx !== -1) indexSql = indexSql.substring(0, selectIdx);
    await db.query(indexSql);
    console.log('✓ Performance indexes applied');
  } else {
    console.log('⚠ Performance indexes file not found');
  }

  // Run keuangan_schema.sql — Sistem Keuangan Pesantren
  const keuanganPath = path.join(__dirname, '..', '..', 'sql', 'keuangan_schema.sql');
  if (fs.existsSync(keuanganPath)) {
    const keuanganSql = fs.readFileSync(keuanganPath, 'utf8');
    await db.query(keuanganSql);
    console.log('✓ Keuangan schema initialized');
  } else {
    console.log('⚠ Keuangan schema file not found');
  }

  // Run struktur_dan_jadwal.sql — Struktur Organisasi & Jadwal Pelajaran
  const strukturJadwalPath = path.join(__dirname, '..', '..', 'sql', 'struktur_dan_jadwal.sql');
  if (fs.existsSync(strukturJadwalPath)) {
    const strukturJadwalSql = fs.readFileSync(strukturJadwalPath, 'utf8');
    await db.query(strukturJadwalSql);
    console.log('✓ Struktur Organisasi & Jadwal Pelajaran schema initialized');
  } else {
    console.log('⚠ Struktur Organisasi & Jadwal Pelajaran schema file not found');
  }

  // Migrasi role bendahara & madrasah_diniyah
  await db.query(`
    DO $$
    BEGIN
      -- Tambah bendahara_level column jika belum ada
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'bendahara_level'
      ) THEN
        ALTER TABLE users ADD COLUMN bendahara_level INTEGER DEFAULT NULL;
      END IF;

      -- Update existing users roles first to prevent constraint violations
      UPDATE users SET role = 'madrasah_diniyah' WHERE role = 'guru';
      UPDATE users SET role = 'bendahara' WHERE role = 'staff';

      -- Re-create role constraint to enforce only admin, madrasah_diniyah, bendahara
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check1;
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('admin', 'madrasah_diniyah', 'bendahara'));

      -- Tambah kolom muhafadzoh_mapel_id jika belum ada
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kelas_tahun_ajaran' AND column_name = 'muhafadzoh_mapel_id'
      ) THEN
        ALTER TABLE kelas_tahun_ajaran ADD COLUMN muhafadzoh_mapel_id INTEGER REFERENCES mata_pelajaran(id) ON DELETE SET NULL;
      END IF;

      -- Tambah kolom qiroatul_mapel_id jika belum ada
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kelas_tahun_ajaran' AND column_name = 'qiroatul_mapel_id'
      ) THEN
        ALTER TABLE kelas_tahun_ajaran ADD COLUMN qiroatul_mapel_id INTEGER REFERENCES mata_pelajaran(id) ON DELETE SET NULL;
      END IF;

      -- Tambah kolom aktif_ganjil jika belum ada
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'santri_tahun_ajaran' AND column_name = 'aktif_ganjil'
      ) THEN
        ALTER TABLE santri_tahun_ajaran ADD COLUMN aktif_ganjil BOOLEAN NOT NULL DEFAULT TRUE;
      END IF;

      -- Tambah kolom aktif_genap jika belum ada
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'santri_tahun_ajaran' AND column_name = 'aktif_genap'
      ) THEN
        ALTER TABLE santri_tahun_ajaran ADD COLUMN aktif_genap BOOLEAN NOT NULL DEFAULT TRUE;
      END IF;

      -- Drop NOT NULL dari kelas_id di chat_messages jika masih NOT NULL
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chat_messages' AND column_name = 'kelas_id' AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE chat_messages ALTER COLUMN kelas_id DROP NOT NULL;
      END IF;

      -- Tambah kolom tingkat_group ke chat_messages jika belum ada
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chat_messages' AND column_name = 'tingkat_group'
      ) THEN
        ALTER TABLE chat_messages ADD COLUMN tingkat_group INTEGER DEFAULT NULL;
      END IF;

      -- Buat tabel saran_aplikasi jika belum ada
      CREATE TABLE IF NOT EXISTS saran_aplikasi (
        id SERIAL PRIMARY KEY,
        guru_id INTEGER REFERENCES guru(id) ON DELETE SET NULL,
        kelas_id INTEGER REFERENCES kelas(id) ON DELETE SET NULL,
        isi_saran TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    END
    $$;
  `);
  console.log('✓ Role bendahara & kolom tambahan diverifikasi/diperbarui');
}

module.exports = initDatabase;

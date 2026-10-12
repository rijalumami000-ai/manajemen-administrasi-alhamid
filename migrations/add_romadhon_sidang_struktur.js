const db = require('../db');

async function up() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // ═══════════════════════════════════════════════════════════════
    // 1. JADWAL KAJIAN BALAGH ROMADHON
    // ═══════════════════════════════════════════════════════════════
    console.log('📝 Creating table jadwal_kajian_balagh...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS jadwal_kajian_balagh (
        id SERIAL PRIMARY KEY,
        tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
        kelas VARCHAR(100) NOT NULL,
        waktu VARCHAR(100) NOT NULL,
        qori VARCHAR(150) NOT NULL,
        kitab VARCHAR(200) NOT NULL,
        tempat VARCHAR(200),
        no_urut INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table jadwal_kajian_balagh created');

    // ═══════════════════════════════════════════════════════════════
    // 2. JADWAL IMAM TARAWIH & BILAL
    // ═══════════════════════════════════════════════════════════════
    console.log('📝 Creating table jadwal_imam_tarawih...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS jadwal_imam_tarawih (
        id SERIAL PRIMARY KEY,
        tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
        malam INTEGER NOT NULL CHECK (malam >= 1 AND malam <= 30),
        imam VARCHAR(150) NOT NULL,
        bilal VARCHAR(150),
        tempat VARCHAR(200),
        no_urut INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table jadwal_imam_tarawih created');

    // ═══════════════════════════════════════════════════════════════
    // 3. MATERI SIDANG (PDF Documents)
    // ═══════════════════════════════════════════════════════════════
    console.log('📝 Creating table materi_sidang...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS materi_sidang (
        id SERIAL PRIMARY KEY,
        tahun_masehi VARCHAR(20) NOT NULL,
        kategori VARCHAR(50) NOT NULL CHECK (kategori IN ('madin', 'pmq', 'pondok', 'haflah')),
        judul VARCHAR(300) NOT NULL,
        no_surat VARCHAR(100),
        tanggal DATE,
        halaman INTEGER DEFAULT 0,
        ukuran VARCHAR(50),
        status VARCHAR(100),
        pengesah VARCHAR(200),
        ringkasan TEXT,
        file_url VARCHAR(500),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table materi_sidang created');

    // ═══════════════════════════════════════════════════════════════
    // 4. UPDATE STRUKTUR_ORGANISASI - Add new types & tahun_ajaran_id
    // ═══════════════════════════════════════════════════════════════
    console.log('📝 Updating struktur_organisasi table...');
    
    // Drop old CHECK constraint and add new one with more types
    await client.query(`
      DO $$
      BEGIN
        -- Drop existing check constraint on tipe column
        IF EXISTS (
          SELECT 1 FROM information_schema.constraint_column_usage 
          WHERE table_name = 'struktur_organisasi' AND column_name = 'tipe'
        ) THEN
          ALTER TABLE struktur_organisasi DROP CONSTRAINT IF EXISTS struktur_organisasi_tipe_check;
        END IF;
      END $$;
    `);

    // Add new broader check constraint
    await client.query(`
      ALTER TABLE struktur_organisasi 
      ADD CONSTRAINT struktur_organisasi_tipe_check 
      CHECK (tipe IN (
        'madrasah_diniyah', 'panitia_ujian', 
        'pmq', 'pondok_putra', 'pondok_putri', 
        'panitia_sambangan', 'panitia_haflah', 'panitia_psb'
      ));
    `);

    // Add tahun_ajaran_id column (nullable – sambangan doesn't use it)
    await client.query(`
      ALTER TABLE struktur_organisasi 
      ADD COLUMN IF NOT EXISTS tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id) ON DELETE SET NULL;
    `);

    console.log('✅ struktur_organisasi updated with new types and tahun_ajaran_id');

    // ═══════════════════════════════════════════════════════════════
    // 5. SEED predefined roles for new structure types
    // ═══════════════════════════════════════════════════════════════
    console.log('📝 Seeding predefined roles for new structure types...');

    // PMQ Structure
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM struktur_organisasi WHERE tipe = 'pmq') THEN
          INSERT INTO struktur_organisasi (tipe, jabatan, no_urut) VALUES
          ('pmq', 'Direktur Eksekutif PMQ', 1),
          ('pmq', 'Koordinator Tahfidz 30 Juz', 2),
          ('pmq', 'Koordinator Tartil & Tahsin (Metode Yanbu''a)', 3),
          ('pmq', 'Sie Ujian & Verifikasi Sertifikasi Qur''an', 4),
          ('pmq', 'Wali Asrama Khusus Tahfidz Putri', 5);
        END IF;
      END $$;
    `);

    // Pondok Putra Structure
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM struktur_organisasi WHERE tipe = 'pondok_putra') THEN
          INSERT INTO struktur_organisasi (tipe, jabatan, no_urut) VALUES
          ('pondok_putra', 'Pengasuh Utama Pondok Pesantren', 1),
          ('pondok_putra', 'Lurah Pondok Putra (Ketua Umum Santri)', 2),
          ('pondok_putra', 'Kepala Keamanan & Ketertiban', 3),
          ('pondok_putra', 'Ketua Biro Ubudiyah & Kemasjidan', 4),
          ('pondok_putra', 'Biro Kebersihan Lingkungan & Ro''an', 5);
        END IF;
      END $$;
    `);

    // Pondok Putri Structure
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM struktur_organisasi WHERE tipe = 'pondok_putri') THEN
          INSERT INTO struktur_organisasi (tipe, jabatan, no_urut) VALUES
          ('pondok_putri', 'Pengasuh Pondok Putri', 1),
          ('pondok_putri', 'Lurah Pondok Putri', 2),
          ('pondok_putri', 'Kepala Keamanan & Ketertiban Putri', 3),
          ('pondok_putri', 'Ketua Biro Ubudiyah Putri', 4),
          ('pondok_putri', 'Biro Kebersihan & Sarpras Putri', 5);
        END IF;
      END $$;
    `);

    // Panitia Sambangan
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM struktur_organisasi WHERE tipe = 'panitia_sambangan') THEN
          INSERT INTO struktur_organisasi (tipe, jabatan, no_urut) VALUES
          ('panitia_sambangan', 'Ketua Panitia Sambangan', 1),
          ('panitia_sambangan', 'Koordinator Registrasi & Buku Tamu Digital', 2),
          ('panitia_sambangan', 'Koordinator Keamanan & Rekayasa Parkir', 3),
          ('panitia_sambangan', 'Koordinator Stan Bazar & Konsumsi Tamu', 4);
        END IF;
      END $$;
    `);

    // Panitia Haflah
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM struktur_organisasi WHERE tipe = 'panitia_haflah') THEN
          INSERT INTO struktur_organisasi (tipe, jabatan, no_urut) VALUES
          ('panitia_haflah', 'Ketua Panitia Haflah Akhirussanah', 1),
          ('panitia_haflah', 'Sie Acara & Protokoler Wisuda Santri', 2),
          ('panitia_haflah', 'Sie Panggung, Dekorasi & Multimedia', 3),
          ('panitia_haflah', 'Sie Publikasi & Live Streaming', 4),
          ('panitia_haflah', 'Sie Tamu Undangan Masyayikh & Habaib', 5);
        END IF;
      END $$;
    `);

    // Panitia PSB
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM struktur_organisasi WHERE tipe = 'panitia_psb') THEN
          INSERT INTO struktur_organisasi (tipe, jabatan, no_urut) VALUES
          ('panitia_psb', 'Ketua Panitia PSB', 1),
          ('panitia_psb', 'Sie Pendaftaran & Administrasi', 2),
          ('panitia_psb', 'Sie Tes Seleksi & Wawancara', 3),
          ('panitia_psb', 'Sie Publikasi & Promosi', 4),
          ('panitia_psb', 'Sie Akomodasi & Penempatan Kamar', 5);
        END IF;
      END $$;
    `);

    console.log('✅ Predefined roles seeded for all new structure types');

    await client.query('COMMIT');
    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DROP TABLE IF EXISTS jadwal_kajian_balagh CASCADE');
    await client.query('DROP TABLE IF EXISTS jadwal_imam_tarawih CASCADE');
    await client.query('DROP TABLE IF EXISTS materi_sidang CASCADE');
    // Remove new types from struktur_organisasi
    await client.query(`DELETE FROM struktur_organisasi WHERE tipe IN ('pmq','pondok_putra','pondok_putri','panitia_sambangan','panitia_haflah','panitia_psb')`);
    await client.query(`ALTER TABLE struktur_organisasi DROP COLUMN IF EXISTS tahun_ajaran_id`);
    await client.query('COMMIT');
    console.log('✅ Rollback complete');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
up()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

const db = require('../db');

async function up() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Add foto_url column to guru table
    console.log('📝 Adding foto_url column to guru table...');
    await client.query(`
      ALTER TABLE guru 
      ADD COLUMN IF NOT EXISTS foto_url VARCHAR(255);
    `);
    console.log('✅ foto_url column added successfully');

    // 2. Create table for organizational structures
    console.log('📝 Creating table struktur_organisasi...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS struktur_organisasi (
        id SERIAL PRIMARY KEY,
        tipe VARCHAR(50) NOT NULL CHECK (tipe IN ('madrasah_diniyah', 'panitia_ujian')),
        jabatan VARCHAR(100) NOT NULL,
        guru_id INTEGER REFERENCES guru(id) ON DELETE SET NULL,
        nama_custom VARCHAR(150),
        keterangan TEXT,
        no_urut INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table struktur_organisasi created');

    // 3. Create table for daily lesson schedule
    console.log('📝 Creating table jadwal_pelajaran_harian...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS jadwal_pelajaran_harian (
        id SERIAL PRIMARY KEY,
        tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
        kelas_id INTEGER NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
        malam VARCHAR(50) NOT NULL,
        jam_ke INTEGER NOT NULL CHECK (jam_ke IN (1, 2)),
        mata_pelajaran_id INTEGER REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
        guru_id INTEGER REFERENCES guru(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (tahun_ajaran_id, kelas_id, malam, jam_ke)
      );
    `);
    console.log('✅ Table jadwal_pelajaran_harian created');

    // 4. Seed predefined roles for structures
    console.log('📝 Seeding predefined roles for struktur_organisasi...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM struktur_organisasi WHERE tipe = 'madrasah_diniyah') THEN
          INSERT INTO struktur_organisasi (tipe, jabatan, no_urut) VALUES
          ('madrasah_diniyah', 'Pelindung & Penasehat', 1),
          ('madrasah_diniyah', 'Kepala Madrasah', 2),
          ('madrasah_diniyah', 'Waka Kurikulum', 3),
          ('madrasah_diniyah', 'Waka Kesiswaan', 4),
          ('madrasah_diniyah', 'Sekretaris', 5),
          ('madrasah_diniyah', 'Bendahara', 6),
          ('madrasah_diniyah', 'TU', 7);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM struktur_organisasi WHERE tipe = 'panitia_ujian') THEN
          INSERT INTO struktur_organisasi (tipe, jabatan, no_urut) VALUES
          ('panitia_ujian', 'Penanggungjawab', 1),
          ('panitia_ujian', 'Ketua Panitia', 2),
          ('panitia_ujian', 'Sekretaris', 3),
          ('panitia_ujian', 'Bendahara', 4),
          ('panitia_ujian', 'Seksi Konsumsi', 5),
          ('panitia_ujian', 'Asisten Ujian', 6);
        END IF;
      END
      $$;
    `);
    console.log('✅ Default roles seeded successfully');

    await client.query('COMMIT');
    console.log('✅ Migration completed successfully');
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

    console.log('📝 Dropping tables...');
    await client.query('DROP TABLE IF EXISTS jadwal_pelajaran_harian CASCADE');
    await client.query('DROP TABLE IF EXISTS struktur_organisasi CASCADE');
    console.log('✅ Tables dropped');

    console.log('📝 Removing foto_url column from guru...');
    await client.query('ALTER TABLE guru DROP COLUMN IF EXISTS foto_url');
    console.log('✅ Column foto_url dropped');

    await client.query('COMMIT');
    console.log('✅ Rollback completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const command = process.argv[2];

  if (command === 'up') {
    up()
      .then(() => {
        console.log('✅ Migration completed');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
      });
  } else if (command === 'down') {
    down()
      .then(() => {
        console.log('✅ Rollback completed');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Rollback failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage: node add_struktur_dan_jadwal_pelajaran.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };

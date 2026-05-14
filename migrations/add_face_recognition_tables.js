const db = require('../db');

async function up() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Creating santri_face_data table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS santri_face_data (
        id SERIAL PRIMARY KEY,
        santri_id INTEGER NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
        face_descriptor TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(santri_id)
      )
    `);
    console.log('✅ Table santri_face_data created');

    console.log('📝 Creating absensi_sholat table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS absensi_sholat (
        id SERIAL PRIMARY KEY,
        santri_id INTEGER NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
        tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
        sholat VARCHAR(20) NOT NULL CHECK (sholat IN ('Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya')),
        status VARCHAR(20) NOT NULL DEFAULT 'Hadir' CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
        waktu_scan TIMESTAMPTZ DEFAULT NOW(),
        keterangan TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(santri_id, tanggal, sholat)
      )
    `);
    console.log('✅ Table absensi_sholat created');

    console.log('📝 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_absensi_sholat_tanggal ON absensi_sholat(tanggal DESC);
      CREATE INDEX IF NOT EXISTS idx_absensi_sholat_santri_id ON absensi_sholat(santri_id);
    `);
    console.log('✅ Indexes created');

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
    await client.query('DROP TABLE IF EXISTS absensi_sholat CASCADE');
    await client.query('DROP TABLE IF EXISTS santri_face_data CASCADE');
    console.log('✅ Tables dropped');

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
    console.log('Usage: node add_face_recognition_tables.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };

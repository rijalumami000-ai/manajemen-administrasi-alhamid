const db = require('../db');

async function up() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Menambahkan kolom tahun_ajaran_id dan semester ke tabel absensi_sholat...');
    await client.query(`
      ALTER TABLE absensi_sholat 
      ADD COLUMN IF NOT EXISTS tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
      ADD COLUMN IF NOT EXISTS semester VARCHAR(10);
    `);
    console.log('✅ Kolom berhasil ditambahkan');

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

    console.log('📝 Menghapus kolom tahun_ajaran_id dan semester dari tabel absensi_sholat...');
    await client.query(`
      ALTER TABLE absensi_sholat 
      DROP COLUMN IF EXISTS tahun_ajaran_id,
      DROP COLUMN IF EXISTS semester;
    `);
    console.log('✅ Kolom berhasil dihapus');

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
    console.log('Usage: node add_tahun_ajaran_semester_to_absensi.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };

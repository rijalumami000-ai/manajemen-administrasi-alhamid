const db = require('../db');

async function up() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Adding aktif_ganjil and aktif_genap columns to santri_tahun_ajaran table...');

    // Add columns with default true
    await client.query('ALTER TABLE santri_tahun_ajaran ADD COLUMN IF NOT EXISTS aktif_ganjil BOOLEAN NOT NULL DEFAULT TRUE');
    await client.query('ALTER TABLE santri_tahun_ajaran ADD COLUMN IF NOT EXISTS aktif_genap BOOLEAN NOT NULL DEFAULT TRUE');
    
    console.log('✅ Columns added successfully');

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

    console.log('📝 Rolling back migration...');

    // Drop columns
    await client.query('ALTER TABLE santri_tahun_ajaran DROP COLUMN IF EXISTS aktif_ganjil');
    await client.query('ALTER TABLE santri_tahun_ajaran DROP COLUMN IF EXISTS aktif_genap');

    console.log('✅ Columns dropped');

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
    console.log('Usage: node add_semester_status_to_santri.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };

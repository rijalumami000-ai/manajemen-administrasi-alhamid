const db = require('../db');

async function up() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Adding tahun_ajaran_id and tipe columns to alumni table...');

    // Add columns if they do not exist
    await client.query(`
      ALTER TABLE alumni 
      ADD COLUMN IF NOT EXISTS tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id) ON DELETE SET NULL
    `);
    
    await client.query(`
      ALTER TABLE alumni 
      ADD COLUMN IF NOT EXISTS tipe VARCHAR(50) NOT NULL DEFAULT 'alumni'
    `);

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

    console.log('📝 Rolling back migration (dropping columns from alumni)...');

    await client.query('ALTER TABLE alumni DROP COLUMN IF EXISTS tahun_ajaran_id');
    await client.query('ALTER TABLE alumni DROP COLUMN IF EXISTS tipe');

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
    console.log('Usage: node add_type_and_year_to_alumni.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };

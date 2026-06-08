const db = require('../db');

async function up() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Menambahkan kolom qr_code, nfc_uid, fingerprint_id ke tabel santri...');
    
    // Gunakan ADD COLUMN IF NOT EXISTS
    await client.query(`
      ALTER TABLE santri 
      ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS nfc_uid VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS fingerprint_id VARCHAR(255) UNIQUE;
    `);

    console.log('✅ Kolom qr_code, nfc_uid, fingerprint_id berhasil ditambahkan.');

    await client.query('COMMIT');
    console.log('✅ Migrasi berhasil');
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

    console.log('📝 Menghapus kolom qr_code, nfc_uid, fingerprint_id dari tabel santri...');
    
    await client.query(`
      ALTER TABLE santri 
      DROP COLUMN IF EXISTS qr_code,
      DROP COLUMN IF EXISTS nfc_uid,
      DROP COLUMN IF EXISTS fingerprint_id;
    `);

    console.log('✅ Kolom berhasil dihapus.');

    await client.query('COMMIT');
    console.log('✅ Rollback berhasil');
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
    up()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (command === 'down') {
    down()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('Usage: node add_biometric_fields_to_santri.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };

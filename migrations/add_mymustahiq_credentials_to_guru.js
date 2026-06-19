const db = require('../db');

async function up() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Menambahkan kolom kredensial MyMustahiq ke tabel guru...');
    
    // Tambahkan kolom mymustahiq_username jika belum ada
    await client.query(`
      ALTER TABLE guru 
      ADD COLUMN IF NOT EXISTS mymustahiq_username VARCHAR(100) UNIQUE;
    `);

    // Tambahkan kolom mymustahiq_password jika belum ada
    await client.query(`
      ALTER TABLE guru 
      ADD COLUMN IF NOT EXISTS mymustahiq_password VARCHAR(255);
    `);

    console.log('✅ Kolom kredensial MyMustahiq berhasil ditambahkan ke tabel guru.');

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

    console.log('📝 Menghapus kolom kredensial MyMustahiq dari tabel guru...');
    
    await client.query(`
      ALTER TABLE guru 
      DROP COLUMN IF EXISTS mymustahiq_username;
    `);

    await client.query(`
      ALTER TABLE guru 
      DROP COLUMN IF EXISTS mymustahiq_password;
    `);

    console.log('✅ Kolom kredensial MyMustahiq berhasil dihapus dari tabel guru.');

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
    console.log('Usage: node add_mymustahiq_credentials_to_guru.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };

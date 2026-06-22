const db = require('../db');

async function up() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Creating table fcm_tokens...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS fcm_tokens (
        id SERIAL PRIMARY KEY,
        guru_id INTEGER NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        device_info TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table fcm_tokens created');

    console.log('📝 Creating table notifications...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        guru_id INTEGER NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'Pengumuman',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table notifications created');

    await client.query('COMMIT');
    console.log('✅ Migrasi add_notifications_tables berhasil');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migrasi add_notifications_tables gagal:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Dropping table notifications...');
    await client.query('DROP TABLE IF EXISTS notifications CASCADE;');

    console.log('📝 Dropping table fcm_tokens...');
    await client.query('DROP TABLE IF EXISTS fcm_tokens CASCADE;');

    await client.query('COMMIT');
    console.log('✅ Rollback add_notifications_tables berhasil');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback add_notifications_tables gagal:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { up, down };

const db = require('../db');

async function up() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Creating table chat_messages...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        kelas_id INTEGER NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
        tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        deleted_by_guru_ids INTEGER[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table chat_messages created');

    console.log('📝 Creating indexes for chat_messages...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(kelas_id, tahun_ajaran_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at ASC);
    `);
    console.log('✅ Indexes for chat_messages created');

    await client.query('COMMIT');
    console.log('✅ Migrasi add_chat_messages_table berhasil');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migrasi add_chat_messages_table gagal:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Dropping table chat_messages...');
    await client.query('DROP TABLE IF EXISTS chat_messages CASCADE;');

    await client.query('COMMIT');
    console.log('✅ Rollback add_chat_messages_table berhasil');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback add_chat_messages_table gagal:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { up, down };

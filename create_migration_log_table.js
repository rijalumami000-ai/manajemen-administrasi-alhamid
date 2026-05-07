/**
 * Script untuk membuat tabel migration_log secara otomatis
 * Jalankan dengan: node create_migration_log_table.js
 */

const db = require('./db');

async function createMigrationLogTable() {
  console.log('🔧 Creating migration_log table...\n');

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migration_log (
        id SERIAL PRIMARY KEY,
        source_tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
        target_tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
        migrated_count INTEGER NOT NULL,
        excluded_santri_ids INTEGER[],
        migration_date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Table "migration_log" created');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_migration_log_target
      ON migration_log(target_tahun_ajaran_id);
    `);
    console.log('✅ Index "idx_migration_log_target" created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_migration_log_date
      ON migration_log(migration_date DESC);
    `);
    console.log('✅ Index "idx_migration_log_date" created');

    // Add comments
    await client.query(`
      COMMENT ON TABLE migration_log IS 'Log migrasi tahun ajaran untuk fitur rollback';
    `);
    await client.query(`
      COMMENT ON COLUMN migration_log.source_tahun_ajaran_id IS 'ID tahun ajaran sumber (yang lama)';
    `);
    await client.query(`
      COMMENT ON COLUMN migration_log.target_tahun_ajaran_id IS 'ID tahun ajaran target (yang baru)';
    `);
    await client.query(`
      COMMENT ON COLUMN migration_log.migrated_count IS 'Jumlah santri yang dimigrasi';
    `);
    await client.query(`
      COMMENT ON COLUMN migration_log.excluded_santri_ids IS 'Array ID santri yang tidak naik kelas';
    `);
    await client.query(`
      COMMENT ON COLUMN migration_log.migration_date IS 'Tanggal migrasi dilakukan';
    `);
    console.log('✅ Comments added');

    await client.query('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS! Table "migration_log" has been created.');
    console.log('='.repeat(60));
    console.log('\n📝 Next Steps:');
    console.log('   1. Restart backend server (Ctrl+C then node server.js)');
    console.log('   2. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('   3. Hard refresh browser (F12 > Right-click refresh > Empty Cache and Hard Reload)');
    console.log('   4. Check if "Rollback Migrasi" button appears');
    console.log('\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating table:', error.message);
    console.error('\n💡 Possible solutions:');
    console.error('   - Check if database is running');
    console.error('   - Check .env file configuration');
    console.error('   - Make sure you have permission to create tables');
    process.exit(1);
  } finally {
    client.release();
    await db.pool.end();
  }
}

createMigrationLogTable();

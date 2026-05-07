/**
 * Script untuk membersihkan data testing
 * PERINGATAN: Script ini akan menghapus data santri dan migration log!
 * Jalankan dengan: node clean_test_data.js
 */

const db = require('./db');

async function cleanTestData() {
  console.log('🧹 Cleaning test data...\n');
  console.log('⚠️  WARNING: This will delete santri data and migration logs!');
  console.log('⚠️  Press Ctrl+C within 5 seconds to cancel...\n');

  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Delete all migration logs
    console.log('🔄 Deleting migration logs...');
    const logResult = await client.query('DELETE FROM migration_log RETURNING id');
    console.log(`✅ Deleted ${logResult.rowCount} migration logs`);

    // 2. Delete all santri_tahun_ajaran data
    console.log('🔄 Deleting santri_tahun_ajaran data...');
    const staResult = await client.query('DELETE FROM santri_tahun_ajaran RETURNING id');
    console.log(`✅ Deleted ${staResult.rowCount} santri_tahun_ajaran records`);

    // 3. Reset all tahun_ajaran to inactive except one
    console.log('🔄 Resetting tahun_ajaran statuses...');
    await client.query('UPDATE tahun_ajaran SET is_active = FALSE, status = $1', ['draft']);
    console.log('✅ All tahun_ajaran set to inactive/draft');

    // 4. Set the oldest year as active
    console.log('🔄 Setting oldest year as active...');
    const oldestYear = await client.query(`
      SELECT * FROM tahun_ajaran
      ORDER BY tahun_mulai ASC
      LIMIT 1
    `);

    if (oldestYear.rows.length > 0) {
      await client.query(
        'UPDATE tahun_ajaran SET is_active = TRUE, status = $1 WHERE id = $2',
        ['berjalan', oldestYear.rows[0].id]
      );
      console.log(`✅ Set ${oldestYear.rows[0].kode} as active year`);
    }

    await client.query('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS! Test data has been cleaned.');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log(`   - Migration logs deleted: ${logResult.rowCount}`);
    console.log(`   - Santri records deleted: ${staResult.rowCount}`);
    console.log(`   - Active year: ${oldestYear.rows[0]?.kode || 'None'}`);
    console.log('\n💡 Next Steps:');
    console.log('   1. Restart backend server');
    console.log('   2. Refresh browser');
    console.log('   3. Add santri to the active year');
    console.log('   4. Test migration and rollback');
    console.log('\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error cleaning data:', error.message);
    console.error('❌ Error stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await db.pool.end();
  }
}

cleanTestData();

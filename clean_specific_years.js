/**
 * Script untuk membersihkan data dari tahun ajaran tertentu
 * Lebih aman karena bisa pilih tahun mana yang mau dihapus
 * Jalankan dengan: node clean_specific_years.js
 */

const db = require('./db');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function cleanSpecificYears() {
  console.log('🧹 Clean Specific Years Data\n');

  const client = await db.pool.connect();

  try {
    // Show all years
    const yearsResult = await client.query(`
      SELECT
        ta.id,
        ta.kode,
        ta.status,
        ta.is_active,
        COUNT(sta.id)::INTEGER AS jumlah_santri
      FROM tahun_ajaran ta
      LEFT JOIN santri_tahun_ajaran sta ON sta.tahun_ajaran_id = ta.id
      GROUP BY ta.id
      ORDER BY ta.tahun_mulai
    `);

    console.log('📋 Daftar Tahun Ajaran:\n');
    console.log('ID | Kode      | Status    | Active | Jumlah Santri');
    console.log('---|-----------|-----------|--------|---------------');
    yearsResult.rows.forEach(year => {
      const active = year.is_active ? '✅' : '  ';
      console.log(`${year.id.toString().padEnd(2)} | ${year.kode.padEnd(9)} | ${year.status.padEnd(9)} | ${active}     | ${year.jumlah_santri}`);
    });

    console.log('\n');

    // Ask which years to clean
    const answer = await question('Masukkan ID tahun ajaran yang mau dihapus datanya (pisahkan dengan koma, contoh: 5,6,7): ');

    if (!answer.trim()) {
      console.log('❌ Tidak ada tahun yang dipilih. Dibatalkan.');
      rl.close();
      await db.pool.end();
      return;
    }

    const yearIds = answer.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (yearIds.length === 0) {
      console.log('❌ ID tidak valid. Dibatalkan.');
      rl.close();
      await db.pool.end();
      return;
    }

    // Show selected years
    const selectedYears = yearsResult.rows.filter(y => yearIds.includes(y.id));
    console.log('\n📝 Tahun yang akan dihapus datanya:');
    selectedYears.forEach(year => {
      console.log(`   - ${year.kode} (${year.jumlah_santri} santri)`);
    });

    // Confirm
    const confirm = await question('\n⚠️  Yakin mau hapus data dari tahun-tahun ini? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Dibatalkan.');
      rl.close();
      await db.pool.end();
      return;
    }

    console.log('\n🔄 Processing...\n');

    await client.query('BEGIN');

    // Delete santri_tahun_ajaran for selected years
    console.log('🔄 Deleting santri_tahun_ajaran data...');
    const deleteResult = await client.query(
      'DELETE FROM santri_tahun_ajaran WHERE tahun_ajaran_id = ANY($1::int[]) RETURNING id',
      [yearIds]
    );
    console.log(`✅ Deleted ${deleteResult.rowCount} santri records`);

    // Delete migration logs related to these years
    console.log('🔄 Deleting related migration logs...');
    const logResult = await client.query(
      'DELETE FROM migration_log WHERE source_tahun_ajaran_id = ANY($1::int[]) OR target_tahun_ajaran_id = ANY($1::int[]) RETURNING id',
      [yearIds]
    );
    console.log(`✅ Deleted ${logResult.rowCount} migration logs`);

    await client.query('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS! Data has been cleaned.');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log(`   - Santri records deleted: ${deleteResult.rowCount}`);
    console.log(`   - Migration logs deleted: ${logResult.rowCount}`);
    console.log('\n💡 Next Steps:');
    console.log('   1. Restart backend server');
    console.log('   2. Refresh browser');
    console.log('   3. Test migration and rollback');
    console.log('\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    client.release();
    rl.close();
    await db.pool.end();
  }
}

cleanSpecificYears();

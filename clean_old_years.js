/**
 * Script untuk membersihkan data dari tahun-tahun LAMA (sebelum tahun tertentu)
 * Jalankan dengan: node clean_old_years.js
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

async function cleanOldYears() {
  console.log('🧹 Clean Old Years Data\n');

  const client = await db.pool.connect();

  try {
    // Show all years
    const yearsResult = await client.query(`
      SELECT
        ta.id,
        ta.kode,
        ta.tahun_mulai,
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

    // Ask for cutoff year
    const answer = await question('Hapus data SEBELUM tahun berapa? (contoh: 2027-2028): ');

    if (!answer.trim()) {
      console.log('❌ Tidak ada tahun yang dipilih. Dibatalkan.');
      rl.close();
      await db.pool.end();
      return;
    }

    const cutoffYear = answer.trim();
    const cutoffYearData = yearsResult.rows.find(y => y.kode === cutoffYear);

    if (!cutoffYearData) {
      console.log(`❌ Tahun ${cutoffYear} tidak ditemukan. Dibatalkan.`);
      rl.close();
      await db.pool.end();
      return;
    }

    // Get years before cutoff
    const yearsToDelete = yearsResult.rows.filter(y => y.tahun_mulai < cutoffYearData.tahun_mulai);

    if (yearsToDelete.length === 0) {
      console.log(`❌ Tidak ada tahun sebelum ${cutoffYear}. Dibatalkan.`);
      rl.close();
      await db.pool.end();
      return;
    }

    // Show years to delete
    console.log(`\n📝 Tahun yang akan dihapus datanya (SEBELUM ${cutoffYear}):\n`);
    let totalSantri = 0;
    yearsToDelete.forEach(year => {
      console.log(`   - ${year.kode} (${year.jumlah_santri} santri)`);
      totalSantri += year.jumlah_santri;
    });
    console.log(`\n   Total: ${yearsToDelete.length} tahun, ${totalSantri} santri`);

    // Confirm
    const confirm = await question(`\n⚠️  Yakin mau hapus data dari ${yearsToDelete.length} tahun ini? (yes/no): `);

    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Dibatalkan.');
      rl.close();
      await db.pool.end();
      return;
    }

    console.log('\n🔄 Processing...\n');

    await client.query('BEGIN');

    const yearIds = yearsToDelete.map(y => y.id);

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

    // Reset status of deleted years to draft
    console.log('🔄 Resetting year statuses to draft...');
    await client.query(
      'UPDATE tahun_ajaran SET status = $1, is_active = FALSE WHERE id = ANY($2::int[])',
      ['draft', yearIds]
    );
    console.log(`✅ Reset ${yearIds.length} years to draft status`);

    await client.query('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS! Old years data has been cleaned.');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log(`   - Years cleaned: ${yearsToDelete.length}`);
    console.log(`   - Santri records deleted: ${deleteResult.rowCount}`);
    console.log(`   - Migration logs deleted: ${logResult.rowCount}`);
    console.log(`   - Cutoff year: ${cutoffYear} (data kept)`);
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

cleanOldYears();

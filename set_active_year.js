/**
 * Script untuk set tahun ajaran berjalan
 * Jalankan dengan: node set_active_year.js
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

async function setActiveYear() {
  console.log('🔧 Set Active Year\n');

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

    if (yearsResult.rows.length === 0) {
      console.log('❌ Tidak ada tahun ajaran di database.');
      rl.close();
      await db.pool.end();
      return;
    }

    console.log('📋 Daftar Tahun Ajaran:\n');
    console.log('ID | Kode      | Status    | Active | Jumlah Santri');
    console.log('---|-----------|-----------|--------|---------------');
    yearsResult.rows.forEach(year => {
      const active = year.is_active ? '✅' : '  ';
      console.log(`${year.id.toString().padEnd(2)} | ${year.kode.padEnd(9)} | ${year.status.padEnd(9)} | ${active}     | ${year.jumlah_santri}`);
    });

    console.log('\n');

    // Ask which year to set as active
    const answer = await question('Tahun mana yang mau dijadikan tahun berjalan? (contoh: 2025-2026): ');

    if (!answer.trim()) {
      console.log('❌ Tidak ada tahun yang dipilih. Dibatalkan.');
      rl.close();
      await db.pool.end();
      return;
    }

    const selectedKode = answer.trim();
    const selectedYear = yearsResult.rows.find(y => y.kode === selectedKode);

    if (!selectedYear) {
      console.log(`❌ Tahun ${selectedKode} tidak ditemukan. Dibatalkan.`);
      rl.close();
      await db.pool.end();
      return;
    }

    console.log(`\n📝 Akan set ${selectedYear.kode} sebagai tahun berjalan`);
    console.log(`   Current status: ${selectedYear.status}`);
    console.log(`   Jumlah santri: ${selectedYear.jumlah_santri}`);

    // Confirm
    const confirm = await question(`\n⚠️  Yakin? (yes/no): `);

    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Dibatalkan.');
      rl.close();
      await db.pool.end();
      return;
    }

    console.log('\n🔄 Processing...\n');

    await client.query('BEGIN');

    // Set all years to inactive first (to avoid constraint violation)
    console.log('🔄 Setting all years to inactive...');
    await client.query('UPDATE tahun_ajaran SET is_active = FALSE');
    console.log('✅ All years set to inactive');

    // Set older years to "arsip"
    console.log('🔄 Setting older years to arsip...');
    await client.query(
      'UPDATE tahun_ajaran SET status = $1 WHERE tahun_mulai < $2',
      ['arsip', selectedYear.tahun_mulai]
    );
    console.log('✅ Older years set to arsip');

    // Set newer years to "draft"
    console.log('🔄 Setting newer years to draft...');
    await client.query(
      'UPDATE tahun_ajaran SET status = $1 WHERE tahun_mulai > $2',
      ['draft', selectedYear.tahun_mulai]
    );
    console.log('✅ Newer years set to draft');

    // Set selected year as active
    console.log(`🔄 Setting ${selectedYear.kode} as active year...`);
    await client.query(
      'UPDATE tahun_ajaran SET status = $1, is_active = TRUE WHERE id = $2',
      ['berjalan', selectedYear.id]
    );
    console.log(`✅ ${selectedYear.kode} set as active year`);

    await client.query('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS! Active year has been set.');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log(`   - Active year: ${selectedYear.kode}`);
    console.log(`   - Status: berjalan`);
    console.log(`   - Jumlah santri: ${selectedYear.jumlah_santri}`);
    console.log('\n💡 Next Steps:');
    console.log('   1. Restart backend server (if running)');
    console.log('   2. Refresh browser');
    console.log('   3. Check if the year card shows "Berjalan"');
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

setActiveYear();

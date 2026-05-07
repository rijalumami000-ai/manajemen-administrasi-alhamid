/**
 * Test Script: Verify tingkat column migration
 *
 * This script verifies that the tingkat column was correctly added and populated
 * for all class types.
 */

const db = require('../db');

async function testMigration() {
  const client = await db.pool.connect();

  try {
    console.log('🧪 Testing tingkat migration...\n');

    // Test 1: Verify column exists
    console.log('Test 1: Verify tingkat column exists');
    const columnResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'kelas' AND column_name = 'tingkat'
    `);

    if (columnResult.rows.length === 0) {
      throw new Error('❌ tingkat column does not exist');
    }

    const column = columnResult.rows[0];
    if (column.data_type !== 'integer') {
      throw new Error(`❌ tingkat column has wrong type: ${column.data_type}`);
    }

    if (column.is_nullable !== 'NO') {
      throw new Error('❌ tingkat column should be NOT NULL');
    }

    console.log('✅ tingkat column exists with correct type and NOT NULL constraint\n');

    // Test 2: Verify index exists
    console.log('Test 2: Verify index on (jenis, tingkat) exists');
    const indexResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'kelas' AND indexname = 'idx_kelas_jenis_tingkat'
    `);

    if (indexResult.rows.length === 0) {
      throw new Error('❌ Index idx_kelas_jenis_tingkat does not exist');
    }

    console.log('✅ Index idx_kelas_jenis_tingkat exists\n');

    // Test 3: Verify all classes have tingkat assigned
    console.log('Test 3: Verify all classes have tingkat assigned');
    const unassignedResult = await client.query(`
      SELECT COUNT(*) as count FROM kelas WHERE tingkat IS NULL
    `);

    if (parseInt(unassignedResult.rows[0].count) > 0) {
      throw new Error(`❌ ${unassignedResult.rows[0].count} classes do not have tingkat assigned`);
    }

    console.log('✅ All classes have tingkat assigned\n');

    // Test 4: Verify Diniyah tingkat values (0-6)
    console.log('Test 4: Verify Diniyah tingkat values');
    const diniyahResult = await client.query(`
      SELECT tingkat, COUNT(*) as count
      FROM kelas
      WHERE jenis = 'Diniyah'
      GROUP BY tingkat
      ORDER BY tingkat
    `);

    console.log('   Diniyah classes:');
    diniyahResult.rows.forEach(row => {
      console.log(`   - tingkat ${row.tingkat}: ${row.count} class(es)`);
    });

    const diniyahTingkats = diniyahResult.rows.map(r => parseInt(r.tingkat));
    const invalidDiniyah = diniyahTingkats.filter(t => t < 0 || t > 6);

    if (invalidDiniyah.length > 0) {
      throw new Error(`❌ Invalid Diniyah tingkat values: ${invalidDiniyah.join(', ')}`);
    }

    console.log('✅ All Diniyah tingkat values are valid (0-6)\n');

    // Test 5: Verify Sekolah tingkat values (7-12)
    console.log('Test 5: Verify Sekolah tingkat values');
    const sekolahResult = await client.query(`
      SELECT tingkat, COUNT(*) as count
      FROM kelas
      WHERE jenis = 'Sekolah'
      GROUP BY tingkat
      ORDER BY tingkat
    `);

    console.log('   Sekolah classes:');
    sekolahResult.rows.forEach(row => {
      console.log(`   - tingkat ${row.tingkat}: ${row.count} class(es)`);
    });

    const sekolahTingkats = sekolahResult.rows.map(r => parseInt(r.tingkat));
    const invalidSekolah = sekolahTingkats.filter(t => t < 7 || t > 12);

    if (invalidSekolah.length > 0) {
      throw new Error(`❌ Invalid Sekolah tingkat values: ${invalidSekolah.join(', ')}`);
    }

    console.log('✅ All Sekolah tingkat values are valid (7-12)\n');

    // Test 6: Verify specific class examples
    console.log('Test 6: Verify specific class examples');

    const testCases = [
      { jenis: 'Diniyah', pattern: '%sifir%', expectedTingkat: 0, description: 'Sifir' },
      { jenis: 'Diniyah', pattern: '%SP%', expectedTingkat: 1, description: 'SP (Special Program)' },
      { jenis: 'Sekolah', pattern: '7%', expectedTingkat: 7, description: 'Kelas 7' }
    ];

    for (const testCase of testCases) {
      const result = await client.query(`
        SELECT nama, tingkat
        FROM kelas
        WHERE jenis = $1 AND nama ILIKE $2
        LIMIT 1
      `, [testCase.jenis, testCase.pattern]);

      if (result.rows.length > 0) {
        const kelas = result.rows[0];
        if (kelas.tingkat !== testCase.expectedTingkat) {
          throw new Error(
            `❌ ${testCase.description} (${kelas.nama}) has wrong tingkat: ${kelas.tingkat}, expected ${testCase.expectedTingkat}`
          );
        }
        console.log(`   ✅ ${testCase.description} (${kelas.nama}): tingkat ${kelas.tingkat}`);
      } else {
        console.log(`   ⚠️  No ${testCase.description} class found (skipping)`);
      }
    }

    console.log('\n✅ All specific class examples are correct\n');

    // Test 7: Verify query performance with index
    console.log('Test 7: Verify query performance with index');
    const explainResult = await client.query(`
      EXPLAIN SELECT * FROM kelas WHERE jenis = 'Diniyah' AND tingkat = 1
    `);

    const usesIndex = explainResult.rows.some(row =>
      row['QUERY PLAN'].includes('idx_kelas_jenis_tingkat')
    );

    if (usesIndex) {
      console.log('✅ Query uses idx_kelas_jenis_tingkat index\n');
    } else {
      console.log('⚠️  Query does not use index (may be OK for small tables)\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ All tests passed! Migration is successful.');
    console.log('═══════════════════════════════════════════════════════\n');

    // Display full summary
    const summaryResult = await client.query(`
      SELECT jenis, tingkat, COUNT(*) as count, STRING_AGG(nama, ', ') as classes
      FROM kelas
      GROUP BY jenis, tingkat
      ORDER BY jenis, tingkat
    `);

    console.log('📊 Complete Summary:');
    summaryResult.rows.forEach(row => {
      console.log(`   ${row.jenis} tingkat ${row.tingkat}: ${row.count} class(es)`);
      console.log(`      Classes: ${row.classes}`);
    });

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run tests if called directly
if (require.main === module) {
  testMigration()
    .then(() => {
      console.log('\n✅ All tests completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testMigration };

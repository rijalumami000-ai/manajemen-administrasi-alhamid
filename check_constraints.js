/**
 * Check Database Constraints
 *
 * This script checks all required UNIQUE constraints for the migration feature.
 */

const db = require('./db');

async function checkConstraints() {
  const client = await db.pool.connect();

  try {
    console.log('🔍 Checking database constraints...\n');

    // Check 1: santri_tahun_ajaran UNIQUE constraint
    console.log('1️⃣ Checking santri_tahun_ajaran UNIQUE (tahun_ajaran_id, santri_id)...');
    const check1 = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'santri_tahun_ajaran'
        AND constraint_type = 'UNIQUE'
    `);

    if (check1.rows.length > 0) {
      console.log('   ✅ Found constraints:');
      check1.rows.forEach(row => {
        console.log(`      - ${row.constraint_name}`);
      });
    } else {
      console.log('   ❌ No UNIQUE constraints found!');
    }

    // Check 2: alumni UNIQUE constraint
    console.log('\n2️⃣ Checking alumni UNIQUE (santri_id)...');
    const check2 = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'alumni'
        AND constraint_type = 'UNIQUE'
    `);

    if (check2.rows.length > 0) {
      console.log('   ✅ Found constraints:');
      check2.rows.forEach(row => {
        console.log(`      - ${row.constraint_name}`);
      });
    } else {
      console.log('   ❌ No UNIQUE constraints found!');
    }

    // Check 3: kelas tingkat column
    console.log('\n3️⃣ Checking kelas tingkat column...');
    const check3 = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'kelas'
        AND column_name = 'tingkat'
    `);

    if (check3.rows.length > 0) {
      console.log('   ✅ Column exists:');
      console.log(`      - Type: ${check3.rows[0].data_type}`);
      console.log(`      - Nullable: ${check3.rows[0].is_nullable}`);
    } else {
      console.log('   ❌ Column not found!');
    }

    // Check 4: Sample kelas with tingkat
    console.log('\n4️⃣ Checking sample kelas data...');
    const check4 = await client.query(`
      SELECT jenis, nama, tingkat
      FROM kelas
      ORDER BY jenis, tingkat
      LIMIT 10
    `);

    if (check4.rows.length > 0) {
      console.log('   ✅ Sample data:');
      check4.rows.forEach(row => {
        console.log(`      - ${row.jenis} ${row.nama} (tingkat: ${row.tingkat})`);
      });
    } else {
      console.log('   ⚠️  No kelas data found!');
    }

    // Check 5: Kelas without tingkat
    console.log('\n5️⃣ Checking kelas without tingkat...');
    const check5 = await client.query(`
      SELECT id, jenis, nama
      FROM kelas
      WHERE tingkat IS NULL
    `);

    if (check5.rows.length > 0) {
      console.log('   ❌ Found kelas without tingkat:');
      check5.rows.forEach(row => {
        console.log(`      - ID ${row.id}: ${row.jenis} ${row.nama}`);
      });
    } else {
      console.log('   ✅ All kelas have tingkat assigned');
    }

    // Check 6: Duplicate santri_tahun_ajaran
    console.log('\n6️⃣ Checking for duplicate santri_tahun_ajaran records...');
    const check6 = await client.query(`
      SELECT tahun_ajaran_id, santri_id, COUNT(*) as count
      FROM santri_tahun_ajaran
      GROUP BY tahun_ajaran_id, santri_id
      HAVING COUNT(*) > 1
    `);

    if (check6.rows.length > 0) {
      console.log('   ❌ Found duplicates:');
      check6.rows.forEach(row => {
        console.log(`      - tahun_ajaran_id: ${row.tahun_ajaran_id}, santri_id: ${row.santri_id}, count: ${row.count}`);
      });
    } else {
      console.log('   ✅ No duplicates found');
    }

    // Check 7: Duplicate alumni
    console.log('\n7️⃣ Checking for duplicate alumni records...');
    const check7 = await client.query(`
      SELECT santri_id, COUNT(*) as count
      FROM alumni
      GROUP BY santri_id
      HAVING COUNT(*) > 1
    `);

    if (check7.rows.length > 0) {
      console.log('   ❌ Found duplicates:');
      check7.rows.forEach(row => {
        console.log(`      - santri_id: ${row.santri_id}, count: ${row.count}`);
      });
    } else {
      console.log('   ✅ No duplicates found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log('='.repeat(60));

    const issues = [];

    if (check1.rows.length === 0) {
      issues.push('❌ Missing UNIQUE constraint on santri_tahun_ajaran');
    }

    if (check2.rows.length === 0) {
      issues.push('❌ Missing UNIQUE constraint on alumni');
    }

    if (check3.rows.length === 0) {
      issues.push('❌ Missing tingkat column on kelas');
    }

    if (check5.rows.length > 0) {
      issues.push(`❌ ${check5.rows.length} kelas without tingkat`);
    }

    if (check6.rows.length > 0) {
      issues.push(`❌ ${check6.rows.length} duplicate santri_tahun_ajaran records`);
    }

    if (check7.rows.length > 0) {
      issues.push(`❌ ${check7.rows.length} duplicate alumni records`);
    }

    if (issues.length > 0) {
      console.log('\n⚠️  Issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
      console.log('\n💡 Run fix scripts to resolve issues:');
      console.log('   - node fix_unique_constraint.js');
      console.log('   - node migrations/add_tingkat_to_kelas.js up');
    } else {
      console.log('\n✅ All checks passed! Database is ready for migration.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

// Run check
checkConstraints()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });

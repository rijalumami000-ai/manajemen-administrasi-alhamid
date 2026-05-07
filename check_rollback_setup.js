/**
 * Script untuk mengecek apakah setup rollback sudah lengkap
 * Jalankan dengan: node check_rollback_setup.js
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

console.log('🔍 Checking Rollback Feature Setup...\n');

let allGood = true;

// 1. Check frontend files
console.log('📁 Checking Frontend Files:');

const frontendFiles = [
  'frontend/src/pages/Santri.jsx',
  'frontend/src/services/santriService.js',
  'public/index.html',
  'public/assets/Santri-BBiJzwJo.js'
];

frontendFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NOT FOUND`);
    allGood = false;
  }
});

// 2. Check if old files are removed
console.log('\n🗑️  Checking Old Files (should be deleted):');

const oldFiles = [
  'public/assets/Santri-DySQbw49.js',
  'public/assets/index-C5nPI74w.js'
];

oldFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`  ✅ ${file} - Deleted (Good!)`);
  } else {
    console.log(`  ⚠️  ${file} - Still exists (Should be deleted!)`);
    allGood = false;
  }
});

// 3. Check backend route
console.log('\n🔧 Checking Backend Route:');

const routeFile = 'src/routes/tahunAjaranRoutes.js';
if (fs.existsSync(routeFile)) {
  const content = fs.readFileSync(routeFile, 'utf8');
  if (content.includes('/api/tahun-ajaran/rollback')) {
    console.log(`  ✅ Rollback endpoint exists in ${routeFile}`);
  } else {
    console.log(`  ❌ Rollback endpoint NOT FOUND in ${routeFile}`);
    allGood = false;
  }
} else {
  console.log(`  ❌ ${routeFile} - NOT FOUND`);
  allGood = false;
}

// 4. Check migration_log table SQL
console.log('\n📄 Checking SQL Schema:');

const sqlFile = 'migration_log_table.sql';
if (fs.existsSync(sqlFile)) {
  console.log(`  ✅ ${sqlFile} exists`);
} else {
  console.log(`  ❌ ${sqlFile} - NOT FOUND`);
  allGood = false;
}

// 5. Check database table
console.log('\n🗄️  Checking Database Table:');

(async () => {
  try {
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'migration_log'
      );
    `);

    if (result.rows[0].exists) {
      console.log('  ✅ Table "migration_log" exists in database');

      // Check table structure
      const columns = await db.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'migration_log'
        ORDER BY ordinal_position;
      `);

      console.log('\n  📋 Table Structure:');
      columns.rows.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.data_type}`);
      });

    } else {
      console.log('  ❌ Table "migration_log" DOES NOT EXIST in database');
      console.log('     👉 Run: psql -U your_username -d your_database -f migration_log_table.sql');
      allGood = false;
    }

  } catch (error) {
    console.log('  ❌ Database connection error:', error.message);
    console.log('     👉 Make sure database is running and .env is configured correctly');
    allGood = false;
  } finally {
    await db.pool.end();

    // Final summary
    console.log('\n' + '='.repeat(60));
    if (allGood) {
      console.log('✅ ALL CHECKS PASSED! Rollback feature is ready to use.');
      console.log('\n📝 Next Steps:');
      console.log('   1. Restart backend server (if not already)');
      console.log('   2. Clear browser cache (Ctrl+Shift+Delete)');
      console.log('   3. Hard refresh browser (Ctrl+Shift+R)');
      console.log('   4. Test rollback feature');
    } else {
      console.log('❌ SOME CHECKS FAILED! Please fix the issues above.');
      console.log('\n📖 Read ROLLBACK_BUTTON_FIX.md for detailed instructions.');
    }
    console.log('='.repeat(60));
  }
})();

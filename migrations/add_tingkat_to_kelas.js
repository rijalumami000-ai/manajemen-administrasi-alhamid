/**
 * Migration Script: Add tingkat column to kelas table
 *
 * This migration adds a tingkat (level) column to the kelas table to support
 * automatic class progression during academic year migration.
 *
 * Tingkat values:
 * - Diniyah: 0 (Sifir), 1 (Kelas 1 & SP), 2-6 (Kelas 2-6)
 * - Sekolah: 7-9 (MTs), 10-12 (MA)
 */

const db = require('../db');

async function up() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Adding tingkat column to kelas table...');

    // Add tingkat column
    await client.query('ALTER TABLE kelas ADD COLUMN IF NOT EXISTS tingkat INTEGER');
    console.log('✅ Column added');

    console.log('📝 Updating Diniyah classes...');

    // Update Diniyah classes
    await client.query(`
      UPDATE kelas SET tingkat = 0
      WHERE jenis = 'Diniyah' AND nama ILIKE '%sifir%'
    `);

    await client.query(`
      UPDATE kelas SET tingkat = 1
      WHERE jenis = 'Diniyah' AND (nama ~ '^1[A-Z]?' OR nama ILIKE 'kelas 1%')
      AND nama NOT ILIKE '%SP%'
    `);

    // Kelas SP (Special Program) also uses tingkat 1
    await client.query(`
      UPDATE kelas SET tingkat = 1
      WHERE jenis = 'Diniyah' AND nama ILIKE '%SP%'
    `);

    await client.query(`
      UPDATE kelas SET tingkat = 2
      WHERE jenis = 'Diniyah' AND (nama ~ '^2[A-Z]?' OR nama ILIKE 'kelas 2%')
    `);

    await client.query(`
      UPDATE kelas SET tingkat = 3
      WHERE jenis = 'Diniyah' AND (nama ~ '^3[A-Z]?' OR nama ILIKE 'kelas 3%')
    `);

    await client.query(`
      UPDATE kelas SET tingkat = 4
      WHERE jenis = 'Diniyah' AND (nama ~ '^4[A-Z]?' OR nama ILIKE 'kelas 4%')
    `);

    await client.query(`
      UPDATE kelas SET tingkat = 5
      WHERE jenis = 'Diniyah' AND (nama ~ '^5[A-Z]?' OR nama ILIKE 'kelas 5%')
    `);

    await client.query(`
      UPDATE kelas SET tingkat = 6
      WHERE jenis = 'Diniyah' AND (nama ~ '^6[A-Z]?' OR nama ILIKE 'kelas 6%')
    `);

    console.log('✅ Diniyah classes updated');

    console.log('📝 Updating Sekolah classes...');

    // Update Sekolah classes
    await client.query(`
      UPDATE kelas SET tingkat = 7
      WHERE jenis = 'Sekolah' AND (nama ~ '^7[A-Z]?' OR nama ILIKE 'kelas 7%')
    `);

    await client.query(`
      UPDATE kelas SET tingkat = 8
      WHERE jenis = 'Sekolah' AND (nama ~ '^8[A-Z]?' OR nama ILIKE 'kelas 8%')
    `);

    await client.query(`
      UPDATE kelas SET tingkat = 9
      WHERE jenis = 'Sekolah' AND (nama ~ '^9[A-Z]?' OR nama ILIKE 'kelas 9%')
    `);

    await client.query(`
      UPDATE kelas SET tingkat = 10
      WHERE jenis = 'Sekolah' AND (nama ~ '^10' OR nama ILIKE 'kelas 10%')
    `);

    await client.query(`
      UPDATE kelas SET tingkat = 11
      WHERE jenis = 'Sekolah' AND (nama ~ '^11' OR nama ILIKE 'kelas 11%')
    `);

    await client.query(`
      UPDATE kelas SET tingkat = 12
      WHERE jenis = 'Sekolah' AND (nama ~ '^12' OR nama ILIKE 'kelas 12%')
    `);

    console.log('✅ Sekolah classes updated');

    // Verify all classes have tingkat assigned
    console.log('📝 Verifying tingkat assignments...');
    const unassignedResult = await client.query(`
      SELECT jenis, nama, tingkat FROM kelas WHERE tingkat IS NULL
    `);

    if (unassignedResult.rows.length > 0) {
      console.warn('⚠️  Warning: Some classes do not have tingkat assigned:');
      unassignedResult.rows.forEach(row => {
        console.warn(`   - ${row.jenis}: ${row.nama}`);
      });
      throw new Error('Some classes do not have tingkat assigned. Please review and update manually.');
    }

    console.log('✅ All classes have tingkat assigned');

    // Add NOT NULL constraint
    console.log('📝 Adding NOT NULL constraint...');
    await client.query('ALTER TABLE kelas ALTER COLUMN tingkat SET NOT NULL');
    console.log('✅ NOT NULL constraint added');

    // Create index for performance
    console.log('📝 Creating index on (jenis, tingkat)...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_kelas_jenis_tingkat ON kelas(jenis, tingkat)
    `);
    console.log('✅ Index created');

    await client.query('COMMIT');
    console.log('✅ Migration completed successfully');

    // Display summary
    const summaryResult = await client.query(`
      SELECT jenis, tingkat, COUNT(*) as count
      FROM kelas
      GROUP BY jenis, tingkat
      ORDER BY jenis, tingkat
    `);

    console.log('\n📊 Summary of tingkat assignments:');
    summaryResult.rows.forEach(row => {
      console.log(`   ${row.jenis} tingkat ${row.tingkat}: ${row.count} class(es)`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📝 Rolling back migration...');

    // Drop index
    await client.query('DROP INDEX IF EXISTS idx_kelas_jenis_tingkat');
    console.log('✅ Index dropped');

    // Drop column
    await client.query('ALTER TABLE kelas DROP COLUMN IF EXISTS tingkat');
    console.log('✅ Column dropped');

    await client.query('COMMIT');
    console.log('✅ Rollback completed successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'up') {
    up()
      .then(() => {
        console.log('✅ Migration completed');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
      });
  } else if (command === 'down') {
    down()
      .then(() => {
        console.log('✅ Rollback completed');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Rollback failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage: node add_tingkat_to_kelas.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };

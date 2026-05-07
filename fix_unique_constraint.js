/**
 * Fix Script: Add UNIQUE constraint to santri_tahun_ajaran table
 *
 * This script ensures the UNIQUE constraint on (tahun_ajaran_id, santri_id) exists.
 * This constraint is required for the ON CONFLICT clause in migration.
 */

const db = require('./db');

async function fixUniqueConstraint() {
  const client = await db.pool.connect();

  try {
    console.log('🔍 Checking for UNIQUE constraint on santri_tahun_ajaran...');

    // Check if constraint exists
    const checkResult = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'santri_tahun_ajaran'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%tahun_ajaran_id%santri_id%'
        OR constraint_name LIKE '%santri_id%tahun_ajaran_id%'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ UNIQUE constraint already exists:', checkResult.rows[0].constraint_name);
      return;
    }

    console.log('⚠️  UNIQUE constraint not found. Creating...');

    await client.query('BEGIN');

    // Check for duplicate records first
    console.log('🔍 Checking for duplicate records...');
    const duplicatesResult = await client.query(`
      SELECT tahun_ajaran_id, santri_id, COUNT(*) as count
      FROM santri_tahun_ajaran
      GROUP BY tahun_ajaran_id, santri_id
      HAVING COUNT(*) > 1
    `);

    if (duplicatesResult.rows.length > 0) {
      console.log('⚠️  Found duplicate records:');
      duplicatesResult.rows.forEach(row => {
        console.log(`   - tahun_ajaran_id: ${row.tahun_ajaran_id}, santri_id: ${row.santri_id}, count: ${row.count}`);
      });

      console.log('🔧 Removing duplicates (keeping the latest record)...');

      for (const dup of duplicatesResult.rows) {
        // Keep the record with the highest ID (latest), delete others
        await client.query(`
          DELETE FROM santri_tahun_ajaran
          WHERE tahun_ajaran_id = $1 AND santri_id = $2
            AND id NOT IN (
              SELECT MAX(id)
              FROM santri_tahun_ajaran
              WHERE tahun_ajaran_id = $1 AND santri_id = $2
            )
        `, [dup.tahun_ajaran_id, dup.santri_id]);
      }

      console.log('✅ Duplicates removed');
    } else {
      console.log('✅ No duplicate records found');
    }

    // Create UNIQUE constraint
    console.log('📝 Creating UNIQUE constraint...');
    await client.query(`
      ALTER TABLE santri_tahun_ajaran
      ADD CONSTRAINT santri_tahun_ajaran_tahun_ajaran_id_santri_id_key
      UNIQUE (tahun_ajaran_id, santri_id)
    `);

    await client.query('COMMIT');
    console.log('✅ UNIQUE constraint created successfully');

    // Verify
    const verifyResult = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'santri_tahun_ajaran'
        AND constraint_type = 'UNIQUE'
    `);

    console.log('\n📊 Current UNIQUE constraints on santri_tahun_ajaran:');
    verifyResult.rows.forEach(row => {
      console.log(`   - ${row.constraint_name}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

// Run fix
fixUniqueConstraint()
  .then(() => {
    console.log('\n✅ Fix completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  });

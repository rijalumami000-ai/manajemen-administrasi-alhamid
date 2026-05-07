/**
 * Fix Script: Add UNIQUE constraint to alumni table
 *
 * This script ensures the UNIQUE constraint on santri_id exists in alumni table.
 * This constraint is required for the ON CONFLICT clause in alumni creation.
 */

const db = require('./db');

async function fixAlumniConstraint() {
  const client = await db.pool.connect();

  try {
    console.log('🔍 Checking for UNIQUE constraint on alumni.santri_id...');

    // Check if constraint exists
    const checkResult = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'alumni'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%santri_id%'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ UNIQUE constraint already exists:', checkResult.rows[0].constraint_name);
      return;
    }

    console.log('⚠️  UNIQUE constraint not found. Creating...');

    await client.query('BEGIN');

    // Check for duplicate records first
    console.log('🔍 Checking for duplicate alumni records...');
    const duplicatesResult = await client.query(`
      SELECT santri_id, COUNT(*) as count
      FROM alumni
      GROUP BY santri_id
      HAVING COUNT(*) > 1
    `);

    if (duplicatesResult.rows.length > 0) {
      console.log('⚠️  Found duplicate alumni records:');
      duplicatesResult.rows.forEach(row => {
        console.log(`   - santri_id: ${row.santri_id}, count: ${row.count}`);
      });

      console.log('🔧 Removing duplicates (keeping the latest record)...');

      for (const dup of duplicatesResult.rows) {
        // Keep the record with the highest ID (latest), delete others
        await client.query(`
          DELETE FROM alumni
          WHERE santri_id = $1
            AND id NOT IN (
              SELECT MAX(id)
              FROM alumni
              WHERE santri_id = $1
            )
        `, [dup.santri_id]);
      }

      console.log('✅ Duplicates removed');
    } else {
      console.log('✅ No duplicate records found');
    }

    // Create UNIQUE constraint
    console.log('📝 Creating UNIQUE constraint on alumni.santri_id...');
    await client.query(`
      ALTER TABLE alumni
      ADD CONSTRAINT alumni_santri_id_key
      UNIQUE (santri_id)
    `);

    await client.query('COMMIT');
    console.log('✅ UNIQUE constraint created successfully');

    // Verify
    const verifyResult = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'alumni'
        AND constraint_type = 'UNIQUE'
    `);

    console.log('\n📊 Current UNIQUE constraints on alumni:');
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
fixAlumniConstraint()
  .then(() => {
    console.log('\n✅ Fix completed successfully');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart backend server (Ctrl+C, then node server.js)');
    console.log('   2. Try migration again');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  });

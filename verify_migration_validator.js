/**
 * Verification Script for Migration Validator Service
 *
 * This script demonstrates the Migration Validator service functionality
 * by running validation checks against the database.
 *
 * Usage: node verify_migration_validator.js
 */

const db = require('./db');
const MigrationValidator = require('./src/services/migrationValidator');

async function verifyMigrationValidator() {
  console.log('='.repeat(60));
  console.log('Migration Validator Service Verification');
  console.log('='.repeat(60));
  console.log();

  const validator = new MigrationValidator();
  let client;

  try {
    // Get a database client from the pool
    client = await db.pool.connect();

    console.log('✅ Database connection established');
    console.log();

    // Test 1: Validate Source Year
    console.log('Test 1: Validate Source Year');
    console.log('-'.repeat(60));
    const sourceValidation = await validator.validateSourceYear(client);
    console.log('Result:', {
      valid: sourceValidation.valid,
      sourceYear: sourceValidation.sourceYear ? sourceValidation.sourceYear.kode : null,
      error: sourceValidation.error
    });
    console.log();

    // Test 2: Validate Target Year
    console.log('Test 2: Validate Target Year');
    console.log('-'.repeat(60));
    const targetKode = '2027-2028'; // Example target year
    const targetValidation = await validator.validateTargetYear(targetKode, client);
    console.log('Result:', {
      valid: targetValidation.valid,
      targetYear: targetValidation.year ? targetValidation.year.kode : 'Will be created',
      error: targetValidation.error
    });
    console.log();

    // Test 3: Get Existing Alumni
    console.log('Test 3: Get Existing Alumni');
    console.log('-'.repeat(60));
    const alumniValidation = await validator.getExistingAlumni(client);
    console.log('Result:', {
      valid: alumniValidation.valid,
      alumniCount: alumniValidation.alumniIds.length,
      error: alumniValidation.error
    });
    console.log();

    // Test 4: Validate Class Availability (if source year exists)
    if (sourceValidation.valid && sourceValidation.sourceYear) {
      console.log('Test 4: Validate Class Availability');
      console.log('-'.repeat(60));

      // Fetch source santri
      const santriResult = await client.query(
        `SELECT
          sta.id,
          sta.santri_id,
          sta.kelas_diniyah_id,
          sta.kelas_sekolah_id,
          kd.tingkat AS kelas_diniyah_tingkat,
          kd.nama AS kelas_diniyah_nama,
          ks.tingkat AS kelas_sekolah_tingkat,
          ks.nama AS kelas_sekolah_nama
         FROM santri_tahun_ajaran sta
         LEFT JOIN kelas kd ON sta.kelas_diniyah_id = kd.id
         LEFT JOIN kelas ks ON sta.kelas_sekolah_id = ks.id
         WHERE sta.tahun_ajaran_id = $1 AND sta.status = 'aktif'
         LIMIT 10`,
        [sourceValidation.sourceYear.id]
      );

      const sourceSantri = santriResult.rows;
      console.log(`Found ${sourceSantri.length} sample santri to validate`);

      const classValidation = await validator.validateClassAvailability(sourceSantri, client);
      console.log('Result:', {
        valid: classValidation.valid,
        missingClassesCount: classValidation.missingClasses.length,
        missingClasses: classValidation.missingClasses,
        error: classValidation.error
      });
      console.log();
    }

    // Test 5: Comprehensive Validation
    console.log('Test 5: Comprehensive Migration Validation');
    console.log('-'.repeat(60));
    const comprehensiveValidation = await validator.validateMigration(targetKode, client);
    console.log('Result:', {
      valid: comprehensiveValidation.valid,
      errorsCount: comprehensiveValidation.errors.length,
      errors: comprehensiveValidation.errors,
      sourceYear: comprehensiveValidation.sourceYear ? comprehensiveValidation.sourceYear.kode : null,
      targetYear: comprehensiveValidation.targetYear ? comprehensiveValidation.targetYear.kode : 'Will be created',
      alumniCount: comprehensiveValidation.alumniIds.length,
      missingClassesCount: comprehensiveValidation.missingClasses.length
    });
    console.log();

    console.log('='.repeat(60));
    console.log('✅ Verification Complete');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error(error.stack);
  } finally {
    if (client) {
      client.release();
      console.log('Database connection released');
    }
    await db.pool.end();
    console.log('Database pool closed');
  }
}

// Run verification
verifyMigrationValidator().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

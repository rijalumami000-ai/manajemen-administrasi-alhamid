/**
 * Migration Validator Service
 *
 * Validates migration preconditions before executing academic year migration.
 * Ensures all required target classes exist, source year is active, and
 * existing alumni are excluded from migration.
 *
 * Validation Rules:
 * 1. Target year must exist or be creatable
 * 2. All required target classes must exist (check jenis and tingkat)
 * 3. Existing alumni must be excluded from migration
 * 4. Source year must be active (is_active = TRUE)
 * 5. Return validation errors with missing class details
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 11.1, 11.2
 */

const db = require('../../db');
const {
  getNextDiniyahTingkat,
  getNextSekolahTingkat
} = require('../utils/classProgressionMap');

class MigrationValidator {
  /**
   * Validate target year exists or can be created
   *
   * @param {string} targetKode - Target year code (e.g., "2026-2027")
   * @param {Object} client - Database client for transaction support
   * @returns {Object} { valid: boolean, year: Object|null, error: string|null }
   */
  async validateTargetYear(targetKode, client) {
    console.log(`🔍 Validating target year: ${targetKode}`);

    try {
      // Check if target year already exists
      const result = await client.query(
        'SELECT id, kode, status, is_active FROM tahun_ajaran WHERE kode = $1',
        [targetKode]
      );

      if (result.rows.length > 0) {
        const year = result.rows[0];

        // Check if target year is already active/running
        if (year.status === 'berjalan' || year.is_active) {
          console.log(`❌ Target year ${targetKode} is already active`);
          return {
            valid: false,
            year: null,
            error: `Target year ${targetKode} is already active. Cannot migrate to an active year.`
          };
        }

        console.log(`✅ Target year ${targetKode} exists with status: ${year.status}`);
        return {
          valid: true,
          year: year,
          error: null
        };
      }

      // Target year doesn't exist - this is valid, it will be created during migration
      console.log(`✅ Target year ${targetKode} does not exist (will be created)`);
      return {
        valid: true,
        year: null,
        error: null
      };
    } catch (error) {
      console.error(`❌ Error validating target year:`, error.message);
      return {
        valid: false,
        year: null,
        error: `Failed to validate target year: ${error.message}`
      };
    }
  }

  /**
   * Validate all required target classes exist
   *
   * Checks that for every santri in the source year, the target class
   * they need to advance to exists in the kelas table.
   *
   * @param {Array} sourceSantri - Santri in source year with class info
   * @param {Object} client - Database client for transaction support
   * @returns {Object} { valid: boolean, missingClasses: Array, error: string|null }
   */
  async validateClassAvailability(sourceSantri, client) {
    console.log(`🔍 Validating class availability for ${sourceSantri.length} santri`);

    try {
      // Get all available classes from kelas table
      const kelasResult = await client.query(
        'SELECT id, jenis, nama, tingkat FROM kelas ORDER BY jenis, tingkat'
      );
      const availableClasses = kelasResult.rows;

      console.log(`   Found ${availableClasses.length} available classes`);

      // Track required classes and missing classes
      const requiredClasses = new Map(); // Map of "jenis:tingkat" -> count
      const missingClasses = [];

      // Analyze each santri to determine required target classes
      for (const santri of sourceSantri) {
        try {
          // Check Diniyah advancement
          if (santri.kelas_diniyah_id && santri.kelas_diniyah_tingkat !== null) {
            const currentTingkat = santri.kelas_diniyah_tingkat;
            const currentNama = santri.kelas_diniyah_nama || '';

            const nextTingkat = getNextDiniyahTingkat(currentTingkat, currentNama);

            // If nextTingkat is null, santri is graduating (no class needed)
            if (nextTingkat !== null) {
              const key = `Diniyah:${nextTingkat}`;
              requiredClasses.set(key, (requiredClasses.get(key) || 0) + 1);

              // Check if class exists
              const exists = availableClasses.some(
                kelas => kelas.jenis === 'Diniyah' && kelas.tingkat === nextTingkat
              );

              if (!exists) {
                // Check if we already recorded this missing class
                const existing = missingClasses.find(
                  m => m.jenis === 'Diniyah' && m.tingkat === nextTingkat
                );
                if (!existing) {
                  missingClasses.push({
                    jenis: 'Diniyah',
                    tingkat: nextTingkat,
                    required_for: 1
                  });
                } else {
                  existing.required_for++;
                }
              }
            }
          }

          // Check Sekolah advancement
          if (santri.kelas_sekolah_id && santri.kelas_sekolah_tingkat !== null) {
            const currentTingkat = santri.kelas_sekolah_tingkat;

            const nextTingkat = getNextSekolahTingkat(currentTingkat);

            // If nextTingkat is null, santri is graduating (no class needed)
            if (nextTingkat !== null) {
              const key = `Sekolah:${nextTingkat}`;
              requiredClasses.set(key, (requiredClasses.get(key) || 0) + 1);

              // Check if class exists
              const exists = availableClasses.some(
                kelas => kelas.jenis === 'Sekolah' && kelas.tingkat === nextTingkat
              );

              if (!exists) {
                // Check if we already recorded this missing class
                const existing = missingClasses.find(
                  m => m.jenis === 'Sekolah' && m.tingkat === nextTingkat
                );
                if (!existing) {
                  missingClasses.push({
                    jenis: 'Sekolah',
                    tingkat: nextTingkat,
                    required_for: 1
                  });
                } else {
                  existing.required_for++;
                }
              }
            }
          }
        } catch (error) {
          // Skip santri with errors (will be handled during actual migration)
          console.warn(`⚠️  Validation warning for santri ${santri.santri_id}:`, error.message);
        }
      }

      // Report results
      if (missingClasses.length > 0) {
        console.log(`❌ Found ${missingClasses.length} missing class definitions:`);
        missingClasses.forEach(mc => {
          console.log(`   - ${mc.jenis} tingkat ${mc.tingkat} (required for ${mc.required_for} santri)`);
        });

        return {
          valid: false,
          missingClasses: missingClasses,
          error: `Missing ${missingClasses.length} required class definition(s). Please create these classes before migration.`
        };
      }

      console.log(`✅ All required target classes exist`);
      return {
        valid: true,
        missingClasses: [],
        error: null
      };
    } catch (error) {
      console.error(`❌ Error validating class availability:`, error.message);
      return {
        valid: false,
        missingClasses: [],
        error: `Failed to validate class availability: ${error.message}`
      };
    }
  }

  /**
   * Get existing alumni IDs to exclude from migration
   *
   * Queries the alumni table to get all santri who are already alumni.
   * These santri should be excluded from migration processing.
   *
   * @param {Object} client - Database client for transaction support
   * @returns {Object} { valid: boolean, alumniIds: Array<number>, error: string|null }
   */
  async getExistingAlumni(client) {
    console.log(`🔍 Fetching existing alumni to exclude from migration`);

    try {
      const result = await client.query(
        'SELECT santri_id FROM alumni'
      );

      const alumniIds = result.rows.map(row => row.santri_id);

      console.log(`✅ Found ${alumniIds.length} existing alumni to exclude`);

      return {
        valid: true,
        alumniIds: alumniIds,
        error: null
      };
    } catch (error) {
      console.error(`❌ Error fetching existing alumni:`, error.message);
      return {
        valid: false,
        alumniIds: [],
        error: `Failed to fetch existing alumni: ${error.message}`
      };
    }
  }

  /**
   * Validate source year is active
   *
   * Checks that the source year has is_active = TRUE, which is required
   * for migration to proceed.
   *
   * @param {Object} client - Database client for transaction support
   * @returns {Object} { valid: boolean, sourceYear: Object|null, error: string|null }
   */
  async validateSourceYear(client) {
    console.log(`🔍 Validating source year is active`);

    try {
      // Get the currently active year
      const result = await client.query(
        'SELECT id, kode, status, is_active, tahun_mulai, tahun_selesai FROM tahun_ajaran WHERE is_active = TRUE'
      );

      if (result.rows.length === 0) {
        console.log(`❌ No active source year found`);
        return {
          valid: false,
          sourceYear: null,
          error: 'No active academic year found. Please set an active year before migration.'
        };
      }

      if (result.rows.length > 1) {
        console.log(`⚠️  Multiple active years found (${result.rows.length})`);
        // Use the first one but log a warning
        console.warn(`   Warning: Multiple active years detected. Using: ${result.rows[0].kode}`);
      }

      const sourceYear = result.rows[0];

      console.log(`✅ Source year validated: ${sourceYear.kode} (ID: ${sourceYear.id})`);

      return {
        valid: true,
        sourceYear: sourceYear,
        error: null
      };
    } catch (error) {
      console.error(`❌ Error validating source year:`, error.message);
      return {
        valid: false,
        sourceYear: null,
        error: `Failed to validate source year: ${error.message}`
      };
    }
  }

  /**
   * Run all validation checks before migration
   *
   * Performs comprehensive validation of all migration preconditions.
   * Collects all validation errors before returning (doesn't fail on first error).
   *
   * @param {string} targetKode - Target year code
   * @param {Object} client - Database client for transaction support
   * @returns {Object} { valid: boolean, errors: Array, sourceYear: Object|null, targetYear: Object|null, alumniIds: Array, missingClasses: Array }
   */
  async validateMigration(targetKode, client) {
    console.log(`🔍 Starting comprehensive migration validation`);
    console.log(`   Target year: ${targetKode}`);

    const errors = [];
    let sourceYear = null;
    let targetYear = null;
    let alumniIds = [];
    let missingClasses = [];

    // Validation 1: Source year is active
    const sourceValidation = await this.validateSourceYear(client);
    if (!sourceValidation.valid) {
      errors.push(sourceValidation.error);
    } else {
      sourceYear = sourceValidation.sourceYear;
    }

    // Validation 2: Target year exists or can be created
    const targetValidation = await this.validateTargetYear(targetKode, client);
    if (!targetValidation.valid) {
      errors.push(targetValidation.error);
    } else {
      targetYear = targetValidation.year;
    }

    // Validation 3: Get existing alumni to exclude
    const alumniValidation = await this.getExistingAlumni(client);
    if (!alumniValidation.valid) {
      errors.push(alumniValidation.error);
    } else {
      alumniIds = alumniValidation.alumniIds;
    }

    // Validation 4: Check class availability (only if source year is valid)
    if (sourceYear) {
      // Fetch source santri with class information
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
         WHERE sta.tahun_ajaran_id = $1 AND sta.status = 'aktif'`,
        [sourceYear.id]
      );

      const sourceSantri = santriResult.rows;

      // Exclude existing alumni from validation
      const santriToValidate = sourceSantri.filter(
        s => !alumniIds.includes(s.santri_id)
      );

      console.log(`   Validating class availability for ${santriToValidate.length} santri (${sourceSantri.length - santriToValidate.length} alumni excluded)`);

      const classValidation = await this.validateClassAvailability(santriToValidate, client);
      if (!classValidation.valid) {
        errors.push(classValidation.error);
        missingClasses = classValidation.missingClasses;
      }
    }

    // Compile results
    const valid = errors.length === 0;

    if (valid) {
      console.log(`✅ All validation checks passed`);
    } else {
      console.log(`❌ Validation failed with ${errors.length} error(s):`);
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}`);
      });
    }

    return {
      valid: valid,
      errors: errors,
      sourceYear: sourceYear,
      targetYear: targetYear,
      alumniIds: alumniIds,
      missingClasses: missingClasses
    };
  }
}

module.exports = MigrationValidator;

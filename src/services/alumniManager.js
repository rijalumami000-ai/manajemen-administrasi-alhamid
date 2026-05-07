/**
 * Alumni Manager Service
 *
 * Manages alumni detection and record creation during academic year migration.
 * Handles complex graduation rules across Diniyah and Sekolah tracks.
 *
 * Graduation Rules:
 * 1. Diniyah graduation (tingkat 6): Alumni ONLY if no Sekolah enrollment
 * 2. MTs graduation (tingkat 9): Mark as "lulus" but NOT alumni (can continue to MA)
 * 3. MA graduation (tingkat 12): Immediately becomes alumni
 * 4. Dual-track graduation: Diniyah 6 + MA 12 = "Lulus Diniyah & MA"
 */

const db = require('../../db');
const { isGraduationPoint, isMtsGraduation } = require('../utils/classProgressionMap');

class AlumniManager {
  /**
   * Main method to check if santri should become alumni and create record if needed
   *
   * NEW RULES:
   * - Alumni ONLY if: Diniyah 6 AND Sekolah 12
   * - Otherwise: Mark as "Lulus" in catatan, continue to next year
   *
   * @param {Object} santri - Santri record with class assignments
   * @param {Object} sourceYear - Source tahun ajaran
   * @param {Object} client - Database client for transaction support
   * @returns {Object} { becameAlumni, graduationNotes, shouldMigrate }
   */
  async processGraduation(santri, sourceYear, client) {
    console.log(`🎓 Processing graduation for santri ${santri.santri_id} (${santri.nama})`);

    const graduationStatus = this.detectGraduationPoint(santri);

    console.log(`   Graduation status:`, graduationStatus);

    // Case 1: Becomes Alumni (Diniyah 6 + Sekolah 12)
    if (graduationStatus.shouldBecomeAlumni) {
      console.log(`   ✅ Creating alumni record: ${graduationStatus.status}`);
      await this.createAlumniRecord(santri, sourceYear, graduationStatus, client);
      await this.updateSantriStatus(santri.id, sourceYear.id, 'alumni', client);

      // Add notes to catatan
      if (graduationStatus.graduationNotes.length > 0) {
        const notes = graduationStatus.graduationNotes.join(', ');
        await this.addCatatanNote(santri.id, sourceYear.id, notes, client);
      }

      return {
        becameAlumni: true,
        graduationNotes: graduationStatus.graduationNotes,
        shouldMigrate: false, // Don't migrate alumni
        status: graduationStatus.status
      };
    }

    // Case 2: Has graduation notes but NOT alumni (Lulus Diniyah, Lulus MTs, Lulus MA)
    if (graduationStatus.graduationNotes.length > 0) {
      console.log(`   📝 Marking as: ${graduationStatus.statusDescription}`);

      // Update status to "lulus" in source year
      await this.updateSantriStatus(santri.id, sourceYear.id, 'lulus', client);

      // Add notes to catatan
      const notes = graduationStatus.graduationNotes.join(', ');
      await this.addCatatanNote(santri.id, sourceYear.id, notes, client);

      return {
        becameAlumni: false,
        graduationNotes: graduationStatus.graduationNotes,
        shouldMigrate: true, // Still migrate to next year
        status: graduationStatus.statusDescription,
        isDiniyahComplete: graduationStatus.isDiniyahComplete,
        isMtsComplete: graduationStatus.isMtsComplete,
        isMaComplete: graduationStatus.isMaComplete
      };
    }

    // Case 3: No graduation (still active)
    console.log(`   ❌ No graduation point reached`);
    return {
      becameAlumni: false,
      graduationNotes: [],
      shouldMigrate: true, // Migrate normally
      status: null
    };
  }

  /**
   * Identify santri at graduation points (tingkat 6, 9, 12)
   *
   * NEW RULES:
   * - Alumni ONLY if: Diniyah 6 AND Sekolah 12 (both completed)
   * - Otherwise: Mark as "Lulus" but NOT alumni
   *
   * @param {Object} santri - Santri with kelas info (includes tingkat from JOIN)
   * @returns {Object} { shouldBecomeAlumni, graduationNotes, status }
   */
  detectGraduationPoint(santri) {
    const diniyahTingkat = santri.kelas_diniyah_tingkat;
    const sekolahTingkat = santri.kelas_sekolah_tingkat;

    console.log(`   📊 Tingkat: Diniyah=${diniyahTingkat}, Sekolah=${sekolahTingkat}`);

    const graduationNotes = [];
    let shouldBecomeAlumni = false;
    let alumniStatus = null;

    // Check Diniyah graduation (tingkat 6)
    const isDiniyahComplete = diniyahTingkat === 6;

    // Check Sekolah graduation
    const isMtsComplete = sekolahTingkat === 9;
    const isMaComplete = sekolahTingkat === 12;

    // Rule: Alumni ONLY if both Diniyah 6 AND Sekolah 12
    if (isDiniyahComplete && isMaComplete) {
      shouldBecomeAlumni = true;
      alumniStatus = 'Alumni - Lulus Diniyah & MA';
      graduationNotes.push('Lulus Diniyah');
      graduationNotes.push('Lulus MA');
    }
    // Otherwise, just mark as "Lulus" but NOT alumni
    else {
      // Check individual completions
      if (isDiniyahComplete) {
        graduationNotes.push('Lulus Diniyah');
      }

      if (isMtsComplete) {
        graduationNotes.push('Lulus MTs');
      }

      if (isMaComplete) {
        graduationNotes.push('Lulus MA');
      }
    }

    // Determine status for logging
    let statusDescription = null;
    if (shouldBecomeAlumni) {
      statusDescription = alumniStatus;
    } else if (graduationNotes.length > 0) {
      statusDescription = graduationNotes.join(', ');
    }

    return {
      shouldBecomeAlumni,
      graduationNotes,
      status: alumniStatus,
      statusDescription,
      isDiniyahComplete,
      isMtsComplete,
      isMaComplete
    };
  }

  /**
   * Create alumni records with complete educational history
   *
   * @param {Object} santri - Santri data
   * @param {Object} sourceYear - Source tahun ajaran
   * @param {Object} graduationStatus - Graduation details
   * @param {Object} client - Database client for transaction
   */
  async createAlumniRecord(santri, sourceYear, graduationStatus, client) {
    console.log(`   📝 Creating alumni record for santri ${santri.santri_id}`);

    try {
      const result = await client.query(
        `INSERT INTO alumni (
          santri_id, nis, nik, nama, tempat_lahir, tanggal_lahir,
          tahun_lulus, kelas_terakhir, alamat, keterangan
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (santri_id) DO NOTHING
        RETURNING id`,
        [
          santri.santri_id,
          santri.nis,
          santri.nik,
          santri.nama,
          santri.tempat_lahir,
          santri.tanggal_lahir,
          sourceYear.tahun_selesai,
          graduationStatus.status,
          santri.alamat,
          `Lulus pada tahun ajaran ${sourceYear.kode}`
        ]
      );

      if (result.rows.length > 0) {
        console.log(`   ✅ Alumni record created with ID: ${result.rows[0].id}`);
      } else {
        console.log(`   ℹ️  Alumni record already exists (conflict ignored)`);
      }
    } catch (error) {
      console.error(`   ❌ Error creating alumni record:`, error.message);
      throw error;
    }
  }

  /**
   * Update santri status appropriately
   *
   * @param {number} santriTahunAjaranId - santri_tahun_ajaran.id
   * @param {number} tahunAjaranId - tahun_ajaran.id
   * @param {string} status - New status ('alumni', 'lulus', etc.)
   * @param {Object} client - Database client for transaction
   */
  async updateSantriStatus(santriTahunAjaranId, tahunAjaranId, status, client) {
    console.log(`   📝 Updating santri status to: ${status}`);

    try {
      await client.query(
        `UPDATE santri_tahun_ajaran
         SET status = $1
         WHERE id = $2 AND tahun_ajaran_id = $3`,
        [status, santriTahunAjaranId, tahunAjaranId]
      );

      console.log(`   ✅ Status updated successfully`);
    } catch (error) {
      console.error(`   ❌ Error updating santri status:`, error.message);
      throw error;
    }
  }

  /**
   * Mark MTs graduates (mark as "lulus" but not alumni)
   *
   * @param {number} santriTahunAjaranId - santri_tahun_ajaran.id
   * @param {number} tahunAjaranId - tahun_ajaran.id
   * @param {Object} client - Database client for transaction
   */
  async markMtsGraduate(santriTahunAjaranId, tahunAjaranId, client) {
    console.log(`   📝 Marking as MTs graduate (lulus status)`);

    try {
      await client.query(
        `UPDATE santri_tahun_ajaran
         SET status = 'lulus',
             catatan = CASE
               WHEN catatan IS NULL OR catatan = '' THEN 'Lulus MTs'
               ELSE catatan || ' | Lulus MTs'
             END
         WHERE id = $1 AND tahun_ajaran_id = $2`,
        [santriTahunAjaranId, tahunAjaranId]
      );

      console.log(`   ✅ MTs graduate status updated`);
    } catch (error) {
      console.error(`   ❌ Error marking MTs graduate:`, error.message);
      throw error;
    }
  }

  /**
   * Add note to santri catatan field (for dual-track Diniyah completion)
   *
   * @param {number} santriTahunAjaranId - santri_tahun_ajaran.id
   * @param {number} tahunAjaranId - tahun_ajaran.id
   * @param {string} note - Note to add
   * @param {Object} client - Database client for transaction
   */
  async addCatatanNote(santriTahunAjaranId, tahunAjaranId, note, client) {
    console.log(`   📝 Adding note to catatan: ${note}`);

    try {
      await client.query(
        `UPDATE santri_tahun_ajaran
         SET catatan = CASE
           WHEN catatan IS NULL OR catatan = '' THEN $1
           ELSE catatan || ' | ' || $1
         END
         WHERE id = $2 AND tahun_ajaran_id = $3`,
        [note, santriTahunAjaranId, tahunAjaranId]
      );

      console.log(`   ✅ Note added to catatan`);
    } catch (error) {
      console.error(`   ❌ Error adding catatan note:`, error.message);
      throw error;
    }
  }

  /**
   * Get existing alumni IDs to exclude from migration
   *
   * @param {Object} client - Database client (optional, uses pool if not provided)
   * @returns {Array<number>} Array of santri IDs that are already alumni
   */
  async getExistingAlumniIds(client = null) {
    const dbClient = client || db;

    try {
      const result = await dbClient.query(
        `SELECT santri_id FROM alumni`
      );

      const alumniIds = result.rows.map(row => row.santri_id);
      console.log(`📋 Found ${alumniIds.length} existing alumni to exclude from migration`);

      return alumniIds;
    } catch (error) {
      console.error(`❌ Error fetching existing alumni:`, error.message);
      throw error;
    }
  }

  /**
   * Check if a santri is already an alumni
   *
   * @param {number} santriId - Santri ID
   * @param {Object} client - Database client (optional)
   * @returns {boolean} True if santri is already alumni
   */
  async isAlumni(santriId, client = null) {
    const dbClient = client || db;

    try {
      const result = await dbClient.query(
        `SELECT id FROM alumni WHERE santri_id = $1`,
        [santriId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error(`❌ Error checking alumni status:`, error.message);
      throw error;
    }
  }
}

module.exports = AlumniManager;

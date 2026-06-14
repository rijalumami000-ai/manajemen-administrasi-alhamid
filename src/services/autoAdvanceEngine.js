/**
 * Auto-Advance Engine Service
 *
 * Automatically determines the next class level for each santri during
 * academic year migration based on progression rules.
 *
 * Handles:
 * - Diniyah track progression (Sifir → 1 → SP → 2 → ... → 6)
 * - Sekolah track progression (7 → 8 → 9 → 10 → 11 → 12)
 * - Dual-track santri (both Diniyah and Sekolah)
 * - Graduation points (tingkat 6 for Diniyah, tingkat 12 for Sekolah)
 */

const db = require('../../db');
const {
  getNextDiniyahTingkat,
  getNextSekolahTingkat,
  isGraduationPoint
} = require('../utils/classProgressionMap');

class AutoAdvanceEngine {
  /**
   * Determine next class for a santri based on current enrollment
   *
   * @param {Object} santri - Current santri record with class assignments
   * @param {Array} availableClasses - All classes in target year
   * @returns {Object} { kelas_diniyah_id, kelas_sekolah_id }
   */
  async advanceSantri(santri, availableClasses) {
    const diniyahNext = santri.kelas_diniyah_id
      ? await this.advanceDiniyah(santri.kelas_diniyah_id, availableClasses)
      : null;

    const sekolahNext = santri.kelas_sekolah_id
      ? await this.advanceSekolah(santri.kelas_sekolah_id, availableClasses)
      : null;

    return {
      kelas_diniyah_id: diniyahNext,
      kelas_sekolah_id: sekolahNext
    };
  }

  /**
   * Advance Diniyah class level
   *
   * @param {number} currentKelasId - Current kelas ID
   * @param {Array} availableClasses - Available classes in target year
   * @returns {number|null} Next kelas ID or null if graduated
   */
  async advanceDiniyah(currentKelasId, availableClasses) {
    const currentKelas = await this.getKelasById(currentKelasId);

    if (!currentKelas) {
      throw new Error(`Kelas not found: ${currentKelasId}`);
    }

    if (currentKelas.jenis !== 'Diniyah') {
      throw new Error(`Expected Diniyah class, got ${currentKelas.jenis}`);
    }

    // Get next tingkat based on progression rules
    const nextTingkat = getNextDiniyahTingkat(currentKelas.tingkat, currentKelas.nama);

    // Graduation point
    if (nextTingkat === null) {
      return null;
    }

    // Special case no longer needed, progresses directly to tingkat 2

    // Find matching class in target year
    const nextKelas = this.findMatchingKelas(availableClasses, 'Diniyah', nextTingkat);

    if (!nextKelas) {
      throw new Error(
        `No Diniyah class found for tingkat ${nextTingkat} (advancing from ${currentKelas.nama})`
      );
    }

    return nextKelas.id;
  }

  /**
   * Advance Sekolah class level
   *
   * @param {number} currentKelasId - Current kelas ID
   * @param {Array} availableClasses - Available classes in target year
   * @returns {number|null} Next kelas ID or null if graduated
   */
  async advanceSekolah(currentKelasId, availableClasses) {
    const currentKelas = await this.getKelasById(currentKelasId);

    if (!currentKelas) {
      throw new Error(`Kelas not found: ${currentKelasId}`);
    }

    if (currentKelas.jenis !== 'Sekolah') {
      throw new Error(`Expected Sekolah class, got ${currentKelas.jenis}`);
    }

    // Get next tingkat based on progression rules
    const nextTingkat = getNextSekolahTingkat(currentKelas.tingkat);

    // Graduation point
    if (nextTingkat === null) {
      return null;
    }

    // Find matching class in target year
    const nextKelas = this.findMatchingKelas(availableClasses, 'Sekolah', nextTingkat);

    if (!nextKelas) {
      throw new Error(
        `No Sekolah class found for tingkat ${nextTingkat} (advancing from ${currentKelas.nama})`
      );
    }

    return nextKelas.id;
  }

  /**
   * Find matching kelas in available classes
   *
   * @param {Array} availableClasses - Available classes
   * @param {string} jenis - Class type ('Diniyah' or 'Sekolah')
   * @param {number} tingkat - Target tingkat level
   * @param {boolean} requireSP - If true, only match classes with 'SP' in name
   * @returns {Object|null} Matching kelas or null if not found
   */
  findMatchingKelas(availableClasses, jenis, tingkat, requireSP = false) {
    const matches = availableClasses.filter(kelas =>
      kelas.jenis === jenis && kelas.tingkat === tingkat
    );

    if (matches.length === 0) {
      return null;
    }

    // If requireSP, filter for SP classes
    if (requireSP) {
      const spMatches = matches.filter(kelas =>
        kelas.nama.toUpperCase().includes('SP')
      );
      if (spMatches.length > 0) {
        return spMatches[0]; // Return first SP class
      }
      return null; // No SP class found
    }

    // Return first matching class
    // TODO: In future, implement section assignment logic (preserve section if possible)
    return matches[0];
  }

  /**
   * Get kelas by ID with tingkat information
   *
   * @param {number} kelasId - Kelas ID
   * @returns {Object|null} Kelas object with id, jenis, nama, tingkat
   */
  async getKelasById(kelasId) {
    const result = await db.query(
      'SELECT id, jenis, nama, tingkat FROM kelas WHERE id = $1',
      [kelasId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Validate that all required target classes exist
   *
   * @param {Array} sourceSantri - Santri in source year
   * @param {Array} availableClasses - Classes in target year
   * @returns {Array} Array of missing class definitions { jenis, tingkat, required_for }
   */
  async validateTargetClasses(sourceSantri, availableClasses) {
    const missingClasses = [];
    const requiredTingkats = new Map(); // Map of "jenis:tingkat" -> count

    for (const santri of sourceSantri) {
      try {
        // Check Diniyah advancement
        if (santri.kelas_diniyah_id) {
          const currentKelas = await this.getKelasById(santri.kelas_diniyah_id);
          if (currentKelas) {
            const nextTingkat = getNextDiniyahTingkat(currentKelas.tingkat, currentKelas.nama);
            if (nextTingkat !== null) {
              const key = `Diniyah:${nextTingkat}`;
              requiredTingkats.set(key, (requiredTingkats.get(key) || 0) + 1);

              // Check if class exists
              const exists = this.findMatchingKelas(availableClasses, 'Diniyah', nextTingkat);
              if (!exists) {
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
        }

        // Check Sekolah advancement
        if (santri.kelas_sekolah_id) {
          const currentKelas = await this.getKelasById(santri.kelas_sekolah_id);
          if (currentKelas) {
            const nextTingkat = getNextSekolahTingkat(currentKelas.tingkat);
            if (nextTingkat !== null) {
              const key = `Sekolah:${nextTingkat}`;
              requiredTingkats.set(key, (requiredTingkats.get(key) || 0) + 1);

              // Check if class exists
              const exists = this.findMatchingKelas(availableClasses, 'Sekolah', nextTingkat);
              if (!exists) {
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
        }
      } catch (error) {
        // Skip santri with errors (will be handled during actual migration)
        console.warn(`Validation warning for santri ${santri.santri_id}:`, error.message);
      }
    }

    return missingClasses;
  }
}

module.exports = AutoAdvanceEngine;

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

import db from '../../db';
import {
  getNextDiniyahTingkat,
  getNextSekolahTingkat
} from '../utils/classProgressionMap';

export interface AdvanceResult {
  kelas_diniyah_id: number | null;
  kelas_sekolah_id: number | null;
}

export interface MissingClassInfo {
  jenis: string;
  tingkat: number;
  required_for: number;
}

export class AutoAdvanceEngine {
  /**
   * Determine next class for a santri based on current enrollment
   *
   * @param santri - Current santri record with class assignments
   * @param availableClasses - All classes in target year
   * @returns { kelas_diniyah_id, kelas_sekolah_id }
   */
  async advanceSantri(santri: any, availableClasses: any[]): Promise<AdvanceResult> {
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
   * @param currentKelasId - Current kelas ID
   * @param availableClasses - Available classes in target year
   * @returns Next kelas ID or null if graduated
   */
  async advanceDiniyah(currentKelasId: number, availableClasses: any[]): Promise<number | null> {
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
   * @param currentKelasId - Current kelas ID
   * @param availableClasses - Available classes in target year
   * @returns Next kelas ID or null if graduated
   */
  async advanceSekolah(currentKelasId: number, availableClasses: any[]): Promise<number | null> {
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
   * @param availableClasses - Available classes
   * @param jenis - Class type ('Diniyah' or 'Sekolah')
   * @param tingkat - Target tingkat level
   * @param requireSP - If true, only match classes with 'SP' in name
   * @returns Matching kelas or null if not found
   */
  findMatchingKelas(availableClasses: any[], jenis: string, tingkat: number, requireSP = false): any | null {
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
    return matches[0];
  }

  /**
   * Get kelas by ID with tingkat information
   *
   * @param kelasId - Kelas ID
   * @returns Kelas object with id, jenis, nama, tingkat
   */
  async getKelasById(kelasId: number): Promise<any | null> {
    const result = await db.query(
      'SELECT id, jenis, nama, tingkat FROM kelas WHERE id = $1',
      [kelasId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Validate that all required target classes exist
   *
   * @param sourceSantri - Santri in source year
   * @param availableClasses - Classes in target year
   * @returns Array of missing class definitions { jenis, tingkat, required_for }
   */
  async validateTargetClasses(sourceSantri: any[], availableClasses: any[]): Promise<MissingClassInfo[]> {
    const missingClasses: MissingClassInfo[] = [];
    const requiredTingkats = new Map<string, number>(); // Map of "jenis:tingkat" -> count

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
      } catch (error: any) {
        // Skip santri with errors (will be handled during actual migration)
        console.warn(`Validation warning for santri ${santri.santri_id}:`, error.message);
      }
    }

    return missingClasses;
  }
}

module.exports = AutoAdvanceEngine;
export default AutoAdvanceEngine;

/**
 * Class Progression Map
 *
 * Defines the progression rules for Diniyah and Sekolah tracks.
 * Used by the Auto-Advance Engine to determine the next class level
 * during academic year migration.
 */

export interface ProgressionRule {
  next: number | null;
  name: string;
  stage?: string;
  milestone?: string;
}

export const DINIYAH_PROGRESSION: Record<number, ProgressionRule> = {
  0: { next: 1, name: 'Sifir → Kelas 1' },
  1: {
    next: null, // Will be determined dynamically
    name: 'Kelas 1 → SP or SP → 2'
  },
  2: { next: 3, name: 'Kelas 2 → 3' },
  3: { next: 4, name: 'Kelas 3 → 4' },
  4: { next: 5, name: 'Kelas 4 → 5' },
  5: { next: 6, name: 'Kelas 5 → 6' },
  6: { next: null, name: 'Graduation' }
};

export const SEKOLAH_PROGRESSION: Record<number, ProgressionRule> = {
  7: { next: 8, stage: 'MTs', name: 'Kelas 7 → 8' },
  8: { next: 9, stage: 'MTs', name: 'Kelas 8 → 9' },
  9: { next: 10, stage: 'MTs → MA', milestone: 'Lulus MTs', name: 'Kelas 9 → 10' },
  10: { next: 11, stage: 'MA', name: 'Kelas 10 → 11' },
  11: { next: 12, stage: 'MA', name: 'Kelas 11 → 12' },
  12: { next: null, stage: 'Graduation', milestone: 'Lulus MA', name: 'Graduation' }
};

/**
 * Get next Diniyah tingkat based on current class
 */
export function getNextDiniyahTingkat(currentTingkat: number, _currentNama?: string): number | null {
  // Graduation point
  if (currentTingkat === 6) {
    return null;
  }

  // Special case: tingkat 1 (Kelas 1 or SP)
  if (currentTingkat === 1) {
    return 2; // Directly promote to tingkat 2, bypassing SP
  }

  // Standard progression: tingkat + 1
  if (currentTingkat >= 0 && currentTingkat < 6) {
    return currentTingkat + 1;
  }

  // Invalid tingkat
  throw new Error(`Invalid Diniyah tingkat: ${currentTingkat}`);
}

/**
 * Get next Sekolah tingkat based on current class
 */
export function getNextSekolahTingkat(currentTingkat: number): number | null {
  // Graduation point
  if (currentTingkat === 12) {
    return null;
  }

  // Standard progression: tingkat + 1
  if (currentTingkat >= 7 && currentTingkat < 12) {
    return currentTingkat + 1;
  }

  // Invalid tingkat
  throw new Error(`Invalid Sekolah tingkat: ${currentTingkat}`);
}

/**
 * Check if tingkat is a graduation point
 */
export function isGraduationPoint(jenis: string, tingkat: number): boolean {
  if (jenis === 'Diniyah') {
    return tingkat === 6;
  }
  if (jenis === 'Sekolah') {
    return tingkat === 12;
  }
  return false;
}

/**
 * Check if tingkat is an MTs graduation point
 */
export function isMtsGraduation(tingkat: number): boolean {
  return tingkat === 9;
}

/**
 * Get progression info for a given tingkat
 */
export function getProgressionInfo(jenis: string, tingkat: number): ProgressionRule | null {
  if (jenis === 'Diniyah') {
    return DINIYAH_PROGRESSION[tingkat] || null;
  }
  if (jenis === 'Sekolah') {
    return SEKOLAH_PROGRESSION[tingkat] || null;
  }
  return null;
}

const mod = {
  DINIYAH_PROGRESSION,
  SEKOLAH_PROGRESSION,
  getNextDiniyahTingkat,
  getNextSekolahTingkat,
  isGraduationPoint,
  isMtsGraduation,
  getProgressionInfo
};

module.exports = mod;
export default mod;

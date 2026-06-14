/**
 * Class Progression Map
 *
 * Defines the progression rules for Diniyah and Sekolah tracks.
 * Used by the Auto-Advance Engine to determine the next class level
 * during academic year migration.
 */

/**
 * Diniyah Track Progression Rules
 *
 * Progression path:
 * - Sifir (tingkat 0) → Kelas 1 (tingkat 1)
 * - Kelas 1 (tingkat 1) → Kelas SP (tingkat 1, special marker)
 * - Kelas SP (tingkat 1) → Kelas 2 (tingkat 2)
 * - Kelas 2 (tingkat 2) → Kelas 3 (tingkat 3)
 * - Kelas 3 (tingkat 3) → Kelas 4 (tingkat 4)
 * - Kelas 4 (tingkat 4) → Kelas 5 (tingkat 5)
 * - Kelas 5 (tingkat 5) → Kelas 6 (tingkat 6)
 * - Kelas 6 (tingkat 6) → Graduation (null)
 *
 * Special case: Kelas 1 → SP transition maintains tingkat 1
 */
const DINIYAH_PROGRESSION = {
  0: { next: 1, name: 'Sifir → Kelas 1' },
  1: {
    // Special handling: Kelas 1 → SP or SP → 2
    // Determined by checking if current class name contains 'SP'
    next: null, // Will be determined dynamically
    name: 'Kelas 1 → SP or SP → 2'
  },
  2: { next: 3, name: 'Kelas 2 → 3' },
  3: { next: 4, name: 'Kelas 3 → 4' },
  4: { next: 5, name: 'Kelas 4 → 5' },
  5: { next: 6, name: 'Kelas 5 → 6' },
  6: { next: null, name: 'Graduation' }
};

/**
 * Sekolah Track Progression Rules
 *
 * Progression path:
 * - Kelas 7 → Kelas 8 (MTs)
 * - Kelas 8 → Kelas 9 (MTs)
 * - Kelas 9 → Kelas 10 (MTs → MA transition, marked as "Lulus MTs")
 * - Kelas 10 → Kelas 11 (MA)
 * - Kelas 11 → Kelas 12 (MA)
 * - Kelas 12 → Graduation (null, becomes alumni)
 */
const SEKOLAH_PROGRESSION = {
  7: { next: 8, stage: 'MTs', name: 'Kelas 7 → 8' },
  8: { next: 9, stage: 'MTs', name: 'Kelas 8 → 9' },
  9: { next: 10, stage: 'MTs → MA', milestone: 'Lulus MTs', name: 'Kelas 9 → 10' },
  10: { next: 11, stage: 'MA', name: 'Kelas 10 → 11' },
  11: { next: 12, stage: 'MA', name: 'Kelas 11 → 12' },
  12: { next: null, stage: 'Graduation', milestone: 'Lulus MA', name: 'Graduation' }
};

/**
 * Get next Diniyah tingkat based on current class
 *
 * @param {number} currentTingkat - Current tingkat level (0-6)
 * @param {string} currentNama - Current class name (to detect SP)
 * @returns {number|null} Next tingkat or null if graduated
 */
function getNextDiniyahTingkat(currentTingkat, currentNama) {
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
 *
 * @param {number} currentTingkat - Current tingkat level (7-12)
 * @returns {number|null} Next tingkat or null if graduated
 */
function getNextSekolahTingkat(currentTingkat) {
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
 *
 * @param {string} jenis - Class type ('Diniyah' or 'Sekolah')
 * @param {number} tingkat - Tingkat level
 * @returns {boolean} True if this is a graduation point
 */
function isGraduationPoint(jenis, tingkat) {
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
 *
 * @param {number} tingkat - Tingkat level
 * @returns {boolean} True if this is MTs graduation (tingkat 9)
 */
function isMtsGraduation(tingkat) {
  return tingkat === 9;
}

/**
 * Get progression info for a given tingkat
 *
 * @param {string} jenis - Class type ('Diniyah' or 'Sekolah')
 * @param {number} tingkat - Tingkat level
 * @returns {Object|null} Progression info or null if invalid
 */
function getProgressionInfo(jenis, tingkat) {
  if (jenis === 'Diniyah') {
    return DINIYAH_PROGRESSION[tingkat] || null;
  }
  if (jenis === 'Sekolah') {
    return SEKOLAH_PROGRESSION[tingkat] || null;
  }
  return null;
}

module.exports = {
  DINIYAH_PROGRESSION,
  SEKOLAH_PROGRESSION,
  getNextDiniyahTingkat,
  getNextSekolahTingkat,
  isGraduationPoint,
  isMtsGraduation,
  getProgressionInfo
};

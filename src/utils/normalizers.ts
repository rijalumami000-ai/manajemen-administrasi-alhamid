export function normalizeText(value: any): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export function normalizeKelasJenis(value: any): 'Diniyah' | 'Sekolah' | null {
  const jenis = normalizeText(value);
  if (!jenis) {
    return null;
  }

  const lower = jenis.toLowerCase();
  if (lower === 'diniyah') {
    return 'Diniyah';
  }

  if (lower === 'sekolah') {
    return 'Sekolah';
  }

  return null;
}

export function normalizeYearCode(value: any): string | null {
  const text = normalizeText(value);
  if (!text || !/^\d{4}-\d{4}$/.test(text)) {
    return null;
  }

  const [start, end] = text.split('-').map(Number);
  return end === start + 1 ? text : null;
}

export function normalizeSantriStatus(value: any): string {
  const status = normalizeText(value);
  const allowedStatuses = ['aktif', 'draft', 'lulus', 'alumni', 'pindah', 'keluar', 'tidak_naik'];
  return status && allowedStatuses.includes(status) ? status : 'aktif';
}

export function nullableInt(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function nullableDate(value: any): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  return value;
}

export function normalizeGender(value: any): 'L' | 'P' | null {
  if (value === null || value === undefined) {
    return null;
  }
  const str = String(value).trim().toLowerCase();
  if (!str) return null;

  if (
    str === 'l' ||
    str === 'laki-laki' ||
    str === 'laki' ||
    str === 'putra' ||
    str === 'banin' ||
    str === 'male' ||
    str === 'pria' ||
    str === '1'
  ) {
    return 'L';
  }

  if (
    str === 'p' ||
    str === 'perempuan' ||
    str === 'putri' ||
    str === 'banat' ||
    str === 'female' ||
    str === 'wanita' ||
    str === '2'
  ) {
    return 'P';
  }

  return null;
}

const mod = {
  normalizeText,
  normalizeKelasJenis,
  normalizeYearCode,
  normalizeSantriStatus,
  normalizeGender,
  nullableInt,
  nullableDate,
};

module.exports = mod;
export default mod;

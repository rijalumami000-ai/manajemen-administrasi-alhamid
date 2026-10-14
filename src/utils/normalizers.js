function normalizeText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeKelasJenis(value) {
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

function normalizeYearCode(value) {
  const text = normalizeText(value);
  if (!text || !/^\d{4}-\d{4}$/.test(text)) {
    return null;
  }

  const [start, end] = text.split('-').map(Number);
  return end === start + 1 ? text : null;
}

function normalizeSantriStatus(value) {
  const status = normalizeText(value);
  const allowedStatuses = ['aktif', 'draft', 'lulus', 'alumni', 'pindah', 'keluar', 'tidak_naik'];
  return allowedStatuses.includes(status) ? status : 'aktif';
}

function nullableInt(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function nullableDate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  return value;
}

function normalizeGender(value) {
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

module.exports = {
  normalizeText,
  normalizeKelasJenis,
  normalizeYearCode,
  normalizeSantriStatus,
  normalizeGender,
  nullableInt,
  nullableDate,
};



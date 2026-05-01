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

module.exports = {
  normalizeText,
  normalizeKelasJenis,
  normalizeYearCode,
  normalizeSantriStatus,
  nullableInt,
};

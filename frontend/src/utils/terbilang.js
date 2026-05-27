/**
 * Terbilang utilities for Rapor Print
 * Converts numbers to words in Indonesian and Arabic
 */

// ============================================================
// TERBILANG INDONESIA
// ============================================================

const satuanId = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

function terbilangIndonesiaRaw(n) {
  if (n < 0) return 'Minus ' + terbilangIndonesiaRaw(-n);
  if (n < 12) return satuanId[n];
  if (n < 20) return satuanId[n - 10] + ' Belas';
  if (n < 100) {
    const puluhan = Math.floor(n / 10);
    const sisa = n % 10;
    return satuanId[puluhan] + ' Puluh' + (sisa > 0 ? ' ' + satuanId[sisa] : '');
  }
  if (n < 200) return 'Seratus' + (n % 100 > 0 ? ' ' + terbilangIndonesiaRaw(n % 100) : '');
  if (n < 1000) {
    const ratusan = Math.floor(n / 100);
    const sisa = n % 100;
    return satuanId[ratusan] + ' Ratus' + (sisa > 0 ? ' ' + terbilangIndonesiaRaw(sisa) : '');
  }
  if (n < 2000) return 'Seribu' + (n % 1000 > 0 ? ' ' + terbilangIndonesiaRaw(n % 1000) : '');
  if (n < 1000000) {
    const ribuan = Math.floor(n / 1000);
    const sisa = n % 1000;
    return terbilangIndonesiaRaw(ribuan) + ' Ribu' + (sisa > 0 ? ' ' + terbilangIndonesiaRaw(sisa) : '');
  }
  return String(n);
}

/**
 * Converts a number to Indonesian words.
 * Handles integers and decimals (up to 2 decimal places).
 * @param {number|string} angka
 * @returns {string}
 */
export function terbilangIndonesia(angka) {
  if (angka === null || angka === undefined || angka === '') return '-';
  const num = Number(angka);
  if (isNaN(num)) return '-';

  const intPart = Math.floor(Math.abs(num));
  const decPart = Math.round((Math.abs(num) - intPart) * 100);

  let result = terbilangIndonesiaRaw(intPart);
  if (decPart > 0) {
    result += ' Koma ' + terbilangIndonesiaRaw(decPart);
  }
  if (num < 0) result = 'Minus ' + result;
  return result || 'Nol';
}

// ============================================================
// TERBILANG ARAB
// ============================================================

const satuanAr = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];
const belanAr = ['', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const puluhanAr = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const ratusanAr = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function terbilangArabRaw(n) {
  if (n === 0) return 'صفر';
  if (n < 0) return 'ناقص ' + terbilangArabRaw(-n);
  if (n <= 10) return satuanAr[n];
  if (n < 20) return belanAr[n - 10];
  if (n < 100) {
    const puluhan = Math.floor(n / 10);
    const sisa = n % 10;
    if (sisa === 0) return puluhanAr[puluhan];
    return satuanAr[sisa] + ' و' + puluhanAr[puluhan];
  }
  if (n < 1000) {
    const ratusan = Math.floor(n / 100);
    const sisa = n % 100;
    if (sisa === 0) return ratusanAr[ratusan];
    return ratusanAr[ratusan] + ' و' + terbilangArabRaw(sisa);
  }
  return String(n);
}

/**
 * Converts a number to Arabic words.
 * @param {number|string} angka
 * @returns {string}
 */
export function terbilangArab(angka) {
  if (angka === null || angka === undefined || angka === '') return '-';
  const num = Number(angka);
  if (isNaN(num)) return '-';

  const intPart = Math.floor(Math.abs(num));
  const decPart = Math.round((Math.abs(num) - intPart) * 100);

  let result = terbilangArabRaw(intPart);
  if (decPart > 0) {
    result += ' فاصلة ' + terbilangArabRaw(decPart);
  }
  return result || 'صفر';
}

// ============================================================
// KONVERSI ANGKA KE ANGKA ARAB (Eastern Arabic numerals)
// ============================================================

const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Converts Latin digits to Eastern Arabic numerals.
 * @param {number|string} num
 * @returns {string}
 */
export function toArabicNumerals(num) {
  if (num === null || num === undefined) return '-';
  return String(num).replace(/[0-9]/g, d => arabicDigits[parseInt(d)]);
}

// ============================================================
// MAPPING PREDIKAT KE ARAB
// ============================================================

const predikatMap = {
  'Mumtaz': 'ممتاز',
  'Jayyid': 'جيد',
  'Mutawassith': 'متوسط',
  "Rodi'": 'رديء',
  'Tam': 'تام',
  'Naqish': 'ناقص',
};

/**
 * Converts an Indonesian predikat to its Arabic equivalent.
 * @param {string} predikat
 * @returns {string}
 */
export function predikatToArab(predikat) {
  if (!predikat) return '-';
  return predikatMap[predikat] || predikat;
}

/**
 * Gets predikat from a numeric value.
 * @param {number|string} nilaiAngka
 * @returns {string}
 */
export function getPredikat(nilaiAngka) {
  if (nilaiAngka === null || nilaiAngka === undefined) return '-';
  const n = Number(nilaiAngka);
  if (isNaN(n)) return '-';
  if (n >= 95) return 'Mumtaz';
  if (n >= 85) return 'Jayyid';
  if (n >= 75) return 'Mutawassith';
  return "Rodi'";
}

"use strict";
/**
 * validators.ts — Validasi input ketat untuk sistem keuangan
 * Mencegah manipulasi nominal, tanggal, dan ID dari client
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
exports.validateNominal = validateNominal;
exports.validateNominalNonNegative = validateNominalNonNegative;
exports.validateBulan = validateBulan;
exports.validateTahun = validateTahun;
exports.validateTanggalBayar = validateTanggalBayar;
exports.validatePositiveInt = validatePositiveInt;
exports.validateCatatPembayaran = validateCatatPembayaran;
exports.validateCatatKasKeluar = validateCatatKasKeluar;
// ─── Nominal ──────────────────────────────────────────────────────────────────
/** Validasi nominal Rupiah: harus angka positif, max 999 juta, integer */
function validateNominal(value, fieldName = 'nominal') {
    const n = Number(value);
    if (!isFinite(n) || isNaN(n)) {
        throw new ValidationError(`${fieldName} harus berupa angka`);
    }
    if (n <= 0) {
        throw new ValidationError(`${fieldName} harus lebih dari 0`);
    }
    if (n > 999999999) {
        throw new ValidationError(`${fieldName} terlalu besar (maksimal Rp 999.999.999)`);
    }
    if (!Number.isInteger(n)) {
        throw new ValidationError(`${fieldName} harus bilangan bulat (dalam Rupiah)`);
    }
    return n;
}
/** Validasi nominal yang boleh 0 (untuk tarif/diskon) */
function validateNominalNonNegative(value, fieldName = 'nominal') {
    const n = Number(value);
    if (!isFinite(n) || isNaN(n))
        throw new ValidationError(`${fieldName} harus berupa angka`);
    if (n < 0)
        throw new ValidationError(`${fieldName} tidak boleh negatif`);
    if (n > 999999999)
        throw new ValidationError(`${fieldName} terlalu besar`);
    if (!Number.isInteger(n))
        throw new ValidationError(`${fieldName} harus bilangan bulat`);
    return n;
}
// ─── Bulan & Tahun ────────────────────────────────────────────────────────────
function validateBulan(value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 12) {
        throw new ValidationError('Bulan tidak valid (harus 1–12)');
    }
    return n;
}
function validateTahun(value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 2000 || n > 2100) {
        throw new ValidationError('Tahun tidak valid (harus antara 2000–2100)');
    }
    return n;
}
// ─── Tanggal ──────────────────────────────────────────────────────────────────
/**
 * Validasi tanggal bayar:
 * - Tidak boleh di masa depan
 * - Tidak boleh lebih dari 30 hari ke belakang (tanpa override admin)
 */
function validateTanggalBayar(value, isAdmin = false) {
    if (!value)
        return new Date();
    const d = new Date(String(value));
    if (isNaN(d.getTime())) {
        throw new ValidationError('Format tanggal tidak valid (gunakan YYYY-MM-DD)');
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tanggal = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    // Tidak boleh masa depan
    if (tanggal > today) {
        throw new ValidationError('Tanggal bayar tidak boleh di masa depan');
    }
    // Max 30 hari ke belakang untuk bendahara (admin bisa lebih jauh)
    if (!isAdmin) {
        const maxMundur = new Date(today);
        maxMundur.setDate(maxMundur.getDate() - 30);
        if (tanggal < maxMundur) {
            throw new ValidationError('Tanggal bayar tidak boleh lebih dari 30 hari ke belakang. Hubungi admin untuk koreksi.');
        }
    }
    return d;
}
// ─── ID Validation ───────────────────────────────────────────────────────────
function validatePositiveInt(value, fieldName) {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
        throw new ValidationError(`${fieldName} harus berupa ID yang valid`);
    }
    return n;
}
// ─── Request Validators ───────────────────────────────────────────────────────
function validateCatatPembayaran(body) {
    const b = body;
    if (!b)
        throw new ValidationError('Request body tidak ditemukan');
    return {
        tagihan_id: b.tagihan_id ? validatePositiveInt(b.tagihan_id, 'tagihan_id') : undefined,
        santri_id: validatePositiveInt(b.santri_id, 'santri_id'),
        jenis_iuran_id: validatePositiveInt(b.jenis_iuran_id, 'jenis_iuran_id'),
        tahun_ajaran_id: validatePositiveInt(b.tahun_ajaran_id, 'tahun_ajaran_id'),
        nominal: validateNominal(b.nominal),
        metode_bayar: validateMetodeBayar(b.metode_bayar),
        tanggal_bayar: b.tanggal_bayar ? String(b.tanggal_bayar) : undefined,
        periode_bulan: b.periode_bulan ? validateBulan(b.periode_bulan) : undefined,
        periode_tahun: b.periode_tahun ? validateTahun(b.periode_tahun) : undefined,
        keterangan: b.keterangan ? String(b.keterangan).slice(0, 500) : undefined,
    };
}
function validateCatatKasKeluar(body) {
    const b = body;
    if (!b)
        throw new ValidationError('Request body tidak ditemukan');
    const validJenisKas = ['kas_pondok', 'kas_madin', 'kas_smt_ganjil', 'kas_smt_genap'];
    if (!validJenisKas.includes(b.jenis_kas)) {
        throw new ValidationError(`jenis_kas tidak valid. Pilihan: ${validJenisKas.join(', ')}`);
    }
    const keterangan = String(b.keterangan || '').trim();
    if (!keterangan)
        throw new ValidationError('Keterangan pengeluaran wajib diisi');
    if (keterangan.length < 5)
        throw new ValidationError('Keterangan terlalu pendek (min 5 karakter)');
    return {
        jenis_kas: b.jenis_kas,
        tahun_ajaran_id: b.tahun_ajaran_id ? validatePositiveInt(b.tahun_ajaran_id, 'tahun_ajaran_id') : undefined,
        nominal: validateNominal(b.nominal),
        tanggal: b.tanggal ? String(b.tanggal) : undefined,
        keterangan,
        penerima: b.penerima ? String(b.penerima).slice(0, 150) : undefined,
    };
}
function validateMetodeBayar(value) {
    const valid = ['tunai', 'transfer', 'qris'];
    if (!value)
        return 'tunai';
    if (!valid.includes(value)) {
        throw new ValidationError(`metode_bayar tidak valid. Pilihan: ${valid.join(', ')}`);
    }
    return value;
}
// ─── Custom Error ─────────────────────────────────────────────────────────────
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 400;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=validators.js.map
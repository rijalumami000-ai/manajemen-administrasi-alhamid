/**
 * validators.ts — Validasi input ketat untuk sistem keuangan
 * Mencegah manipulasi nominal, tanggal, dan ID dari client
 */
import { CatatPembayaranRequest, CatatKasKeluarRequest } from '../types/keuangan';
/** Validasi nominal Rupiah: harus angka positif, max 999 juta, integer */
export declare function validateNominal(value: unknown, fieldName?: string): number;
/** Validasi nominal yang boleh 0 (untuk tarif/diskon) */
export declare function validateNominalNonNegative(value: unknown, fieldName?: string): number;
export declare function validateBulan(value: unknown): number;
export declare function validateTahun(value: unknown): number;
/**
 * Validasi tanggal bayar:
 * - Tidak boleh di masa depan
 * - Tidak boleh lebih dari 30 hari ke belakang (tanpa override admin)
 */
export declare function validateTanggalBayar(value: unknown, isAdmin?: boolean): Date;
export declare function validatePositiveInt(value: unknown, fieldName: string): number;
export declare function validateCatatPembayaran(body: unknown): CatatPembayaranRequest;
export declare function validateCatatKasKeluar(body: unknown): CatatKasKeluarRequest;
export declare class ValidationError extends Error {
    readonly statusCode = 400;
    constructor(message: string);
}

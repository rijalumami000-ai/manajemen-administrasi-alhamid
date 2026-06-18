/**
 * tagihanService.ts — Logika bisnis utama tagihan keuangan
 *
 * Fitur utama:
 * 1. Generate tagihan SPP massal (free SPP + override tarif bulanan)
 * 2. Update status tagihan otomatis berdasarkan pembayaran
 * 3. Semua operasi dalam PostgreSQL transaction (atomic)
 */
import type { PoolClient } from 'pg';
import { GenerateTagihanBulananRequest, HasilGenerateTagihan, Pembayaran } from '../types/keuangan';
/**
 * Generate tagihan SPP Makan dan SPP Madin untuk SEMUA santri aktif
 * dalam satu tahun ajaran, bulan, dan tahun kalender tertentu.
 *
 * Logic:
 * 1. Ambil semua santri aktif di tahun ajaran
 * 2. Ambil tarif SPP (cek override bulanan dulu, fallback ke tarif tahunan)
 * 3. Untuk setiap santri:
 *    a. Cek pengecualian → jika ada: tagihan dibebaskan (nominal 0, status 'dibebaskan')
 *    b. Jika tidak: buat tagihan normal
 *    c. Skip jika sudah ada (UNIQUE constraint)
 * 4. Semua dalam satu PostgreSQL transaction
 */
export declare function generateTagihanSPPBulanan(params: GenerateTagihanBulananRequest, userId: number, ipAddress?: string): Promise<HasilGenerateTagihan>;
/**
 * Catat pembayaran baru dan otomatis update status tagihan.
 * Semua dalam satu transaction. Generate nomor kwitansi otomatis.
 */
export declare function catatPembayaran(rawBody: unknown, userId: number, isAdmin: boolean, ipAddress?: string): Promise<Pembayaran>;
export declare function voidPembayaran(pembayaranId: number, voidReason: string, userId: number, userRole: string, ipAddress?: string): Promise<void>;
export declare function updateStatusTagihan(client: PoolClient, tagihanId: number): Promise<void>;
/**
 * Generate tagihan Daftar Ulang (massal) untuk semua santri aktif
 * di tahun ajaran tertentu, otomatis memisahkan baru dan lama.
 */
export declare function generateTagihanDaftarUlang(params: {
    tahun_ajaran_id: number;
}, userId: number, ipAddress?: string): Promise<HasilGenerateTagihan>;
/**
 * Generate tagihan Event (massal) untuk semua santri aktif
 * di tahun ajaran tertentu untuk iuran event spesifik.
 */
export declare function generateTagihanEvent(params: {
    tahun_ajaran_id: number;
    jenis_iuran_id: number;
}, userId: number, ipAddress?: string): Promise<HasilGenerateTagihan>;

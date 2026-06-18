/**
 * noKwitansi.ts — Generate nomor kwitansi sequential & unik
 * Format: KWT/YYYY/NNNNNN (tahun kalender / nomor urut 6 digit)
 * Diisi server-side menggunakan PostgreSQL sequence — tidak bisa dimanipulasi client
 */
import { PoolClient } from 'pg';
/**
 * Generate nomor kwitansi baru dalam transaction yang aktif.
 * Menggunakan PostgreSQL sequence (seq_no_kwitansi) — guaranteed unique.
 *
 * @param client - PoolClient dalam transaction aktif
 * @returns string nomor kwitansi, misal "KWT/2026/000247"
 */
export declare function generateNoKwitansi(client: PoolClient): Promise<string>;
/**
 * Konversi angka ke teks terbilang Bahasa Indonesia
 * Digunakan di kwitansi cetak
 * Contoh: 350000 → "Tiga ratus lima puluh ribu rupiah"
 */
export declare function terbilang(angka: number): string;

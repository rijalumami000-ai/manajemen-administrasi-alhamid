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
export async function generateNoKwitansi(client: PoolClient): Promise<string> {
  const tahun = new Date().getFullYear();

  // Ambil nilai sequence berikutnya (atomic, thread-safe di PostgreSQL)
  const result = await client.query<{ nextval: string }>(
    `SELECT nextval('seq_no_kwitansi') AS nextval`
  );

  const nomor = Number(result.rows[0].nextval);
  const nomorFormatted = String(nomor).padStart(6, '0');

  return `KWT/${tahun}/${nomorFormatted}`;
}

/**
 * Konversi angka ke teks terbilang Bahasa Indonesia
 * Digunakan di kwitansi cetak
 * Contoh: 350000 → "Tiga ratus lima puluh ribu rupiah"
 */
export function terbilang(angka: number): string {
  if (angka === 0) return 'Nol rupiah';
  if (!isFinite(angka) || angka < 0) return '-';

  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
    'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
    'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];

  function konversi(n: number): string {
    if (n < 20) return satuan[n];
    if (n < 100) {
      const puluhan = Math.floor(n / 10);
      const sisa = n % 10;
      const puluhanStr = puluhan === 1 ? 'sepuluh' :
        ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh',
          'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'][puluhan];
      return sisa === 0 ? puluhanStr : `${puluhanStr} ${satuan[sisa]}`;
    }
    if (n < 1000) {
      const ratus = Math.floor(n / 100);
      const sisa = n % 100;
      const ratusStr = ratus === 1 ? 'seratus' : `${satuan[ratus]} ratus`;
      return sisa === 0 ? ratusStr : `${ratusStr} ${konversi(sisa)}`;
    }
    if (n < 1_000_000) {
      const ribu = Math.floor(n / 1000);
      const sisa = n % 1000;
      const ribuStr = ribu === 1 ? 'seribu' : `${konversi(ribu)} ribu`;
      return sisa === 0 ? ribuStr : `${ribuStr} ${konversi(sisa)}`;
    }
    if (n < 1_000_000_000) {
      const juta = Math.floor(n / 1_000_000);
      const sisa = n % 1_000_000;
      const jutaStr = `${konversi(juta)} juta`;
      return sisa === 0 ? jutaStr : `${jutaStr} ${konversi(sisa)}`;
    }
    return String(n); // fallback untuk >= 1 miliar
  }

  const hasil = konversi(Math.round(angka));
  // Kapitalkan huruf pertama
  return hasil.charAt(0).toUpperCase() + hasil.slice(1) + ' rupiah';
}

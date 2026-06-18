/**
 * keuangan.ts — Type definitions untuk sistem keuangan Ponpes Al-Hamid
 * Semua interface, enum, dan request/response types
 */

import { PoolClient } from 'pg';

// ─── Re-export untuk kemudahan ────────────────────────────────────────────────
export type DbClient = PoolClient;

// ════════════════════════════════════════════════════════════════════════════
// ENUM TYPES
// ════════════════════════════════════════════════════════════════════════════

export type KategoriIuran =
  | 'spp_bulanan'
  | 'daftar_ulang_baru'
  | 'daftar_ulang_lama'
  | 'event'
  | 'lain';

export type StatusTagihan =
  | 'belum_lunas'
  | 'sebagian'
  | 'lunas'
  | 'dibebaskan';

export type MetodeBayar = 'tunai' | 'transfer' | 'qris';

export type JenisKas =
  | 'kas_pondok'
  | 'kas_madin'
  | 'kas_smt_ganjil'
  | 'kas_smt_genap';

export type AuditAction =
  | 'CATAT_PEMBAYARAN'
  | 'VOID_PEMBAYARAN'
  | 'GENERATE_TAGIHAN_MASSAL'
  | 'CREATE_TAGIHAN_MANUAL'
  | 'UPDATE_TAGIHAN'
  | 'CATAT_KAS_KELUAR'
  | 'EDIT_KAS_KELUAR'
  | 'VOID_KAS_KELUAR'
  | 'SET_TARIF'
  | 'SET_TARIF_BULANAN'
  | 'DELETE_TARIF_BULANAN'
  | 'SET_PENGECUALIAN'
  | 'CABUT_PENGECUALIAN';

// ════════════════════════════════════════════════════════════════════════════
// NAMA BULAN (Bahasa Indonesia)
// ════════════════════════════════════════════════════════════════════════════

export const NAMA_BULAN: Record<number, string> = {
  1: 'Januari', 2: 'Februari',  3: 'Maret',
  4: 'April',   5: 'Mei',       6: 'Juni',
  7: 'Juli',    8: 'Agustus',   9: 'September',
  10: 'Oktober',11: 'November', 12: 'Desember',
};

export const LABEL_JENIS_KAS: Record<JenisKas, string> = {
  kas_pondok:    'Kas Pondok',
  kas_madin:     'Kas Madin',
  kas_smt_ganjil: 'Semester Ganjil',
  kas_smt_genap:  'Semester Genap',
};

// ════════════════════════════════════════════════════════════════════════════
// MODEL DATABASE
// ════════════════════════════════════════════════════════════════════════════

export interface JenisIuran {
  id: number;
  kode: string;
  nama: string;
  kategori: KategoriIuran;
  deskripsi?: string;
  urutan: number;
  is_active: boolean;
  created_at: Date;
}

export interface TarifIuran {
  id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  nominal: number;
  keterangan?: string;
  created_at: Date;
  updated_at: Date;
  // Joined
  kode_iuran?: string;
  nama_iuran?: string;
  kategori?: KategoriIuran;
}

export interface TarifIuranBulanan {
  id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  bulan: number;
  tahun_kalender: number;
  nominal: number;
  keterangan?: string;
  created_at: Date;
  // Joined
  nama_iuran?: string;
}

export interface PengecualianIuran {
  id: number;
  santri_id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  alasan?: string;
  dicatat_oleh?: number;
  created_at: Date;
  // Joined
  nama_santri?: string;
  nis?: string;
  nama_iuran?: string;
  kode_iuran?: string;
  nama_pencatat?: string;
}

export interface Tagihan {
  id: number;
  santri_id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  periode_bulan?: number;
  periode_tahun?: number;
  nominal_tagihan: number;
  nominal_diskon: number;
  status: StatusTagihan;
  tanggal_jatuh_tempo?: Date;
  catatan?: string;
  created_at: Date;
  updated_at: Date;
  // Joined / computed
  nama_santri?: string;
  nis?: string;
  kelas_diniyah?: string;
  nama_iuran?: string;
  kode_iuran?: string;
  kategori?: KategoriIuran;
  total_dibayar?: number;   // SUM(nominal) dari pembayaran yang is_void=false
  sisa_tagihan?: number;    // nominal_tagihan - nominal_diskon - total_dibayar
}

export interface Pembayaran {
  id: number;
  no_kwitansi?: string;
  tagihan_id?: number;
  santri_id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  nominal: number;
  metode_bayar: MetodeBayar;
  tanggal_bayar: Date;
  periode_bulan?: number;
  periode_tahun?: number;
  dicatat_oleh?: number;
  keterangan?: string;
  is_void: boolean;
  void_reason?: string;
  void_oleh?: number;
  void_at?: Date;
  created_at: Date;
  // Joined
  nama_santri?: string;
  nis?: string;
  kelas_diniyah?: string;
  nama_iuran?: string;
  nama_bendahara?: string;
  nama_void_oleh?: string;
}

export interface KasKeluar {
  id: number;
  jenis_kas: JenisKas;
  tahun_ajaran_id?: number;
  nominal: number;
  tanggal: Date;
  keterangan: string;
  penerima?: string;
  dicatat_oleh?: number;
  is_void: boolean;
  void_reason?: string;
  void_oleh?: number;
  void_at?: Date;
  created_at: Date;
  updated_at: Date;
  // Joined
  nama_bendahara?: string;
  kode_tahun_ajaran?: string;
}

export interface AuditKeuangan {
  id: number;
  user_id: number;
  action: AuditAction;
  entity_type?: string;
  entity_id?: number;
  nilai_lama?: Record<string, unknown>;
  nilai_baru?: Record<string, unknown>;
  keterangan?: string;
  ip_address?: string;
  created_at: Date;
  // Joined
  nama_user?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// REQUEST TYPES (dari frontend → backend)
// ════════════════════════════════════════════════════════════════════════════

export interface GenerateTagihanBulananRequest {
  tahun_ajaran_id: number;
  bulan: number;   // 1–12
  tahun: number;   // tahun kalender, misal 2026
}

export interface CatatPembayaranRequest {
  tagihan_id?: number;
  santri_id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  nominal: number;
  metode_bayar?: MetodeBayar;
  tanggal_bayar?: string;       // ISO date string "YYYY-MM-DD"
  periode_bulan?: number;
  periode_tahun?: number;
  keterangan?: string;
}

export interface VoidPembayaranRequest {
  void_reason: string;
}

export interface SetTarifRequest {
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  nominal: number;
  keterangan?: string;
}

export interface SetTarifBulananRequest {
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  bulan: number;
  tahun_kalender: number;
  nominal: number;
  keterangan?: string;
}

export interface SetPengecualianRequest {
  santri_id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  alasan?: string;
}

export interface CatatKasKeluarRequest {
  jenis_kas: JenisKas;
  tahun_ajaran_id?: number;
  nominal: number;
  tanggal?: string;           // ISO date string
  keterangan: string;
  penerima?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// LAPORAN TYPES (response dari backend → frontend)
// ════════════════════════════════════════════════════════════════════════════

/** Ringkasan keuangan satu santri */
export interface RingkasanKeuanganSantri {
  santri_id: number;
  nama: string;
  nis: string;
  tahun_ajaran_id: number;
  total_tagihan: number;
  total_dibayar: number;
  total_tunggakan: number;
  jumlah_tagihan_belum_lunas: number;
  jumlah_tagihan_dibebaskan: number;
  tagihan: Tagihan[];
  pembayaran: Pembayaran[];
}

/** Laporan SPP per bulan — satu baris per santri */
export interface LaporanSPPPerSantriPerBulan {
  santri_id: number;
  nama: string;
  nis: string;
  bulan: number;
  tahun: number;
  // SPP Makan
  tagihan_makan_id?: number;
  nominal_tagihan_makan: number;
  nominal_dibayar_makan: number;
  status_makan: StatusTagihan;
  // SPP Madin
  tagihan_madin_id?: number;
  nominal_tagihan_madin: number;
  nominal_dibayar_madin: number;
  status_madin: StatusTagihan;
  // Total
  total_tagihan: number;
  total_dibayar: number;
}

/** Summary laporan SPP per bulan */
export interface LaporanSPPBulananSummary {
  bulan: number;
  tahun: number;
  nama_bulan: string;
  tahun_ajaran_id: number;
  // Makan
  target_makan: number;
  terkumpul_makan: number;
  realisasi_makan_pct: number;
  santri_dibebaskan_makan: number;
  // Madin
  target_madin: number;
  terkumpul_madin: number;
  realisasi_madin_pct: number;
  santri_dibebaskan_madin: number;
  // Total
  total_target: number;
  total_terkumpul: number;
  total_tunggakan: number;
  realisasi_pct: number;
  // Detail per santri
  per_santri: LaporanSPPPerSantriPerBulan[];
}

/** Laporan SPP semester (6 bulan) */
export interface LaporanSPPSemester {
  semester: 'ganjil' | 'genap';
  tahun_ajaran_id: number;
  kode_tahun_ajaran: string;
  bulan_list: number[];           // [7,8,9,10,11,12] atau [1,2,3,4,5,6]
  tahun_list: number[];           // tahun kalender per bulan
  summary_per_bulan: Array<{
    bulan: number;
    tahun: number;
    target_makan: number; terkumpul_makan: number;
    target_madin: number; terkumpul_madin: number;
  }>;
  per_santri: Array<{
    santri_id: number;
    nama: string;
    nis: string;
    makan_per_bulan: Record<number, { tagihan: number; dibayar: number; status: StatusTagihan }>;
    madin_per_bulan: Record<number, { tagihan: number; dibayar: number; status: StatusTagihan }>;
    total_tagihan_makan: number;
    total_dibayar_makan: number;
    total_tagihan_madin: number;
    total_dibayar_madin: number;
    total_tunggakan: number;
  }>;
  grand_total_target_makan: number;
  grand_total_terkumpul_makan: number;
  grand_total_target_madin: number;
  grand_total_terkumpul_madin: number;
  grand_total_target: number;
  grand_total_terkumpul: number;
  grand_total_tunggakan: number;
  realisasi_pct: number;
}

/** Laporan SPP tahunan */
export interface LaporanSPPTahunan {
  tahun_ajaran_id: number;
  kode_tahun_ajaran: string;
  per_santri: Array<{
    santri_id: number;
    nama: string;
    nis: string;
    target_makan_12bln: number;
    dibayar_makan_12bln: number;
    target_madin_12bln: number;
    dibayar_madin_12bln: number;
    total_target: number;
    total_dibayar: number;
    total_tunggakan: number;
    status_keseluruhan: 'lunas_penuh' | 'masih_menunggak' | 'bebas_penuh';
  }>;
  summary: {
    total_santri_aktif: number;
    santri_lunas_penuh: number;
    santri_menunggak: number;
    grand_target_makan: number;
    grand_terkumpul_makan: number;
    grand_target_madin: number;
    grand_terkumpul_madin: number;
    grand_target: number;
    grand_terkumpul: number;
    grand_tunggakan: number;
    realisasi_pct: number;
  };
}

/** Laporan daftar ulang per item */
export interface LaporanDaftarUlang {
  tipe: 'baru' | 'lama';
  tahun_ajaran_id: number;
  kode_tahun_ajaran: string;
  summary_per_item: Array<{
    jenis_iuran_id: number;
    kode: string;
    nama: string;
    nominal_tarif: number;
    jumlah_santri: number;
    jumlah_lunas: number;
    jumlah_sebagian: number;
    jumlah_belum: number;
    terkumpul: number;
    target: number;
    realisasi_pct: number;
  }>;
  per_santri: Array<{
    santri_id: number;
    nama: string;
    nis: string;
    status_per_item: Record<string, {
      status: StatusTagihan;
      tagihan: number;
      dibayar: number;
    }>;
    total_tagihan: number;
    total_dibayar: number;
    total_sisa: number;
  }>;
  grand_target: number;
  grand_terkumpul: number;
  grand_tunggakan: number;
  realisasi_pct: number;
}

/** Laporan event */
export interface LaporanEvent {
  tahun_ajaran_id: number;
  kode_tahun_ajaran: string;
  per_event: Array<{
    jenis_iuran_id: number;
    kode: string;
    nama: string;
    nominal_tarif: number;
    jumlah_santri: number;
    jumlah_lunas: number;
    jumlah_sebagian: number;
    jumlah_belum: number;
    terkumpul: number;
    target: number;
    realisasi_pct: number;
    detail_santri: Array<{
      santri_id: number;
      nama: string;
      nis: string;
      status: StatusTagihan;
      tagihan: number;
      dibayar: number;
      sisa: number;
    }>;
  }>;
  grand_target: number;
  grand_terkumpul: number;
  grand_tunggakan: number;
  realisasi_pct: number;
}

/** Ringkasan dashboard */
export interface DashboardSummary {
  bulan: number;
  tahun: number;
  // Pemasukan bulan ini
  total_masuk_bulan_ini: number;
  total_masuk_bulan_lalu: number;
  pct_change_masuk: number;
  // Pengeluaran bulan ini
  total_keluar_bulan_ini: number;
  total_keluar_bulan_lalu: number;
  pct_change_keluar: number;
  // Saldo bersih
  saldo_bersih: number;
  // Tunggakan aktif
  total_tunggakan_aktif: number;
  jumlah_santri_menunggak: number;
  // Breakdown pemasukan
  breakdown_masuk: {
    spp_makan: number;
    spp_madin: number;
    daftar_ulang: number;
    event: number;
  };
  // Breakdown pengeluaran
  breakdown_keluar: {
    kas_pondok: number;
    kas_madin: number;
    kas_smt_ganjil: number;
    kas_smt_genap: number;
  };
  // Top tunggakan
  top_tunggakan: Array<{
    santri_id: number;
    nama: string;
    nis: string;
    total_tunggakan: number;
    bulan_menunggak: number;
  }>;
}

// ════════════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ════════════════════════════════════════════════════════════════════════════

/** Hasil generate tagihan massal */
export interface HasilGenerateTagihan {
  berhasil: number;
  dibebaskan: number;
  sudah_ada: number;
  errors: string[];
  detail: Array<{
    santri_id: number;
    nama: string;
    hasil: 'berhasil' | 'dibebaskan' | 'sudah_ada' | 'error';
    pesan?: string;
  }>;
}

/** Express request yang sudah ter-authenticate */
export interface AuthRequest {
  user: {
    id: number;
    username: string;
    role: string;
    full_name: string;
  };
  ip?: string;
}

// =============================================================================
// TYPESCRIPT DEFINITIONS — KEUANGAN (OPTION A REDESIGN)
// Pondok Pesantren Al-Hamid
// =============================================================================

export type StatusTagihan = 'belum_lunas' | 'sebagian' | 'lunas' | 'dibebaskan';

export type TabTagihan = 'spp_makan' | 'spp_madin' | 'daftar_ulang' | 'event';

export interface TahunAjaran {
  id: number;
  kode: string;
  is_active: boolean;
}

export interface KelasItem {
  id: number;
  jenis: 'Diniyah' | 'Sekolah';
  nama: string;
  tingkat?: number;
}

export interface JenisIuranItem {
  id: number;
  nama: string;
  kategori: string;
  is_active: boolean;
}

export interface TagihanItem {
  id: number;
  santri_id: number;
  nama_santri: string;
  nis: string;
  kelas_diniyah?: string;
  nama_iuran: string;
  kode_iuran: string;
  kategori: string;
  periode_bulan?: number;
  periode_tahun?: number;
  nominal_tagihan: number;
  nominal_diskon: number;
  total_dibayar: number;
  sisa_tagihan: number;
  status: StatusTagihan;
  pembayaran_id?: number | null;
}

export interface PaginationState {
  total: number;
  total_pages: number;
}

export interface DashboardTopTunggakan {
  santri_id: number;
  nama: string;
  nis: string;
  total_tunggakan: number;
  bulan_menunggak: number;
}

export interface DashboardKeuanganData {
  bulan: number;
  tahun: number;
  nama_bulan: string;
  total_masuk_bulan_ini: number;
  total_masuk_bulan_lalu: number;
  pct_change_masuk: number;
  total_keluar_bulan_ini: number;
  total_keluar_bulan_lalu: number;
  pct_change_keluar: number;
  saldo_bersih: number;
  total_tunggakan_aktif: number;
  jumlah_santri_menunggak: number;
  breakdown_masuk: Record<string, number>;
  breakdown_keluar: Record<string, number>;
  top_tunggakan: DashboardTopTunggakan[];
}

export interface PembayaranPayload {
  tagihan_id: number;
  santri_id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  nominal: number;
  metode_bayar: 'tunai' | 'transfer' | 'qris' | string;
  keterangan?: string;
}

export interface GenerateSPPPayload {
  tahun_ajaran_id: number;
  bulan: number;
  tahun: number;
}

export interface GenerateDUPayload {
  tahun_ajaran_id: number;
}

export interface GenerateEventPayload {
  tahun_ajaran_id: number;
  jenis_iuran_id: number;
}

// ─── Laporan SPP Types ──────────────────────────────────────────────────────
export type SubTabLaporanSPP = 'bulanan' | 'semester' | 'tahunan';

export interface LaporanSPPBulananSummary {
  terkumpul_makan: number;
  target_makan: number;
  realisasi_makan_pct: number;
  santri_lunas_makan: number;
  santri_bebas_makan: number;
  terkumpul_madin: number;
  target_madin: number;
  realisasi_madin_pct: number;
  santri_lunas_madin: number;
  santri_bebas_madin: number;
  total_terkumpul: number;
  total_target: number;
  total_tunggakan: number;
  realisasi_pct: number;
  total_santri: number;
}

export interface LaporanSPPBulananSantri {
  santri_id: number;
  nama: string;
  nis: string;
  kelas_diniyah_id?: number | null;
  nama_kelas_diniyah?: string | null;
  kelas_sekolah_id?: number | null;
  nama_kelas_sekolah?: string | null;
  tagihan_makan_id?: number | null;
  nominal_tagihan_makan: number;
  nominal_dibayar_makan: number;
  status_makan: StatusTagihan;
  tagihan_madin_id?: number | null;
  nominal_tagihan_madin: number;
  nominal_dibayar_madin: number;
  status_madin: StatusTagihan;
}

export interface LaporanSPPBulananResponse {
  summary: LaporanSPPBulananSummary;
  per_santri: LaporanSPPBulananSantri[];
}

export interface LaporanSPPSemesterGrandTotal {
  terkumpul_makan: number;
  target_makan: number;
  terkumpul_madin: number;
  target_madin: number;
  total_terkumpul: number;
  total_target: number;
  total_tunggakan: number;
  realisasi_pct: number;
}

export interface LaporanSPPSemesterSantri {
  santri_id: number;
  nama: string;
  nis: string;
  total_dibayar_makan: number;
  total_dibayar_madin: number;
  total_tunggakan: number;
  makan_per_bulan: Record<number, { status: StatusTagihan; nominal_dibayar: number }>;
  madin_per_bulan: Record<number, { status: StatusTagihan; nominal_dibayar: number }>;
}

export interface LaporanSPPSemesterResponse {
  bulan_list: number[];
  grand_total: LaporanSPPSemesterGrandTotal;
  per_santri: LaporanSPPSemesterSantri[];
}

export interface LaporanSPPTahunanSummary {
  grand_terkumpul_makan: number;
  grand_target_makan: number;
  grand_terkumpul_madin: number;
  grand_target_madin: number;
  grand_terkumpul: number;
  grand_target: number;
  grand_tunggakan: number;
  realisasi_pct: number;
  santri_lunas_penuh: number;
  santri_menunggak: number;
}

export interface LaporanSPPTahunanSantri {
  santri_id: number;
  nama: string;
  nis: string;
  target_makan: number;
  dibayar_makan: number;
  target_madin: number;
  dibayar_madin: number;
  total_dibayar: number;
  total_tunggakan: number;
  status_keseluruhan: 'lunas_penuh' | 'menunggak';
}

export interface LaporanSPPTahunanResponse {
  summary: LaporanSPPTahunanSummary;
  per_santri: LaporanSPPTahunanSantri[];
}

// ─── Laporan Daftar Ulang Types ─────────────────────────────────────────────
export type TipeDaftarUlang = 'baru' | 'lama';

export interface LaporanDUSummaryItem {
  jenis_iuran_id?: number;
  kode: string;
  nama: string;
  urutan?: number;
  jumlah_santri?: number;
  jumlah_lunas: number;
  jumlah_sebagian: number;
  jumlah_belum?: number;
  terkumpul: number;
  target: number;
}

export interface LaporanDUSantriItem {
  santri_id: number;
  nama: string;
  nis: string;
  total_tagihan: number;
  total_dibayar: number;
  total_sisa: number;
  status_per_item: Record<string, {
    status: StatusTagihan;
    dibayar: number;
    tagihan?: number;
  }>;
}

export interface LaporanDUResponse {
  grand_target: number;
  grand_terkumpul: number;
  grand_tunggakan: number;
  realisasi_pct: number;
  summary_per_item: LaporanDUSummaryItem[];
  per_santri: LaporanDUSantriItem[];
}

// ─── Laporan Event Types ────────────────────────────────────────────────────
export interface LaporanEventSantri {
  santri_id: number;
  nama: string;
  nis: string;
  status: StatusTagihan;
  tagihan: number;
  dibayar: number;
  sisa: number;
}

export interface LaporanEventItem {
  jenis_iuran_id?: number;
  kode: string;
  nama: string;
  urutan?: number;
  jumlah_santri: number;
  jumlah_lunas: number;
  jumlah_sebagian: number;
  jumlah_belum: number;
  terkumpul: number;
  target: number;
  realisasi_pct: number;
  detail_santri: LaporanEventSantri[];
}

export interface LaporanEventResponse {
  tahun_ajaran_id: number;
  per_event: LaporanEventItem[];
  grand_target: number;
  grand_terkumpul: number;
  grand_tunggakan: number;
  realisasi_pct: number;
}

// ─── Buku Kas Keluar Types ──────────────────────────────────────────────────
export type JenisKas = 'kas_pondok' | 'kas_madin' | 'kas_smt_ganjil' | 'kas_smt_genap';

export interface KasKeluarItem {
  id: number;
  jenis_kas: JenisKas;
  nominal: number;
  tanggal: string;
  keterangan: string;
  penerima?: string | null;
  nama_pencatat?: string;
  nama_bendahara?: string;
  is_void: boolean;
  void_reason?: string | null;
}

export interface BukuKasSummaryItem {
  jenis_kas: string;
  total: number;
  jumlah: number;
}

export interface BukuKasResponse {
  data: KasKeluarItem[];
  total?: number;
}

export interface BukuKasSummaryResponse {
  summary: BukuKasSummaryItem[];
}

export interface CatatKasKeluarPayload {
  jenis_kas: JenisKas;
  tahun_ajaran_id: number;
  nominal: number;
  tanggal: string;
  keterangan: string;
  penerima?: string;
}

// ─── Setup Keuangan Types ───────────────────────────────────────────────────
export type ActiveTabSetup = 'default' | 'override' | 'pengecualian';

export interface JenisIuran {
  id: number;
  kode: string;
  nama: string;
  kategori: string;
  deskripsi?: string;
}

export interface TarifDefault {
  id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  nominal: string | number;
  keterangan?: string;
  kode_iuran: string;
  nama_iuran: string;
  kategori: string;
}

export interface TarifBulanan {
  id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  bulan: number;
  tahun_kalender: number;
  nominal: string | number;
  keterangan?: string;
  kode_iuran: string;
  nama_iuran: string;
}

export interface Pengecualian {
  id: number;
  santri_id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  alasan?: string;
  nama_santri: string;
  nis: string;
  nama_iuran: string;
  kode_iuran: string;
  nama_pencatat?: string;
}

export interface SantriLookup {
  id: number;
  nama: string;
  nis: string;
}

// ─── Log Audit Keuangan Types ───────────────────────────────────────────────
export interface AuditLogItem {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  nilai_lama: any;
  nilai_baru: any;
  keterangan?: string;
  ip_address?: string;
  created_at: string;
  nama_user?: string;
  username?: string;
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface AuditLogResponse {
  data: AuditLogItem[];
  pagination?: AuditLogPagination;
}




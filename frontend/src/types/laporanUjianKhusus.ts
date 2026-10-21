// =============================================================================
// LAPORAN UJIAN KHUSUS — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Translucent Acrylic Skeuomorphism
// =============================================================================

export interface TahunAjaranItem {
  id: number;
  kode: string;
  is_active: boolean;
  tahun_mulai?: number;
  tahun_selesai?: number;
}

export interface KelasItem {
  id: number;
  nama: string;
  tingkat: number;
  jenis?: string;
  wali_kelas_id?: number | null;
}

export interface KategoriItem {
  id: number;
  nama: string;
  tipe?: string;
}

export interface MataPelajaranItem {
  id: number;
  nama: string;
  nama_arab?: string | null;
  jenis?: string;
  tingkat?: number | string;
  kode?: string;
}

export interface SantriNilaiRow {
  id?: number;
  santri_id: number;
  nama: string;
  nis?: string;
  nilai_angka?: number | string | null;
  nilai_huruf?: string | null;
  status_kelulusan?: string | null;
  catatan?: string | null;
  predikat?: string | null;
  akbar?: SantriNilaiRow;
  qiroah?: SantriNilaiRow;
  taftisy?: SantriNilaiRow;
  [key: string]: any;
}

export interface AkumulasiKelasItem {
  kelas_id: number;
  nama_kelas: string;
  tingkat: number;
  total_santri: number;
  jumlah_lulus: number;
  jumlah_tidak_lulus: number;
  persentase_lulus: number;
  rata_rata_nilai: number;
}

export interface TingkatOption {
  label: string;
  value: number;
}

export type UjianKhususTab = 'muhafadzoh' | 'qiroatul_kitab' | 'taftisyul_kutub' | 'ringkasan';
export type ViewMode = 'detail' | 'akumulasi';

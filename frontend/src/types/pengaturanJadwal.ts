// =============================================================================
// PENGATURAN & JADWAL TYPE DEFINITIONS
// Contract preserved for /api/nilai/kriteria, /api/nilai/mapel-tingkat, etc.
// =============================================================================

export interface TahunAjaranItem {
  id: number;
  kode: string;
  nama?: string;
  is_active: boolean;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
}

export interface KategoriItem {
  id: number;
  nama: string;
  kode?: string;
  [key: string]: any;
}

export interface KelasItem {
  id: number;
  nama: string;
  tingkat: number;
  jenis: string;
  [key: string]: any;
}

export interface MapelItem {
  id: number;
  nama: string;
  jenis: string;
  kode?: string;
  [key: string]: any;
}

export interface MapelTingkatItem {
  id?: number;
  tahun_ajaran_id: number;
  kategori_evaluasi_id: number;
  tingkat: number;
  mata_pelajaran_id: number;
  mata_pelajaran_nama?: string;
}

export interface AngkaPredicateRange {
  min: number | null;
  max: number | null;
}

export type ConfigAngka = Record<string, AngkaPredicateRange>;

export interface ConfigTeksItem {
  bab: string;
  predikat: string;
}

export interface KriteriaConfig {
  id?: number;
  tingkat: number;
  mata_pelajaran_id: number;
  jenis_mapel?: string;
  tipe_input: 'Angka' | 'Teks';
  konfigurasi: any;
  tahun_ajaran_id: number;
  kategori_evaluasi_id: number;
}

// =============================================================================
// STATISTIK SISWA DINIYAH — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Translucent Acrylic Skeuomorphism
// =============================================================================

export interface StatistikSummary {
  total: number | string;
  putra: number | string;
  putri: number | string;
  total_ganjil?: number | string;
  total_genap?: number | string;
  ganjil_status?: 'berjalan' | 'selesai' | 'akan_datang' | string;
  genap_status?: 'berjalan' | 'selesai' | 'akan_datang' | string;
}

export interface TingkatStatistikItem {
  tingkat: number;
  nama_tingkat: string;
  total: number | string;
  putra: number | string;
  putri: number | string;
}

export interface KelasStatistikItem {
  kelas_id: number;
  nama_kelas: string;
  tingkat: number;
  total: number | string;
  putra: number | string;
  putri: number | string;
}

export interface TrenTahunAjaranItem {
  tahun_ajaran_id: number;
  kode: string;
  is_active: boolean | number;
  total_diniyah: number | string;
  putra: number | string;
  putri: number | string;
}

export interface StatistikDiniyahResponse {
  summary: StatistikSummary;
  per_tingkat: TingkatStatistikItem[];
  per_kelas: KelasStatistikItem[];
  tren_tahun_ajaran: TrenTahunAjaranItem[];
  semester_status?: {
    ganjil?: 'berjalan' | 'selesai' | 'akan_datang' | string;
    genap?: 'berjalan' | 'selesai' | 'akan_datang' | string;
  };
  tahun_ajaran?: {
    id: number;
    kode: string;
    is_active: boolean;
  };
}

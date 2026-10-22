// =============================================================================
// REKAP MUHAFADZOH MINI — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Liquid Glass
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

export interface MiniNilaiItem {
  id?: number;
  santri_id: number;
  nama: string;
  nis?: string;
  nilai_angka?: number | string | null;
  nilai_huruf?: string | null;
  capaian?: string | null;
  predikat?: string | null;
  mini1?: MiniNilaiItem;
  mini2?: MiniNilaiItem;
  mini3?: MiniNilaiItem;
  mini4?: MiniNilaiItem;
  [key: string]: any;
}

export type RekapMiniTab = 'mini1' | 'mini2' | 'mini3' | 'mini4' | 'ringkasan';

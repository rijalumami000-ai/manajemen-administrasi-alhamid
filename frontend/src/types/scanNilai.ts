// =============================================================================
// SCAN NILAI & LEMBAR OMR — TYPESCRIPT DEFINITIONS
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
  tingkat?: number | string;
  jenis?: string;
  wali_kelas_id?: number | null;
}

export interface MataPelajaranItem {
  id: number;
  nama: string;
  nama_arab?: string | null;
  jenis?: string;
  tingkat?: number | string;
  kode?: string;
}

export interface KategoriItem {
  id: number;
  nama: string;
  tipe?: string;
}

export interface SantriNilaiItem {
  id: number;
  santri_id?: number;
  nis?: string;
  nama: string;
  jenis_kelamin?: 'L' | 'P' | string;
  nama_kelas?: string;
}

export interface MapelTingkatItem {
  tingkat: number | string;
  mata_pelajaran_id: number;
}

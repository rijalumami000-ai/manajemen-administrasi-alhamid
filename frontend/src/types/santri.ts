// =============================================================================
// DATA SANTRI — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Translucent Acrylic Skeuomorphism
// =============================================================================

export interface SantriListItem {
  id: number;
  nis: string;
  nik?: string | null;
  nama: string;
  jenis_kelamin: 'L' | 'P' | string;
  kelas_diniyah_id?: number | null;
  nama_diniyah?: string | null;
  kelas_sekolah_id?: number | null;
  nama_sekolah?: string | null;
  kamar_id?: number | null;
  nama_kamar?: string | null;
  status_tahun_ajaran?: 'aktif' | 'pindah' | string;
  aktif_ganjil?: boolean | number;
  aktif_genap?: boolean | number;
  catatan_tahun_ajaran?: string | null;
  nama_ayah?: string | null;
  nama_ibu?: string | null;
  no_hp_ayah?: string | null;
  no_hp_ibu?: string | null;
  foto_url?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface KelasItem {
  id: number;
  nama: string;
  jenis: 'Diniyah' | 'Sekolah' | string;
  tingkat?: number;
  [key: string]: any;
}

export interface KamarItem {
  id: number;
  nama: string;
  jenis: string;
  kapasitas?: number;
  [key: string]: any;
}

export interface TahunAjaranItem {
  id: number;
  kode: string;
  nama?: string;
  tahun_mulai: number;
  tahun_selesai: number;
  is_active: boolean | number;
  [key: string]: any;
}

export interface EditFormData {
  kelas_diniyah_id: string;
  kelas_sekolah_id: string;
  kamar_id: string;
  status_tahun_ajaran: string;
  catatan_tahun_ajaran: string;
}

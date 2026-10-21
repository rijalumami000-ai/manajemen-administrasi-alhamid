// =============================================================================
// ALUMNI & KELULUSAN — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Translucent Acrylic Skeuomorphism
// =============================================================================

export type AlumniType = 'alumni' | 'lulus_mts' | 'lulus_aliyah' | 'pindah' | string;

export interface AlumniItem {
  id: number;
  santri_id?: number | null;
  nis?: string;
  nama: string;
  jenis_kelamin?: 'L' | 'P' | string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  foto_url?: string | null;
  kelas_terakhir?: string;
  tahun_lulus?: number | string;
  tahun_ajaran_id?: number | null;
  tipe?: AlumniType;
  status?: string;
  keterangan?: string;
  nomor_telepon?: string;
  email?: string;
  pekerjaan?: string;
  institusi?: string;
  [key: string]: any;
}

export interface ActiveSantriItem {
  id: number;
  nis: string;
  nama: string;
  kelas_id?: number;
  nama_kelas?: string;
  jenis_kelamin?: string;
}

export interface TahunAjaranItem {
  id: number;
  kode: string;
  is_active: boolean;
  tahun_mulai?: number;
  tahun_selesai?: number;
}

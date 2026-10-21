// =============================================================================
// BUKU INDUK SANTRI — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Translucent Acrylic Skeuomorphism
// =============================================================================

export interface BukuIndukSantri {
  id: number;
  nis: string;
  nik?: string | null;
  nama: string;
  jenis_kelamin: 'L' | 'P' | string;
  anak_ke?: number | null;
  agama?: string | null;
  status_keluarga?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  alamat?: string | null;
  kelas_diniyah?: string | null;
  kelas_sekolah?: string | null;
  nama_kamar?: string | null;
  tahun_masuk?: string | number | null;
  nama_ayah?: string | null;
  nik_ayah?: string | null;
  pekerjaan_ayah?: string | null;
  no_hp_ayah?: string | null;
  nama_ibu?: string | null;
  nik_ibu?: string | null;
  pekerjaan_ibu?: string | null;
  no_hp_ibu?: string | null;
  status_masuk?: string | null;
  pesantren_sebelumnya?: string | null;
  sekolah_asal_nama?: string | null;
  sekolah_asal_alamat?: string | null;
  diterima_kelas_madin?: string | null;
  diterima_tanggal_madin?: string | null;
  keluar_madin_tanggal?: string | null;
  keluar_madin_status?: string | null;
  keluar_pondok_tanggal?: string | null;
  keluar_pondok_status?: string | null;
  keluar_sekolah_tingkat?: string | null;
  keluar_sekolah_tanggal?: string | null;
  keluar_sekolah_status?: string | null;
  foto_url?: string | null;
  [key: string]: any;
}

export interface BukuIndukStats {
  total: number;
  putra: number;
  putri: number;
  withPhoto: number;
}

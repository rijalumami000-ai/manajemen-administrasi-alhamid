// =============================================================================
// KARTU UJIAN TULIS — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Translucent Acrylic Skeuomorphism
// =============================================================================

export interface TahunAjaranItem {
  id: number;
  kode: string;
  is_active: boolean;
  tahun_mulai?: number;
  tahun_selesai?: number;
}

export interface PesertaUjianItem {
  id: number;
  santri_id?: number;
  nis?: string;
  no_peserta?: string;
  nama: string;
  jenis_kelamin?: 'L' | 'P' | string;
  nama_kelas?: string;
  kelas_id?: number;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  foto_url?: string | null;
  status?: string;
}

export interface KartuUjianSettings {
  active_semester?: string;
  kartu_ujian_logo_url?: string | null;
  kartu_ujian_judul_1?: string;
  kartu_ujian_judul_2?: string;
  kartu_ujian_judul_kartu?: string;
  kartu_ujian_lokasi?: string;
  kartu_ujian_stempel_url?: string | null;
  kartu_ujian_ttd_url?: string | null;
  kartu_ujian_ketua_panitia?: string;
  kartu_ujian_kewajiban?: string;
  kartu_ujian_larangan?: string;
  [key: string]: any;
}

export interface PrintDataState {
  pesertaList: PesertaUjianItem[];
  tahunAjaran: TahunAjaranItem | null;
  tanggalCetak: string;
}

export type KartuUjianTabKey = 'generate' | 'cetak' | 'kartu_belakang' | 'setting';

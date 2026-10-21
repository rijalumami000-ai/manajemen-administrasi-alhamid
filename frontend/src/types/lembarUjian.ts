// =============================================================================
// PEMBUAT LEMBAR UJIAN — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Translucent Acrylic Skeuomorphism
// =============================================================================

export interface SoalItem {
  teks: string;
  jawaban?: string;
}

export interface KopSettingsData {
  judul: string;
  subJudul: string;
  alamat: string;
  hariTanggal: string;
  instruksi: string;
}

export interface TingkatTabItem {
  key: string;
  label: string;
  tingkat: number;
}

export interface MataPelajaranItem {
  id: number;
  nama: string;
  nama_arab?: string | null;
  jenis?: string;
  tingkat?: number | string;
  kode?: string;
}

export interface KategoriNilaiItem {
  id: number;
  nama: string;
  tipe?: string;
}

export interface TahunAjaranItem {
  id: number;
  kode: string;
  is_active: boolean;
  tahun_mulai?: number;
  tahun_selesai?: number;
}

// =============================================================================
// INFORMASI UJIAN TYPE DEFINITIONS
// Contract preserved for /api/nilai/muhafadzoh-info, /api/nilai/qiroah-maqro, etc.
// =============================================================================

export interface MuhafadzohRow {
  kelas: string;
  kitab: string;
  mumtaz: string;
  jayyid: string;
  mutawasith: string;
  rodi: string;
}

export interface QiroahClassMaqro {
  kelas: string;
  maqro: string[];
}

export interface TaftisyRow {
  mata_pelajaran: string;
  kitab: string;
  batasan: string;
  keterangan?: string;
}

export interface UjianTulisRow {
  mata_pelajaran: string;
  kitab: string;
  batasan: string;
  keterangan?: string;
}

export interface KalenderRow {
  tanggal: string;
  kegiatan: string;
}

export interface TahunAjaranItem {
  id: number;
  kode: string;
  nama?: string;
  is_active: boolean;
  [key: string]: any;
}

export interface KategoriItem {
  id: number;
  nama: string;
  kode?: string;
  [key: string]: any;
}

export interface ClassItem {
  id: number;
  nama: string;
  jenis?: string;
  tingkat?: number;
  [key: string]: any;
}

export type InformasiUjianTabKey = 
  | 'ketentuan-muhafadzoh'
  | 'maqro-qiroah'
  | 'taftisyul-kutub'
  | 'materi-ujian-tulis'
  | 'kalender-akademik';

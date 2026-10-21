// =============================================================================
// JADWAL PELAJARAN HARIAN TYPE DEFINITIONS
// Refers to backend contract in src/routes/jadwalPelajaranRoutes.js
// =============================================================================

export interface JadwalItem {
  id?: number;
  kelas_id: number;
  kelas_nama?: string;
  tahun_ajaran_id: number;
  malam: string;
  jam_ke: number;
  mata_pelajaran_id?: number | null;
  mata_pelajaran_nama?: string | null;
  mapel_id?: number | null;
  mapel_nama?: string | null;
  guru_id: number | null;
  guru_nama?: string | null;
  guru_panggilan?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TahunAjaranItem {
  id: number;
  kode: string;
  nama?: string;
  tahun_mulai?: number;
  tahun_selesai?: number;
  is_active: boolean;
}

export interface KelasItem {
  id: number;
  nama: string;
  jenis?: string;
  tingkat?: number;
  [key: string]: any;
}

export interface GuruItem {
  id: number;
  nama: string;
  no_hp?: string | null;
  panggilan?: string | null;
  [key: string]: any;
}

export interface MapelItem {
  id: number;
  nama: string;
  [key: string]: any;
}

export interface EditingSlotState {
  kelas_id: number;
  malam: string;
  jam_ke: number;
  kelasNama?: string;
}

export interface ClashWarningState {
  message: string;
  description: string;
}

export interface ClearConfirmState {
  isOpen: boolean;
  kelasId: number | null;
  malam: string;
  jamKe: number | null;
  kelasNama: string;
}

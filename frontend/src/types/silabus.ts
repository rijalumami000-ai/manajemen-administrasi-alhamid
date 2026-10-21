// =============================================================================
// SILABUS PEMBELAJARAN DINIYAH TYPE DEFINITIONS
// Contract matches backend src/routes/nilaiRoutes.js (/nilai/silabus)
// =============================================================================

export interface SilabusItem {
  id?: string | number;
  bulan: string;
  pelajaran: string;
  pengajar: 'Mustahiq' | 'Munawib' | string;
  ketentuan?: string;
  target_materi?: string;
  target_pencapaian?: string;
  target_muhafadzoh?: string;
  [key: string]: any;
}

export interface TahunAjaranItem {
  id: number;
  kode: string;
  nama?: string;
  is_active: boolean;
  [key: string]: any;
}

export interface DeleteConfirmState {
  isOpen: boolean;
  rowIndex: number | null;
}

export interface SaveSilabusPayload {
  tahun_ajaran_id: number;
  semester: string;
  tingkat: number;
  data: SilabusItem[];
}

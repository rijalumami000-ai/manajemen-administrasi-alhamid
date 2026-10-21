// =============================================================================
// ROMADHON — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Translucent Acrylic Skeuomorphism
// =============================================================================

export interface KajianBalaghItem {
  id: number;
  tahun_ajaran_id: number;
  kelas: string;
  waktu: string;
  qori: string;
  kitab: string;
  tempat?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ImamTarawihItem {
  id: number;
  tahun_ajaran_id: number;
  malam: number | string;
  imam: string;
  bilal?: string | null;
  tempat?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface KajianFormState {
  kelas: string;
  waktu: string;
  qori: string;
  kitab: string;
  tempat: string;
}

export interface TarawihFormState {
  malam: string | number;
  imam: string;
  bilal: string;
  tempat: string;
}

export interface TahunAjaranRomadhon {
  id: number;
  kode: string;
  is_active: boolean | number;
  nama?: string;
}

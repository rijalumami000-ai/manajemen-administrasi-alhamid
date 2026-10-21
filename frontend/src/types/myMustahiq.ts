// =============================================================================
// MYMUSTAHIQ / ALHAMID ONE SETTINGS — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Liquid Glass
// =============================================================================

export interface GuruMustahiqItem {
  id: number;
  nama: string;
  nip?: string | null;
  no_hp?: string | null;
  status?: string | null;
  mymustahiq_username?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface SuggestionItem {
  id: number;
  guru_id?: number | null;
  nama_guru?: string | null;
  pesan: string;
  kategori?: string | null;
  rating?: number | null;
  created_at: string;
  [key: string]: unknown;
}

export interface CredentialsFormData {
  username: string;
  password?: string;
}

export interface PushNotificationFormData {
  title: string;
  body: string;
  category: string;
  target: string;
}

export interface SuggestionDeleteConfirmState {
  isOpen: boolean;
  suggestionId: number | null;
  namaGuru?: string | null;
}

export interface MyMustahiqStats {
  totalGurus: number;
  hasAccess: number;
  noAccess: number;
  totalSuggestions: number;
}

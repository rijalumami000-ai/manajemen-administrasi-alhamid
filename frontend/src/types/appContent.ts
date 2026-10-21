// =============================================================================
// APP CONTENT / PUSAT BANTUAN & INFO APP — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Liquid Glass
// =============================================================================

export type AppContentSection = 'pusat_bantuan' | 'tentang' | 'pengembang';

export interface AppContentItem {
  id: number;
  section: AppContentSection | string;
  category?: string | null;
  title: string;
  content: string;
  icon?: string | null;
  order_index?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface AppContentFormData {
  section: string;
  category: string;
  title: string;
  content: string;
  icon: string;
  order_index: number;
  is_active: boolean;
}

export interface AppContentDeleteConfirmState {
  isOpen: boolean;
  item: AppContentItem | null;
}

export interface AppContentStats {
  total: number;
  pusatBantuan: number;
  tentang: number;
  pengembang: number;
}

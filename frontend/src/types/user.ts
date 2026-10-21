// =============================================================================
// USER MANAGEMENT — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Liquid Glass
// =============================================================================

export type UserRole = 'admin' | 'madrasah_diniyah' | 'bendahara' | 'guru' | 'wali_santri' | string;

export interface UserItem {
  id: number;
  username: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  last_login?: string | null;
  [key: string]: unknown;
}

export interface UserFormData {
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: string;
  password?: string;
}

export interface UserDeleteConfirmState {
  isOpen: boolean;
  type: 'deactivate' | 'delete' | null;
  user: UserItem | null;
}

export interface UserStats {
  total: number;
  admin: number;
  madrasahDiniyah: number;
  bendahara: number;
  active: number;
}

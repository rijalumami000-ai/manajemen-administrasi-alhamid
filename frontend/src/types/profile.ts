// =============================================================================
// USER PROFILE & SYSTEM SETTINGS — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Liquid Glass
// =============================================================================

export interface UserProfile {
  id: number;
  username: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  photo_url?: string | null;
  created_at?: string;
  last_login?: string | null;
  [key: string]: unknown;
}

export interface EditProfileFormData {
  full_name: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface SystemSettingsData {
  app_name: string;
  active_semester: string;
  app_logo?: string | null;
}

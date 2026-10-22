export type LoginRole = 'admin' | 'madrasah_diniyah' | 'bendahara';

export interface LoginRoleOption {
  label: string;
  value: LoginRole;
  description?: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: any;
}

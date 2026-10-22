import { Request } from 'express';

export interface UserPayload {
  id: number;
  username: string;
  email?: string | null;
  full_name?: string | null;
  role: 'admin' | 'madrasah_diniyah' | 'bendahara' | string;
  is_active?: boolean | number;
  guru_id?: number | null;
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      token?: string;
    }
  }
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  details?: any;
  message?: string;
}

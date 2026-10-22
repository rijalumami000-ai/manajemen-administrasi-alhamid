import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  id?: number | string;
  username: string;
  role: 'admin' | 'madrasah_diniyah' | 'bendahara' | string;
  name?: string;
  nama?: string;
  avatar?: string;
  email?: string;
  [key: string]: any;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string, role?: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  loading: boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isDiniyah: () => boolean;
  isBendahara: () => boolean;
  updateUser: (updates: Partial<AuthUser>) => void;
  verifyPassword: (password: string) => Promise<AuthResponse>;
  magicLogin: (key: string) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check failed', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Listen for unauthorized events from apiClient (token expired/invalid)
    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('token');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (username: string, password: string, role?: string): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.accessToken);
        setUser(data.user);
        return { success: true };
      }

      const error = await response.json();
      return { success: false, error: error.error || error.message || 'Login failed' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const magicLogin = async (key: string): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/magic-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.accessToken);
        setUser(data.user);
        return { success: true };
      }

      const error = await response.json();
      return { success: false, error: error.error || error.message || 'Magic login failed' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const verifyPassword = async (password: string): Promise<AuthResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Sesi tidak valid' };

      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        return { success: true };
      }

      const error = await response.json();
      return { success: false, error: error.error || error.message || 'Password salah' };
    } catch {
      return { success: false, error: 'Kesalahan jaringan' };
    }
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isDiniyah = (): boolean => {
    return user?.role === 'madrasah_diniyah';
  };

  const isBendahara = (): boolean => {
    return user?.role === 'bendahara';
  };

  const isStaff = (): boolean => {
    return user?.role === 'bendahara';
  };

  const updateUser = (updates: Partial<AuthUser>): void => {
    setUser(prev => (prev ? { ...prev, ...updates } : null));
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAdmin,
    isStaff,
    isDiniyah,
    isBendahara,
    updateUser,
    verifyPassword,
    magicLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthProvider;

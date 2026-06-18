import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const checkAuth = async () => {
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

  const login = async (username, password, role) => {
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
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const magicLogin = async (key) => {
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
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
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

  const verifyPassword = async (password) => {
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
    } catch (error) {
      return { success: false, error: 'Kesalahan jaringan' };
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isDiniyah = () => {
    return user?.role === 'madrasah_diniyah';
  };

  const isBendahara = () => {
    return user?.role === 'bendahara';
  };

  const isStaff = () => {
    return user?.role === 'bendahara';
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const value = {
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

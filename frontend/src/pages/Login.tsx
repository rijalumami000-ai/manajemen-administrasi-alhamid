import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, Sun, Moon, School, BookOpen, Wallet, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LoadingState } from '../components/common/LoadingState';
import { SmartAlert } from '../components/ui/SmartAlert';
import { settingsService } from '../services/settingsService';
import { LoginRole } from '../types/login';
import './Login.scss';

export const Login: React.FC = () => {
  const { user, login, loading } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [role, setRole] = useState<LoginRole>('admin');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dynamic branding from settings
  const [appName, setAppName] = useState<string>('Alhamid Cintamulya');
  const [appLogo, setAppLogo] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.fetchSettings();
        if (settings?.app_name) setAppName(settings.app_name);
        if (settings?.app_logo) setAppLogo(settings.app_logo);
      } catch (err) {
        console.error('Failed to load settings in Login:', err);
      }
    };
    loadSettings();
  }, []);

  if (loading) {
    return <LoadingState message="Memuat sistem..." />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!username || !username.trim()) {
      setError('Username wajib diisi!');
      return;
    }
    if (!password) {
      setError('Kata sandi wajib diisi!');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await login(username.trim(), password, role);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Login gagal. Periksa kembali username dan kata sandi Anda.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="login-page-root">
      {/* Dynamic Background Aurora Mesh Wallpaper (Apple Option A) */}
      <div className="aurora-mesh-canvas">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="ambient-orb orb-3"></div>
      </div>

      {/* Floating Tactile Theme Switcher */}
      <div className="login-theme-bar">
        <button
          type="button"
          className="theme-pill-btn"
          onClick={toggleTheme}
          title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
        </button>
      </div>

      {/* VisionOS Liquid Glass Card Container */}
      <div className="login-glass-card">
        {/* Left Side: Hero Overview */}
        <div className="login-hero-pane">
          <div className="brand-lens-orb">
            {appLogo ? (
              <img src={appLogo} alt="Logo" className="brand-logo-img" />
            ) : (
              <span className="brand-initials">SI</span>
            )}
          </div>

          <div className="hero-content">
            <span className="hero-badge">SISTEM INFORMASI PESANTREN</span>
            <h1 className="hero-app-title">{appName}</h1>
            <p className="hero-app-desc">
              Sistem Terpadu Manajemen Akademik Madrasah Diniyah, Kesiswaan Kepesantrenan, dan Administrasi Keuangan.
            </p>

            {/* Feature Pills Dock */}
            <div className="hero-pills-dock">
              <div className="feature-dock-item">
                <BookOpen size={13} className="feature-icon" />
                <span>Akademik Diniyah</span>
              </div>
              <div className="feature-dock-item">
                <School size={13} className="feature-icon" />
                <span>Kepesantrenan</span>
              </div>
              <div className="feature-dock-item">
                <Wallet size={13} className="feature-icon" />
                <span>Keuangan</span>
              </div>
            </div>
          </div>

          <div className="system-health-pill">
            <span className="health-dot"></span>
            <span className="health-text">Sistem Operasional & Aman</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="login-form-pane">
          <div className="form-inner-wrapper">
            <div className="form-header-area">
              <h2 className="form-heading">Selamat Datang</h2>
              <p className="form-subheading">
                Silakan pilih peran dan masukkan kredensial akun Anda.
              </p>
            </div>

            {error && (
              <div className="error-alert-wrap">
                <SmartAlert message={error} type="error" />
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form-body">
              {/* Role Selection Tabs */}
              <div className="input-group-item">
                <label className="input-field-label">
                  <ShieldCheck size={13} />
                  <span>Masuk Sebagai</span>
                </label>
                <div className="role-segmented-control">
                  <button
                    type="button"
                    className={`role-seg-btn ${role === 'admin' ? 'active' : ''}`}
                    onClick={() => setRole('admin')}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    className={`role-seg-btn ${role === 'madrasah_diniyah' ? 'active' : ''}`}
                    onClick={() => setRole('madrasah_diniyah')}
                  >
                    Madrasah Diniyah
                  </button>
                  <button
                    type="button"
                    className={`role-seg-btn ${role === 'bendahara' ? 'active' : ''}`}
                    onClick={() => setRole('bendahara')}
                  >
                    Bendahara
                  </button>
                </div>
              </div>

              {/* Username Input */}
              <div className="input-group-item">
                <label className="input-field-label">Username</label>
                <div className="glass-input-wrapper">
                  <User size={16} className="input-lead-icon" />
                  <input
                    type="text"
                    className="glass-input-field"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isSubmitting}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="input-group-item">
                <label className="input-field-label">Kata Sandi</label>
                <div className="glass-input-wrapper">
                  <Lock size={16} className="input-lead-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="glass-input-field"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    title={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Primary Action Pill Submit Button */}
              <button
                type="submit"
                className="action-pill-btn primary-pill submit-login-btn"
                disabled={isSubmitting}
              >
                <LogIn size={16} />
                <span>{isSubmitting ? 'Memverifikasi Kredensial...' : 'Masuk ke Sistem'}</span>
              </button>
            </form>

            <div className="form-footer-copyright">
              <span>&copy; {new Date().getFullYear()} {appName}. Hak Cipta Dilindungi.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

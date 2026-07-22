import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/common/LoadingState';
import { FloatingInput } from '../components/ui/FloatingInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SmartAlert } from '../components/ui/SmartAlert';
import './Login.scss';

export function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return <LoadingState message="Memuat..." />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!username || !username.trim()) {
      setError('Username wajib diisi!');
      return;
    }
    if (!password) {
      setError('Password wajib diisi!');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await login(username.trim(), password, role);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Login gagal. Periksa username dan password Anda.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="login-container">
      {/* Background effects */}
      <div className="gradient-bg">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
        <div className="glow-3"></div>
      </div>

      <div className="login-split-wrapper">
        {/* Left Side: Hero */}
        <div className="login-left">
          <div className="brand-logo-large">SI</div>
          <div className="hero-text">
            <h1 className="hero-title">Sign in to</h1>
            <h2 className="hero-subtitle">Alhamid Cintamulya</h2>
            <p className="hero-description">
              Sistem Informasi Manajemen Madrasah & Pondok Pesantren yang modern, cepat, dan terintegrasi.
            </p>
          </div>
          <div className="live-status">
            <span className="pulse-dot"></span>
            <span className="live-text">System Operational</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="login-right">
          <div className="form-container">
            <div className="login-header-right">
              <h2 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '24px' }}>Sign in</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '14px' }}>
                Selamat datang kembali! Silakan masukkan detail login Anda.
              </p>
            </div>

            {error && (
              <div style={{ marginBottom: '20px' }}>
                <SmartAlert message={error} type="error" />
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <CustomSelect
                label="Login Sebagai"
                value={role}
                onChange={setRole}
                options={[
                  { label: 'Admin', value: 'admin' },
                  { label: 'Madrasah Diniyah', value: 'madrasah_diniyah' },
                  { label: 'Bendahara', value: 'bendahara' }
                ]}
                disabled={isSubmitting}
              />

              <FloatingInput
                label="Username"
                name="username"
                icon={User}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isSubmitting}
              />

              <FloatingInput
                label="Password"
                name="password"
                type="password"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />

              <button
                type="submit"
                className="btn-custom btn-primary glow-btn"
                disabled={isSubmitting}
                style={{ width: '100%', height: '46px', fontSize: '15px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <LogIn size={18} /> {isSubmitting ? 'Memproses...' : 'Login Ke Sistem'}
              </button>
            </form>

            <div className="login-footer-right" style={{ marginTop: '24px', textAlign: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                &copy; 2026 Alhamid Cintamulya
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

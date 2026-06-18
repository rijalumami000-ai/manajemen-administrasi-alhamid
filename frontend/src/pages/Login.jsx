import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Alert, Select } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/common';
import './Login.scss';
import { settingsService } from '../services/settingsService';

const { Title, Text } = Typography;

export function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return <LoadingState fullscreen tip="Memuat..." />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values) => {
    setError('');
    setIsSubmitting(true);

    const result = await login(values.username, values.password, values.role);

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
              <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>Sign in</Title>
              <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Welcome back! Please enter your details.</Text>
            </div>

            {error && (
              <Alert
                message="Login Gagal"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError('')}
                style={{ marginBottom: 24 }}
              />
            )}

            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
              autoComplete="off"
            >
              <Form.Item
                name="role"
                rules={[{ required: true, message: 'Silakan pilih role Anda!' }]}
              >
                <select
                  className="login-select"
                  disabled={isSubmitting}
                >
                  <option value="" disabled hidden>Mau login sebagai apa?</option>
                  <option value="admin">Admin</option>
                  <option value="madrasah_diniyah">Madrasah Diniyah</option>
                  <option value="bendahara">Bendahara</option>
                </select>
              </Form.Item>

              <Form.Item
                name="username"
                rules={[
                  { required: true, message: 'Username harus diisi!' },
                  { min: 3, message: 'Username minimal 3 karakter!' }
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.4)' }} />}
                  placeholder="Username"
                  autoFocus
                  disabled={isSubmitting}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Password harus diisi!' },
                  { min: 4, message: 'Password minimal 4 karakter!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.4)' }} />}
                  placeholder="Password"
                  disabled={isSubmitting}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LoginOutlined />}
                  loading={isSubmitting}
                  block
                  size="large"
                  className="glow-btn"
                >
                  {isSubmitting ? 'Memproses...' : 'Login'}
                </Button>
              </Form.Item>
            </Form>

            <div className="login-footer-right">
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                &copy; 2026 Alhamid Cintamulya
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

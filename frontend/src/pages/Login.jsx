import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/common';
import './Login.scss';

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

    const result = await login(values.username, values.password);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Login gagal. Periksa username dan password Anda.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <Card className="login-card" bordered={false}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div className="login-header">
              <div className="brand-logo">SI</div>
              <Title level={2} style={{ marginBottom: 8 }}>
                SI Internal Pesantren
              </Title>
              <Text type="secondary">Sistem Informasi Internal</Text>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert
                message="Login Gagal"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError('')}
              />
            )}

            {/* Login Form */}
            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
              autoComplete="off"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: 'Username harus diisi!' },
                  { min: 3, message: 'Username minimal 3 karakter!' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
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
                  prefix={<LockOutlined />}
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
                >
                  {isSubmitting ? 'Memproses...' : 'Login'}
                </Button>
              </Form.Item>
            </Form>

            {/* Footer */}
            <div className="login-footer">
              <Text type="secondary" style={{ fontSize: 12 }}>
                &copy; 2026 SI Internal Pesantren
              </Text>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
}

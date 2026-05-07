import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert } from 'antd';
import { LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import './PasswordConfirmModal.scss';

export function PasswordConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Konfirmasi Keamanan", 
  message = "Silakan masukkan password Anda untuk melanjutkan tindakan ini.",
  actionType = "confirm" // 'rollback' | 'migration' | 'confirm'
}) {
  const [form] = Form.useForm();
  const { verifyPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = () => {
    form.resetFields();
    setError('');
    onClose();
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');

    try {
      const result = await verifyPassword(values.password);
      
      if (result.success) {
        form.resetFields();
        // Memanggil fungsi konfirmasi yang diteruskan dari parent
        onConfirm();
      } else {
        setError(result.error || 'Password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  const getThemeColor = () => {
    if (actionType === 'rollback') return '#cf1322'; // Red
    if (actionType === 'migration') return '#096dd9'; // Blue
    return '#faad14'; // Warning yellow
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SafetyOutlined style={{ color: getThemeColor(), fontSize: '24px' }} />
          <span>{title}</span>
        </div>
      }
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      className="password-confirm-modal"
    >
      <div className="password-confirm-content">
        <p className="confirmation-message">{message}</p>
        
        {error && (
          <Alert 
            message={error} 
            type="error" 
            showIcon 
            style={{ marginBottom: 16 }} 
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Password tidak boleh kosong!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined className="site-form-item-icon" />} 
              placeholder="Masukkan password Anda" 
              size="large"
              autoFocus
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24, textAlign: 'right' }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              Batal
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              danger={actionType === 'rollback'}
            >
              Konfirmasi & Lanjutkan
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}

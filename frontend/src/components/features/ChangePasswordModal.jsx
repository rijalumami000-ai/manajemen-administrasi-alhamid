import { useEffect } from 'react';
import { Modal, Form, Input, Alert, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const { Text } = Typography;

export function ChangePasswordModal({ isOpen, onClose, onSubmit, isSubmitting, error }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
    }
  }, [isOpen, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
    } catch (err) {
      console.error('Validation failed:', err);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Ubah Password"
      open={isOpen}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isSubmitting}
      okText={isSubmitting ? 'Mengubah...' : 'Ubah Password'}
      cancelText="Batal"
      width={500}
      destroyOnClose
    >
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          label="Password Lama"
          name="currentPassword"
          rules={[
            { required: true, message: 'Password lama wajib diisi!' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Masukkan password lama"
            disabled={isSubmitting}
          />
        </Form.Item>

        <Form.Item
          label="Password Baru"
          name="newPassword"
          rules={[
            { required: true, message: 'Password baru wajib diisi!' },
            { min: 8, message: 'Password minimal 8 karakter!' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Masukkan password baru"
            disabled={isSubmitting}
          />
        </Form.Item>

        <Form.Item
          label="Konfirmasi Password Baru"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Konfirmasi password wajib diisi!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Password baru dan konfirmasi tidak cocok!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Konfirmasi password baru"
            disabled={isSubmitting}
          />
        </Form.Item>

        <Alert
          message="Password minimal 8 karakter"
          type="info"
          showIcon
          style={{ marginTop: 8 }}
        />
      </Form>
    </Modal>
  );
}

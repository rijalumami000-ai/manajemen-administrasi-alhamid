import { useEffect } from 'react';
import { Modal, Form, Input, Select, Alert } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';

const { Option } = Select;

export function UserModal({ isOpen, onClose, onSubmit, editData, isSubmitting, error }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        form.setFieldsValue({
          username: editData.username || '',
          full_name: editData.full_name || '',
          email: editData.email || '',
          phone: editData.phone || '',
          role: editData.role || '',
          password: ''
        });
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, editData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const submitData = { ...values };
      if (editData && !submitData.password) {
        delete submitData.password;
      }
      
      onSubmit(submitData);
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
      title={editData ? 'Edit User' : 'Tambah User Baru'}
      open={isOpen}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isSubmitting}
      okText={isSubmitting ? 'Menyimpan...' : 'Simpan'}
      cancelText="Batal"
      width={600}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: 'Username wajib diisi!' },
              { min: 3, message: 'Username minimal 3 karakter!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Masukkan username"
              disabled={!!editData || isSubmitting}
            />
          </Form.Item>

          <Form.Item
            label="Nama Lengkap"
            name="full_name"
            rules={[
              { required: true, message: 'Nama lengkap wajib diisi!' }
            ]}
          >
            <Input
              placeholder="Masukkan nama lengkap"
              disabled={isSubmitting}
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { type: 'email', message: 'Format email tidak valid!' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Masukkan email"
              disabled={isSubmitting}
            />
          </Form.Item>

          <Form.Item
            label="No. HP"
            name="phone"
            rules={[
              { pattern: /^[0-9+\-\s()]*$/, message: 'Format nomor HP tidak valid!' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Masukkan nomor HP"
              disabled={isSubmitting}
            />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            rules={[
              { required: true, message: 'Role wajib dipilih!' }
            ]}
          >
            <Select placeholder="-- Pilih Role --" disabled={isSubmitting}>
              <Option value="admin">Administrator</Option>
              <Option value="guru">Guru</Option>
              <Option value="staff">Staff</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: !editData, message: 'Password wajib diisi untuk user baru!' },
              { min: 8, message: 'Password minimal 8 karakter!' }
            ]}
            extra={editData ? 'Kosongkan jika tidak ingin mengubah password' : ''}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Masukkan password"
              disabled={isSubmitting}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

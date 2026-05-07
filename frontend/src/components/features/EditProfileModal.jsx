import { useEffect } from 'react';
import { Modal, Form, Input, Alert } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';

export function EditProfileModal({ isOpen, onClose, onSubmit, profileData, isSubmitting, error }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen && profileData) {
      form.setFieldsValue({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        phone: profileData.phone || ''
      });
    }
  }, [isOpen, profileData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
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
      title="Edit Profile"
      open={isOpen}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isSubmitting}
      okText={isSubmitting ? 'Menyimpan...' : 'Simpan'}
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
          label="Nama Lengkap"
          name="full_name"
          rules={[
            { required: true, message: 'Nama lengkap wajib diisi!' },
            { min: 3, message: 'Nama minimal 3 karakter!' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
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
      </Form>
    </Modal>
  );
}

import { useEffect } from 'react';
import { Modal, Form, Input, Alert } from 'antd';

export function MasterModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  title,
  placeholder,
  isSubmitting = false,
  error = null,
  type = 'master'
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        form.setFieldsValue({ 
          nama: editData.nama || '',
          nama_arab: editData.nama_arab || ''
        });
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, editData, form]);

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
      title={editData ? `Edit ${title}` : `Tambah ${title}`}
      open={isOpen}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isSubmitting}
      okText={isSubmitting ? 'Menyimpan...' : (editData ? 'Perbarui' : 'Simpan')}
      cancelText="Batal"
      width={400}
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
          label={`Nama ${title}`}
          name="nama"
          rules={[
            { required: true, message: `Nama ${title.toLowerCase()} wajib diisi!` }
          ]}
        >
          <Input 
            placeholder={placeholder} 
            disabled={isSubmitting} 
            autoFocus
          />
        </Form.Item>

        {type === 'mapel' && (
          <Form.Item
            label="Nama Arab (Khusus Mapel Rapor)"
            name="nama_arab"
            rules={[]}
          >
            <Input 
              placeholder="Contoh: العمريطي" 
              disabled={isSubmitting} 
              dir="rtl"
              style={{ fontFamily: 'Amiri, serif', fontSize: '1.2rem' }}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

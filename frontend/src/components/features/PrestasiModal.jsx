import { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Alert } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { SantriAutocomplete } from './SantriAutocomplete';
import './PrestasiModal.scss';

const { TextArea } = Input;

export function PrestasiModal({ isOpen, onClose, onSubmit, editData, isSubmitting, error }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen && editData) {
      const tanggal = editData.tanggal ? dayjs(editData.tanggal) : null;

      form.setFieldsValue({
        santri_id: editData.santri_id || '',
        jenis: editData.jenis || '',
        tanggal: tanggal,
        deskripsi: editData.deskripsi || '',
        penghargaan: editData.penghargaan || ''
      });
    } else if (isOpen) {
      form.resetFields();
    }
  }, [isOpen, editData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const submitData = {
        ...values,
        tanggal: values.tanggal ? values.tanggal.format('YYYY-MM-DD') : null
      };

      onSubmit(submitData);
    } catch (err) {
      console.error('Validasi gagal:', err);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      title={
        <span>
          <TrophyOutlined style={{ color: '#ff9800' }} /> {editData ? 'Edit Prestasi' : 'Tambah Prestasi'}
        </span>
      }
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      width={600}
      okText={editData ? 'Perbarui' : 'Simpan'}
      cancelText="Batal"
      className="prestasi-modal"
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
        disabled={isSubmitting}
      >
        <Form.Item
          name="santri_id"
          label="Santri"
          rules={[{ required: true, message: 'Santri wajib dipilih' }]}
        >
          <SantriAutocomplete
            value={form.getFieldValue('santri_id')}
            onChange={(value) => form.setFieldsValue({ santri_id: value })}
            error={form.getFieldError('santri_id')[0]}
          />
        </Form.Item>

        <Form.Item
          name="jenis"
          label="Jenis Prestasi"
          rules={[{ required: true, message: 'Jenis prestasi wajib diisi' }]}
        >
          <Input
            prefix={<TrophyOutlined />}
            placeholder="Contoh: Juara Lomba, Hafalan Terbaik"
          />
        </Form.Item>

        <Form.Item
          name="tanggal"
          label="Tanggal"
          rules={[{ required: true, message: 'Tanggal wajib diisi' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Pilih tanggal"
          />
        </Form.Item>

        <Form.Item name="deskripsi" label="Deskripsi">
          <TextArea rows={3} placeholder="Detail prestasi..." />
        </Form.Item>

        <Form.Item name="penghargaan" label="Penghargaan">
          <TextArea rows={3} placeholder="Penghargaan yang diterima..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

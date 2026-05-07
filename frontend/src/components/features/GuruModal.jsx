import { useEffect } from 'react';
import { Modal, Form, Input, Select, Alert, Row, Col } from 'antd';
import { UserOutlined, IdcardOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';
import './GuruModal.scss';

const { Option } = Select;
const { TextArea } = Input;

export function GuruModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  mataPelajaranList = [],
  jabatanList = [],
  isSubmitting = false,
  error = null
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        form.setFieldsValue({
          ...editData,
          mata_pelajaran_id: editData.mata_pelajaran_id || undefined,
          jabatan_id: editData.jabatan_id || undefined
        });
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, editData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const submitData = {
        ...values,
        mata_pelajaran_id: values.mata_pelajaran_id || null,
        jabatan_id: values.jabatan_id || null
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
      title={editData ? 'Edit Guru' : 'Tambah Guru'}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      width={700}
      okText={editData ? 'Perbarui' : 'Simpan'}
      cancelText="Batal"
      className="guru-modal"
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

      <Alert
        message="Catatan"
        description="Jika mata pelajaran atau jabatan belum tersedia, tambahkan dulu lewat tab di atas."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
        disabled={isSubmitting}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="nip"
              label="NIP (Opsional)"
            >
              <Input prefix={<IdcardOutlined />} placeholder="Masukkan NIP" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="nama"
              label="Nama"
              rules={[{ required: true, message: 'Nama wajib diisi' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Masukkan nama lengkap" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="mata_pelajaran_id"
              label="Mata Pelajaran"
              rules={[{ required: true, message: 'Mata pelajaran wajib dipilih' }]}
            >
              <Select placeholder="Pilih mata pelajaran">
                {mataPelajaranList.map(mapel => (
                  <Option key={mapel.id} value={mapel.id}>
                    {mapel.nama}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="jabatan_id"
              label="Jabatan"
              rules={[{ required: true, message: 'Jabatan wajib dipilih' }]}
            >
              <Select placeholder="Pilih jabatan">
                {jabatanList.map(jabatan => (
                  <Option key={jabatan.id} value={jabatan.id}>
                    {jabatan.nama}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="no_hp"
              label="No. HP"
              rules={[{ required: true, message: 'No. HP wajib diisi' }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="Masukkan no. HP" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Status wajib dipilih' }]}
            >
              <Select placeholder="Pilih status">
                <Option value="Aktif">Aktif</Option>
                <Option value="Cuti">Cuti</Option>
                <Option value="Pensiun">Pensiun</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="alamat"
          label="Alamat"
          rules={[{ required: true, message: 'Alamat wajib diisi' }]}
        >
          <TextArea
            rows={3}
            prefix={<HomeOutlined />}
            placeholder="Masukkan alamat lengkap"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

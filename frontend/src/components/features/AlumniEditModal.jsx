import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, Alert, Row, Col } from 'antd';
import { UserOutlined, IdcardOutlined, PhoneOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './AlumniEditModal.scss';

const { Option } = Select;
const { TextArea } = Input;

export function AlumniEditModal({ isOpen, onClose, onSubmit, editData, isSubmitting, error }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen && editData) {
      // Parse tanggal lahir
      const tanggalLahir = editData.tanggal_lahir
        ? dayjs(editData.tanggal_lahir)
        : null;

      form.setFieldsValue({
        ...editData,
        tanggal_lahir: tanggalLahir
      });
    } else if (isOpen) {
      form.resetFields();
    }
  }, [isOpen, editData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Format tanggal ke ISO
      const submitData = {
        ...values,
        tanggal_lahir: values.tanggal_lahir
          ? values.tanggal_lahir.format('YYYY-MM-DD')
          : null
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
      title="Edit Alumni"
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      width={900}
      okText="Simpan Perubahan"
      cancelText="Batal"
      className="alumni-edit-modal"
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
        {/* Data Identitas */}
        <div className="form-section">
          <div className="form-section-title">Data Identitas</div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="nis"
                label="NIS"
                rules={[{ required: true, message: 'NIS wajib diisi' }]}
              >
                <Input prefix={<IdcardOutlined />} placeholder="Masukkan NIS" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="nik" label="NIK">
                <Input prefix={<IdcardOutlined />} placeholder="Masukkan NIK" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="nama"
            label="Nama Lengkap"
            rules={[{ required: true, message: 'Nama wajib diisi' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Masukkan nama lengkap" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="tempat_lahir" label="Tempat Lahir">
                <Input prefix={<HomeOutlined />} placeholder="Masukkan tempat lahir" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="tanggal_lahir" label="Tanggal Lahir">
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="Pilih tanggal lahir"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="alamat" label="Alamat Asal">
            <TextArea rows={2} placeholder="Masukkan alamat asal" />
          </Form.Item>
        </div>

        {/* Data Akademik */}
        <div className="form-section">
          <div className="form-section-title">Data Akademik</div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="tahun_masuk" label="Tahun Masuk">
                <InputNumber
                  style={{ width: '100%' }}
                  min={1900}
                  max={2100}
                  placeholder="Contoh: 2015"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="tahun_lulus"
                label="Tahun Lulus"
                rules={[
                  { required: true, message: 'Tahun lulus wajib diisi' },
                  { type: 'number', min: 1900, max: 2100, message: 'Tahun tidak valid' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1900}
                  max={2100}
                  placeholder="Contoh: 2021"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="kelas_terakhir" label="Kelas Terakhir">
            <Input placeholder="Contoh: 6 Diniyah / 12 SMA" />
          </Form.Item>

          <Form.Item name="prestasi_utama" label="Prestasi Utama">
            <TextArea rows={2} placeholder="Masukkan prestasi utama (opsional)" />
          </Form.Item>
        </div>

        {/* Data Kontak */}
        <div className="form-section">
          <div className="form-section-title">Data Kontak</div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="no_hp" label="No. HP">
                <Input prefix={<PhoneOutlined />} placeholder="Masukkan no. HP" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="email" label="Email">
                <Input prefix={<MailOutlined />} type="email" placeholder="Masukkan email" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="alamat_sekarang" label="Alamat Sekarang">
            <TextArea rows={2} placeholder="Masukkan alamat sekarang" />
          </Form.Item>
        </div>

        {/* Data Pekerjaan */}
        <div className="form-section">
          <div className="form-section-title">Data Pekerjaan & Status</div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="pekerjaan" label="Pekerjaan">
                <Input placeholder="Masukkan pekerjaan" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="instansi" label="Instansi/Perusahaan">
                <Input placeholder="Masukkan instansi/perusahaan" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="status_pernikahan" label="Status Pernikahan">
            <Select placeholder="Pilih status pernikahan" allowClear>
              <Option value="Jomblo">Jomblo</Option>
              <Option value="Sudah Menikah">Sudah Menikah</Option>
            </Select>
          </Form.Item>

          <Form.Item name="keterangan" label="Keterangan">
            <TextArea rows={2} placeholder="Masukkan keterangan tambahan (opsional)" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

import { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Alert, Row, Col } from 'antd';
import { UserOutlined, IdcardOutlined, HomeOutlined, PhoneOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import './SantriModal.scss';

dayjs.extend(customParseFormat);

const { Option } = Select;

export function SantriModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  kelasList = [],
  kamarList = [],
  isSubmitting = false,
  error = null
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        // Parse date for edit mode
        const tanggalLahir = editData.tanggal_lahir
          ? dayjs(editData.tanggal_lahir, ['YYYY-MM-DD', 'DD/MM/YYYY'])
          : null;

        form.setFieldsValue({
          ...editData,
          tanggal_lahir: tanggalLahir,
          kelas_diniyah_id: editData.kelas_diniyah_id || undefined,
          kelas_sekolah_id: editData.kelas_sekolah_id || undefined,
          kamar_id: editData.kamar_id || undefined
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          status_tahun_ajaran: 'aktif'
        });
      }
    }
  }, [editData, isOpen, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Format date to ISO
      const submitData = {
        ...values,
        tanggal_lahir: values.tanggal_lahir
          ? values.tanggal_lahir.format('YYYY-MM-DD')
          : null,
        kelas_diniyah_id: values.kelas_diniyah_id || null,
        kelas_sekolah_id: values.kelas_sekolah_id || null,
        kamar_id: values.kamar_id || null
      };

      onSubmit(submitData);
    } catch (err) {
      console.error('Validation failed:', err);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const kelasDiniyah = kelasList.filter(k => k.jenis === 'Diniyah');
  const kelasSekolah = kelasList.filter(k => k.jenis === 'Sekolah');

  return (
    <Modal
      open={isOpen}
      title={editData ? 'Edit Santri' : 'Tambah Santri'}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      width={800}
      okText={editData ? 'Perbarui' : 'Simpan'}
      cancelText="Batal"
      className="santri-modal"
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
        {/* Data Santri Section */}
        <div className="form-section">
          <div className="form-section-title">Data Santri</div>

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
              <Form.Item
                name="nik"
                label="NIK"
              >
                <Input prefix={<IdcardOutlined />} placeholder="Masukkan NIK" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="nama"
                label="Nama Lengkap"
                rules={[{ required: true, message: 'Nama wajib diisi' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Masukkan nama lengkap" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="jenis_kelamin"
                label="Jenis Kelamin"
              >
                <Select placeholder="Pilih jenis kelamin">
                  <Option value="Laki-laki">Laki-laki</Option>
                  <Option value="Perempuan">Perempuan</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="tempat_lahir"
                label="Tempat Lahir"
              >
                <Input prefix={<HomeOutlined />} placeholder="Masukkan tempat lahir" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="tanggal_lahir"
                label="Tanggal Lahir"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="Pilih tanggal lahir"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="kelas_diniyah_id"
                label="Kelas Diniyah"
              >
                <Select placeholder="Pilih kelas diniyah" allowClear>
                  {kelasDiniyah.map(kelas => (
                    <Option key={kelas.id} value={kelas.id}>
                      {kelas.nama}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="kelas_sekolah_id"
                label="Kelas Sekolah"
              >
                <Select placeholder="Pilih kelas sekolah" allowClear>
                  {kelasSekolah.map(kelas => (
                    <Option key={kelas.id} value={kelas.id}>
                      {kelas.nama}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="kamar_id"
                label="Kamar Asrama"
              >
                <Select placeholder="Pilih kamar" allowClear>
                  {kamarList.map(kamar => (
                    <Option
                      key={kamar.id}
                      value={kamar.id}
                      disabled={kamar.status === 'Penuh'}
                    >
                      {kamar.nama} ({kamar.jenis}) - {kamar.terisi}/{kamar.kapasitas}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="status_tahun_ajaran"
                label="Status Tahun Ajaran"
              >
                <Select placeholder="Pilih status">
                  <Option value="aktif">Aktif</Option>
                  <Option value="draft">Draft</Option>
                  <Option value="tidak_naik">Tidak Naik</Option>
                  <Option value="lulus">Lulus</Option>
                  <Option value="alumni">Alumni</Option>
                  <Option value="pindah">Pindah</Option>
                  <Option value="keluar">Keluar</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="alamat"
            label="Alamat"
          >
            <Input.TextArea
              rows={2}
              placeholder="Masukkan alamat lengkap"
            />
          </Form.Item>

          <Form.Item
            name="catatan_tahun_ajaran"
            label="Catatan Tahun Ajaran"
          >
            <Input.TextArea
              rows={2}
              placeholder="Masukkan catatan (opsional)"
            />
          </Form.Item>
        </div>

        {/* Data Orang Tua Section */}
        <div className="form-section">
          <div className="form-section-title">Data Orang Tua</div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="nama_ayah"
                label="Nama Ayah"
              >
                <Input prefix={<UserOutlined />} placeholder="Masukkan nama ayah" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="pekerjaan_ayah"
                label="Pekerjaan Ayah"
              >
                <Input placeholder="Masukkan pekerjaan ayah" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="no_hp_ayah"
                label="No. HP Ayah"
              >
                <Input prefix={<PhoneOutlined />} placeholder="Masukkan no. HP ayah" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="nama_ibu"
                label="Nama Ibu"
              >
                <Input prefix={<UserOutlined />} placeholder="Masukkan nama ibu" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="pekerjaan_ibu"
                label="Pekerjaan Ibu"
              >
                <Input placeholder="Masukkan pekerjaan ibu" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="no_hp_ibu"
                label="No. HP Ibu"
              >
                <Input prefix={<PhoneOutlined />} placeholder="Masukkan no. HP ibu" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Modal>
  );
}

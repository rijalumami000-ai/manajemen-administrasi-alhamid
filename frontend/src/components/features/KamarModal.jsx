import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Alert, Row, Col } from 'antd';
import { HomeOutlined, TeamOutlined, ToolOutlined } from '@ant-design/icons';
import './KamarModal.scss';

const { Option } = Select;
const { TextArea } = Input;

export function KamarModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  isSubmitting = false,
  error = null
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen && editData) {
      form.setFieldsValue({
        nama: editData.nama || '',
        gedung: editData.gedung || '',
        lantai: editData.lantai || undefined,
        kapasitas: editData.kapasitas || undefined,
        terisi: editData.terisi || 0,
        jenis: editData.jenis || undefined,
        status: editData.status || 'Tersedia',
        fasilitas: editData.fasilitas || '',
        keterangan: editData.keterangan || ''
      });
    } else if (isOpen) {
      form.resetFields();
    }
  }, [isOpen, editData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
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
      title={editData ? 'Edit Kamar' : 'Tambah Kamar'}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      width={700}
      okText={editData ? 'Perbarui' : 'Simpan'}
      cancelText="Batal"
      className="kamar-modal"
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
        initialValues={{
          terisi: 0,
          status: 'Tersedia'
        }}
      >
        <div className="form-section">
          <div className="form-section-title">Informasi Kamar</div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="nama"
                label="Nama Kamar"
                rules={[{ required: true, message: 'Nama kamar wajib diisi' }]}
              >
                <Input
                  prefix={<HomeOutlined />}
                  placeholder="Contoh: A1, B2"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="jenis"
                label="Jenis"
                rules={[{ required: true, message: 'Jenis kamar wajib dipilih' }]}
              >
                <Select placeholder="Pilih jenis kamar" allowClear>
                  <Option value="Putra">Putra</Option>
                  <Option value="Putri">Putri</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="gedung" label="Gedung">
                <Input placeholder="Contoh: Gedung A" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="lantai" label="Lantai">
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  placeholder="1, 2, 3..."
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div className="form-section">
          <div className="form-section-title">Kapasitas & Status</div>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="kapasitas"
                label="Kapasitas"
                rules={[
                  { required: true, message: 'Kapasitas wajib diisi' },
                  { type: 'number', min: 1, message: 'Minimal 1' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  prefix={<TeamOutlined />}
                  placeholder="Jumlah tempat"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="terisi"
                label="Terisi"
                rules={[
                  { type: 'number', min: 0, message: 'Minimal 0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Jumlah santri"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item name="status" label="Status">
                <Select placeholder="Pilih status">
                  <Option value="Tersedia">Tersedia</Option>
                  <Option value="Penuh">Penuh</Option>
                  <Option value="Maintenance">Maintenance</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div className="form-section">
          <div className="form-section-title">Detail Tambahan</div>

          <Form.Item name="fasilitas" label={<><ToolOutlined /> Fasilitas</>}>
            <Input placeholder="Contoh: AC, Lemari, Kasur" />
          </Form.Item>

          <Form.Item name="keterangan" label="Keterangan">
            <TextArea rows={2} placeholder="Catatan tambahan (opsional)" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

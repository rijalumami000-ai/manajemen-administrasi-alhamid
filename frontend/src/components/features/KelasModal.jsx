import { useEffect } from 'react';
import { Modal, Form, Input, Select, Alert } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import './KelasModal.scss';

const { Option } = Select;

export function KelasModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  isSubmitting = false,
  error = null,
  guruList = [],
  mapelList = []
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen && editData) {
      form.setFieldsValue({
        jenis: editData.jenis || undefined,
        nama: editData.nama || '',
        mustahiq_id: editData.mustahiq_id || undefined,
        muhafadzoh_mapel_id: editData.muhafadzoh_mapel_id || undefined,
        qiroatul_mapel_id: editData.qiroatul_mapel_id || undefined
      });
    } else if (isOpen) {
      form.resetFields();
    }
  }, [isOpen, editData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Ensure numeric IDs are sent as numbers
      const submissionData = {
        ...values,
        mustahiq_id: values.mustahiq_id ? Number(values.mustahiq_id) : null,
        muhafadzoh_mapel_id: values.muhafadzoh_mapel_id ? Number(values.muhafadzoh_mapel_id) : null,
        qiroatul_mapel_id: values.qiroatul_mapel_id ? Number(values.qiroatul_mapel_id) : null
      };
      onSubmit(submissionData);
    } catch (err) {
      console.error('Validasi gagal:', err);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Prepare options for Selects
  const guruOptions = guruList.map(guru => ({
    value: guru.id,
    label: guru.nama
  }));

  const mapelOptions = mapelList
    .filter(m => m.jenis === 'Reguler')
    .map(mapel => ({
      value: mapel.id,
      label: mapel.nama
    }));

  return (
    <Modal
      open={isOpen}
      title={editData ? 'Edit Kelas' : 'Tambah Kelas'}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      width={500}
      okText={editData ? 'Perbarui' : 'Simpan'}
      cancelText="Batal"
      className="kelas-modal"
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
        message="Informasi"
        description="Setiap entri hanya menyimpan satu kelas. Pilih jenis lalu isi nama kelasnya."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
        disabled={isSubmitting}
        initialValues={{
          jenis: editData?.jenis,
          nama: editData?.nama,
          mustahiq_id: editData?.mustahiq_id,
          muhafadzoh_mapel_id: editData?.muhafadzoh_mapel_id,
          qiroatul_mapel_id: editData?.qiroatul_mapel_id
        }}
      >
        <Form.Item
          name="jenis"
          label="Jenis Kelas"
          rules={[{ required: true, message: 'Jenis kelas wajib dipilih' }]}
        >
          <Select placeholder="Pilih jenis kelas" allowClear>
            <Option value="Diniyah">Diniyah</Option>
            <Option value="Sekolah">Sekolah</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="nama"
          label="Nama Kelas"
          rules={[{ required: true, message: 'Nama kelas wajib diisi' }]}
        >
          <Input
            prefix={<BookOutlined />}
            placeholder="Contoh: Ula 1 atau 7A"
          />
        </Form.Item>

        <Form.Item
          name="mustahiq_id"
          label="Mustahiq / Wali Kelas"
        >
          <Select
            showSearch
            allowClear
            placeholder="Pilih Mustahiq / Wali Kelas"
            optionFilterProp="label"
            options={guruOptions}
          />
        </Form.Item>

        <Form.Item
          name="muhafadzoh_mapel_id"
          label="Kitab Muhafadzoh Kelas (Untuk Rapor)"
          tooltip="Kitab ini akan ditampilkan di baris 'Muhafadzoh' pada Rapor Santri"
        >
          <Select
            showSearch
            allowClear
            placeholder="Pilih Kitab Muhafadzoh (Misal: Imrithi)"
            optionFilterProp="label"
            options={mapelOptions}
          />
        </Form.Item>

        <Form.Item
          name="qiroatul_mapel_id"
          label="Kitab Qiroatul Kitab Kelas (Untuk Rapor)"
          tooltip="Kitab ini akan ditampilkan di baris 'Qiroatul Kitab' pada Rapor Santri"
        >
          <Select
            showSearch
            allowClear
            placeholder="Pilih Kitab Qiroah (Misal: Matan Taqrib)"
            optionFilterProp="label"
            options={mapelOptions}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

import { useState, useEffect } from 'react';
import { Card, Row, Col, Upload, message, Typography, Form, Input, Button, InputNumber } from 'antd';
import { UploadOutlined, PictureOutlined, UserOutlined, DeleteOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';
import { settingsService } from '../../services/settingsService';

const { Title, Text, Paragraph } = Typography;

export function RaporSettingsTab() {
  const [logoList, setLogoList] = useState([]);
  const [ttdList, setTtdList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [form] = Form.useForm();
  const [isSavingText, setIsSavingText] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.fetchSettings();
      if (data.rapor_kop_logo_url) {
        setLogoList([{
          uid: '-1',
          name: 'logo_kop.png',
          status: 'done',
          url: data.rapor_kop_logo_url
        }]);
      } else {
        setLogoList([]);
      }

      if (data.rapor_kepala_madrasah_ttd_url) {
        setTtdList([{
          uid: '-2',
          name: 'ttd_kepala_madrasah.png',
          status: 'done',
          url: data.rapor_kepala_madrasah_ttd_url
        }]);
      } else {
        setTtdList([]);
      }

      form.setFieldsValue({
        rapor_kop_baris_1: data.rapor_kop_baris_1 || 'مؤسسة معهد الحامد الإسلامي',
        rapor_kop_size_1: data.rapor_kop_size_1 || 24,
        rapor_kop_baris_2: data.rapor_kop_baris_2 || 'YAYASAN PONDOK PESANTREN AL-HAMID',
        rapor_kop_size_2: data.rapor_kop_size_2 || 18,
        rapor_kop_baris_3: data.rapor_kop_baris_3 || 'MADRASAH DINIYAH TAKMILIYAH AL-HAMID',
        rapor_kop_size_3: data.rapor_kop_size_3 || 20,
        rapor_kop_baris_4: data.rapor_kop_baris_4 || 'Jl. Raya Cilangkap Baru RT.07/01 Cilangkap Cipayung Jakarta Timur 13870',
        rapor_kop_size_4: data.rapor_kop_size_4 || 14,
      });

    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const customRequest = async ({ file, onSuccess, onError }, key, setList) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await settingsService.uploadAset(key, formData);
      message.success('Gambar berhasil diupload');
      setList([{
        uid: Date.now().toString(),
        name: file.name,
        status: 'done',
        url: response.url
      }]);
      onSuccess(response);
    } catch (err) {
      message.error(err.message || 'Gagal mengupload gambar');
      onError(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (key, setList) => {
    try {
      setIsUploading(true);
      await settingsService.updateSetting(key, null);
      message.success('Gambar berhasil dihapus');
      setList([]);
    } catch (err) {
      message.error(err.message || 'Gagal menghapus gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveText = async () => {
    try {
      setIsSavingText(true);
      const values = await form.validateFields();
      for (const [key, value] of Object.entries(values)) {
        await settingsService.updateSetting(key, value);
      }
      message.success('Teks kop surat berhasil disimpan');
    } catch (err) {
      message.error(err.message || 'Gagal menyimpan pengaturan teks');
    } finally {
      setIsSavingText(false);
    }
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title={<><PictureOutlined /> Logo Kop Rapor</>} bordered>
            <Paragraph>
              Upload logo pesantren/yayasan untuk ditampilkan di pojok kiri atas kop surat rapor.
              Disarankan menggunakan gambar berbentuk persegi transparan (PNG).
            </Paragraph>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <Upload
                listType="picture-card"
                fileList={logoList}
                onChange={({ fileList }) => setLogoList(fileList)}
                customRequest={(options) => customRequest(options, 'rapor_kop_logo_url', setLogoList)}
                maxCount={1}
                accept="image/*"
              >
                {logoList.length < 1 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload Logo</div>
                  </div>
                )}
              </Upload>
              {logoList.length > 0 && (
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleDelete('rapor_kop_logo_url', setLogoList)}
                  loading={isUploading}
                  style={{ marginTop: 10 }}
                >
                  Hapus Logo
                </Button>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={<><UserOutlined /> Tanda Tangan Kepala Madrasah</>} bordered>
            <Paragraph>
              Upload tanda tangan Kepala Madrasah untuk ditampilkan di bagian kanan bawah rapor.
              Disarankan menggunakan gambar transparan (PNG).
            </Paragraph>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <Upload
                listType="picture-card"
                fileList={ttdList}
                onChange={({ fileList }) => setTtdList(fileList)}
                customRequest={(options) => customRequest(options, 'rapor_kepala_madrasah_ttd_url', setTtdList)}
                maxCount={1}
                accept="image/*"
              >
                {ttdList.length < 1 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload TTD</div>
                  </div>
                )}
              </Upload>
              {ttdList.length > 0 && (
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleDelete('rapor_kepala_madrasah_ttd_url', setTtdList)}
                  loading={isUploading}
                  style={{ marginTop: 10 }}
                >
                  Hapus Tanda Tangan
                </Button>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24}>
          <Card title={<><EditOutlined /> Teks Kop Surat</>} bordered>
            <Paragraph>
              Atur teks dan ukuran font yang akan ditampilkan pada kop surat di bagian atas Rapor.
            </Paragraph>
            <Form form={form} layout="vertical" onFinish={handleSaveText}>
              <Row gutter={16}>
                <Col xs={24} md={18}>
                  <Form.Item label="Baris 1 (Arab)" name="rapor_kop_baris_1">
                    <Input placeholder="Teks baris pertama (biasanya Arab)" dir="rtl" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item label="Ukuran Font (px)" name="rapor_kop_size_1">
                    <InputNumber min={10} max={40} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={18}>
                  <Form.Item label="Baris 2 (Yayasan)" name="rapor_kop_baris_2">
                    <Input placeholder="YAYASAN PONDOK PESANTREN..." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item label="Ukuran Font (px)" name="rapor_kop_size_2">
                    <InputNumber min={10} max={40} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={18}>
                  <Form.Item label="Baris 3 (Madrasah)" name="rapor_kop_baris_3">
                    <Input placeholder="MADRASAH DINIYAH..." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item label="Ukuran Font (px)" name="rapor_kop_size_3">
                    <InputNumber min={10} max={40} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={18}>
                  <Form.Item label="Baris 4 (Alamat)" name="rapor_kop_baris_4">
                    <Input placeholder="Jl. Raya..." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item label="Ukuran Font (px)" name="rapor_kop_size_4">
                    <InputNumber min={10} max={40} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSavingText}>
                Simpan Teks Kop Surat
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

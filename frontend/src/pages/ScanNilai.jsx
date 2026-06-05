import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, Typography, Tabs, Form, Select, Button, Row, Col, 
  Upload, message, Table, InputNumber, Alert, Spin, Space, Radio
} from 'antd';
import { 
  ScanOutlined, PrinterOutlined, InboxOutlined, 
  SaveOutlined, CheckCircleOutlined, UploadOutlined 
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import './ScanNilai.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Dragger } = Upload;
const { Option } = Select;

const API_BASE = import.meta.env.VITE_API_URL || '';

// Utility function for API calls
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers 
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Terjadi kesalahan server.');
  }
  return res.json();
}

export function ScanNilai() {
  const [form] = Form.useForm();
  
  // Master data
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  
  // Selected Data for Print
  const [selectedTA, setSelectedTA] = useState(null);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [selectedMapel, setSelectedMapel] = useState(null);
  const [selectedKategori, setSelectedKategori] = useState(null);
  const [santriList, setSantriList] = useState([]);
  
  // OCR State
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [scannedData, setScannedData] = useState(null); // Metadata from QR
  const [ocrResults, setOcrResults] = useState([]);
  const [originalImageSrc, setOriginalImageSrc] = useState(null);
  const [isScanningHardware, setIsScanningHardware] = useState(false);
  
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [taData, mapelData, kelasData, katData] = await Promise.all([
        apiFetch('/api/tahun-ajaran'),
        apiFetch('/api/mata-pelajaran'),
        apiFetch('/api/kelas'),
        apiFetch('/api/nilai/kategori')
      ]);
      setTahunAjaranList(taData);
      setMapelList(mapelData);
      setKelasList(kelasData);
      setKategoriList(katData);

      const activeTA = taData.find(ta => ta.is_active);
      if (activeTA) {
        setSelectedTA(activeTA.id);
        form.setFieldsValue({ tahun_ajaran_id: activeTA.id });
      }
    } catch (err) {
      message.error('Gagal memuat data referensi: ' + err.message);
    }
  };

  const loadSantriForPrint = async () => {
    if (!selectedTA || !selectedKelas) return;
    try {
      const data = await apiFetch(`/api/nilai/santri?tahun_ajaran_id=${selectedTA}&kelas_id=${selectedKelas}`);
      setSantriList(data || []);
    } catch (err) {
      message.error('Gagal memuat data santri.');
    }
  };

  useEffect(() => {
    if (selectedKelas && selectedTA) {
      loadSantriForPrint();
    }
  }, [selectedKelas, selectedTA]);

  const handlePrint = () => {
    if (!selectedTA || !selectedKelas || !selectedMapel || !selectedKategori) {
      message.warning('Lengkapi pilihan Tahun Ajaran, Kelas, Mapel, dan Kategori Ujian sebelum mencetak.');
      return;
    }
    window.print();
  };

  // --- OCR Logic ---

  const handleHardwareScan = async () => {
    setIsScanningHardware(true);
    setIsProcessing(true);
    setOcrProgress('Menginstruksikan Scanner Epson L3250 untuk mulai menscan...');
    setOcrResults([]);
    setScannedData(null);
    
    try {
      const res = await apiFetch('/api/nilai/scanner/scan', { method: 'POST' });
      if (res.success && res.image) {
        setOriginalImageSrc(res.image);
        setOcrProgress('Gambar diterima dari scanner. Memproses OMR...');
        const img = new Image();
        img.onload = () => {
          processImage(img, res.image);
          setIsScanningHardware(false);
        };
        img.src = res.image;
      } else {
        throw new Error(res.error || 'Gagal menerima gambar dari scanner.');
      }
    } catch (err) {
      setIsProcessing(false);
      setIsScanningHardware(false);
      message.error('Gagal scan dari hardware: ' + err.message);
    }
  };

  const handleFileUpload = async (file) => {
    setIsProcessing(true);
    setOcrProgress('Membaca file gambar...');
    setOcrResults([]);
    setScannedData(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const src = e.target.result;
      setOriginalImageSrc(src);
      
      const img = new Image();
      img.onload = () => processImage(img, src);
      img.src = src;
    };
    reader.readAsDataURL(file);
    return false; // Prevent auto upload
  };

  const processImage = async (img, srcData) => {
    try {
      setIsProcessing(true);
      setOcrProgress('Menganalisa gambar dengan mesin AI Python (OpenCV)...');
      
      const payload = { image: srcData };
      const res = await apiFetch('/api/nilai/scanner/process', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (res.success) {
         const metadata = res.metadata;
         setScannedData(metadata);
         
         setOcrProgress(`Mendownload data santri (Kelas ${metadata.k || metadata.kelas_id})...`);
         const santriData = await apiFetch(`/api/nilai/santri?tahun_ajaran_id=${metadata.ta || metadata.tahun_ajaran_id}&kelas_id=${metadata.k || metadata.kelas_id}`);
         const santriToProcess = santriData.slice(0, 30);
         
         const results = [];
         // Map Python results to our React state
         for (let i = 0; i < res.results.length; i++) {
             if (i < santriToProcess.length) {
                 const santri = santriToProcess[i];
                 results.push({
                     key: santri.santri_id || santri.id,
                     santri_id: santri.santri_id || santri.id,
                     nama: santri.nama,
                     nilai_utama: res.results[i].finalScore
                 });
             }
         }
         
         setOcrResults(results);
         
         if (res.processedImage) {
           setOriginalImageSrc(res.processedImage);
         }
         
         setIsProcessing(false);
         message.success('Pemrosesan AI OMR Python Selesai!');
      } else {
         throw new Error(res.error || 'Terjadi kesalahan pada mesin AI Python.');
      }
    } catch (err) {
      setIsProcessing(false);
      message.error(err.message);
    }
  };

  const handleSaveBulk = async () => {
    if (!scannedData || ocrResults.length === 0) return;
    
    try {
      const payload = {
        tahun_ajaran_id: scannedData.tahun_ajaran_id,
        mata_pelajaran_id: scannedData.mapel_id,
        kategori_evaluasi_id: scannedData.kategori_id,
        data: ocrResults.map(r => ({
          santri_id: r.santri_id,
          nilai_angka: r.nilai_utama || 0
        }))
      };

      await apiFetch('/api/nilai/santri/bulk', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      message.success('Seluruh nilai berhasil disimpan ke database!');
      setOcrResults([]);
      setScannedData(null);
    } catch (err) {
      message.error('Gagal menyimpan nilai: ' + err.message);
    }
  };

  const columns = [
    { title: 'Nama Santri', dataIndex: 'nama', key: 'nama' },
    { 
      title: 'Hasil Baca (Utama)', 
      dataIndex: 'nilai_utama', 
      key: 'nilai_utama',
      render: (val, record, index) => (
        <InputNumber 
          value={val} 
          onChange={(newVal) => {
            const newRes = [...ocrResults];
            newRes[index].nilai_utama = newVal;
            setOcrResults(newRes);
          }} 
        />
      )
    }
  ];

  const uploadProps = {
    beforeUpload: handleFileUpload,
    showUploadList: false,
    accept: 'image/*'
  };

  return (
    <div className="scan-nilai-page">
      <div className="page-header no-print">
        <div className="page-icon"><ScanOutlined /></div>
        <div>
          <Title level={3} style={{ margin: 0 }}>Manajemen Scan Nilai (OMR)</Title>
          <Text type="secondary">Cetak lembar nilai kelas, scan tulisan tangan guru, dan simpan otomatis.</Text>
        </div>
      </div>

      <Card className="main-card no-print">
        <Tabs defaultActiveKey="1">
          <TabPane tab="1. Cetak Lembar Nilai" key="1">
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="Tahun Ajaran" name="tahun_ajaran_id" rules={[{ required: true }]}>
                    <Select onChange={setSelectedTA}>
                      {tahunAjaranList.map(ta => (
                        <Option key={ta.id} value={ta.id}>{ta.kode} {ta.is_active ? '(Aktif)' : ''}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Kelas" name="kelas_id" rules={[{ required: true }]}>
                    <Select onChange={setSelectedKelas}>
                      {kelasList.map(k => <Option key={k.id} value={k.id}>{k.nama}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Mata Pelajaran" name="mapel_id" rules={[{ required: true }]}>
                    <Select onChange={setSelectedMapel}>
                      {mapelList.map(m => <Option key={m.id} value={m.id}>{m.nama}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Kategori Penilaian" name="kategori_id" rules={[{ required: true }]}>
                    <Radio.Group onChange={(e) => setSelectedKategori(e.target.value)} buttonStyle="solid">
                      {kategoriList.map(k => (
                        <Radio.Button key={k.id} value={k.id}>{k.nama}</Radio.Button>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} style={{ background: '#0052FF' }}>
                Print Kertas (F4)
              </Button>
            </Form>
          </TabPane>

          <TabPane tab="2. Scan & Koreksi Hasil" key="2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
              <Row gutter={16}>
                <Col span={12}>
                  <Card title="Metode A: Scan Langsung via USB" bordered style={{ height: '100%', textAlign: 'center', borderColor: '#0052FF' }}>
                    <Button 
                      type="primary" 
                      icon={<ScanOutlined />} 
                      size="large" 
                      onClick={handleHardwareScan} 
                      loading={isScanningHardware}
                      style={{ background: '#0052FF', height: '60px', width: '100%', fontSize: '16px' }}
                    >
                      {isScanningHardware ? 'Sedang Menscan...' : 'Scan Sekarang dari Epson L3250'}
                    </Button>
                    <p style={{ marginTop: '15px', color: '#666', fontSize: '13px' }}>
                      Pastikan Scanner Epson L3250 terhubung via USB ke komputer ini, dalam keadaan menyala, dan lembar nilai sudah diletakkan di dalam scanner.
                    </p>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="Metode B: Upload File Hasil Scan" bordered style={{ height: '100%', textAlign: 'center' }}>
                    <Upload {...uploadProps}>
                      <Button 
                        type="default" 
                        icon={<UploadOutlined />} 
                        size="large" 
                        loading={isProcessing && !isScanningHardware}
                        style={{ height: '60px', width: '100%', fontSize: '16px' }}
                      >
                        {isProcessing && !isScanningHardware ? 'Memproses...' : 'Pilih File Gambar Hasil Scan'}
                      </Button>
                    </Upload>
                    <p style={{ marginTop: '15px', color: '#666', fontSize: '13px' }}>
                      Pilih gambar JPG/PNG hasil scan yang sudah Anda simpan sebelumnya di komputer.
                    </p>
                  </Card>
                </Col>
              </Row>

              {scannedData && (
                <div style={{ marginTop: 24 }}>
                  <Table 
                    dataSource={ocrResults} 
                    columns={columns} 
                    pagination={false} 
                    size="small"
                    bordered
                  />

                  <div style={{ marginTop: 24, textAlign: 'right' }}>
                    <Space>
                      <Button onClick={() => setScannedData(null)}>Batal / Ulangi</Button>
                      <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveBulk} style={{ background: '#0052FF' }}>
                        Simpan Permanen ke Database
                      </Button>
                    </Space>
                  </div>
                </div>
              )}

              {originalImageSrc && (
                <div style={{ marginTop: '20px' }}>
                  <Title level={5}>Mata AI (Visualisasi Pembacaan):</Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '10px' }}>
                    Kotak merah/hijau menunjukkan area yang diperiksa oleh AI. Kotak hijau berarti disilang/dipilih.
                  </Text>
                  <img src={originalImageSrc} alt="Preview OMR" style={{ width: '100%', maxWidth: '1000px', border: '2px solid #1890ff', borderRadius: '8px' }} />
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* --- HIDDEN PRINT AREA --- */}
      <div className="print-only">
        <div className="anchor-marker marker-tl"></div>
        <div className="anchor-marker marker-tr"></div>
        <div className="anchor-marker marker-bl"></div>
        <div className="anchor-marker marker-br"></div>

        <div className="print-header">
          <div className="print-title">
            <h1>Lembar Rekapitulasi Nilai</h1>
            <h2>Pondok Pesantren Al-Hamid</h2>
          </div>
        </div>

        <div className="print-info-grid">
          <div className="info-grid-col">
            <div className="info-item">
              <span className="info-label">Tahun Ajaran</span>
              <span className="info-colon">:</span>
              <span className="info-value">{tahunAjaranList.find(ta => ta.id === selectedTA)?.kode || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Kelas</span>
              <span className="info-colon">:</span>
              <span className="info-value">{kelasList.find(k => k.id === selectedKelas)?.nama || '-'}</span>
            </div>
          </div>
          <div className="info-grid-col">
            <div className="info-item">
              <span className="info-label">Mapel</span>
              <span className="info-colon">:</span>
              <span className="info-value">{mapelList.find(m => m.id === selectedMapel)?.nama || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Kategori</span>
              <span className="info-colon">:</span>
              <span className="info-value">{kategoriList.find(k => k.id === selectedKategori)?.nama || '-'}</span>
            </div>
          </div>
          <div className="qr-col">
            {selectedTA && selectedKelas && selectedMapel && selectedKategori ? (
              <QRCodeSVG 
                value={JSON.stringify({
                  ta: selectedTA,
                  k: selectedKelas,
                  m: selectedMapel,
                  kat: selectedKategori
                })} 
                size={85} 
              />
            ) : null}
          </div>
        </div>

        <table className="omr-table">
          <thead>
            <tr>
              <th rowSpan={2} className="col-no">NO</th>
              <th rowSpan={2} className="col-nama">Nama</th>
              <th rowSpan={2} className="col-nilai">Nilai (Silang Bulatan)</th>
              <th colSpan={2} className="col-kehadiran-group">Kehadiran</th>
              <th rowSpan={2} className="col-ttd">Tanda Tangan<br/>Peserta</th>
            </tr>
            <tr>
              <th className="col-kehadiran">Hadir<br/>(√)</th>
              <th className="col-kehadiran">Tidak<br/>(√)</th>
            </tr>
          </thead>
          <tbody>
            {santriList.slice(0, 30).map((santri, index) => {
              const isOdd = index % 2 === 0; // 0-indexed: 0 is row 1 (Odd)
              const isLastAndEven = index === Math.min(santriList.length, 30) - 1 && index % 2 === 0;

              return (
                <tr key={santri.santri_id || santri.id}>
                  <td className="col-no">{index + 1}</td>
                  <td className="col-nama">{santri.nama}</td>
                  <td className="col-nilai">
                    <div className="omr-bubble-container">
                      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
                        <div key={v} className="omr-bubble">{v}</div>
                      ))}
                      <div className="omr-separator"></div>
                      <div className="omr-bubble">5</div>
                    </div>
                  </td>
                  <td className="col-kehadiran"></td>
                  <td className="col-kehadiran"></td>
                  {isOdd && (
                    <td rowSpan={isLastAndEven ? 1 : 2} className="col-ttd">
                      <div className="ttd-left">{index + 1})</div>
                      {!isLastAndEven && <div className="ttd-right">{index + 2})</div>}
                    </td>
                  )}
                </tr>
              );
            })}
            {santriList.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Belum ada santri di kelas ini</td></tr>
            )}
          </tbody>
        </table>
        
        <div style={{ marginTop: '20px', fontSize: '11px', padding: '10px', border: '1px dashed #000' }}>
          <strong>PANDUAN:</strong> Silang (X) pada bulatan nilai menggunakan pulpen hitam. Contoh: Untuk nilai 85, silang bulatan [80] dan [5]. Jika salah, gunakan Tip-ex hingga bersih.
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Alert, Typography, Space, Table, Tag, message, Tabs, Input, Modal } from 'antd';
import { Link } from 'react-router-dom';
import { CameraOutlined, CheckCircleOutlined, CloseCircleOutlined, UserAddOutlined } from '@ant-design/icons';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { absensiSholatService } from '../services/absensiSholatService';
import { santriService } from '../services/santriService';
import { PageHeader, LoadingState } from '../components/common';

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = import.meta.env.VITE_API_URL || '';

export function AbsensiSholat() {
  const webcamRef = useRef(null);
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedSholat, setSelectedSholat] = useState('Subuh');
  const [scanResult, setScanResult] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [successPopup, setSuccessPopup] = useState({
    visible: false,
    name: '',
    sholat: '',
    photo: ''
  });
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  
  // Manual Attendance States
  const [unattendedSantri, setUnattendedSantri] = useState([]);
  const [loadingUnattended, setLoadingUnattended] = useState(false);
  const [selectedSholatManual, setSelectedSholatManual] = useState('Subuh');

  // Lists for dropdowns
  const [kelasList, setKelasList] = useState([]);
  const [kamarList, setKamarList] = useState([]);
  
  // Filters for Tab 2 (Manual)
  const [searchManual, setSearchManual] = useState('');
  const [filterKelasManual, setFilterKelasManual] = useState(null);
  const [filterKamarManual, setFilterKamarManual] = useState(null);
  
  // Filters for Tab 1 (History)
  const [searchHistory, setSearchHistory] = useState('');
  
  // WA Template States
  const [waTemplate, setWaTemplate] = useState(`Assalamualaikum Wr. Wb.
Yth. Orang Tua dari Ananda *[nama]*,

Berikut kami laporkan rekap kehadiran sholat berjamaah Ananda hari ini:
- Subuh: [Subuh]
- Dzuhur: [Dzuhur]
- Ashar: [Ashar]
- Maghrib: [Maghrib]
- Isya: [Isya]

Terima kasih atas perhatiannya.
Wassalamualaikum Wr. Wb.`);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [tempTemplate, setTempTemplate] = useState(waTemplate);
  const [sentSantriIds, setSentSantriIds] = useState([]);

  const sholatOptions = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

  // Load models and voice script on mount
  useEffect(() => {
    // Load ResponsiveVoice script untuk suara perempuan yang stabil
    const script = document.createElement('script');
    script.src = 'https://code.responsivevoice.org/responsivevoice.js';
    script.async = true;
    document.body.appendChild(script);

    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        message.success('Model AI berhasil dimuat');
      } catch (error) {
        console.error('Failed to load models:', error);
        message.error('Gagal memuat model AI. Pastikan file model ada di folder public/models');
      }
    };

    loadModels();
    loadTodayAttendance();
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
      const [kelasData, kamarData] = await Promise.all([
        santriService.fetchKelas(),
        santriService.fetchKamar()
      ]);
      setKelasList(kelasData);
      setKamarList(kamarData);
    } catch (error) {
      console.error('Failed to load filter data:', error);
    }
  };

  useEffect(() => {
    loadUnattendedSantri();
  }, [selectedSholatManual]);

  const loadTodayAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const data = await absensiSholatService.getTodayAttendance();
      setTodayAttendance(data);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      message.error('Gagal memuat data absensi hari ini');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const loadUnattendedSantri = async () => {
    try {
      setLoadingUnattended(true);
      const today = new Date().toISOString().split('T')[0];
      const data = await absensiSholatService.getUnattendedSantri(selectedSholatManual, today);
      setUnattendedSantri(data);
    } catch (error) {
      console.error('Failed to load unattended santri:', error);
      message.error('Gagal memuat data santri yang belum absen');
    } finally {
      setLoadingUnattended(false);
    }
  };

  const handleScan = async () => {
    if (!webcamRef.current) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Gagal mengambil gambar dari kamera');
      }

      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => (img.onload = resolve));

      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        message.warning('Wajah tidak terdeteksi. Silakan coba lagi.');
        setIsScanning(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const result = await absensiSholatService.scanFace(descriptor, selectedSholat);

      setScanResult({
        success: true,
        match: result.match
      });
      
      setSuccessPopup({
        visible: true,
        name: result.match.nama,
        sholat: selectedSholat,
        photo: result.match.foto_url
      });
      
      // Voice synthesis menggunakan Proxy Backend (Google TTS)
      const textToSpeak = `${result.match.nama} telah absen sholat ${selectedSholat}`;
      const ttsUrl = `${API_BASE}/api/tts?text=${encodeURIComponent(textToSpeak)}`;
      
      const audio = new Audio(ttsUrl);
      audio.play().catch(err => {
        console.error('Gagal memutar suara TTS Proxy:', err);
        
        // FALLBACK: Jika proxy gagal, gunakan suara internal browser (dengan pitch tinggi)
        const speech = new SpeechSynthesisUtterance(textToSpeak);
        speech.lang = 'id-ID';
        speech.pitch = 1.5;
        window.speechSynthesis.speak(speech);
      });

      // Auto close popup after 3 seconds
      setTimeout(() => {
        setSuccessPopup(prev => ({ ...prev, visible: false }));
      }, 3000);

      loadTodayAttendance();
      loadUnattendedSantri(); // Refresh list if on tab 2
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        success: false,
        message: error.message || 'Gagal mengenali wajah'
      });
      message.error(error.message || 'Gagal mengenali wajah');
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualAttendance = async (santriId, status, sholat) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await absensiSholatService.recordManualAttendance(santriId, sholat || selectedSholatManual, status);
      message.success(`Status berhasil diubah menjadi ${status}`);
      loadUnattendedSantri();
      loadTodayAttendance();
    } catch (error) {
      console.error('Manual attendance error:', error);
      message.error('Gagal mencatat absensi manual');
    }
  };

  const handleSendWA = (record) => {
    const noHp = record.no_hp_ibu || record.no_hp_ayah;
    if (!noHp) {
      message.error('Nomor HP tidak tersedia');
      return;
    }
    
    // Format number: remove leading 0 and replace with 62
    let formattedNoHp = noHp.replace(/[^0-9]/g, '');
    if (formattedNoHp.startsWith('0')) {
      formattedNoHp = '62' + formattedNoHp.slice(1);
    }
    
    let messageText = waTemplate
      .replace('[nama]', record.nama)
      .replace('[Subuh]', record.rekap.Subuh)
      .replace('[Dzuhur]', record.rekap.Dzuhur)
      .replace('[Ashar]', record.rekap.Ashar)
      .replace('[Maghrib]', record.rekap.Maghrib)
      .replace('[Isya]', record.rekap.Isya);

    const encodedMessage = encodeURIComponent(messageText);
    const url = `https://wa.me/${formattedNoHp}?text=${encodedMessage}`;
    window.open(url, '_blank');
    setSentSantriIds(prev => prev.includes(record.santri_id) ? prev : [...prev, record.santri_id]);
  };
  const handleMarkAllAsAlfa = async () => {
    try {
      setLoadingUnattended(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Mark all in unattendedSantri as Alfa
      await Promise.all(
        unattendedSantri.map(s => 
          absensiSholatService.recordManualAttendance(s.id, selectedSholatManual, 'Alfa')
        )
      );
      
      message.success('Semua santri yang belum hadir berhasil ditandai Alfa');
      loadUnattendedSantri();
      loadTodayAttendance();
    } catch (error) {
      console.error('Mark all as alfa error:', error);
      message.error('Gagal menandai Alfa massal');
    } finally {
      setLoadingUnattended(false);
    }
  };

  const columns = [
    {
      title: 'Waktu',
      dataIndex: 'waktu_scan',
      key: 'waktu_scan',
      render: (text) => new Date(text).toLocaleTimeString('id-ID'),
    },
    {
      title: 'Nama',
      dataIndex: 'santri_nama',
      key: 'santri_nama',
      render: (text) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span>,
    },

    {
      title: 'Kelas',
      dataIndex: 'kelas_nama',
      key: 'kelas_nama',
    },
    {
      title: 'Sholat',
      dataIndex: 'sholat',
      key: 'sholat',
      render: (sholat) => <Tag color="blue">{sholat}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        if (status === 'Alfa') color = 'red';
        if (status === 'Sakit') color = 'orange';
        if (status === 'Izin') color = 'cyan';
        if (status === 'Masbuq') color = 'purple';
        if (status === 'Haid' || status === 'Istihadoh') color = 'pink';
        
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Ubah Status',
      key: 'aksi',
      render: (_, record) => (
        <Select
          defaultValue={record.status}
          style={{ width: '120px' }}
          onChange={(value) => handleManualAttendance(record.santri_id, value, record.sholat)}
        >
          <Option value="Hadir">Hadir</Option>
          <Option value="Sakit">Sakit</Option>
          <Option value="Izin">Izin</Option>
          <Option value="Masbuq">Masbuq</Option>
          <Option value="Haid">Haid</Option>
          <Option value="Istihadoh">Istihadoh</Option>
          <Option value="Alfa">Alfa</Option>
        </Select>
      ),
    },
  ];

  const manualColumns = [
    {
      title: 'Nama',
      dataIndex: 'nama',
      key: 'nama',
    },

    {
      title: 'Kelas',
      dataIndex: 'kelas_nama',
      key: 'kelas_nama',
      render: (text) => text || '-',
    },
    {
      title: 'Aksi Cepat',
      key: 'aksi',
      render: (_, record) => (
        <Space size="small" style={{ whiteSpace: 'nowrap' }}>
          <Button size="small" type="primary" ghost onClick={() => handleManualAttendance(record.id, 'Sakit')}>Sakit</Button>
          <Button size="small" type="primary" ghost onClick={() => handleManualAttendance(record.id, 'Izin')}>Izin</Button>
          <Button size="small" type="primary" ghost onClick={() => handleManualAttendance(record.id, 'Masbuq')}>Masbuq</Button>
          <Button size="small" type="primary" ghost onClick={() => handleManualAttendance(record.id, 'Haid')}>Haid</Button>
          <Button size="small" type="primary" ghost onClick={() => handleManualAttendance(record.id, 'Istihadoh')}>Istihadoh</Button>
        </Space>
      ),
    },
  ];

  const filteredUnattendedSantri = unattendedSantri.filter(s => {
    const matchName = s.nama.toLowerCase().includes(searchManual.toLowerCase());
    const matchKelas = filterKelasManual ? s.kelas_diniyah_id === filterKelasManual : true;
    const matchKamar = filterKamarManual ? s.kamar_id === filterKamarManual : true;
    return matchName && matchKelas && matchKamar;
  });

  const filteredTodayAttendance = todayAttendance.filter(a => {
    return a.santri_nama.toLowerCase().includes(searchHistory.toLowerCase());
  });

  const aggregatedWAData = {};
  todayAttendance.forEach(record => {
    if (!aggregatedWAData[record.santri_id]) {
      aggregatedWAData[record.santri_id] = {
        santri_id: record.santri_id,
        nama: record.santri_nama,
        kelas: record.kelas_nama,
        no_hp_ayah: record.no_hp_ayah,
        no_hp_ibu: record.no_hp_ibu,
        rekap: {
          Subuh: '-',
          Dzuhur: '-',
          Ashar: '-',
          Maghrib: '-',
          Isya: '-'
        }
      };
    }
    aggregatedWAData[record.santri_id].rekap[record.sholat] = record.status;
  });

  const waDataSource = Object.values(aggregatedWAData);

  const waColumns = [
    {
      title: 'Nama',
      dataIndex: 'nama',
      key: 'nama',
    },
    {
      title: 'Kelas',
      dataIndex: 'kelas',
      key: 'kelas',
    },
    {
      title: 'Subuh',
      dataIndex: ['rekap', 'Subuh'],
      key: 'Subuh',
      render: (status) => <Tag color={status === 'Hadir' ? 'green' : status === '-' ? 'default' : 'red'}>{status}</Tag>,
    },
    {
      title: 'Dzuhur',
      dataIndex: ['rekap', 'Dzuhur'],
      key: 'Dzuhur',
      render: (status) => <Tag color={status === 'Hadir' ? 'green' : status === '-' ? 'default' : 'red'}>{status}</Tag>,
    },
    {
      title: 'Ashar',
      dataIndex: ['rekap', 'Ashar'],
      key: 'Ashar',
      render: (status) => <Tag color={status === 'Hadir' ? 'green' : status === '-' ? 'default' : 'red'}>{status}</Tag>,
    },
    {
      title: 'Maghrib',
      dataIndex: ['rekap', 'Maghrib'],
      key: 'Maghrib',
      render: (status) => <Tag color={status === 'Hadir' ? 'green' : status === '-' ? 'default' : 'red'}>{status}</Tag>,
    },
    {
      title: 'Isya',
      dataIndex: ['rekap', 'Isya'],
      key: 'Isya',
      render: (status) => <Tag color={status === 'Hadir' ? 'green' : status === '-' ? 'default' : 'red'}>{status}</Tag>,
    },
    {
      title: 'Aksi',
      key: 'aksi',
      render: (_, record) => {
        const noHp = record.no_hp_ibu || record.no_hp_ayah;
        const disabled = !noHp;
        const isSent = sentSantriIds.includes(record.santri_id);
        
        return (
          <Button
            type={isSent ? 'default' : 'primary'}
            icon={isSent ? <CheckCircleOutlined /> : <Typography.Text style={{ color: '#fff' }}>WA</Typography.Text>}
            disabled={disabled}
            onClick={() => handleSendWA(record)}
          >
            {isSent ? 'Kirim Lagi' : 'Kirim WA'}
          </Button>
        );
      },
    },
  ];

  if (!modelsLoaded) {
    return <LoadingState message="Memuat model AI untuk pengenalan wajah..." />;
  }

  const tabItems = [
    {
      key: '1',
      label: 'Presensi Sholat (Scan)',
      children: (
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
          {/* Kolom Kiri: Kamera */}
          <Card title="Area Pemindaian Wajah" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '16px' }}>
              <Text style={{ marginRight: '8px' }}>Pilih Waktu Sholat:</Text>
              <Select
                value={selectedSholat}
                onChange={setSelectedSholat}
                style={{ width: '150px' }}
              >
                {sholatOptions.map((s) => (
                  <Option key={s} value={s}>
                    {s}
                  </Option>
                ))}
              </Select>
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "user"
                }}
              />
              {isScanning && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, width: '100%', height: '100%',
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  color: '#fff', fontSize: '18px'
                }}>
                  Sedang memproses...
                </div>
              )}
            </div>

            <Button
              type="primary"
              icon={<CameraOutlined />}
              onClick={handleScan}
              loading={isScanning}
              style={{ marginTop: '16px', width: '200px' }}
            >
              Scan Wajah
            </Button>

            {scanResult && (
              <div style={{ marginTop: '16px' }}>
                {scanResult.success ? (
                  <Alert
                    message={`Berhasil Absen: ${scanResult.match.nama}`}
                    description={`NIS: ${scanResult.match.nis} | Kelas: ${scanResult.match.kelas || '-'}`}
                    type="success"
                    showIcon
                    icon={<CheckCircleOutlined />}
                  />
                ) : (
                  <Alert
                    message="Gagal Mengenali"
                    description={scanResult.message}
                    type="error"
                    showIcon
                    icon={<CloseCircleOutlined />}
                  />
                )}
              </div>
            )}
          </Card>

          {/* Kolom Kanan: Riwayat Hari Ini */}
          <Card title="Riwayat Absensi Hari Ini">
            <div style={{ marginBottom: '16px' }}>
              <Input
                placeholder="Cari nama"
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                style={{ width: '100%' }}
                allowClear
              />
            </div>
            <Table
              dataSource={filteredTodayAttendance}
              columns={columns}
              rowKey="id"
              loading={loadingAttendance}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </div>
      )
    },
    {
      key: '2',
      label: 'Absensi Manual',
      children: (
        <Card title="Daftar Santri Belum Absen">
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space wrap size="middle">
              <div>
                <Text style={{ marginRight: '8px' }}>Waktu Sholat:</Text>
                <Select
                  value={selectedSholatManual}
                  onChange={setSelectedSholatManual}
                  style={{ width: '120px' }}
                >
                  {sholatOptions.map((s) => (
                    <Option key={s} value={s}>{s}</Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text style={{ marginRight: '8px' }}>Cari Nama:</Text>
                <Input
                  placeholder="Cari nama"
                  value={searchManual}
                  onChange={(e) => setSearchManual(e.target.value)}
                  style={{ width: '150px' }}
                  allowClear
                />
              </div>

              <div>
                <Text style={{ marginRight: '8px' }}>Kelas:</Text>
                <Select
                  placeholder="Semua"
                  style={{ width: '120px' }}
                  value={filterKelasManual}
                  onChange={setFilterKelasManual}
                  allowClear
                >
                  {kelasList.map((k) => (
                    <Option key={k.id} value={k.id}>{k.nama}</Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text style={{ marginRight: '8px' }}>Kamar:</Text>
                <Select
                  placeholder="Semua"
                  style={{ width: '120px' }}
                  value={filterKamarManual}
                  onChange={setFilterKamarManual}
                  allowClear
                >
                  {kamarList.map((k) => (
                    <Option key={k.id} value={k.id}>{k.nama}</Option>
                  ))}
                </Select>
              </div>
            </Space>
            
            <Button 
              type="primary" 
              danger 
              onClick={handleMarkAllAsAlfa}
              disabled={filteredUnattendedSantri.length === 0}
              loading={loadingUnattended}
            >
              Tandai Alfa Semua yang Belum Hadir
            </Button>
          </div>

          <Table
            dataSource={filteredUnattendedSantri}
            columns={manualColumns}
            rowKey="id"
            loading={loadingUnattended}
            pagination={{ pageSize: 20 }}
          />
        </Card>
      )
    },
    {
      key: '3',
      label: 'Kirim WhatsApp',
      children: (
        <Card 
          title="Kirim Rekap Harian ke Orang Tua"
          extra={
            <Button 
              type="default" 
              onClick={() => {
                setTempTemplate(waTemplate);
                setIsTemplateModalVisible(true);
              }}
            >
              Pengaturan Pesan
            </Button>
          }
        >
          <Table
            dataSource={waDataSource}
            columns={waColumns}
            rowKey="santri_id"
            pagination={{ pageSize: 20 }}
          />
        </Card>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title="Absensi Sholat Berjamaah"
        subtitle="Fitur Smart Absensi menggunakan Scan Wajah"
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <Link to="/absensi-sholat-scan" target="_blank">
          <Button type="primary" size="large" icon={<CameraOutlined />} style={{ background: '#2563eb' }}>
            Buka Mode Scan Penuh (Standalone)
          </Button>
        </Link>
      </div>

      <Tabs defaultActiveKey="1" items={tabItems} style={{ marginTop: '16px' }} />
      
      <Modal
        title="Pengaturan Template Pesan WhatsApp"
        open={isTemplateModalVisible}
        onOk={() => {
          setWaTemplate(tempTemplate);
          setIsTemplateModalVisible(false);
          message.success('Template pesan berhasil diperbarui');
        }}
        onCancel={() => setIsTemplateModalVisible(false)}
        okText="Simpan"
        cancelText="Batal"
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <Typography.Text type="secondary">
            Gunakan placeholder berikut untuk mengganti data otomatis:<br/>
            <code>[nama]</code> : Nama Santri<br/>
            <code>[Subuh]</code>, <code>[Dzuhur]</code>, <code>[Ashar]</code>, <code>[Maghrib]</code>, <code>[Isya]</code> : Status Kehadiran
          </Typography.Text>
        </div>
        <Input.TextArea
          rows={10}
          value={tempTemplate}
          onChange={(e) => setTempTemplate(e.target.value)}
        />
      </Modal>

      <Modal
        open={successPopup.visible}
        footer={null}
        closable={false}
        centered
        width={450}
        bodyStyle={{ padding: '0px', overflow: 'hidden', borderRadius: '24px' }}
      >
        <div style={{
          background: '#ffffff',
          color: '#1f2937',
          padding: '32px',
          textAlign: 'center',
          position: 'relative',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#d1fae5',
            color: '#047857',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Berhasil
          </div>
          
          <div style={{ marginBottom: '20px', marginTop: '15px' }}>
            <div style={{ marginBottom: '20px' }}>
              {successPopup.photo ? (
                <img
                  src={`${API_BASE}${successPopup.photo}`}
                  alt={successPopup.name}
                  style={{
                    width: '180px',
                    height: '240px',
                    borderRadius: '16px',
                    objectFit: 'cover',
                    border: '4px solid #10b981',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}
                />
              ) : (
                <div style={{
                  width: '180px',
                  height: '240px',
                  borderRadius: '16px',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  border: '4px solid #10b981',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                }}>
                  <CameraOutlined style={{ fontSize: '64px', color: '#9ca3af' }} />
                </div>
              )}
            </div>
            
            <Typography.Title level={3} style={{ color: '#111827', marginBottom: '8px', fontWeight: '700' }}>
              {successPopup.name}
            </Typography.Title>
            
            <Typography.Text style={{ color: '#4b5563', fontSize: '16px' }}>
              Telah absen sholat <span style={{ color: '#10b981', fontWeight: 'bold' }}>{successPopup.sholat}</span>
            </Typography.Text>
            
            <div style={{ marginTop: '20px' }}>
              <CheckCircleOutlined style={{ fontSize: '48px', color: '#10b981' }} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

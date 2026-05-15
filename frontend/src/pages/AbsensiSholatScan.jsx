import { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Typography, Space, Modal, message, Input } from 'antd';
import { CameraOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { absensiSholatService } from '../services/absensiSholatService';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = import.meta.env.VITE_API_URL || '';

export function AbsensiSholatScan() {
  const webcamRef = useRef(null);
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const getActiveSholat = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 6) return 'Subuh';
    if (hour >= 11 && hour < 14) return 'Dzuhur';
    if (hour >= 15 && hour < 17) return 'Ashar';
    if (hour >= 17 && hour < 19) return 'Maghrib';
    if (hour >= 19 && hour < 21) return 'Isya';
    return 'Subuh'; // Default
  };

  const [selectedSholat, setSelectedSholat] = useState('Subuh');
  const [scanResult, setScanResult] = useState(null);
  
  // Passcode States
  const [isPasscodeModalVisible, setIsPasscodeModalVisible] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [pendingSholat, setPendingSholat] = useState(null);

  const handleSholatChange = (value) => {
    setPendingSholat(value);
    setIsPasscodeModalVisible(true);
  };
  const [successPopup, setSuccessPopup] = useState({
    visible: false,
    name: '',
    sholat: '',
    photo: ''
  });

  const sholatOptions = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

  // Load models on mount
  useEffect(() => {
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
  }, []);

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
        // FALLBACK: Web Speech API
        const speech = new SpeechSynthesisUtterance(textToSpeak);
        speech.lang = 'id-ID';
        speech.pitch = 1.5;
        window.speechSynthesis.speak(speech);
      });

      // Auto close popup after 3 seconds
      setTimeout(() => {
        setSuccessPopup(prev => ({ ...prev, visible: false }));
      }, 3000);

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

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Title level={2} style={{ color: '#0f172a', marginBottom: '5px' }}>Presensi Sholat Berjamaah</Title>
        <Text type="secondary">Fokus Pemindaian Wajah untuk Kehadiran Santri</Text>
      </div>

      <Card style={{ 
        width: '100%', 
        maxWidth: '500px', 
        borderRadius: '20px', 
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        border: 'none'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>Pilih Waktu Sholat:</Text>
          <Select
            style={{ width: '100%' }}
            value={selectedSholat}
            onChange={handleSholatChange}
            size="large"
          >
            {sholatOptions.map((sholat) => (
              <Option key={sholat} value={sholat}>
                {sholat}
              </Option>
            ))}
          </Select>
        </div>

        <div style={{ 
          position: 'relative', 
          borderRadius: '12px', 
          overflow: 'hidden',
          background: '#000',
          marginBottom: '20px',
          height: '350px'
        }}>
          {modelsLoaded ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              videoConstraints={{
                facingMode: 'user'
              }}
            />
          ) : (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#9ca3af',
              flexDirection: 'column'
            }}>
              <CameraOutlined style={{ fontSize: '48px', marginBottom: '10px' }} />
              <Text style={{ color: '#9ca3af' }}>Memuat kamera dan model AI...</Text>
            </div>
          )}
        </div>

        <Button
          type="primary"
          size="large"
          icon={<CameraOutlined />}
          onClick={handleScan}
          loading={isScanning}
          disabled={!modelsLoaded}
          style={{ 
            width: '100%', 
            height: '50px', 
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            background: '#2563eb'
          }}
        >
          {isScanning ? 'Memindai...' : 'Ambil Presensi'}
        </Button>
      </Card>

      {/* Success Popup */}
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

      {/* Passcode Modal */}
      <Modal
        title="Otorisasi Diperlukan"
        open={isPasscodeModalVisible}
        onOk={() => {
          if (passcode === 'alhamidku123') {
            setSelectedSholat(pendingSholat);
            setIsPasscodeModalVisible(false);
            setPasscode('');
            message.success('Waktu sholat berhasil diubah');
          } else {
            message.error('Kode akses salah!');
          }
        }}
        onCancel={() => {
          setIsPasscodeModalVisible(false);
          setPasscode('');
        }}
        okText="Verifikasi"
        cancelText="Batal"
        centered
      >
        <div style={{ marginBottom: '16px' }}>
          <Text>Masukkan kode akses untuk mengganti waktu sholat:</Text>
        </div>
        <Input.Password
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Masukkan kode akses"
          size="large"
        />
      </Modal>
    </div>
  );
}

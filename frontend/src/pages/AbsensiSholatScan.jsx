import { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Typography, Space, Modal, message, Input, ConfigProvider, theme } from 'antd';
import { CameraOutlined, CheckCircleOutlined, ArrowLeftOutlined, SyncOutlined } from '@ant-design/icons';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { absensiSholatService } from '../services/absensiSholatService';
import { Link } from 'react-router-dom';

// MediaPipe is loaded via CDN in index.html
const FaceMesh = window.FaceMesh;
const Hands = window.Hands;
const MediaPipeCamera = window.Camera;
const drawConnectors = window.drawConnectors;
const drawLandmarks = window.drawLandmarks;
const HAND_CONNECTIONS = window.HAND_CONNECTIONS;

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = import.meta.env.VITE_API_URL || '';

export function AbsensiSholatScan() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  
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

  // Liveness States
  const [blinkCount, setBlinkCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [lastBlinkTime, setLastBlinkTime] = useState(0);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const blinkRef = useRef(0);
  const isBlinkingRef = useRef(false);
  const isScanningRef = useRef(false);
  
  // Hand states
  const [handStableCount, setHandStableCount] = useState(0);
  const handStableRef = useRef(0);
  const handsRef = useRef(null);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setBlinkCount(0);
    blinkRef.current = 0;
  };

  const sholatOptions = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

  // Load models and Initialize MediaPipe
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        // Initialize MediaPipe FaceMesh
        const faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults(onFaceMeshResults);
        faceMeshRef.current = faceMesh;

        // Init Hands
        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        hands.onResults(onHandsResults);
        handsRef.current = hands;

        setModelsLoaded(true);
        message.success('Sistem AI (Wajah & Tangan) Siap.');
      } catch (error) {
        console.error('Failed to load models:', error);
        message.error('Gagal memuat model AI.');
      }
    };
    loadModels();
  }, []);

  const onFaceMeshResults = (results) => {
    if (!canvasRef.current || !webcamRef.current) return;

    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const canvasCtx = canvasRef.current.getContext('2d');
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      setIsFaceDetected(true);
      const landmarks = results.multiFaceLandmarks[0];

      // Draw Face Mesh - Versi Sleek (Garis Kontur Wajah)
      drawConnectors(canvasCtx, landmarks, window.FACEMESH_CONTOURS, {
        color: '#00eeee80', // Biru Cyan transparan
        lineWidth: 1,
      });
      
      // Highlight Mata dengan warna yang lebih lembut
      drawConnectors(canvasCtx, landmarks, window.FACEMESH_RIGHT_EYE, { color: '#ff4d4f', lineWidth: 2 });
      drawConnectors(canvasCtx, landmarks, window.FACEMESH_LEFT_EYE, { color: '#52c41a', lineWidth: 2 });

      // MediaPipe EAR Calculation (for blink)
      // Landmarks: Left Eye (362, 385, 387, 263, 373, 380), Right Eye (33, 160, 158, 133, 153, 144)
      const leftEyeEAR = getMediaPipeEAR(landmarks, [362, 385, 387, 263, 373, 380]);
      const rightEyeEAR = getMediaPipeEAR(landmarks, [33, 160, 158, 133, 153, 144]);
      const ear = (leftEyeEAR + rightEyeEAR) / 2;
      
      const EAR_THRESHOLD = 0.25;
      if (ear < EAR_THRESHOLD) {
        if (!isBlinkingRef.current) {
          isBlinkingRef.current = true;
          setIsBlinking(true);
          blinkRef.current += 1;
          setBlinkCount(blinkRef.current);
          if (blinkRef.current >= 2) handleAutoScan();
        }
      } else {
        isBlinkingRef.current = false;
        setIsBlinking(false);
      }
    } else {
      setIsFaceDetected(false);
    }
    canvasCtx.restore();
  };

  const onHandsResults = (results) => {
    if (!canvasRef.current || !webcamRef.current) return;
    const canvasCtx = canvasRef.current.getContext('2d');

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsHandDetected(true);
      const landmarks = results.multiHandLandmarks[0];

      // Draw Hand Mesh
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00ccff', lineWidth: 2 });
      drawLandmarks(canvasCtx, landmarks, { color: '#ffffff', lineWidth: 1, radius: 2 });

      // Stability check for palm scan
      handStableRef.current += 1;
      setHandStableCount(handStableRef.current);
      if (handStableRef.current >= 40) { // Sekitar 2 detik diam
        handlePalmScan(landmarks);
        handStableRef.current = 0;
      }
    } else {
      setIsHandDetected(false);
      handStableRef.current = 0;
      setHandStableCount(0);
    }
  };

  const handlePalmScan = async (landmarks) => {
    if (scanning || !sholat) return;
    setScanning(true);
    
    try {
      // Normalize landmarks (flatten to array of numbers)
      const palmDescriptor = landmarks.flatMap(l => [l.x, l.y, l.z]);
      
      const response = await absensiSholatService.scanPalm(palmDescriptor, sholat);
      if (response.success) {
        setResult(response.match);
        message.success(`Absensi Berhasil (Tangan): ${response.match.nama}`);
        speak(`Terima kasih ${response.match.nama}, absensi sholat ${sholat} berhasil.`);
      } else {
        message.error(response.message || 'Tangan tidak dikenali');
      }
    } catch (error) {
      message.error('Gagal memproses absensi tangan');
    } finally {
      setTimeout(() => setScanning(false), 3000);
    }
  };

  const getMediaPipeEAR = (landmarks, indices) => {
    const p1 = landmarks[indices[0]];
    const p2 = landmarks[indices[1]];
    const p3 = landmarks[indices[2]];
    const p4 = landmarks[indices[3]];
    const p5 = landmarks[indices[4]];
    const p6 = landmarks[indices[5]];
    
    const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    const v1 = dist(p2, p6);
    const v2 = dist(p3, p5);
    const h = dist(p1, p4);
    return (v1 + v2) / (2.0 * h);
  };

  const preprocessImage = (videoElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let min = 255, max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const v = (data[i] + data[i+1] + data[i+2]) / 3;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = Math.max(max - min, 1);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = ((data[i] - min) / range) * 255;
      data[i+1] = ((data[i+1] - min) / range) * 255;
      data[i+2] = ((data[i+2] - min) / range) * 255;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  // Start MediaPipe Camera loop
  useEffect(() => {
    if (modelsLoaded && webcamRef.current && webcamRef.current.video) {
      const camera = new MediaPipeCamera(webcamRef.current.video, {
        onFrame: async () => {
          if (!webcamRef.current || !webcamRef.current.video) return;
          
          // Apply Image Pre-processing for better detection
          const normalizedCanvas = preprocessImage(webcamRef.current.video);

          if (faceMeshRef.current) {
            await faceMeshRef.current.send({ image: normalizedCanvas });
          }
          // Hand detection disabled for now
          /*
          if (handsRef.current) {
            await handsRef.current.send({ image: webcamRef.current.video });
          }
          */
        },
        width: 640,
        height: 480,
      });
      camera.start();
      return () => camera.stop();
    }
  }, [modelsLoaded, facingMode]);

  // Force Light Mode for this page
  useEffect(() => {
    const originalTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      if (originalTheme) {
        document.documentElement.setAttribute('data-theme', originalTheme);
      }
    };
  }, []);

  const calculateEAR = (landmarks) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const getEyeEAR = (eye) => {
      const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
      const v1 = dist(eye[1], eye[5]);
      const v2 = dist(eye[2], eye[4]);
      const h = dist(eye[0], eye[3]);
      return (v1 + v2) / (2 * h);
    };
    return (getEyeEAR(leftEye) + getEyeEAR(rightEye)) / 2;
  };

  const handleAutoScan = async () => {
    if (!webcamRef.current || isScanningRef.current) return;
    
    isScanningRef.current = true;
    setIsScanning(true);

    try {
      const video = webcamRef.current.video;
      const normalizedCanvas = preprocessImage(video);

      const detection = await faceapi
        .detectSingleFace(normalizedCanvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setIsScanning(false);
        isScanningRef.current = false;
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const result = await absensiSholatService.scanFace(descriptor, selectedSholat);

      setSuccessPopup({
        visible: true,
        name: result.match.nama,
        sholat: selectedSholat,
        photo: result.match.foto_url
      });
      
      const textToSpeak = `${result.match.nama} telah absen sholat ${selectedSholat}`;
      const ttsUrl = `${API_BASE}/api/tts?text=${encodeURIComponent(textToSpeak)}`;
      
      const audio = new Audio(ttsUrl);
      audio.play().catch(() => {
        const speech = new SpeechSynthesisUtterance(textToSpeak);
        speech.lang = 'id-ID';
        window.speechSynthesis.speak(speech);
      });

      setTimeout(() => {
        setSuccessPopup(prev => ({ ...prev, visible: false }));
        setBlinkCount(0);
        blinkRef.current = 0;
        isScanningRef.current = false;
        setIsScanning(false);
      }, 4000);

    } catch (error) {
      message.error(error.message || 'Gagal mengenali wajah');
      setIsScanning(false);
      isScanningRef.current = false;
      setBlinkCount(0);
      blinkRef.current = 0;
    }
  };

  // Removed the old interval loop as we now use MediaPipe's onFrame
  useEffect(() => {
    // MediaPipe initialization handled in the loadModels effect
  }, [modelsLoaded, successPopup.visible, selectedSholat]);

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
    <ConfigProvider 
      theme={{ 
        algorithm: theme.defaultAlgorithm,
        token: {
          colorBgContainer: '#ffffff',
          colorText: '#1f2937',
        }
      }}
    >
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
            <div style={{ 
              position: 'absolute', 
              top: '20px', 
              left: '20px', 
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{
                background: isFaceDetected ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 44, 44, 0.8)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {isFaceDetected ? 'Wajah Terdeteksi' : 'Wajah Tidak Terlihat'}
              </div>
              
              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '13px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ marginBottom: '4px', fontSize: '11px', opacity: 0.8 }}>Liveness Check:</div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: blinkCount >= 1 ? '#10b981' : '#4b5563',
                    boxShadow: blinkCount >= 1 ? '0 0 10px #10b981' : 'none'
                  }} />
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: blinkCount >= 2 ? '#10b981' : '#4b5563',
                    boxShadow: blinkCount >= 2 ? '0 0 10px #10b981' : 'none'
                  }} />
                  <span style={{ marginLeft: '4px', fontWeight: 'bold' }}>
                    {blinkCount}/2 Kedip
                  </span>
                </div>
              </div>

              <Button 
                shape="circle" 
                icon={<SyncOutlined />} 
                onClick={toggleCamera}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#fff',
                  backdropFilter: 'blur(4px)',
                  width: '40px',
                  height: '40px',
                  fontSize: '18px'
                }}
                title="Ganti Kamera"
              />
            </div>

            {/* Scanning Line Animation */}
            {isFaceDetected && !isScanning && (
              <div className="scan-line" style={{
                position: 'absolute',
                width: '100%',
                height: '2px',
                background: 'rgba(37, 99, 235, 0.8)',
                boxShadow: '0 0 15px 2px rgba(37, 99, 235, 0.8)',
                zIndex: 5,
                animation: 'scanMove 3s infinite ease-in-out'
              }} />
            )}

            <style>{`
              @keyframes scanMove {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
            `}</style>

            {isScanning && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                flexDirection: 'column',
                color: '#fff'
              }}>
                <CameraOutlined spin style={{ fontSize: '40px', marginBottom: '10px' }} />
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Mencocokkan Wajah...</Text>
              </div>
            )}

            {modelsLoaded ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
                    facingMode: facingMode
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 1
                  }}
                />
              </div>
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
                <Text style={{ color: '#9ca3af' }}>Memuat MediaPipe & AI Models...</Text>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', padding: '10px', background: '#f1f5f9', borderRadius: '12px' }}>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              💡 Instruksi: Kedipkan mata Anda <b>2 kali</b> untuk presensi otomatis.
            </Text>
          </div>
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
    </ConfigProvider>
  );
}

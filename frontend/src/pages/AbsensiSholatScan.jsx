import { useState, useEffect, useRef } from 'react';
import { message, Input } from 'antd';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, QrCode, Fingerprint, Lock, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { absensiSholatService } from '../services/absensiSholatService';
import { ScanMethodTabs } from '../components/ui/ScanMethodTabs';
import { LiveActivityFeed } from '../components/ui/LiveActivityFeed';
import { CustomModal } from '../components/ui/CustomModal';
import { AttendanceSuccessOverlay } from '../components/ui/AttendanceSuccessOverlay';
import './AbsensiSholatScan.scss';

// MediaPipe is loaded via CDN in index.html
const FaceMesh = window.FaceMesh;
const Hands = window.Hands;
const MediaPipeCamera = window.Camera;
const drawConnectors = window.drawConnectors;
const drawLandmarks = window.drawLandmarks;
const HAND_CONNECTIONS = window.HAND_CONNECTIONS;

const API_BASE = import.meta.env.VITE_API_URL || '';

export function AbsensiSholatScan() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('wajah');
  
  const getActiveSholat = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 6) return 'Subuh';
    if (hour >= 11 && hour < 14) return 'Dzuhur';
    if (hour >= 15 && hour < 17) return 'Ashar';
    if (hour >= 17 && hour < 19) return 'Maghrib';
    if (hour >= 19 && hour < 21) return 'Isya';
    return 'Subuh'; // Default
  };

  const sholatOptions = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
  const [selectedSholat, setSelectedSholat] = useState(getActiveSholat());
  
  // Realtime Data
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentScans, setRecentScans] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Initial fetch for activity feed
    absensiSholatService.getTodayAttendance().then(data => setRecentScans(data)).catch(() => {});
  }, []);

  // Passcode States
  const [isPasscodeModalVisible, setIsPasscodeModalVisible] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [pendingSholat, setPendingSholat] = useState(null);

  const [nfcInput, setNfcInput] = useState('');
  const [fingerprintInput, setFingerprintInput] = useState('');
  const nfcInputRef = useRef(null);
  const fingerprintInputRef = useRef(null);

  const handleSholatChange = (value) => {
    setPendingSholat(value);
    setIsPasscodeModalVisible(true);
  };

  const [successPopup, setSuccessPopup] = useState({ visible: false, name: '', sholat: '', photo: '', kelas: '' });

  // Liveness States
  const [blinkCount, setBlinkCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
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

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

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
      } catch (error) {
        console.error('Failed to load models:', error);
      }
    };
    loadModels();
  }, []);

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

      drawConnectors(canvasCtx, landmarks, window.FACEMESH_CONTOURS, { color: 'rgba(99, 102, 241, 0.4)', lineWidth: 1 });
      drawConnectors(canvasCtx, landmarks, window.FACEMESH_RIGHT_EYE, { color: '#10B981', lineWidth: 2 });
      drawConnectors(canvasCtx, landmarks, window.FACEMESH_LEFT_EYE, { color: '#10B981', lineWidth: 2 });

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
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00ccff', lineWidth: 2 });
      drawLandmarks(canvasCtx, landmarks, { color: '#ffffff', lineWidth: 1, radius: 2 });

      handStableRef.current += 1;
      setHandStableCount(handStableRef.current);
      if (handStableRef.current >= 40) {
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
    if (isScanningRef.current || !selectedSholat) return;
    isScanningRef.current = true;
    setIsScanning(true);
    try {
      const palmDescriptor = landmarks.flatMap(l => [l.x, l.y, l.z]);
      const response = await absensiSholatService.scanPalm(palmDescriptor, selectedSholat);
      if (response.success) {
        handleScanSuccess(response);
      }
    } catch (error) {} finally {
      setTimeout(() => { setIsScanning(false); isScanningRef.current = false; }, 3000);
    }
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

  useEffect(() => {
    if (modelsLoaded && webcamRef.current && webcamRef.current.video && activeTab === 'wajah') {
      const camera = new MediaPipeCamera(webcamRef.current.video, {
        onFrame: async () => {
          if (!webcamRef.current || !webcamRef.current.video || activeTab !== 'wajah') return;
          const normalizedCanvas = preprocessImage(webcamRef.current.video);
          if (faceMeshRef.current) await faceMeshRef.current.send({ image: normalizedCanvas });
        },
        width: 640,
        height: 480,
      });
      camera.start();
      return () => camera.stop();
    }
  }, [modelsLoaded, facingMode, activeTab]);

  const handleScanSuccess = (result) => {
    setSuccessPopup({
      visible: true,
      name: result.match.nama,
      kelas: result.match.kelas_nama || result.match.kelas || '-',
      sholat: selectedSholat,
      photo: result.match.foto_url
    });
    
    // Play sound and update feed
    const textToSpeak = `${result.match.nama} telah absen sholat ${selectedSholat}`;
    const ttsUrl = `${API_BASE}/api/tts?text=${encodeURIComponent(textToSpeak)}`;
    const audio = new Audio(ttsUrl);
    audio.play().catch(() => {
      const speech = new SpeechSynthesisUtterance(textToSpeak);
      speech.lang = 'id-ID';
      window.speechSynthesis.speak(speech);
    });

    absensiSholatService.getTodayAttendance().then(data => setRecentScans(data)).catch(() => {});

    setTimeout(() => {
      setSuccessPopup(prev => ({ ...prev, visible: false }));
      setBlinkCount(0); blinkRef.current = 0;
      isScanningRef.current = false; setIsScanning(false);
      if (activeTab === 'nfc') setTimeout(() => nfcInputRef.current?.focus(), 100);
      if (activeTab === 'fingerprint') setTimeout(() => fingerprintInputRef.current?.focus(), 100);
    }, 4000);
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
        setIsScanning(false); isScanningRef.current = false;
        return;
      }
      const descriptor = Array.from(detection.descriptor);
      const result = await absensiSholatService.scanFace(descriptor, selectedSholat);
      handleScanSuccess(result);
    } catch (error) {
      setIsScanning(false); isScanningRef.current = false;
      setBlinkCount(0); blinkRef.current = 0;
    }
  };

  useEffect(() => {
    let scanner = null;
    if (activeTab === 'qr') {
      setTimeout(() => {
        const qrElement = document.getElementById("qr-reader");
        if (!qrElement) return;
        scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
        scanner.render(async (decodedText) => {
          if (isScanningRef.current) return;
          isScanningRef.current = true; setIsScanning(true);
          try {
            const res = await fetch(`${API_BASE}/api/absensi-sholat/scan-qr`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ qrCode: decodedText, sholat: selectedSholat })
            });
            const data = await res.json();
            if (data.success) {
              scanner.pause(true);
              handleScanSuccess(data);
              setTimeout(() => scanner.resume(), 4000);
            } else {
              setTimeout(() => { isScanningRef.current = false; setIsScanning(false); }, 2000);
            }
          } catch (error) {
            setTimeout(() => { isScanningRef.current = false; setIsScanning(false); }, 2000);
          }
        }, () => {});
      }, 300);
      return () => { if (scanner) scanner.clear().catch(()=>{}); };
    }
  }, [activeTab, selectedSholat]);

  const handleNfcScan = async () => {
    if (!nfcInput || isScanningRef.current) return;
    isScanningRef.current = true; setIsScanning(true);
    try {
      const res = await fetch(`${API_BASE}/api/absensi-sholat/scan-nfc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfcUid: nfcInput, sholat: selectedSholat })
      });
      const data = await res.json();
      setNfcInput('');
      if (data.success) handleScanSuccess(data);
      else { isScanningRef.current = false; setIsScanning(false); }
    } catch (error) {
      isScanningRef.current = false; setIsScanning(false);
    }
  };

  const handleFingerprintScan = async () => {
    if (!fingerprintInput || isScanningRef.current) return;
    isScanningRef.current = true; setIsScanning(true);
    try {
      const res = await fetch(`${API_BASE}/api/absensi-sholat/scan-fingerprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprintId: fingerprintInput, sholat: selectedSholat })
      });
      const data = await res.json();
      setFingerprintInput('');
      if (data.success) handleScanSuccess(data);
      else { isScanningRef.current = false; setIsScanning(false); }
    } catch (error) {
      isScanningRef.current = false; setIsScanning(false);
    }
  };

  // Keep focus on the scanner inputs for Kiosk mode, except when modals/overlays are active
  useEffect(() => {
    if (!isPasscodeModalVisible && !successPopup.visible) {
      if (activeTab === 'nfc') {
        setTimeout(() => nfcInputRef.current?.focus(), 100);
      } else if (activeTab === 'fingerprint') {
        setTimeout(() => fingerprintInputRef.current?.focus(), 100);
      }
    }
  }, [activeTab, isPasscodeModalVisible, successPopup.visible]);

  return (
    <div className="kiosk-container">
      {/* HEADER */}
      <header className="kiosk-header">
        <div className="kiosk-header__brand">
          <ShieldCheck size={28} className="brand-icon" />
          <div className="brand-text">
            <h2>Access Control</h2>
            <span>Pesantren Al-Hamid</span>
          </div>
        </div>

        <div className="kiosk-header__center">
          <div className="prayer-selector" onClick={() => setIsPasscodeModalVisible(true)}>
            <span className="label">Sholat Aktif:</span>
            <span className="value">{selectedSholat} <Lock size={14} /></span>
          </div>
        </div>

        <div className="kiosk-header__clock">
          <div className="time">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' })}</div>
          <div className="date">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="kiosk-main">
        <div className="kiosk-scanner-section">
          <ScanMethodTabs activeTab={activeTab} onChange={setActiveTab} />
          
          <div className="kiosk-scanner-frame">
            {activeTab === 'wajah' && (
              <div className="scanner-face">
                <div className="video-container">
                  {modelsLoaded ? (
                    <>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode }}
                        className="webcam-feed"
                      />
                      <canvas ref={canvasRef} className="overlay-canvas" />
                      
                      <div className="cyber-overlay">
                        <div className="corner-tl" />
                        <div className="corner-tr" />
                        <div className="corner-bl" />
                        <div className="corner-br" />
                        
                        {isFaceDetected && !isScanning && <div className="scan-line" />}
                      </div>

                      <div className="status-indicators">
                        <div className={`status-pill ${isFaceDetected ? 'success' : 'error'}`}>
                          {isFaceDetected ? 'Target Locked' : 'Searching...'}
                        </div>
                        <div className="liveness-check">
                          <span className="label">Liveness:</span>
                          <div className="dots">
                            <div className={`dot ${blinkCount >= 1 ? 'active' : ''}`} />
                            <div className={`dot ${blinkCount >= 2 ? 'active' : ''}`} />
                          </div>
                        </div>
                      </div>

                      {isScanning && (
                        <div className="processing-overlay">
                          <RefreshCw size={48} className="spin" />
                          <span>Verifying Identity...</span>
                        </div>
                      )}

                      <button className="btn-flip" onClick={toggleCamera}><RefreshCw size={20}/></button>
                    </>
                  ) : (
                    <div className="loading-state">
                      <RefreshCw size={48} className="spin" />
                      <span>Initializing Biometric Engines...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="scanner-alt scanner-qr">
                <div id="qr-reader" className="qr-reader-container" />
                <div className="scanner-hint">
                  <QrCode size={48} />
                  <span>Posisi QR Code di tengah kotak</span>
                </div>
              </div>
            )}

            {activeTab === 'nfc' && (
              <div className="scanner-alt scanner-nfc">
                <div className="pulse-container">
                  <div className="pulse-ring ring-1" />
                  <div className="pulse-ring ring-2" />
                  <div className="nfc-icon-wrapper">
                    <Activity size={64} className="nfc-icon" />
                  </div>
                </div>
                <h3>Waiting for NFC Card</h3>
                <p>Tap your card on the reader below</p>
                <input 
                  ref={nfcInputRef}
                  value={nfcInput}
                  onChange={e => setNfcInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleNfcScan();
                  }}
                  onBlur={() => {
                    if (activeTab === 'nfc' && !isPasscodeModalVisible && !successPopup.visible) {
                      setTimeout(() => nfcInputRef.current?.focus(), 100);
                    }
                  }}
                  className="hidden-input"
                  autoFocus
                />
              </div>
            )}

            {activeTab === 'fingerprint' && (
              <div className="scanner-alt scanner-fingerprint">
                <div className="fingerprint-wrapper">
                  <Fingerprint size={120} className="finger-icon" />
                  <div className="scan-line-finger" />
                </div>
                <h3>Biometric Sensor Active</h3>
                <p>Place your finger on the scanner</p>
                <input 
                  ref={fingerprintInputRef}
                  value={fingerprintInput}
                  onChange={e => setFingerprintInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleFingerprintScan();
                  }}
                  onBlur={() => {
                    if (activeTab === 'fingerprint' && !isPasscodeModalVisible && !successPopup.visible) {
                      setTimeout(() => fingerprintInputRef.current?.focus(), 100);
                    }
                  }}
                  className="hidden-input"
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>

        <div className="kiosk-feed-section">
          <LiveActivityFeed items={recentScans.filter(s => s.sholat === selectedSholat)} maxItems={12} variant="dark" />
        </div>
      </main>

      <CustomModal
        open={isPasscodeModalVisible}
        onClose={() => { setIsPasscodeModalVisible(false); setPasscode(''); }}
        title="Otorisasi Diperlukan"
      >
        <div className="passcode-modal">
          <p>Masukkan kode akses untuk mengganti waktu sholat.</p>
          <Input.Password
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            placeholder="Kode Akses"
            size="large"
            style={{ marginBottom: '20px' }}
          />
          <div className="actions">
            <button className="btn-outline" onClick={() => { setIsPasscodeModalVisible(false); setPasscode(''); }}>Batal</button>
            <button className="btn-primary" onClick={() => {
              if (passcode === 'alhamidku123') {
                setSelectedSholat(pendingSholat);
                setIsPasscodeModalVisible(false);
                setPasscode('');
              } else {
                message.error('Kode akses salah!');
              }
            }}>Verifikasi</button>
          </div>
        </div>
      </CustomModal>

      <AttendanceSuccessOverlay
        visible={successPopup.visible}
        name={successPopup.name}
        kelas={successPopup.kelas}
        sholat={successPopup.sholat}
        photo={successPopup.photo}
        variant="dark"
        onDismiss={() => setSuccessPopup(prev => ({...prev, visible: false}))}
      />
    </div>
  );
}

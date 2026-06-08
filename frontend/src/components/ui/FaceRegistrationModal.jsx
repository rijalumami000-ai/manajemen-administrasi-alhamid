import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { ScanFace, CheckCircle2, RotateCcw } from 'lucide-react';
import { CustomModal } from './CustomModal';
import './FaceRegistrationModal.scss';

export function FaceRegistrationModal({ open, onClose, santri, onRegister, isRegistering, registerResult }) {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [angleStep, setAngleStep] = useState(0); // 0: Front, 1: Left, 2: Right
  const [capturedDescriptors, setCapturedDescriptors] = useState([]);
  const [facingMode, setFacingMode] = useState('user');

  useEffect(() => {
    if (open && !modelsLoaded) {
      const loadModels = async () => {
        try {
          const MODEL_URL = '/models';
          await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
          ]);
          setModelsLoaded(true);
        } catch (error) {
          console.error('Failed to load face models:', error);
        }
      };
      loadModels();
    }
  }, [open, modelsLoaded]);

  // Reset state when opened for a different santri
  useEffect(() => {
    if (open) {
      setAngleStep(0);
      setCapturedDescriptors([]);
    }
  }, [open, santri]);

  const toggleCamera = () => setFacingMode(prev => prev === 'user' ? 'environment' : 'user');

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

  const handleCapture = async () => {
    if (!webcamRef.current || !santri) return;

    try {
      const video = webcamRef.current.video;
      const normalizedCanvas = preprocessImage(video);

      const detection = await faceapi
        .detectSingleFace(normalizedCanvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error('Wajah tidak terdeteksi. Pastikan posisi pas dan terang.');
      }

      const descriptor = Array.from(detection.descriptor);
      const newDescriptors = [...capturedDescriptors, descriptor];
      
      if (angleStep < 2) {
        setCapturedDescriptors(newDescriptors);
        setAngleStep(prev => prev + 1);
      } else {
        // Finished all angles, call parent register
        onRegister(santri.id, newDescriptors);
      }
    } catch (err) {
      alert(err.message); // In real code, use a toast
    }
  };

  const getStepInstruction = () => {
    if (angleStep === 0) return 'Hadapkan Wajah Lurus ke Depan';
    if (angleStep === 1) return 'Tolehkan Wajah Sedikit ke Kiri';
    return 'Tolehkan Wajah Sedikit ke Kanan';
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Pendaftaran Face ID"
      subtitle={santri?.nama}
      icon={<ScanFace />}
      size="md"
      destroyOnClose
    >
      <div className="face-reg-modal">
        {registerResult?.success ? (
          <div className="success-state">
            <div className="success-icon"><CheckCircle2 size={64} /></div>
            <h3>Pendaftaran Berhasil!</h3>
            <p>Data wajah {santri?.nama} telah disimpan.</p>
            <button className="btn-secondary" onClick={onClose}>Tutup</button>
          </div>
        ) : (
          <>
            {!modelsLoaded ? (
              <div className="loading-state">
                <div className="loading-spinner large"></div>
                <p>Memuat modul AI Face Detection...</p>
              </div>
            ) : (
              <>
                <div className="camera-container">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ width: 640, height: 480, facingMode }}
                    className="webcam-feed"
                  />
                  
                  {/* Guided Frame Overlay */}
                  <div className="camera-overlay">
                    <div className="face-guide-frame">
                      <div className="corner top-left"></div>
                      <div className="corner top-right"></div>
                      <div className="corner bottom-left"></div>
                      <div className="corner bottom-right"></div>
                    </div>
                  </div>

                  <button className="btn-camera-flip" onClick={toggleCamera}>
                    <RotateCcw size={18} />
                  </button>

                  {isRegistering && (
                    <div className="processing-overlay">
                      <div className="loading-spinner"></div>
                      <span>Memproses...</span>
                    </div>
                  )}
                </div>

                {/* Progress Timeline */}
                <div className="progress-timeline">
                  {[0, 1, 2].map(step => (
                    <div key={step} className={`timeline-step ${angleStep >= step ? 'active' : ''} ${angleStep > step ? 'completed' : ''}`}>
                      <div className="step-dot"></div>
                      <span className="step-label">
                        {step === 0 ? 'Depan' : step === 1 ? 'Kiri' : 'Kanan'}
                      </span>
                    </div>
                  ))}
                  <div className="timeline-line">
                    <div className="timeline-progress" style={{ width: `${(angleStep / 2) * 100}%` }}></div>
                  </div>
                </div>

                <div className="instruction-box">
                  <h4>Tahap {angleStep + 1}/3</h4>
                  <p>{getStepInstruction()}</p>
                </div>

                <button 
                  className="btn-primary full-width" 
                  onClick={handleCapture} 
                  disabled={isRegistering}
                >
                  <ScanFace size={18} />
                  {angleStep < 2 ? 'Ambil Gambar' : 'Selesaikan Pendaftaran'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </CustomModal>
  );
}

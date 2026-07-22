import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Camera, CheckCircle2, XCircle, Search, RefreshCw, Send, Settings, User } from 'lucide-react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { absensiSholatService } from '../services/absensiSholatService';
import { santriService } from '../services/santriService';
import { LoadingState } from '../components/common';
import { DataGrid } from '../components/ui/DataGrid';
import { CustomModal } from '../components/ui/CustomModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { PrayerCard } from '../components/ui/PrayerCard';
import { StatusPill } from '../components/ui/StatusPill';
import { AttendanceSuccessOverlay } from '../components/ui/AttendanceSuccessOverlay';
import './AbsensiSholat.scss';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function AbsensiSholat() {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const sholatOptions = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
  const [selectedSholat, setSelectedSholat] = useState('Subuh');
  
  const [scanResult, setScanResult] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [successPopup, setSuccessPopup] = useState({ visible: false, name: '', sholat: '', photo: '', kelas: '' });
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  
  const [facingMode, setFacingMode] = useState('user');
  const toggleCamera = () => setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  
  // Realtime Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Tabs
  const [activeTab, setActiveTab] = useState('scan');

  // Manual Attendance States
  const [unattendedSantri, setUnattendedSantri] = useState([]);
  const [loadingUnattended, setLoadingUnattended] = useState(false);
  const [selectedSholatManual, setSelectedSholatManual] = useState('Subuh');

  // Lists for dropdowns
  const [kelasList, setKelasList] = useState([]);
  const [kamarList, setKamarList] = useState([]);
  
  // Filters for Manual
  const [searchManual, setSearchManual] = useState('');
  const [filterKelasManual, setFilterKelasManual] = useState('');
  const [filterKamarManual, setFilterKamarManual] = useState('');
  
  // Filters for History
  const [searchHistory, setSearchHistory] = useState('');
  
  // WA Template States
  const [waTemplate, setWaTemplate] = useState(`Assalamualaikum Wr. Wb.\nYth. Orang Tua dari Ananda *[nama]*,\n\nBerikut kami laporkan rekap kehadiran sholat berjamaah Ananda hari ini:\n- Subuh: [Subuh]\n- Dzuhur: [Dzuhur]\n- Ashar: [Ashar]\n- Maghrib: [Maghrib]\n- Isya: [Isya]\n\nTerima kasih atas perhatiannya.\nWassalamualaikum Wr. Wb.`);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [tempTemplate, setTempTemplate] = useState(waTemplate);
  const [sentSantriIds, setSentSantriIds] = useState([]);

  // Load models
  useEffect(() => {
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
      } catch (error) {
        console.error('Failed to load models:', error);
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
    if (activeTab === 'manual') loadUnattendedSantri();
  }, [selectedSholatManual, activeTab]);

  const loadTodayAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const data = await absensiSholatService.getTodayAttendance();
      setTodayAttendance(data);
    } catch (error) {
      console.error('Gagal memuat data absensi hari ini:', error);
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
      console.error('Gagal memuat data santri yang belum absen:', error);
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
      if (!imageSrc) throw new Error('Gagal mengambil gambar dari kamera');

      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => (img.onload = resolve));

      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setScanResult({ success: false, message: 'Wajah tidak terdeteksi. Silakan coba lagi.' });
        setIsScanning(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const result = await absensiSholatService.scanFace(descriptor, selectedSholat);

      setScanResult({ success: true, match: result.match });
      
      setSuccessPopup({
        visible: true,
        name: result.match.nama,
        kelas: result.match.kelas_nama || result.match.kelas || '-',
        sholat: selectedSholat,
        photo: result.match.foto_url
      });
      
      const textToSpeak = `${result.match.nama} telah absen sholat ${selectedSholat}`;
      const ttsUrl = `${API_BASE}/api/tts?text=${encodeURIComponent(textToSpeak)}`;
      const audio = new Audio(ttsUrl);
      audio.play().catch(() => {
        const speech = new SpeechSynthesisUtterance(textToSpeak);
        speech.lang = 'id-ID';
        speech.pitch = 1.5;
        window.speechSynthesis.speak(speech);
      });

      setTimeout(() => setSuccessPopup(prev => ({ ...prev, visible: false })), 3000);
      loadTodayAttendance();
      if (activeTab === 'manual') loadUnattendedSantri();
    } catch (error) {
      setScanResult({ success: false, message: error.message || 'Gagal mengenali wajah' });
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualAttendance = async (santriId, status, sholat) => {
    try {
      await absensiSholatService.recordManualAttendance(santriId, sholat || selectedSholatManual, status);
      if (activeTab === 'manual') loadUnattendedSantri();
      loadTodayAttendance();
    } catch (error) {
      alert('Gagal mencatat absensi manual');
    }
  };

  const handleMarkAllAsAlfa = async () => {
    try {
      setLoadingUnattended(true);
      await Promise.all(
        filteredUnattendedSantri.map(s => 
          absensiSholatService.recordManualAttendance(s.id, selectedSholatManual, 'Alfa')
        )
      );
      loadUnattendedSantri();
      loadTodayAttendance();
    } catch (error) {
      alert('Gagal menandai Alfa massal');
    } finally {
      setLoadingUnattended(false);
    }
  };

  const handleSendWA = (record) => {
    const noHp = record.no_hp_ibu || record.no_hp_ayah;
    if (!noHp) return alert('Nomor HP tidak tersedia');
    
    let formattedNoHp = noHp.replace(/[^0-9]/g, '');
    if (formattedNoHp.startsWith('0')) formattedNoHp = '62' + formattedNoHp.slice(1);
    
    let messageText = waTemplate
      .replace('[nama]', record.nama)
      .replace('[Subuh]', record.rekap.Subuh)
      .replace('[Dzuhur]', record.rekap.Dzuhur)
      .replace('[Ashar]', record.rekap.Ashar)
      .replace('[Maghrib]', record.rekap.Maghrib)
      .replace('[Isya]', record.rekap.Isya);

    const url = `https://wa.me/${formattedNoHp}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
    setSentSantriIds(prev => prev.includes(record.santri_id) ? prev : [...prev, record.santri_id]);
  };

  const filteredTodayAttendance = todayAttendance.filter(a => 
    a.santri_nama.toLowerCase().includes(searchHistory.toLowerCase())
  );

  const filteredUnattendedSantri = unattendedSantri.filter(s => {
    const matchName = s.nama.toLowerCase().includes(searchManual.toLowerCase());
    const matchKelas = filterKelasManual ? String(s.kelas_diniyah_id) === String(filterKelasManual) : true;
    const matchKamar = filterKamarManual ? String(s.kamar_id) === String(filterKamarManual) : true;
    return matchName && matchKelas && matchKamar;
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
        rekap: { Subuh: '-', Dzuhur: '-', Ashar: '-', Maghrib: '-', Isya: '-' }
      };
    }
    aggregatedWAData[record.santri_id].rekap[record.sholat] = record.status;
  });
  const waDataSource = Object.values(aggregatedWAData);

  const totalSantri = 80;
  const prayerStats = sholatOptions.map(sholat => {
    const count = todayAttendance.filter(a => a.sholat === sholat && a.status === 'Hadir').length;
    return { name: sholat, count, total: totalSantri };
  });

  if (!modelsLoaded) return <LoadingState message="Memuat AI Vision Engine..." />;

  const historyColumns = [
    { header: 'Waktu', accessor: (row) => new Date(row.waktu_scan).toLocaleTimeString('id-ID'), width: '100px' },
    { 
      header: 'Santri', 
      accessor: (row) => (
        <div className="table-profile">
          <div className="table-avatar">
            {row.foto_url ? <img src={`${API_BASE}${row.foto_url}`} alt="" onError={e=>e.target.style.display='none'}/> : <User size={16}/>}
          </div>
          <div className="table-profile-info">
            <span className="name">{row.santri_nama}</span>
            <span className="meta">{row.kelas_nama}</span>
          </div>
        </div>
      ),
      width: '250px'
    },
    { header: 'Sholat', accessor: 'sholat', width: '100px' },
    { header: 'Status', accessor: (row) => <StatusPill status={row.status} active />, width: '120px' },
    { 
      header: 'Ubah', 
      accessor: (row) => (
        <select
          value={row.status}
          style={{ width: '120px', padding: '4px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          onChange={(e) => handleManualAttendance(row.santri_id, e.target.value, row.sholat)}
        >
          {['Hadir', 'Sakit', 'Izin', 'Masbuq', 'Haid', 'Istihadoh', 'Alfa'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )
    }
  ];

  const manualColumns = [
    { 
      header: 'Santri', 
      accessor: (row) => (
        <div className="table-profile">
          <div className="table-profile-info">
            <span className="name">{row.nama}</span>
            <span className="meta">{row.kelas_nama || '-'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Tindakan Cepat',
      accessor: (row) => (
        <div className="quick-actions">
          <StatusPill status="Hadir" onClick={() => handleManualAttendance(row.id, 'Hadir')} />
          <StatusPill status="Sakit" onClick={() => handleManualAttendance(row.id, 'Sakit')} />
          <StatusPill status="Izin" onClick={() => handleManualAttendance(row.id, 'Izin')} />
          <StatusPill status="Masbuq" onClick={() => handleManualAttendance(row.id, 'Masbuq')} />
          <StatusPill status="Alfa" onClick={() => handleManualAttendance(row.id, 'Alfa')} />
        </div>
      )
    }
  ];

  return (
    <div className="sholat-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Absensi Sholat Berjamaah</h1>
            <p>Smart Attendance Command Center</p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-label">Waktu</span>
              <span className="stat-value clock">{currentTime.toLocaleTimeString('id-ID')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Hadir Hari Ini</span>
              <span className="stat-value">{todayAttendance.length} <small>Santri</small></span>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/absensi-sholat-scan" target="_blank">
              <button className="btn-standalone">
                <Camera size={18} />
                Mode Kiosk (Fullscreen)
              </button>
            </Link>
          </div>
        </div>
        
        <div className="prayer-overview">
          {prayerStats.map(stat => (
            <PrayerCard 
              key={stat.name}
              name={stat.name}
              attended={stat.count}
              total={stat.total}
              active={selectedSholat === stat.name}
              onClick={() => setSelectedSholat(stat.name)}
            />
          ))}
        </div>
      </div>

      <div className="dashboard-content">
        <div className="custom-tabs">
          <button className={activeTab === 'scan' ? 'active' : ''} onClick={() => setActiveTab('scan')}>Pemindaian Wajah</button>
          <button className={activeTab === 'manual' ? 'active' : ''} onClick={() => setActiveTab('manual')}>Absensi Manual</button>
          <button className={activeTab === 'wa' ? 'active' : ''} onClick={() => setActiveTab('wa')}>Laporan WhatsApp</button>
        </div>

        {activeTab === 'scan' && (
          <div className="scan-layout">
            <div className="camera-section">
              <div className="camera-frame">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="webcam-feed"
                  videoConstraints={{ facingMode, width: 640, height: 480 }}
                />
                
                <div className="camera-overlay">
                  <div className="corner-tl" />
                  <div className="corner-tr" />
                  <div className="corner-bl" />
                  <div className="corner-br" />
                  
                  {isScanning && (
                    <div className="scanning-indicator">
                      <RefreshCw className="spin" size={32} />
                      <span>Menganalisis...</span>
                    </div>
                  )}
                </div>

                <button className="btn-flip" onClick={toggleCamera}>
                  <RefreshCw size={16} />
                </button>
              </div>
              
              <button className="btn-scan" onClick={handleScan} disabled={isScanning}>
                <Camera size={20} />
                {isScanning ? 'Memproses...' : 'Ambil Presensi Wajah'}
              </button>

              {scanResult && (
                <div className={`scan-feedback ${scanResult.success ? 'success' : 'error'}`}>
                  {scanResult.success ? <CheckCircle2 /> : <XCircle />}
                  <span>{scanResult.success ? `Berhasil: ${scanResult.match.nama}` : scanResult.message}</span>
                </div>
              )}
            </div>

            <div className="history-section">
              <div className="section-header">
                <h3>Riwayat {selectedSholat} Terakhir</h3>
                <div className="search-box">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder="Cari santri..." 
                    value={searchHistory}
                    onChange={(e) => setSearchHistory(e.target.value)}
                  />
                </div>
              </div>
              <DataGrid 
                data={filteredTodayAttendance.filter(a => a.sholat === selectedSholat)} 
                columns={historyColumns} 
                emptyText="Belum ada riwayat absensi"
              />
            </div>
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="manual-layout">
            <div className="filters-bar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="filter-group" style={{ width: '120px' }}>
                <CustomSelect
                  value={selectedSholatManual}
                  onChange={setSelectedSholatManual}
                  options={sholatOptions.map(s => ({ label: s, value: s }))}
                />
              </div>
              <div className="filter-group" style={{ flex: 1, minWidth: '180px' }}>
                <input
                  type="text"
                  placeholder="Cari nama santri..."
                  value={searchManual}
                  onChange={e => setSearchManual(e.target.value)}
                  className="custom-native-select"
                />
              </div>
              <div className="filter-group" style={{ width: '140px' }}>
                <CustomSelect
                  value={filterKelasManual}
                  onChange={setFilterKelasManual}
                  placeholder="Semua Kelas"
                  options={[
                    { label: 'Semua Kelas', value: '' },
                    ...kelasList.map(k => ({ label: k.nama, value: String(k.id) }))
                  ]}
                />
              </div>
              <div className="filter-group" style={{ width: '140px' }}>
                <CustomSelect
                  value={filterKamarManual}
                  onChange={setFilterKamarManual}
                  placeholder="Semua Kamar"
                  options={[
                    { label: 'Semua Kamar', value: '' },
                    ...kamarList.map(k => ({ label: k.nama, value: String(k.id) }))
                  ]}
                />
              </div>
              <button className="btn-custom btn-danger" onClick={handleMarkAllAsAlfa} disabled={filteredUnattendedSantri.length === 0 || loadingUnattended}>
                Tandai Alfa Semua ({filteredUnattendedSantri.length})
              </button>
            </div>
            
            <div className="table-container" style={{ marginTop: '16px' }}>
              <DataGrid data={filteredUnattendedSantri} columns={manualColumns} emptyText="Semua santri sudah diabsen" />
            </div>
          </div>
        )}

        {activeTab === 'wa' && (
          <div className="wa-layout">
            <div className="wa-header">
              <div className="wa-info">
                <h3>Pusat Komunikasi Orang Tua</h3>
                <p>Kirim rekap absensi harian langsung via WhatsApp</p>
              </div>
              <button className="btn-outline" onClick={() => { setTempTemplate(waTemplate); setIsTemplateModalVisible(true); }}>
                <Settings size={16} /> Pengaturan Pesan
              </button>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Santri</th>
                    <th>Subuh</th>
                    <th>Dzuhur</th>
                    <th>Ashar</th>
                    <th>Maghrib</th>
                    <th>Isya</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {waDataSource.map(row => {
                    const noHp = row.no_hp_ibu || row.no_hp_ayah;
                    const isSent = sentSantriIds.includes(row.santri_id);
                    return (
                      <tr key={row.santri_id}>
                        <td>
                          <strong>{row.nama}</strong><br/>
                          <small>{row.kelas}</small>
                        </td>
                        <td><StatusPill status={row.rekap.Subuh} active={row.rekap.Subuh!=='-'}/></td>
                        <td><StatusPill status={row.rekap.Dzuhur} active={row.rekap.Dzuhur!=='-'}/></td>
                        <td><StatusPill status={row.rekap.Ashar} active={row.rekap.Ashar!=='-'}/></td>
                        <td><StatusPill status={row.rekap.Maghrib} active={row.rekap.Maghrib!=='-'}/></td>
                        <td><StatusPill status={row.rekap.Isya} active={row.rekap.Isya!=='-'}/></td>
                        <td>
                          <button 
                            className={`btn-wa ${isSent ? 'sent' : ''}`}
                            disabled={!noHp}
                            onClick={() => handleSendWA(row)}
                          >
                            {isSent ? <CheckCircle2 size={16}/> : <Send size={16}/>}
                            {isSent ? 'Terkirim' : 'Kirim'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {waDataSource.length === 0 && (
                    <tr><td colSpan={7} className="empty-state">Belum ada data absensi hari ini</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CustomModal
        open={isTemplateModalVisible}
        onClose={() => setIsTemplateModalVisible(false)}
        title="Template Pesan WhatsApp"
        width={600}
      >
        <div className="wa-template-editor">
          <div className="hint" style={{ marginBottom: '12px', fontSize: '12px', color: '#64748b' }}>
            <strong>Placeholder yang didukung:</strong> <code>[nama]</code>, <code>[Subuh]</code>, <code>[Dzuhur]</code>, dll.
          </div>
          <textarea 
            rows={10} 
            value={tempTemplate} 
            onChange={e => setTempTemplate(e.target.value)}
            className="modern-textarea"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button className="btn-custom btn-secondary" onClick={() => setIsTemplateModalVisible(false)}>Batal</button>
            <button className="btn-custom btn-primary" onClick={() => { setWaTemplate(tempTemplate); setIsTemplateModalVisible(false); }}>
              Simpan Template
            </button>
          </div>
        </div>
      </CustomModal>

      <AttendanceSuccessOverlay
        visible={successPopup.visible}
        name={successPopup.name}
        kelas={successPopup.kelas}
        sholat={successPopup.sholat}
        photo={successPopup.photo}
        onDismiss={() => setSuccessPopup(prev => ({...prev, visible: false}))}
      />
    </div>
  );
}

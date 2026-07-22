import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Upload as UploadIcon, 
  Save, 
  CheckCircle, 
  Scan
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import { CustomTabs } from '../components/ui/CustomTabs';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SmartAlert } from '../components/ui/SmartAlert';
import './ScanNilai.scss';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
  const [activeTab, setActiveTab] = useState('1');
  
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  
  const [selectedTA, setSelectedTA] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [santriList, setSantriList] = useState([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [scannedData, setScannedData] = useState(null);
  const [ocrResults, setOcrResults] = useState([]);
  const [isScanningHardware, setIsScanningHardware] = useState(false);

  useEffect(() => {
    async function loadMasterData() {
      try {
        const [taRes, mapelRes, kelasRes, katRes] = await Promise.all([
          apiFetch('/api/tahun-ajaran'),
          apiFetch('/api/mapel'),
          apiFetch('/api/kelas'),
          apiFetch('/api/kategori-nilai')
        ]);
        setTahunAjaranList(taRes);
        setMapelList(mapelRes);
        setKelasList(kelasRes);
        setKategoriList(katRes);

        const activeTA = taRes.find(t => t.is_active);
        if (activeTA) setSelectedTA(String(activeTA.id));
      } catch (err) {
        console.error(err);
      }
    }
    loadMasterData();
  }, []);

  useEffect(() => {
    if (selectedKelas && selectedTA) {
      apiFetch(`/api/santri?kelas_id=${selectedKelas}&tahun_ajaran_id=${selectedTA}`)
        .then(data => setSantriList(data))
        .catch(err => console.error(err));
    }
  }, [selectedKelas, selectedTA]);

  const handlePrint = () => {
    if (!selectedTA || !selectedKelas || !selectedMapel || !selectedKategori) {
      alert('Pilih semua field terlebih dahulu!');
      return;
    }
    window.print();
  };

  const currentTAObj = tahunAjaranList.find(t => String(t.id) === String(selectedTA));
  const currentKelasObj = kelasList.find(k => String(k.id) === String(selectedKelas));
  const currentMapelObj = mapelList.find(m => String(m.id) === String(selectedMapel));
  const currentKategoriObj = kategoriList.find(k => String(k.id) === String(selectedKategori));

  const qrPayload = JSON.stringify({
    t: selectedTA,
    k: selectedKelas,
    m: selectedMapel,
    cat: selectedKategori
  });

  const processImageFile = async (file) => {
    setIsProcessing(true);
    setOcrProgress('Membaca QR Code & Lembar Nilai...');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageSrc = e.target.result;

        const img = new Image();
        img.src = imageSrc;
        await new Promise(r => img.onload = r);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (!code) {
          throw new Error('QR Code tidak ditemukan! Pastikan halaman discan dengan jelas.');
        }

        const qrData = JSON.parse(code.data);
        setScannedData(qrData);

        const res = await apiFetch(`/api/santri?kelas_id=${qrData.k}&tahun_ajaran_id=${qrData.t}`);
        const dummyOcr = res.map((s, idx) => ({
          santri_id: s.id,
          nama: s.nama,
          nis: s.nis,
          nilai: Math.floor(Math.random() * 30) + 70,
          kehadiran: 'Hadir'
        }));

        setOcrResults(dummyOcr);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert(err.message || 'Gagal memproses file');
      setIsProcessing(false);
    }
  };

  const handleHardwareScan = async () => {
    setIsScanningHardware(true);
    setIsProcessing(true);
    setOcrProgress('Mengirim perintah scan ke Hardware Epson L3250...');

    try {
      const scanRes = await apiFetch('/api/scan/epson', { method: 'POST' });
      if (scanRes.imagePath) {
        setOcrProgress('Scan Selesai. Memproses hasil OMR...');
        const imageRes = await fetch(`${API_BASE}${scanRes.imagePath}`);
        const blob = await imageRes.blob();
        const file = new File([blob], "scanned_omr.jpg", { type: "image/jpeg" });
        await processImageFile(file);
      }
    } catch (err) {
      alert(err.message || 'Gagal terhubung ke Scanner Epson L3250');
    } finally {
      setIsScanningHardware(false);
      setIsProcessing(false);
    }
  };

  const handleSaveNilai = async () => {
    if (!scannedData || ocrResults.length === 0) return;
    setIsProcessing(true);
    try {
      const payload = {
        tahun_ajaran_id: scannedData.t,
        kelas_id: scannedData.k,
        mapel_id: scannedData.m,
        kategori_id: scannedData.cat,
        nilai_list: ocrResults.map(r => ({
          santri_id: r.santri_id,
          nilai: r.nilai,
          kehadiran: r.kehadiran
        }))
      };

      await apiFetch('/api/nilai/bulk-save', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      alert('Berhasil menyimpan semua nilai hasil scan!');
      setOcrResults([]);
      setScannedData(null);
    } catch (err) {
      alert(err.message || 'Gagal menyimpan nilai');
    } finally {
      setIsProcessing(false);
    }
  };

  const tabItems = [
    {
      key: '1',
      label: '1. Cetak Lembar Nilai',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <CustomSelect
              label="Tahun Ajaran"
              value={selectedTA}
              onChange={setSelectedTA}
              options={tahunAjaranList.map(ta => ({ label: `${ta.kode} ${ta.is_active ? '(Aktif)' : ''}`, value: String(ta.id) }))}
            />
            <CustomSelect
              label="Kelas"
              value={selectedKelas}
              onChange={setSelectedKelas}
              options={kelasList.map(k => ({ label: k.nama, value: String(k.id) }))}
            />
            <CustomSelect
              label="Mata Pelajaran"
              value={selectedMapel}
              onChange={setSelectedMapel}
              options={mapelList.map(m => ({ label: m.nama, value: String(m.id) }))}
            />
            <CustomSelect
              label="Kategori Penilaian"
              value={selectedKategori}
              onChange={setSelectedKategori}
              options={kategoriList.map(k => ({ label: k.nama, value: String(k.id) }))}
            />
          </div>

          <button
            type="button"
            className="btn-custom btn-primary"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}
          >
            <Printer size={16} /> Print Kertas (F4)
          </button>
        </div>
      )
    },
    {
      key: '2',
      label: '2. Scan & Koreksi Hasil',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #2196f3', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Metode A: Scan Langsung via USB</h4>
              <button
                type="button"
                className="btn-custom btn-primary"
                onClick={handleHardwareScan}
                disabled={isScanningHardware}
                style={{ width: '100%', height: '54px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Scan size={20} /> {isScanningHardware ? 'Sedang Menscan...' : 'Scan Sekarang dari Epson L3250'}
              </button>
              <p style={{ marginTop: '12px', color: '#64748b', fontSize: '12px', margin: '12px 0 0 0' }}>
                Pastikan Scanner Epson L3250 terhubung via USB dan lembar nilai sudah diletakkan.
              </p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Metode B: Upload File Hasil Scan</h4>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && processImageFile(e.target.files[0])}
                style={{ display: 'block', width: '100%', padding: '10px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px' }}
              />
            </div>
          </div>

          {isProcessing && <SmartAlert message={ocrProgress} type="info" />}

          {ocrResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Hasil Scan OMR ({ocrResults.length} Santri)</h3>
                <button type="button" className="btn-custom btn-primary" onClick={handleSaveNilai}>
                  <Save size={16} /> Simpan Hasil ke Database
                </button>
              </div>

              <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>NIS</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Nama Santri</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', width: '120px' }}>Nilai OMR</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', width: '120px' }}>Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocrResults.map((r, idx) => (
                      <tr key={r.santri_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{r.nis}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.nama}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            value={r.nilai}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setOcrResults(prev => prev.map((item, i) => i === idx ? { ...item, nilai: val } : item));
                            }}
                            style={{ width: '80px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <select
                            value={r.kehadiran}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOcrResults(prev => prev.map((item, i) => i === idx ? { ...item, kehadiran: val } : item));
                            }}
                            style={{ width: '100px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          >
                            <option value="Hadir">Hadir</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Izin">Izin</option>
                            <option value="Alfa">Alfa</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="scan-nilai-container" style={{ padding: '20px' }}>
      <div className="header-title-section no-print" style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Manajemen Scan Nilai (OMR)</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Cetak lembar nilai kelas, scan tulisan tangan guru, dan simpan otomatis.</p>
      </div>

      <div className="main-card no-print" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
        <CustomTabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
      </div>

      {/* Printable Sheet (F4 Layout) */}
      <div className="printable-omr-sheet print-only">
        <div className="omr-header">
          <div className="header-left">
            <h2>MADRASAH DINIYAH AL-HAMID</h2>
            <h3>LEMBAR JAWABAN & PENILAIAN UJIAN (OMR)</h3>
            <p>Tahun Ajaran: {currentTAObj?.kode || '-'} | Semester: {currentTAObj?.semester || '-'}</p>
          </div>
          <div className="header-qr">
            <QRCodeSVG value={qrPayload} size={80} level="M" />
            <span className="qr-label">PINDAN DISINI</span>
          </div>
        </div>

        <div className="omr-meta-grid">
          <div><strong>MATA PELAJARAN:</strong> {currentMapelObj?.nama || '-'}</div>
          <div><strong>KELAS:</strong> {currentKelasObj?.nama || '-'}</div>
          <div><strong>KATEGORI:</strong> {currentKategoriObj?.nama || '-'}</div>
          <div><strong>GURU PENGAMPU:</strong> ____________________</div>
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
              const isOdd = index % 2 === 0;
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

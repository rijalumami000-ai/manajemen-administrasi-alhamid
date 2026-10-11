import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Printer, 
  Upload as UploadIcon, 
  Save, 
  CheckCircle, 
  Scan,
  Camera,
  AlertCircle,
  RefreshCw,
  Eye,
  FileText,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import Webcam from 'react-webcam';
import { CustomTabs } from '../components/ui/CustomTabs';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SmartAlert } from '../components/ui/SmartAlert';
import { nilaiService } from '../services/nilaiService';
import { getPredikat } from '../utils/terbilang';
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
    throw new Error(err.error || err.message || `Request gagal (${res.status})`);
  }
  return res.json();
}

export function ScanNilai() {
  const [activeTab, setActiveTab] = useState('1');
  
  // Master data
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [masterLoading, setMasterLoading] = useState(true);
  
  // Selection
  const [selectedTA, setSelectedTA] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [mapelTingkat, setMapelTingkat] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [loadingSantri, setLoadingSantri] = useState(false);

  // Tab 1: Preview sheet on screen
  const [showScreenPreview, setShowScreenPreview] = useState(false);
  
  // Tab 2: Scanning & OCR State
  const [scanMethod, setScanMethod] = useState('upload'); // 'upload' | 'camera' | 'hardware'
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [statusAlert, setStatusAlert] = useState(null); // { type, message }
  const [scannedData, setScannedData] = useState(null);
  const [ocrResults, setOcrResults] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Camera state
  const webcamRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Load Master Data
  useEffect(() => {
    async function loadMasterData() {
      try {
        setMasterLoading(true);
        const [taRes, mapelRes, kelasRes, katRes] = await Promise.all([
          nilaiService.fetchTahunAjaran().catch(() => []),
          nilaiService.fetchMataPelajaran().catch(() => []),
          nilaiService.fetchKelas().catch(() => []),
          nilaiService.fetchKategori().catch(() => [])
        ]);

        const validTAs = Array.isArray(taRes) ? taRes : [];
        const validMapels = Array.isArray(mapelRes) ? mapelRes : [];
        const validClasses = Array.isArray(kelasRes) 
          ? kelasRes.filter(k => k.jenis === 'Diniyah' || !k.jenis).map(k => {
              if (k.nama === 'SP' && k.tingkat === 1) return { ...k, tingkat: 99 };
              return k;
            })
          : [];
        const validKats = Array.isArray(katRes) ? katRes : [];

        setTahunAjaranList(validTAs);
        setMapelList(validMapels);
        setKelasList(validClasses);
        setKategoriList(validKats);

        const activeTA = validTAs.find(t => t.is_active);
        if (activeTA) setSelectedTA(String(activeTA.id));
        else if (validTAs.length > 0) setSelectedTA(String(validTAs[0].id));

        if (validClasses.length > 0) setSelectedKelas(String(validClasses[0].id));
        if (validMapels.length > 0) setSelectedMapel(String(validMapels[0].id));
        if (validKats.length > 0) setSelectedKategori(String(validKats[0].id));
      } catch (err) {
        console.error('Error loading master data in ScanNilai:', err);
        setStatusAlert({ type: 'error', message: 'Gagal memuat master data akademis. Periksa koneksi.' });
      } finally {
        setMasterLoading(false);
      }
    }
    loadMasterData();
  }, []);

  // Fetch Santri when Kelas or Tahun Ajaran changes
  useEffect(() => {
    if (selectedKelas && selectedTA) {
      setLoadingSantri(true);
      apiFetch(`/api/santri?kelas_id=${selectedKelas}&tahun_ajaran_id=${selectedTA}`)
        .then(data => {
          setSantriList(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          console.error('Gagal mengambil santri:', err);
          setSantriList([]);
        })
        .finally(() => setLoadingSantri(false));
    } else {
      setSantriList([]);
    }
  }, [selectedKelas, selectedTA]);

  // Fetch mapel tingkat aktif untuk tahun ajaran dan semester (kategori) terpilih
  useEffect(() => {
    if (selectedTA && selectedKategori) {
      nilaiService.fetchMapelTingkat(selectedTA, selectedKategori)
        .then(data => {
          setMapelTingkat(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          console.error('Gagal mengambil mapel tingkat:', err);
          setMapelTingkat([]);
        });
    } else {
      setMapelTingkat([]);
    }
  }, [selectedTA, selectedKategori]);

  const currentTAObj = tahunAjaranList.find(t => String(t.id) === String(selectedTA));
  const currentKelasObj = kelasList.find(k => String(k.id) === String(selectedKelas));

  // Filter mapel yang benar-benar aktif untuk tingkat/kelas di tahun ajaran & semester terpilih
  const filteredMapelList = useMemo(() => {
    if (!mapelList || mapelList.length === 0) return [];
    if (!selectedKelas || !currentKelasObj) return mapelList;

    const tingkat = currentKelasObj.tingkat;

    // Ambil ID mapel yang aktif untuk tingkat ini di semester terpilih
    const activeMapelIds = mapelTingkat
      .filter(mt => Number(mt.tingkat) === Number(tingkat))
      .map(mt => mt.mata_pelajaran_id);

    // Mapel Reguler aktif
    const regulerAktif = mapelList.filter(m => m.jenis === 'Reguler' && activeMapelIds.includes(m.id));

    // Mapel Ujian Khusus (Muhafadzoh Akbar, Qiroatul Kitab, Taftisyul Kutub)
    const khususAktif = mapelList.filter(m => 
      ['Muhafadzoh', 'Qiroah', 'Taftisy'].includes(m.jenis) && !m.nama?.toLowerCase().includes('mini')
    );

    const combined = [...regulerAktif, ...khususAktif];
    return combined.length > 0 ? combined : regulerAktif;
  }, [mapelList, mapelTingkat, selectedKelas, currentKelasObj]);

  // Otomatis sesuaikan selectedMapel jika mapel terpilih saat ini tidak ada di daftar aktif kelas
  useEffect(() => {
    if (filteredMapelList.length > 0) {
      const isCurrentValid = filteredMapelList.some(m => String(m.id) === String(selectedMapel));
      if (!isCurrentValid) {
        setSelectedMapel(String(filteredMapelList[0].id));
      }
    } else {
      setSelectedMapel('');
    }
  }, [filteredMapelList, selectedMapel]);

  const currentMapelObj = mapelList.find(m => String(m.id) === String(selectedMapel));
  const currentKategoriObj = kategoriList.find(k => String(k.id) === String(selectedKategori));

  const qrPayload = useMemo(() => {
    return JSON.stringify({
      t: selectedTA,
      k: selectedKelas,
      m: selectedMapel,
      cat: selectedKategori
    });
  }, [selectedTA, selectedKelas, selectedMapel, selectedKategori]);

  const handlePrint = () => {
    if (!selectedTA || !selectedKelas || !selectedMapel || !selectedKategori) {
      alert('Pilih Tahun Ajaran, Kelas, Mata Pelajaran, dan Kategori terlebih dahulu!');
      return;
    }
    window.print();
  };

  // Helper: Decode QR code with multiple attempts (scaled, rotated, high contrast)
  const decodeQRCodeFromCanvas = (canvas) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Attempt 1: Raw image
    const rawData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let code = jsQR(rawData.data, rawData.width, rawData.height);
    if (code) return { code, canvas };

    // Attempt 2: Resize if huge
    if (canvas.width > 1600 || canvas.height > 1600) {
      const scale = 1400 / Math.max(canvas.width, canvas.height);
      const sc = document.createElement('canvas');
      sc.width = Math.round(canvas.width * scale);
      sc.height = Math.round(canvas.height * scale);
      const scCtx = sc.getContext('2d', { willReadFrequently: true });
      scCtx.drawImage(canvas, 0, 0, sc.width, sc.height);
      const scData = scCtx.getImageData(0, 0, sc.width, sc.height);
      code = jsQR(scData.data, scData.width, scData.height);
      if (code) return { code, canvas: sc };
    }

    // Attempt 3: Rotations (90, 180, 270)
    for (const deg of [90, 180, 270]) {
      const rot = document.createElement('canvas');
      const rCtx = rot.getContext('2d', { willReadFrequently: true });
      if (deg === 90 || deg === 270) {
        rot.width = canvas.height;
        rot.height = canvas.width;
      } else {
        rot.width = canvas.width;
        rot.height = canvas.height;
      }
      rCtx.translate(rot.width / 2, rot.height / 2);
      rCtx.rotate((deg * Math.PI) / 180);
      rCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      const rData = rCtx.getImageData(0, 0, rot.width, rot.height);
      code = jsQR(rData.data, rData.width, rData.height);
      if (code) return { code, canvas: rot };
    }

    return { code: null, canvas };
  };

  // Main OMR image recognition pipeline
  const processImageSource = async (imageSrc) => {
    setIsProcessing(true);
    setStatusAlert(null);
    setOcrProgress('Memuat gambar & membaca QR Code lembar ujian...');

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Gagal memuat berkas gambar.'));
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      setOcrProgress('Menganalisis QR Code metadata...');
      const { code, canvas: activeCanvas } = decodeQRCodeFromCanvas(canvas);

      let parsedMeta = null;
      if (code && code.data) {
        try {
          parsedMeta = JSON.parse(code.data);
        } catch (_) {}
      }

      // If QR code is found, extract target metadata
      let targetTA = parsedMeta?.t || selectedTA;
      let targetKelas = parsedMeta?.k || selectedKelas;
      let targetMapel = parsedMeta?.m || selectedMapel;
      let targetKat = parsedMeta?.cat || selectedKategori;

      if (!parsedMeta) {
        setStatusAlert({
          type: 'warning',
          message: 'QR Code tidak terdeteksi otomatis pada foto. Memproses menggunakan Kelas & Mapel yang dipilih saat ini.'
        });
      }

      setOcrProgress('Mengambil data santri kelas dari server...');
      const students = await apiFetch(`/api/santri?kelas_id=${targetKelas}&tahun_ajaran_id=${targetTA}`).catch(() => []);
      
      if (!Array.isArray(students) || students.length === 0) {
        throw new Error('Tidak ada data santri ditemukan untuk kelas ini. Pastikan kelas dan tahun ajaran tepat.');
      }

      // Computer Vision OMR Bubble Detection on Canvas via Line Projection
      setOcrProgress('Menganalisis kisi tabel dan mendeteksi bulatan nilai OMR...');
      
      const width = activeCanvas.width;
      const height = activeCanvas.height;
      const actCtx = activeCanvas.getContext('2d', { willReadFrequently: true });
      const imgData = actCtx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // 1. Darkness map (binary)
      const isDark = new Uint8Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          if (gray < 165) isDark[y * width + x] = 1;
        }
      }

      // 2. Vertical line projection across middle height to find table column dividers
      const sampleYStart = Math.floor(height * 0.25);
      const sampleYEnd = Math.floor(height * 0.85);
      const sampleH = Math.max(1, sampleYEnd - sampleYStart);

      const vProj = new Float32Array(width);
      for (let x = 0; x < width; x++) {
        let darkCount = 0;
        for (let y = sampleYStart; y < sampleYEnd; y++) {
          if (isDark[y * width + x]) darkCount++;
        }
        vProj[x] = darkCount / sampleH;
      }

      const vLines = [];
      let currVCluster = [];
      for (let x = 0; x < width; x++) {
        if (vProj[x] > 0.35) {
          currVCluster.push(x);
        } else if (currVCluster.length > 0) {
          vLines.push(Math.round(currVCluster.reduce((a, b) => a + b, 0) / currVCluster.length));
          currVCluster = [];
        }
      }
      if (currVCluster.length > 0) {
        vLines.push(Math.round(currVCluster.reduce((a, b) => a + b, 0) / currVCluster.length));
      }

      // Column locations:
      // Line 0: Table Left, Line 1: NO/Nama, Line 2: Nama/Nilai, Line 3: Nilai/Kehadiran
      let xNilaiLeft = Math.round(width * 0.33);
      let xNilaiRight = Math.round(width * 0.67);
      let tableLeft = Math.round(width * 0.04);
      let tableRight = Math.round(width * 0.94);

      if (vLines.length >= 6) {
        tableLeft = vLines[0];
        tableRight = vLines[vLines.length - 1];
        xNilaiLeft = vLines[2];
        xNilaiRight = vLines[3];
      } else if (vLines.length >= 4) {
        tableLeft = vLines[0];
        tableRight = vLines[vLines.length - 1];
        xNilaiLeft = Math.round(tableLeft + (tableRight - tableLeft) * 0.32);
        xNilaiRight = Math.round(tableLeft + (tableRight - tableLeft) * 0.70);
      }

      // 3. Horizontal projection within table boundaries to find row lines
      const tableW = Math.max(1, tableRight - tableLeft);
      const hProj = new Float32Array(height);
      for (let y = 0; y < height; y++) {
        let darkCount = 0;
        for (let x = tableLeft; x < tableRight; x++) {
          if (isDark[y * width + x]) darkCount++;
        }
        hProj[y] = darkCount / tableW;
      }

      const hLines = [];
      let currH = [];
      for (let y = Math.floor(height * 0.15); y < Math.floor(height * 0.98); y++) {
        if (hProj[y] > 0.38) {
          currH.push(y);
        } else if (currH.length > 0) {
          hLines.push(Math.round(currH.reduce((a, b) => a + b, 0) / currH.length));
          currH = [];
        }
      }
      if (currH.length > 0) {
        hLines.push(Math.round(currH.reduce((a, b) => a + b, 0) / currH.length));
      }

      // Calculate median row step
      const steps = [];
      for (let i = 0; i < hLines.length - 1; i++) {
        const d = hLines[i + 1] - hLines[i];
        if (d >= 18 && d <= 45) steps.push(d);
      }
      steps.sort((a, b) => a - b);
      const medianRowHeight = steps.length > 0 ? steps[Math.floor(steps.length / 2)] : 26;

      const studentCount = Math.min(students.length, 30);
      const yTableEnd = hLines.length > 0 ? hLines[hLines.length - 1] : Math.round(height * 0.96);
      const yTableStart = yTableEnd - Math.round(studentCount * medianRowHeight);
      const rowH = (yTableEnd - yTableStart) / studentCount;

      // Helper to measure bubble darkness and average gray
      const getBubbleMetrics = (cx, cy, r = 6) => {
        let darkCount = 0;
        let totalCount = 0;
        let graySum = 0;
        const x1 = Math.max(0, cx - r);
        const x2 = Math.min(width - 1, cx + r);
        const y1 = Math.max(0, cy - r);
        const y2 = Math.min(height - 1, cy + r);
        for (let y = y1; y <= y2; y++) {
          for (let x = x1; x <= x2; x++) {
            const idx = (y * width + x) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            if (gray < 165) darkCount++;
            graySum += gray;
            totalCount++;
          }
        }
        return {
          darkRatio: totalCount > 0 ? darkCount / totalCount : 0,
          meanGray: totalCount > 0 ? graySum / totalCount : 255
        };
      };

      const tensValues = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const cellW = xNilaiRight - xNilaiLeft;

      const detectedResults = students.slice(0, 30).map((s, idx) => {
        const cy = Math.round(yTableStart + (idx + 0.5) * rowH);

        // 5 bubble
        const bx5 = xNilaiLeft + Math.round(cellW * 0.954);
        const m5 = getBubbleMetrics(bx5, cy);
        const hasFive = m5.darkRatio >= 0.24 || m5.meanGray <= 202;

        // 11 tens bubbles
        const tensMetrics = tensValues.map((val, bIdx) => {
          const bx = xNilaiLeft + Math.round(cellW * (0.050 + bIdx * ((0.833 - 0.050) / 10.0)));
          const m = getBubbleMetrics(bx, cy);
          return { val, ...m };
        });

        tensMetrics.sort((a, b) => b.darkRatio - a.darkRatio);
        const bestTen = tensMetrics[0];
        const secondTen = tensMetrics[1];

        const hasTen = bestTen.darkRatio >= 0.32 || 
                       (bestTen.darkRatio >= 0.28 && (bestTen.darkRatio - secondTen.darkRatio) >= 0.07);

        let score = '';
        if (hasTen) {
          if (bestTen.val === 100) {
            score = 100;
          } else {
            score = bestTen.val + (hasFive ? 5 : 0);
          }
        } else if (hasFive) {
          score = 5;
        }

        return {
          santri_id: s.id,
          nis: s.nis || '-',
          nama: s.nama,
          nilai: score
        };
      });

      setScannedData({
        t: targetTA,
        k: targetKelas,
        m: targetMapel,
        cat: targetKat,
        taNama: tahunAjaranList.find(t => String(t.id) === String(targetTA))?.kode || '-',
        kelasNama: kelasList.find(k => String(k.id) === String(targetKelas))?.nama || '-',
        mapelNama: mapelList.find(m => String(m.id) === String(targetMapel))?.nama || '-',
        katNama: kategoriList.find(k => String(k.id) === String(targetKat))?.nama || '-'
      });

      setOcrResults(detectedResults);
      setPreviewImage(imageSrc);

      const filledCount = detectedResults.filter(r => r.nilai !== '').length;
      setStatusAlert({
        type: 'success',
        message: `Berhasil memindai lembar nilai! Terdeteksi ${filledCount} dari ${detectedResults.length} santri. Silakan tinjau dan simpan.`
      });

    } catch (err) {
      console.error('OCR processing error:', err);
      setStatusAlert({
        type: 'error',
        message: err.message || 'Gagal memproses gambar. Pastikan resolusi jelas dan lembar tidak terlipat.'
      });
    } finally {
      setIsProcessing(false);
      setOcrProgress('');
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      processImageSource(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle webcam capture
  const handleCaptureCamera = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setIsCameraActive(false);
      processImageSource(imageSrc);
    }
  };

  // Handle hardware USB scan (WIA)
  const handleHardwareScan = async () => {
    setIsProcessing(true);
    setOcrProgress('Mengirim perintah scan ke scanner USB...');
    setStatusAlert(null);

    try {
      const res = await apiFetch('/api/scan/epson', { method: 'POST' });
      if (res.image) {
        setOcrProgress('Scan berhasil, memproses lembar OMR...');
        await processImageSource(res.image);
      } else {
        throw new Error('Scanner tidak menghasilkan gambar');
      }
    } catch (err) {
      setStatusAlert({
        type: 'error',
        message: err.message || 'Gagal terhubung ke scanner USB. Pastikan kabel terhubung dan scanner menyala.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Save Nilai to Database
  const handleSaveNilai = async () => {
    if (!scannedData || ocrResults.length === 0) return;
    setIsSaving(true);
    try {
      const payload = {
        tahun_ajaran_id: scannedData.t,
        kelas_id: scannedData.k,
        mata_pelajaran_id: scannedData.m,
        kategori_evaluasi_id: scannedData.cat,
        data: ocrResults.map(r => ({
          santri_id: r.santri_id,
          nilai_angka: r.nilai !== '' && r.nilai !== null && !isNaN(Number(r.nilai)) ? Number(r.nilai) : null,
          predikat: r.nilai !== '' && r.nilai !== null && !isNaN(Number(r.nilai)) ? getPredikat(Number(r.nilai)) : null,
          capaian: 'Tam'
        }))
      };

      await nilaiService.saveNilaiBulk(payload);

      setStatusAlert({
        type: 'success',
        message: `Alhamdulillah! Berhasil menyimpan nilai ${ocrResults.length} santri ke database rapor!`
      });
    } catch (err) {
      console.error('Error saving nilai:', err);
      setStatusAlert({
        type: 'error',
        message: 'Gagal menyimpan nilai: ' + (err.message || '')
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Summary Metrics
  const summaryStats = useMemo(() => {
    if (ocrResults.length === 0) return null;
    const filled = ocrResults.filter(r => r.nilai !== '' && r.nilai !== null && !isNaN(Number(r.nilai)));
    const totalScore = filled.reduce((acc, curr) => acc + Number(curr.nilai), 0);
    const avg = filled.length > 0 ? (totalScore / filled.length).toFixed(1) : '-';
    return {
      total: ocrResults.length,
      filled: filled.length,
      unfilled: ocrResults.length - filled.length,
      avg
    };
  }, [ocrResults]);

  // Tab definitions
  const tabItems = [
    {
      key: '1',
      label: '1. Cetak Lembar Ujian (OMR)',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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
              placeholder={filteredMapelList.length === 0 ? "Tidak ada mapel aktif" : "Pilih Mata Pelajaran"}
              options={filteredMapelList.map(m => ({ label: `${m.nama} (${m.jenis || 'Reguler'})`, value: String(m.id) }))}
            />
            <CustomSelect
              label="Kategori Penilaian"
              value={selectedKategori}
              onChange={setSelectedKategori}
              options={kategoriList.map(k => ({ label: k.nama, value: String(k.id) }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-custom btn-primary"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600 }}
            >
              <Printer size={18} /> Cetak Lembar Nilai (F4)
            </button>

            <button
              type="button"
              className="btn-custom btn-secondary"
              onClick={() => setShowScreenPreview(!showScreenPreview)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '14px' }}
            >
              <Eye size={18} /> {showScreenPreview ? 'Sembunyikan Preview' : 'Lihat Preview Lembar'}
            </button>

            <span style={{ fontSize: '13px', color: '#64748b' }}>
              {loadingSantri ? 'Memuat santri...' : `Total: ${santriList.length} Santri di kelas terpilih`}
            </span>
          </div>

          {/* On-screen Preview */}
          {showScreenPreview && (
            <div className="screen-sheet-preview-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#1e293b' }}>Pratinjau Lembar OMR (Kertas F4)</h4>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Akan otomatis dioptimalkan saat dicetak</span>
              </div>

              <div style={{ border: '2px solid #000', padding: '10px', background: '#fff', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px' }}>MADRASAH DINIYAH AL-HAMID CINTAMULYA</h3>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '12px', fontWeight: 'normal' }}>LEMBAR JAWABAN & PENILAIAN UJIAN (OMR)</h4>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', border: '1.5px solid #000', padding: '6px 10px', fontSize: '11px', marginBottom: '8px' }}>
                  <div>
                    <div><strong>Tahun Ajaran:</strong> {currentTAObj?.kode || '-'}</div>
                    <div><strong>Kelas:</strong> {currentKelasObj?.nama || '-'}</div>
                    <div><strong>Mata Pelajaran:</strong> {currentMapelObj?.nama || '-'}</div>
                  </div>
                  <div>
                    <div><strong>Semester:</strong> {currentKategoriObj?.nama || '-'}</div>
                    <div><strong>Guru:</strong> ____________________</div>
                    <div><strong>Santri:</strong> {santriList.length} Santri</div>
                  </div>
                  <div>
                    <QRCodeSVG value={qrPayload} size={65} level="M" />
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ border: '1px solid #000', padding: '3px', width: '30px' }}>NO</th>
                        <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'left' }}>Nama Santri</th>
                        <th style={{ border: '1px solid #000', padding: '3px', width: '220px' }}>Nilai (Silang Bulatan)</th>
                        <th style={{ border: '1px solid #000', padding: '3px', width: '50px' }}>Hadir</th>
                        <th style={{ border: '1px solid #000', padding: '3px', width: '50px' }}>Tidak</th>
                        <th style={{ border: '1px solid #000', padding: '3px', width: '90px' }}>TTD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {santriList.slice(0, 15).map((s, idx) => (
                        <tr key={s.id || idx}>
                          <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #000', padding: '3px' }}>{s.nama}</td>
                          <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
                                <span key={v} style={{ border: '1px solid #000', borderRadius: '50%', width: '13px', height: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px' }}>{v}</span>
                              ))}
                              <span style={{ margin: '0 2px' }}>|</span>
                              <span style={{ border: '1px solid #000', borderRadius: '50%', width: '13px', height: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px' }}>5</span>
                            </div>
                          </td>
                          <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>[ ]</td>
                          <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>[ ]</td>
                          <td style={{ border: '1px solid #000', padding: '3px', fontSize: '8px' }}>{idx + 1}....</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      key: '2',
      label: '2. Pindai & Koreksi Hasil Nilai',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Method Selection Cards */}
          <div className="scan-methods-grid">
            <div 
              className={`method-card ${scanMethod === 'upload' ? 'active' : ''}`}
              onClick={() => { setScanMethod('upload'); setIsCameraActive(false); }}
            >
              <div className="method-icon"><UploadIcon size={22} /></div>
              <h4>Upload Gambar / Scan</h4>
              <p>Pilih berkas foto atau scan lembar OMR dalam format JPG, PNG, atau PDF.</p>
            </div>

            <div 
              className={`method-card ${scanMethod === 'camera' ? 'active' : ''}`}
              onClick={() => { setScanMethod('camera'); setIsCameraActive(true); }}
            >
              <div className="method-icon"><Camera size={22} /></div>
              <h4>Kamera Langsung</h4>
              <p>Arahkan kamera laptop atau HP ke lembar OMR untuk memindai secara instan.</p>
            </div>

            <div 
              className={`method-card ${scanMethod === 'hardware' ? 'active' : ''}`}
              onClick={() => { setScanMethod('hardware'); setIsCameraActive(false); }}
            >
              <div className="method-icon"><Scan size={22} /></div>
              <h4>Scanner USB (Epson/WIA)</h4>
              <p>Pindai otomatis langsung dari alat scanner flatbed Epson yang terhubung via kabel USB.</p>
            </div>
          </div>

          {/* Method Execution Box */}
          {scanMethod === 'upload' && (
            <label className="upload-dropzone">
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              <UploadIcon size={40} className="dropzone-icon" />
              <div className="dropzone-title">Klik atau seret file gambar hasil scan ke sini</div>
              <div className="dropzone-desc">Mendukung format JPG, PNG, WEBP (Resolusi jernih disarankan)</div>
            </label>
          )}

          {scanMethod === 'camera' && (
            <div style={{ textAlign: 'center' }}>
              {isCameraActive ? (
                <div className="camera-container">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: 'environment', width: 1280, height: 720 }}
                  />
                  <div className="camera-overlay" />
                </div>
              ) : (
                <button 
                  type="button" 
                  className="btn-custom btn-secondary" 
                  onClick={() => setIsCameraActive(true)}
                >
                  <Camera size={16} /> Aktifkan Kamera
                </button>
              )}

              {isCameraActive && (
                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn-custom btn-primary"
                    onClick={handleCaptureCamera}
                    style={{ padding: '10px 24px', fontSize: '15px' }}
                  >
                    <Camera size={18} /> Ambil Foto Lembar Ini
                  </button>
                  <button 
                    type="button" 
                    className="btn-custom btn-secondary"
                    onClick={() => setIsCameraActive(false)}
                  >
                    Tutup Kamera
                  </button>
                </div>
              )}
            </div>
          )}

          {scanMethod === 'hardware' && (
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Pemindaian Flatbed Scanner USB</h4>
              <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '13px' }}>
                Pastikan lembar ujian sudah diletakkan menghadap ke bawah pada kaca scanner Epson L3250.
              </p>
              <button
                type="button"
                className="btn-custom btn-primary"
                onClick={handleHardwareScan}
                disabled={isProcessing}
                style={{ padding: '12px 28px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Scan size={20} /> {isProcessing ? 'Sedang Memindai...' : 'Mulai Pindai Sekarang'}
              </button>
            </div>
          )}

          {/* Processing alert */}
          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', color: '#1e40af' }}>
              <RefreshCw size={20} className="spinning" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{ocrProgress || 'Sedang memproses...'}</span>
            </div>
          )}

          {/* Status Alert */}
          {statusAlert && (
            <SmartAlert message={statusAlert.message} type={statusAlert.type} />
          )}

          {/* Scanned Results */}
          {ocrResults.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              {/* Metadata chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', background: '#f1f5f9', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>Lembar Terdeteksi:</span>
                <span style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Kelas: {scannedData?.kelasNama}</span>
                <span style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Mapel: {scannedData?.mapelNama}</span>
                <span style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Kategori: {scannedData?.katNama}</span>
                <span style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Tahun: {scannedData?.taNama}</span>
              </div>

              {/* Stat summary */}
              {summaryStats && (
                <div className="scan-stat-summary">
                  <div className="stat-chip">
                    <span className="stat-title">Total Santri</span>
                    <span className="stat-val primary">{summaryStats.total}</span>
                  </div>
                  <div className="stat-chip">
                    <span className="stat-title">Nilai Terisi</span>
                    <span className="stat-val success">{summaryStats.filled}</span>
                  </div>
                  <div className="stat-chip">
                    <span className="stat-title">Belum Terisi</span>
                    <span className="stat-val warning">{summaryStats.unfilled}</span>
                  </div>
                  <div className="stat-chip">
                    <span className="stat-title">Rata-Rata</span>
                    <span className="stat-val">{summaryStats.avg}</span>
                  </div>
                </div>
              )}

              {/* Table actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Tinjauan & Koreksi Nilai Hasil Scan</h3>
                <button
                  type="button"
                  className="btn-custom btn-primary"
                  onClick={handleSaveNilai}
                  disabled={isSaving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', fontSize: '14px', fontWeight: 700 }}
                >
                  <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Nilai ke Database'}
                </button>
              </div>

              {/* Interactive results table */}
              <div className="scan-results-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                      <th style={{ width: '130px' }}>NIS</th>
                      <th>Nama Santri</th>
                      <th style={{ width: '140px', textAlign: 'center' }}>Nilai OMR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocrResults.map((r, idx) => (
                      <tr key={r.santri_id}>
                        <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.nis}</td>
                        <td style={{ fontWeight: 600, color: '#1e293b' }}>{r.nama}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="score-input"
                            value={r.nilai}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setOcrResults(prev => prev.map((item, i) => i === idx ? { 
                                ...item, 
                                nilai: val 
                              } : item));
                            }}
                            placeholder="-"
                          />
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
    <div className="scan-nilai-page">
      {/* UI header (hidden on print) */}
      <div className="page-header no-print">
        <div className="page-icon">
          <Scan size={26} />
        </div>
        <div>
          <h2>Pusat Penilaian Cepat & OMR Scanner</h2>
          <p>Cetak lembar jawaban per kelas, pindai lembar yang telah dinilai, dan simpan nilai secara otomatis.</p>
        </div>
      </div>

      <div className="main-card no-print">
        <CustomTabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
      </div>

      {/* Printable Sheet (F4 Page) - visible strictly during browser print */}
      <div className="print-only">
        {/* Anchor corner markers for optical deskewing */}
        <div className="anchor-marker marker-tl" />
        <div className="anchor-marker marker-tr" />
        <div className="anchor-marker marker-bl" />
        <div className="anchor-marker marker-br" />

        <div className="print-header">
          <div className="print-title">
            <h1>MADRASAH DINIYAH AL-HAMID CINTAMULYA</h1>
            <h2>LEMBAR JAWABAN & PENILAIAN UJIAN (OMR)</h2>
          </div>
        </div>

        <div className="print-info-grid">
          <div className="info-grid-col">
            <div className="info-item">
              <span className="info-label">Tahun Ajaran</span>
              <span className="info-colon">:</span>
              <span className="info-value">{currentTAObj?.kode || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Kelas</span>
              <span className="info-colon">:</span>
              <span className="info-value">{currentKelasObj?.nama || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Mata Pelajaran</span>
              <span className="info-colon">:</span>
              <span className="info-value">{currentMapelObj?.nama || '-'}</span>
            </div>
          </div>
          <div className="info-grid-col">
            <div className="info-item">
              <span className="info-label">Kategori / Sem</span>
              <span className="info-colon">:</span>
              <span className="info-value">{currentKategoriObj?.nama || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Guru Pengampu</span>
              <span className="info-colon">:</span>
              <span className="info-value">____________________</span>
            </div>
            <div className="info-item">
              <span className="info-label">Jumlah Santri</span>
              <span className="info-colon">:</span>
              <span className="info-value">{santriList.length} Santri</span>
            </div>
          </div>
          <div className="qr-col">
            <QRCodeSVG value={qrPayload} size={70} level="M" />
          </div>
        </div>

        <table className="omr-table">
          <thead>
            <tr>
              <th rowSpan={2} className="col-no">NO</th>
              <th rowSpan={2} className="col-nama">Nama Santri</th>
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
                <tr key={santri.santri_id || santri.id || index}>
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
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '16px' }}>Belum ada santri terdaftar di kelas ini</td></tr>
            )}
          </tbody>
        </table>

        <div className="print-panduan">
          <strong>PANDUAN:</strong> Silang (X) atau hitamkan bulatan nilai menggunakan pulpen hitam. Contoh: Untuk nilai 85, silang bulatan [80] dan [5]. Untuk nilai 100, silang bulatan [100].
        </div>
      </div>
    </div>
  );
}

export default ScanNilai;

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  Download,
  Eye,
  ShieldCheck,
  Zap,
  HardDrive,
  Laptop,
  FolderOpen
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { CustomSelect } from '../components/ui/CustomSelect';
import { nilaiService } from '../services/nilaiService';
import type { 
  TahunAjaranItem, 
  KelasItem, 
  MataPelajaranItem, 
  KategoriItem, 
  SantriNilaiItem, 
  MapelTingkatItem 
} from '../types/scanNilai';
import './ScanNilai.scss';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>) 
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
  const [activeTab, setActiveTab] = useState<'1' | '2'>('1');
  
  // Master data
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranItem[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaranItem[]>([]);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriItem[]>([]);
  const [, setMasterLoading] = useState<boolean>(true);
  
  // Selection
  const [selectedTA, setSelectedTA] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [selectedKategori, setSelectedKategori] = useState<string>('');
  const [mapelTingkat, setMapelTingkat] = useState<MapelTingkatItem[]>([]);
  const [santriList, setSantriList] = useState<SantriNilaiItem[]>([]);
  const [loadingSantri, setLoadingSantri] = useState<boolean>(false);

  // Tab 1: Preview sheet on screen
  const [showScreenPreview, setShowScreenPreview] = useState<boolean>(false);

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

        const validTAs: TahunAjaranItem[] = Array.isArray(taRes) ? taRes : [];
        const validMapels: MataPelajaranItem[] = Array.isArray(mapelRes) ? mapelRes : [];
        const validClasses: KelasItem[] = Array.isArray(kelasRes) 
          ? kelasRes.filter((k: any) => k.jenis === 'Diniyah' || !k.jenis).map((k: any) => {
              if (k.nama === 'SP' && k.tingkat === 1) return { ...k, tingkat: 99 };
              return k;
            })
          : [];
        const validKats: KategoriItem[] = Array.isArray(katRes) ? katRes : [];

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
      } finally {
        setMasterLoading(false);
      }
    }
    loadMasterData();
  }, []);

  // Reload kelasList when Tahun Ajaran changes
  useEffect(() => {
    if (selectedTA) {
      nilaiService.fetchKelas(selectedTA)
        .then((data: any) => {
          const validClasses: KelasItem[] = Array.isArray(data)
            ? data.filter((k: any) => k.jenis === 'Diniyah' || !k.jenis).map((k: any) => {
                if (k.nama === 'SP' && k.tingkat === 1) return { ...k, tingkat: 99 };
                return k;
              })
            : [];
          setKelasList(validClasses);
          if (validClasses.length > 0) {
            setSelectedKelas(prev => validClasses.some(k => String(k.id) === String(prev)) ? prev : String(validClasses[0].id));
          } else {
            setSelectedKelas('');
          }
        })
        .catch((err: any) => {
          console.error('Gagal mengambil kelas per tahun ajaran di ScanNilai:', err);
        });
    }
  }, [selectedTA]);

  // Fetch Santri when Kelas or Tahun Ajaran changes
  useEffect(() => {
    if (selectedKelas && selectedTA) {
      setLoadingSantri(true);
      apiFetch<SantriNilaiItem[]>(`/api/santri?kelas_id=${selectedKelas}&tahun_ajaran_id=${selectedTA}`)
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
        .then((data: any) => {
          setMapelTingkat(Array.isArray(data) ? data : []);
        })
        .catch((err: any) => {
          console.error('Gagal mengambil mapel tingkat:', err);
          setMapelTingkat([]);
        });
    } else {
      setMapelTingkat([]);
    }
  }, [selectedTA, selectedKategori]);

  const currentTAObj = tahunAjaranList.find(t => String(t.id) === String(selectedTA));
  const currentKelasObj = kelasList.find(k => String(k.id) === String(selectedKelas));

  // Filter mapel: Hanya Mapel Reguler aktif.
  // Muhafadzoh Akbar, Qiroatul Kitab, dan Taftisyul Kutub DIHAPUS TOTAL dari lembar ujian tulis.
  const filteredMapelList = useMemo(() => {
    if (!mapelList || mapelList.length === 0) return [];

    const isExcluded = (m: MataPelajaranItem) => {
      const jenis = (m.jenis || '').toLowerCase();
      const nama = (m.nama || '').toLowerCase();
      if (['muhafadzoh', 'qiroah', 'taftisy'].includes(jenis)) return true;
      if (nama.includes('muhafadzoh') || nama.includes('qiroat') || nama.includes('qiroah') || nama.includes('taftisy')) return true;
      return false;
    };

    if (!selectedKelas || !currentKelasObj) {
      return mapelList.filter(m => m.jenis === 'Reguler' && !isExcluded(m));
    }

    const tingkat = currentKelasObj.tingkat;
    const activeMapelIds = mapelTingkat
      .filter(mt => Number(mt.tingkat) === Number(tingkat))
      .map(mt => mt.mata_pelajaran_id);

    return mapelList.filter(m => 
      m.jenis === 'Reguler' && 
      activeMapelIds.includes(m.id) && 
      !isExcluded(m)
    );
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
      alert('Pilih Tahun Ajaran, Kelas, Mata Pelajaran, dan Semester terlebih dahulu!');
      return;
    }
    window.print();
  };

  return (
    <div className="scan-nilai-page">
      {/* HEADER TACTILE BAKU (Murni teks tanpa emoji/orb) */}
      <div className="tactile-page-header no-print">
        <div className="header-title-group">
          <h2 className="page-title">Pusat Lembar Ujian Tulis & Scanner Desktop</h2>
          <p className="page-subtitle">Cetak lembar nilai ujian F4 per kelas dan unduh aplikasi Windows native untuk pemindaian cerdas berakurasi tinggi</p>
        </div>
      </div>

      {/* OPTION A SEGMENTED CONTROL DOCK */}
      <div className="segmented-tabs-dock no-print" style={{ alignSelf: 'flex-start' }}>
        <button
          type="button"
          className={`segmented-tab-btn ${activeTab === '1' ? 'active' : ''}`}
          onClick={() => setActiveTab('1')}
        >
          <Printer size={15} />
          <span>1. Cetak Lembar Ujian (F4)</span>
        </button>
        <button
          type="button"
          className={`segmented-tab-btn ${activeTab === '2' ? 'active' : ''}`}
          onClick={() => setActiveTab('2')}
        >
          <Laptop size={15} />
          <span>2. Unduh Aplikasi Scanner Desktop (Windows)</span>
        </button>
      </div>

      {/* TAB CONTENT 1: CETAK LEMBAR UJIAN (F4) */}
      {activeTab === '1' && (
        <div className="frosted-card no-print">
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
              placeholder={filteredMapelList.length === 0 ? "Tidak ada mapel ujian aktif" : "Pilih Mata Pelajaran"}
              options={filteredMapelList.map(m => ({ label: `${m.nama} (${m.jenis || 'Reguler'})`, value: String(m.id) }))}
            />
            <CustomSelect
              label="Semester"
              value={selectedKategori}
              onChange={setSelectedKategori}
              options={kategoriList.map(k => ({ label: k.nama, value: String(k.id) }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
            <button
              type="button"
              className="action-pill-btn primary-pill"
              onClick={handlePrint}
            >
              <Printer size={16} />
              <span>Cetak Lembar Nilai (F4)</span>
            </button>

            <button
              type="button"
              className="action-pill-btn secondary-pill"
              onClick={() => setShowScreenPreview(!showScreenPreview)}
            >
              <Eye size={16} />
              <span>{showScreenPreview ? 'Sembunyikan Preview' : 'Lihat Preview Lembar'}</span>
            </button>

            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              {loadingSantri ? 'Memuat santri...' : `Total: ${santriList.length} Santri di kelas terpilih`}
            </span>
          </div>

          {/* On-screen Preview */}
          {showScreenPreview && (
            <div className="screen-sheet-preview-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', paddingBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#1e293b', fontWeight: 700 }}>Pratinjau Lembar Nilai Ujian Tulis (Kertas F4)</h4>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Format cetak resmi madrasah</span>
              </div>

              <div style={{ border: '2px solid #000', padding: '12px', background: '#fff', maxWidth: '820px', margin: '0 auto', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>MADRASAH DINIYAH AL-HAMID CINTAMULYA</h3>
                  <h4 style={{ margin: '3px 0 0 0', fontSize: '12px', fontWeight: '600' }}>LEMBAR NILAI UJIAN TULIS SISWA</h4>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', border: '1.5px solid #000', padding: '6px 12px', fontSize: '11px', marginBottom: '8px' }}>
                  <div style={{ lineHeight: '1.6' }}>
                    <div><strong>Tahun Ajaran:</strong> {currentTAObj?.kode || '-'}</div>
                    <div><strong>Kelas:</strong> {currentKelasObj?.nama || '-'}</div>
                    <div><strong>Mata Pelajaran:</strong> {currentMapelObj?.nama || '-'}</div>
                  </div>
                  <div style={{ lineHeight: '1.6' }}>
                    <div><strong>Semester:</strong> {currentKategoriObj?.nama || '-'}</div>
                    <div><strong>Korektor:</strong> ____________________</div>
                    <div><strong>Jumlah Santri:</strong> {santriList.length} Santri</div>
                  </div>
                  <div>
                    <QRCodeSVG value={qrPayload} size={65} level="M" />
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ border: '1px solid #000', padding: '4px', width: '32px', textAlign: 'center' }}>NO</th>
                        <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Nama Santri</th>
                        <th style={{ border: '1px solid #000', padding: '4px', width: '230px', textAlign: 'center' }}>
                          <div style={{ fontWeight: 'bold' }}>Nilai Ujian (Hitamkan Bulatan)</div>
                          <div style={{ fontSize: '8.5px', fontWeight: 'normal', fontStyle: 'italic', color: '#475569' }}>Diisi oleh korektor</div>
                        </th>
                        <th style={{ border: '1px solid #000', padding: '4px', width: '48px', textAlign: 'center' }}>Hadir</th>
                        <th style={{ border: '1px solid #000', padding: '4px', width: '48px', textAlign: 'center' }}>Tidak</th>
                        <th style={{ border: '1px solid #000', padding: '4px', width: '85px', textAlign: 'center' }}>TTD</th>
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

                <div style={{ marginTop: '8px', padding: '6px', border: '1px dashed #64748b', fontSize: '9.5px', textAlign: 'center', color: '#334155' }}>
                  <strong>PANDUAN:</strong> Hitamkan bulatan nilai menggunakan pensil atau pulpen hitam. Contoh: Untuk nilai 85, hitamkan bulatan [80] dan [5]. Untuk nilai 100, hitamkan bulatan [100].
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: UNDUH SCANNER DESKTOP */}
      {activeTab === '2' && (
        <div className="desktop-app-download-page no-print">
          {/* Hero Banner */}
          <div className="download-hero-card">
            <div className="hero-content">
              <div className="version-pill">
                <span className="dot" />
                <span>Rilis Resmi v1.0.0 (Windows 64-bit)</span>
              </div>
              <h2 className="hero-title">Al-Hamid OMR Scanner Desktop</h2>
              <p className="hero-desc">
                Aplikasi komputer native Windows berperforma tinggi yang dibangun khusus dengan kecerdasan <strong>Computer Vision (OpenCV) & .NET 8</strong> untuk memindai, mengenali bulatan korektor, dan mengirim hasil penilaian ujian tulis secara otomatis ke database cloud Al-Hamid.
              </p>

              <div className="hero-actions">
                <a 
                  href="/downloads/AlHamidScanner-Setup.exe" 
                  download="AlHamidScanner-Setup.exe"
                  className="btn-download-primary"
                >
                  <Download size={20} />
                  <span>Unduh Installer Al-Hamid Scanner (.exe)</span>
                </a>

                <div className="file-info-badge">
                  <HardDrive size={15} />
                  <span>Ukuran: ~173 MB • Standalone Installer • Tanpa Instal .NET Eksternal</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="app-preview-box">
                <div className="app-window-header">
                  <div className="window-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <span className="window-title">Al-Hamid OMR Scanner v1.0</span>
                </div>
                <div className="app-window-body">
                  <div className="scanner-badge-live">
                    <Zap size={14} className="pulse-icon" /> AI Optical Recognition Siap
                  </div>
                  <div className="scanner-mockup-sheet">
                    <div className="mock-header" />
                    <div className="mock-row active">
                      <div className="mock-cell name" />
                      <div className="mock-bubbles">
                        <span /><span /><span /><span className="marked" /><span />
                      </div>
                      <div className="mock-score">85</div>
                    </div>
                    <div className="mock-row">
                      <div className="mock-cell name" />
                      <div className="mock-bubbles">
                        <span /><span /><span className="marked" /><span /><span />
                      </div>
                      <div className="mock-score">90</div>
                    </div>
                    <div className="mock-row">
                      <div className="mock-cell name" />
                      <div className="mock-bubbles">
                        <span /><span /><span /><span /><span className="marked" />
                      </div>
                      <div className="mock-score">75</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Advantages Grid */}
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon bg-indigo">
                <Zap size={22} />
              </div>
              <h3>Analisis Cerdas & Presisi Tinggi</h3>
              <p>
                Ditenagai pemrosesan OpenCV native yang secara cerdas mendeteksi bulatan korektor, mengoreksi rotasi/kemiringan gambar lembar (auto-deskew), dan mengabaikan coretan acak di luar kolom.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon bg-emerald">
                <ShieldCheck size={22} />
              </div>
              <h3>Koneksi Otomatis ke Database VPS</h3>
              <p>
                Aplikasi otomatis tersinkronisasi langsung dengan server VPS Al-Hamid. Begitu pemindaian selesai diverifikasi, satu klik akan langsung menyimpan nilai ke database rapor tanpa entri manual.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon bg-blue">
                <Laptop size={22} />
              </div>
              <h3>Instalasi & Penggunaan Mudah</h3>
              <p>
                Dilengkapi wizard installer interaktif, pembuatan pintasan Desktop otomatis, dukungan segala jenis berkas scanner (PDF, JPG, PNG), serta pencopotan program (uninstaller) terintegrasi di Windows Settings.
              </p>
            </div>
          </div>

          {/* Step by Step Guide Card */}
          <div className="guide-card">
            <div className="guide-header">
              <div className="guide-header-icon">
                <FolderOpen size={20} />
              </div>
              <div>
                <h3>Panduan Singkat Instalasi & Penggunaan</h3>
                <p>Ikuti 5 langkah mudah berikut untuk mulai menggunakan pemindai nilai desktop:</p>
              </div>
            </div>

            <div className="steps-timeline">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Unduh Berkas Installer</h4>
                  <p>Klik tombol hijau <strong>Unduh Installer</strong> di atas untuk mengunduh <code>AlHamidScanner-Setup.exe</code> ke komputer Anda.</p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Jalankan Pemasangan (Setup)</h4>
                  <p>Klik ganda berkas <code>AlHamidScanner-Setup.exe</code>. Pilih direktori tujuan (default: <code>C:\Program Files\Al-Hamid Scanner</code>) lalu klik <strong>Pasang Sekarang</strong> hingga status selesai 100%.</p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Buka Aplikasi & Masuk Akun</h4>
                  <p>Jalankan aplikasi melalui pintasan <strong>Al-Hamid OMR Scanner</strong> di Desktop. Masuk dengan akun ustadz/korektor yang terdaftar di sistem madrasah.</p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Pilih Berkas Lembar Nilai</h4>
                  <p>Pilih berkas hasil pindai scanner (Flatbed/ADF) dalam format PDF atau gambar (JPG/PNG). Aplikasi akan otomatis memotong dan mengenali setiap bulatan nilai santri.</p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h4>Kirim Nilai ke Database Rapor</h4>
                  <p>Periksa tabel nilai yang terdeteksi. Bila sudah sesuai, klik tombol <strong>Kirim Nilai ke Database Web</strong>. Nilai akan otomatis masuk ke menu penilaian madrasah.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <h2>LEMBAR NILAI UJIAN TULIS SISWA</h2>
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
              <span className="info-label">Semester</span>
              <span className="info-colon">:</span>
              <span className="info-value">{currentKategoriObj?.nama || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Korektor</span>
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
              <th rowSpan={2} className="col-nilai">
                <div style={{ fontWeight: 'bold' }}>Nilai Ujian (Hitamkan Bulatan)</div>
                <div style={{ fontSize: '9px', fontWeight: 'normal', fontStyle: 'italic', marginTop: '2px' }}>Diisi oleh korektor</div>
              </th>
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
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '16px' }}>Belum ada santri terdaftar di kelas ini</td></tr>
            )}
          </tbody>
        </table>

        <div className="print-panduan">
          <strong>PANDUAN:</strong> Hitamkan bulatan nilai menggunakan pensil atau pulpen hitam. Contoh: Untuk nilai 85, hitamkan bulatan [80] dan [5]. Untuk nilai 100, hitamkan bulatan [100].
        </div>
      </div>
    </div>
  );
}

export default ScanNilai;

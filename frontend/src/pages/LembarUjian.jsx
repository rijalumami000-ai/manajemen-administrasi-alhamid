import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Printer, 
  Plus, 
  Trash2, 
  FileText, 
  Save, 
  RefreshCw, 
  Upload, 
  Eye, 
  CloudLightning,
  X,
  Edit,
  Settings as SettingsIcon,
  HelpCircle
} from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import { PageHeader, useToast } from '../components/common';
import './LembarUjian.scss';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Authorization': `Bearer ${token}`, ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Terjadi kesalahan server.');
  }
  return res.json();
}

export function LembarUjian() {
  const toast = useToast();
  
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [mapelTingkat, setMapelTingkat] = useState({});
  const [loading, setLoading] = useState(false);
  
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('Ganjil');
  const [selectedTingkat, setSelectedTingkat] = useState(0); // Default ke Sifir (0)
  const [activeTabKey, setActiveTabKey] = useState('kop'); // Default tab 'kop' atau tingkatan
  const [selectedMapelId, setSelectedMapelId] = useState(null);
  const [filteredMapel, setFilteredMapel] = useState([]);
  const [kategoriUjianId, setKategoriUjianId] = useState(null);
  
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isKunciMode, setIsKunciMode] = useState(false);
  const [isHer, setIsHer] = useState(false);

  // Kop State
  const [kopJudul, setKopJudul] = useState('PENILAIAN AKHIR SEMESTER GANJIL');
  const [kopSubJudul, setKopSubJudul] = useState('MADRASAH DINIYYAH AL-HAMID');
  const [kopAlamat, setKopAlamat] = useState('Cintamulya Candipuro Lampung Selatan');
  const [kopTahunAjaranText, setKopTahunAjaranText] = useState('Tahun Ajaran 2025/2026 M');
  const [kopHariTanggal, setKopHariTanggal] = useState('Senin, 12 Desember 2026');
  const [kopInstruksi, setKopInstruksi] = useState('KERJAKAN URAIAN SOAL-SOAL DI BAWAH INI !');
  const [kopLogo, setKopLogo] = useState(null);

  // Soal State for active subject/class
  const [soalList, setSoalList] = useState([]);
  const [namaKelasDiLembar, setNamaKelasDiLembar] = useState('Sifir');
  const [pelajaranNama, setPelajaranNama] = useState('...................................');
  const [jumlahGaris, setJumlahGaris] = useState(15);

  const fileInputRef = useRef(null);

  const staticTingkatan = [
    { key: '0', label: 'Sifir', tingkat: 0 },
    { key: '1', label: 'Kelas 1', tingkat: 1 },
    { key: '99', label: 'SP', tingkat: 99 }, 
    { key: '2', label: 'Kelas 2', tingkat: 2 },
    { key: '3', label: 'Kelas 3', tingkat: 3 },
    { key: '4', label: 'Kelas 4', tingkat: 4 },
    { key: '5', label: 'Kelas 5', tingkat: 5 },
    { key: '6', label: 'Kelas 6', tingkat: 6 }
  ];

  // Load Kop settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [kopRes, logoRes] = await Promise.all([
          apiFetch('/api/lembar-ujian-settings/kop_settings'),
          apiFetch('/api/lembar-ujian-settings/kop_logo')
        ]);

        if (kopRes && kopRes.value) {
          const kopData = JSON.parse(kopRes.value);
          setKopJudul(kopData.judul || 'PENILAIAN AKHIR SEMESTER GANJIL');
          setKopSubJudul(kopData.subJudul || 'MADRASAH DINIYYAH AL-HAMID');
          setKopAlamat(kopData.alamat || 'Cintamulya Candipuro Lampung Selatan');
          setKopHariTanggal(kopData.hariTanggal || 'Senin, 12 Desember 2026');
          setKopInstruksi(kopData.instruksi || 'KERJAKAN URAIAN SOAL-SOAL DI BAWAH INI !');
        } else {
          // fallback to localStorage
          const savedKop = localStorage.getItem('kop_settings');
          if (savedKop) {
            const kopData = JSON.parse(savedKop);
            setKopJudul(kopData.judul || 'PENILAIAN AKHIR SEMESTER GANJIL');
            setKopSubJudul(kopData.subJudul || 'MADRASAH DINIYYAH AL-HAMID');
            setKopAlamat(kopData.alamat || 'Cintamulya Candipuro Lampung Selatan');
            setKopHariTanggal(kopData.hariTanggal || 'Senin, 12 Desember 2026');
            setKopInstruksi(kopData.instruksi || 'KERJAKAN URAIAN SOAL-SOAL DI BAWAH INI !');
          }
        }

        if (logoRes && logoRes.value) {
          setKopLogo(logoRes.value);
        } else {
          const savedLogo = localStorage.getItem('kop_logo');
          if (savedLogo) setKopLogo(savedLogo);
        }
      } catch (error) {
        console.error('Failed to load settings from DB:', error);
      }
    };

    loadSettings();
  }, []);

  // Fetch Year, Subjects, and Categories
  const fetchMeta = useCallback(async () => {
    setLoading(true);
    try {
      const [taData, mapelData, katData, systemSettings] = await Promise.all([
        apiFetch('/api/tahun-ajaran'),
        apiFetch('/api/mata-pelajaran'),
        apiFetch('/api/nilai/kategori'),
        apiFetch('/api/settings').catch(() => ({}))
      ]);
      
      setTahunAjaranList(taData);
      setMapelList(mapelData);
      
      const katUjian = katData.find(k => 
        k.nama.toLowerCase().includes('ujian') || 
        k.nama.toLowerCase().includes('semester') ||
        k.nama.toLowerCase().includes('pas')
      );
      if (katUjian) {
        setKategoriUjianId(katUjian.id);
      }
      
      const activeSemester = systemSettings.active_semester || 'Ganjil';
      setSelectedSemester(activeSemester);
      
      const activeTA = taData.find(ta => ta.is_active);
      if (activeTA) {
        setSelectedTahunAjaran(activeTA.id);
        setKopTahunAjaranText(`Tahun Ajaran ${activeTA.kode} M`);
        setKopJudul(isHer ? 'SOAL HER' : `PENILAIAN AKHIR SEMESTER ${activeSemester.toUpperCase()}`);
      }
    } catch (err) {
      toast.error('Gagal memuat data referensi: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [isHer]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  // Fetch mapel tingkat
  useEffect(() => {
    const fetchMapelTingkat = async () => {
      if (!selectedTahunAjaran) return;
      try {
        let url = `/api/nilai/mapel-tingkat?tahun_ajaran_id=${selectedTahunAjaran}`;
        if (kategoriUjianId) {
          url += `&kategori_evaluasi_id=${kategoriUjianId}`;
        }
        
        const data = await apiFetch(url);
        
        const mapping = {};
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (!mapping[item.tingkat]) {
              mapping[item.tingkat] = [];
            }
            if (item.mata_pelajaran_id) {
              mapping[item.tingkat].push(item.mata_pelajaran_id);
            }
          });
        }
        setMapelTingkat(mapping);
      } catch (err) {
        console.error('Failed to load mapel tingkat:', err);
        setMapelTingkat({});
      }
    };

    fetchMapelTingkat();
  }, [selectedTahunAjaran, selectedSemester, kategoriUjianId]);

  // Filter mapel ketika tingkatan dipilih
  useEffect(() => {
    if (selectedTingkat !== null && mapelList.length > 0) {
      const mapelIdsForTingkat = mapelTingkat[selectedTingkat] || [];
      
      let filtered = mapelList.filter(m => 
        mapelIdsForTingkat.includes(m.id) && m.jenis === 'Reguler'
      );
      
      if (filtered.length === 0 && Object.keys(mapelTingkat).length === 0) {
        filtered = mapelList.filter(m => m.jenis === 'Reguler');
      }
      
      setFilteredMapel(filtered);
    } else {
      setFilteredMapel(mapelList.filter(m => m.jenis === 'Reguler'));
    }
  }, [selectedTingkat, mapelTingkat, mapelList]);

  // Load saved questions from DB or LocalStorage
  useEffect(() => {
    const loadSoal = async () => {
      if (selectedTahunAjaran && activeTabKey !== 'kop' && selectedMapelId) {
        try {
          const mapel = mapelList.find(m => m.id === selectedMapelId);
          const pelajaranName = mapel ? mapel.nama : '';
          const tingkat = activeTabKey === '99' ? 99 : parseInt(activeTabKey);
          
          const url = `/api/lembar-ujian?tahun_ajaran_id=${selectedTahunAjaran}&semester=${selectedSemester}&tingkat=${tingkat}&is_her=${isHer}`;
          const data = await apiFetch(url);
          
          const paper = data.find(p => p.pelajaran === pelajaranName);
          
          if (paper && Array.isArray(paper.soal)) {
            const normalizedSoal = paper.soal.map(s => {
              if (typeof s === 'string') return { teks: s, jawaban: '' };
              if (s && typeof s === 'object') return { teks: s.teks || '', jawaban: s.jawaban || '' };
              return { teks: '', jawaban: '' };
            });
            setSoalList(normalizedSoal);
            setPelajaranNama(pelajaranName);
            toast.info('Data lembar ujian dimuat dari arsip database.');
            return;
          }
        } catch (error) {
          console.error('Failed to load from DB:', error);
        }
        
        // Fallback ke localStorage jika tidak ada di DB
        const key = `soal_${selectedTahunAjaran}_${activeTabKey}_${selectedMapelId}_${isHer ? 'her' : 'utama'}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              const normalizedSoal = parsed.map(s => {
                if (typeof s === 'string') return { teks: s, jawaban: '' };
                if (s && typeof s === 'object') return { teks: s.teks || '', jawaban: s.jawaban || '' };
                return { teks: '', jawaban: '' };
              });
              setSoalList(normalizedSoal);
            }
          } catch (e) {
            console.error('Failed to parse local soal:', e);
          }
        } else {
          setSoalList([]);
        }
      }
    };

    loadSoal();
  }, [selectedTahunAjaran, activeTabKey, selectedMapelId, selectedSemester, isHer, mapelList]);

  // Handle Kop Save
  const handleSaveKop = async (e) => {
    if (e) e.preventDefault();
    const settings = {
      judul: kopJudul,
      subJudul: kopSubJudul,
      alamat: kopAlamat,
      hariTanggal: kopHariTanggal,
      instruksi: kopInstruksi
    };
    
    // Save locally
    localStorage.setItem('kop_settings', JSON.stringify(settings));
    
    try {
      await apiFetch('/api/lembar-ujian-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'kop_settings', value: JSON.stringify(settings) })
      });
      toast.success('Pengaturan Kop berhasil disimpan ke database!');
    } catch (error) {
      console.error('Failed to save kop to DB:', error);
      toast.warning('Tersimpan di browser, tapi gagal simpan ke database.');
    }
  };

  // Upload Logo
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      setKopLogo(base64);
      localStorage.setItem('kop_logo', base64);
      
      try {
        await apiFetch('/api/lembar-ujian-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'kop_logo', value: base64 })
        });
        toast.success('Logo berhasil disimpan ke database!');
      } catch (error) {
        console.error('Failed to save logo to DB:', error);
        toast.warning('Logo tersimpan di browser, tapi gagal simpan ke database.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete Logo
  const handleDeleteLogo = async () => {
    setKopLogo(null);
    localStorage.removeItem('kop_logo');
    
    try {
      await apiFetch('/api/lembar-ujian-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'kop_logo', value: null })
      });
      toast.success('Logo berhasil dihapus dari database!');
    } catch (error) {
      console.error('Failed to delete logo from DB:', error);
    }
  };

  // Handle Save Questions to Database
  const handleSaveToDb = async () => {
    if (!selectedTahunAjaran || activeTabKey === 'kop' || !selectedMapelId) {
      toast.warning('Pilih Tahun Ajaran, Tingkatan, dan Pelajaran terlebih dahulu.');
      return;
    }
    
    if (soalList.length === 0) {
      toast.warning('Belum ada soal yang diinput.');
      return;
    }

    try {
      const mapel = mapelList.find(m => m.id === selectedMapelId);
      const pelajaranName = mapel ? mapel.nama : 'Pelajaran';

      const payload = {
        tahun_ajaran_id: selectedTahunAjaran,
        semester: selectedSemester,
        tingkat: activeTabKey === '99' ? 99 : parseInt(activeTabKey),
        pelajaran: pelajaranName,
        judul: kopJudul,
        sub_judul: kopSubJudul,
        alamat: kopAlamat,
        hari_tanggal: kopHariTanggal,
        instruksi: kopInstruksi,
        soal: soalList.map(s => ({ teks: s.teks, jawaban: s.jawaban })),
        is_her: isHer
      };

      await apiFetch('/api/lembar-ujian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Save locally too as backup
      const key = `soal_${selectedTahunAjaran}_${activeTabKey}_${selectedMapelId}_${isHer ? 'her' : 'utama'}`;
      localStorage.setItem(key, JSON.stringify(soalList));

      toast.success('Lembar ujian berhasil diarsipkan ke database!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan ke database: ' + error.message);
    }
  };

  // Print Logic
  const handlePrint = () => {
    const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
    
    if (isMobileDevice) {
      window.print();
      return;
    }

    const printContent = document.querySelector('.kertas-ujian').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Lembar Ujian</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri&display=swap">
          <style>
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              font-family: 'Times New Roman', Times, serif;
            }
            .kertas-ujian {
              width: 210mm;
              padding: 2mm 15mm;
              box-sizing: border-box;
              font-size: 12pt;
              color: #000;
              margin: 0 auto;
            }
            .kop-surat { display: flex; align-items: center; justify-content: center; gap: 30px; margin-bottom: 8px; }
            .logo-ponpes { width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; }
            .logo-ponpes img { max-height: 100px; max-width: 100px; }
            .kop-text { text-align: center; }
            .kop-judul, .kop-subjudul, .kop-alamat, .kop-tahun { margin: 0 !important; line-height: 1.2 !important; }
            .kop-judul { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
            .kop-subjudul { font-size: 18pt; font-weight: bold; text-transform: uppercase; }
            .kop-alamat { font-size: 14pt; }
            .kop-tahun { font-size: 12pt; font-weight: bold; }
            .border-double { border-top: 3px solid #000; border-bottom: 1px solid #000; height: 2px; margin-bottom: 8px; }
            .box-info { padding: 4px 0; margin-bottom: 8px; border-bottom: 1px solid #000; }
            .table-info { width: 100%; font-size: 10pt; }
            .table-info td { vertical-align: top; padding: 1px 0; }
            .instruksi-ujian { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 8px; text-transform: uppercase; }
            .daftar-soal { font-size: 12pt; margin-bottom: 8px; }
            .daftar-soal ol { padding-left: 20px; }
            .daftar-soal ol li { margin-bottom: 4px; line-height: 1.3; }
            .daftar-soal ol li.rtl { direction: rtl; text-align: right; font-family: 'Uthman Taha Naskh', 'Amiri', 'Traditional Arabic', serif; font-size: 16pt; }
            .area-jawaban .jawaban-title { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 6px; }
            .area-jawaban .garis-item { border-bottom: 1px dotted #000; height: 24px; width: 100%; }
            @media print {
              @page { size: 215mm 330mm; margin: 0 !important; }
              body { margin: 0; }
              .kertas-ujian { width: 100% !important; padding: 2mm 15mm !important; }
            }
          </style>
        </head>
        <body>
          <div class="kertas-ujian">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              const answerArea = document.querySelector('.garis-titik-titik');
              const page = document.querySelector('.kertas-ujian');
              
              const targetHeight = 1180; 
              
              if(answerArea) {
                  answerArea.innerHTML = '';
                  
                  let safetyCounter = 0;
                  while (page.offsetHeight < targetHeight && safetyCounter < 50) {
                    const line = document.createElement('div');
                    line.className = 'garis-item';
                    answerArea.appendChild(line);
                    safetyCounter++;
                  }
                  
                  if (answerArea.lastChild) {
                    answerArea.removeChild(answerArea.lastChild);
                  }
              }
              
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const shouldBeRtl = (text) => {
    if (!text || typeof text !== 'string') return false;
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const hasLatin = /[a-zA-Z]/.test(text);
    return hasArabic && !hasLatin;
  };

  // Tab switching
  const handleTabChange = (key) => {
    setActiveTabKey(key);
    if (key !== 'kop') {
      const currentTab = staticTingkatan.find(t => t.key === key);
      if (currentTab) {
        setSelectedTingkat(currentTab.tingkat);
        setNamaKelasDiLembar(currentTab.label);
      }
      setSelectedMapelId(null);
      setPelajaranNama('...................................');
      setSoalList([]);
    }
  };

  // Add Question Row
  const handleAddSoal = () => {
    setSoalList([...soalList, { teks: '', jawaban: '' }]);
  };

  // Remove Question Row
  const handleRemoveSoal = (index) => {
    const updated = soalList.filter((_, i) => i !== index);
    setSoalList(updated);
  };

  // Edit Question value
  const handleSoalFieldChange = (index, field, value) => {
    const updated = [...soalList];
    updated[index][field] = value;
    setSoalList(updated);
  };

  return (
    <div className="lembar-ujian-page">
      <div className="header-actions-row no-print">
        <PageHeader 
          title="📝 Pembuat Lembar Ujian"
          subtitle="Ketik soal ujian pelajaran dan cetak lembar soal dengan tata letak profesional"
        />
        <button 
          type="button" 
          className="btn-custom btn-primary"
          onClick={() => setIsPreviewVisible(true)}
          style={{ background: '#0052FF', borderColor: '#0052FF' }}
        >
          <Eye size={15} />
          <span>Preview Lembar</span>
        </button>
      </div>

      {/* Global Filter Bar */}
      <div className="frosted-card no-print" style={{ padding: '16px' }}>
        <div className="global-filters">
          <div className="filter-group">
            <label>Tahun Ajaran</label>
            <CustomSelect
              value={selectedTahunAjaran ? String(selectedTahunAjaran) : ''}
              onChange={(val) => {
                const numVal = val ? Number(val) : null;
                setSelectedTahunAjaran(numVal);
                const ta = tahunAjaranList.find(item => item.id === numVal);
                if (ta) {
                  setKopTahunAjaranText(`Tahun Ajaran ${ta.kode} M`);
                }
              }}
              options={tahunAjaranList.map(ta => ({ value: String(ta.id), label: `${ta.kode} M ${ta.is_active ? '(Aktif)' : ''}` }))}
              placeholder="Pilih Tahun Ajaran"
            />
          </div>

          <div className="filter-group">
            <label>Semester</label>
            <CustomSelect
              value={selectedSemester || ''}
              onChange={(val) => {
                setSelectedSemester(val);
                if (kopJudul.startsWith('PENILAIAN AKHIR SEMESTER') || kopJudul === 'SOAL HER') {
                  const newJudul = isHer ? 'SOAL HER' : `PENILAIAN AKHIR SEMESTER ${val.toUpperCase()}`;
                  setKopJudul(newJudul);
                }
              }}
              options={[
                { value: 'Ganjil', label: 'Ganjil' },
                { value: 'Genap', label: 'Genap' }
              ]}
              placeholder="Pilih Semester"
            />
          </div>

          <div className="filter-group">
            <label>Tipe Ujian</label>
            <CustomSelect
              value={isHer ? 'Her' : 'Utama'}
              onChange={(val) => {
                const her = val === 'Her';
                setIsHer(her);
                if (her) {
                  setKopJudul('SOAL HER');
                } else {
                  setKopJudul(`PENILAIAN AKHIR SEMESTER ${selectedSemester.toUpperCase()}`);
                }
              }}
              options={[
                { value: 'Utama', label: 'Utama' },
                { value: 'Her', label: 'Her (Remedial)' }
              ]}
              placeholder="Tipe Ujian"
            />
          </div>
        </div>
      </div>

      {/* Editor Card */}
      <div className="frosted-card no-print" style={{ gap: '14px' }}>
        
        {/* Navigation Tabs */}
        <div className="custom-tabs-nav">
          <button
            type="button"
            className={`custom-tabs-tab ${activeTabKey === 'kop' ? 'active' : ''}`}
            onClick={() => handleTabChange('kop')}
          >
            <SettingsIcon size={14} />
            <span>Pengaturan Kop</span>
          </button>
          
          {staticTingkatan.map(t => (
            <button
              key={t.key}
              type="button"
              className={`custom-tabs-tab ${activeTabKey === t.key ? 'active' : ''}`}
              onClick={() => handleTabChange(t.key)}
            >
              <Edit size={14} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Children: Kop settings */}
        {activeTabKey === 'kop' ? (
          <form onSubmit={handleSaveKop} className="form-grid-layout">
            <div className="form-group-box">
              <label>Judul Utama</label>
              <input 
                type="text" 
                value={kopJudul} 
                onChange={e => setKopJudul(e.target.value)} 
                placeholder="PENILAIAN AKHIR SEMESTER GANJIL" 
              />
            </div>
            
            <div className="form-group-box">
              <label>Nama Madrasah</label>
              <input 
                type="text" 
                value={kopSubJudul} 
                onChange={e => setKopSubJudul(e.target.value)} 
                placeholder="MADRASAH DINIYYAH AL-HAMID" 
              />
            </div>

            <div className="form-group-box">
              <label>Alamat</label>
              <input 
                type="text" 
                value={kopAlamat} 
                onChange={e => setKopAlamat(e.target.value)} 
                placeholder="Alamat lengkap" 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group-box">
                <label>Hari / Tanggal</label>
                <input 
                  type="text" 
                  value={kopHariTanggal} 
                  onChange={e => setKopHariTanggal(e.target.value)} 
                  placeholder="Senin, 12 Desember 2026" 
                />
              </div>
              <div className="form-group-box">
                <label>Instruksi</label>
                <input 
                  type="text" 
                  value={kopInstruksi} 
                  onChange={e => setKopInstruksi(e.target.value)} 
                  placeholder="KERJAKAN URAIAN SOAL-SOAL DI BAWAH INI !" 
                />
              </div>
            </div>

            {/* Logo Upload Form Box */}
            <div className="form-group-box">
              <label>Logo Madrasah</label>
              <div 
                className="custom-file-uploader-box"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={18} style={{ color: '#64748b' }} />
                <span className="uploader-text">Pilih File Logo Baru</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleLogoUpload}
                />
              </div>
              
              {kopLogo && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={kopLogo} alt="Logo Preview" style={{ maxHeight: '50px', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '6px', padding: '2px' }} />
                  <button 
                    type="button" 
                    className="btn-custom btn-secondary btn-small"
                    style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                    onClick={handleDeleteLogo}
                  >
                    Hapus Logo
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="btn-custom btn-primary">
                <Save size={15} />
                <span>Simpan Kop</span>
              </button>
            </div>
          </form>
        ) : (
          /* Tab Children: Soal List and configurations */
          <div className="form-grid-layout">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group-box">
                <label>Pilih Pelajaran</label>
                <CustomSelect
                  value={selectedMapelId ? String(selectedMapelId) : ''}
                  onChange={(val) => {
                    const numVal = val ? Number(val) : null;
                    setSelectedMapelId(numVal);
                    const mapel = mapelList.find(m => m.id === numVal);
                    if (mapel) {
                      setPelajaranNama(mapel.nama);
                    }
                  }}
                  options={filteredMapel.map(m => ({ 
                    value: String(m.id), 
                    label: m.nama_arab ? `${m.nama} (${m.nama_arab})` : m.nama 
                  }))}
                  placeholder="Pilih Pelajaran"
                />
              </div>
              <div className="form-group-box">
                <label>Nama Kelas di Lembar</label>
                <input 
                  type="text" 
                  value={namaKelasDiLembar} 
                  onChange={e => setNamaKelasDiLembar(e.target.value)} 
                  placeholder="Misal: Kelas 1 A" 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
              <div className="form-group-box">
                <label>Jumlah Garis Jawaban</label>
                <input 
                  type="number" 
                  value={jumlahGaris} 
                  onChange={e => setJumlahGaris(Number(e.target.value))} 
                  placeholder="15" 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignSelf: 'end' }}>
                <button type="button" className="btn-custom btn-primary" onClick={handleSaveToDb}>
                  <Save size={15} />
                  <span>Simpan Lembar</span>
                </button>
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(226,232,240,0.8)', margin: '10px 0' }} />
            
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              Daftar Soal
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {soalList.map((soal, index) => (
                <div key={index} className="soal-item-form">
                  <div className="soal-actions-container">
                    <button 
                      type="button" 
                      className="btn-icon-only" 
                      onClick={() => handleRemoveSoal(index)}
                      title="Hapus Soal"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  
                  <div className="form-group-box" style={{ width: '95%' }}>
                    <label>Soal #{index + 1}</label>
                    <textarea 
                      rows={2} 
                      value={soal.teks}
                      onChange={e => handleSoalFieldChange(index, 'teks', e.target.value)}
                      placeholder="Ketik soal di sini..."
                    />
                  </div>

                  <div className="form-group-box" style={{ width: '95%' }}>
                    <label>Kunci Jawaban #{index + 1} (Opsional)</label>
                    <textarea 
                      rows={2} 
                      value={soal.jawaban}
                      onChange={e => handleSoalFieldChange(index, 'jawaban', e.target.value)}
                      placeholder="Ketik kunci jawaban di sini (opsional)..."
                    />
                  </div>
                </div>
              ))}

              <button 
                type="button" 
                className="dashed-btn" 
                onClick={handleAddSoal}
                style={{ width: '100%', padding: '12px' }}
              >
                <Plus size={15} />
                <span>Tambah Soal</span>
              </button>
            </div>

          </div>
        )}
      </div>

      {/* CUSTOM PREVIEW MODAL */}
      {isPreviewVisible && (
        <div className="custom-preview-modal-overlay">
          <div className="custom-preview-modal">
            <div className="modal-header">
              <h3>Preview Lembar Ujian</h3>
              <button 
                type="button" 
                className="btn-close-modal"
                onClick={() => setIsPreviewVisible(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="mobile-actions" style={{ marginBottom: '16px', display: 'none', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  className="btn-custom btn-primary" 
                  style={{ background: '#ef4444', borderColor: '#ef4444' }} 
                  onClick={() => setIsKunciMode(!isKunciMode)}
                >
                  {isKunciMode ? 'Sembunyikan Kunci' : 'Tampilkan Kunci Jawaban'}
                </button>
              </div>

              <div className="preview-wrapper">
                <div className="kertas-ujian">
                  
                  {/* Kop Surat */}
                  <div className="kop-surat">
                    <div className="logo-ponpes">
                      {kopLogo ? (
                        <img src={kopLogo} alt="Logo" />
                      ) : (
                        <div className="logo-placeholder">LOGO</div>
                      )}
                    </div>
                    <div className="kop-text">
                      <div className="kop-judul">{kopJudul}</div>
                      <div className="kop-subjudul">{kopSubJudul}</div>
                      <div className="kop-alamat">{kopAlamat}</div>
                      <div className="kop-tahun">{kopTahunAjaranText}</div>
                    </div>
                  </div>

                  <div className="border-double"></div>

                  {/* Box Info */}
                  <div className="box-info">
                    <table className="table-info">
                      <tbody>
                        <tr>
                          <td style={{ width: '15%' }}>NAMA</td>
                          <td style={{ width: '2%' }}>:</td>
                          <td style={{ width: '33%' }}>............................................................</td>
                          <td style={{ width: '15%' }}>PELAJARAN</td>
                          <td style={{ width: '2%' }}>:</td>
                          <td style={{ width: '33%' }}>{pelajaranNama}</td>
                        </tr>
                        <tr>
                          <td>KELAS</td>
                          <td>:</td>
                          <td>{namaKelasDiLembar}</td>
                          <td>HARI/TANGGAL</td>
                          <td>:</td>
                          <td>{kopHariTanggal || '...................................'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Instruksi */}
                  <div className="instruksi-ujian">
                    {kopInstruksi}
                  </div>

                  {/* Daftar Soal */}
                  <div className="daftar-soal">
                    <ol>
                      {soalList.map((s, index) => {
                        const teks = s?.teks || '';
                        const jawaban = s?.jawaban || '';
                        return (
                          <li key={index} className={shouldBeRtl(teks) ? 'rtl' : 'ltr'}>
                            <div>{teks}</div>
                            {isKunciMode && jawaban && (
                              <div style={{ color: '#ef4444', fontWeight: 'bold', marginTop: '4px', fontSize: '11pt' }}>
                                Kunci: {jawaban}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  {/* Area Jawaban */}
                  {!isKunciMode && (
                    <div className="area-jawaban">
                      <div className="jawaban-title">JAWABAN</div>
                      <div className="garis-titik-titik">
                        {Array.from({ length: Math.max(0, Number(jumlahGaris) || 15) }).map((_, i) => (
                          <div key={i} className="garis-item"></div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-custom btn-secondary" 
                onClick={() => setIsPreviewVisible(false)}
              >
                Tutup
              </button>
              <button 
                type="button" 
                className="btn-custom btn-secondary" 
                onClick={() => setIsKunciMode(!isKunciMode)}
              >
                {isKunciMode ? 'Sembunyikan Kunci' : 'Tampilkan Kunci'}
              </button>
              <button 
                type="button" 
                className="btn-custom btn-primary" 
                onClick={handlePrint}
                style={{ background: '#0052FF', borderColor: '#0052FF' }}
              >
                <Printer size={15} />
                <span>Cetak Lembar Ujian</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default LembarUjian;

import { useState, useEffect, useMemo } from 'react';
import { 
  Save, 
  RefreshCw, 
  Settings, 
  Edit3, 
  User, 
  BookOpen, 
  CheckCircle, 
  Info, 
  Layout, 
  List, 
  Layers, 
  Calendar, 
  MessageSquare, 
  Zap, 
  Star, 
  Rocket, 
  Trash2, 
  TrendingUp, 
  Book, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  Table as TableIcon, 
  Printer, 
  FileText,
  ChevronDown,
  X,
  Plus
} from 'lucide-react';
import { nilaiService } from '../services/nilaiService';
import { settingsService } from '../services/settingsService';
import { PageHeader, LoadingState, ErrorState, useToast } from '../components/common';
import { RaporSantriForms } from '../components/features/RaporSantriForms';
import { RaporSettingsTab } from '../components/features/RaporSettingsTab';
import { useResponsive } from '../hooks/useResponsive';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import { SmartAlert } from '../components/ui/SmartAlert';
import { jsPDF } from 'jspdf';
import './ManajemenNilai.scss';

export function ManajemenNilai({ mode = 'input' }) {
  const toast = useToast();
  
  // State Master Data
  const [kelas, setKelas] = useState([]);
  const [mataPelajaran, setMataPelajaran] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [tahunAjaran, setTahunAjaran] = useState(null);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [mapelTingkat, setMapelTingkat] = useState([]);
  
  // State Filter & Selection
  const [activeTab, setActiveTab] = useState(
    mode === 'rekap' ? 'rekap' : 'input'
  );
  const [selectedTingkat, setSelectedTingkat] = useState(null);
  const [selectedKelasDetail, setSelectedKelasDetail] = useState(null);
  const [selectedMapel, setSelectedMapel] = useState(null);
  const [selectedKategori, setSelectedKategori] = useState(null);
  const [activeCollapseKeys, setActiveCollapseKeys] = useState(['semester']);
  
  // State Data Nilai
  const [santriList, setSantriList] = useState([]);
  const { isMobile } = useResponsive();
  const [mobileFocusMode, setMobileFocusMode] = useState(mode === 'input-ujian' ? false : isMobile);
  
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(null); // 'saving', 'saved', 'error'
  const [error, setError] = useState(null);
  
  // State Virtual Keypad (Mobile)
  const [activeSantriId, setActiveSantriId] = useState(null);
  const [showKeypad, setShowKeypad] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState('dashboard'); // 'dashboard' or 'input'
  const [pendingConsoleOpen, setPendingConsoleOpen] = useState(false); // Tunggu data santri lalu buka konsol

  // Reset total saat filter kelas/mapel berubah (PENTING: santriList juga harus kosong)
  useEffect(() => {
    if (isMobile && showKeypad) {
      setSantriList([]);
      setActiveSantriId(null);
    }
  }, [selectedKelasDetail, selectedMapel]);

  // Pilih santri pertama otomatis saat data kelas baru sudah masuk
  useEffect(() => {
    if (isMobile && santriList.length > 0 && !activeSantriId) {
      setActiveSantriId(santriList[0].santri_id);
    }
    if (pendingConsoleOpen && santriList.length > 0) {
      setPendingConsoleOpen(false);
      setShowKeypad(true);
    }
  }, [santriList, activeSantriId, pendingConsoleOpen]);

  const [rekapData, setRekapData] = useState([]);
  const [rekapColumns, setRekapColumns] = useState([]);
  const [rekapLoading, setRekapLoading] = useState(false);
  const [isManualRankModalOpen, setIsManualRankModalOpen] = useState(false);
  const [manualRankData, setManualRankData] = useState([]);
  const [manualRankSaveLoading, setManualRankSaveLoading] = useState(false);
  
  // State Kriteria
  const [kriteriaConfig, setKriteriaConfig] = useState(null);
  const [kriteriaType, setKriteriaType] = useState('Angka');
  const [configTeks, setConfigTeks] = useState([]);

  const effectiveKriteriaType = useMemo(() => {
    if (kriteriaConfig && kriteriaConfig.tipe_input) {
      return kriteriaConfig.tipe_input;
    }
    const mapel = mataPelajaran.find(m => m.id === selectedMapel);
    if (mapel && mapel.jenis === 'Qiroah') return 'Angka';
    if (mapel && mapel.jenis === 'Taftisy') return 'Teks';

    if (selectedTingkat === 2 || selectedTingkat === 99) return 'Teks';
    if (selectedTingkat !== 0) return 'Angka';
    return kriteriaType; // Fallback for Sifir
  }, [kriteriaConfig, selectedTingkat, kriteriaType, mataPelajaran, selectedMapel]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [kelasData, mapelData, katData, taData, systemSettings] = await Promise.all([
        nilaiService.fetchKelas(),
        nilaiService.fetchMataPelajaran(),
        nilaiService.fetchKategori(),
        nilaiService.fetchTahunAjaran(),
        settingsService.fetchSettings().catch(() => ({}))
      ]);
      
      const diniyahKelas = Array.isArray(kelasData) ? kelasData.filter(k => k.jenis === 'Diniyah').map(k => {
        if (k.nama === 'SP' && k.tingkat === 1) {
          return { ...k, tingkat: 99 };
        }
        return k;
      }) : [];
      setKelas(diniyahKelas);
      setMataPelajaran(Array.isArray(mapelData) ? mapelData : []);
      setKategori(Array.isArray(katData) ? katData : []);
      setTahunAjaranList(Array.isArray(taData) ? taData : []);

      const activeTA = Array.isArray(taData) ? taData.find(ta => ta.is_active) : null;
      setTahunAjaran(activeTA);
      
      if (Array.isArray(katData)) {
        const activeSemester = systemSettings.active_semester || 'Ganjil';
        const defaultKat = katData.find(k => k.nama?.toLowerCase().includes(activeSemester.toLowerCase()));
        if (defaultKat) {
          setSelectedKategori(defaultKat.id);
        } else if (katData.length > 0) {
          setSelectedKategori(katData[0].id);
        }
      }
    } catch (err) {
      setError('Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  const loadMapelTingkatData = async () => {
    try {
      const data = await nilaiService.fetchMapelTingkat(tahunAjaran?.id, selectedKategori);
      setMapelTingkat(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal memuat mapel tingkat:', err);
    }
  };

  useEffect(() => {
    if (tahunAjaran && selectedKategori) {
      loadMapelTingkatData();
    }
  }, [tahunAjaran, selectedKategori]);

  const mapelCategories = useMemo(() => {
    if (!mataPelajaran || !mataPelajaran.length) return [];
    
    let semesterMapels = mataPelajaran.filter(m => m.jenis === 'Reguler');
    if (selectedTingkat !== null) {
      const allowedMapelIds = mapelTingkat.filter(mt => mt.tingkat === selectedTingkat).map(mt => mt.mata_pelajaran_id);
      semesterMapels = semesterMapels.filter(m => allowedMapelIds.includes(m.id));
    }

    const muhafadzohMini = mataPelajaran.filter(m => 
      m.jenis === 'Muhafadzoh' && m.nama?.toLowerCase().includes('mini')
    );
    const muhafadzohAkbar = mataPelajaran.filter(m => 
      m.jenis === 'Muhafadzoh' && m.nama?.toLowerCase().includes('akbar')
    );
    const qiroah = mataPelajaran.filter(m => m.jenis === 'Qiroah');
    const taftisy = mataPelajaran.filter(m => m.jenis === 'Taftisy');

    const cats = [
      { 
        key: 'semester', 
        label: 'Ujian Semester', 
        items: semesterMapels,
        color: 'blue'
      },
      { 
        key: 'muhafadzoh_mini', 
        label: 'Muhafadzoh Mini', 
        items: muhafadzohMini,
        color: 'purple'
      },
      { 
        key: 'ujian_khusus', 
        label: 'Ujian Khusus', 
        items: [...muhafadzohAkbar, ...qiroah, ...taftisy],
        color: 'gold'
      }
    ].filter(cat => cat.items.length > 0);

    return cats;
  }, [mataPelajaran, mapelTingkat, selectedTingkat]);

  // Reset selectedKelasDetail when tingkat changes
  useEffect(() => {
    setSelectedKelasDetail(null);
    setSantriList([]);
  }, [selectedTingkat]);

  // Load Kriteria when level, mapel, year, or semester changes
  useEffect(() => {
    if (selectedTingkat !== null && selectedMapel) {
      loadKriteria();
    }
  }, [selectedTingkat, selectedMapel, tahunAjaran, selectedKategori]);

  // Load Rekap Nilai when tab is active and selections are made
  useEffect(() => {
    if (activeTab === 'rekap' && selectedKelasDetail && selectedKategori && tahunAjaran) {
      loadRekapData();
    } else if (activeTab === 'rekap') {
      setRekapData([]);
      setRekapColumns([]);
    }
  }, [activeTab, selectedKelasDetail, selectedKategori, tahunAjaran, mapelTingkat]);

  // Auto-select first level and class in input-ujian mode
  useEffect(() => {
    if (mode === 'input-ujian' && kelas.length > 0) {
      const levels = [...new Set(kelas.map(k => k.tingkat))].sort((a, b) => {
        const order = { 0: 0, 1: 1, 99: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7 };
        return (order[a] ?? 999) - (order[b] ?? 999);
      });
      if (selectedTingkat === null && levels.length > 0) {
        const level1 = levels.find(l => l === 1);
        if (level1 !== undefined) {
          setSelectedTingkat(level1);
        } else {
          setSelectedTingkat(levels[0]);
        }
      }
    }
  }, [mode, kelas, selectedTingkat]);

  useEffect(() => {
    if (mode === 'input-ujian' && selectedTingkat !== null && selectedKelasDetail === null) {
      const classOptions = kelas.filter(k => k.tingkat === selectedTingkat);
      if (classOptions.length > 0) {
        setSelectedKelasDetail(classOptions[0].id);
      }
    }
  }, [mode, selectedTingkat, kelas, selectedKelasDetail]);

  const loadRekapData = async () => {
    try {
      setRekapLoading(true);
      const rawData = await nilaiService.fetchRekapNilai({
        tahun_ajaran_id: tahunAjaran.id,
        kelas_id: selectedKelasDetail,
        kategori_evaluasi_id: selectedKategori
      });

      // Pivot data
      const pivoted = {};
      rawData.forEach(row => {
        if (!pivoted[row.santri_id]) {
          pivoted[row.santri_id] = {
            santri_id: row.santri_id,
            nis: row.nis,
            nama: row.nama,
            total_nilai: 0,
            mapel_count: 0,
            peringkat_manual: row.peringkat_manual
          };
        }
        
        const key = `mapel_${row.mata_pelajaran_id}`;
        let displayValue = '-';
        
        const jenis = row.jenis_mapel;
        const isTaftisy = jenis === 'Taftisy';
        const isQiroat = jenis === 'Qiroah';
        const isMuhafadzoh = jenis === 'Muhafadzoh';

        if (isTaftisy) {
          displayValue = row.capaian || '-';
        } else if (isMuhafadzoh) {
          displayValue = row.predikat || (row.nilai_angka !== null ? Number(row.nilai_angka).toString() : '-');
        } else if (row.jenis_mapel === 'Reguler' || isQiroat) {
          displayValue = row.nilai_angka !== null ? Number(row.nilai_angka).toString() : '-';
          if (row.nilai_angka !== null) {
            pivoted[row.santri_id].total_nilai += Number(row.nilai_angka);
            pivoted[row.santri_id].mapel_count++;
          }
        } else {
          displayValue = row.predikat || row.capaian || (row.nilai_angka !== null ? Number(row.nilai_angka).toString() : '-');
        }
        
        pivoted[row.santri_id][key] = displayValue;
      });

      const dataSource = Object.values(pivoted);
      dataSource.forEach(item => {
        item.rata_rata = item.mapel_count > 0 ? (item.total_nilai / item.mapel_count).toFixed(2) : 0;
      });
      dataSource.sort((a, b) => b.total_nilai - a.total_nilai);
      dataSource.forEach((item, idx) => {
        item.peringkat_sistem = idx + 1;
        item.peringkat = item.peringkat_manual || item.peringkat_sistem;
      });

      setRekapData(dataSource);
    } catch (err) {
      toast.error('Gagal memuat rekap nilai');
    } finally {
      setRekapLoading(false);
    }
  };

  const loadKriteria = async () => {
    try {
      const config = await nilaiService.fetchKriteria(selectedTingkat, selectedMapel, tahunAjaran?.id, selectedKategori);
      if (config) {
        setKriteriaConfig(config);
        if (config.tipe_input === 'Teks') {
          setConfigTeks(Array.isArray(config.konfigurasi) ? config.konfigurasi : []);
        } else {
          setConfigTeks([]);
        }
      } else {
        setKriteriaConfig(null);
        setConfigTeks([]);
      }
    } catch (err) {
      console.error('Gagal memuat kriteria:', err);
    }
  };

  const loadSantriAndNilai = async () => {
    if (!tahunAjaran || selectedKelasDetail === null || !selectedMapel) return;
    
    try {
      setLoading(true);
      const filters = {
        tahun_ajaran_id: tahunAjaran.id,
        kelas_id: selectedKelasDetail,
        mapel_id: selectedMapel,
        kategori_id: selectedKategori
      };
      const data = await nilaiService.fetchNilaiSantri(filters);
      setSantriList(data.map(item => ({
        ...item,
        nilai_angka: item.nilai_angka || null,
        predikat: item.predikat || '',
        capaian: item.capaian || ''
      })));
    } catch (err) {
      toast.error('Gagal memuat data santri dan nilai');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedKelasDetail !== null && selectedMapel && selectedKategori) {
      loadSantriAndNilai();
    }
  }, [selectedKelasDetail, selectedMapel, selectedKategori, tahunAjaran]);

  const handleQuickStart = async (mapelType) => {
    if (mataPelajaran.length === 0 || kelas.length === 0) {
      toast.error('Data belum siap. Mohon tunggu sebentar.');
      return;
    }

    let targetMapel = null;
    if (mapelType === 'muhafadzoh') {
      targetMapel = mataPelajaran.find(m => 
        m.nama.toLowerCase().includes('muhafadzoh') || 
        m.nama.toLowerCase().includes('muhafadhah') ||
        m.nama.toLowerCase().includes('muhafadoh') ||
        m.nama.toLowerCase().includes('hafalan')
      );
    } else if (mapelType === 'qiroah') {
      targetMapel = mataPelajaran.find(m => 
        (m.nama.toLowerCase().includes('qiroat') || m.nama.toLowerCase().includes('baca')) && 
        !m.nama.toLowerCase().includes('taftisy')
      );
    } else if (mapelType === 'taftisy') {
      targetMapel = mataPelajaran.find(m => 
        m.nama.toLowerCase().includes('taftisy') || 
        m.nama.toLowerCase().includes('periksa kitab')
      );
    }

    if (!targetMapel) {
      toast.warning(`Mata pelajaran '${mapelType}' tidak ditemukan di konfigurasi.`);
      return;
    }

    setMobileFocusMode(true);
    setSelectedMapel(targetMapel.id);

    const allTingkat = [...new Set(kelas.map(k => k.tingkat))].sort((a, b) => {
      const order = { 0: 0, 1: 1, 99: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7 };
      return (order[a] ?? 999) - (order[b] ?? 999);
    });
    let foundKelasId = null;
    let foundTingkat = null;

    for (const t of allTingkat) {
      const kelasInTingkat = kelas.filter(k => k.tingkat === t);
      for (const kls of kelasInTingkat) {
        try {
          const data = await nilaiService.fetchNilaiSantri({
            tahun_ajaran_id: tahunAjaran.id,
            kelas_id: kls.id,
            mapel_id: targetMapel.id,
            kategori_id: selectedKategori
          });
          if (data && data.length > 0) {
            foundKelasId = kls.id;
            foundTingkat = t;
            break;
          }
        } catch (err) {
          // ignore
        }
      }
      if (foundKelasId) break;
    }

    if (!foundKelasId) {
      toast.warning('Belum ada santri di semua rincian kelas untuk pelajaran ini.');
      setMobileViewMode('input');
      return;
    }

    const namaKelas = kelas.find(k => k.id === foundKelasId)?.nama || '';
    setSelectedTingkat(foundTingkat);
    setSelectedKelasDetail(foundKelasId);
    setMobileViewMode('input');

    if (mapelType === 'muhafadzoh' || mapelType === 'qiroah') {
      toast.success(`${targetMapel.nama} — ${namaKelas}`);
      setPendingConsoleOpen(true);
    } else {
      toast.success(`${targetMapel.nama} — ${namaKelas}`);
      setShowKeypad(false);
    }
  };

  const getPredikat = (nilai) => {
    if (nilai === null || nilai === undefined) return '';
    const scale = (effectiveKriteriaType === 'Angka' && kriteriaConfig?.konfigurasi) ? kriteriaConfig.konfigurasi : {
      'Mumtaz': { min: 95, max: 2000 },
      'Jayyid': { min: 85, max: 94 },
      'Mutawassith': { min: 75, max: 84 },
      'Rodi\'': { min: 0, max: 74 }
    };
    
    const predikatOrder = ['Mumtaz', 'Jayyid', 'Mutawassith', 'Rodi\''];
    for (const pred of predikatOrder) {
      const range = scale[pred];
      if (!range) continue;
      
      let min = range.min !== null && range.min !== undefined && range.min !== '' ? Number(range.min) : null;
      let max = range.max !== null && range.max !== undefined && range.max !== '' ? Number(range.max) : null;
      
      if (pred === 'Mumtaz') {
        const jayyidMax = scale['Jayyid']?.max !== null && scale['Jayyid']?.max !== undefined && scale['Jayyid']?.max !== '' ? Number(scale['Jayyid'].max) : 0;
        min = jayyidMax + 1;
        if (max === null) max = 2000;
      } else if (pred === 'Rodi\'' && max === null && min !== null) {
        max = min;
        min = 0;
      }
      
      if (min === null) min = 0;
      if (max === null) max = 2000;
      if (min > max) {
        const temp = min;
        min = max;
        max = temp;
      }
      
      if (Number(nilai) >= min && Number(nilai) <= max) return pred;
    }
    return '';
  };

  const handleNilaiChange = (santriId, field, value) => {
    setSantriList(prev => prev.map(s => {
      if (s.santri_id === santriId) {
        const newData = { ...s, [field]: value };
        const mapel = mataPelajaran.find(m => m.id === selectedMapel);
        const jenis = mapel?.jenis;
        const isTaftisy = jenis === 'Taftisy';
        const isQiroat = jenis === 'Qiroah';

        if (field === 'nilai_angka') {
          if (jenis === 'Muhafadzoh' && !isTaftisy && !isQiroat) {
            newData.predikat = getPredikat(value);
          } else {
            newData.predikat = '';
          }
        }
        
        if (field === 'capaian' && effectiveKriteriaType === 'Teks') {
          const matched = configTeks.find(c => c.bab === value);
          if (matched && !isTaftisy) newData.predikat = matched.predikat;
        }

        triggerAutoSave(santriId, field, value, newData);
        return newData;
      }
      return s;
    }));
  };

  const triggerAutoSave = async (santriId, field, value, updatedSantri) => {
    if (!selectedMapel || !selectedKelasDetail || !selectedKategori || !tahunAjaran) return;
    
    setAutoSaveStatus('saving');
    try {
      await nilaiService.saveNilaiBulk({
        tahun_ajaran_id: tahunAjaran.id,
        mata_pelajaran_id: selectedMapel,
        kategori_evaluasi_id: selectedKategori,
        data: [{
          santri_id: updatedSantri.santri_id,
          nilai_angka: updatedSantri.nilai_angka,
          capaian: updatedSantri.capaian,
          predikat: updatedSantri.predikat
        }]
      });
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(null), 3000);
    } catch (err) {
      console.error('Auto save failed:', err);
      setAutoSaveStatus('error');
    }
  };

  const saveNilai = async () => {
    try {
      setSaveLoading(true);
      const payload = {
        tahun_ajaran_id: tahunAjaran.id,
        mata_pelajaran_id: selectedMapel,
        kategori_evaluasi_id: selectedKategori,
        data: santriList
      };
      await nilaiService.saveNilaiBulk(payload);
      toast.success('Semua nilai berhasil disimpan!');
    } catch (err) {
      toast.error('Gagal menyimpan nilai');
    } finally {
      setSaveLoading(false);
    }
  };

  const getTingkatLabel = (t) => {
    if (t === 0) return 'Sifir';
    if (t === 99) return 'SP';
    return `Kelas ${t}`;
  };

  const levels = useMemo(() => {
    const uniqueTingkat = [...new Set(kelas.map(k => k.tingkat))].sort((a, b) => {
      const order = { 0: 0, 1: 1, 99: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7 };
      return (order[a] ?? 999) - (order[b] ?? 999);
    });
    return uniqueTingkat;
  }, [kelas]);

  const handleTaftisyManualRankTrigger = () => {
    setManualRankData(rekapData.map(r => ({
      santri_id: r.santri_id,
      nama: r.nama,
      nis: r.nis,
      total_nilai: r.total_nilai,
      rata_rata: r.rata_rata,
      peringkat_sistem: r.peringkat_sistem,
      peringkat_manual: r.peringkat_manual || ''
    })));
    setIsManualRankModalOpen(true);
  };

  const handleManualRankSave = async () => {
    try {
      setManualRankSaveLoading(true);
      const payload = manualRankData
        .filter(d => d.peringkat_manual !== undefined && d.peringkat_manual !== null && d.peringkat_manual !== '')
        .map(d => ({
          santri_id: d.santri_id,
          peringkat_manual: Number(d.peringkat_manual)
        }));
      await nilaiService.saveManualRankBulk(tahunAjaran.id, selectedKelasDetail, selectedKategori, payload);
      toast.success('Peringkat manual berhasil disinkronisasi!');
      setIsManualRankModalOpen(false);
      loadRekapData();
    } catch (err) {
      toast.error('Gagal menyimpan peringkat manual');
    } finally {
      setManualRankSaveLoading(false);
    }
  };

  const handleTaftisyPdfExport = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
      const namaKelas = kelas.find(k => k.id === selectedKelasDetail)?.nama || 'Kelas';
      
      doc.setFontSize(14);
      doc.text(`Rekap Nilai - ${namaKelas}`, 14, 15);
      doc.setFontSize(10);
      doc.text(`Tahun Ajaran: ${tahunAjaran?.kode || ''} | Semester: ${kategori.find(k => k.id === selectedKategori)?.nama || ''}`, 14, 22);

      const allowedMapelIds = mapelTingkat.filter(mt => mt.tingkat === selectedTingkat).map(mt => mt.mata_pelajaran_id);
      const semesterMapels = mataPelajaran.filter(m => m.jenis === 'Reguler' && allowedMapelIds.includes(m.id));
      const akbarMapels = mataPelajaran.filter(m => m.jenis === 'Muhafadzoh' && m.nama?.toLowerCase().includes('akbar'));
      const qiroatulMapels = mataPelajaran.filter(m => m.jenis === 'Qiroah');
      const taftisyulMapels = mataPelajaran.filter(m => m.jenis === 'Taftisy');
      const allRekapMapels = [...semesterMapels, ...akbarMapels, ...qiroatulMapels, ...taftisyulMapels];

      const headers = ['No', 'NIS', 'Nama Santri'];
      allRekapMapels.forEach(m => headers.push(m.nama));
      headers.push('Total', 'Rata-rata', 'Peringkat');

      const body = rekapData.map((row, idx) => {
        const rowData = [idx + 1, row.nis || '-', row.nama || '-'];
        allRekapMapels.forEach(m => {
          const val = row[`mapel_${m.id}`];
          rowData.push(val || '-');
        });
        rowData.push(row.total_nilai, row.rata_rata, row.peringkat);
        return rowData;
      });

      import('jspdf-autotable').then(({ default: autoTable }) => {
        autoTable(doc, {
          head: [headers],
          body: body,
          startY: 28,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [79, 70, 229], textColor: 255, halign: 'center' },
          columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'center' }
          },
          bodyStyles: { valign: 'middle' }
        });
        doc.save(`Rekap_Nilai_${namaKelas}_${tahunAjaran?.kode}.pdf`);
      }).catch(err => {
        toast.error(`Autotable Error: ${err.message}`);
      });
    } catch (err) {
      toast.error(`Gagal membuat berkas PDF: ${err.message}`);
    }
  };

  const getHeaderInfo = () => {
    if (isMobile && mobileViewMode === 'input' && selectedMapel) {
      const mapelName = mataPelajaran.find(m => m.id === selectedMapel)?.nama || '';
      return {
        title: `✍️ Input ${mapelName}`,
        subtitle: "Kelola penilaian santri per kompetensi kelas"
      };
    }

    if (mode === 'rekap') {
      return {
        title: "📊 Rekapitulasi & Rapor Santri",
        subtitle: "Laporan rekapitulasi nilai kumulatif dan pencetakan rapor semester santri"
      };
    }
    return {
      title: "✍️ Input Penilaian Santri",
      subtitle: "Input nilai Muhafadzoh, Qiroatul Kitab, dan Taftisyul Kutub"
    };
  };

  if (loading && !santriList.length && !rekapData.length) {
    return <LoadingState message="Memuat modul manajemen penilaian..." />;
  }

  const headerInfo = getHeaderInfo();
  const classOptions = kelas.filter(k => k.tingkat === selectedTingkat);

  return (
    <div className="nilai-page">
      <PageHeader 
        title={headerInfo.title} 
        subtitle={headerInfo.subtitle}
        extra={[
          <div key="filters" className="header-selectors-row">
            <div className="selector-box">
              <CustomSelect
                value={selectedKategori ? String(selectedKategori) : ''}
                onChange={(val) => {
                  setSelectedKategori(val ? Number(val) : null);
                  localStorage.setItem('sekolah_info_selected_kategori', val);
                }}
                options={kategori
                  .filter(k => !k.nama.toLowerCase().includes('harian') && !k.nama.toLowerCase().includes('tugas'))
                  .map(k => ({ value: String(k.id), label: k.nama }))}
                placeholder="Pilih Semester"
                disabled={showKeypad}
              />
            </div>
            <div className="selector-box">
              <CustomSelect
                value={tahunAjaran?.id ? String(tahunAjaran.id) : ''}
                onChange={(val) => {
                  const selected = tahunAjaranList.find(ta => ta.id === Number(val));
                  setTahunAjaran(selected || null);
                }}
                options={tahunAjaranList.map(ta => ({ value: String(ta.id), label: ta.kode }))}
                placeholder="Tahun Ajaran"
                disabled={showKeypad}
              />
            </div>
          </div>
        ]}
      />

      {isMobile && mobileViewMode === 'dashboard' ? (
        <div className="mobile-dashboard-container" style={{ padding: '0 16px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800 }}>Pilihan Input Cepat</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Pilih modul ujian khusus di bawah untuk memulai</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="frosted-card" style={{ padding: '16px', cursor: 'pointer', display: 'flex', gap: '16px', alignItems: 'center' }} onClick={() => handleQuickStart('muhafadzoh')}>
              <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', color: '#a855f7' }}>
                <Star size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: 700 }}>Muhafadzoh Kubro</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Nadzom hafalan pertingkatan</p>
              </div>
              <ArrowRight size={18} style={{ color: '#94a3b8' }} />
            </div>

            <div className="frosted-card" style={{ padding: '16px', cursor: 'pointer', display: 'flex', gap: '16px', alignItems: 'center' }} onClick={() => handleQuickStart('qiroah')}>
              <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
                <Rocket size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: 700 }}>Qiroatul Kitab</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Ujian membaca kitab kuning</p>
              </div>
              <ArrowRight size={18} style={{ color: '#94a3b8' }} />
            </div>

            <div className="frosted-card" style={{ padding: '16px', cursor: 'pointer', display: 'flex', gap: '16px', alignItems: 'center' }} onClick={() => handleQuickStart('taftisy')}>
              <div style={{ padding: '12px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '12px', color: '#eab308' }}>
                <Zap size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: 700 }}>Taftisyul Kutub</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Pemeriksaan kelengkapan catatan kitab</p>
              </div>
              <ArrowRight size={18} style={{ color: '#94a3b8' }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="page-content" style={{ marginTop: '8px' }}>
          
          {/* Custom Tabs Navigation (for non-ujian mode) */}
          {mode !== 'input-ujian' && mode !== 'rekap' && (
            <div className="custom-tabs-nav">
              <button
                type="button"
                className={`custom-tabs-tab ${activeTab === 'input' ? 'active' : ''}`}
                onClick={() => setActiveTab('input')}
              >
                <Edit3 size={15} />
                <span>Input Nilai</span>
              </button>
              <button
                type="button"
                className={`custom-tabs-tab ${activeTab === 'absensi' ? 'active' : ''}`}
                onClick={() => setActiveTab('absensi')}
              >
                <Calendar size={15} />
                <span>Absensi</span>
              </button>
              <button
                type="button"
                className={`custom-tabs-tab ${activeTab === 'kepribadian' ? 'active' : ''}`}
                onClick={() => setActiveTab('kepribadian')}
              >
                <User size={15} />
                <span>Kepribadian</span>
              </button>
              <button
                type="button"
                className={`custom-tabs-tab ${activeTab === 'catatan' ? 'active' : ''}`}
                onClick={() => setActiveTab('catatan')}
              >
                <MessageSquare size={15} />
                <span>Catatan Wali Kelas</span>
              </button>
              {kategori.find(k => k.id === selectedKategori)?.nama?.toLowerCase().includes('genap') && (
                <button
                  type="button"
                  className={`custom-tabs-tab ${activeTab === 'kenaikan_kelas' ? 'active' : ''}`}
                  onClick={() => setActiveTab('kenaikan_kelas')}
                >
                  <TrendingUp size={15} />
                  <span>Kenaikan Kelas</span>
                </button>
              )}
            </div>
          )}

          {mode === 'rekap' && (
            <div className="custom-tabs-nav">
              <button
                type="button"
                className={`custom-tabs-tab ${activeTab === 'rekap' ? 'active' : ''}`}
                onClick={() => setActiveTab('rekap')}
              >
                <Layers size={15} />
                <span>Rekap Nilai</span>
              </button>
              <button
                type="button"
                className={`custom-tabs-tab ${activeTab === 'pengaturan-rapor' ? 'active' : ''}`}
                onClick={() => setActiveTab('pengaturan-rapor')}
              >
                <Settings size={15} />
                <span>Pengaturan Rapor</span>
              </button>
            </div>
          )}

          {/* TAB: INPUT NILAI (CORE INPUT) */}
          {activeTab === 'input' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {isMobile && (
                <button 
                  type="button" 
                  className="dashed-btn" 
                  onClick={() => setMobileViewMode('dashboard')}
                  style={{ width: 'fit-content' }}
                >
                  <ArrowLeft size={14} />
                  <span>Kembali ke Menu Utama</span>
                </button>
              )}

              {/* Filters Box */}
              <div className="filter-grid-layout">
                
                {/* Column left: Tingkat / Rincian Kelas selection */}
                <div className="frosted-card">
                  <div className="card-header">
                    <div className="card-title-box">
                      <Layers size={16} className="card-icon" />
                      <h3 className="card-title">Pilih Kelas Diniyah</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="selection-container">
                      <h4 className="section-title">Pilih Tingkatan</h4>
                      <div className="levels-pill-grid">
                        {levels.map(t => (
                          <button
                            key={t}
                            type="button"
                            className={`level-pill-btn ${selectedTingkat === t ? 'active' : ''}`}
                            onClick={() => setSelectedTingkat(t)}
                          >
                            {getTingkatLabel(t)}
                          </button>
                        ))}
                      </div>

                      {selectedTingkat !== null && (
                        <div className="class-detail-wrapper">
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Pilih Rincian Kelas:</span>
                          <div className="class-pill-grid">
                            {classOptions.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                className={`class-pill-btn ${selectedKelasDetail === c.id ? 'active' : ''}`}
                                onClick={() => setSelectedKelasDetail(c.id)}
                              >
                                {c.nama}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column right: Mata Pelajaran selection accordion */}
                <div className="frosted-card">
                  <div className="card-header">
                    <div className="card-title-box">
                      <BookOpen size={16} className="card-icon" />
                      <h3 className="card-title">Pilih Mata Pelajaran</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    {selectedTingkat !== null && selectedKelasDetail !== null ? (
                      mode === 'input-ujian' ? (
                        /* Input Ujian Subject selection */
                        <div className="mapel-buttons-grid">
                          {mataPelajaran
                            .filter(m => m.jenis === 'Reguler')
                            .filter(m => {
                              const allowedMapelIds = mapelTingkat.filter(mt => mt.tingkat === selectedTingkat).map(mt => mt.mata_pelajaran_id);
                              return allowedMapelIds.includes(m.id);
                            })
                            .map(m => (
                              <button
                                key={m.id}
                                type="button"
                                className={`mapel-select-btn ${selectedMapel === m.id ? 'active' : ''}`}
                                onClick={() => setSelectedMapel(m.id)}
                              >
                                <span className="bullet-color blue"></span>
                                <span>{m.nama}</span>
                              </button>
                            ))
                          }
                          {mataPelajaran
                            .filter(m => m.jenis === 'Reguler')
                            .filter(m => {
                              const allowedMapelIds = mapelTingkat.filter(mt => mt.tingkat === selectedTingkat).map(mt => mt.mata_pelajaran_id);
                              return allowedMapelIds.includes(m.id);
                            }).length === 0 && (
                              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Tidak ada mata pelajaran reguler yang terjadwal untuk tingkatan ini.</span>
                            )
                          }
                        </div>
                      ) : (
                        /* Normal input subject select categories */
                        <div className="custom-accordion">
                          {mapelCategories.map(cat => {
                            const isExpanded = activeCollapseKeys.includes(cat.key);
                            return (
                              <div key={cat.key} className="accordion-section">
                                <button 
                                  type="button" 
                                  className="accordion-header"
                                  onClick={() => {
                                    if (isExpanded) {
                                      setActiveCollapseKeys(activeCollapseKeys.filter(k => k !== cat.key));
                                    } else {
                                      setActiveCollapseKeys([...activeCollapseKeys, cat.key]);
                                    }
                                  }}
                                >
                                  <span className="accordion-title">{cat.label}</span>
                                  <ChevronDown className={`chevron-icon ${isExpanded ? 'rotated' : ''}`} size={16} />
                                </button>
                                {isExpanded && (
                                  <div className="accordion-content">
                                    <div className="mapel-buttons-grid">
                                      {cat.items.map(m => (
                                        <button
                                          key={m.id}
                                          type="button"
                                          className={`mapel-select-btn ${selectedMapel === m.id ? 'active' : ''}`}
                                          onClick={() => setSelectedMapel(m.id)}
                                        >
                                          <span className={`bullet-color ${cat.color}`}></span>
                                          <span>{m.nama}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <div className="page-empty-box">
                        <Info size={40} className="empty-icon" />
                        <span>Silakan tentukan rincian kelas diniyah terlebih dahulu pada panel kiri.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Santri Penilaian input sheet */}
              {selectedKelasDetail && selectedMapel && selectedKategori ? (
                <div className="frosted-card">
                  <div className="card-header">
                    <div className="card-title-box">
                      <List size={16} className="card-icon" />
                      <h3 className="card-title">
                        Daftar Santri — {kelas.find(k => k.id === selectedKelasDetail)?.nama || ''} ({mataPelajaran.find(m => m.id === selectedMapel)?.nama || ''})
                      </h3>
                    </div>
                    <div className="card-actions">
                      <button 
                        type="button" 
                        className="btn-custom btn-secondary" 
                        onClick={loadSantriAndNilai}
                      >
                        <RefreshCw size={14} />
                        <span>Refresh</span>
                      </button>
                      <button 
                        type="button" 
                        className="btn-custom btn-primary" 
                        onClick={saveNilai}
                        disabled={saveLoading}
                      >
                        {saveLoading ? <span className="loading-spinner"></span> : <><Save size={15} /><span>Simpan Semua</span></>}
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    
                    <div className="table-responsive-nilai">
                      <table className="custom-data-table">
                        <thead>
                          <tr>
                            {!isMobile && <th style={{ width: '120px' }}>NIS</th>}
                            <th>Nama Santri</th>
                            <th style={{ width: '160px', textAlign: 'center' }}>Input Penilaian</th>
                            {!isMobile && <th style={{ width: '160px', textAlign: 'center' }}>Predikat</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {santriList.map((record) => {
                            const mapel = mataPelajaran.find(m => m.id === selectedMapel);
                            const jenis = mapel?.jenis;
                            const isTaftisy = jenis === 'Taftisy';
                            const isQiroat = jenis === 'Qiroah';
                            const isMuhafadzoh = jenis === 'Muhafadzoh';

                            let inputComponent = null;

                            if (isTaftisy) {
                              inputComponent = (
                                <CustomSelect
                                  value={record.capaian || ''}
                                  onChange={(val) => handleNilaiChange(record.santri_id, 'capaian', val || null)}
                                  options={[
                                    { value: 'Tam', label: 'Tam (Lengkap)' },
                                    { value: 'Naqish', label: 'Naqish (Belum Lengkap)' }
                                  ]}
                                  placeholder="Tam / Naqish"
                                />
                              );
                            } else {
                              let useAngka = isQiroat || jenis === 'Reguler';
                              let maxAngka = 100;
                              if (isMuhafadzoh) {
                                maxAngka = 2000;
                                if (effectiveKriteriaType === 'Teks') useAngka = false;
                                else if (effectiveKriteriaType === 'Angka') useAngka = true;
                              }

                              if (useAngka) {
                                const isSelected = activeSantriId === record.santri_id && showKeypad;
                                inputComponent = (
                                  <input 
                                    type="number" 
                                    className="cell-input-number"
                                    min={0}
                                    max={maxAngka}
                                    value={record.nilai_angka ?? ''}
                                    placeholder={`0-${maxAngka}`}
                                    readOnly={isMobile}
                                    onClick={() => {
                                      if (isMobile) {
                                        setActiveSantriId(record.santri_id);
                                        setShowKeypad(true);
                                      }
                                    }}
                                    onChange={(e) => {
                                      const v = e.target.value === '' ? null : Number(e.target.value);
                                      handleNilaiChange(record.santri_id, 'nilai_angka', v);
                                    }}
                                    style={isSelected ? {
                                      borderColor: '#4f46e5',
                                      boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.15)',
                                      backgroundColor: 'rgba(99, 102, 241, 0.02)'
                                    } : {}}
                                  />
                                );
                              } else {
                                inputComponent = (
                                  <CustomSelect
                                    value={record.capaian || ''}
                                    onChange={(val) => handleNilaiChange(record.santri_id, 'capaian', val || null)}
                                    options={configTeks.map(item => ({ value: item.bab, label: item.bab }))}
                                    placeholder="Pilih"
                                  />
                                );
                              }
                            }

                            return (
                              <tr key={record.santri_id}>
                                {!isMobile && <td className="student-nis-cell">{record.nis || '-'}</td>}
                                <td className="student-name-cell">{record.nama}</td>
                                <td>
                                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    {inputComponent}
                                  </div>
                                </td>
                                {!isMobile && (
                                  <td>
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                      {jenis === 'Reguler' || isQiroat || isTaftisy ? (
                                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>-</span>
                                      ) : (
                                        <span className={`predikat-badge ${record.predikat ? record.predikat.toLowerCase().replace("'", "") : 'empty'}`}>
                                          {record.predikat || 'Kosong'}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="frosted-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Info size={40} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>
                    Tentukan filters tingkatan kelas diniyah beserta mata pelajaran di atas untuk memulai penginputan nilai.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB ABSENSI */}
          {activeTab === 'absensi' && (
            <RaporSantriForms 
              type="absensi" 
              tahunAjaran={tahunAjaran} 
              selectedKelasDetail={selectedKelasDetail} 
              selectedKategori={selectedKategori} 
              kelasName={kelas.find(k => k.id === selectedKelasDetail)?.nama}
              kategoriNama={kategori.find(k => k.id === selectedKategori)?.nama}
            />
          )}

          {/* TAB KEPRIBADIAN */}
          {activeTab === 'kepribadian' && (
            <RaporSantriForms 
              type="kepribadian" 
              tahunAjaran={tahunAjaran} 
              selectedKelasDetail={selectedKelasDetail} 
              selectedKategori={selectedKategori} 
              kelasName={kelas.find(k => k.id === selectedKelasDetail)?.nama}
            />
          )}

          {/* TAB CATATAN WALI KELAS */}
          {activeTab === 'catatan' && (
            <RaporSantriForms 
              type="catatan" 
              tahunAjaran={tahunAjaran} 
              selectedKelasDetail={selectedKelasDetail} 
              selectedKategori={selectedKategori} 
              kelasName={kelas.find(k => k.id === selectedKelasDetail)?.nama}
            />
          )}

          {/* TAB KENAIKAN KELAS */}
          {activeTab === 'kenaikan_kelas' && (
            <RaporSantriForms 
              type="kenaikan_kelas" 
              tahunAjaran={tahunAjaran} 
              selectedKelasDetail={selectedKelasDetail} 
              selectedKategori={selectedKategori} 
              kelasName={kelas.find(k => k.id === selectedKelasDetail)?.nama}
            />
          )}

          {/* TAB REKAP & RAPOR */}
          {activeTab === 'rekap' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="frosted-card">
                <div className="card-header">
                  <div className="card-title-box">
                    <Layers size={16} className="card-icon" />
                    <h3 className="card-title">Cakupan Rekap Rapor</h3>
                  </div>
                </div>
                <div className="card-body">
                  <div className="selection-container">
                    <h4 className="section-title">Pilih Tingkatan</h4>
                    <div className="levels-pill-grid">
                      {levels.map(t => (
                        <button
                          key={t}
                          type="button"
                          className={`level-pill-btn ${selectedTingkat === t ? 'active' : ''}`}
                          onClick={() => setSelectedTingkat(t)}
                        >
                          {getTingkatLabel(t)}
                        </button>
                      ))}
                    </div>

                    {selectedTingkat !== null && (
                      <div className="class-detail-wrapper">
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Pilih Rincian Kelas:</span>
                        <div className="class-pill-grid">
                          {classOptions.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              className={`class-pill-btn ${selectedKelasDetail === c.id ? 'active' : ''}`}
                              onClick={() => setSelectedKelasDetail(c.id)}
                            >
                              {c.nama}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedKelasDetail && selectedKategori ? (
                <div className="frosted-card">
                  <div className="card-header">
                    <div className="card-title-box">
                      <TableIcon size={16} className="card-icon" />
                      <h3 className="card-title">
                        Rekap Nilai — {kelas.find(k => k.id === selectedKelasDetail)?.nama || ''}
                      </h3>
                    </div>
                    <div className="card-actions">
                      <button 
                        type="button" 
                        className="btn-custom btn-secondary" 
                        onClick={handleTaftisyManualRankTrigger}
                      >
                        <Settings size={14} />
                        <span>Sesuaikan Peringkat</span>
                      </button>
                      <button 
                        type="button" 
                        className="btn-custom btn-secondary" 
                        onClick={handleTaftisyPdfExport}
                      >
                        <FileText size={14} />
                        <span>Ekspor PDF</span>
                      </button>
                      <button 
                        type="button" 
                        className="btn-custom btn-primary" 
                        onClick={() => window.open(`/rapor-print/${tahunAjaran.id}/${selectedKelasDetail}/${selectedKategori}/all`, '_blank')}
                      >
                        <Printer size={15} />
                        <span>Cetak Rapor Kelas</span>
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    {rekapLoading ? (
                      <div className="page-loading-box">
                        <div className="spinner"></div>
                        <span>Memuat data rekap santri...</span>
                      </div>
                    ) : (
                      <div className="table-responsive-nilai">
                        <table className="custom-data-table">
                          <thead>
                            <tr>
                              <th style={{ width: '100px' }}>NIS</th>
                              <th style={{ minWidth: '180px' }}>Nama Santri</th>
                              {/* Dynamic Subjects columns list */}
                              {mataPelajaran
                                .filter(m => ['Reguler', 'Muhafadzoh', 'Qiroah', 'Taftisy'].includes(m.jenis))
                                .filter(m => {
                                  if (m.jenis === 'Reguler') {
                                    const allowedMapelIds = mapelTingkat.filter(mt => mt.tingkat === selectedTingkat).map(mt => mt.mata_pelajaran_id);
                                    return allowedMapelIds.includes(m.id);
                                  }
                                  return !m.nama?.toLowerCase().includes('mini');
                                })
                                .map(m => <th key={m.id} style={{ textAlign: 'center' }}>{m.nama}</th>)}
                              <th style={{ textAlign: 'center' }}>Total</th>
                              <th style={{ textAlign: 'center' }}>Rata-rata</th>
                              <th style={{ textAlign: 'center', width: '80px' }}>Peringkat</th>
                              <th style={{ textAlign: 'center', width: '120px' }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rekapData.map((row) => (
                              <tr key={row.santri_id}>
                                <td className="student-nis-cell">{row.nis || '-'}</td>
                                <td className="student-name-cell">{row.nama}</td>
                                {/* Render grades for each subject */}
                                {mataPelajaran
                                  .filter(m => ['Reguler', 'Muhafadzoh', 'Qiroah', 'Taftisy'].includes(m.jenis))
                                  .filter(m => {
                                    if (m.jenis === 'Reguler') {
                                      const allowedMapelIds = mapelTingkat.filter(mt => mt.tingkat === selectedTingkat).map(mt => mt.mata_pelajaran_id);
                                      return allowedMapelIds.includes(m.id);
                                    }
                                    return !m.nama?.toLowerCase().includes('mini');
                                  })
                                  .map(m => {
                                    const val = row[`mapel_${m.id}`];
                                    if (!val || val === '-') {
                                      return <td key={m.id} style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>;
                                    }
                                    if (m.jenis === 'Muhafadzoh') {
                                      return (
                                        <td key={m.id} style={{ textAlign: 'center' }}>
                                          <span className={`predikat-badge ${val.toLowerCase().replace("'", "")}`}>
                                            {val}
                                          </span>
                                        </td>
                                      );
                                    }
                                    if (m.jenis === 'Taftisy') {
                                      return (
                                        <td key={m.id} style={{ textAlign: 'center', fontWeight: 'bold', color: val === 'Tam' ? '#10b981' : '#ef4444' }}>
                                          {val}
                                        </td>
                                      );
                                    }
                                    return <td key={m.id} style={{ textAlign: 'center', fontWeight: 'bold' }}>{val}</td>;
                                  })}
                                <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}>{row.total_nilai}</td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.rata_rata}</td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                  <span style={{ 
                                    padding: '4px 8px', 
                                    borderRadius: '50%', 
                                    background: row.peringkat <= 3 ? '#10b981' : '#f1f5f9',
                                    color: row.peringkat <= 3 ? '#ffffff' : '#64748b'
                                  }}>
                                    {row.peringkat}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <button
                                      type="button"
                                      className="btn-custom btn-secondary btn-small"
                                      onClick={() => window.open(`/rapor-print/${tahunAjaran.id}/${selectedKelasDetail}/${selectedKategori}/${row.santri_id}`, '_blank')}
                                    >
                                      <span>Lihat Rapor</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="frosted-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Info size={40} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>
                    Tentukan rincian kelas diniyah terlebih dahulu untuk memuat rekapitulasi penilaian.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB RAPOR SETTINGS */}
          {activeTab === 'pengaturan-rapor' && (
            <div className="frosted-card" style={{ padding: '24px' }}>
              <RaporSettingsTab />
            </div>
          )}

        </div>
      )}

      {/* Dynamic Keypad Console Overlay for mobile input */}
      {isMobile && showKeypad && (
        <div className="mobile-console-overlay">
          <div className="console-container">
            
            <div className="console-fixed-header">
              <div className={`console-status-bar ${autoSaveStatus || 'idle'}`}>
                {autoSaveStatus === 'saving' ? (
                  <div className="loading-spinner"></div>
                ) : autoSaveStatus === 'saved' ? (
                  <CheckCircle size={14} />
                ) : (
                  <Info size={14} />
                )}
                <span>
                  {autoSaveStatus === 'saving' ? 'Menyimpan ke Cloud...' : autoSaveStatus === 'saved' ? 'Penilaian Disimpan!' : 'Siap Input'}
                </span>
              </div>

              <div className="console-selectors">
                <div className="selector-row">
                  <div className="selector-label">Tingkat:</div>
                  <div className="selector-items">
                    {[0, 1, 99, 2, 3, 4, 5, 6].map(t => (
                      <div 
                        key={t} 
                        className={`selector-dot ${selectedTingkat === t ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedTingkat(t);
                          setSelectedKelasDetail(null);
                        }}
                      >
                        {t === 0 ? 'S' : t === 99 ? 'SP' : t}
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedTingkat !== null && (
                  <div className="selector-row">
                    <div className="selector-label">Kelas:</div>
                    <div className="selector-items">
                      {kelas
                        .filter(k => k.tingkat === selectedTingkat)
                        .map(k => (
                          <div 
                            key={k.id} 
                            className={`selector-pill ${selectedKelasDetail === k.id ? 'active' : ''}`}
                            onClick={() => setSelectedKelasDetail(k.id)}
                          >
                            {k.nama.split(' ').pop()}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '10px 0' }} />

              <div className="console-navigation">
                <button 
                  type="button" 
                  className="action-icon-btn" 
                  onClick={() => {
                    const idx = santriList.findIndex(s => s.santri_id === activeSantriId);
                    if (idx > 0) setActiveSantriId(santriList[idx - 1].santri_id);
                  }}
                  disabled={santriList.findIndex(s => s.santri_id === activeSantriId) <= 0}
                >
                  <ArrowLeft size={16} />
                </button>
                
                <div className="active-student-info" style={{ textAlign: 'center' }}>
                  <div className="student-name" style={{ fontWeight: 800, fontSize: '14.5px', color: '#1e293b' }}>
                    {loading ? 'Memuat...' : (santriList.find(s => s.santri_id === activeSantriId)?.nama || 'Pilih Santri')}
                  </div>
                  <div className={`score-preview ${effectiveKriteriaType === 'Teks' ? 'text-mode' : ''}`} style={{ fontSize: '24px', fontWeight: 800, color: '#4f46e5', margin: '4px 0' }}>
                    {loading ? '...' : (
                      effectiveKriteriaType === 'Angka' 
                        ? (Math.floor(santriList.find(s => s.santri_id === activeSantriId)?.nilai_angka ?? 0) || '-')
                        : (santriList.find(s => s.santri_id === activeSantriId)?.capaian || '-')
                    )}
                  </div>
                </div>

                <button 
                  type="button" 
                  className="action-icon-btn" 
                  onClick={() => {
                    const idx = santriList.findIndex(s => s.santri_id === activeSantriId);
                    if (idx < santriList.length - 1) setActiveSantriId(santriList[idx + 1].santri_id);
                  }}
                  disabled={santriList.findIndex(s => s.santri_id === activeSantriId) >= santriList.length - 1}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="console-scrollable-body" style={{ padding: '16px 0' }}>
              <div className="console-input-area">
                {effectiveKriteriaType === 'Angka' ? (
                  <div className="keypad-grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <div key={num} className="key-item" onClick={() => {
                        const currentVal = santriList.find(s => s.santri_id === activeSantriId)?.nilai_angka || 0;
                        const newVal = Number(`${currentVal === 0 ? '' : currentVal}${num}`);
                        if (newVal <= 2000) handleNilaiChange(activeSantriId, 'nilai_angka', newVal);
                      }}>
                        {num}
                      </div>
                    ))}
                    <div className="key-item action" onClick={() => handleNilaiChange(activeSantriId, 'nilai_angka', null)}>C</div>
                    <div className="key-item" onClick={() => {
                      const currentVal = santriList.find(s => s.santri_id === activeSantriId)?.nilai_angka || 0;
                      const newVal = Number(`${currentVal === 0 ? '' : currentVal}0`);
                      if (newVal <= 2000) handleNilaiChange(activeSantriId, 'nilai_angka', newVal);
                    }}>0</div>
                    <div className="key-item delete" onClick={() => {
                      const currentVal = String(santriList.find(s => s.santri_id === activeSantriId)?.nilai_angka || '');
                      const newVal = currentVal.length > 1 ? Number(currentVal.slice(0, -1)) : null;
                      handleNilaiChange(activeSantriId, 'nilai_angka', newVal);
                    }}>⌫</div>
                  </div>
                ) : (
                  <div className="achievement-grid">
                    {configTeks.map((item, idx) => {
                      const isSelected = santriList.find(s => s.santri_id === activeSantriId)?.capaian === item.bab;
                      return (
                        <div 
                          key={idx} 
                          className={`achievement-pill ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            handleNilaiChange(activeSantriId, 'capaian', item.bab);
                            const currentIndex = santriList.findIndex(s => s.santri_id === activeSantriId);
                            if (currentIndex < santriList.length - 1) {
                              setTimeout(() => setActiveSantriId(santriList[currentIndex + 1].santri_id), 300);
                            }
                          }}
                        >
                          <div className="pill-text">{item.bab}</div>
                          <div className="pill-predikat">{item.predikat}</div>
                        </div>
                      );
                    })}
                    <div 
                      className="achievement-pill clear" 
                      onClick={() => handleNilaiChange(activeSantriId, 'capaian', null)}
                    >
                      Kosongkan Data
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="console-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
              {autoSaveStatus === 'saved' && (
                <div style={{ 
                  marginBottom: '14px', 
                  fontSize: '24px', 
                  fontWeight: '800', 
                  color: '#10b981', 
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}>
                  {santriList.find(s => s.santri_id === activeSantriId)?.predikat || '-'}
                </div>
              )}
              <button 
                type="button" 
                className="btn-custom btn-secondary" 
                onClick={() => {
                  setShowKeypad(false);
                  setMobileViewMode('dashboard');
                }}
              >
                Tutup Keypad
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating autosave status indicator */}
      {autoSaveStatus && (
        <div className={`auto-save-indicator ${autoSaveStatus}`}>
          {autoSaveStatus === 'saving' ? (
            <div className="spinner"></div>
          ) : (
            <CheckCircle size={14} className="icon-check" />
          )}
          <span>
            {autoSaveStatus === 'saving' ? 'Menyimpan...' : 'Tersimpan ke Cloud'}
          </span>
        </div>
      )}

      {/* Manual Rank Modal */}
      <CustomModal
        isOpen={isManualRankModalOpen}
        onClose={() => setIsManualRankModalOpen(false)}
        title="Sesuaikan Urutan Peringkat Rapor"
      >
        <div style={{ padding: '4px 0' }}>
          <SmartAlert
            message="Mengubah peringkat di sini tidak akan merubah Total Nilai dan Rata-rata asli yang diolah sistem. Peringkat manual ini akan ditampilkan pada rekap cetak dan buku rapor."
            type="warning"
          />
          
          <div className="rank-adjust-list" style={{ marginTop: '16px' }}>
            {manualRankData.map((row, idx) => (
              <div key={row.santri_id} className="rank-adjust-row">
                <div className="student-info">
                  <span className="name">{row.nama}</span>
                  <span className="desc">Total: {row.total_nilai} | Sistem: #{row.peringkat_sistem}</span>
                </div>
                <div className="input-wrapper">
                  <span>Peringkat:</span>
                  <input
                    type="number"
                    className="rank-input"
                    min={1}
                    value={row.peringkat_manual}
                    onChange={(e) => {
                      const updated = [...manualRankData];
                      updated[idx].peringkat_manual = e.target.value;
                      setManualRankData(updated);
                    }}
                    placeholder={`#${row.peringkat_sistem}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button 
              type="button" 
              className="btn-custom btn-secondary" 
              onClick={() => setIsManualRankModalOpen(false)}
            >
              Batal
            </button>
            <button 
              type="button" 
              className="btn-custom btn-primary" 
              onClick={handleManualRankSave}
              disabled={manualRankSaveLoading}
            >
              {manualRankSaveLoading ? <span className="loading-spinner"></span> : <span>Simpan Peringkat</span>}
            </button>
          </div>
        </div>
      </CustomModal>

    </div>
  );
}
export default ManajemenNilai;

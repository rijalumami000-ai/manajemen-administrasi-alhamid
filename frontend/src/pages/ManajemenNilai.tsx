import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Save, 
  RefreshCw, 
  Settings, 
  Edit3, 
  User, 
  BookOpen, 
  CheckCircle, 
  Info, 
  List, 
  Layers, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Table as TableIcon, 
  Printer, 
  FileText, 
  ChevronDown, 
  Check, 
  Star, 
  Award, 
  BookMarked, 
  School, 
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Search,
  RotateCcw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { nilaiService } from '../services/nilaiService';
import { settingsService } from '../services/settingsService';
import { useToast } from '../components/common';
import { RaporSantriForms } from '../components/features/RaporSantriForms';
import { RaporSettingsTab } from '../components/features/RaporSettingsTab';
import { useResponsive } from '../hooks/useResponsive';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import { SmartAlert } from '../components/ui/SmartAlert';
import type {
  InputSectionType,
  KelasItem,
  MataPelajaranItem,
  KategoriItem,
  TahunAjaranItem,
  MapelTingkatItem,
  SantriNilaiItem,
  KriteriaConfig,
  ConfigTeksItem,
  RekapRowItem,
  ManualRankItem,
  ManajemenNilaiProps
} from '../types/nilai';
import './ManajemenNilai.scss';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function ManajemenNilai({ mode = 'input' }: ManajemenNilaiProps) {
  const toast = useToast();
  const { isMobile } = useResponsive();

  // ── Master Data States ──────────────────────────────────────
  const [kelas, setKelas] = useState<KelasItem[]>([]);
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaranItem[]>([]);
  const [kategori, setKategori] = useState<KategoriItem[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaranItem | null>(null);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranItem[]>([]);
  const [mapelTingkat, setMapelTingkat] = useState<MapelTingkatItem[]>([]);

  // ── Main Tabs & Sub-Section States ─────────────────────────
  const [activeTab, setActiveTab] = useState<string>(
    mode === 'rekap' ? 'rekap' : mode === 'input-ujian' ? 'ujian_tulis' : 'muhafadzoh_mini'
  );
  const [inputSection, setInputSection] = useState<InputSectionType>(
    mode === 'input-ujian' ? 'ujian_tulis' : 'muhafadzoh_mini'
  );
  const [miniSubTab, setMiniSubTab] = useState<number>(1);

  // ── Filter & Class Selection States ────────────────────────
  const [selectedTingkat, setSelectedTingkat] = useState<number | null>(null);
  const [selectedKelasDetail, setSelectedKelasDetail] = useState<number | null>(null);
  const [selectedMapel, setSelectedMapel] = useState<number | null>(null);
  const [selectedKategori, setSelectedKategori] = useState<number | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [modalTingkatFilter, setModalTingkatFilter] = useState<number | 'all'>('all');

  // ── Nilai Data States ───────────────────────────────────────
  const [santriList, setSantriList] = useState<SantriNilaiItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);

  // ── Mobile / Keypad States ─────────────────────────────────
  const [activeSantriId, setActiveSantriId] = useState<number | null>(null);
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [mobileViewMode, setMobileViewMode] = useState<'dashboard' | 'input'>('dashboard');
  const [pendingConsoleOpen, setPendingConsoleOpen] = useState<boolean>(false);

  // ── Rekap Nilai States ─────────────────────────────────────
  const [rekapData, setRekapData] = useState<RekapRowItem[]>([]);
  const [rekapLoading, setRekapLoading] = useState<boolean>(false);
  const [isManualRankModalOpen, setIsManualRankModalOpen] = useState<boolean>(false);
  const [manualRankData, setManualRankData] = useState<ManualRankItem[]>([]);
  const [manualRankSaveLoading, setManualRankSaveLoading] = useState<boolean>(false);
  const [rankSearchQuery, setRankSearchQuery] = useState<string>('');

  // Synchronized horizontal scroll refs
  const rekapTopScrollRef = useRef<HTMLDivElement | null>(null);
  const rekapTableScrollRef = useRef<HTMLDivElement | null>(null);
  const rekapTableRef = useRef<HTMLTableElement | null>(null);
  const isRekapSyncingScroll = useRef<boolean>(false);
  const [rekapTableWidth, setRekapTableWidth] = useState<number>(1200);

  // ── Kriteria States ─────────────────────────────────────────
  const [kriteriaConfig, setKriteriaConfig] = useState<KriteriaConfig | null>(null);
  const [kriteriaType] = useState<'Angka' | 'Teks'>('Angka');
  const [configTeks, setConfigTeks] = useState<ConfigTeksItem[]>([]);

  // ── 1. INITIAL DATA LOADING ─────────────────────────────────
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

      const diniyahKelas = Array.isArray(kelasData)
        ? (kelasData as KelasItem[])
            .filter(k => k.jenis === 'Diniyah')
            .map(k => (k.nama === 'SP' && k.tingkat === 1 ? { ...k, tingkat: 99 } : k))
        : [];

      setKelas(diniyahKelas);
      setMataPelajaran(Array.isArray(mapelData) ? mapelData : []);
      setKategori(Array.isArray(katData) ? katData : []);
      setTahunAjaranList(Array.isArray(taData) ? taData : []);

      const activeTA = Array.isArray(taData) ? taData.find(ta => ta.is_active) : null;
      setTahunAjaran(activeTA || null);

      if (Array.isArray(katData)) {
        const activeSemester = systemSettings.active_semester || 'Ganjil';
        const defaultKat = katData.find(k => k.nama?.toLowerCase().includes(activeSemester.toLowerCase()));
        if (defaultKat) {
          setSelectedKategori(defaultKat.id);
        } else if (katData.length > 0) {
          setSelectedKategori(katData[0].id);
        }
      }

      // Default select first class if available
      if (diniyahKelas.length > 0) {
        setSelectedTingkat(diniyahKelas[0].tingkat);
        setSelectedKelasDetail(diniyahKelas[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data master penilaian.');
    } finally {
      setLoading(false);
    }
  };

  // ── 2. MAPEL TINGKAT PER TAHUN AJARAN & KATEGORI ────────────
  useEffect(() => {
    if (tahunAjaran && selectedKategori) {
      nilaiService.fetchMapelTingkat(tahunAjaran.id, selectedKategori)
        .then(data => setMapelTingkat(Array.isArray(data) ? data : []))
        .catch(err => console.error('Gagal memuat mapel tingkat:', err));
    }
  }, [tahunAjaran, selectedKategori]);

  // Reload kelas per tahun ajaran
  useEffect(() => {
    if (tahunAjaran?.id) {
      nilaiService.fetchKelas(tahunAjaran.id).then(kelasData => {
        const diniyahKelas = Array.isArray(kelasData)
          ? (kelasData as KelasItem[])
              .filter(k => k.jenis === 'Diniyah')
              .map(k => (k.nama === 'SP' && k.tingkat === 1 ? { ...k, tingkat: 99 } : k))
          : [];
        setKelas(diniyahKelas);
      }).catch(err => console.error('Gagal memuat kelas per tahun ajaran:', err));
    }
  }, [tahunAjaran?.id]);

  // Distinct Tingkat levels list
  const levels = useMemo(() => {
    const unique = [...new Set(kelas.map(k => k.tingkat).filter(t => t !== null))] as number[];
    const order: Record<number, number> = { 0: 0, 1: 1, 99: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7 };
    return unique.sort((a, b) => (order[a] ?? 999) - (order[b] ?? 999));
  }, [kelas]);

  const getTingkatLabel = (t: number | null): string => {
    if (t === 0) return 'Sifir';
    if (t === 99) return 'SP';
    if (t === null) return 'Semua';
    return `Kelas ${t}`;
  };

  // ── 3. MAPEL SELECTION PER SUB-TAB ──────────────────────────
  const regularMapelOptions = useMemo(() => {
    if (!mataPelajaran.length) return [];
    let regulars = mataPelajaran.filter(m => m.jenis === 'Reguler');
    if (selectedTingkat !== null) {
      const allowedIds = mapelTingkat
        .filter(mt => mt.tingkat === selectedTingkat)
        .map(mt => mt.mata_pelajaran_id);
      if (allowedIds.length > 0) {
        regulars = regulars.filter(m => allowedIds.includes(m.id));
      }
    }
    return regulars;
  }, [mataPelajaran, mapelTingkat, selectedTingkat]);

  // Synchronize selectedMapel when inputSection, miniSubTab, or selectedTingkat changes
  useEffect(() => {
    if (!mataPelajaran.length) return;

    if (inputSection === 'muhafadzoh_mini') {
      const targetName = `muhafadzoh mini ${miniSubTab}`;
      const target = mataPelajaran.find(m => 
        m.nama?.toLowerCase() === targetName
      ) || mataPelajaran.find(m => 
        m.jenis?.toLowerCase() === 'muhafadzoh' && m.nama?.toLowerCase().includes(`mini ${miniSubTab}`)
      );
      if (target) setSelectedMapel(target.id);
    } else if (inputSection === 'muhafadzoh') {
      const target = mataPelajaran.find(m => 
        m.jenis?.toLowerCase() === 'muhafadzoh' && m.nama?.toLowerCase().includes('akbar')
      ) || mataPelajaran.find(m => m.jenis?.toLowerCase() === 'muhafadzoh' && !m.nama?.toLowerCase().includes('mini'))
        || mataPelajaran.find(m => m.nama?.toLowerCase().includes('muhafadzoh akbar'));
      if (target) setSelectedMapel(target.id);
    } else if (inputSection === 'qiroah') {
      const target = mataPelajaran.find(m => m.jenis?.toLowerCase() === 'qiroah') ||
        mataPelajaran.find(m => m.nama?.toLowerCase().includes('qiroat')) ||
        mataPelajaran.find(m => m.nama?.toLowerCase().includes('qiroah'));
      if (target) setSelectedMapel(target.id);
    } else if (inputSection === 'taftisy') {
      const target = mataPelajaran.find(m => m.jenis?.toLowerCase() === 'taftisy') ||
        mataPelajaran.find(m => m.nama?.toLowerCase().includes('taftisy'));
      if (target) setSelectedMapel(target.id);
    } else if (inputSection === 'ujian_tulis') {
      if (regularMapelOptions.length > 0) {
        // Keep current selectedMapel if it's in regularMapelOptions, else select the first
        const isCurrentRegular = regularMapelOptions.some(m => m.id === selectedMapel);
        if (!isCurrentRegular) {
          setSelectedMapel(regularMapelOptions[0].id);
        }
      }
    }
  }, [inputSection, miniSubTab, mataPelajaran, regularMapelOptions, selectedTingkat]);

  // ── 4. EFFECTIVE KRITERIA TYPE CALCULATION ──────────────────
  const effectiveKriteriaType = useMemo(() => {
    if (kriteriaConfig && kriteriaConfig.tipe_input) {
      return kriteriaConfig.tipe_input;
    }
    const mapel = mataPelajaran.find(m => m.id === selectedMapel);
    if (mapel && mapel.jenis === 'Qiroah') return 'Angka';
    if (mapel && mapel.jenis === 'Taftisy') return 'Teks';

    if (selectedTingkat === 2 || selectedTingkat === 99) return 'Teks';
    if (selectedTingkat !== 0) return 'Angka';
    return kriteriaType;
  }, [kriteriaConfig, selectedTingkat, kriteriaType, mataPelajaran, selectedMapel]);

  // Load Kriteria config when mapel, tingkat, ta, or kategori changes
  useEffect(() => {
    if (selectedTingkat !== null && selectedMapel) {
      nilaiService.fetchKriteria(selectedTingkat, selectedMapel, tahunAjaran?.id, selectedKategori)
        .then(config => {
          if (config) {
            setKriteriaConfig(config);
            setConfigTeks(Array.isArray(config.konfigurasi) ? config.konfigurasi : []);
          } else {
            setKriteriaConfig(null);
            setConfigTeks([]);
          }
        })
        .catch(err => console.error('Gagal memuat kriteria:', err));
    }
  }, [selectedTingkat, selectedMapel, tahunAjaran, selectedKategori]);

  // ── 5. LOAD SANTRI & NILAI SHEET ────────────────────────────
  const loadSantriAndNilai = async () => {
    if (!tahunAjaran || selectedKelasDetail === null || !selectedMapel) return;

    try {
      setLoading(true);
      const filters = {
        tahun_ajaran_id: tahunAjaran.id,
        kelas_id: selectedKelasDetail,
        mapel_id: selectedMapel,
        kategori_id: selectedKategori || undefined
      };
      const data: SantriNilaiItem[] = await nilaiService.fetchNilaiSantri(filters);
      setSantriList(data.map(item => {
        let n: number | string = item.nilai_angka as any;
        if (n !== null && n !== undefined && n !== '') {
          const num = Number(n);
          if (!isNaN(num)) {
            n = Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
          }
        } else {
          n = '';
        }
        return {
          ...item,
          nilai_angka: n,
          predikat: item.predikat || '',
          capaian: item.capaian || ''
        };
      }));
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data santri dan nilai.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedKelasDetail !== null && selectedMapel && selectedKategori) {
      loadSantriAndNilai();
    }
  }, [selectedKelasDetail, selectedMapel, selectedKategori, tahunAjaran]);

  // ── 6. PREDIKAT CALCULATION ─────────────────────────────────
  const getPredikat = (nilai: number | string | null | undefined): string => {
    if (nilai === null || nilai === undefined || nilai === '') return '';
    const scale = (effectiveKriteriaType === 'Angka' && kriteriaConfig?.konfigurasi) 
      ? kriteriaConfig.konfigurasi 
      : {
          'Mumtaz': { min: 95, max: 2000 },
          'Jayyid': { min: 85, max: 94 },
          'Mutawassith': { min: 75, max: 84 },
          'Rodi\'': { min: 0, max: 74 }
        };

    const predikatOrder = ['Mumtaz', 'Jayyid', 'Mutawassith', 'Rodi\''];
    for (const pred of predikatOrder) {
      const range = scale[pred];
      if (!range) continue;

      let min = range.min !== null && range.min !== undefined && range.min !== '' ? Number(range.min) : 0;
      let max = range.max !== null && range.max !== undefined && range.max !== '' ? Number(range.max) : 2000;

      if (pred === 'Mumtaz') {
        const jayyidMax = scale['Jayyid']?.max ? Number(scale['Jayyid'].max) : 0;
        min = jayyidMax + 1;
      } else if (pred === 'Rodi\'' && range.max === null && range.min !== null) {
        max = Number(range.min);
        min = 0;
      }

      if (min > max) {
        const temp = min;
        min = max;
        max = temp;
      }

      if (Number(nilai) >= min && Number(nilai) <= max) return pred;
    }
    return '';
  };

  // ── 7. VALUE CHANGE & AUTO SAVE ─────────────────────────────
  const handleNilaiChange = (santriId: number, field: keyof SantriNilaiItem, value: any) => {
    setSantriList(prev => prev.map(s => {
      if (s.santri_id === santriId) {
        const newData: SantriNilaiItem = { ...s, [field]: value };
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

        triggerAutoSave(newData);
        return newData;
      }
      return s;
    }));
  };

  const autoSaveTimeout = useRef<any>(null);
  const triggerAutoSave = (updatedSantri: SantriNilaiItem) => {
    if (!selectedMapel || !selectedKelasDetail || !selectedKategori || !tahunAjaran) return;

    setAutoSaveStatus('saving');
    clearTimeout(autoSaveTimeout.current);
    autoSaveTimeout.current = setTimeout(async () => {
      try {
        const cleanVal = (updatedSantri.nilai_angka === '' || updatedSantri.nilai_angka === null || updatedSantri.nilai_angka === undefined)
          ? null
          : Number(updatedSantri.nilai_angka);

        await nilaiService.saveNilaiBulk({
          tahun_ajaran_id: tahunAjaran.id,
          mata_pelajaran_id: selectedMapel,
          kategori_evaluasi_id: selectedKategori,
          data: [{
            santri_id: updatedSantri.santri_id,
            nilai_angka: (cleanVal !== null && !isNaN(cleanVal)) ? cleanVal : null,
            capaian: updatedSantri.capaian || null,
            predikat: updatedSantri.predikat || null
          }]
        });
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(null), 3000);
      } catch (err) {
        console.error('Auto save failed:', err);
        setAutoSaveStatus('error');
      }
    }, 600);
  };

  const saveNilai = async () => {
    if (!tahunAjaran || !selectedMapel || !selectedKategori) {
      toast.error('Pastikan tahun ajaran, semester, dan mata pelajaran telah dipilih.');
      return;
    }
    try {
      setSaveLoading(true);
      const cleanData = santriList.map(s => {
        const cleanVal = (s.nilai_angka === '' || s.nilai_angka === null || s.nilai_angka === undefined)
          ? null
          : Number(s.nilai_angka);
        return {
          santri_id: s.santri_id,
          nilai_angka: (cleanVal !== null && !isNaN(cleanVal)) ? cleanVal : null,
          capaian: s.capaian || null,
          predikat: s.predikat || null
        };
      });

      await nilaiService.saveNilaiBulk({
        tahun_ajaran_id: tahunAjaran.id,
        mata_pelajaran_id: selectedMapel,
        kategori_evaluasi_id: selectedKategori,
        data: cleanData
      });
      toast.success('Semua nilai santri berhasil disimpan!');
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menyimpan nilai: ' + (err?.message || 'Error'));
    } finally {
      setSaveLoading(false);
    }
  };

  // ── 8. REKAP DATA LOADING & PDF EXPORT ──────────────────────
  const loadRekapData = async () => {
    if (!tahunAjaran || !selectedKelasDetail || !selectedKategori) return;
    try {
      setRekapLoading(true);
      const rawData = await nilaiService.fetchRekapNilai({
        tahun_ajaran_id: tahunAjaran.id,
        kelas_id: selectedKelasDetail,
        kategori_evaluasi_id: selectedKategori
      });

      const pivoted: Record<number, RekapRowItem> = {};
      rawData.forEach((row: any) => {
        if (!pivoted[row.santri_id]) {
          pivoted[row.santri_id] = {
            santri_id: row.santri_id,
            nis: row.nis || '-',
            nama: row.nama || '-',
            total_nilai: 0,
            mapel_count: 0,
            peringkat_sistem: 0,
            peringkat_manual: row.peringkat_manual,
            peringkat: 0
          };
        }

        const key = `mapel_${row.mata_pelajaran_id}`;
        let displayValue = '-';
        const jenis = row.jenis_mapel;

        if (jenis === 'Taftisy') {
          displayValue = row.capaian || '-';
        } else if (jenis === 'Muhafadzoh') {
          displayValue = row.predikat || (row.nilai_angka !== null ? Number(row.nilai_angka).toString() : '-');
        } else if (jenis === 'Reguler' || jenis === 'Qiroah') {
          displayValue = row.nilai_angka !== null ? Number(row.nilai_angka).toString() : '-';
          if (row.nilai_angka !== null) {
            pivoted[row.santri_id].total_nilai += Number(row.nilai_angka);
            pivoted[row.santri_id].mapel_count = (pivoted[row.santri_id].mapel_count || 0) + 1;
          }
        } else {
          displayValue = row.predikat || row.capaian || (row.nilai_angka !== null ? Number(row.nilai_angka).toString() : '-');
        }

        pivoted[row.santri_id][key] = displayValue;
      });

      const dataSource = Object.values(pivoted);
      dataSource.forEach(item => {
        item.rata_rata = (item.mapel_count || 0) > 0 
          ? (item.total_nilai / (item.mapel_count || 1)).toFixed(2) 
          : '0.00';
      });
      dataSource.sort((a, b) => b.total_nilai - a.total_nilai);
      dataSource.forEach((item, idx) => {
        item.peringkat_sistem = idx + 1;
        item.peringkat = item.peringkat_manual || item.peringkat_sistem;
      });

      setRekapData(dataSource);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat rekap nilai.');
    } finally {
      setRekapLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rekap' && selectedKelasDetail && selectedKategori && tahunAjaran) {
      loadRekapData();
    }
  }, [activeTab, selectedKelasDetail, selectedKategori, tahunAjaran]);

  // Synchronized horizontal scroll for Rekap table
  const handleRekapTopScroll = () => {
    if (isRekapSyncingScroll.current) return;
    isRekapSyncingScroll.current = true;
    if (rekapTableScrollRef.current && rekapTopScrollRef.current) {
      rekapTableScrollRef.current.scrollLeft = rekapTopScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isRekapSyncingScroll.current = false; });
  };

  const handleRekapTableScroll = () => {
    if (isRekapSyncingScroll.current) return;
    isRekapSyncingScroll.current = true;
    if (rekapTopScrollRef.current && rekapTableScrollRef.current) {
      rekapTopScrollRef.current.scrollLeft = rekapTableScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isRekapSyncingScroll.current = false; });
  };

  useEffect(() => {
    if (rekapTableRef.current) {
      const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
          if (entry.target) {
            setRekapTableWidth(entry.target.scrollWidth || (entry as any).contentRect.width);
          }
        }
      });
      observer.observe(rekapTableRef.current);
      return () => observer.disconnect();
    }
  }, [rekapData, mataPelajaran, selectedTingkat]);

  // Export PDF Rekap Nilai
  const handleTaftisyPdfExport = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
      const currentClass = kelas.find(k => k.id === selectedKelasDetail);
      const namaKelas = currentClass?.nama || 'Kelas';

      doc.setFontSize(14);
      doc.text(`Rekap Nilai - ${namaKelas}`, 14, 15);
      doc.setFontSize(10);
      doc.text(
        `Tahun Ajaran: ${tahunAjaran?.kode || ''} | Semester: ${kategori.find(k => k.id === selectedKategori)?.nama || ''}`, 
        14, 
        22
      );

      const allowedIds = mapelTingkat
        .filter(mt => mt.tingkat === selectedTingkat)
        .map(mt => mt.mata_pelajaran_id);
      const semesterMapels = mataPelajaran.filter(m => m.jenis === 'Reguler' && allowedIds.includes(m.id));
      const akbarMapels = mataPelajaran.filter(m => m.jenis === 'Muhafadzoh' && m.nama?.toLowerCase().includes('akbar'));
      const qiroatulMapels = mataPelajaran.filter(m => m.jenis === 'Qiroah');
      const taftisyulMapels = mataPelajaran.filter(m => m.jenis === 'Taftisy');
      const allRekapMapels = [...semesterMapels, ...akbarMapels, ...qiroatulMapels, ...taftisyulMapels];

      const headers = ['No', 'NIS', 'Nama Santri', ...allRekapMapels.map(m => m.nama), 'Total', 'Rata-rata', 'Peringkat'];

      const body = rekapData.map((row, idx) => {
        const rowData = [idx + 1, row.nis || '-', row.nama || '-'];
        allRekapMapels.forEach(m => {
          const val = row[`mapel_${m.id}`];
          rowData.push(val || '-');
        });
        rowData.push(row.total_nilai, row.rata_rata, row.peringkat);
        return rowData;
      });

      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 28,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, halign: 'center' },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'center' }
        },
        bodyStyles: { valign: 'middle' }
      });
      doc.save(`Rekap_Nilai_${namaKelas}_${tahunAjaran?.kode}.pdf`);
      toast.success('Ekspor PDF rekap nilai berhasil diunduh.');
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengekspor berkas PDF: ' + (err?.message || 'Error'));
    }
  };

  // Manual Rank Adjustment Memos & Handlers
  const duplicateRanks = useMemo(() => {
    const counts: Record<string, number> = {};
    manualRankData.forEach(d => {
      const val = String(d.peringkat_manual ?? '').trim();
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return Object.keys(counts).filter(k => counts[k] > 1);
  }, [manualRankData]);

  const filteredRankData = useMemo(() => {
    if (!rankSearchQuery.trim()) return manualRankData;
    const q = rankSearchQuery.toLowerCase();
    return manualRankData.filter(d => 
      d.nama?.toLowerCase().includes(q) || (d.nis && String(d.nis).toLowerCase().includes(q))
    );
  }, [manualRankData, rankSearchQuery]);

  const handleOpenManualRankModal = () => {
    if (!rekapData || rekapData.length === 0) {
      toast.warning('Pilih kelas terlebih dahulu atau data rekap masih kosong.');
      return;
    }
    setRankSearchQuery('');
    setManualRankData(rekapData.map((r, idx) => ({
      santri_id: r.santri_id,
      nama: r.nama,
      nis: r.nis,
      total_nilai: r.total_nilai,
      rata_rata: r.rata_rata,
      peringkat_sistem: r.peringkat_sistem || (idx + 1),
      peringkat_manual: r.peringkat_manual ?? r.peringkat ?? (idx + 1)
    })));
    setIsManualRankModalOpen(true);
  };

  const handleManualRankSave = async () => {
    if (!tahunAjaran || !selectedKategori) return;
    try {
      setManualRankSaveLoading(true);
      const payload = manualRankData.map(d => ({
        santri_id: d.santri_id,
        peringkat_manual: d.peringkat_manual !== '' ? Number(d.peringkat_manual) : null
      }));
      await nilaiService.savePeringkatManual({
        tahun_ajaran_id: tahunAjaran.id,
        kategori_evaluasi_id: selectedKategori,
        data: payload
      });
      toast.success('Peringkat berhasil disesuaikan!');
      setIsManualRankModalOpen(false);
      loadRekapData();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menyimpan peringkat: ' + (err?.message || 'Error'));
    } finally {
      setManualRankSaveLoading(false);
    }
  };

  // ── 9. MODAL CLASS SELECTION ────────────────────────────────
  const filteredModalClasses = useMemo(() => {
    if (modalTingkatFilter === 'all') return kelas;
    return kelas.filter(k => k.tingkat === modalTingkatFilter);
  }, [kelas, modalTingkatFilter]);

  const activeClassObj = useMemo(() => {
    return kelas.find(k => k.id === selectedKelasDetail) || null;
  }, [kelas, selectedKelasDetail]);

  const activeMapelObj = useMemo(() => {
    return mataPelajaran.find(m => m.id === selectedMapel) || null;
  }, [mataPelajaran, selectedMapel]);

  // Quick Class Selection Bar (Tingkatan & Rincian Kelas pills)
  const renderClassSwitcherBar = () => {
    if (!kelas || kelas.length === 0) return null;
    return (
      <div className="rapor-class-switcher-bar">
        <div className="switcher-group">
          <div className="switcher-label-wrapper">
            <Layers size={14} className="switcher-icon" />
            <span className="switcher-title">Tingkatan:</span>
          </div>
          <div className="switcher-pills">
            {levels.map(t => (
              <button
                key={t}
                type="button"
                className={`switcher-pill-btn ${selectedTingkat === t ? 'active' : ''}`}
                onClick={() => {
                  setSelectedTingkat(t);
                  const classesInT = kelas.filter(k => k.tingkat === t);
                  if (classesInT.length > 0) {
                    setSelectedKelasDetail(classesInT[0].id);
                  }
                }}
              >
                {getTingkatLabel(t)}
              </button>
            ))}
          </div>
        </div>

        {selectedTingkat !== null && (
          <div className="switcher-group">
            <div className="switcher-label-wrapper">
              <span className="switcher-title">Rincian Kelas:</span>
            </div>
            <div className="switcher-pills">
              {kelas
                .filter(k => k.tingkat === selectedTingkat)
                .map(k => (
                  <button
                    key={k.id}
                    type="button"
                    className={`switcher-pill-btn sub-class ${selectedKelasDetail === k.id ? 'active' : ''}`}
                    onClick={() => setSelectedKelasDetail(k.id)}
                  >
                    {k.nama}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Options for Header selects
  const semesterOptions = kategori
    .filter(k => !k.nama.toLowerCase().includes('harian') && !k.nama.toLowerCase().includes('tugas'))
    .map(k => ({ value: String(k.id), label: k.nama }));

  const taOptions = tahunAjaranList.map(ta => ({
    value: String(ta.id),
    label: `${ta.kode} ${ta.is_active ? '(Aktif)' : ''}`
  }));

  // Title & Subtitle based on active page mode
  const pageTitle = mode === 'rekap' 
    ? 'Rekapitulasi & Rapor Santri' 
    : mode === 'input-ujian' 
      ? 'Input Nilai Ujian Semester' 
      : 'Input Penilaian Santri';

  const pageSubtitle = mode === 'rekap'
    ? 'Laporan rekapitulasi nilai kumulatif, peringkat santri, dan pencetakan rapor semester'
    : 'Kelola penilaian Muhafadzoh Akbar, Qiroatul Kitab, Taftisyul Kutub, dan Ujian Tulis';

  return (
    <div className="nilai-page">
      {/* ── 1. APPLE FLOATING DOCK HEADER (STRICTLY NO ICON IN TEXT BLOCK) ── */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">{pageTitle}</h2>
          <p className="page-subtitle">{pageSubtitle}</p>
        </div>

        <div className="header-actions-row">
          {/* Semester Selector */}
          <div style={{ minWidth: '150px' }}>
            <CustomSelect
              value={selectedKategori ? String(selectedKategori) : ''}
              onChange={(val) => {
                const num = val ? Number(val) : null;
                setSelectedKategori(num);
                if (val) localStorage.setItem('sekolah_info_selected_kategori', val);
              }}
              options={semesterOptions}
              placeholder="Pilih Semester"
            />
          </div>

          {/* Tahun Ajaran Selector */}
          <div style={{ minWidth: '160px' }}>
            <CustomSelect
              value={tahunAjaran?.id ? String(tahunAjaran.id) : ''}
              onChange={(val) => {
                const sel = tahunAjaranList.find(t => t.id === Number(val));
                setTahunAjaran(sel || null);
              }}
              options={taOptions}
              placeholder="Tahun Ajaran"
            />
          </div>

          {/* Class Picker Trigger Capsule Button */}
          <button
            type="button"
            className={`class-picker-trigger-btn ${activeClassObj ? 'has-selected' : ''}`}
            onClick={() => {
              if (activeClassObj?.tingkat !== undefined && activeClassObj.tingkat !== null) {
                setModalTingkatFilter(activeClassObj.tingkat);
              } else {
                setModalTingkatFilter('all');
              }
              setIsClassModalOpen(true);
            }}
            title="Klik untuk memilih rombongan belajar / kelas diniyah"
          >
            <div className="class-icon-badge">
              <School size={13} />
            </div>
            <div className="class-trigger-text">
              {activeClassObj 
                ? (activeClassObj.nama.toLowerCase().startsWith('kelas') 
                    ? activeClassObj.nama 
                    : `Kelas ${activeClassObj.nama}`) 
                : 'Pilih Kelas Diniyah'}
            </div>
            <ChevronDown size={14} className="chevron-icon" />
          </button>

          {/* Save Button in Header for Quick Access */}
          {['muhafadzoh', 'qiroah', 'taftisy', 'ujian_tulis'].includes(activeTab) && activeClassObj && (
            <button
              type="button"
              className="action-pill-btn primary-pill"
              onClick={saveNilai}
              disabled={saveLoading || !santriList.length}
            >
              {saveLoading ? <span className="loading-spinner"></span> : <Save size={14} />}
              <span>Simpan Semua</span>
            </button>
          )}
        </div>
      </header>

      {/* ── 2. MAIN SEGMENTED CONTROL TABS DOCK ───────────────────────── */}
      {mode !== 'input-ujian' && mode !== 'rekap' && (
        <nav className="tactile-tabs-nav">
          {/* Ujian & Penilaian Spesifik */}
          <button
            type="button"
            className={`tactile-tab-pill ${activeTab === 'muhafadzoh_mini' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('muhafadzoh_mini');
              setInputSection('muhafadzoh_mini');
            }}
          >
            <Award size={15} />
            <span>Muhafadzoh Mini</span>
          </button>
          <button
            type="button"
            className={`tactile-tab-pill ${activeTab === 'muhafadzoh' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('muhafadzoh');
              setInputSection('muhafadzoh');
            }}
          >
            <Star size={15} />
            <span>Muhafadzoh Akbar</span>
          </button>
          <button
            type="button"
            className={`tactile-tab-pill ${activeTab === 'qiroah' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('qiroah');
              setInputSection('qiroah');
            }}
          >
            <BookOpen size={15} />
            <span>Qiroatul Kitab</span>
          </button>
          <button
            type="button"
            className={`tactile-tab-pill ${activeTab === 'taftisy' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('taftisy');
              setInputSection('taftisy');
            }}
          >
            <BookMarked size={15} />
            <span>Taftisyul Kutub</span>
          </button>
          <button
            type="button"
            className={`tactile-tab-pill ${activeTab === 'ujian_tulis' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('ujian_tulis');
              setInputSection('ujian_tulis');
            }}
          >
            <FileText size={15} />
            <span>Ujian Tulis</span>
          </button>

          <div className="tabs-nav-divider" />

          {/* Dokumen & Pelengkap Rapor */}
          <button
            type="button"
            className={`tactile-tab-pill ${activeTab === 'absensi' ? 'active' : ''}`}
            onClick={() => setActiveTab('absensi')}
          >
            <Calendar size={15} />
            <span>Absensi Rapor</span>
          </button>
          <button
            type="button"
            className={`tactile-tab-pill ${activeTab === 'kepribadian' ? 'active' : ''}`}
            onClick={() => setActiveTab('kepribadian')}
          >
            <User size={15} />
            <span>Kepribadian</span>
          </button>
          <button
            type="button"
            className={`tactile-tab-pill ${activeTab === 'catatan' ? 'active' : ''}`}
            onClick={() => setActiveTab('catatan')}
          >
            <MessageSquare size={15} />
            <span>Catatan Wali Kelas</span>
          </button>
          {kategori.find(k => k.id === selectedKategori)?.nama?.toLowerCase().includes('genap') && (
            <button
              type="button"
              className={`tactile-tab-pill ${activeTab === 'kenaikan_kelas' ? 'active' : ''}`}
              onClick={() => setActiveTab('kenaikan_kelas')}
            >
              <TrendingUp size={15} />
              <span>Kenaikan Kelas</span>
            </button>
          )}
        </nav>
      )}

      {mode === 'rekap' && (
        <nav className="tactile-tabs-nav">
          <button
            type="button"
            className={`tactile-tab-pill ${activeTab === 'rekap' ? 'active' : ''}`}
            onClick={() => setActiveTab('rekap')}
          >
            <Layers size={15} />
            <span>Rekap Nilai Kumulatif</span>
          </button>
          <button
            type="button"
            className={`tactile-tab-pill ${activeTab === 'pengaturan-rapor' ? 'active' : ''}`}
            onClick={() => setActiveTab('pengaturan-rapor')}
          >
            <Settings size={15} />
            <span>Pengaturan Format Rapor</span>
          </button>
        </nav>
      )}

      {/* ── 3. TAB CONTENT: INPUT PENILAIAN (MUHAFADZOH MINI, MUHAFADZOH AKBAR, QIROAH, TAFTISY, UJIAN TULIS) ── */}
      {['muhafadzoh_mini', 'muhafadzoh', 'qiroah', 'taftisy', 'ujian_tulis'].includes(activeTab) && (
        <div className="input-sections-container">
          <div className="liquid-glass-table-card">
            
            {/* Quick Class Selection Bar (Tingkatan & Rincian Kelas) */}
            {renderClassSwitcherBar()}

            {/* Sub-Pills for Muhafadzoh Mini (Mini 1, Mini 2, Mini 3, Mini 4) */}
            {activeTab === 'muhafadzoh_mini' && (
              <div className="regular-mapel-pills-bar mini-subtabs-bar">
                <span className="mapel-pill-label">
                  <Sparkles size={13} style={{ color: '#0284c7' }} />
                  <span>Pilih Evaluasi Mini:</span>
                </span>
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`mapel-sub-pill ${miniSubTab === num ? 'active' : ''}`}
                    onClick={() => setMiniSubTab(num)}
                  >
                    Muhafadzoh Mini {num}
                  </button>
                ))}
              </div>
            )}

            {/* Sub-Pills for regular exam subjects when in 'ujian_tulis' tab */}
            {activeTab === 'ujian_tulis' && regularMapelOptions.length > 0 && (
              <div className="regular-mapel-pills-bar">
                <span className="mapel-pill-label">
                  <Sparkles size={13} style={{ color: '#d97706' }} />
                  <span>Pilih Mata Pelajaran:</span>
                </span>
                {regularMapelOptions.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    className={`mapel-sub-pill ${selectedMapel === m.id ? 'active' : ''}`}
                    onClick={() => setSelectedMapel(m.id)}
                  >
                    {m.nama}
                  </button>
                ))}
              </div>
            )}

            {/* Core Table / Data View */}
            {activeClassObj && selectedMapel ? (
              <>
                <div className="table-top-bar">
                  <div className="info-cluster">
                    <h3 className="cluster-title">
                      {activeClassObj.nama} • {activeMapelObj?.nama || 'Mata Pelajaran'}
                    </h3>
                    <span className="cluster-count-pill">
                      {santriList.length} Santri Terdaftar
                    </span>
                  </div>

                  <div className="actions-cluster">
                    <button
                      type="button"
                      className="action-pill-btn"
                      onClick={loadSantriAndNilai}
                      title="Muat ulang data nilai dari server"
                    >
                      <RefreshCw size={13} />
                      <span>Segarkan</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn primary-pill"
                      onClick={saveNilai}
                      disabled={saveLoading || !santriList.length}
                    >
                      {saveLoading ? <span className="loading-spinner"></span> : <Save size={13} />}
                      <span>Simpan Nilai</span>
                    </button>
                  </div>
                </div>

                <div className="table-responsive-box">
                  <table className="glass-input-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                        <th style={{ width: '280px', textAlign: 'left' }}>Identitas Santri</th>
                        <th style={{ width: '220px', textAlign: 'center' }}>
                          Input Nilai ({activeMapelObj?.nama || 'Pelajaran'})
                        </th>
                        {inputSection !== 'ujian_tulis' && (
                          <th style={{ width: '180px', textAlign: 'center' }}>Predikat / Capaian</th>
                        )}
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {santriList.map((record, index) => {
                        const isTaftisy = inputSection === 'taftisy';
                        const isQiroat = inputSection === 'qiroah';
                        const isMuhafadzoh = inputSection === 'muhafadzoh' || inputSection === 'muhafadzoh_mini';

                        let inputElement: React.ReactNode = null;

                        if (isTaftisy) {
                          inputElement = (
                            <div className="taftisy-toggle-wrap">
                              <button
                                type="button"
                                className={`taftisy-pill-opt ${record.capaian === 'Tam' ? 'active-tam' : ''}`}
                                onClick={() => handleNilaiChange(record.santri_id, 'capaian', 'Tam')}
                              >
                                Tam (Lengkap)
                              </button>
                              <button
                                type="button"
                                className={`taftisy-pill-opt ${record.capaian === 'Naqish' ? 'active-naqish' : ''}`}
                                onClick={() => handleNilaiChange(record.santri_id, 'capaian', 'Naqish')}
                              >
                                Naqish
                              </button>
                            </div>
                          );
                        } else {
                          let useNumeric = isQiroat || inputSection === 'ujian_tulis';
                          let maxVal = 100;
                          if (isMuhafadzoh) {
                            maxVal = 2000;
                            if (effectiveKriteriaType === 'Teks') useNumeric = false;
                            else if (effectiveKriteriaType === 'Angka') useNumeric = true;
                          }

                          if (useNumeric) {
                            inputElement = (
                              <input
                                type="number"
                                className="tactile-number-input"
                                min={0}
                                max={maxVal}
                                value={record.nilai_angka ?? ''}
                                placeholder={`0 - ${maxVal}`}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : Number(e.target.value);
                                  handleNilaiChange(record.santri_id, 'nilai_angka', val);
                                }}
                              />
                            );
                          } else {
                            inputElement = (
                              <div style={{ width: '180px' }}>
                                <CustomSelect
                                  value={record.capaian || ''}
                                  onChange={(val) => handleNilaiChange(record.santri_id, 'capaian', val || null)}
                                  options={configTeks.map(item => ({ value: item.bab, label: item.bab }))}
                                  placeholder="Pilih Bab/Capaian"
                                />
                              </div>
                            );
                          }
                        }

                        // Predikat badge style
                        const predikatVal = record.predikat || '';
                        const predikatClass = predikatVal
                          ? predikatVal.toLowerCase().replace("'", "")
                          : 'empty';

                        return (
                          <tr key={record.santri_id}>
                            <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                              {index + 1}
                            </td>
                            <td>
                              <div className="person-lens-cell">
                                <div className="lens-orb-avatar">
                                  {record.foto_url ? (
                                    <img
                                      src={`${API_BASE}${record.foto_url}`}
                                      alt={record.nama}
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        target.style.display = 'none';
                                        const next = target.nextElementSibling as HTMLElement | null;
                                        if (next) next.style.display = 'block';
                                      }}
                                    />
                                  ) : null}
                                  <span style={{ display: record.foto_url ? 'none' : 'block' }}>
                                    {record.nama ? record.nama.charAt(0).toUpperCase() : 'S'}
                                  </span>
                                </div>
                                <div className="person-name-stack">
                                  <span className="person-name">{record.nama}</span>
                                  <span className="person-nis">NIS: {record.nis || '-'}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                {inputElement}
                              </div>
                            </td>
                            {inputSection !== 'ujian_tulis' && (
                              <td>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  {isTaftisy ? (
                                    <span 
                                      style={{ 
                                        fontWeight: 800, 
                                        color: record.capaian === 'Tam' ? '#059669' : record.capaian === 'Naqish' ? '#dc2626' : '#94a3b8' 
                                      }}
                                    >
                                      {record.capaian || '-'}
                                    </span>
                                  ) : isMuhafadzoh ? (
                                    <span className={`predikat-chip ${predikatClass}`}>
                                      {predikatVal || 'Belum Diisi'}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>-</span>
                                  )}
                                </div>
                              </td>
                            )}
                            <td></td>
                          </tr>
                        );
                      })}

                      {santriList.length === 0 && (
                        <tr>
                          <td colSpan={inputSection === 'ujian_tulis' ? 4 : 5} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                            Belum ada data santri pada kelas ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="liquid-empty-hero" style={{ padding: '40px 20px' }}>
                <div className="empty-orb-icon">
                  <School size={32} />
                </div>
                <h3 className="empty-title">Pilih Kelas Diniyah dari Tombol di Atas</h3>
                <p className="empty-desc">
                  Silakan pilih Tingkatan dan Rincian Kelas pada baris tombol di atas untuk memuat daftar santri.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. TAB CONTENT: ABSENSI, KEPRIBADIAN, CATATAN, KENAIKAN KELAS ── */}
      {activeTab === 'absensi' && (
        <RaporSantriForms 
          type="absensi" 
          tahunAjaran={tahunAjaran} 
          selectedKelasDetail={selectedKelasDetail} 
          selectedKategori={selectedKategori} 
          kelasName={activeClassObj?.nama}
          kategoriNama={kategori.find(k => k.id === selectedKategori)?.nama}
          kelasList={kelas}
          levels={levels}
          selectedTingkat={selectedTingkat}
          onSelectTingkat={(t: number) => {
            setSelectedTingkat(t);
            const classesInT = kelas.filter(k => k.tingkat === t);
            if (classesInT.length > 0) setSelectedKelasDetail(classesInT[0].id);
          }}
          onSelectKelasDetail={setSelectedKelasDetail}
          getTingkatLabel={getTingkatLabel}
        />
      )}

      {activeTab === 'kepribadian' && (
        <RaporSantriForms 
          type="kepribadian" 
          tahunAjaran={tahunAjaran} 
          selectedKelasDetail={selectedKelasDetail} 
          selectedKategori={selectedKategori} 
          kelasName={activeClassObj?.nama}
          kategoriNama={kategori.find(k => k.id === selectedKategori)?.nama}
          kelasList={kelas}
          levels={levels}
          selectedTingkat={selectedTingkat}
          onSelectTingkat={(t: number) => {
            setSelectedTingkat(t);
            const classesInT = kelas.filter(k => k.tingkat === t);
            if (classesInT.length > 0) setSelectedKelasDetail(classesInT[0].id);
          }}
          onSelectKelasDetail={setSelectedKelasDetail}
          getTingkatLabel={getTingkatLabel}
        />
      )}

      {activeTab === 'catatan' && (
        <RaporSantriForms 
          type="catatan" 
          tahunAjaran={tahunAjaran} 
          selectedKelasDetail={selectedKelasDetail} 
          selectedKategori={selectedKategori} 
          kelasName={activeClassObj?.nama}
          kategoriNama={kategori.find(k => k.id === selectedKategori)?.nama}
          kelasList={kelas}
          levels={levels}
          selectedTingkat={selectedTingkat}
          onSelectTingkat={(t: number) => {
            setSelectedTingkat(t);
            const classesInT = kelas.filter(k => k.tingkat === t);
            if (classesInT.length > 0) setSelectedKelasDetail(classesInT[0].id);
          }}
          onSelectKelasDetail={setSelectedKelasDetail}
          getTingkatLabel={getTingkatLabel}
        />
      )}

      {activeTab === 'kenaikan_kelas' && (
        <RaporSantriForms 
          type="kenaikan_kelas" 
          tahunAjaran={tahunAjaran} 
          selectedKelasDetail={selectedKelasDetail} 
          selectedKategori={selectedKategori} 
          kelasName={activeClassObj?.nama}
          kategoriNama={kategori.find(k => k.id === selectedKategori)?.nama}
          kelasList={kelas}
          levels={levels}
          selectedTingkat={selectedTingkat}
          onSelectTingkat={(t: number) => {
            setSelectedTingkat(t);
            const classesInT = kelas.filter(k => k.tingkat === t);
            if (classesInT.length > 0) setSelectedKelasDetail(classesInT[0].id);
          }}
          onSelectKelasDetail={setSelectedKelasDetail}
          getTingkatLabel={getTingkatLabel}
        />
      )}

      {/* ── 5. TAB CONTENT: REKAP NILAI ──────────────────────────────── */}
      {activeTab === 'rekap' && (
        <div className="input-sections-container">
          <div className="liquid-glass-table-card">
            {renderClassSwitcherBar()}
            {activeClassObj && selectedKategori ? (
              <>
                <div className="table-top-bar">
                  <div className="info-cluster">
                    <h3 className="cluster-title">
                      Rekapitulasi Nilai — {activeClassObj.nama}
                    </h3>
                    <span className="cluster-count-pill">
                      {rekapData.length} Santri
                    </span>
                  </div>

                  <div className="actions-cluster">
                    <button
                      type="button"
                      className="action-pill-btn"
                      onClick={handleOpenManualRankModal}
                    >
                      <Settings size={13} />
                      <span>Sesuaikan Peringkat</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn"
                      onClick={handleTaftisyPdfExport}
                    >
                      <FileText size={13} />
                      <span>Ekspor PDF</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn primary-pill"
                      onClick={() => {
                        if (tahunAjaran && selectedKelasDetail && selectedKategori) {
                          window.open(
                            `/rapor-print/${tahunAjaran.id}/${selectedKelasDetail}/${selectedKategori}/all`,
                            '_blank'
                          );
                        }
                      }}
                    >
                      <Printer size={13} />
                      <span>Cetak Rapor Kelas</span>
                    </button>
                  </div>
                </div>

                {rekapLoading ? (
                  <div className="page-loading-box">
                    <div className="spinner"></div>
                    <span>Memproses data rekapitulasi penilaian santri...</span>
                  </div>
                ) : (
                  <>
                    {/* Top Scrollbar synchronized with table */}
                    <div 
                      className="rekap-top-scroll-track" 
                      ref={rekapTopScrollRef} 
                      onScroll={handleRekapTopScroll}
                      style={{
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        height: '10px',
                        background: 'rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ width: `${rekapTableWidth}px`, height: '1px' }} />
                    </div>

                    <div 
                      className="table-responsive-box"
                      ref={rekapTableScrollRef}
                      onScroll={handleRekapTableScroll}
                    >
                      <table className="glass-input-table" ref={rekapTableRef}>
                        <thead>
                          <tr>
                            <th style={{ minWidth: '220px', position: 'sticky', left: 0, zIndex: 10 }}>
                              Nama Santri
                            </th>
                            {mataPelajaran
                              .filter(m => ['Reguler', 'Muhafadzoh', 'Qiroah', 'Taftisy'].includes(m.jenis))
                              .filter(m => {
                                if (m.jenis === 'Reguler') {
                                  const allowedIds = mapelTingkat
                                    .filter(mt => mt.tingkat === selectedTingkat)
                                    .map(mt => mt.mata_pelajaran_id);
                                  return allowedIds.includes(m.id);
                                }
                                return !m.nama?.toLowerCase().includes('mini');
                              })
                              .map(m => (
                                <th key={m.id} style={{ textAlign: 'center' }}>{m.nama}</th>
                              ))}
                            <th style={{ textAlign: 'center', width: '90px' }}>Total</th>
                            <th style={{ textAlign: 'center', width: '90px' }}>Rata-rata</th>
                            <th style={{ textAlign: 'center', width: '80px' }}>Peringkat</th>
                            <th style={{ textAlign: 'center', width: '130px' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rekapData.map((row) => (
                            <tr key={row.santri_id}>
                              <td 
                                style={{ 
                                  position: 'sticky', 
                                  left: 0, 
                                  zIndex: 5, 
                                  background: 'rgba(255, 255, 255, 0.95)',
                                  fontWeight: 700 
                                }}
                              >
                                <div className="person-lens-cell">
                                  <div className="lens-orb-avatar" style={{ width: '30px', height: '30px', fontSize: '11.5px' }}>
                                    {row.nama.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="person-name-stack">
                                    <span className="person-name">{row.nama}</span>
                                    <span className="person-nis">NIS: {row.nis || '-'}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Grades per subject */}
                              {mataPelajaran
                                .filter(m => ['Reguler', 'Muhafadzoh', 'Qiroah', 'Taftisy'].includes(m.jenis))
                                .filter(m => {
                                  if (m.jenis === 'Reguler') {
                                    const allowedIds = mapelTingkat
                                      .filter(mt => mt.tingkat === selectedTingkat)
                                      .map(mt => mt.mata_pelajaran_id);
                                    return allowedIds.includes(m.id);
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
                                        <span className={`predikat-chip ${val.toLowerCase().replace("'", "")}`}>
                                          {val}
                                        </span>
                                      </td>
                                    );
                                  }
                                  if (m.jenis === 'Taftisy') {
                                    return (
                                      <td 
                                        key={m.id} 
                                        style={{ 
                                          textAlign: 'center', 
                                          fontWeight: 800, 
                                          color: val === 'Tam' ? '#059669' : '#dc2626' 
                                        }}
                                      >
                                        {val}
                                      </td>
                                    );
                                  }
                                  return <td key={m.id} style={{ textAlign: 'center', fontWeight: 700 }}>{val}</td>;
                                })}

                              <td style={{ textAlign: 'center', fontWeight: 800, color: '#059669' }}>
                                {row.total_nilai}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 800, color: '#2563eb' }}>
                                {row.rata_rata}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span 
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: row.peringkat <= 3 ? '#2563eb' : 'rgba(148, 163, 184, 0.15)',
                                    color: row.peringkat <= 3 ? '#ffffff' : '#475569',
                                    fontWeight: 800,
                                    fontSize: '12px'
                                  }}
                                >
                                  {row.peringkat}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    className="action-pill-btn"
                                    style={{ height: '32px', padding: '0 12px', fontSize: '11.5px' }}
                                    onClick={() => {
                                      if (tahunAjaran && selectedKelasDetail && selectedKategori) {
                                        window.open(
                                          `/rapor-print/${tahunAjaran.id}/${selectedKelasDetail}/${selectedKategori}/${row.santri_id}`,
                                          '_blank'
                                        );
                                      }
                                    }}
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
                  </>
                )}
              </>
            ) : (
              <div className="liquid-empty-hero" style={{ padding: '40px 20px' }}>
                <div className="empty-orb-icon">
                  <TableIcon size={32} />
                </div>
                <h3 className="empty-title">Pilih Kelas Diniyah dari Tombol di Atas</h3>
                <p className="empty-desc">
                  Silakan tentukan Tingkatan dan Rincian Kelas pada baris tombol di atas untuk melihat tabel kumulatif nilai, rata-rata, dan peringkat santri.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 6. TAB CONTENT: PENGATURAN FORMAT RAPOR ──────────────────── */}
      {activeTab === 'pengaturan-rapor' && (
        <div className="liquid-glass-table-card" style={{ padding: '24px' }}>
          <RaporSettingsTab />
        </div>
      )}

      {/* ── 7. POPUP MODAL PEMILIHAN KELAS (LANGSUNG SEMUA KELAS MINIMALIS) ──────────── */}
      <CustomModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title="Pilih Kelas Diniyah"
        subtitle="Pilih kelas untuk langsung membuka lembar penilaian santri"
        width={720}
      >
        <div className="class-grid-modal-body">
          {/* Langsung Tampilkan Semua Kelas Diniyah — Minimalis Cards */}
          <div className="mini-classes-grid">
            {kelas.map(c => {
              const isSelected = selectedKelasDetail === c.id;
              return (
                <div
                  key={c.id}
                  className={`mini-class-card ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTingkat(c.tingkat);
                    setSelectedKelasDetail(c.id);
                    setIsClassModalOpen(false);
                    toast.success(`Kelas terpilih: ${c.nama}`);
                  }}
                >
                  <div className="card-top-meta">
                    <span className="tingkat-badge">
                      {getTingkatLabel(c.tingkat)}
                    </span>
                    {isSelected && (
                      <Check size={14} className="check-indicator" />
                    )}
                  </div>
                  <h4 className="class-card-name">{c.nama}</h4>
                  <div className="class-card-footer">
                    <span title={c.mustahiq_nama ? `Ust. ${c.mustahiq_nama}` : 'Madrasah Diniyah'}>
                      {c.mustahiq_nama ? `Ust. ${c.mustahiq_nama.split(' ')[0]}` : 'Diniyah'}
                    </span>
                    {c.jumlah_santri !== undefined && (
                      <span className="santri-pill">
                        {c.jumlah_santri}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {kelas.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: '#64748b' }}>
                Tidak ada data kelas diniyah yang terdaftar.
              </div>
            )}
          </div>
        </div>
      </CustomModal>

      {/* ── 8. MANUAL RANK MODAL ─────────────────────────────────────── */}
      <CustomModal
        isOpen={isManualRankModalOpen}
        onClose={() => setIsManualRankModalOpen(false)}
        title="Sesuaikan Urutan Peringkat Rapor"
        subtitle={`Kelas: ${activeClassObj?.nama || '-'} • Penyesuaian urutan peringkat cetak rapor`}
        width={780}
      >
        <div className="rank-adjust-modal-container">
          <SmartAlert
            message="Penyesuaian urutan peringkat manual di sini hanya menentukan urutan ranking yang dicetak pada lembar Rapor Santri, tanpa mengubah nilai asli dan rata-rata hasil olahan sistem."
            type="info"
          />

          {duplicateRanks.length > 0 && (
            <div className="rank-conflict-alert">
              <span className="alert-icon">⚠️</span>
              <span>Perhatian: Terdapat peringkat kembar (#{duplicateRanks.join(', #')}). Pastikan setiap santri memiliki peringkat yang unik sebelum mencetak rapor.</span>
            </div>
          )}

          <div className="rank-adjust-toolbar">
            <div className="rank-search-box">
              <Search size={14} />
              <input
                type="text"
                placeholder="Cari santri berdasarkan nama atau NIS..."
                value={rankSearchQuery}
                onChange={e => setRankSearchQuery(e.target.value)}
              />
              {rankSearchQuery && (
                <button type="button" className="clear-search-btn" onClick={() => setRankSearchQuery('')}>×</button>
              )}
            </div>

            <button
              type="button"
              className="action-pill-btn reset-rank-btn"
              onClick={() => {
                setManualRankData(prev => prev.map((item, idx) => ({
                  ...item,
                  peringkat_manual: item.peringkat_sistem || (idx + 1)
                })));
                toast.info('Peringkat dikembalikan ke urutan sistem.');
              }}
              title="Urutkan kembali sesuai peringkat otomatis sistem"
            >
              <RotateCcw size={13} />
              <span>Reset ke Sistem</span>
            </button>
          </div>

          <div className="rank-table-wrap">
            <table className="rank-adjust-table">
              <thead>
                <tr>
                  <th style={{ width: '70px', textAlign: 'center' }}>Posisi</th>
                  <th>Identitas Santri</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Total & Rata-rata</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Sistem</th>
                  <th style={{ width: '170px', textAlign: 'center' }}>Peringkat Rapor</th>
                </tr>
              </thead>
              <tbody>
                {filteredRankData.map((row) => {
                  const actualIdx = manualRankData.findIndex(d => d.santri_id === row.santri_id);
                  const rankNum = Number(row.peringkat_manual);
                  const isTop3 = rankNum >= 1 && rankNum <= 3;
                  const isDuplicate = duplicateRanks.includes(String(row.peringkat_manual ?? '').trim());

                  return (
                    <tr key={row.santri_id} className={`rank-row ${isDuplicate ? 'has-conflict' : ''}`}>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`rank-podium-badge ${rankNum === 1 ? 'rank-gold' : rankNum === 2 ? 'rank-silver' : rankNum === 3 ? 'rank-bronze' : 'rank-standard'}`}>
                          #{row.peringkat_manual || '-'}
                        </span>
                      </td>
                      <td>
                        <div className="rank-person-cell">
                          <div className={`rank-lens-orb ${isTop3 ? 'orb-top' : ''}`}>
                            {row.nama ? row.nama.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div className="rank-person-meta">
                            <span className="rank-person-name">{row.nama}</span>
                            <span className="rank-person-nis">NIS: {row.nis || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="score-stack">
                          <span className="score-total">Total: <strong>{row.total_nilai}</strong></span>
                          <span className="score-avg">Rata: {row.rata_rata}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="system-rank-tag">#{row.peringkat_sistem}</span>
                      </td>
                      <td>
                        <div className="rank-input-stepper">
                          <button
                            type="button"
                            className="stepper-btn dec-btn"
                            disabled={Number(row.peringkat_manual) <= 1}
                            onClick={() => {
                              if (actualIdx < 0) return;
                              const updated = [...manualRankData];
                              const currentVal = Number(updated[actualIdx].peringkat_manual) || 1;
                              updated[actualIdx].peringkat_manual = Math.max(1, currentVal - 1);
                              setManualRankData(updated);
                            }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className={`rank-input ${isDuplicate ? 'input-conflict' : ''}`}
                            min={1}
                            value={row.peringkat_manual}
                            onChange={(e) => {
                              if (actualIdx < 0) return;
                              const updated = [...manualRankData];
                              updated[actualIdx].peringkat_manual = e.target.value;
                              setManualRankData(updated);
                            }}
                            placeholder={`#${row.peringkat_sistem}`}
                          />
                          <button
                            type="button"
                            className="stepper-btn inc-btn"
                            onClick={() => {
                              if (actualIdx < 0) return;
                              const updated = [...manualRankData];
                              const currentVal = Number(updated[actualIdx].peringkat_manual) || 0;
                              updated[actualIdx].peringkat_manual = currentVal + 1;
                              setManualRankData(updated);
                            }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredRankData.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                      Tidak ditemukan santri dengan pencarian "{rankSearchQuery}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rank-modal-footer">
            <span className="footer-summary-text">
              Menampilkan {filteredRankData.length} dari {manualRankData.length} santri
            </span>
            <div className="footer-actions">
              <button
                type="button"
                className="action-pill-btn"
                onClick={() => setIsManualRankModalOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="action-pill-btn primary-pill"
                onClick={handleManualRankSave}
                disabled={manualRankSaveLoading}
              >
                {manualRankSaveLoading ? <span className="loading-spinner"></span> : <Save size={13} />}
                <span>Simpan Peringkat</span>
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* ── 9. AUTO-SAVE FLOATING INDICATOR ──────────────────────────── */}
      {autoSaveStatus && (
        <div className={`auto-save-indicator ${autoSaveStatus}`}>
          {autoSaveStatus === 'saving' ? (
            <div className="spinner"></div>
          ) : (
            <CheckCircle size={14} className="icon-check" />
          )}
          <span>
            {autoSaveStatus === 'saving' ? 'Menyimpan nilai...' : autoSaveStatus === 'saved' ? 'Nilai tersimpan ke Cloud' : 'Gagal menyimpan'}
          </span>
        </div>
      )}
    </div>
  );
}

export default ManajemenNilai;

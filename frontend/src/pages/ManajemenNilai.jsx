import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tabs, Card, Select, Input, InputNumber, Button, Table, 
  Space, Tag, Typography, Divider, Empty, message, Popconfirm, Tooltip,
  Row, Col, Badge, Segmented, Alert, Checkbox, Spin, Collapse
} from 'antd';
import { 
  SaveOutlined, ReloadOutlined, SettingOutlined, EditOutlined,
  UserOutlined, BookOutlined, CheckCircleOutlined, InfoCircleOutlined,
  AppstoreOutlined, UnorderedListOutlined, GroupOutlined, CalendarOutlined, MessageOutlined,
  ThunderboltOutlined, StarOutlined, RocketOutlined, DeleteOutlined,
  AuditOutlined, ReadOutlined, FileSearchOutlined, ArrowRightOutlined, TableOutlined
} from '@ant-design/icons';
import { nilaiService } from '../services/nilaiService';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import { RaporSantriForms } from '../components/features/RaporSantriForms';
import { useResponsive } from '../hooks/useResponsive';
import './ManajemenNilai.scss';

const { Title, Text, Paragraph } = Typography;

export const ManajemenNilai = ({ mode = 'input' }) => {
  // State Master Data
  const [kelas, setKelas] = useState([]);
  const [mataPelajaran, setMataPelajaran] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [tahunAjaran, setTahunAjaran] = useState(null);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [mapelTingkat, setMapelTingkat] = useState([]);
  
  // State Filter & Selection
  const [activeTab, setActiveTab] = useState(
    mode === 'config' ? 'setting' : 
    mode === 'rekap' ? 'rekap' : 'input'
  );
  const [selectedTingkat, setSelectedTingkat] = useState(null);
  const [selectedKelasDetail, setSelectedKelasDetail] = useState(null);
  const [selectedMapel, setSelectedMapel] = useState(null);
  const [selectedKategori, setSelectedKategori] = useState(() => {
    const saved = localStorage.getItem('sekolah_info_selected_kategori');
    return saved ? Number(saved) : null;
  });
  const [jadwalMapelIds, setJadwalMapelIds] = useState([]);
  const [activeCollapseKeys, setActiveCollapseKeys] = useState(['semester']);
  
  // State Data Nilai
  const [santriList, setSantriList] = useState([]);
  const { isMobile } = useResponsive();
  const [mobileFocusMode, setMobileFocusMode] = useState(isMobile);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(null); // 'saving', 'saved', 'error'
  const [error, setError] = useState(null);
  
  // State Virtual Keypad (Mobile)
  const [activeSantriId, setActiveSantriId] = useState(null);
  const [showKeypad, setShowKeypad] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState('dashboard'); // 'dashboard' or 'input'
  const [pendingConsoleOpen, setPendingConsoleOpen] = useState(false); // Tunggu data santri lalu buka konsol

  // 1. Reset total saat filter kelas/mapel berubah (PENTING: santriList juga harus kosong)
  useEffect(() => {
    if (isMobile && showKeypad) {
      setSantriList([]);
      setActiveSantriId(null);
    }
  }, [selectedKelasDetail, selectedMapel]);

  // 2. Pilih santri pertama otomatis saat data kelas baru sudah masuk
  useEffect(() => {
    if (isMobile && santriList.length > 0 && !activeSantriId) {
      setActiveSantriId(santriList[0].santri_id);
    }
    // Jika ada pending console open (dari quick start), buka setelah data santri tiba
    if (pendingConsoleOpen && santriList.length > 0) {
      setPendingConsoleOpen(false);
      setShowKeypad(true);
    }
  }, [santriList, activeSantriId, pendingConsoleOpen]);

  // State Rekap Nilai
  const [rekapData, setRekapData] = useState([]);
  const [rekapColumns, setRekapColumns] = useState([]);
  const [rekapLoading, setRekapLoading] = useState(false);
  
  // State Kriteria
  const [kriteriaConfig, setKriteriaConfig] = useState(null);
  const [kriteriaType, setKriteriaType] = useState('Angka');
  const [configAngka, setConfigAngka] = useState({
    'Mumtaz': { min: 95, max: 2000 },
    'Jayyid': { min: 85, max: 94 },
    'Mutawassith': { min: 75, max: 84 },
    'Rodi\'': { min: 0, max: 74 }
  });
  const [configTeks, setConfigTeks] = useState([]);

  const effectiveKriteriaType = useMemo(() => {
    if (kriteriaConfig && kriteriaConfig.tipe_input) {
      return kriteriaConfig.tipe_input;
    }
    if (selectedTingkat === 2 || selectedTingkat === 99) return 'Teks';
    if (selectedTingkat !== 0) return 'Angka';
    return kriteriaType; // Fallback for Sifir
  }, [kriteriaConfig, selectedTingkat, kriteriaType]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [kelasData, mapelData, katData, taData] = await Promise.all([
        nilaiService.fetchKelas(),
        nilaiService.fetchMataPelajaran(),
        nilaiService.fetchKategori(),
        nilaiService.fetchTahunAjaran()
      ]);
      
      const diniyahKelas = Array.isArray(kelasData) ? kelasData.filter(k => k.jenis === 'Diniyah').map(k => {
        // If class name is 'SP' but tingkat is 1, move it to tingkat 99 virtually
        if (k.nama === 'SP' && k.tingkat === 1) {
          return { ...k, tingkat: 99 };
        }
        return k;
      }) : [];
      setKelas(diniyahKelas);
      setMataPelajaran(Array.isArray(mapelData) ? mapelData : []);
      setKategori(Array.isArray(katData) ? katData : []);
      
      setTahunAjaranList(Array.isArray(taData) ? taData : []);

      const savedTA = localStorage.getItem('sekolah_info_selected_tahun_ajaran');
      let activeTA = null;
      
      if (savedTA && Array.isArray(taData) && taData.some(ta => ta.id === Number(savedTA))) {
        activeTA = taData.find(ta => ta.id === Number(savedTA));
      } else if (Array.isArray(taData)) {
        activeTA = taData.find(ta => ta.is_active);
        if (activeTA) {
          localStorage.setItem('sekolah_info_selected_tahun_ajaran', activeTA.id);
        }
      }
      setTahunAjaran(activeTA);
      
      if (Array.isArray(katData)) {
        const savedKategori = localStorage.getItem('sekolah_info_selected_kategori');
        if (savedKategori && katData.some(k => k.id === Number(savedKategori))) {
          setSelectedKategori(Number(savedKategori));
        } else {
          const defaultKat = katData.find(k => k.nama?.toLowerCase().includes('ganjil'));
          if (defaultKat) {
            setSelectedKategori(defaultKat.id);
            localStorage.setItem('sekolah_info_selected_kategori', defaultKat.id);
          }
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

  const handleTahunAjaranChange = (val) => {
    const selected = tahunAjaranList.find(ta => ta.id === val);
    setTahunAjaran(selected);
    localStorage.setItem('sekolah_info_selected_tahun_ajaran', val);
  };

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

    return [
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
  }, [mataPelajaran, mapelTingkat, selectedTingkat]);

  // Reset selectedKelasDetail when tingkat changes
  useEffect(() => {
    setSelectedKelasDetail(null);
    setSantriList([]);
    
    // Auto-fill jadwal selection when switching tingkat in Jadwal tab
    if (selectedTingkat !== null) {
      setJadwalMapelIds(mapelTingkat.filter(mt => mt.tingkat === selectedTingkat).map(mt => mt.mata_pelajaran_id));
    }
  }, [selectedTingkat, mapelTingkat]);

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
            mapel_count: 0
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
      // Hitung Rata-rata
      dataSource.forEach(item => {
        item.rata_rata = item.mapel_count > 0 ? (item.total_nilai / item.mapel_count).toFixed(2) : 0;
      });
      // Sort by total_nilai descending
      dataSource.sort((a, b) => b.total_nilai - a.total_nilai);
      // Assign Peringkat
      dataSource.forEach((item, idx) => {
        item.peringkat = idx + 1;
      });

      setRekapData(dataSource);

      // Build Columns
      const cols = [
        { title: 'NIS', dataIndex: 'nis', width: 100, fixed: 'left' },
        { title: 'Nama Santri', dataIndex: 'nama', width: 200, fixed: 'left', ellipsis: true }
      ];

      const allowedMapelIds = mapelTingkat.filter(mt => mt.tingkat === selectedTingkat).map(mt => mt.mata_pelajaran_id);
      const semesterMapels = mataPelajaran.filter(m => m.jenis === 'Reguler' && allowedMapelIds.includes(m.id));
      
      const akbarMapels = mataPelajaran.filter(m => m.jenis === 'Muhafadzoh' && m.nama?.toLowerCase().includes('akbar'));
      const qiroatulMapels = mataPelajaran.filter(m => m.jenis === 'Qiroah');
      const taftisyulMapels = mataPelajaran.filter(m => m.jenis === 'Taftisy');
      const miniMapels = mataPelajaran.filter(m => m.jenis === 'Muhafadzoh' && m.nama?.toLowerCase().includes('mini'));
      
      const allRekapMapels = [...semesterMapels, ...akbarMapels, ...qiroatulMapels, ...taftisyulMapels, ...miniMapels];
      
      allRekapMapels.forEach(m => {
        cols.push({
          title: m.nama,
          dataIndex: `mapel_${m.id}`,
          width: 120,
          align: 'center',
          render: val => {
            if (!val || val === '-') return <Text type="secondary">-</Text>;
            if (['Mumtaz', 'Jayyid', 'Mutawassith', 'Rodi\''].includes(val)) {
              return <Tag color={val === 'Mumtaz' ? 'gold' : val === 'Jayyid' ? 'green' : val === 'Mutawassith' ? 'blue' : 'default'}>{val}</Tag>;
            }
            return <Text strong>{val}</Text>;
          }
        });
      });

      cols.push({
        title: 'Total',
        dataIndex: 'total_nilai',
        width: 100,
        align: 'center',
        render: val => <Text strong type="success">{val}</Text>
      });

      cols.push({
        title: 'Rata-rata',
        dataIndex: 'rata_rata',
        width: 100,
        align: 'center',
        render: val => <Text strong>{val}</Text>
      });

      cols.push({
        title: 'Peringkat', 
        dataIndex: 'peringkat', 
        width: 80, 
        fixed: 'right', 
        align: 'center', 
        render: val => <Badge count={val} style={{ backgroundColor: val <= 3 ? '#52c41a' : '#d9d9d9' }} /> 
      });

      cols.push({
        title: 'Aksi',
        key: 'aksi',
        width: 100,
        fixed: 'right',
        align: 'center',
        render: (_, record) => (
          <Button 
            type="primary" 
            size="small" 
            icon={<BookOutlined />}
            onClick={() => window.open(`/rapor-print/${tahunAjaran.id}/${selectedKelasDetail}/${selectedKategori}/${record.santri_id}`, '_blank')}
          >
            Rapor
          </Button>
        )
      });

      setRekapColumns(cols);

    } catch (err) {
      message.error('Gagal memuat rekap nilai');
    } finally {
      setRekapLoading(false);
    }
  };

  const loadKriteria = async () => {
    try {
      const config = await nilaiService.fetchKriteria(selectedTingkat, selectedMapel, tahunAjaran?.id, selectedKategori);
      
      if (config) {
        setKriteriaConfig(config);
        
        // Prioritize config if available, else use defaults
        if (config.tipe_input) {
          setKriteriaType(config.tipe_input);
        } else {
          if (selectedTingkat === 2 || selectedTingkat === 99) setKriteriaType('Teks');
          else if (selectedTingkat !== 0) setKriteriaType('Angka');
          else setKriteriaType('Angka');
        }
        
        if (config.tipe_input === 'Angka') {
          setConfigAngka(config.konfigurasi);
          setConfigTeks([]); // Reset Teks
        } else {
          setConfigTeks(Array.isArray(config.konfigurasi) ? config.konfigurasi : []);
          setConfigAngka({ // Reset Angka to default
            'Mumtaz': { min: 95, max: 2000 },
            'Jayyid': { min: 85, max: 94 },
            'Mutawassith': { min: 75, max: 84 },
            'Rodi\'': { min: 0, max: 74 }
          });
        }
      } else {
        setKriteriaConfig(null);
        if (selectedTingkat === 2 || selectedTingkat === 99) setKriteriaType('Teks');
        else setKriteriaType('Angka');
        
        setConfigAngka({
          'Mumtaz': { min: 95, max: 2000 },
          'Jayyid': { min: 85, max: 94 },
          'Mutawassith': { min: 75, max: 84 },
          'Rodi\'': { min: 0, max: 74 }
        });
        setConfigTeks([]); // Reset configTeks when no config found
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
      message.error('Gagal memuat data santri dan nilai');
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
      message.error('Data belum siap. Mohon tunggu sebentar.');
      return;
    }

    // 1. Temukan Mapel
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
      message.warning(`Mapel '${mapelType}' tidak ditemukan di pengaturan.`);
      return;
    }

    // 2. Setel filter dasar
    const hide = message.loading(`Mencari kelas untuk ${targetMapel.nama}...`, 0);
    setMobileFocusMode(true);
    setActiveTab('input');
    setSelectedMapel(targetMapel.id);

    // 3. Smart Seeker: Cari kelas yang BENAR-BENAR ada santrinya
    const allTingkat = [...new Set(kelas.map(k => k.tingkat))].sort((a, b) => a - b);
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
          console.log(`Skip kelas ${kls.nama}: ${err.message}`);
        }
      }
      if (foundKelasId) break;
    }

    hide(); // Tutup pesan loading

    if (!foundKelasId) {
      message.warning('Belum ada santri di semua kelas untuk mapel ini.');
      setMobileViewMode('input'); // Tetap buka tabel agar user bisa manual
      return;
    }

    // 4. Setel kelas yang ditemukan
    const namaKelas = kelas.find(k => k.id === foundKelasId)?.nama || '';
    setSelectedTingkat(foundTingkat);
    setSelectedKelasDetail(foundKelasId);
    setMobileViewMode('input');

    // 5. Buka Console atau Tabel
    if (mapelType === 'muhafadzoh' || mapelType === 'qiroah') {
      message.success(`${targetMapel.nama} — ${namaKelas}`);
      setPendingConsoleOpen(true);
    } else {
      message.success(`${targetMapel.nama} — ${namaKelas}`);
      setShowKeypad(false);
    }
  };

  const isKhususMapel = (mapelId) => {
    const mapel = mataPelajaran.find(m => m.id === mapelId);
    return mapel && mapel.jenis !== 'Reguler';
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
      
      // Auto-correction and custom logic for Mumtaz
      if (pred === 'Mumtaz') {
        const jayyidMax = scale['Jayyid']?.max !== null && scale['Jayyid']?.max !== undefined && scale['Jayyid']?.max !== '' ? Number(scale['Jayyid'].max) : 0;
        // Mumtaz min is strictly above Jayyid max
        min = jayyidMax + 1;
        if (max === null) max = 2000;
      } else if (pred === 'Rodi\'' && max === null && min !== null) {
        // User put value in min but left max blank for the bottom tier
        max = min;
        min = 0;
      }
      
      // Default fallbacks
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

  // Debounced Auto Save
  useEffect(() => {
    const timer = setTimeout(() => {
      // Logic for auto-save will be triggered when santriList changes
      // but we need to ensure it only saves after changes, not on initial load
    }, 1000);
    return () => clearTimeout(timer);
  }, [santriList]);

  const handleNilaiChange = (santriId, field, value) => {
    setSantriList(prev => prev.map(s => {
      if (s.santri_id === santriId) {
        const newData = { ...s, [field]: value };
        const mapel = mataPelajaran.find(m => m.id === selectedMapel);
        const jenis = mapel?.jenis;
        const isTaftisy = jenis === 'Taftisy';
        const isQiroat = jenis === 'Qiroah';
        const isMuhafadzoh = jenis === 'Muhafadzoh';

        if (field === 'nilai_angka') {
          if (isMuhafadzoh && !isTaftisy && !isQiroat) {
            newData.predikat = getPredikat(value);
          } else {
            newData.predikat = '';
          }
        }
        
        if (field === 'capaian' && effectiveKriteriaType === 'Teks') {
          const matched = configTeks.find(c => c.bab === value);
          if (matched && !isTaftisy) newData.predikat = matched.predikat;
        }

        // Trigger Auto Save
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
      setTimeout(() => setAutoSaveStatus(null), 2000);
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
      message.success('Semua nilai berhasil disimpan!');
    } catch (err) {
      message.error('Gagal menyimpan nilai');
    } finally {
      setSaveLoading(false);
    }
  };

  const saveKriteria = async () => {
    if (selectedTingkat === null || !selectedMapel) {
      message.warning('Pilih Tingkatan dan Mata Pelajaran terlebih dahulu');
      return;
    }

    try {
      setSaveLoading(true);
      const mapel = mataPelajaran.find(m => m.id === selectedMapel);
      const payload = {
        tingkat: selectedTingkat,
        mata_pelajaran_id: selectedMapel,
        jenis_mapel: mapel?.jenis || 'Muhafadzoh',
        tipe_input: kriteriaType,
        konfigurasi: kriteriaType === 'Angka' ? configAngka : configTeks,
        tahun_ajaran_id: tahunAjaran?.id,
        kategori_evaluasi_id: selectedKategori
      };
      await nilaiService.saveKriteria(payload);
      message.success(`Pengaturan kriteria ${mapel?.nama || ''} berhasil disimpan!`);
      loadKriteria();
    } catch (err) {
      console.error('Save kriteria failed:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Gagal menyimpan kriteria';
      message.error(errorMsg);
    } finally {
      setSaveLoading(false);
    }
  };

  const saveJadwal = async () => {
    if (selectedTingkat === null) {
      message.warning('Pilih Tingkatan terlebih dahulu');
      return;
    }
    try {
      setSaveLoading(true);
      await nilaiService.saveMapelTingkat(selectedTingkat, jadwalMapelIds, tahunAjaran?.id, selectedKategori);
      message.success('Jadwal pelajaran berhasil disimpan!');
      const newMtData = await nilaiService.fetchMapelTingkat(tahunAjaran?.id, selectedKategori);
      setMapelTingkat(Array.isArray(newMtData) ? newMtData : []);
    } catch (err) {
      console.error('Save jadwal failed:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Gagal menyimpan jadwal pelajaran';
      message.error(errorMsg);
    } finally {
      setSaveLoading(false);
    }
  };

  const getTingkatLabel = (t) => {
    if (t === 0) return 'Sifir';
    if (t === 99) return 'SP';
    return `Kelas ${t}`;
  };

  const columns = [
    ...(isMobile ? [] : [{ title: 'NIS', dataIndex: 'nis', key: 'nis', width: 100 }]),
    { title: 'Nama Santri', dataIndex: 'nama', key: 'nama', ellipsis: true },
    { 
      title: 'Input Nilai', 
      width: isMobile ? 100 : undefined,
      render: (_, record) => {
        const mapel = mataPelajaran.find(m => m.id === selectedMapel);
        const jenis = mapel?.jenis;
        const isTaftisy = jenis === 'Taftisy';
        const isQiroat = jenis === 'Qiroah';
        const isMuhafadzoh = jenis === 'Muhafadzoh';

        if (isTaftisy) {
          return (
            <Select 
              placeholder="Tam / Naqish" 
              value={record.capaian || undefined}
              onChange={val => handleNilaiChange(record.santri_id, 'capaian', val)}
              style={{ width: '100%' }}
            >
              <Select.Option value="Tam">Tam (Lengkap)</Select.Option>
              <Select.Option value="Naqish">Naqish (Belum Lengkap)</Select.Option>
            </Select>
          );
        }
        
        let useAngka = isQiroat || mapel?.jenis === 'Reguler';
        let maxAngka = 100;

        if (isMuhafadzoh) {
          maxAngka = 2000;
        }
        
        if (isMuhafadzoh) {
          // Use effective kriteria type
          if (effectiveKriteriaType === 'Teks') {
            useAngka = false;
          } else if (effectiveKriteriaType === 'Angka') {
            useAngka = true;
          } else {
            // Default logic if not configured
            if (selectedTingkat === 2 || selectedTingkat === 99) useAngka = false;
            else if (selectedTingkat !== 0) useAngka = true;
            else useAngka = true;
          }
        }

        if (useAngka) {
          const isSelected = activeSantriId === record.santri_id && showKeypad;
          return (
            <InputNumber 
              min={0} max={maxAngka} 
              value={record.nilai_angka} 
              onChange={val => handleNilaiChange(record.santri_id, 'nilai_angka', val)}
              placeholder={`0-${maxAngka}`}
              readOnly={isMobile} // Prevent physical keyboard on mobile
              onClick={() => {
                if (isMobile) {
                  setActiveSantriId(record.santri_id);
                  setShowKeypad(true);
                }
              }}
              style={{ 
                width: isMobile ? '85px' : '100%',
                backgroundColor: isSelected ? '#e6f7ff' : undefined,
                borderColor: isSelected ? '#1890ff' : undefined,
                boxShadow: isSelected ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : undefined
              }}
            />
          );
        }
        return (
          <Select
            placeholder="Pilih"
            value={record.capaian || undefined}
            onChange={val => handleNilaiChange(record.santri_id, 'capaian', val)}
            style={{ width: isMobile ? '90px' : '100%' }}
            className="arabic-text"
          >
            {Array.isArray(configTeks) ? configTeks.map((item, idx) => (
              <Select.Option key={idx} value={item.bab}>{item.bab}</Select.Option>
            )) : null}
          </Select>
        );
      }
    },
    { 
      title: 'Predikat', 
      dataIndex: 'predikat', 
      key: 'predikat',
      width: isMobile ? 120 : 150,
      render: (pred, record) => {
        const mapel = mataPelajaran.find(m => m.id === selectedMapel);
        const jenis = mapel?.jenis;
        const isTaftisy = jenis === 'Taftisy';
        const isQiroat = jenis === 'Qiroah';
        const isMuhafadzoh = jenis === 'Muhafadzoh';
        const isRegulerMurni = jenis === 'Reguler';

        if (isRegulerMurni || isQiroat || isTaftisy) {
            return <Text type="secondary">-</Text>;
        }
        return <Tag color={pred === 'Mumtaz' ? 'gold' : pred === 'Jayyid' ? 'green' : pred === 'Mutawassith' ? 'blue' : 'default'}>{pred || '-'}</Tag>
      }
    }
  ];

  const renderTingkatSelection = (isSettings = false) => {
    const levels = [...new Set(kelas.map(k => k.tingkat))].sort((a, b) => {
      // Custom sort: Sifir (0), then 1-6, then SP (99)
      if (a === 99) return 1;
      if (b === 99) return -1;
      return a - b;
    });
    if (isSettings) {
      return (
        <Select 
          placeholder="Pilih Tingkatan" 
          style={{ width: '100%' }} 
          value={selectedTingkat} 
          onChange={setSelectedTingkat}
        >
          {levels.map(t => <Select.Option key={t} value={t}>{getTingkatLabel(t)}</Select.Option>)}
        </Select>
      );
    }
    
    // For Input Nilai tab
    const classOptions = kelas.filter(k => k.tingkat === selectedTingkat);

    return (
      <div className="selection-container">
        <Title level={5}><GroupOutlined /> Pilih Tingkatan</Title>
        <Space wrap style={{ marginBottom: selectedTingkat !== null ? 16 : 0 }}>
          {levels.map(t => (
            <Card
              key={t}
              hoverable
              size="small"
              className={`selection-card ${selectedTingkat === t ? 'active' : ''}`}
              onClick={() => setSelectedTingkat(t)}
            >
              <Text strong>{getTingkatLabel(t)}</Text>
            </Card>
          ))}
        </Space>

        {selectedTingkat !== null && (
          <div className="class-detail-selection" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Pilih Rincian Kelas:</Text>
            <Space wrap>
              {classOptions.map(c => (
                <Card
                  key={c.id}
                  hoverable
                  size="small"
                  className={`selection-card detail-card ${selectedKelasDetail === c.id ? 'active' : ''}`}
                  onClick={() => setSelectedKelasDetail(c.id)}
                  style={{ 
                    padding: '4px 12px', 
                    borderRadius: '20px',
                    borderColor: selectedKelasDetail === c.id ? 'var(--ant-primary-color)' : '#d9d9d9',
                    backgroundColor: selectedKelasDetail === c.id ? '#e6f7ff' : '#fff'
                  }}
                >
                  <Text strong>{c.nama}</Text>
                </Card>
              ))}
            </Space>
          </div>
        )}
      </div>
    );
  };

  const getSettingsTabs = () => {
    const tabs = [];
    if (selectedTingkat !== 2 && selectedTingkat !== 99) {
      tabs.push({
        key: 'Angka',
        label: 'Skala Angka (Max 2000)',
        disabled: kriteriaConfig && kriteriaConfig.tipe_input === 'Teks',
        children: (
          <Table dataSource={['Mumtaz', 'Jayyid', 'Mutawassith', 'Rodi\''].map(pred => ({ predikat: pred, ...(configAngka[pred] || {min: null, max: null}) }))} pagination={false} size="small" columns={[
            { title: 'Predikat', dataIndex: 'predikat', render: text => <Text strong>{text}</Text> },
            { title: 'Min', dataIndex: 'min', render: (val, record) => <InputNumber min={0} max={2000} value={record.predikat === 'Mumtaz' ? null : val} disabled={record.predikat === 'Mumtaz'} placeholder={record.predikat === 'Mumtaz' ? 'Otomatis' : ''} onChange={v => setConfigAngka(prev => ({...prev, [record.predikat]: {...prev[record.predikat], min: v}}))} /> },
            { title: 'Max', dataIndex: 'max', render: (val, record) => <InputNumber min={0} max={2000} value={val} onChange={v => setConfigAngka(prev => ({...prev, [record.predikat]: {...prev[record.predikat], max: v}}))} /> }
          ]} />
        )
      });
    }

    if (selectedTingkat === 0 || selectedTingkat === 2 || selectedTingkat === 99) {
      tabs.push({
        key: 'Teks',
        label: 'Daftar Bab/Capaian (Teks)',
        disabled: kriteriaConfig && kriteriaConfig.tipe_input === 'Angka',
        children: (
          <>
            <Table 
              dataSource={configTeks} 
              pagination={false} 
              size="small" 
              rowKey={(record, idx) => idx}
              columns={[
                { 
                  title: 'Daftar Bab / Capaian', 
                  dataIndex: 'bab', 
                  render: (val, _, idx) => (
                    <Input 
                      value={val} 
                      className={(selectedTingkat === 2 || selectedTingkat === 99) ? "arabic-text" : ""} 
                      placeholder="Contoh: Bab 1 / Materi A / Juz 30"
                      onChange={e => {
                        const newConf = [...configTeks];
                        newConf[idx].bab = e.target.value;
                        setConfigTeks(newConf);
                      }} 
                    />
                  ) 
                },
                { 
                  title: 'Predikat Otomatis', 
                  dataIndex: 'predikat', 
                  width: 160,
                  render: (val, _, idx) => (
                    <Select value={val} style={{ width: '100%' }} onChange={v => {
                      const newConf = [...configTeks];
                      newConf[idx].predikat = v;
                      setConfigTeks(newConf);
                    }}>
                      <Select.Option value="Mumtaz">Mumtaz</Select.Option>
                      <Select.Option value="Jayyid">Jayyid</Select.Option>
                      <Select.Option value="Mutawassith">Mutawassith</Select.Option>
                      <Select.Option value="Rodi'">Rodi'</Select.Option>
                    </Select>
                  )
                },
                { 
                  title: 'Aksi', 
                  width: 80,
                  render: (_, __, idx) => (
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => {
                        const current = Array.isArray(configTeks) ? configTeks : [];
                        setConfigTeks(current.filter((_, i) => i !== idx));
                      }}
                    >
                      Hapus
                    </Button>
                  ) 
                }
              ]} 
            />
            <div style={{ marginTop: 16 }}>
              <Button type="dashed" block onClick={() => {
                const current = Array.isArray(configTeks) ? configTeks : [];
                setConfigTeks([...current, { bab: '', predikat: 'Jayyid' }]);
              }}>
                + Tambah Capaian Baru
              </Button>
            </div>
          </>
        )
      });
    }

    return tabs;
  };

  const allTabs = [
    {
      key: 'input',
      label: <span><EditOutlined /> Input Nilai</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card className="filter-card">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  {renderTingkatSelection()}
                </Col>
                <Col xs={24} lg={12}>
                    <Title level={5}>
                      <BookOutlined /> Pilih Mata Pelajaran
                      {isMobile && (
                        <div style={{ float: 'right' }}>
                          <Checkbox 
                            checked={mobileFocusMode} 
                            onChange={e => setMobileFocusMode(e.target.checked)}
                            style={{ fontSize: '12px' }}
                          >
                            Prioritas
                          </Checkbox>
                        </div>
                      )}
                    </Title>
                    {selectedTingkat !== null && selectedKelasDetail !== null ? (
                      <div className="mapel-selection-cards">
                        {isMobile && mobileFocusMode ? (
                          // Simplified Mode for Mobile Priority
                          <div className="mobile-priority-selection">
                            <Space wrap>
                              {mapelCategories
                                .filter(cat => cat.key === 'ujian_khusus') // Only Ujian Khusus
                                .flatMap(cat => cat.items)
                                .map(m => (
                                  <Card
                                    key={m.id}
                                    hoverable
                                    size="small"
                                    className={`selection-card priority-card ${selectedMapel === m.id ? 'active' : ''}`}
                                    onClick={() => setSelectedMapel(m.id)}
                                  >
                                    <Space direction="vertical" align="center" size={2}>
                                      <RocketOutlined style={{ fontSize: '20px', color: selectedMapel === m.id ? '#1890ff' : '#8c8c8c' }} />
                                      <Text strong={selectedMapel === m.id} style={{ fontSize: '11px' }}>{m.nama}</Text>
                                    </Space>
                                  </Card>
                                ))
                              }
                              <Button 
                                type="dashed" 
                                size="small" 
                                icon={<StarOutlined />}
                                onClick={() => setMobileFocusMode(false)}
                                style={{ height: '54px', borderRadius: '8px', fontSize: '11px' }}
                              >
                                Lainnya
                              </Button>
                            </Space>
                          </div>
                        ) : (
                          <Collapse 
                            ghost 
                            activeKey={activeCollapseKeys}
                            onChange={setActiveCollapseKeys}
                            expandIconPosition="end"
                            items={mapelCategories
                              .filter(cat => !isMobile || !mobileFocusMode || cat.key === 'ujian_khusus')
                              .map(cat => ({
                                key: cat.key,
                                label: (
                                  <Text strong style={{ color: 'rgba(0,0,0,0.65)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                                    {cat.label}
                                  </Text>
                                ),
                                children: (
                                  <Space wrap>
                                    {cat.items.map(m => (
                                      <Card
                                        key={m.id}
                                        hoverable
                                        size="small"
                                        className={`selection-card ${selectedMapel === m.id ? 'active' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedMapel(m.id);
                                        }}
                                        style={{ 
                                          padding: '2px 8px', 
                                          borderRadius: '8px',
                                          borderColor: selectedMapel === m.id ? 'var(--ant-primary-color)' : '#f0f0f0',
                                          backgroundColor: selectedMapel === m.id ? '#e6f7ff' : '#fafafa'
                                        }}
                                      >
                                        <Space>
                                          <Badge color={cat.color} />
                                          <Text strong={selectedMapel === m.id} style={{ fontSize: '13px' }}>{m.nama}</Text>
                                        </Space>
                                      </Card>
                                    ))}
                                  </Space>
                                )
                              }))}
                          />
                        )}
                      </div>
                    ) : (
                      <Empty description="Silakan pilih Tingkatan dan Rincian Kelas terlebih dahulu" />
                    )}
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={24}>
            {selectedKelasDetail && selectedMapel && selectedKategori ? (
              <Card 
                title={
                  <Space>
                    <UserOutlined />
                    <span>Daftar Santri - {kelas.find(k => k.id === selectedKelasDetail)?.nama}</span>
                    <Divider type="vertical" />
                    <BookOutlined />
                    <span>{mataPelajaran.find(m => m.id === selectedMapel)?.nama}</span>
                    <Badge count={mataPelajaran.find(m => m.id === selectedMapel)?.jenis} style={{ backgroundColor: '#52c41a', marginLeft: 8 }} />
                  </Space>
                }
                extra={
                  <Space>
                    <Button icon={<ReloadOutlined />} onClick={loadSantriAndNilai}>Refresh</Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={saveNilai} loading={saveLoading}>Simpan Semua Nilai</Button>
                  </Space>
                }
              >
                <Table 
                  dataSource={santriList} 
                  columns={columns} 
                  rowKey="santri_id" 
                  pagination={false} 
                  size="middle"
                  loading={loading}
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            ) : <Empty description="Silakan pilih Tingkatan, Rincian Kelas, dan Mata Pelajaran terlebih dahulu" />}
          </Col>
        </Row>
      )
    },
    {
      key: 'absensi',
      label: <span><CalendarOutlined /> Absensi</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card className="filter-card">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>{renderTingkatSelection()}</Col>
                <Col xs={24} lg={12}>
                  <Alert message="Pilih Tingkat dan Kelas untuk mengisi Absensi berdasarkan Semester yang aktif di atas." type="info" showIcon style={{ marginTop: 16 }} />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={24}>
            {selectedKelasDetail && selectedKategori ? (
              <RaporSantriForms 
                type="absensi" 
                tahunAjaran={tahunAjaran} 
                selectedKelasDetail={selectedKelasDetail} 
                selectedKategori={selectedKategori} 
                kelasName={kelas.find(k => k.id === selectedKelasDetail)?.nama}
              />
            ) : <Empty description="Silakan pilih Tingkat dan Kelas terlebih dahulu" />}
          </Col>
        </Row>
      )
    },
    {
      key: 'kepribadian',
      label: <span><UserOutlined /> Kepribadian</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card className="filter-card">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>{renderTingkatSelection()}</Col>
                <Col xs={24} lg={12}>
                  <Alert message="Pilih Tingkat dan Kelas untuk mengisi Nilai Kepribadian." type="info" showIcon style={{ marginTop: 16 }} />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={24}>
            {selectedKelasDetail && selectedKategori ? (
              <RaporSantriForms 
                type="kepribadian" 
                tahunAjaran={tahunAjaran} 
                selectedKelasDetail={selectedKelasDetail} 
                selectedKategori={selectedKategori} 
                kelasName={kelas.find(k => k.id === selectedKelasDetail)?.nama}
              />
            ) : <Empty description="Silakan pilih Tingkat dan Kelas terlebih dahulu" />}
          </Col>
        </Row>
      )
    },
    {
      key: 'catatan',
      label: <span><MessageOutlined /> Catatan Wali Kelas</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card className="filter-card">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>{renderTingkatSelection()}</Col>
                <Col xs={24} lg={12}>
                  <Alert message="Pilih Tingkat dan Kelas untuk mengisi Catatan Wali Kelas." type="info" showIcon style={{ marginTop: 16 }} />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={24}>
            {selectedKelasDetail && selectedKategori ? (
              <RaporSantriForms 
                type="catatan" 
                tahunAjaran={tahunAjaran} 
                selectedKelasDetail={selectedKelasDetail} 
                selectedKategori={selectedKategori} 
                kelasName={kelas.find(k => k.id === selectedKelasDetail)?.nama}
              />
            ) : <Empty description="Silakan pilih Tingkat dan Kelas terlebih dahulu" />}
          </Col>
        </Row>
      )
    },
    {
      key: 'setting',
      label: <span><SettingOutlined /> Pengaturan Kriteria</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card title="Cakupan Pengaturan (Khusus Muhafadzoh)">
              <Paragraph type="secondary">
                Pengaturan ini akan berlaku untuk seluruh kelas dalam tingkatan yang dipilih pada <strong>{kategori.find(k => k.id === selectedKategori)?.nama || 'Semester Aktif'}</strong>.
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                {renderTingkatSelection(true)}
                <Select placeholder="Pilih Mata Pelajaran" style={{ width: '100%' }} value={selectedMapel} onChange={setSelectedMapel}>
                  {mataPelajaran.filter(m => ['Muhafadzoh', 'Qiroah', 'Taftisy'].includes(m.jenis)).map(m => <Select.Option key={m.id} value={m.id}>{m.nama}</Select.Option>)}
                </Select>
                <Alert message="Informasi" description="Tingkat 2 dan SP wajib menggunakan format Teks. Selain Tingkat 2, SP, dan Sifir wajib Angka." type="info" showIcon style={{ marginTop: 16 }} />
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={16}>
            <Card title="Konfigurasi Kriteria" extra={<Button type="primary" icon={<SaveOutlined />} onClick={saveKriteria} loading={saveLoading}>Simpan Kriteria</Button>}>
              {selectedMapel && mataPelajaran.find(m => m.id === selectedMapel)?.jenis === 'Muhafadzoh' ? (
                <Tabs items={getSettingsTabs()} activeKey={kriteriaType} onChange={setKriteriaType} />
              ) : <Empty description="Pilih Kategori Muhafadzoh untuk mengatur kriteria" />}
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'jadwal',
      label: <span><AppstoreOutlined /> Jadwal Pelajaran</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card title="Pilih Tingkatan">
              {renderTingkatSelection(true)}
              <Alert message="Konfigurasi Jadwal Ujian Semester" description="Pilih mata pelajaran umum (Reguler) yang akan diujikan pada tingkatan ini." type="info" showIcon style={{ marginTop: 16 }} />
            </Card>
          </Col>
          <Col xs={24} lg={16}>
            <Card 
              title="Daftar Mata Pelajaran Semester" 
              extra={<Button type="primary" icon={<SaveOutlined />} onClick={saveJadwal} loading={saveLoading} disabled={selectedTingkat === null}>Simpan Jadwal</Button>}
            >
              {selectedTingkat !== null ? (
                <Checkbox.Group 
                  style={{ width: '100%' }} 
                  value={jadwalMapelIds} 
                  onChange={setJadwalMapelIds}
                >
                  <Row gutter={[16, 16]}>
                    {mataPelajaran.filter(m => m.jenis === 'Reguler').map(m => (
                      <Col xs={12} key={m.id}>
                        <Checkbox value={m.id}>
                          <Text strong>{m.nama}</Text>
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Checkbox.Group>
              ) : (
                <Empty description="Pilih Tingkatan terlebih dahulu di kolom kiri" />
              )}
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'rekap',
      label: <span><BookOutlined /> Rekap Nilai</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card className="filter-card">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>{renderTingkatSelection()}</Col>
                <Col xs={24} lg={12}>
                  <Alert message="Pilih Tingkat dan Kelas untuk melihat Rekap Nilai secara otomatis berdasarkan Semester yang aktif di atas." type="info" showIcon style={{ marginTop: 16 }} />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={24}>
            {selectedKelasDetail && selectedKategori ? (
              <Card 
                title={
                  <Space>
                    <UnorderedListOutlined />
                    <span>Rekap Nilai - {kelas.find(k => k.id === selectedKelasDetail)?.nama}</span>
                  </Space>
                }
              >
                <Table 
                  dataSource={rekapData} 
                  columns={rekapColumns} 
                  rowKey="santri_id" 
                  pagination={false} 
                  size="small"
                  scroll={{ x: 'max-content' }}
                  loading={rekapLoading}
                  bordered
                />
              </Card>
            ) : <Empty description="Silakan lengkapi pilihan filter di atas untuk melihat rekap nilai" />}
          </Col>
        </Row>
      )
    }
  ];

  const mainTabs = allTabs.filter(tab => {
    if (mode === 'config') return ['setting', 'jadwal'].includes(tab.key);
    if (mode === 'rekap') return ['rekap'].includes(tab.key);
    return ['input', 'absensi', 'kepribadian', 'catatan'].includes(tab.key);
  });

  if (loading && !santriList.length) return <LoadingState tip="Memuat modul manajemen nilai..." />;
  if (error) return <ErrorState message={error} onRetry={loadInitialData} />;

  const getHeaderInfo = () => {
    switch(mode) {
      case 'config':
        return {
          title: "Pengaturan & Jadwal",
          subtitle: "Konfigurasi kriteria nilai dan jadwal mata pelajaran"
        };
      case 'rekap':
        return {
          title: "Rekap & Rapor",
          subtitle: "Laporan rekapitulasi nilai dan pencetakan rapor santri"
        };
      default:
        return {
          title: "Input Penilaian",
          subtitle: "Input nilai, absensi, kepribadian, dan catatan wali kelas"
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="nilai-page">
      <PageHeader 
        title={headerInfo.title} 
        subtitle={headerInfo.subtitle}
        extra={[
          <Segmented 
            key="semester"
            className="semester-segmented-highlight"
            options={kategori.map(k => ({ label: k.nama, value: k.id }))}
            value={selectedKategori}
            onChange={(val) => {
              setSelectedKategori(val);
              localStorage.setItem('sekolah_info_selected_kategori', val);
            }}
            size="large"
            style={{ marginRight: 16 }}
          />,
          <Select
            key="ta"
            style={{ width: 150, alignSelf: 'center', marginRight: 16 }}
            value={tahunAjaran?.id}
            onChange={handleTahunAjaranChange}
            options={tahunAjaranList.map(ta => ({ value: ta.id, label: ta.kode }))}
            size="large"
          />
        ]}
      />
      {isMobile && mobileViewMode === 'dashboard' ? (
        <div className="mobile-dashboard-container">
          <div className="dashboard-header">
            <Title level={3}>Manajemen Nilai</Title>
            <Text type="secondary">Pilih kategori ujian untuk mulai input cepat</Text>
          </div>
          
          <div className="quick-cards-grid">
            <div className="quick-card muhafadzoh" onClick={() => handleQuickStart('muhafadzoh')}>
              <div className="card-icon"><AuditOutlined /></div>
              <div className="card-content">
                <h3>Muhafadzoh Akbar</h3>
                <p>Hafalan Nadhom & Teks Arab</p>
              </div>
              <div className="card-arrow"><ArrowRightOutlined /></div>
            </div>

            <div className="quick-card qiroah" onClick={() => handleQuickStart('qiroah')}>
              <div className="card-icon"><ReadOutlined /></div>
              <div className="card-content">
                <h3>Qiroatul Kitab</h3>
                <p>Ujian Baca Kitab Kuning</p>
              </div>
              <div className="card-arrow"><ArrowRightOutlined /></div>
            </div>

            <div className="quick-card taftisy" onClick={() => handleQuickStart('taftisy')}>
              <div className="card-icon"><FileSearchOutlined /></div>
              <div className="card-content">
                <h3>Taftisyul Kutub</h3>
                <p>Pemeriksaan Kelengkapan Kitab</p>
              </div>
              <div className="card-arrow"><ArrowRightOutlined /></div>
            </div>
          </div>

          <Divider dashed style={{ borderColor: '#d9d9d9' }}>Opsi Lainnya</Divider>
          
          <Button 
            block 
            size="large" 
            type="text"
            icon={<TableOutlined />}
            onClick={() => setMobileViewMode('input')}
            className="full-table-btn"
          >
            Buka Tabel Lengkap (Semua Ujian)
          </Button>
        </div>
      ) : (
        <div className="page-content"><Tabs activeKey={activeTab} onChange={setActiveTab} type="line" items={mainTabs} /></div>
      )}
      {/* Mobile Input Console (Virtual Keypad Expanded) */}
      {isMobile && showKeypad && (
        <div className="mobile-console-overlay">
          <div className="console-container">
            {/* --- FIXED HEADER AREA --- */}
            <div className="console-fixed-header">
              {/* 0. Status Bar (Notif Tersimpan) */}
              <div className={`console-status-bar ${autoSaveStatus || 'idle'}`}>
                {autoSaveStatus === 'saving' ? <Spin size="small" /> : autoSaveStatus === 'saved' ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
                <span>{autoSaveStatus === 'saving' ? 'Sedang Menyimpan...' : autoSaveStatus === 'saved' ? 'Data Berhasil Tersimpan!' : 'Siap Input'}</span>
              </div>

              {/* 1. Quick Selectors (Tingkat & Kelas) */}
              <div className="console-selectors">
                <div className="selector-row">
                  <div className="selector-label">Tingkat:</div>
                  <div className="selector-items">
                    {[0, 1, 2, 3, 4, 5, 6, 99].map(t => (
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

              <Divider style={{ margin: '8px 0' }} />

              {/* 2. Student Navigation & Preview */}
              <div className="console-navigation">
                <Button 
                  shape="circle" 
                  size="large"
                  icon={<EditOutlined style={{ transform: 'rotate(180deg)' }} />} 
                  onClick={() => {
                    const idx = santriList.findIndex(s => s.santri_id === activeSantriId);
                    if (idx > 0) setActiveSantriId(santriList[idx - 1].santri_id);
                  }}
                  disabled={santriList.findIndex(s => s.santri_id === activeSantriId) <= 0}
                />
                
                <div className="active-student-info">
                  <div className="student-name">
                    {loading ? 'Memuat...' : (santriList.find(s => s.santri_id === activeSantriId)?.nama || (santriList.length > 0 ? 'Pilih Santri' : 'Data Kosong'))}
                  </div>
                  <div className={`score-preview ${effectiveKriteriaType === 'Teks' ? 'text-mode' : ''}`}>
                    {loading ? '...' : (
                      effectiveKriteriaType === 'Angka' 
                        ? (Math.floor(santriList.find(s => s.santri_id === activeSantriId)?.nilai_angka ?? 0) || '-')
                        : (santriList.find(s => s.santri_id === activeSantriId)?.capaian || '-')
                    )}
                  </div>
                </div>

                <Button 
                  shape="circle" 
                  size="large"
                  icon={<EditOutlined />} 
                  onClick={() => {
                    const idx = santriList.findIndex(s => s.santri_id === activeSantriId);
                    if (idx < santriList.length - 1) setActiveSantriId(santriList[idx + 1].santri_id);
                  }}
                  disabled={santriList.findIndex(s => s.santri_id === activeSantriId) >= santriList.length - 1}
                />
              </div>
            </div>

            {/* --- SCROLLABLE BODY AREA --- */}
            <div className="console-scrollable-body">
              {/* 3. Dynamic Input Area (Keypad vs Achievement Pills) */}
              <div className="console-input-area">
                {effectiveKriteriaType === 'Angka' ? (
                  /* Numeric Keypad Mode */
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
                  /* Achievement Pills Mode (Teks/Arabic) */
                  <div className="achievement-grid">
                    {configTeks.map((item, idx) => {
                      const isSelected = santriList.find(s => s.santri_id === activeSantriId)?.capaian === item.bab;
                      return (
                        <div 
                          key={idx} 
                          className={`achievement-pill ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            handleNilaiChange(activeSantriId, 'capaian', item.bab);
                            // Auto-next logic: move to next student after selection if desired
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
                      Kosongkan Data Nilai
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="console-footer">
              <Button type="primary" danger block onClick={() => {
                setShowKeypad(false);
                setMobileViewMode('dashboard'); // Kembali ke dashboard saat tutup
              }}>Tutup & Kembali ke Menu</Button>
              <div style={{ marginTop: '8px', textAlign: 'center' }}>
                <Text type="secondary" size="small">Auto-save aktif</Text>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto Save Status Indicator */}
      {autoSaveStatus && (
        <div className={`auto-save-indicator ${autoSaveStatus}`}>
          {autoSaveStatus === 'saving' ? <Spin size="small" /> : <CheckCircleOutlined />}
          <span>{autoSaveStatus === 'saving' ? 'Menyimpan...' : autoSaveStatus === 'saved' ? 'Tersimpan' : 'Gagal Menyimpan'}</span>
        </div>
      )}
    </div>
  );
};

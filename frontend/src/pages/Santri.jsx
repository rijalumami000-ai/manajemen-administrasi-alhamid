import { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Space, Alert, message as antMessage, Modal, Form, Input } from 'antd';
import { SwapOutlined, RollbackOutlined, FileExcelOutlined, FilePdfOutlined, DownOutlined, BarChartOutlined, LineChartOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Sparkles, Users, Award, Home, Activity, CheckCircle, HelpCircle } from 'lucide-react';
import { santriService } from '../services/santriService';
import { SantriTable } from '../components/features/SantriTable';
import { SantriFilters } from '../components/features/SantriFilters';
import { MigrationModal } from '../components/features/MigrationModal';
import { TahunAjaranBoard } from '../components/features/TahunAjaranBoard';
import { PageHeader, LoadingState, ErrorState, PasswordConfirmModal } from '../components/common';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import './Santri.scss';

export function Santri() {
  // State
  const [santriList, setSantriList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [kamarList, setKamarList] = useState([]);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState(null);
  const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterDiniyah, setFilterDiniyah] = useState('');
  const [filterSekolah, setFilterSekolah] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm] = Form.useForm();

  // Migration Modal
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationPayload, setMigrationPayload] = useState(null);

  // Password Confirmation Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState(null); // 'rollback' | 'migration'
  const [passwordModalConfig, setPasswordModalConfig] = useState({ title: '', message: '' });

  // Custom Export Dropdown State
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  // Messages
  const [modalError, setModalError] = useState('');

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle click outside for export dropdown
  useEffect(() => {
    const handleClickOutsideExport = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideExport);
    return () => document.removeEventListener('mousedown', handleClickOutsideExport);
  }, []);

  // Load santri when user manually switches tahun ajaran (after initial load)
  // Note: we DO NOT trigger this on initial mount because loadInitialData already
  // fetches santri. Without this guard, the stale closure on tahunAjaranList
  // could cause loadSantri to skip silently (tahunAjaranList still [] in closure).
  const hasLoadedInitially = useRef(false);
  useEffect(() => {
    if (!hasLoadedInitially.current) return;
    loadSantri();
  }, [selectedTahunAjaranId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tahunAjaranData, kelasData, kamarData] = await Promise.all([
        santriService.fetchTahunAjaran(),
        santriService.fetchKelas(),
        santriService.fetchKamar()
      ]);

      setTahunAjaranList(tahunAjaranData);
      setKelasList(kelasData);
      setKamarList(kamarData);

      const active = tahunAjaranData.find(ta => ta.is_active);
      setActiveTahunAjaran(active);
      const activeId = active ? String(active.id) : '';
      setSelectedTahunAjaranId(activeId);

      // Load santri immediately with the resolved yearId (avoids stale-closure race)
      await loadSantriForYear(activeId, active);
      hasLoadedInitially.current = true;

    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError(err.message || 'Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  // Accepts explicit yearId & activeTahunAjaran to avoid stale closure issues
  const loadSantriForYear = async (yearId, activeYear) => {
    try {
      const isActiveYear = !yearId || (activeYear && String(yearId) === String(activeYear?.id));

      const [santriData, alumniData] = await Promise.all([
        santriService.fetchSantri(yearId || null),
        santriService.fetchAlumni()
      ]);

      let filteredSantri = santriData;
      if (isActiveYear) {
        const alumniSantriIds = new Set(
          alumniData.map(a => a.santri_id).filter(Boolean).map(Number)
        );
        const alumniNis = new Set(
          alumniData.map(a => a.nis).filter(Boolean)
        );
        filteredSantri = santriData.filter(
          s => !alumniSantriIds.has(Number(s.id)) && !alumniNis.has(s.nis)
        );
      }

      setSantriList(filteredSantri);
    } catch (err) {
      console.error('Failed to load santri:', err);
      antMessage.error(err.message || 'Gagal memuat data santri');
    }
  };

  const loadSantri = async () => {
    const yearId = selectedTahunAjaranId || (activeTahunAjaran ? String(activeTahunAjaran.id) : '');
    await loadSantriForYear(yearId, activeTahunAjaran);
  };

  const handleUpdateSemesterStatus = async (id, statusData) => {
    try {
      const yearId = selectedTahunAjaranId || (activeTahunAjaran ? activeTahunAjaran.id : null);
      await santriService.updateSemesterStatus(id, { ...statusData, tahun_ajaran_id: yearId });
      antMessage.success('Status semester berhasil diperbarui');
      // Update local state instead of reloading to be smooth
      setSantriList(prev => prev.map(s => s.id === id ? { ...s, ...statusData } : s));
    } catch (err) {
      console.error('Failed to update semester status:', err);
      antMessage.error(err.message || 'Gagal memperbarui status semester');
    }
  };

  const isSelectedYearActive = () => {
    if (!selectedTahunAjaranId || !activeTahunAjaran) return true;
    return Number(selectedTahunAjaranId) === Number(activeTahunAjaran.id);
  };

  const getYearStatus = () => {
    if (!selectedTahunAjaranId || !activeTahunAjaran) return 'active';

    const selectedYear = tahunAjaranList.find(ta => Number(ta.id) === Number(selectedTahunAjaranId));
    if (!selectedYear) return 'active';

    if (Number(selectedYear.id) === Number(activeTahunAjaran.id)) {
      return 'active'; // Tahun berjalan
    } else if (selectedYear.tahun_mulai > activeTahunAjaran.tahun_mulai) {
      return 'coming'; // Tahun yang akan datang
    } else {
      return 'archive'; // Tahun arsip (sudah lewat)
    }
  };

  const yearStatus = getYearStatus();
  const canEdit = yearStatus === 'active'; // Hanya tahun berjalan yang bisa edit/delete
  const canAdd = yearStatus !== 'coming'; // Bisa tambah di active dan archive, tapi tidak di coming soon

  // Extended search matching Name, NIS, Parents, Class, Room, Phone Number
  const filteredSantri = useMemo(() => {
    return santriList.filter(santri => {
      const keyword = searchKeyword.toLowerCase();
      const searchable = [
        santri.nis,
        santri.nik,
        santri.nama,
        santri.nama_ayah,
        santri.nama_ibu,
        santri.no_hp_ayah,
        santri.no_hp_ibu,
        santri.nama_diniyah,
        santri.nama_sekolah,
        santri.nama_kamar
      ].join(' ').toLowerCase();

      return (
        (!keyword || searchable.includes(keyword)) &&
        (!filterDiniyah || santri.nama_diniyah === filterDiniyah) &&
        (!filterSekolah || santri.nama_sekolah === filterSekolah) &&
        (!filterGender || santri.jenis_kelamin === filterGender) &&
        (!filterStatus || santri.status_tahun_ajaran === filterStatus)
      );
    });
  }, [santriList, searchKeyword, filterDiniyah, filterSekolah, filterGender, filterStatus]);

  // Get unique filter options
  const diniyahOptions = useMemo(() => {
    return [...new Set(santriList.map(s => s.nama_diniyah).filter(Boolean))];
  }, [santriList]);

  const sekolahOptions = useMemo(() => {
    return [...new Set(santriList.map(s => s.nama_sekolah).filter(Boolean))];
  }, [santriList]);

  const handleEditClick = (santri) => {
    if (!canEdit) {
      antMessage.warning('Data arsip hanya bisa dibaca. Pilih Tahun Ajaran Berjalan untuk edit.');
      return;
    }
    setEditingData(santri);
    setModalError('');
    editForm.setFieldsValue({
      kelas_diniyah_id: santri.kelas_diniyah_id || undefined,
      kelas_sekolah_id: santri.kelas_sekolah_id || undefined,
      kamar_id: santri.kamar_id || undefined,
      status_tahun_ajaran: santri.status_tahun_ajaran || 'aktif',
      catatan_tahun_ajaran: santri.catatan_tahun_ajaran || '',
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async () => {
    setIsSubmitting(true);
    setModalError('');
    try {
      const values = await editForm.validateFields();
      const submitData = {
        ...editingData,
        ...values,
        kelas_diniyah_id: values.kelas_diniyah_id ? Number(values.kelas_diniyah_id) : null,
        kelas_sekolah_id: values.kelas_sekolah_id ? Number(values.kelas_sekolah_id) : null,
        kamar_id: values.kamar_id ? Number(values.kamar_id) : null,
        tahun_ajaran_id: selectedTahunAjaranId ? Number(selectedTahunAjaranId) : activeTahunAjaran?.id,
      };
      await santriService.updateSantri(editingData.id, submitData);
      antMessage.success('Penempatan santri berhasil diperbarui');
      setIsModalOpen(false);
      await loadSantri();
    } catch (err) {
      if (err.message) setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTahunAjaranSelect = (id) => {
    setSelectedTahunAjaranId(String(id));
  };

  const handleMigrateClick = async () => {
    if (!activeTahunAjaran) {
      antMessage.error('Tahun ajaran berjalan belum tersedia');
      return;
    }
    setIsMigrationModalOpen(true);
  };

  const handleMigrationConfirm = async (excludedSantriIds, promotions = []) => {
    if (!activeTahunAjaran) {
      antMessage.error('Tahun ajaran berjalan belum tersedia');
      return;
    }

    const nextKode = `${activeTahunAjaran.tahun_selesai}-${activeTahunAjaran.tahun_selesai + 1}`;

    setMigrationPayload({ nextKode, excludedSantriIds, promotions });
    setPasswordModalConfig({
      title: 'Konfirmasi Keamanan: Migrasi',
      message: `Apakah Anda yakin ingin melakukan Migrasi ke Tahun Ajaran ${nextKode}? \n\nTindakan ini akan menaikkan kelas semua santri, menjadikan kelas akhir sebagai alumni, dan merupakan tindakan permanen.`
    });
    setPasswordAction('migration');
    setIsMigrationModalOpen(false);
    setIsPasswordModalOpen(true);
  };

  const executeMigration = async () => {
    if (!migrationPayload) return;
    const { nextKode, excludedSantriIds, promotions } = migrationPayload;

    try {
      setIsMigrating(true);
      const result = await santriService.migrateTahunAjaran(nextKode, excludedSantriIds, promotions);

      const successMessage = [
        `${result.message}`,
        `✅ ${result.migrated || 0} santri naik kelas`,
        `🎓 ${result.alumni_created || 0} santri menjadi alumni`,
        `📝 ${result.mts_graduates || 0} santri lulus MTs`,
        `❌ ${result.excluded || 0} santri tidak naik kelas`,
      ];

      if (result.existing_alumni_excluded > 0) {
        successMessage.push(`ℹ️ ${result.existing_alumni_excluded} alumni sudah ada (tidak diproses)`);
      }

      antMessage.success(successMessage.join('\n'), 8);

      setIsMigrationModalOpen(false);
      await loadInitialData();
      setMigrationPayload(null);
    } catch (err) {
      antMessage.error(err.message || 'Gagal migrasi tahun ajaran');
    } finally {
      setIsMigrating(false);
      setIsPasswordModalOpen(false);
    }
  };

  const handleRollbackClick = async () => {
    if (!activeTahunAjaran) {
      antMessage.error('Tahun ajaran berjalan belum tersedia');
      return;
    }

    const confirmMessage = [
      `Apakah Anda yakin ingin membatalkan migrasi dan kembali ke tahun ajaran sebelumnya?`,
      ``,
      `⚠️ PERINGATAN:`,
      `• Semua data santri di tahun ajaran ${activeTahunAjaran.kode} akan dihapus`,
      `• Record alumni yang dibuat saat migrasi akan dihapus`,
      `• Status santri yang tidak naik kelas akan dikembalikan`,
      ``,
      `Proses ini akan mengembalikan sistem ke kondisi sebelum migrasi.`
    ].join('\n');

    setPasswordModalConfig({
      title: 'Konfirmasi Keamanan: Rollback',
      message: confirmMessage
    });
    setPasswordAction('rollback');
    setIsPasswordModalOpen(true);
  };

  const executeRollback = async () => {
    try {
      setIsMigrating(true);
      const result = await santriService.rollbackMigration();

      const successMessage = [
        `${result.message}`,
        `🗑️ ${result.deletedCount || 0} data santri dihapus`,
        `🔄 ${result.restoredCount || 0} status dikembalikan`,
        `🎓 ${result.alumni_deleted || 0} record alumni dihapus`,
      ];

      antMessage.success(successMessage.join('\n'), 8);

      await loadInitialData();
    } catch (err) {
      antMessage.error(err.message || 'Gagal rollback migrasi');
    } finally {
      setIsMigrating(false);
      setIsPasswordModalOpen(false);
    }
  };

  const handlePasswordConfirm = () => {
    if (passwordAction === 'rollback') {
      executeRollback();
    } else if (passwordAction === 'migration') {
      executeMigration();
    }
  };

  const selectedYear = selectedTahunAjaranId
    ? tahunAjaranList.find(ta => Number(ta.id) === Number(selectedTahunAjaranId))
    : activeTahunAjaran;

  const getYearLabel = () => {
    if (!selectedYear) return 'Data Santri Tahun Ajaran Berjalan';

    let statusLabel = '';
    if (yearStatus === 'active') {
      statusLabel = ' (Berjalan)';
    } else if (yearStatus === 'coming') {
      statusLabel = ' (Coming Soon)';
    } else {
      statusLabel = ' (Arsip)';
    }

    return `Tahun Ajaran ${selectedYear.kode}${statusLabel}`;
  };

  const handleExportExcel = (type) => {
    let sourceData = filteredSantri;

    if (type === 'ganjil') {
      sourceData = filteredSantri.filter(s => s.aktif_ganjil);
    } else if (type === 'genap') {
      sourceData = filteredSantri.filter(s => s.aktif_genap);
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
      } catch (e) {
        return dateString;
      }
    };

    const dataToExport = sourceData.map(s => ({
      'NIS': s.nis,
      'NIK': s.nik,
      'Nama': s.nama,
      'Jenis Kelamin': s.jenis_kelamin,
      'Kelas Diniyah': s.nama_diniyah,
      'Kelas Sekolah': s.nama_sekolah,
      'Kamar': s.nama_kamar,
      'Status': s.status_tahun_ajaran,
      'Tempat Lahir': s.tempat_lahir,
      'Tanggal Lahir': formatDate(s.tanggal_lahir),
      'Nama Ayah': s.nama_ayah,
      'Nama Ibu': s.nama_ibu,
      'Alamat': s.alamat
    }));

    const typeLabel = type === 'ganjil' ? 'Ganjil_' : type === 'genap' ? 'Genap_' : '';
    exportToExcel(dataToExport, `Data_Santri_${typeLabel}${selectedYear?.kode || 'Export'}.xlsx`);
  };

  const handleExportPDF = () => {
    const columns = [
      { title: 'NIS', dataIndex: 'nis' },
      { title: 'Nama', dataIndex: 'nama' },
      { title: 'L/P', dataIndex: 'jenis_kelamin' },
      { title: 'Diniyah', dataIndex: 'nama_diniyah' },
      { title: 'Sekolah', dataIndex: 'nama_sekolah' },
      { title: 'Kamar', dataIndex: 'nama_kamar' },
      { title: 'Status', dataIndex: 'status_tahun_ajaran' }
    ];
    exportToPDF(filteredSantri, columns, `Data Santri - Tahun Ajaran ${selectedYear?.kode}`, `Data_Santri_${selectedYear?.kode || 'Export'}.pdf`);
  };

  // Dynamic KPI Card Calculations
  const totalStudents = useMemo(() => santriList.length, [santriList]);
  
  const totalBoys = useMemo(() => {
    return santriList.filter(s => s.jenis_kelamin === 'Laki-laki').length;
  }, [santriList]);

  const totalGirls = useMemo(() => {
    return santriList.filter(s => s.jenis_kelamin === 'Perempuan').length;
  }, [santriList]);

  const totalClasses = useMemo(() => {
    const diniyahClasses = new Set(santriList.map(s => s.nama_diniyah).filter(Boolean));
    const sekolahClasses = new Set(santriList.map(s => s.nama_sekolah).filter(Boolean));
    return diniyahClasses.size + sekolahClasses.size;
  }, [santriList]);

  const totalRooms = useMemo(() => {
    const rooms = new Set(santriList.map(s => s.nama_kamar).filter(Boolean));
    return rooms.size;
  }, [santriList]);

  const roomAssignedPct = useMemo(() => {
    if (totalStudents === 0) return 0;
    const assigned = santriList.filter(s => s.kamar_id).length;
    return Math.round((assigned / totalStudents) * 100);
  }, [santriList, totalStudents]);

  // Densest Class Finder
  const densestClass = useMemo(() => {
    const counts = {};
    santriList.forEach(s => {
      if (s.nama_diniyah) counts[s.nama_diniyah] = (counts[s.nama_diniyah] || 0) + 1;
      if (s.nama_sekolah) counts[s.nama_sekolah] = (counts[s.nama_sekolah] || 0) + 1;
    });
    let name = '-';
    let count = 0;
    Object.entries(counts).forEach(([k, v]) => {
      if (v > count) {
        name = k;
        count = v;
      }
    });
    return { name, count };
  }, [santriList]);

  // Year-over-Year Growth Comparison Data
  const comparisonData = useMemo(() => {
    if (!selectedYear || tahunAjaranList.length === 0) return null;
    const sorted = [...tahunAjaranList].sort((a, b) => {
      const yearA = parseInt(a.kode.split('-')[0]) || 0;
      const yearB = parseInt(b.kode.split('-')[0]) || 0;
      return yearA - yearB;
    });
    const currIdx = sorted.findIndex(ta => Number(ta.id) === Number(selectedYear.id));
    if (currIdx <= 0) return null;
    const prevYear = sorted[currIdx - 1];

    const currCount = Number(selectedYear.jumlah_santri || 0);
    const prevCount = Number(prevYear.jumlah_santri || 0);
    const diff = currCount - prevCount;
    const pct = prevCount > 0 ? Math.round((diff / prevCount) * 100) : 0;

    return {
      prevYearCode: prevYear.kode,
      prevCount,
      currCount,
      diff,
      pct,
      isGrowth: diff >= 0
    };
  }, [selectedYear, tahunAjaranList]);

  // Class & Room Distribution Lists for Analytics
  const classDistribution = useMemo(() => {
    const dist = {};
    santriList.forEach(s => {
      const cls = s.nama_diniyah || s.nama_sekolah || 'Tanpa Kelas';
      dist[cls] = (dist[cls] || 0) + 1;
    });
    return Object.entries(dist)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [santriList]);

  const roomDistribution = useMemo(() => {
    const dist = {};
    santriList.forEach(s => {
      const rm = s.nama_kamar || 'Tanpa Kamar';
      dist[rm] = (dist[rm] || 0) + 1;
    });
    return Object.entries(dist)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [santriList]);

  // Export Center items
  const exportCenterItems = [
    {
      key: 'excel-ganjil',
      label: 'Ekspor Excel (Ganjil)',
      icon: <FileExcelOutlined style={{ color: '#10b981' }} />,
      onClick: () => handleExportExcel('ganjil')
    },
    {
      key: 'excel-genap',
      label: 'Ekspor Excel (Genap)',
      icon: <FileExcelOutlined style={{ color: '#10b981' }} />,
      onClick: () => handleExportExcel('genap')
    },
    {
      key: 'excel-global',
      label: 'Ekspor Excel (Global)',
      icon: <FileExcelOutlined style={{ color: '#10b981' }} />,
      onClick: () => handleExportExcel('global')
    },
    {
      type: 'divider'
    },
    {
      key: 'pdf-global',
      label: 'Ekspor PDF Laporan',
      icon: <FilePdfOutlined style={{ color: '#ef4444' }} />,
      onClick: handleExportPDF
    }
  ];

  const yearLabel = getYearLabel();

  const nextYearKode = activeTahunAjaran
    ? `${activeTahunAjaran.tahun_selesai}-${activeTahunAjaran.tahun_selesai + 1}`
    : null;

  if (loading) {
    return <LoadingState message="Memuat data santri..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadInitialData}
      />
    );
  }

  return (
    <div className="santri-page-center">
      <PageHeader
        title="Pusat Data Santri & Akademik"
        subtitle={yearLabel}
        extra={
          <Space size="middle">
            <Button
              icon={<BarChartOutlined />}
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={showAnalytics ? 'analytics-active-btn' : ''}
            >
              Analisis & Statistik
            </Button>
            <div className="custom-export-dropdown" ref={exportDropdownRef}>
              <Button 
                icon={<FileExcelOutlined />} 
                type="default"
                disabled={filteredSantri.length === 0}
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              >
                Ekspor Laporan <DownOutlined />
              </Button>
              {exportDropdownOpen && (
                <div className="export-dropdown-menu">
                  {exportCenterItems.map((item, index) => {
                    if (item.type === 'divider') {
                      return <div key={`div-${index}`} className="dropdown-divider" />;
                    }
                    return (
                      <div 
                        key={item.key} 
                        className="dropdown-item" 
                        onClick={() => {
                          item.onClick();
                          setExportDropdownOpen(false);
                        }}
                      >
                        <span className="item-icon">{item.icon}</span>
                        <span className="item-label">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <Button
              icon={<RollbackOutlined />}
              onClick={handleRollbackClick}
              disabled={!canEdit || !activeTahunAjaran}
              danger
            >
              Rollback
            </Button>
            <Button
              icon={<SwapOutlined />}
              onClick={handleMigrateClick}
              disabled={!canEdit || !activeTahunAjaran}
              type="primary"
            >
              Migrasi Kelas
            </Button>
          </Space>
        }
      />

      <TahunAjaranBoard
        tahunAjaranList={tahunAjaranList}
        selectedId={selectedTahunAjaranId}
        onSelect={handleTahunAjaranSelect}
      />

      {/* Academic Summary Dashboard */}
      <div className="academic-stats-dashboard">
        <div className="stats-grid">
          {/* Card 1: Total Students */}
          <div className="summary-kpi-card accent-blue">
            <div className="kpi-card-inner">
              <div className="kpi-icon-wrap">
                <Users size={20} className="kpi-icon" />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Total Santri Terdaftar</span>
                <span className="kpi-value">{totalStudents}</span>
                <span className="kpi-subtext">
                  👨 {totalBoys} Laki-laki &bull; 🧕 {totalGirls} Perempuan
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Classes */}
          <div className="summary-kpi-card accent-amber">
            <div className="kpi-card-inner">
              <div className="kpi-icon-wrap">
                <Award size={20} className="kpi-icon" />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Total Kelas Aktif</span>
                <span className="kpi-value">{totalClasses}</span>
                <span className="kpi-subtext">Diniyah &amp; Sekolah formal</span>
              </div>
            </div>
          </div>

          {/* Card 3: Total Rooms */}
          <div className="summary-kpi-card accent-purple">
            <div className="kpi-card-inner">
              <div className="kpi-icon-wrap">
                <Home size={20} className="kpi-icon" />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Kamar Asrama Terisi</span>
                <span className="kpi-value">{totalRooms}</span>
                <span className="kpi-subtext">{roomAssignedPct}% Penempatan Kamar</span>
              </div>
            </div>
          </div>

          {/* Card 4: Active Year details */}
          <div className="summary-kpi-card accent-green">
            <div className="kpi-card-inner">
              <div className="kpi-icon-wrap">
                <Activity size={20} className="kpi-icon" />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Status Periode Terpilih</span>
                <span className="kpi-value">{selectedYear?.kode || '-'}</span>
                <span className="kpi-subtext">
                  {yearStatus === 'active' ? '🟢 Periode Berjalan' : yearStatus === 'coming' ? '⏳ Coming Soon' : '📁 Diarsip'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Insights Panel */}
      <div className="academic-insights-banner">
        <div className="insights-header">
          <Sparkles size={16} className="insight-header-icon" />
          <span>Analisis Cerdas Sistem</span>
        </div>
        <div className="insights-grid">
          <div className="insight-bullet">
            <span className="bullet-dot bg-blue"></span>
            <span>Tahun ajaran terpilih menampung sebanyak <strong>{totalStudents} santri</strong> terdaftar secara keseluruhan.</span>
          </div>
          <div className="insight-bullet">
            <span className="bullet-dot bg-amber"></span>
            <span>Kelas terpadat saat ini adalah <strong>{densestClass.name}</strong> dengan jumlah santri <strong>{densestClass.count} santri</strong>.</span>
          </div>
          <div className="insight-bullet">
            <span className="bullet-dot bg-purple"></span>
            <span>Tingkat keberhasilan pemetaan kamar santri mencapai <strong>{roomAssignedPct}%</strong> dari seluruh kapasitas terdaftar.</span>
          </div>
        </div>
      </div>

      {/* Collapsible Analytics Pane */}
      {showAnalytics && (
        <div className="collapsible-analytics-panel animate-slide-down">
          <div className="analytics-pane-grid">
            
            {/* Year-over-Year Comparison */}
            <div className="analytics-pane-card">
              <h4>Perbandingan Tahun Ajaran</h4>
              {comparisonData ? (
                <div className="comparison-content">
                  <div className="comparison-row">
                    <div className="comparison-year-box">
                      <span className="comp-label">Tahun Sebelumnya ({comparisonData.prevYearCode})</span>
                      <span className="comp-val">{comparisonData.prevCount} Santri</span>
                    </div>
                    <div className="comparison-arrow-indicator">&rarr;</div>
                    <div className="comparison-year-box highlight-blue">
                      <span className="comp-label">Selected Year ({selectedYear?.kode})</span>
                      <span className="comp-val">{comparisonData.currCount} Santri</span>
                    </div>
                  </div>
                  <div className="comparison-result-bar">
                    <span className="result-diff-text">
                      Selisih: <strong>{comparisonData.diff >= 0 ? `+${comparisonData.diff}` : comparisonData.diff} santri</strong> ({comparisonData.pct}% pertumbuhan)
                    </span>
                    <div className={`diff-tag ${comparisonData.isGrowth ? 'growth' : 'shrink'}`}>
                      {comparisonData.isGrowth ? 'Growth ↑' : 'Shrink ↓'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="analytics-empty-state">
                  <InfoCircleOutlined />
                  <span>Tidak ada data tahun ajaran sebelumnya untuk perbandingan.</span>
                </div>
              )}
            </div>

            {/* Class Distribution Charts */}
            <div className="analytics-pane-card">
              <h4>Distribusi Kelas Terpadat</h4>
              <div className="dist-list">
                {classDistribution.length > 0 ? (
                  classDistribution.map((item, index) => (
                    <div key={index} className="dist-item">
                      <div className="dist-label-row">
                        <span className="dist-name">{item.name}</span>
                        <span className="dist-count">{item.count} Santri</span>
                      </div>
                      <div className="dist-progress-bg">
                        <div className="dist-progress-fill bg-blue" style={{ width: `${Math.min(100, (item.count / totalStudents) * 100)}%` }}></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="analytics-empty-state">
                    <span>Belum ada data distribusi kelas.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Room Distribution Charts */}
            <div className="analytics-pane-card">
              <h4>Distribusi Kamar Asrama Terpadat</h4>
              <div className="dist-list">
                {roomDistribution.length > 0 ? (
                  roomDistribution.map((item, index) => (
                    <div key={index} className="dist-item">
                      <div className="dist-label-row">
                        <span className="dist-name">{item.name}</span>
                        <span className="dist-count">{item.count} Santri</span>
                      </div>
                      <div className="dist-progress-bg">
                        <div className="dist-progress-fill bg-purple" style={{ width: `${Math.min(100, (item.count / totalStudents) * 100)}%` }}></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="analytics-empty-state">
                    <span>Belum ada data distribusi kamar.</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="santri-content-layout">
        {yearStatus === 'archive' && (
          <Alert
            message="Mode Data Arsip"
            description="Periode akademik ini telah selesai. Anda hanya dapat melihat data santri di arsip ini. Modifikasi data dinonaktifkan."
            type="info"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}
        {yearStatus === 'coming' && (
          <Alert
            message="Periode Akademik Mendatang"
            description="Tahun ajaran ini belum berjalan aktif. Gunakan fungsi Migrasi Kelas untuk mendaftarkan dan menaikkan kelas santri ke tahun ajaran ini."
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <SantriFilters
          searchValue={searchKeyword}
          onSearchChange={setSearchKeyword}
          diniyahValue={filterDiniyah}
          onDiniyahChange={setFilterDiniyah}
          sekolahValue={filterSekolah}
          onSekolahChange={setFilterSekolah}
          genderValue={filterGender}
          onGenderChange={setFilterGender}
          statusValue={filterStatus}
          onStatusChange={setFilterStatus}
          tahunAjaranValue={selectedTahunAjaranId}
          onTahunAjaranChange={setSelectedTahunAjaranId}
          diniyahOptions={diniyahOptions}
          sekolahOptions={sekolahOptions}
          tahunAjaranOptions={tahunAjaranList}
        />

        <SantriTable
          data={filteredSantri}
          onEdit={handleEditClick}
          canEdit={canEdit}
          onUpdateSemesterStatus={handleUpdateSemesterStatus}
        />
      </div>

      {/* Modal Edit Penempatan (Kelas, Kamar, Status) */}
      <Modal
        open={isModalOpen}
        title={`Ubah Penempatan Santri: ${editingData?.nama || ''}`}
        onCancel={() => { setIsModalOpen(false); setModalError(''); }}
        onOk={handleModalSubmit}
        confirmLoading={isSubmitting}
        okText="Simpan Perubahan"
        cancelText="Batal"
        destroyOnClose
        className="academic-modal"
      >
        {modalError && <Alert message={modalError} type="error" showIcon style={{ marginBottom: 16 }} />}
        <Form form={editForm} layout="vertical" disabled={isSubmitting}
          initialValues={{
            kelas_diniyah_id: editingData?.kelas_diniyah_id || undefined,
            kelas_sekolah_id: editingData?.kelas_sekolah_id || undefined,
            kamar_id: editingData?.kamar_id || undefined,
            status_tahun_ajaran: editingData?.status_tahun_ajaran || 'aktif',
            catatan_tahun_ajaran: editingData?.catatan_tahun_ajaran || '',
          }}
        >
          <Form.Item name="kelas_diniyah_id" label="Kelas Kurikulum Diniyah">
            <select className="custom-native-select">
              <option value="">Pilih Kelas (Kosong)</option>
              {kelasList.filter(k => k.jenis === 'Diniyah').map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </Form.Item>
          <Form.Item name="kelas_sekolah_id" label="Kelas Kurikulum Sekolah">
            <select className="custom-native-select">
              <option value="">Pilih Kelas (Kosong)</option>
              {kelasList.filter(k => k.jenis === 'Sekolah').map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </Form.Item>
          <Form.Item name="kamar_id" label="Kamar Asrama Santri">
            <select className="custom-native-select">
              <option value="">Pilih Kamar (Kosong)</option>
              {kamarList.map(k => <option key={k.id} value={k.id}>{k.nama} ({k.jenis})</option>)}
            </select>
          </Form.Item>
          <Form.Item name="status_tahun_ajaran" label="Status Akademik Periode">
            <select className="custom-native-select">
              <option value="aktif">Aktif</option>
              <option value="pindah">Pindah / Migrasi</option>
            </select>
          </Form.Item>
          <Form.Item name="catatan_tahun_ajaran" label="Catatan Riwayat Akademik">
            <Input.TextArea rows={2} placeholder="Masukkan catatan opsional..." />
          </Form.Item>
        </Form>
      </Modal>

      <MigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onConfirm={handleMigrationConfirm}
        santriList={santriList.filter(s => s.aktif_genap)}
        sourceYear={activeTahunAjaran}
        targetYear={nextYearKode}
        isSubmitting={isMigrating}
        kelasList={kelasList}
      />

      <PasswordConfirmModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onConfirm={handlePasswordConfirm}
        title={passwordModalConfig.title}
        message={passwordModalConfig.message}
        actionType={passwordAction}
      />
    </div>
  );
}

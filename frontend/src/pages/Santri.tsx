import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Users,
  Award,
  Home,
  Activity,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Undo2,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  BarChart2,
  TrendingUp,
  Info
} from 'lucide-react';
import { santriService } from '../services/santriService';
import { SantriTable } from '../components/features/SantriTable';
import { SantriFilters } from '../components/features/SantriFilters';
import { MigrationModal } from '../components/features/MigrationModal';
import { TahunAjaranBoard } from '../components/features/TahunAjaranBoard';
import { LoadingState, ErrorState, PasswordConfirmModal } from '../components/common';
import { CustomModal } from '../components/ui/CustomModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SmartAlert } from '../components/ui/SmartAlert';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { normalizeGender } from '../utils/studentUtils';
import {
  SantriListItem,
  KelasItem,
  KamarItem,
  TahunAjaranItem,
  EditFormData
} from '../types/santri';
import './Santri.scss';

export function Santri() {
  const [santriList, setSantriList] = useState<SantriListItem[]>([]);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [kamarList, setKamarList] = useState<KamarItem[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranItem[]>([]);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState<TahunAjaranItem | null>(null);
  const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState<string>('');
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);

  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterDiniyah, setFilterDiniyah] = useState<string>('');
  const [filterSekolah, setFilterSekolah] = useState<string>('');
  const [filterGender, setFilterGender] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<SantriListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    kelas_diniyah_id: '',
    kelas_sekolah_id: '',
    kamar_id: '',
    status_tahun_ajaran: 'aktif',
    catatan_tahun_ajaran: ''
  });
  const [modalError, setModalError] = useState<string>('');

  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [migrationPayload, setMigrationPayload] = useState<any>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordAction, setPasswordAction] = useState<string | null>(null);
  const [passwordModalConfig, setPasswordModalConfig] = useState<{ title: string; message: string }>({ title: '', message: '' });

  const [exportDropdownOpen, setExportDropdownOpen] = useState<boolean>(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTahunAjaranId) {
      loadSantriByTahunAjaran(selectedTahunAjaranId);
      santriService.fetchKelas(selectedTahunAjaranId).then(data => {
        if (Array.isArray(data)) setKelasList(data);
      }).catch(console.error);
    }
  }, [selectedTahunAjaranId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [activeYear, tahunList, kelasData, kamarData] = await Promise.all([
        santriService.fetchActiveTahunAjaran().catch(() => null),
        santriService.fetchTahunAjaran().catch(() => []),
        santriService.fetchKelas().catch(() => []),
        santriService.fetchKamar().catch(() => [])
      ]);

      setActiveTahunAjaran(activeYear);
      setTahunAjaranList(tahunList || []);
      setKelasList(kelasData || []);
      setKamarList(kamarData || []);

      const initialYearId = activeYear ? String(activeYear.id) : (tahunList[0] ? String(tahunList[0].id) : '');
      setSelectedTahunAjaranId(initialYearId);

      if (initialYearId) {
        const santriData = await santriService.fetchSantriByTahunAjaran(initialYearId);
        setSantriList(Array.isArray(santriData) ? santriData : []);
      }
    } catch (err: any) {
      console.error('Gagal memuat data santri:', err);
      setError(err.message || 'Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  const loadSantriByTahunAjaran = async (tahunAjaranId: string) => {
    try {
      setLoading(true);
      const data = await santriService.fetchSantriByTahunAjaran(tahunAjaranId);
      setSantriList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Gagal memuat data santri:', err);
      setError(err.message || 'Gagal memuat data santri');
    } finally {
      setLoading(false);
    }
  };

  const isSelectedYearActive = useMemo(() => {
    if (!selectedTahunAjaranId || !activeTahunAjaran) return false;
    return Number(selectedTahunAjaranId) === Number(activeTahunAjaran.id);
  }, [selectedTahunAjaranId, activeTahunAjaran]);

  const canEdit = isSelectedYearActive;

  const nextYearKode = useMemo(() => {
    if (!activeTahunAjaran) return '';
    return `${activeTahunAjaran.tahun_selesai}-${activeTahunAjaran.tahun_selesai + 1}`;
  }, [activeTahunAjaran]);

  const filteredSantri = useMemo(() => {
    return santriList.filter(santri => {
      const keyword = searchKeyword.toLowerCase().trim();
      const searchable = [
        santri.nama,
        santri.nis,
        santri.nik,
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
        (!filterGender || normalizeGender(santri.jenis_kelamin) === filterGender) &&
        (!filterStatus || santri.status_tahun_ajaran === filterStatus)
      );
    });
  }, [santriList, searchKeyword, filterDiniyah, filterSekolah, filterGender, filterStatus]);

  const diniyahOptions = useMemo(() => {
    const fromKelas = kelasList.filter(k => k.jenis === 'Diniyah').map(k => k.nama);
    const fromSantri = santriList.map(s => s.nama_diniyah).filter(Boolean) as string[];
    return [...new Set([...fromKelas, ...fromSantri])].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  }, [kelasList, santriList]);

  const sekolahOptions = useMemo(() => {
    const fromKelas = kelasList.filter(k => k.jenis === 'Sekolah').map(k => k.nama);
    const fromSantri = santriList.map(s => s.nama_sekolah).filter(Boolean) as string[];
    return [...new Set([...fromKelas, ...fromSantri])].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  }, [kelasList, santriList]);

  // Analytics KPI counts
  const analyticsStats = useMemo(() => {
    const total = santriList.length;
    const putra = santriList.filter(s => normalizeGender(s.jenis_kelamin) === 'L').length;
    const putri = santriList.filter(s => normalizeGender(s.jenis_kelamin) === 'P').length;
    const aktif = santriList.filter(s => s.status_tahun_ajaran === 'aktif' || !s.status_tahun_ajaran).length;
    return { total, putra, putri, aktif };
  }, [santriList]);

  const handleEditClick = (santri: SantriListItem) => {
    if (!canEdit) {
      alert('Data arsip hanya bisa dibaca. Pilih Tahun Ajaran Berjalan untuk edit.');
      return;
    }
    setEditingData(santri);
    setModalError('');
    setEditFormData({
      kelas_diniyah_id: santri.kelas_diniyah_id ? String(santri.kelas_diniyah_id) : '',
      kelas_sekolah_id: santri.kelas_sekolah_id ? String(santri.kelas_sekolah_id) : '',
      kamar_id: santri.kamar_id ? String(santri.kamar_id) : '',
      status_tahun_ajaran: santri.status_tahun_ajaran || 'aktif',
      catatan_tahun_ajaran: santri.catatan_tahun_ajaran || ''
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingData) return;
    setIsSubmitting(true);
    setModalError('');

    try {
      const submitData = {
        ...editingData,
        kelas_diniyah_id: editFormData.kelas_diniyah_id ? Number(editFormData.kelas_diniyah_id) : null,
        kelas_sekolah_id: editFormData.kelas_sekolah_id ? Number(editFormData.kelas_sekolah_id) : null,
        kamar_id: editFormData.kamar_id ? Number(editFormData.kamar_id) : null,
        status_tahun_ajaran: editFormData.status_tahun_ajaran,
        catatan_tahun_ajaran: editFormData.catatan_tahun_ajaran ? editFormData.catatan_tahun_ajaran.trim() : null,
        tahun_ajaran_id: selectedTahunAjaranId ? Number(selectedTahunAjaranId) : activeTahunAjaran?.id,
      };

      await santriService.updateSantri(editingData.id, submitData);
      setIsModalOpen(false);
      await loadSantriByTahunAjaran(selectedTahunAjaranId);
    } catch (err: any) {
      setModalError(err.message || 'Gagal memperbarui penempatan santri');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSemesterStatus = async (santriId: number, statusUpdates: Record<string, any>) => {
    if (!canEdit) {
      alert('Data arsip hanya bisa dibaca. Pilih Tahun Ajaran Berjalan untuk edit.');
      return;
    }

    try {
      setSantriList(prev => prev.map(s => s.id === santriId ? { ...s, ...statusUpdates } : s));
      const targetSantri = santriList.find(s => s.id === santriId);
      if (!targetSantri) return;

      const submitData = {
        ...targetSantri,
        ...statusUpdates,
        tahun_ajaran_id: selectedTahunAjaranId ? Number(selectedTahunAjaranId) : activeTahunAjaran?.id
      };

      await santriService.updateSantri(santriId, submitData);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status semester');
      await loadSantriByTahunAjaran(selectedTahunAjaranId);
    }
  };

  const handleTahunAjaranSelect = (id: any) => {
    setSelectedTahunAjaranId(String(id));
  };

  const handleMigrateClick = async () => {
    if (!activeTahunAjaran) {
      alert('Tahun ajaran berjalan belum tersedia');
      return;
    }
    setIsMigrationModalOpen(true);
  };

  const handleMigrationConfirm = async (excludedSantriIds: number[], promotions: any[] = []) => {
    if (!activeTahunAjaran) return;
    const nextKode = `${activeTahunAjaran.tahun_selesai}-${activeTahunAjaran.tahun_selesai + 1}`;

    setMigrationPayload({ nextKode, excludedSantriIds, promotions });
    setPasswordModalConfig({
      title: 'Konfirmasi Keamanan: Migrasi',
      message: `Apakah Anda yakin ingin melakukan Migrasi ke Tahun Ajaran ${nextKode}?`
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
      await santriService.migrateTahunAjaran(nextKode, excludedSantriIds, promotions);
      setIsMigrationModalOpen(false);
      await loadInitialData();
      setMigrationPayload(null);
    } catch (err: any) {
      alert(err.message || 'Gagal migrasi tahun ajaran');
    } finally {
      setIsMigrating(false);
      setIsPasswordModalOpen(false);
    }
  };

  const handleRollbackClick = async () => {
    if (!activeTahunAjaran) return;
    setPasswordModalConfig({
      title: 'Konfirmasi Keamanan: Rollback',
      message: `Apakah Anda yakin ingin membatalkan migrasi dan kembali ke tahun ajaran sebelumnya?`
    });
    setPasswordAction('rollback');
    setIsPasswordModalOpen(true);
  };

  const executeRollback = async () => {
    try {
      setIsMigrating(true);
      await santriService.rollbackMigration();
      await loadInitialData();
    } catch (err: any) {
      alert(err.message || 'Gagal rollback migrasi');
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

  const handleExportExcel = (type: 'semua' | 'ganjil' | 'genap') => {
    let sourceData = filteredSantri;
    if (type === 'ganjil') sourceData = filteredSantri.filter(s => s.aktif_ganjil);
    else if (type === 'genap') sourceData = filteredSantri.filter(s => s.aktif_genap);

    const yearLabel = selectedYear ? selectedYear.kode : 'Tahun-Ajaran';
    exportToExcel(sourceData, `Data-Santri-${yearLabel}-${type}`);
  };

  const handleExportPDF = (type: 'semua' | 'ganjil' | 'genap') => {
    let sourceData = filteredSantri;
    if (type === 'ganjil') sourceData = filteredSantri.filter(s => s.aktif_ganjil);
    else if (type === 'genap') sourceData = filteredSantri.filter(s => s.aktif_genap);

    const yearLabel = selectedYear ? selectedYear.kode : 'Tahun-Ajaran';
    exportToPDF(sourceData, `Data-Santri-${yearLabel}-${type}`);
  };

  if (loading && santriList.length === 0) {
    return <LoadingState message="Memuat data santri..." />;
  }

  if (error && santriList.length === 0) {
    return <ErrorState message={error} onRetry={loadInitialData} />;
  }

  return (
    <div className="santri-page">
      {/* TACTILE PAGE HEADER (NO ICONS IN TITLE, PURE TYPOGRAPHY) */}
      <div className="tactile-page-header">
        <div className="header-text-group">
          <h2 className="page-title">Data Santri</h2>
          <p className="page-subtitle">Kelola status akademik, penempatan kelas, dan kamar santri</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className={`action-pill-btn secondary-pill ${showAnalytics ? 'active' : ''}`}
            onClick={() => setShowAnalytics(!showAnalytics)}
            title="Tampilkan Analisis Data"
          >
            <BarChart2 size={16} />
            <span>{showAnalytics ? 'Tutup Analisis' : 'Analisis'}</span>
          </button>

          {/* Export Glass Dropdown */}
          <div className="export-dropdown-wrapper" ref={exportDropdownRef}>
            <button
              type="button"
              className="action-pill-btn secondary-pill"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            >
              <FileSpreadsheet size={16} />
              <span>Export Data</span>
              <ChevronDown size={14} />
            </button>

            {exportDropdownOpen && (
              <div className="export-glass-menu">
                <span className="menu-header-label">Spreadsheet (.xlsx)</span>
                <button
                  type="button"
                  className="menu-item-btn"
                  onClick={() => { handleExportExcel('semua'); setExportDropdownOpen(false); }}
                >
                  <FileSpreadsheet size={14} />
                  <span>Excel Semua Data</span>
                </button>
                <button
                  type="button"
                  className="menu-item-btn"
                  onClick={() => { handleExportExcel('ganjil'); setExportDropdownOpen(false); }}
                >
                  <FileSpreadsheet size={14} />
                  <span>Excel Sem. Ganjil</span>
                </button>
                <button
                  type="button"
                  className="menu-item-btn"
                  onClick={() => { handleExportExcel('genap'); setExportDropdownOpen(false); }}
                >
                  <FileSpreadsheet size={14} />
                  <span>Excel Sem. Genap</span>
                </button>

                <div className="menu-divider" />

                <span className="menu-header-label">Dokumen Cetak (.pdf)</span>
                <button
                  type="button"
                  className="menu-item-btn"
                  onClick={() => { handleExportPDF('semua'); setExportDropdownOpen(false); }}
                >
                  <FileText size={14} />
                  <span>PDF Semua Data</span>
                </button>
              </div>
            )}
          </div>

          {activeTahunAjaran && activeTahunAjaran.tahun_mulai > 2024 && (
            <button
              type="button"
              className="action-pill-btn danger-pill"
              onClick={handleRollbackClick}
              disabled={isMigrating}
              title="Batalkan migrasi tahun ajaran terakhir"
            >
              <Undo2 size={16} />
              <span>Rollback</span>
            </button>
          )}

          <button
            type="button"
            className="action-pill-btn primary-pill"
            onClick={handleMigrateClick}
            disabled={isMigrating}
            title="Lakukan migrasi ke tahun ajaran baru"
          >
            <RefreshCw size={16} />
            <span>Migrasi Tahun Ajaran</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Dashboard (Toggleable) */}
      {showAnalytics && (
        <div className="academic-stats-dashboard">
          <div className="stats-grid">
            <div className="summary-kpi-card accent-blue">
              <div className="kpi-card-inner">
                <div className="kpi-icon-wrap">
                  <Users size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Santri Terdata</span>
                  <span className="kpi-value">{analyticsStats.total}</span>
                  <span className="kpi-subtext">Tahun Ajaran {selectedYear?.kode || '-'}</span>
                </div>
              </div>
            </div>

            <div className="summary-kpi-card accent-green">
              <div className="kpi-card-inner">
                <div className="kpi-icon-wrap">
                  <Activity size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Santri Berstatus Aktif</span>
                  <span className="kpi-value">{analyticsStats.aktif}</span>
                  <span className="kpi-subtext">Aktif belajar pada periode ini</span>
                </div>
              </div>
            </div>

            <div className="summary-kpi-card accent-amber">
              <div className="kpi-card-inner">
                <div className="kpi-icon-wrap">
                  <Award size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Santri Putra (Banin)</span>
                  <span className="kpi-value">{analyticsStats.putra}</span>
                  <span className="kpi-subtext">{analyticsStats.total > 0 ? Math.round((analyticsStats.putra / analyticsStats.total) * 100) : 0}% dari total</span>
                </div>
              </div>
            </div>

            <div className="summary-kpi-card accent-purple">
              <div className="kpi-card-inner">
                <div className="kpi-icon-wrap">
                  <Award size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Santri Putri (Banat)</span>
                  <span className="kpi-value">{analyticsStats.putri}</span>
                  <span className="kpi-subtext">{analyticsStats.total > 0 ? Math.round((analyticsStats.putri / analyticsStats.total) * 100) : 0}% dari total</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tahun Ajaran Selector Board */}
      <TahunAjaranBoard
        tahunAjaranList={tahunAjaranList}
        activeTahunAjaran={activeTahunAjaran}
        selectedId={selectedTahunAjaranId}
        selectedTahunAjaranId={selectedTahunAjaranId}
        onSelect={handleTahunAjaranSelect}
        onSelectTahunAjaran={handleTahunAjaranSelect}
      />

      {/* Main Filter Panel */}
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

      {/* Main Table */}
      <div className="santri-content">
        <SantriTable
          data={filteredSantri}
          onEdit={handleEditClick}
          canEdit={canEdit}
          onUpdateSemesterStatus={handleUpdateSemesterStatus}
        />
      </div>

      {/* Custom Modal Edit Penempatan */}
      <CustomModal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setModalError(''); }}
        title={`Ubah Penempatan Santri: ${editingData?.nama || ''}`}
        subtitle="Atur ulang kelas Diniyah, Sekolah, Kamar, atau Status santri"
        icon={<Users />}
        width={560}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="action-pill-btn secondary-pill" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Batal
            </button>
            <button type="button" className="action-pill-btn primary-pill" onClick={handleModalSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Simpan Perubahan'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {modalError && <SmartAlert message={modalError} type="error" />}

          <CustomSelect
            label="Kelas Kurikulum Diniyah"
            value={editFormData.kelas_diniyah_id}
            onChange={(val) => setEditFormData(prev => ({ ...prev, kelas_diniyah_id: val }))}
            options={[
              { label: 'Pilih Kelas (Kosong)', value: '' },
              ...kelasList.filter(k => k.jenis === 'Diniyah').map(k => ({ label: k.nama, value: String(k.id) }))
            ]}
            disabled={isSubmitting}
          />

          <CustomSelect
            label="Kelas Kurikulum Sekolah"
            value={editFormData.kelas_sekolah_id}
            onChange={(val) => setEditFormData(prev => ({ ...prev, kelas_sekolah_id: val }))}
            options={[
              { label: 'Pilih Kelas (Kosong)', value: '' },
              ...kelasList.filter(k => k.jenis === 'Sekolah').map(k => ({ label: k.nama, value: String(k.id) }))
            ]}
            disabled={isSubmitting}
          />

          <CustomSelect
            label="Kamar Asrama Santri"
            value={editFormData.kamar_id}
            onChange={(val) => setEditFormData(prev => ({ ...prev, kamar_id: val }))}
            options={[
              { label: 'Pilih Kamar (Kosong)', value: '' },
              ...kamarList.map(k => ({ label: `${k.nama} (${k.jenis})`, value: String(k.id) }))
            ]}
            disabled={isSubmitting}
          />

          <CustomSelect
            label="Status Akademik Periode"
            value={editFormData.status_tahun_ajaran}
            onChange={(val) => setEditFormData(prev => ({ ...prev, status_tahun_ajaran: val }))}
            options={[
              { label: 'Aktif', value: 'aktif' },
              { label: 'Pindah / Migrasi', value: 'pindah' }
            ]}
            disabled={isSubmitting}
          />

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
              Catatan Riwayat Akademik
            </label>
            <textarea
              className="custom-native-textarea"
              rows={3}
              value={editFormData.catatan_tahun_ajaran}
              onChange={(e) => setEditFormData(prev => ({ ...prev, catatan_tahun_ajaran: e.target.value }))}
              placeholder="Catatan tambahan penempatan santri..."
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(203, 213, 225, 0.7)',
                fontSize: '13px',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#0f172a',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </form>
      </CustomModal>

      <MigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onSubmit={({ excludedIds, customTargetClasses }: any) => handleMigrationConfirm(excludedIds, customTargetClasses)}
        santriList={santriList.filter(s => s.aktif_genap)}
        sourceYear={activeTahunAjaran}
        targetYear={nextYearKode}
        isSubmitting={isMigrating}
        targetClasses={kelasList}
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

export default Santri;

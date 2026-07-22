import { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, Users, Award, Home, Activity, CheckCircle, HelpCircle, RefreshCw, Undo2, FileSpreadsheet, FileText, ChevronDown, BarChart2, TrendingUp, Info } from 'lucide-react';
import { santriService } from '../services/santriService';
import { SantriTable } from '../components/features/SantriTable';
import { SantriFilters } from '../components/features/SantriFilters';
import { MigrationModal } from '../components/features/MigrationModal';
import { TahunAjaranBoard } from '../components/features/TahunAjaranBoard';
import { PageHeader, LoadingState, ErrorState, PasswordConfirmModal } from '../components/common';
import { CustomModal } from '../components/ui/CustomModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SmartAlert } from '../components/ui/SmartAlert';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import './Santri.scss';

export function Santri() {
  const [santriList, setSantriList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [kamarList, setKamarList] = useState([]);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState(null);
  const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterDiniyah, setFilterDiniyah] = useState('');
  const [filterSekolah, setFilterSekolah] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    kelas_diniyah_id: '',
    kelas_sekolah_id: '',
    kamar_id: '',
    status_tahun_ajaran: 'aktif',
    catatan_tahun_ajaran: ''
  });
  const [modalError, setModalError] = useState('');

  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationPayload, setMigrationPayload] = useState(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState(null);
  const [passwordModalConfig, setPasswordModalConfig] = useState({ title: '', message: '' });

  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTahunAjaranId) {
      loadSantriByTahunAjaran(selectedTahunAjaranId);
    }
  }, [selectedTahunAjaranId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
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
      setTahunAjaranList(tahunList);
      setKelasList(kelasData);
      setKamarList(kamarData);

      const initialYearId = activeYear ? String(activeYear.id) : (tahunList[0] ? String(tahunList[0].id) : '');
      setSelectedTahunAjaranId(initialYearId);

      if (initialYearId) {
        const santriData = await santriService.fetchSantriByTahunAjaran(initialYearId);
        setSantriList(santriData);
      }
    } catch (err) {
      console.error('Gagal memuat data santri:', err);
      setError(err.message || 'Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  const loadSantriByTahunAjaran = async (tahunAjaranId) => {
    try {
      setLoading(true);
      const data = await santriService.fetchSantriByTahunAjaran(tahunAjaranId);
      setSantriList(data);
    } catch (err) {
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

  const yearStatus = useMemo(() => {
    if (!selectedTahunAjaranId || !activeTahunAjaran || tahunAjaranList.length === 0) return 'active';
    const selected = tahunAjaranList.find(t => Number(t.id) === Number(selectedTahunAjaranId));
    if (!selected) return 'active';

    if (Number(selected.id) === Number(activeTahunAjaran.id)) return 'active';
    if (selected.tahun_mulai > activeTahunAjaran.tahun_mulai) return 'coming';
    return 'archived';
  }, [selectedTahunAjaranId, activeTahunAjaran, tahunAjaranList]);

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
        (!filterGender || santri.jenis_kelamin === filterGender) &&
        (!filterStatus || santri.status_tahun_ajaran === filterStatus)
      );
    });
  }, [santriList, searchKeyword, filterDiniyah, filterSekolah, filterGender, filterStatus]);

  const diniyahOptions = useMemo(() => {
    const fromKelas = kelasList.filter(k => k.jenis === 'Diniyah').map(k => k.nama);
    const fromSantri = santriList.map(s => s.nama_diniyah).filter(Boolean);
    return [...new Set([...fromKelas, ...fromSantri])].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  }, [kelasList, santriList]);

  const sekolahOptions = useMemo(() => {
    const fromKelas = kelasList.filter(k => k.jenis === 'Sekolah').map(k => k.nama);
    const fromSantri = santriList.map(s => s.nama_sekolah).filter(Boolean);
    return [...new Set([...fromKelas, ...fromSantri])].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  }, [kelasList, santriList]);

  const handleEditClick = (santri) => {
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

  const handleModalSubmit = async (e) => {
    if (e) e.preventDefault();
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
    } catch (err) {
      setModalError(err.message || 'Gagal memperbarui penempatan santri');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSemesterStatus = async (santriId, statusUpdates) => {
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
    } catch (err) {
      alert(err.message || 'Gagal memperbarui status semester');
      await loadSantriByTahunAjaran(selectedTahunAjaranId);
    }
  };

  const handleTahunAjaranSelect = (id) => {
    setSelectedTahunAjaranId(String(id));
  };

  const handleMigrateClick = async () => {
    if (!activeTahunAjaran) {
      alert('Tahun ajaran berjalan belum tersedia');
      return;
    }
    setIsMigrationModalOpen(true);
  };

  const handleMigrationConfirm = async (excludedSantriIds, promotions = []) => {
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
    } catch (err) {
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
    } catch (err) {
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

  const handleExportExcel = (type) => {
    let sourceData = filteredSantri;
    if (type === 'ganjil') sourceData = filteredSantri.filter(s => s.aktif_ganjil);
    else if (type === 'genap') sourceData = filteredSantri.filter(s => s.aktif_genap);

    const yearLabel = selectedYear ? selectedYear.kode : 'Tahun-Ajaran';
    exportToExcel(sourceData, `Data-Santri-${yearLabel}-${type}`);
  };

  const handleExportPDF = (type) => {
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
      <PageHeader
        title="👥 Manajemen Data Santri"
        subtitle="Kelola status akademik, penempatan kelas, dan kamar santri"
        extra={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className={`btn-custom ${showAnalytics ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <BarChart2 size={16} /> Analisis
            </button>

            <div style={{ position: 'relative' }} ref={exportDropdownRef}>
              <button
                type="button"
                className="btn-custom btn-secondary"
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileSpreadsheet size={16} /> Export Data <ChevronDown size={14} />
              </button>

              {exportDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '6px',
                  width: '200px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', padding: '4px 8px' }}>EXCEL (.xlsx)</div>
                  <button type="button" className="btn-custom btn-secondary w-full" onClick={() => { handleExportExcel('semua'); setExportDropdownOpen(false); }}>
                    <FileSpreadsheet size={14} /> Excel Semua
                  </button>
                  <button type="button" className="btn-custom btn-secondary w-full" onClick={() => { handleExportExcel('ganjil'); setExportDropdownOpen(false); }}>
                    <FileSpreadsheet size={14} /> Excel Sem. Ganjil
                  </button>
                  <button type="button" className="btn-custom btn-secondary w-full" onClick={() => { handleExportExcel('genap'); setExportDropdownOpen(false); }}>
                    <FileSpreadsheet size={14} /> Excel Sem. Genap
                  </button>
                  <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', padding: '4px 8px' }}>PDF Document</div>
                  <button type="button" className="btn-custom btn-secondary w-full" onClick={() => { handleExportPDF('semua'); setExportDropdownOpen(false); }}>
                    <FileText size={14} /> PDF Semua
                  </button>
                </div>
              )}
            </div>

            {activeTahunAjaran && activeTahunAjaran.tahun_mulai > 2024 && (
              <button
                type="button"
                className="btn-custom btn-secondary"
                onClick={handleRollbackClick}
                disabled={isMigrating}
                style={{ color: '#ef4444' }}
              >
                <Undo2 size={16} /> Rollback
              </button>
            )}

            <button
              type="button"
              className="btn-custom btn-primary"
              onClick={handleMigrateClick}
              disabled={isMigrating}
            >
              <RefreshCw size={16} /> Migrasi Tahun Ajaran
            </button>
          </div>
        }
      />

      {/* Tahun Ajaran Selector Board */}
      <TahunAjaranBoard
        tahunAjaranList={tahunAjaranList}
        activeTahunAjaran={activeTahunAjaran}
        selectedTahunAjaranId={selectedTahunAjaranId}
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
      <div className="santri-content" style={{ marginTop: '16px' }}>
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
            <button type="button" className="btn-custom btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Batal
            </button>
            <button type="button" className="btn-custom btn-primary" onClick={handleModalSubmit} disabled={isSubmitting}>
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
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--lt-text-secondary, #475569)' }}>
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
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--lt-border-light, #cbd5e1)',
                fontSize: '13px',
                background: 'var(--lt-bg-surface, #ffffff)',
                color: 'var(--lt-text-primary, #0f172a)'
              }}
            />
          </div>
        </form>
      </CustomModal>

      <MigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onSubmit={({ excludedIds, customTargetClasses }) => handleMigrationConfirm(excludedIds, customTargetClasses)}
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

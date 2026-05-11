import { useState, useEffect, useMemo } from 'react';
import { Button, Space, Alert, message as antMessage } from 'antd';
import { PlusOutlined, SwapOutlined, RollbackOutlined } from '@ant-design/icons';
import { santriService } from '../services/santriService';
import { SantriTable } from '../components/features/SantriTable';
import { SantriFilters } from '../components/features/SantriFilters';
import { SantriModal } from '../components/features/SantriModal';
import { MigrationModal } from '../components/features/MigrationModal';
import { ImportSantriModal } from '../components/features/ImportSantriModal';
import { TahunAjaranBoard } from '../components/features/TahunAjaranBoard';
import { PageHeader, LoadingState, ErrorState, PasswordConfirmModal } from '../components/common';
import { usePagination } from '../hooks/usePagination';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { FileExcelOutlined, FilePdfOutlined, UploadOutlined } from '@ant-design/icons';
import './Santri.scss';

const PAGE_SIZE = 30;

export function Santri() {
  // State
  const [santriList, setSantriList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [kamarList, setKamarList] = useState([]);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState(null);
  const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState('');

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

  // Migration Modal
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationPayload, setMigrationPayload] = useState(null);

  // Password Confirmation Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState(null); // 'rollback' | 'migration'
  const [passwordModalConfig, setPasswordModalConfig] = useState({ title: '', message: '' });

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Messages
  const [modalError, setModalError] = useState('');

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load santri when tahun ajaran changes
  useEffect(() => {
    if (tahunAjaranList.length > 0) {
      loadSantri();
    }
  }, [selectedTahunAjaranId]);

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
      setSelectedTahunAjaranId(active ? String(active.id) : '');

    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError(err.message || 'Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  const loadSantri = async () => {
    try {
      const yearId = selectedTahunAjaranId || (activeTahunAjaran ? activeTahunAjaran.id : null);
      const isActiveYear = isSelectedYearActive();

      // Fetch santri and alumni
      const [santriData, alumniData] = await Promise.all([
        santriService.fetchSantri(yearId),
        santriService.fetchAlumni()
      ]);

      // Filter out alumni from santri list if viewing active year
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

  // Filter santri
  const filteredSantri = useMemo(() => {
    return santriList.filter(santri => {
      const keyword = searchKeyword.toLowerCase();
      const searchable = [
        santri.nis,
        santri.nik,
        santri.nama,
        santri.nama_ayah,
        santri.nama_ibu,
        santri.nama_diniyah,
        santri.nama_sekolah
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

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    reset: resetPagination
  } = usePagination(filteredSantri, PAGE_SIZE);

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination();
  }, [searchKeyword, filterDiniyah, filterSekolah, filterGender, filterStatus]);

  // Get unique filter options
  const diniyahOptions = useMemo(() => {
    return [...new Set(santriList.map(s => s.nama_diniyah).filter(Boolean))];
  }, [santriList]);

  const sekolahOptions = useMemo(() => {
    return [...new Set(santriList.map(s => s.nama_sekolah).filter(Boolean))];
  }, [santriList]);

  const handleAddClick = () => {
    if (!canAdd) {
      antMessage.warning('Tidak bisa menambah santri ke tahun ajaran yang belum dimulai (Coming Soon).');
      return;
    }
    setEditingData(null);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (santri) => {
    if (!canEdit) {
      antMessage.warning('Data arsip hanya bisa dibaca. Pilih Tahun Ajaran Berjalan untuk edit santri.');
      return;
    }
    setEditingData(santri);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (!canEdit) {
      antMessage.warning('Data arsip hanya bisa dibaca.');
      return;
    }

    if (!confirm('Hapus data santri ini?')) return;

    try {
      await santriService.deleteSantri(id);
      antMessage.success('Data santri berhasil dihapus');
      await loadSantri();
    } catch (err) {
      antMessage.error(err.message || 'Gagal menghapus santri');
    }
  };

  const handleModalSubmit = async (data) => {
    setIsSubmitting(true);
    setModalError('');

    try {
      // Determine which tahun_ajaran_id to use
      const targetTahunAjaranId = selectedTahunAjaranId
        ? Number(selectedTahunAjaranId)
        : (activeTahunAjaran ? activeTahunAjaran.id : null);

      if (!targetTahunAjaranId) {
        throw new Error('Tahun ajaran tidak ditemukan');
      }

      // Get selected year info for logging
      const selectedYear = selectedTahunAjaranId
        ? tahunAjaranList.find(ta => Number(ta.id) === Number(selectedTahunAjaranId))
        : activeTahunAjaran;

      // Add tahun_ajaran_id to data
      const submitData = {
        ...data,
        tahun_ajaran_id: targetTahunAjaranId
      };

      console.log('🔍 DEBUG - handleModalSubmit:', {
        selectedTahunAjaranId,
        selectedTahunAjaranId_type: typeof selectedTahunAjaranId,
        activeTahunAjaran,
        targetTahunAjaranId,
        targetTahunAjaranId_type: typeof targetTahunAjaranId,
        selectedYear: selectedYear,
        submitData_tahun_ajaran_id: submitData.tahun_ajaran_id
      });

      console.log('📤 Submitting santri data:', submitData);

      if (editingData) {
        await santriService.updateSantri(editingData.id, submitData);
        antMessage.success('Data santri berhasil diperbarui');
      } else {
        await santriService.createSantri(submitData);
        antMessage.success(`Data santri berhasil disimpan ke tahun ajaran ${selectedYear?.kode || 'berjalan'}`);
      }

      setIsModalOpen(false);
      await loadSantri();
    } catch (err) {
      console.error('❌ Error submitting santri:', err);
      setModalError(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTahunAjaranSelect = (id) => {
    setSelectedTahunAjaranId(String(id));
    resetPagination();
  };

  const handleMigrateClick = async () => {
    if (!activeTahunAjaran) {
      antMessage.error('Tahun ajaran berjalan belum tersedia');
      return;
    }

    // Open migration modal
    setIsMigrationModalOpen(true);
  };

  const handleMigrationConfirm = async (excludedSantriIds) => {
    if (!activeTahunAjaran) {
      antMessage.error('Tahun ajaran berjalan belum tersedia');
      return;
    }

    const nextKode = `${activeTahunAjaran.tahun_selesai}-${activeTahunAjaran.tahun_selesai + 1}`;

    setMigrationPayload({ nextKode, excludedSantriIds });
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
    const { nextKode, excludedSantriIds } = migrationPayload;
    
    try {
      setIsMigrating(true);
      const result = await santriService.migrateTahunAjaran(nextKode, excludedSantriIds);

      // Enhanced success message with detailed statistics
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

      antMessage.success(successMessage.join('\n'), 8); // Show for 8 seconds

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

    // Enhanced rollback confirmation with alumni warning
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

      // Enhanced success message with detailed statistics
      const successMessage = [
        `${result.message}`,
        `🗑️ ${result.deletedCount || 0} data santri dihapus`,
        `🔄 ${result.restoredCount || 0} status dikembalikan`,
        `🎓 ${result.alumni_deleted || 0} record alumni dihapus`,
      ];

      antMessage.success(successMessage.join('\n'), 8); // Show for 8 seconds

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

    return `Data Santri Tahun Ajaran ${selectedYear.kode}${statusLabel}`;
  };

  const handleExportExcel = () => {
    const dataToExport = filteredSantri.map(s => ({
      'NIS': s.nis,
      'NIK': s.nik,
      'Nama': s.nama,
      'Jenis Kelamin': s.jenis_kelamin,
      'Kelas Diniyah': s.nama_diniyah,
      'Kelas Sekolah': s.nama_sekolah,
      'Kamar': s.nama_kamar,
      'Status': s.status_tahun_ajaran,
      'Tempat Lahir': s.tempat_lahir,
      'Tanggal Lahir': s.tanggal_lahir,
      'Nama Ayah': s.nama_ayah,
      'Nama Ibu': s.nama_ibu,
      'Alamat': s.alamat
    }));
    exportToExcel(dataToExport, `Data_Santri_${selectedYear?.kode || 'Export'}.xlsx`);
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
    <div className="santri-page">
      <PageHeader
        title="Manajemen Data Santri"
        subtitle={yearLabel}
        extra={
          <Space>
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleExportExcel}
              disabled={filteredSantri.length === 0}
            >
              Ekspor Excel
            </Button>
            <Button
              icon={<FilePdfOutlined />}
              onClick={handleExportPDF}
              disabled={filteredSantri.length === 0}
            >
              Ekspor PDF
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setIsImportModalOpen(true)}
              disabled={!canAdd}
            >
              Impor Excel
            </Button>
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
            >
              Migrasi
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddClick}
              disabled={!canAdd}
            >
              Tambah Santri
            </Button>
          </Space>
        }
      />

      <TahunAjaranBoard
        tahunAjaranList={tahunAjaranList}
        selectedId={selectedTahunAjaranId}
        onSelect={handleTahunAjaranSelect}
      />

      <div className="santri-content">
        {yearStatus === 'archive' && (
          <Alert
            message="Mode Arsip"
            description="Anda sedang melihat data arsip. Data yang ditambahkan akan masuk ke tahun ajaran ini. Edit dan hapus tidak tersedia untuk data arsip."
            type="info"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}
        {yearStatus === 'coming' && (
          <Alert
            message="Tahun Ajaran Coming Soon"
            description="Tahun ajaran ini belum dimulai. Anda hanya bisa melihat data. Untuk menambah santri, lakukan migrasi dari tahun ajaran berjalan."
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
          data={paginatedItems}
          total={filteredSantri.length}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          onPageChange={goToPage}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          canEdit={canEdit}
          onUpdateSemesterStatus={handleUpdateSemesterStatus}
        />
      </div>

      <SantriModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editData={editingData}
        kelasList={kelasList}
        kamarList={kamarList}
        isSubmitting={isSubmitting}
        error={modalError}
      />

      <MigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onConfirm={handleMigrationConfirm}
        santriList={santriList}
        sourceYear={activeTahunAjaran}
        targetYear={nextYearKode}
        isSubmitting={isMigrating}
      />

      <PasswordConfirmModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onConfirm={handlePasswordConfirm}
        title={passwordModalConfig.title}
        message={passwordModalConfig.message}
        actionType={passwordAction}
      />

      <ImportSantriModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadSantri}
        tahunAjaranId={selectedTahunAjaranId || (activeTahunAjaran ? activeTahunAjaran.id : null)}
        tahunAjaranKode={selectedYear?.kode}
      />
    </div>
  );
}

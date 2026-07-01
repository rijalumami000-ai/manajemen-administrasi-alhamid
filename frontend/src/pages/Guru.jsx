import { useState, useEffect, useMemo } from 'react';
import { Plus, User, BookOpen, Briefcase, Award, AlertTriangle } from 'lucide-react';
import { guruService } from '../services/guruService';
import { GuruTable } from '../components/features/GuruTable';
import { GuruFilters } from '../components/features/GuruFilters';
import { GuruModal } from '../components/features/GuruModal';
import { MasterList } from '../components/features/MasterList';
import { MasterModal } from '../components/features/MasterModal';
import { GuruTtdModal } from '../components/features/GuruTtdModal';
import { GuruFotoModal } from '../components/features/GuruFotoModal';
import { PageHeader, LoadingState, ErrorState, useToast } from '../components/common';
import { CustomModal } from '../components/ui/CustomModal';
import { usePagination } from '../hooks/usePagination';
import './Guru.scss';

const PAGE_SIZE = 10;

export function Guru() {
  const toast = useToast();

  // State
  const [guruList, setGuruList] = useState([]);
  const [mataPelajaranList, setMataPelajaranList] = useState([]);
  const [jabatanList, setJabatanList] = useState([]);

  // Active tab
  const [activeTab, setActiveTab] = useState('guru');

  // Filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterJabatan, setFilterJabatan] = useState('');
  const [filterMapel, setFilterMapel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [isGuruModalOpen, setIsGuruModalOpen] = useState(false);
  const [isMapelModalOpen, setIsMapelModalOpen] = useState(false);
  const [isJabatanModalOpen, setIsJabatanModalOpen] = useState(false);
  const [isTtdModalOpen, setIsTtdModalOpen] = useState(false);
  const [isFotoModalOpen, setIsFotoModalOpen] = useState(false);

  const [editingGuru, setEditingGuru] = useState(null);
  const [activeTtdGuru, setActiveTtdGuru] = useState(null);
  const [activeFotoGuru, setActiveFotoGuru] = useState(null);
  const [editingMapel, setEditingMapel] = useState(null);
  const [editingJabatan, setEditingJabatan] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Messages
  const [guruModalError, setGuruModalError] = useState('');
  const [mapelModalError, setMapelModalError] = useState('');
  const [jabatanModalError, setJabatanModalError] = useState('');

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Custom Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: '', // 'guru', 'mapel', 'jabatan'
    id: null,
    nama: ''
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        loadGuru(),
        loadMasterData()
      ]);
    } catch (err) {
      console.error('Gagal memuat data awal:', err);
      setError(err.message || 'Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  const loadGuru = async () => {
    try {
      const data = await guruService.fetchGuru();
      setGuruList(data);
    } catch (err) {
      console.error('Gagal memuat data guru:', err);
      throw err;
    }
  };

  const loadMasterData = async () => {
    try {
      const [mapelData, jabatanData] = await Promise.all([
        guruService.fetchMataPelajaran(),
        guruService.fetchJabatan()
      ]);
      setMataPelajaranList(mapelData);
      setJabatanList(jabatanData);
    } catch (err) {
      console.error('Gagal memuat data master:', err);
    }
  };

  // Filter guru
  const filteredGuru = useMemo(() => {
    return guruList.filter(guru => {
      const keyword = searchKeyword.toLowerCase();
      const searchable = [
        guru.nip,
        guru.nama,
        guru.mata_pelajaran,
        guru.jabatan,
        guru.no_hp,
        guru.alamat,
        guru.status
      ].join(' ').toLowerCase();

      return (
        (!keyword || searchable.includes(keyword)) &&
        (!filterJabatan || guru.jabatan === filterJabatan) &&
        (!filterMapel || guru.mata_pelajaran === filterMapel) &&
        (!filterStatus || guru.status === filterStatus)
      );
    });
  }, [guruList, searchKeyword, filterJabatan, filterMapel, filterStatus]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    reset: resetPagination
  } = usePagination(filteredGuru, PAGE_SIZE);

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination();
  }, [searchKeyword, filterJabatan, filterMapel, filterStatus]);

  // Get unique filter options
  const jabatanOptions = useMemo(() => {
    return [...new Set(guruList.map(g => g.jabatan).filter(Boolean))];
  }, [guruList]);

  const mapelOptions = useMemo(() => {
    return [...new Set(guruList.map(g => g.mata_pelajaran).filter(Boolean))];
  }, [guruList]);

  const statusOptions = useMemo(() => {
    return [...new Set(guruList.map(g => g.status).filter(Boolean))];
  }, [guruList]);

  // Guru handlers
  const handleAddGuruClick = () => {
    setEditingGuru(null);
    setGuruModalError('');
    setIsGuruModalOpen(true);
  };

  const handleEditGuruClick = (guru) => {
    setEditingGuru(guru);
    setGuruModalError('');
    setIsGuruModalOpen(true);
  };

  const handleUploadTtdClick = (guru) => {
    setActiveTtdGuru(guru);
    setIsTtdModalOpen(true);
  };

  const handleUploadFotoClick = (guru) => {
    setActiveFotoGuru(guru);
    setIsFotoModalOpen(true);
  };

  const handleDeleteGuruClick = (id, nama) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'guru',
      id,
      nama
    });
  };

  const handleGuruSubmit = async (data) => {
    setIsSubmitting(true);
    setGuruModalError('');

    try {
      if (editingGuru) {
        await guruService.updateGuru(editingGuru.id, data);
        toast.success('Data guru berhasil diperbarui');
      } else {
        await guruService.createGuru(data);
        toast.success('Data guru berhasil disimpan');
      }

      setIsGuruModalOpen(false);
      await loadGuru();
    } catch (err) {
      setGuruModalError(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mata Pelajaran handlers
  const handleAddMapelClick = () => {
    setEditingMapel(null);
    setMapelModalError('');
    setIsMapelModalOpen(true);
  };

  const handleEditMapelClick = (mapel) => {
    setEditingMapel(mapel);
    setMapelModalError('');
    setIsMapelModalOpen(true);
  };

  const handleDeleteMapelClick = (id, nama) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'mapel',
      id,
      nama
    });
  };

  const handleMapelSubmit = async (data) => {
    setIsSubmitting(true);
    setMapelModalError('');

    try {
      if (editingMapel) {
        await guruService.updateMataPelajaran(editingMapel.id, data);
        toast.success('Mata pelajaran berhasil diperbarui');
      } else {
        await guruService.createMataPelajaran(data);
        toast.success('Mata pelajaran berhasil disimpan');
      }

      setIsMapelModalOpen(false);
      await loadMasterData();
      await loadGuru();
    } catch (err) {
      setMapelModalError(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Jabatan handlers
  const handleAddJabatanClick = () => {
    setEditingJabatan(null);
    setJabatanModalError('');
    setIsJabatanModalOpen(true);
  };

  const handleEditJabatanClick = (jabatan) => {
    setEditingJabatan(jabatan);
    setJabatanModalError('');
    setIsJabatanModalOpen(true);
  };

  const handleDeleteJabatanClick = (id, nama) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'jabatan',
      id,
      nama
    });
  };

  const handleJabatanSubmit = async (data) => {
    setIsSubmitting(true);
    setJabatanModalError('');

    try {
      if (editingJabatan) {
        await guruService.updateJabatan(editingJabatan.id, data);
        toast.success('Jabatan berhasil diperbarui');
      } else {
        await guruService.createJabatan(data);
        toast.success('Jabatan berhasil disimpan');
      }

      setIsJabatanModalOpen(false);
      await loadMasterData();
      await loadGuru();
    } catch (err) {
      setJabatanModalError(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Global Delete Executer
  const handleConfirmDelete = async () => {
    const { type, id } = deleteConfirm;
    if (!id) return;

    try {
      if (type === 'guru') {
        await guruService.deleteGuru(id);
        toast.success('Data guru berhasil dihapus');
        await loadGuru();
      } else if (type === 'mapel') {
        await guruService.deleteMataPelajaran(id);
        toast.success('Mata pelajaran berhasil dihapus');
        await loadMasterData();
        await loadGuru();
      } else if (type === 'jabatan') {
        await guruService.deleteJabatan(id);
        toast.success('Jabatan berhasil dihapus');
        await loadMasterData();
        await loadGuru();
      }
      setDeleteConfirm({ isOpen: false, type: '', id: null, nama: '' });
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus data');
    }
  };

  if (loading) {
    return <LoadingState message="Memuat data guru..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadInitialData}
      />
    );
  }

  const getTabButton = () => {
    switch (activeTab) {
      case 'guru':
        return (
          <button
            type="button"
            className="btn-custom btn-primary"
            onClick={handleAddGuruClick}
          >
            <Plus size={18} />
            <span>Tambah Guru</span>
          </button>
        );
      case 'mata-pelajaran':
        return (
          <button
            type="button"
            className="btn-custom btn-primary"
            onClick={handleAddMapelClick}
          >
            <Plus size={18} />
            <span>Tambah Mata Pelajaran</span>
          </button>
        );
      case 'jabatan':
        return (
          <button
            type="button"
            className="btn-custom btn-primary"
            onClick={handleAddJabatanClick}
          >
            <Plus size={18} />
            <span>Tambah Jabatan</span>
          </button>
        );
      default:
        return null;
    }
  };

  const getDeleteConfirmDetails = () => {
    switch (deleteConfirm.type) {
      case 'guru':
        return {
          title: 'Hapus Guru',
          text: `Apakah Anda yakin ingin menghapus data guru ${deleteConfirm.nama}? Semua data jadwal mengajar dan profil terkait akan ikut terhapus.`
        };
      case 'mapel':
        return {
          title: 'Hapus Mata Pelajaran',
          text: `Apakah Anda yakin ingin menghapus mata pelajaran ${deleteConfirm.nama}? Tindakan ini dapat mempengaruhi data penugasan kelas/rapor.`
        };
      case 'jabatan':
        return {
          title: 'Hapus Jabatan',
          text: `Apakah Anda yakin ingin menghapus jabatan ${deleteConfirm.nama}? Tindakan ini dapat mempengaruhi data organisasi sekolah.`
        };
      default:
        return { title: 'Hapus Data', text: 'Apakah Anda yakin ingin menghapus data ini?' };
    }
  };

  const deleteDetails = getDeleteConfirmDetails();

  return (
    <div className="guru-page">
      <PageHeader
        title="📚 Manajemen Data Guru"
        subtitle="Kelola data ustadz/ustadzah, mata pelajaran, dan jabatan struktural"
        extra={getTabButton()}
      />

      <div className="guru-content">
        {/* Custom Tabs Navigation */}
        <div className="custom-tabs-container">
          <div className="custom-tabs-nav">
            <button 
              type="button"
              className={`custom-tabs-tab ${activeTab === 'guru' ? 'active' : ''}`}
              onClick={() => setActiveTab('guru')}
            >
              <User size={16} />
              <span>Data Guru</span>
              <span className="tab-badge">{guruList.length}</span>
            </button>
            <button 
              type="button"
              className={`custom-tabs-tab ${activeTab === 'mata-pelajaran' ? 'active' : ''}`}
              onClick={() => setActiveTab('mata-pelajaran')}
            >
              <BookOpen size={16} />
              <span>Mata Pelajaran</span>
              <span className="tab-badge">{mataPelajaranList.length}</span>
            </button>
            <button 
              type="button"
              className={`custom-tabs-tab ${activeTab === 'jabatan' ? 'active' : ''}`}
              onClick={() => setActiveTab('jabatan')}
            >
              <Briefcase size={16} />
              <span>Jabatan</span>
              <span className="tab-badge">{jabatanList.length}</span>
            </button>
          </div>

          <div className="custom-tabs-content" style={{ marginTop: '20px' }}>
            {activeTab === 'guru' && (
              <div className="guru-tab-content">
                <GuruFilters
                  searchValue={searchKeyword}
                  onSearchChange={setSearchKeyword}
                  jabatanValue={filterJabatan}
                  onJabatanChange={setFilterJabatan}
                  mapelValue={filterMapel}
                  onMapelChange={setFilterMapel}
                  statusValue={filterStatus}
                  onStatusChange={setFilterStatus}
                  jabatanOptions={jabatanOptions}
                  mapelOptions={mapelOptions}
                  statusOptions={statusOptions}
                />

                <GuruTable
                  data={paginatedItems}
                  total={filteredGuru.length}
                  currentPage={currentPage}
                  pageSize={PAGE_SIZE}
                  onPageChange={goToPage}
                  onEdit={handleEditGuruClick}
                  onDelete={handleDeleteGuruClick}
                  onUploadTtd={handleUploadTtdClick}
                  onUploadFoto={handleUploadFotoClick}
                />
              </div>
            )}

            {activeTab === 'mata-pelajaran' && (
              <div className="guru-tab-content animate-fade-in">
                <p className="tab-description">
                  Daftar mata pelajaran yang tersedia untuk ditugaskan ke ustadz/ustadzah.
                </p>
                <MasterList
                  items={mataPelajaranList}
                  emptyLabel="Tambahkan mata pelajaran pertama dari tombol di atas."
                  onEdit={handleEditMapelClick}
                  onDelete={handleDeleteMapelClick}
                  type="mapel"
                />
              </div>
            )}

            {activeTab === 'jabatan' && (
              <div className="guru-tab-content animate-fade-in">
                <p className="tab-description">
                  Daftar jabatan struktural yang tersedia untuk ditugaskan ke ustadz/ustadzah.
                </p>
                <MasterList
                  items={jabatanList}
                  emptyLabel="Tambahkan jabatan pertama dari tombol di atas."
                  onEdit={handleEditJabatanClick}
                  onDelete={handleDeleteJabatanClick}
                  type="jabatan"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <GuruModal
        isOpen={isGuruModalOpen}
        onClose={() => setIsGuruModalOpen(false)}
        onSubmit={handleGuruSubmit}
        editData={editingGuru}
        mataPelajaranList={mataPelajaranList}
        jabatanList={jabatanList}
        isSubmitting={isSubmitting}
        error={guruModalError}
      />

      <MasterModal
        isOpen={isMapelModalOpen}
        onClose={() => setIsMapelModalOpen(false)}
        onSubmit={handleMapelSubmit}
        editData={editingMapel}
        title="Mata Pelajaran"
        placeholder="Contoh: Fiqih"
        isSubmitting={isSubmitting}
        error={mapelModalError}
        type="mapel"
      />

      <MasterModal
        isOpen={isJabatanModalOpen}
        onClose={() => setIsJabatanModalOpen(false)}
        onSubmit={handleJabatanSubmit}
        editData={editingJabatan}
        title="Jabatan"
        placeholder="Contoh: Wali Kelas"
        isSubmitting={isSubmitting}
        error={jabatanModalError}
      />

      <GuruTtdModal
        isOpen={isTtdModalOpen}
        onClose={() => setIsTtdModalOpen(false)}
        guru={activeTtdGuru}
        onSuccess={loadGuru}
      />

      <GuruFotoModal
        isOpen={isFotoModalOpen}
        onClose={() => setIsFotoModalOpen(false)}
        guru={activeFotoGuru}
        onSuccess={loadGuru}
      />

      {/* Custom Delete Confirmation Modal */}
      <CustomModal
        open={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: '', id: null, nama: '' })}
        title={deleteDetails.title}
        subtitle="Konfirmasi Penghapusan Data Permanen"
        icon={<AlertTriangle color="#ef4444" />}
        width={440}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button
              type="button"
              className="btn-custom btn-secondary"
              onClick={() => setDeleteConfirm({ isOpen: false, type: '', id: null, nama: '' })}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn-custom btn-danger"
              onClick={handleConfirmDelete}
            >
              Hapus Data
            </button>
          </div>
        }
      >
        <div style={{ padding: '4px 0' }}>
          <p style={{ margin: 0, color: 'var(--lt-text-primary, #0f172a)', fontSize: '14px', fontWeight: 500 }}>
            {deleteDetails.text}
          </p>
          <p style={{ marginTop: '10px', marginBottom: 0, color: 'var(--lt-text-secondary, #64748b)', fontSize: '13px', lineHeight: 1.5 }}>
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
      </CustomModal>
    </div>
  );
}

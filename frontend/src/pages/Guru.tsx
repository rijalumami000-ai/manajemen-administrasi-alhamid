import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  User, 
  BookOpen, 
  Briefcase, 
  AlertTriangle,
  RotateCw 
} from 'lucide-react';
import { guruService } from '../services/guruService';
import { GuruTable } from '../components/features/GuruTable';
import { GuruFilters } from '../components/features/GuruFilters';
import { GuruModal } from '../components/features/GuruModal';
import { MasterList } from '../components/features/MasterList';
import { MasterModal } from '../components/features/MasterModal';
import { GuruTtdModal } from '../components/features/GuruTtdModal';
import { GuruFotoModal } from '../components/features/GuruFotoModal';
import { CustomModal } from '../components/ui/CustomModal';
import { usePagination } from '../hooks/usePagination';
import { useToast } from '../components/common';
import { GuruItem, MataPelajaranItem, JabatanItem, GuruFormData, MasterFormData } from '../types/guru';
import './Guru.scss';

const PAGE_SIZE = 10;
type TabType = 'guru' | 'mata-pelajaran' | 'jabatan';

export function Guru() {
  const toast = useToast();

  // State
  const [guruList, setGuruList] = useState<GuruItem[]>([]);
  const [mataPelajaranList, setMataPelajaranList] = useState<MataPelajaranItem[]>([]);
  const [jabatanList, setJabatanList] = useState<JabatanItem[]>([]);

  // Active tab (Apple Segmented Switcher)
  const [activeTab, setActiveTab] = useState<TabType>('guru');

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

  const [editingGuru, setEditingGuru] = useState<GuruItem | null>(null);
  const [activeTtdGuru, setActiveTtdGuru] = useState<GuruItem | null>(null);
  const [activeFotoGuru, setActiveFotoGuru] = useState<GuruItem | null>(null);
  const [editingMapel, setEditingMapel] = useState<MataPelajaranItem | null>(null);
  const [editingJabatan, setEditingJabatan] = useState<JabatanItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Messages
  const [guruModalError, setGuruModalError] = useState('');
  const [mapelModalError, setMapelModalError] = useState('');
  const [jabatanModalError, setJabatanModalError] = useState('');

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'guru' | 'mapel' | 'jabatan' | '';
    id: number | null;
    nama: string;
  }>({
    isOpen: false,
    type: '',
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
    } catch (err: any) {
      console.error('Gagal memuat data awal:', err);
      setError(err.message || 'Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  const loadGuru = async () => {
    try {
      const data = await guruService.fetchGuru();
      setGuruList(data || []);
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
      setMataPelajaranList(mapelData || []);
      setJabatanList(jabatanData || []);
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
    return [...new Set(guruList.map(g => g.jabatan).filter(Boolean))] as string[];
  }, [guruList]);

  const mapelOptions = useMemo(() => {
    return [...new Set(guruList.map(g => g.mata_pelajaran).filter(Boolean))] as string[];
  }, [guruList]);

  const statusOptions = useMemo(() => {
    return [...new Set(guruList.map(g => g.status).filter(Boolean))] as string[];
  }, [guruList]);

  // Guru handlers
  const handleAddGuruClick = () => {
    setEditingGuru(null);
    setGuruModalError('');
    setIsGuruModalOpen(true);
  };

  const handleEditGuruClick = (guru: GuruItem) => {
    setEditingGuru(guru);
    setGuruModalError('');
    setIsGuruModalOpen(true);
  };

  const handleUploadTtdClick = (guru: GuruItem) => {
    setActiveTtdGuru(guru);
    setIsTtdModalOpen(true);
  };

  const handleUploadFotoClick = (guru: GuruItem) => {
    setActiveFotoGuru(guru);
    setIsFotoModalOpen(true);
  };

  const handleDeleteGuruClick = (id: number, nama: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'guru',
      id,
      nama
    });
  };

  const handleGuruSubmit = async (data: GuruFormData) => {
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
    } catch (err: any) {
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

  const handleEditMapelClick = (mapel: MataPelajaranItem) => {
    setEditingMapel(mapel);
    setMapelModalError('');
    setIsMapelModalOpen(true);
  };

  const handleDeleteMapelClick = (id: number, nama: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'mapel',
      id,
      nama
    });
  };

  const handleMapelSubmit = async (data: MasterFormData) => {
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
    } catch (err: any) {
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

  const handleEditJabatanClick = (jabatan: JabatanItem) => {
    setEditingJabatan(jabatan);
    setJabatanModalError('');
    setIsJabatanModalOpen(true);
  };

  const handleDeleteJabatanClick = (id: number, nama: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'jabatan',
      id,
      nama
    });
  };

  const handleJabatanSubmit = async (data: MasterFormData) => {
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
    } catch (err: any) {
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
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data');
    }
  };

  const getPrimaryButton = () => {
    switch (activeTab) {
      case 'guru':
        return (
          <button
            type="button"
            className="tactile-primary-button"
            onClick={handleAddGuruClick}
          >
            <Plus size={17} />
            <span>Tambah Guru</span>
          </button>
        );
      case 'mata-pelajaran':
        return (
          <button
            type="button"
            className="tactile-primary-button"
            onClick={handleAddMapelClick}
          >
            <Plus size={17} />
            <span>Tambah Mata Pelajaran</span>
          </button>
        );
      case 'jabatan':
        return (
          <button
            type="button"
            className="tactile-primary-button"
            onClick={handleAddJabatanClick}
          >
            <Plus size={17} />
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
          text: `Apakah Anda yakin ingin menghapus data guru "${deleteConfirm.nama}"? Seluruh data jadwal mengajar dan profil terkait akan ikut terdampak.`
        };
      case 'mapel':
        return {
          title: 'Hapus Mata Pelajaran',
          text: `Apakah Anda yakin ingin menghapus mata pelajaran "${deleteConfirm.nama}"? Tindakan ini dapat mempengaruhi data penugasan kelas dan rapor santri.`
        };
      case 'jabatan':
        return {
          title: 'Hapus Jabatan',
          text: `Apakah Anda yakin ingin menghapus jabatan "${deleteConfirm.nama}"? Tindakan ini dapat mempengaruhi data struktur organisasi sekolah.`
        };
      default:
        return { title: 'Hapus Data', text: 'Apakah Anda yakin ingin menghapus data ini?' };
    }
  };

  const deleteDetails = getDeleteConfirmDetails();

  return (
    <div className="guru-page tactile-redesign">
      {/* ─── 1. APPLE FLOATING DOCK HEADER ───────────────────────── */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Manajemen Data Guru</h2>
          <p className="page-subtitle">Kelola data asatidz/ustadzah, mata pelajaran, dan jabatan struktural</p>
        </div>

        <div className="header-actions-row">
          {/* Apple Segmented Control Tab Switcher */}
          <div className="tactile-segmented-control" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'guru'}
              className={`segment-btn ${activeTab === 'guru' ? 'active' : ''}`}
              onClick={() => setActiveTab('guru')}
            >
              <User size={15} />
              <span>Data Guru</span>
              <span className="segment-count">{guruList.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'mata-pelajaran'}
              className={`segment-btn ${activeTab === 'mata-pelajaran' ? 'active' : ''}`}
              onClick={() => setActiveTab('mata-pelajaran')}
            >
              <BookOpen size={15} />
              <span>Mata Pelajaran</span>
              <span className="segment-count">{mataPelajaranList.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'jabatan'}
              className={`segment-btn ${activeTab === 'jabatan' ? 'active' : ''}`}
              onClick={() => setActiveTab('jabatan')}
            >
              <Briefcase size={15} />
              <span>Jabatan</span>
              <span className="segment-count">{jabatanList.length}</span>
            </button>
          </div>

          {/* Dynamic Action Button */}
          {getPrimaryButton()}
        </div>
      </header>

      {/* ─── 2. CONTENT BODY & TAB PANELS ────────────────────────── */}
      <main className="guru-content-body">
        {loading ? (
          /* Apple Liquid Glass Table Shimmer Skeleton */
          <div className="tactile-skeleton-table" aria-busy="true" aria-label="Memuat data guru">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : error ? (
          /* In-Page Frosted Glass Error State */
          <div className="tactile-glass-error">
            <div className="error-icon-bubble">
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <h4>Gagal Memuat Data</h4>
            <p>{error}</p>
            <button
              type="button"
              className="retry-btn"
              onClick={loadInitialData}
            >
              <RotateCw size={14} />
              <span>Coba Lagi</span>
            </button>
          </div>
        ) : (
          <>
            {/* TAB 1: DATA GURU */}
            {activeTab === 'guru' && (
              <div className="guru-tab-panel active animate-fade-in">
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

            {/* TAB 2: MATA PELAJARAN */}
            {activeTab === 'mata-pelajaran' && (
              <div className="guru-tab-panel active animate-fade-in">
                <div className="tab-info-banner">
                  <p className="info-text">
                    Daftar mata pelajaran reguler & diniyah yang tersedia untuk ditugaskan ke ustadz/ustadzah.
                  </p>
                  <span className="info-count-badge">
                    {mataPelajaranList.length} Mata Pelajaran
                  </span>
                </div>

                <MasterList
                  items={mataPelajaranList}
                  emptyLabel="Tambahkan mata pelajaran pertama dari tombol di atas."
                  onEdit={handleEditMapelClick}
                  onDelete={handleDeleteMapelClick}
                  type="mapel"
                />
              </div>
            )}

            {/* TAB 3: JABATAN STRUKTURAL */}
            {activeTab === 'jabatan' && (
              <div className="guru-tab-panel active animate-fade-in">
                <div className="tab-info-banner">
                  <p className="info-text">
                    Daftar jabatan fungsional & struktural pesantren yang dapat ditugaskan ke ustadz/ustadzah.
                  </p>
                  <span className="info-count-badge">
                    {jabatanList.length} Jabatan
                  </span>
                </div>

                <MasterList
                  items={jabatanList}
                  emptyLabel="Tambahkan jabatan pertama dari tombol di atas."
                  onEdit={handleEditJabatanClick}
                  onDelete={handleDeleteJabatanClick}
                  type="jabatan"
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── 3. MODALS ────────────────────────────────────────────── */}
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

      {/* ─── 4. CUSTOM MODAL HAPUS DATA ───────────────────────────── */}
      <CustomModal
        open={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: '', id: null, nama: '' })}
        title={deleteDetails.title}
        subtitle="Konfirmasi Penghapusan Data Permanen"
        icon={<AlertTriangle color="#ef4444" />}
        width={440}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button
              type="button"
              className="tactile-modal-btn secondary"
              onClick={() => setDeleteConfirm({ isOpen: false, type: '', id: null, nama: '' })}
            >
              Batal
            </button>
            <button
              type="button"
              className="tactile-modal-btn danger"
              onClick={handleConfirmDelete}
            >
              Hapus Data
            </button>
          </div>
        }
      >
        <div className="tactile-delete-dialog-content">
          <div className="tactile-delete-callout">
            <p className="callout-title">
              {deleteDetails.text}
            </p>
            <p className="callout-desc">
              Tindakan ini bersifat permanen. Seluruh data jadwal atau penugasan yang tertaut dengan data ini akan ikut terdampak.
            </p>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default Guru;

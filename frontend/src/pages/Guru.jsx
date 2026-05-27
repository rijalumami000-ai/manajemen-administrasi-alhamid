import { useState, useEffect, useMemo } from 'react';
import { Tabs, Button, Badge, message as antMessage } from 'antd';
import { PlusOutlined, UserOutlined, BookOutlined, IdcardOutlined } from '@ant-design/icons';
import { guruService } from '../services/guruService';
import { GuruTable } from '../components/features/GuruTable';
import { GuruFilters } from '../components/features/GuruFilters';
import { GuruModal } from '../components/features/GuruModal';
import { MasterList } from '../components/features/MasterList';
import { MasterModal } from '../components/features/MasterModal';
import { GuruTtdModal } from '../components/features/GuruTtdModal';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import { usePagination } from '../hooks/usePagination';
import './Guru.scss';

const PAGE_SIZE = 10;

export function Guru() {
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

  const [editingGuru, setEditingGuru] = useState(null);
  const [activeTtdGuru, setActiveTtdGuru] = useState(null);
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

  const handleDeleteGuruClick = async (id) => {
    if (!confirm('Hapus data guru ini?')) return;

    try {
      await guruService.deleteGuru(id);
      antMessage.success('Data guru berhasil dihapus');
      await loadGuru();
    } catch (err) {
      antMessage.error(err.message || 'Gagal menghapus guru');
    }
  };

  const handleGuruSubmit = async (data) => {
    setIsSubmitting(true);
    setGuruModalError('');

    try {
      if (editingGuru) {
        await guruService.updateGuru(editingGuru.id, data);
        antMessage.success('Data guru berhasil diperbarui');
      } else {
        await guruService.createGuru(data);
        antMessage.success('Data guru berhasil disimpan');
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

  const handleDeleteMapelClick = async (id) => {
    if (!confirm('Hapus mata pelajaran ini?')) return;

    try {
      await guruService.deleteMataPelajaran(id);
      antMessage.success('Mata pelajaran berhasil dihapus');
      await loadMasterData();
      await loadGuru();
    } catch (err) {
      antMessage.error(err.message || 'Gagal menghapus mata pelajaran');
    }
  };

  const handleMapelSubmit = async (data) => {
    setIsSubmitting(true);
    setMapelModalError('');

    try {
      if (editingMapel) {
        await guruService.updateMataPelajaran(editingMapel.id, data);
        antMessage.success('Mata pelajaran berhasil diperbarui');
      } else {
        await guruService.createMataPelajaran(data);
        antMessage.success('Mata pelajaran berhasil disimpan');
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

  const handleDeleteJabatanClick = async (id) => {
    if (!confirm('Hapus jabatan ini?')) return;

    try {
      await guruService.deleteJabatan(id);
      antMessage.success('Jabatan berhasil dihapus');
      await loadMasterData();
      await loadGuru();
    } catch (err) {
      antMessage.error(err.message || 'Gagal menghapus jabatan');
    }
  };

  const handleJabatanSubmit = async (data) => {
    setIsSubmitting(true);
    setJabatanModalError('');

    try {
      if (editingJabatan) {
        await guruService.updateJabatan(editingJabatan.id, data);
        antMessage.success('Jabatan berhasil diperbarui');
      } else {
        await guruService.createJabatan(data);
        antMessage.success('Jabatan berhasil disimpan');
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

  const tabItems = [
    {
      key: 'guru',
      label: (
        <span>
          <UserOutlined /> Guru <Badge count={guruList.length} showZero />
        </span>
      ),
      children: (
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
          />
        </div>
      )
    },
    {
      key: 'mata-pelajaran',
      label: (
        <span>
          <BookOutlined /> Mata Pelajaran <Badge count={mataPelajaranList.length} showZero />
        </span>
      ),
      children: (
        <div className="guru-tab-content">
          <p className="tab-description">
            Daftar mata pelajaran yang tersedia untuk ditugaskan ke guru.
          </p>
          <MasterList
            items={mataPelajaranList}
            emptyLabel="Tambahkan mata pelajaran pertama dari tombol di atas."
            onEdit={handleEditMapelClick}
            onDelete={handleDeleteMapelClick}
          />
        </div>
      )
    },
    {
      key: 'jabatan',
      label: (
        <span>
          <IdcardOutlined /> Jabatan <Badge count={jabatanList.length} showZero />
        </span>
      ),
      children: (
        <div className="guru-tab-content">
          <p className="tab-description">
            Daftar jabatan yang tersedia untuk ditugaskan ke guru.
          </p>
          <MasterList
            items={jabatanList}
            emptyLabel="Tambahkan jabatan pertama dari tombol di atas."
            onEdit={handleEditJabatanClick}
            onDelete={handleDeleteJabatanClick}
          />
        </div>
      )
    }
  ];

  const getTabButton = () => {
    switch (activeTab) {
      case 'guru':
        return (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddGuruClick}
          >
            Tambah Guru
          </Button>
        );
      case 'mata-pelajaran':
        return (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddMapelClick}
          >
            Tambah Mata Pelajaran
          </Button>
        );
      case 'jabatan':
        return (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddJabatanClick}
          >
            Tambah Jabatan
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="guru-page">
      <PageHeader
        title="Manajemen Data Guru"
        subtitle="Kelola data guru, mata pelajaran, dan jabatan dari satu tempat"
        extra={getTabButton()}
      />

      <div className="guru-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
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
    </div>
  );
}

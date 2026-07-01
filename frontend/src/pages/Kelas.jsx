import { useState, useEffect, useMemo } from 'react';
import { Plus, BookOpen, ArrowUpDown, AlertTriangle } from 'lucide-react';
import { kelasService } from '../services/kelasService';
import { guruService } from '../services/guruService';
import { santriService } from '../services/santriService';
import { KelasCard } from '../components/features/KelasCard';
import { KelasModal } from '../components/features/KelasModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import { PageHeader, LoadingState, ErrorState, EmptyState, useToast } from '../components/common';
import './Kelas.scss';

export function Kelas() {
  const toast = useToast();
  const [kelasList, setKelasList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState(null);
  const [sortBy, setSortBy] = useState('nama-asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Custom Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    kelasId: null,
    kelasNama: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tahun ajaran first
      const years = await santriService.fetchTahunAjaran();
      setTahunAjaranList(years);

      const active = years.find(y => y.is_active);
      const activeId = active ? String(active.id) : null;
      setSelectedTahunAjaranId(activeId);

      const [data, gurus, mapels] = await Promise.all([
        kelasService.fetchKelas(activeId),
        guruService.fetchGuru(),
        guruService.fetchMataPelajaran()
      ]);

      setKelasList(data);
      setGuruList(gurus);
      setMapelList(mapels);
    } catch (err) {
      console.error('Gagal memuat data kelas:', err);
      setError(err.message || 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  const loadKelas = async (tahunAjaranId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await kelasService.fetchKelas(tahunAjaranId);
      setKelasList(data);
    } catch (err) {
      console.error('Gagal memuat data kelas:', err);
      setError(err.message || 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingData(null);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (kelas) => {
    setEditingData(kelas);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id, nama) => {
    setDeleteConfirm({
      isOpen: true,
      kelasId: id,
      kelasNama: nama
    });
  };

  const handleConfirmDelete = async () => {
    const { kelasId } = deleteConfirm;
    if (!kelasId) return;

    try {
      await kelasService.deleteKelas(kelasId);
      toast.success('Data kelas berhasil dihapus');
      setDeleteConfirm({ isOpen: false, kelasId: null, kelasNama: '' });
      await loadKelas(selectedTahunAjaranId);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus kelas');
    }
  };

  const handleModalSubmit = async (data) => {
    setIsSubmitting(true);
    setModalError('');

    try {
      const payload = {
        ...data,
        tahun_ajaran_id: selectedTahunAjaranId ? Number(selectedTahunAjaranId) : null
      };

      if (editingData) {
        await kelasService.updateKelas(editingData.id, payload);
        toast.success('Data kelas berhasil diperbarui');
      } else {
        await kelasService.createKelas(payload);
        toast.success('Data kelas berhasil disimpan');
      }

      setIsModalOpen(false);
      await loadKelas(selectedTahunAjaranId);
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTahunAjaranChange = (value) => {
    setSelectedTahunAjaranId(value);
    loadKelas(value);
  };

  // Sort kelas
  const sortedKelas = useMemo(() => {
    const sorted = [...kelasList];

    if (sortBy === 'terbaru' || sortBy === 'terlama') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return sortBy === 'terbaru' ? dateB - dateA : dateA - dateB;
      });
    } else {
      sorted.sort((a, b) => {
        const nameA = a.nama || '';
        const nameB = b.nama || '';
        return sortBy === 'nama-desc'
          ? nameB.localeCompare(nameA, 'id', { numeric: true, sensitivity: 'base' })
          : nameA.localeCompare(nameB, 'id', { numeric: true, sensitivity: 'base' });
      });
    }

    return sorted;
  }, [kelasList, sortBy]);

  // Group by jenis
  const kelasDiniyah = sortedKelas.filter(k => k.jenis === 'Diniyah');
  const kelasSekolah = sortedKelas.filter(k => k.jenis === 'Sekolah');

  const renderKelasGroup = (items, title, jenis, iconColor) => (
    <div className="kelas-group">
      <div className="kelas-group-header">
        <div className="kelas-group-title">
          <BookOpen size={22} color={iconColor} />
          <h3>{title}</h3>
          <span className="kelas-count">{items.length} kelas</span>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="kelas-grid">
          {items.map(kelas => (
            <KelasCard
              key={kelas.id}
              kelas={kelas}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        <EmptyState description={`Belum ada ${title.toLowerCase()}`} />
      )}
    </div>
  );

  if (loading) {
    return <LoadingState message="Memuat data kelas..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => loadKelas(selectedTahunAjaranId)}
      />
    );
  }

  const tahunAjaranOptions = tahunAjaranList.map(option => ({
    value: String(option.id),
    label: `${option.kode}${option.is_active ? ' (Berjalan)' : ''}`
  }));

  const sortByOptions = [
    { label: 'Nama A-Z', value: 'nama-asc' },
    { label: 'Nama Z-A', value: 'nama-desc' },
    { label: 'Terbaru', value: 'terbaru' },
    { label: 'Terlama', value: 'terlama' }
  ];

  return (
    <div className="kelas-page">
      <PageHeader
        title="📚 Manajemen Data Kelas"
        subtitle="Kelola daftar kelas Diniyah dan Sekolah"
        extra={
          <div className="kelas-header-actions">
            <div className="select-wrapper select-ta">
              <CustomSelect
                label="Tahun Ajaran"
                value={selectedTahunAjaranId}
                onChange={handleTahunAjaranChange}
                options={tahunAjaranOptions}
                placeholder="Pilih Tahun Ajaran"
              />
            </div>
            <div className="select-wrapper select-sort">
              <CustomSelect
                label="Urutkan"
                value={sortBy}
                onChange={setSortBy}
                options={sortByOptions}
                icon={ArrowUpDown}
              />
            </div>
            <button
              type="button"
              className="btn-custom btn-primary"
              onClick={handleAddClick}
            >
              <Plus size={18} />
              <span>Tambah Kelas</span>
            </button>
          </div>
        }
      />

      <div className="kelas-content">
        {kelasList.length === 0 ? (
          <EmptyState
            description="Belum ada data kelas"
            action={
              <button
                type="button"
                className="btn-custom btn-primary"
                onClick={handleAddClick}
              >
                <Plus size={18} />
                <span>Tambah Kelas Pertama</span>
              </button>
            }
          />
        ) : (
          <>
            {renderKelasGroup(kelasDiniyah, 'Kelas Diniyah', 'Diniyah', '#3b82f6')}
            <div className="kelas-divider" />
            {renderKelasGroup(kelasSekolah, 'Kelas Sekolah', 'Sekolah', '#a855f7')}
          </>
        )}
      </div>

      <KelasModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editData={editingData}
        isSubmitting={isSubmitting}
        error={modalError}
        guruList={guruList}
        mapelList={mapelList}
      />

      {/* Custom Delete Confirmation Modal */}
      <CustomModal
        open={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, kelasId: null, kelasNama: '' })}
        title="Hapus Kelas"
        subtitle="Konfirmasi Penghapusan Data Kelas"
        icon={<AlertTriangle color="#ef4444" />}
        width={440}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button
              type="button"
              className="btn-custom btn-secondary"
              onClick={() => setDeleteConfirm({ isOpen: false, kelasId: null, kelasNama: '' })}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn-custom btn-danger"
              onClick={handleConfirmDelete}
            >
              Hapus Kelas
            </button>
          </div>
        }
      >
        <div style={{ padding: '4px 0' }}>
          <p style={{ margin: 0, color: 'var(--lt-text-primary, #0f172a)', fontSize: '14px', fontWeight: 500 }}>
            Apakah Anda yakin ingin menghapus kelas <strong>{deleteConfirm.kelasNama}</strong>?
          </p>
          <p style={{ marginTop: '10px', marginBottom: 0, color: 'var(--lt-text-secondary, #64748b)', fontSize: '13px', lineHeight: 1.5 }}>
            Tindakan ini permanen dan tidak dapat dibatalkan. Hubungan data santri serta nilai yang tertaut dengan kelas ini mungkin akan terpengaruh.
          </p>
        </div>
      </CustomModal>
    </div>
  );
}

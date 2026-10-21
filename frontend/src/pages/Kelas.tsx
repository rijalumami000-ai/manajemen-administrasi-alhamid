import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  ArrowUpDown, 
  BookOpen, 
  School,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { kelasService } from '../services/kelasService';
import { guruService } from '../services/guruService';
import { santriService } from '../services/santriService';
import { KelasCard } from '../components/features/KelasCard';
import { KelasModal } from '../components/features/KelasModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import { useToast } from '../components/common';
import { KelasItem, TahunAjaran, GuruItem, MapelItem, KelasFormData } from '../types/kelas';
import './Kelas.scss';

export function Kelas() {
  const toast = useToast();
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [guruList, setGuruList] = useState<GuruItem[]>([]);
  const [mapelList, setMapelList] = useState<MapelItem[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaran[]>([]);
  const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState<string | null>(null);

  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('nama-asc');
  const [filterJenis, setFilterJenis] = useState<'all' | 'Diniyah' | 'Sekolah'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<KelasItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    kelasId: number | null;
    kelasNama: string;
  }>({
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

      // Fetch tahun ajaran
      const years = await santriService.fetchTahunAjaran();
      setTahunAjaranList(years);

      const active = years.find((y: TahunAjaran) => y.is_active);
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
      const msg = err instanceof Error ? err.message : 'Gagal memuat data kelas';
      console.error('Gagal memuat data kelas:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadKelas = async (tahunAjaranId: string | null) => {
    try {
      setLoading(true);
      setError(null);
      const data = await kelasService.fetchKelas(tahunAjaranId);
      setKelasList(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data kelas';
      console.error('Gagal memuat data kelas:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingData(null);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (kelas: KelasItem) => {
    setEditingData(kelas);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number, nama: string) => {
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
      await kelasService.deleteKelas(kelasId, selectedTahunAjaranId);
      toast.success('Data kelas berhasil dihapus');
      setDeleteConfirm({ isOpen: false, kelasId: null, kelasNama: '' });
      await loadKelas(selectedTahunAjaranId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus kelas';
      toast.error(msg);
    }
  };

  const handleModalSubmit = async (data: KelasFormData) => {
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
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan data';
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTahunAjaranChange = (value: string) => {
    setSelectedTahunAjaranId(value);
    loadKelas(value);
  };

  // Filter & Sort
  const sortedAndFilteredKelas = useMemo(() => {
    let list = [...kelasList];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(k => {
        const matchNama = (k.nama || '').toLowerCase().includes(query);
        const matchMustahiq = (k.mustahiq_nama || '').toLowerCase().includes(query);
        const matchMuhafadzoh = (k.muhafadzoh_nama || '').toLowerCase().includes(query);
        const matchQiroatul = (k.qiroatul_nama || '').toLowerCase().includes(query);
        return matchNama || matchMustahiq || matchMuhafadzoh || matchQiroatul;
      });
    }

    // Sort
    if (sortBy === 'terbaru' || sortBy === 'terlama') {
      list.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return sortBy === 'terbaru' ? dateB - dateA : dateA - dateB;
      });
    } else {
      list.sort((a, b) => {
        const nameA = a.nama || '';
        const nameB = b.nama || '';
        return sortBy === 'nama-desc'
          ? nameB.localeCompare(nameA, 'id', { numeric: true, sensitivity: 'base' })
          : nameA.localeCompare(nameB, 'id', { numeric: true, sensitivity: 'base' });
      });
    }

    return list;
  }, [kelasList, searchQuery, sortBy]);

  // Group by jenis (Diniyah & Sekolah)
  const kelasDiniyah = sortedAndFilteredKelas.filter(k => k.jenis === 'Diniyah');
  const kelasSekolah = sortedAndFilteredKelas.filter(k => k.jenis === 'Sekolah');

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

  const renderKelasGroup = (items: KelasItem[], title: string, icon: React.ReactNode, countColor: string) => (
    <section className="kelas-group" aria-label={title}>
      <div className="kelas-group-header">
        <div className="kelas-group-title">
          <div className="group-icon-bubble">
            {icon}
          </div>
          <h3>{title}</h3>
          <span className="kelas-count-pill" style={{ borderColor: countColor }}>
            {items.length} kelas
          </span>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="tactile-kelas-grid">
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
        <div className="tactile-glass-empty">
          <div className="empty-icon-bubble">
            {icon}
          </div>
          <h4>{searchQuery ? 'Tidak Ada Kelas yang Cocok' : `Belum Ada ${title}`}</h4>
          <p>
            {searchQuery 
              ? `Tidak ditemukan kelas yang cocok dengan pencarian "${searchQuery}".` 
              : `Belum ada rombongan belajar terdaftar untuk ${title.toLowerCase()} pada tahun ajaran ini.`}
          </p>
          {searchQuery && (
            <button
              type="button"
              className="clear-filter-btn"
              onClick={() => setSearchQuery('')}
            >
              Reset Filter Pencarian
            </button>
          )}
        </div>
      )}
    </section>
  );

  return (
    <div className="kelas-page tactile-redesign">
      {/* ─── 1. TACTILE PAGE HEADER ─────────────────────────────────── */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Manajemen Data Kelas</h2>
          <p className="page-subtitle">Kelola pembagian rombongan belajar Diniyah dan Sekolah</p>
        </div>

        <div className="header-actions-row">
          {/* Tactile Inset Search Bar */}
          <div className="tactile-search-pill">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Cari kelas, mustahiq, kitab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Hapus pencarian"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Apple Segmented Control (Semua / Diniyah / Sekolah) */}
          <div className="tactile-segmented-control" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={filterJenis === 'all'}
              className={`segment-btn ${filterJenis === 'all' ? 'active' : ''}`}
              onClick={() => setFilterJenis('all')}
            >
              <span>Semua</span>
              <span className="segment-count">{kelasList.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterJenis === 'Diniyah'}
              className={`segment-btn ${filterJenis === 'Diniyah' ? 'active' : ''}`}
              onClick={() => setFilterJenis('Diniyah')}
            >
              <span>Diniyah</span>
              <span className="segment-count">
                {kelasList.filter(k => k.jenis === 'Diniyah').length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterJenis === 'Sekolah'}
              className={`segment-btn ${filterJenis === 'Sekolah' ? 'active' : ''}`}
              onClick={() => setFilterJenis('Sekolah')}
            >
              <span>Sekolah</span>
              <span className="segment-count">
                {kelasList.filter(k => k.jenis === 'Sekolah').length}
              </span>
            </button>
          </div>

          {/* Tahun Ajaran */}
          <div className="select-wrapper select-ta">
            <CustomSelect
              label="Tahun Ajaran"
              value={selectedTahunAjaranId}
              onChange={handleTahunAjaranChange}
              options={tahunAjaranOptions}
              placeholder="Pilih Tahun Ajaran"
            />
          </div>

          {/* Sort By */}
          <div className="select-wrapper select-sort">
            <CustomSelect
              label="Urutkan"
              value={sortBy}
              onChange={setSortBy}
              options={sortByOptions}
              icon={ArrowUpDown}
            />
          </div>

          {/* Tactile Primary Pill Button */}
          <button
            type="button"
            className="tactile-primary-button"
            onClick={handleAddClick}
          >
            <Plus size={17} />
            <span>Tambah Kelas</span>
          </button>
        </div>
      </header>

      {/* ─── 2. CONTENT GROUPS ────────────────────────────────────── */}
      <main className="kelas-content-body">
        {loading ? (
          /* Apple Liquid Glass Shimmer Skeleton Grid */
          <div className="tactile-skeleton-grid" aria-busy="true" aria-label="Memuat data kelas">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="tactile-skeleton-card">
                <div className="skeleton-header">
                  <div className="skeleton-orb" />
                  <div className="skeleton-title-lines">
                    <div className="line-sm" />
                    <div className="line-lg" />
                  </div>
                </div>
                <div className="skeleton-tiles">
                  <div className="skeleton-tile" />
                  <div className="skeleton-tile" />
                  <div className="skeleton-tile" />
                </div>
                <div className="skeleton-footer">
                  <div className="skeleton-btn" />
                  <div className="skeleton-btn" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* In-Page Frosted Glass Error State */
          <div className="tactile-glass-error">
            <div className="error-icon-bubble">
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <h4>Gagal Memuat Data Kelas</h4>
            <p>{error}</p>
            <button
              type="button"
              className="retry-btn"
              onClick={() => loadKelas(selectedTahunAjaranId)}
            >
              <RotateCw size={14} />
              <span>Coba Lagi</span>
            </button>
          </div>
        ) : kelasList.length === 0 ? (
          /* Empty Initial State */
          <div className="tactile-glass-empty">
            <div className="empty-icon-bubble">
              <BookOpen size={28} />
            </div>
            <h4>Belum Ada Data Kelas</h4>
            <p>Mulai tambahkan rombongan belajar baru untuk tahun ajaran ini.</p>
            <button
              type="button"
              className="tactile-primary-button"
              onClick={handleAddClick}
              style={{ marginTop: '8px' }}
            >
              <Plus size={17} />
              <span>Tambah Kelas Pertama</span>
            </button>
          </div>
        ) : (
          /* Grouped Kelas Lists based on Segmented Filter */
          <>
            {(filterJenis === 'all' || filterJenis === 'Diniyah') && (
              renderKelasGroup(
                kelasDiniyah, 
                'Kelas Diniyah', 
                <BookOpen size={18} color="#0284c7" />, 
                'rgba(2, 132, 199, 0.4)'
              )
            )}

            {filterJenis === 'all' && kelasDiniyah.length > 0 && kelasSekolah.length > 0 && (
              <div className="tactile-group-divider" />
            )}

            {(filterJenis === 'all' || filterJenis === 'Sekolah') && (
              renderKelasGroup(
                kelasSekolah, 
                'Kelas Sekolah', 
                <School size={18} color="#9333ea" />, 
                'rgba(147, 51, 234, 0.4)'
              )
            )}
          </>
        )}
      </main>

      {/* ─── 3. MODAL TAMBAH / EDIT KELAS ─────────────────────────── */}
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

      {/* ─── 4. CUSTOM MODAL HAPUS KELAS ──────────────────────────── */}
      <CustomModal
        open={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, kelasId: null, kelasNama: '' })}
        title="Hapus Kelas"
        subtitle="Konfirmasi Penghapusan Data Kelas"
        icon={<AlertTriangle color="#ef4444" />}
        width={440}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button
              type="button"
              className="tactile-modal-btn secondary"
              onClick={() => setDeleteConfirm({ isOpen: false, kelasId: null, kelasNama: '' })}
            >
              Batal
            </button>
            <button
              type="button"
              className="tactile-modal-btn danger"
              onClick={handleConfirmDelete}
            >
              Hapus Kelas
            </button>
          </div>
        }
      >
        <div className="tactile-delete-dialog-content">
          <div className="tactile-delete-callout">
            <p className="callout-title">
              Apakah Anda yakin ingin menghapus kelas <strong>"{deleteConfirm.kelasNama}"</strong>?
            </p>
            <p className="callout-desc">
              Tindakan ini bersifat permanen. Seluruh relasi data santri serta nilai akademik yang tertaut dengan kelas ini pada tahun ajaran ini akan terdampak.
            </p>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default Kelas;

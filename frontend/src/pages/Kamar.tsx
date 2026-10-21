import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Home, 
  Users, 
  BedDouble, 
  Building, 
  Search, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { kamarService } from '../services/kamarService';
import { KamarCard } from '../components/features/KamarCard';
import { KamarModal } from '../components/features/KamarModal';
import { KamarAnggotaModal } from '../components/features/KamarAnggotaModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import { LoadingState, ErrorState, useToast } from '../components/common';
import { 
  KamarItem, 
  KamarFormData, 
  KamarDeleteConfirmState 
} from '../types/kamar';
import './Kamar.scss';

export function Kamar() {
  const toast = useToast();
  const [kamarList, setKamarList] = useState<KamarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'semua' | 'putra' | 'putri'>('semua');
  const [sortBy, setSortBy] = useState('nama-asc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<KamarItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Member detail modal
  const [selectedKamar, setSelectedKamar] = useState<KamarItem | null>(null);
  const [isAnggotaModalOpen, setIsAnggotaModalOpen] = useState(false);

  // Custom Delete Confirm State (No browser window.confirm!)
  const [deleteConfirm, setDeleteConfirm] = useState<KamarDeleteConfirmState>({
    isOpen: false,
    kamarId: null,
    kamarNama: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadKamar();
  }, []);

  const loadKamar = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kamarService.fetchKamar();
      setKamarList(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data kamar';
      console.error('Gagal memuat data kamar:', err);
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

  const handleEditClick = (kamar: KamarItem) => {
    setEditingData(kamar);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number, nama: string) => {
    setDeleteConfirm({
      isOpen: true,
      kamarId: id,
      kamarNama: nama
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.kamarId) return;

    try {
      setIsDeleting(true);
      await kamarService.deleteKamar(deleteConfirm.kamarId);
      toast.success(`Kamar "${deleteConfirm.kamarNama}" berhasil dihapus.`);
      setDeleteConfirm({ isOpen: false, kamarId: null, kamarNama: '' });
      await loadKamar();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus kamar';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectKamar = (kamar: KamarItem) => {
    setSelectedKamar(kamar);
    setIsAnggotaModalOpen(true);
  };

  const handleModalSubmit = async (data: KamarFormData) => {
    setIsSubmitting(true);
    setModalError('');

    try {
      if (editingData) {
        await kamarService.updateKamar(editingData.id, data);
        toast.success(`Kamar "${data.nama}" berhasil diperbarui.`);
      } else {
        await kamarService.createKamar(data);
        toast.success(`Kamar "${data.nama}" berhasil ditambahkan.`);
      }

      setIsModalOpen(false);
      await loadKamar();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan data kamar';
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered & Sorted Rooms
  const filteredAndSortedKamar = useMemo(() => {
    let list = [...kamarList];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(k => 
        (k.nama && k.nama.toLowerCase().includes(q)) ||
        (k.gedung && k.gedung.toLowerCase().includes(q)) ||
        (k.fasilitas && k.fasilitas.toLowerCase().includes(q)) ||
        (k.keterangan && k.keterangan.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      const nameA = a.nama || '';
      const nameB = b.nama || '';
      const terisiA = Number(a.terisi) || 0;
      const terisiB = Number(b.terisi) || 0;
      const kapA = Number(a.kapasitas) || 0;
      const kapB = Number(b.kapasitas) || 0;
      const sisaA = Math.max(0, kapA - terisiA);
      const sisaB = Math.max(0, kapB - terisiB);

      switch (sortBy) {
        case 'nama-desc':
          return nameB.localeCompare(nameA, 'id', { numeric: true, sensitivity: 'base' });
        case 'kapasitas-desc':
          return kapB - kapA;
        case 'terisi-desc':
          return terisiB - terisiA;
        case 'sisa-desc':
          return sisaB - sisaA;
        case 'nama-asc':
        default:
          return nameA.localeCompare(nameB, 'id', { numeric: true, sensitivity: 'base' });
      }
    });

    return list;
  }, [kamarList, searchQuery, sortBy]);

  const kamarPutra = useMemo(() => {
    return filteredAndSortedKamar.filter(k => k.jenis === 'Putra');
  }, [filteredAndSortedKamar]);

  const kamarPutri = useMemo(() => {
    return filteredAndSortedKamar.filter(k => k.jenis === 'Putri');
  }, [filteredAndSortedKamar]);

  // Overall Statistics (from raw kamarList)
  const totalKapasitas = kamarList.reduce((acc, k) => acc + (Number(k.kapasitas) || 0), 0);
  const totalTerisi = kamarList.reduce((acc, k) => acc + (Number(k.terisi) || 0), 0);
  const totalSisa = Math.max(0, totalKapasitas - totalTerisi);
  const persenTerisi = totalKapasitas > 0 ? Math.round((totalTerisi / totalKapasitas) * 100) : 0;

  const totalSantriPutra = kamarList.filter(k => k.jenis === 'Putra').reduce((acc, k) => acc + (Number(k.terisi) || 0), 0);
  const totalSantriPutri = kamarList.filter(k => k.jenis === 'Putri').reduce((acc, k) => acc + (Number(k.terisi) || 0), 0);

  const sortByOptions = [
    { label: 'Nama Kamar (A-Z)', value: 'nama-asc' },
    { label: 'Nama Kamar (Z-A)', value: 'nama-desc' },
    { label: 'Kapasitas Terbanyak', value: 'kapasitas-desc' },
    { label: 'Paling Padat (Terisi)', value: 'terisi-desc' },
    { label: 'Sisa Kuota Terbanyak', value: 'sisa-desc' }
  ];

  const renderKamarGrid = (list: KamarItem[], title: string, theme: 'theme-putra' | 'theme-putri') => {
    const isThemePutra = theme === 'theme-putra';
    const totalPenghuni = list.reduce((acc, k) => acc + (Number(k.terisi) || 0), 0);

    return (
      <section className={`kamar-group-section ${theme}`} aria-label={title}>
        <div className="group-dock-header">
          <div className="group-title-block">
            <div className={`group-lens-bubble ${isThemePutra ? 'bubble-putra' : 'bubble-putri'}`}>
              <Home size={18} />
            </div>
            <div className="group-text">
              <h3 className="section-main-title">{title}</h3>
              <span className="group-subtitle">
                {list.length} Kamar Terdaftar &bull; {totalPenghuni} Santri Penghuni
              </span>
            </div>
          </div>
          <span className="group-count-pill">
            {list.length} Kamar
          </span>
        </div>

        {list.length === 0 ? (
          <div className="tactile-empty-card">
            <div className="empty-bubble-icon">
              <BedDouble size={30} />
            </div>
            <h4>{searchQuery ? 'Tidak Ada Kamar yang Cocok' : `Belum Ada ${title}`}</h4>
            <p>
              {searchQuery
                ? `Tidak ditemukan kamar yang cocok dengan kata kunci "${searchQuery}".`
                : `Belum ada data kamar terdaftar untuk ${title.toLowerCase()}.`}
            </p>
            {searchQuery && (
              <button
                type="button"
                className="reset-search-btn"
                onClick={() => setSearchQuery('')}
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="tactile-kamar-grid">
            {list.map(kamar => (
              <KamarCard
                key={kamar.id}
                kamar={kamar}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onSelect={handleSelectKamar}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  if (loading) return <LoadingState message="Memuat data kamar..." />;
  if (error) return <ErrorState message={error} onRetry={loadKamar} />;

  return (
    <div className="kamar-page tactile-redesign">
      {/* ─── 1. TACTILE PAGE HEADER (Option A Apple Dock Header) ─── */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Manajemen Data Kamar</h2>
          <p className="page-subtitle">
            Kelola kapasitas kamar asrama putra dan putri, visualisasi keterisian, lantai, serta rincian penghuni
          </p>
        </div>

        <div className="header-actions-row">
          {/* Tactile Inset Search Pill */}
          <div className="tactile-search-pill">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Cari kamar, gedung, fasilitas..."
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
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="header-sort-dock">
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={sortByOptions}
              placeholder="Urutkan"
            />
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            className="action-pill-btn primary-pill"
            onClick={handleAddClick}
          >
            <Plus size={15} />
            <span>Tambah Kamar</span>
          </button>
        </div>
      </header>

      {/* ─── 2. FROSTED KPI METRICS DOCK ─────────────────────────── */}
      <div className="kamar-summary-grid">
        <div className="summary-glass-card card-rooms">
          <div className="card-lens-orb orb-blue">
            <BedDouble size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Total Kamar Asrama</span>
            <span className="metric-value">{kamarList.length} <span className="metric-unit">Kamar</span></span>
          </div>
        </div>

        <div className="summary-glass-card card-occupancy">
          <div className="card-lens-orb orb-emerald">
            <Users size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Santri Terisi</span>
            <span className="metric-value">
              {totalTerisi} <span className="metric-sub">/ {totalKapasitas}</span>
              <span className="metric-badge-pct">{persenTerisi}%</span>
            </span>
          </div>
        </div>

        <div className="summary-glass-card card-remaining">
          <div className="card-lens-orb orb-amber">
            <CheckCircle2 size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Sisa Kuota Kamar</span>
            <span className="metric-value">{totalSisa} <span className="metric-unit">Tempat Kosong</span></span>
          </div>
        </div>

        <div className="summary-glass-card card-ratio">
          <div className="card-lens-orb orb-rose">
            <Building size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Komplek Putra : Putri</span>
            <span className="metric-value">
              <span className="text-putra">{totalSantriPutra} L</span>
              <span className="separator">:</span>
              <span className="text-putri">{totalSantriPutri} P</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. SEGMENTED CONTROL TABS DOCK ──────────────────────── */}
      <div className="tactile-segmented-dock">
        <button
          type="button"
          onClick={() => setActiveTab('semua')}
          className={`segmented-tab-btn ${activeTab === 'semua' ? 'active' : ''}`}
        >
          <span>Semua Kamar</span>
          <span className="tab-counter">{kamarList.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('putra')}
          className={`segmented-tab-btn tab-putra ${activeTab === 'putra' ? 'active' : ''}`}
        >
          <span>👦 Komplek Putra</span>
          <span className="tab-counter">
            {kamarList.filter(k => k.jenis === 'Putra').length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('putri')}
          className={`segmented-tab-btn tab-putri ${activeTab === 'putri' ? 'active' : ''}`}
        >
          <span>👧 Komplek Putri</span>
          <span className="tab-counter">
            {kamarList.filter(k => k.jenis === 'Putri').length}
          </span>
        </button>
      </div>

      {/* ─── 4. MAIN CONTENT (ROOM GRIDS) ────────────────────────── */}
      <div className="kamar-content-wrapper">
        {filteredAndSortedKamar.length === 0 ? (
          <div className="tactile-empty-card full-span">
            <div className="empty-bubble-icon">
              <BedDouble size={36} />
            </div>
            <h4>{searchQuery ? 'Tidak Ada Kamar yang Sesuai' : 'Belum Ada Data Kamar'}</h4>
            <p>
              {searchQuery
                ? `Tidak ditemukan kamar asrama yang cocok dengan kata kunci "${searchQuery}".`
                : 'Mulai dengan menambahkan kamar asrama pertama untuk santri pondok.'}
            </p>
            {searchQuery ? (
              <button
                type="button"
                className="action-pill-btn neutral-pill"
                onClick={() => setSearchQuery('')}
              >
                Reset Pencarian
              </button>
            ) : (
              <button
                type="button"
                className="action-pill-btn primary-pill"
                onClick={handleAddClick}
              >
                <Plus size={15} />
                <span>Tambah Kamar Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {(activeTab === 'semua' || activeTab === 'putra') && (
              renderKamarGrid(kamarPutra, 'Kamar Asrama Putra', 'theme-putra')
            )}

            {activeTab === 'semua' && kamarPutra.length > 0 && kamarPutri.length > 0 && (
              <div className="tactile-section-divider" />
            )}

            {(activeTab === 'semua' || activeTab === 'putri') && (
              renderKamarGrid(kamarPutri, 'Kamar Asrama Putri', 'theme-putri')
            )}
          </>
        )}
      </div>

      {/* ─── 5. MODAL EDIT / TAMBAH KAMAR ────────────────────────── */}
      <KamarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editData={editingData}
        isSubmitting={isSubmitting}
        error={modalError}
      />

      {/* ─── 6. MODAL DAFTAR SANTRI ANGGOTA KAMAR ────────────────── */}
      <KamarAnggotaModal
        isOpen={isAnggotaModalOpen}
        onClose={() => setIsAnggotaModalOpen(false)}
        kamarId={selectedKamar?.id}
        initialKamar={selectedKamar}
      />

      {/* ─── 7. APPLE VISIONOS CUSTOM DELETE CONFIRM MODAL ───────── */}
      <CustomModal
        open={deleteConfirm.isOpen}
        onClose={() => !isDeleting && setDeleteConfirm({ isOpen: false, kamarId: null, kamarNama: '' })}
        title="Hapus Kamar Asrama"
        width={440}
        destroyOnClose
      >
        <div className="tactile-delete-dialog">
          <div className="delete-halo-orb">
            <AlertTriangle size={28} />
          </div>
          <h4 className="delete-title">Konfirmasi Hapus Kamar</h4>
          <p className="delete-desc">
            Apakah Anda yakin ingin menghapus kamar <strong>"{deleteConfirm.kamarNama}"</strong>?
          </p>
          <div className="delete-warning-box">
            <p>
              ⚠️ <strong>Perhatian:</strong> Menghapus kamar akan melepaskan penempatan santri yang terdaftar di dalamnya. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="delete-actions-row">
            <button
              type="button"
              className="action-pill-btn neutral-pill"
              onClick={() => setDeleteConfirm({ isOpen: false, kamarId: null, kamarNama: '' })}
              disabled={isDeleting}
            >
              Batal
            </button>
            <button
              type="button"
              className="action-pill-btn danger-pill"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="loading-spinner-sm" />
              ) : (
                <span>Ya, Hapus Kamar</span>
              )}
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default Kamar;

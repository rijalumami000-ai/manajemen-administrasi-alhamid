import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  AlertTriangle, 
  Trophy, 
  RefreshCw, 
  Search, 
  X, 
  Calendar, 
  Users, 
  ShieldAlert, 
  Award,
  ShieldCheck
} from 'lucide-react';
import { pelanggaranService } from '../services/pelanggaranService';
import { PelanggaranTable } from '../components/features/PelanggaranTable';
import { PrestasiTable } from '../components/features/PrestasiTable';
import { PelanggaranModal } from '../components/features/PelanggaranModal';
import { PrestasiModal } from '../components/features/PrestasiModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import { LoadingState, ErrorState, useToast } from '../components/common';
import {
  PelanggaranItem,
  PelanggaranFormData,
  PrestasiItem,
  PrestasiFormData,
  TahunAjaranSimple,
  PelanggaranPrestasiDeleteConfirmState
} from '../types/pelanggaranPrestasi';
import './PelanggaranPrestasi.scss';

export function PelanggaranPrestasi() {
  const toast = useToast();
  const [pelanggaranList, setPelanggaranList] = useState<PelanggaranItem[]>([]);
  const [prestasiList, setPrestasiList] = useState<PrestasiItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pelanggaran' | 'prestasi'>('pelanggaran');

  // Academic Year State
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranSimple[]>([]);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string | number | null>(null);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isPelanggaranModalOpen, setIsPelanggaranModalOpen] = useState(false);
  const [isPrestasiModalOpen, setIsPrestasiModalOpen] = useState(false);
  const [editingPelanggaran, setEditingPelanggaran] = useState<PelanggaranItem | null>(null);
  const [editingPrestasi, setEditingPrestasi] = useState<PrestasiItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pelanggaranModalError, setPelanggaranModalError] = useState('');
  const [prestasiModalError, setPrestasiModalError] = useState('');

  // Custom Delete Confirm State (No browser window.confirm!)
  const [deleteConfirm, setDeleteConfirm] = useState<PelanggaranPrestasiDeleteConfirmState>({
    isOpen: false,
    type: 'pelanggaran',
    id: null,
    namaSantri: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTahunAjaran();
  }, []);

  useEffect(() => {
    if (selectedTahunAjaran !== null) {
      loadData(selectedTahunAjaran);
    }
  }, [selectedTahunAjaran]);

  const loadTahunAjaran = async () => {
    try {
      setLoading(true);
      const list = await pelanggaranService.fetchTahunAjaran();
      setTahunAjaranList(Array.isArray(list) ? list : []);
      const active = list.find((t: TahunAjaranSimple) => t.is_active);
      if (active) {
        setSelectedTahunAjaran(active.id);
      } else if (list.length > 0) {
        setSelectedTahunAjaran(list[0].id);
      } else {
        setSelectedTahunAjaran('all');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat tahun ajaran';
      console.error('Gagal memuat tahun ajaran:', err);
      setError(msg);
      setLoading(false);
    }
  };

  const loadData = async (tahunId: string | number | null) => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        loadPelanggaran(tahunId),
        loadPrestasi(tahunId)
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data';
      console.error('Gagal memuat data:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadPelanggaran = async (tahunId: string | number | null) => {
    const tid = tahunId === 'all' ? null : tahunId;
    const data = await pelanggaranService.fetchPelanggaran(tid);
    setPelanggaranList(Array.isArray(data) ? data : []);
  };

  const loadPrestasi = async (tahunId: string | number | null) => {
    const tid = tahunId === 'all' ? null : tahunId;
    const data = await pelanggaranService.fetchPrestasi(tid);
    setPrestasiList(Array.isArray(data) ? data : []);
  };

  const handleAddPelanggaranClick = () => {
    setEditingPelanggaran(null);
    setPelanggaranModalError('');
    setIsPelanggaranModalOpen(true);
  };

  const handleEditPelanggaranClick = (pelanggaran: PelanggaranItem) => {
    setEditingPelanggaran(pelanggaran);
    setPelanggaranModalError('');
    setIsPelanggaranModalOpen(true);
  };

  const handleDeletePelanggaranClick = (id: number, namaSantri: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'pelanggaran',
      id,
      namaSantri
    });
  };

  const handlePelanggaranSubmit = async (data: PelanggaranFormData) => {
    setIsSubmitting(true);
    setPelanggaranModalError('');

    try {
      if (editingPelanggaran) {
        await pelanggaranService.updatePelanggaran(editingPelanggaran.id, data);
        toast.success('Catatan pelanggaran berhasil diperbarui.');
      } else {
        await pelanggaranService.createPelanggaran(data);
        toast.success('Catatan pelanggaran berhasil ditambahkan.');
      }
      setIsPelanggaranModalOpen(false);
      await loadPelanggaran(selectedTahunAjaran);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan data pelanggaran';
      setPelanggaranModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPrestasiClick = () => {
    setEditingPrestasi(null);
    setPrestasiModalError('');
    setIsPrestasiModalOpen(true);
  };

  const handleEditPrestasiClick = (prestasi: PrestasiItem) => {
    setEditingPrestasi(prestasi);
    setPrestasiModalError('');
    setIsPrestasiModalOpen(true);
  };

  const handleDeletePrestasiClick = (id: number, namaSantri: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'prestasi',
      id,
      namaSantri
    });
  };

  const handlePrestasiSubmit = async (data: PrestasiFormData) => {
    setIsSubmitting(true);
    setPrestasiModalError('');

    try {
      if (editingPrestasi) {
        await pelanggaranService.updatePrestasi(editingPrestasi.id, data);
        toast.success('Catatan prestasi berhasil diperbarui.');
      } else {
        await pelanggaranService.createPrestasi(data);
        toast.success('Catatan prestasi berhasil ditambahkan.');
      }
      setIsPrestasiModalOpen(false);
      await loadPrestasi(selectedTahunAjaran);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan data prestasi';
      setPrestasiModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      setIsDeleting(true);
      if (deleteConfirm.type === 'pelanggaran') {
        await pelanggaranService.deletePelanggaran(deleteConfirm.id);
        toast.success(`Catatan pelanggaran santri "${deleteConfirm.namaSantri}" berhasil dihapus.`);
        await loadPelanggaran(selectedTahunAjaran);
      } else {
        await pelanggaranService.deletePrestasi(deleteConfirm.id);
        toast.success(`Catatan prestasi santri "${deleteConfirm.namaSantri}" berhasil dihapus.`);
        await loadPrestasi(selectedTahunAjaran);
      }
      setDeleteConfirm({ isOpen: false, type: 'pelanggaran', id: null, namaSantri: '' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus data';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter lists based on search query
  const filteredPelanggaran = useMemo(() => {
    if (!searchQuery.trim()) return pelanggaranList;
    const q = searchQuery.toLowerCase().trim();
    return pelanggaranList.filter(p => 
      (p.nama_santri && p.nama_santri.toLowerCase().includes(q)) ||
      (p.nis && p.nis.toLowerCase().includes(q)) ||
      (p.jenis && p.jenis.toLowerCase().includes(q)) ||
      (p.deskripsi && p.deskripsi.toLowerCase().includes(q)) ||
      (p.sanksi && p.sanksi.toLowerCase().includes(q))
    );
  }, [pelanggaranList, searchQuery]);

  const filteredPrestasi = useMemo(() => {
    if (!searchQuery.trim()) return prestasiList;
    const q = searchQuery.toLowerCase().trim();
    return prestasiList.filter(p => 
      (p.nama_santri && p.nama_santri.toLowerCase().includes(q)) ||
      (p.nis && p.nis.toLowerCase().includes(q)) ||
      (p.jenis && p.jenis.toLowerCase().includes(q)) ||
      (p.deskripsi && p.deskripsi.toLowerCase().includes(q)) ||
      (p.penghargaan && p.penghargaan.toLowerCase().includes(q))
    );
  }, [prestasiList, searchQuery]);

  // Unique santri counts
  const uniquePelanggar = useMemo(() => {
    return new Set(pelanggaranList.map(p => p.santri_id)).size;
  }, [pelanggaranList]);

  const uniqueBerprestasi = useMemo(() => {
    return new Set(prestasiList.map(p => p.santri_id)).size;
  }, [prestasiList]);

  const tahunOptions = [
    { value: 'all', label: 'Semua Tahun Ajaran' },
    ...tahunAjaranList.map(t => ({
      value: String(t.id),
      label: `${t.kode} ${t.is_active ? '(Aktif)' : ''}`
    }))
  ];

  if (loading && !selectedTahunAjaran && tahunAjaranList.length === 0) {
    return <LoadingState message="Memuat data pelanggaran & prestasi..." />;
  }

  if (error && tahunAjaranList.length === 0) {
    return <ErrorState message={error} onRetry={loadTahunAjaran} />;
  }

  return (
    <div className="pelanggaran-prestasi-page tactile-redesign">
      {/* ─── 1. TACTILE PAGE HEADER (Option A Apple Dock Header) ─── */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Pelanggaran & Prestasi</h2>
          <p className="page-subtitle">
            Pencatatan rekam jejak kedisiplinan, sanksi pelanggaran, dan apresiasi capaian prestasi santri
          </p>
        </div>

        <div className="header-actions-row">
          {/* Tactile Inset Search Pill */}
          <div className="tactile-search-pill">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Cari santri, NIS, jenis, sanksi..."
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

          {/* Tahun Ajaran Selector */}
          <div className="header-ta-dock">
            <CustomSelect
              value={selectedTahunAjaran ? String(selectedTahunAjaran) : 'all'}
              onChange={(val) => setSelectedTahunAjaran(val === 'all' ? 'all' : Number(val))}
              options={tahunOptions}
              placeholder="Pilih Tahun Ajaran"
            />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className="action-pill-btn neutral-pill refresh-btn"
            onClick={() => loadData(selectedTahunAjaran)}
            disabled={loading}
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            <span>Segarkan</span>
          </button>

          {/* Primary Action Button */}
          {activeTab === 'pelanggaran' ? (
            <button
              type="button"
              className="action-pill-btn danger-gradient-pill"
              onClick={handleAddPelanggaranClick}
            >
              <Plus size={15} />
              <span>Catat Pelanggaran</span>
            </button>
          ) : (
            <button
              type="button"
              className="action-pill-btn gold-gradient-pill"
              onClick={handleAddPrestasiClick}
            >
              <Plus size={15} />
              <span>Catat Prestasi</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── 2. FROSTED KPI GLASS CARDS ──────────────────────────── */}
      <div className="pelanggaran-prestasi-kpi-grid">
        <div className="summary-glass-card card-pelanggaran">
          <div className="card-lens-orb orb-red">
            <ShieldAlert size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Total Pelanggaran</span>
            <span className="metric-value">
              {pelanggaranList.length} <span className="metric-unit">Kasus</span>
            </span>
          </div>
        </div>

        <div className="summary-glass-card card-prestasi">
          <div className="card-lens-orb orb-amber">
            <Trophy size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Total Prestasi</span>
            <span className="metric-value">
              {prestasiList.length} <span className="metric-unit">Penghargaan</span>
            </span>
          </div>
        </div>

        <div className="summary-glass-card card-santri-pelanggar">
          <div className="card-lens-orb orb-rose">
            <Users size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Santri Tercatat Pelanggaran</span>
            <span className="metric-value">
              {uniquePelanggar} <span className="metric-unit">Santri</span>
            </span>
          </div>
        </div>

        <div className="summary-glass-card card-santri-berprestasi">
          <div className="card-lens-orb orb-emerald">
            <Award size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Santri Peraih Prestasi</span>
            <span className="metric-value">
              {uniqueBerprestasi} <span className="metric-unit">Santri</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. SEGMENTED CONTROL TABS DOCK ──────────────────────── */}
      <div className="tactile-segmented-dock">
        <button
          type="button"
          onClick={() => setActiveTab('pelanggaran')}
          className={`segmented-tab-btn tab-pelanggaran ${activeTab === 'pelanggaran' ? 'active' : ''}`}
        >
          <AlertTriangle size={15} />
          <span>Buku Pelanggaran</span>
          <span className="tab-counter counter-red">{pelanggaranList.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('prestasi')}
          className={`segmented-tab-btn tab-prestasi ${activeTab === 'prestasi' ? 'active' : ''}`}
        >
          <Trophy size={15} />
          <span>Buku Prestasi & Apresiasi</span>
          <span className="tab-counter counter-amber">{prestasiList.length}</span>
        </button>
      </div>

      {/* ─── 4. MAIN CONTENT (TABLES) ────────────────────────────── */}
      <div className="pelanggaran-prestasi-content">
        {activeTab === 'pelanggaran' ? (
          <PelanggaranTable
            data={filteredPelanggaran}
            onEdit={handleEditPelanggaranClick}
            onDelete={handleDeletePelanggaranClick}
          />
        ) : (
          <PrestasiTable
            data={filteredPrestasi}
            onEdit={handleEditPrestasiClick}
            onDelete={handleDeletePrestasiClick}
          />
        )}
      </div>

      {/* ─── 5. MODAL TAMBAH / EDIT PELANGGARAN ──────────────────── */}
      <PelanggaranModal
        isOpen={isPelanggaranModalOpen}
        onClose={() => setIsPelanggaranModalOpen(false)}
        onSubmit={handlePelanggaranSubmit}
        editData={editingPelanggaran}
        isSubmitting={isSubmitting}
        error={pelanggaranModalError}
        tahunAjaranList={tahunAjaranList}
        defaultTahunAjaranId={selectedTahunAjaran === 'all' ? (tahunAjaranList.find(t => t.is_active)?.id || null) : selectedTahunAjaran}
      />

      {/* ─── 6. MODAL TAMBAH / EDIT PRESTASI ─────────────────────── */}
      <PrestasiModal
        isOpen={isPrestasiModalOpen}
        onClose={() => setIsPrestasiModalOpen(false)}
        onSubmit={handlePrestasiSubmit}
        editData={editingPrestasi}
        isSubmitting={isSubmitting}
        error={prestasiModalError}
        tahunAjaranList={tahunAjaranList}
        defaultTahunAjaranId={selectedTahunAjaran === 'all' ? (tahunAjaranList.find(t => t.is_active)?.id || null) : selectedTahunAjaran}
      />

      {/* ─── 7. APPLE VISIONOS DELETE CONFIRM MODAL ──────────────── */}
      <CustomModal
        open={deleteConfirm.isOpen}
        onClose={() => !isDeleting && setDeleteConfirm({ isOpen: false, type: 'pelanggaran', id: null, namaSantri: '' })}
        title={deleteConfirm.type === 'pelanggaran' ? 'Hapus Catatan Pelanggaran' : 'Hapus Catatan Prestasi'}
        width={440}
        destroyOnClose
      >
        <div className="tactile-delete-dialog">
          <div className="delete-halo-orb">
            <AlertTriangle size={28} />
          </div>
          <h4 className="delete-title">
            {deleteConfirm.type === 'pelanggaran' ? 'Hapus Pelanggaran Santri' : 'Hapus Prestasi Santri'}
          </h4>
          <p className="delete-desc">
            Apakah Anda yakin ingin menghapus data {deleteConfirm.type} untuk santri <strong>"{deleteConfirm.namaSantri}"</strong>?
          </p>
          <div className="delete-warning-box">
            <p>
              ⚠️ Data riwayat kedisiplinan dan capaian ini akan dihapus permanen dari buku induk kedisiplinan santri.
            </p>
          </div>
          <div className="delete-actions-row">
            <button
              type="button"
              className="action-pill-btn neutral-pill"
              onClick={() => setDeleteConfirm({ isOpen: false, type: 'pelanggaran', id: null, namaSantri: '' })}
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
                <span>Ya, Hapus Data</span>
              )}
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default PelanggaranPrestasi;

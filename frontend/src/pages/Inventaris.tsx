import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit,
  Trash2,
  MapPin,
  User,
  Building,
  BookOpen,
  BookmarkCheck,
  RotateCcw,
  Layers,
  X,
  FileText
} from 'lucide-react';
import { inventarisService } from '../services/inventarisService';
import { InventarisModal } from '../components/features/InventarisModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import { LoadingState, ErrorState, useToast } from '../components/common';
import {
  InventarisItem,
  InventarisFormData,
  InventarisRekapResponse,
  InventarisKategori,
  InventarisDeleteConfirmState
} from '../types/inventaris';
import './Inventaris.scss';

export function Inventaris() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<InventarisKategori>('pondok');
  const [items, setItems] = useState<InventarisItem[]>([]);
  const [rekap, setRekap] = useState<InventarisRekapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<InventarisItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<InventarisDeleteConfirmState>({
    isOpen: false,
    itemId: null,
    itemNama: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [itemList, rekapData] = await Promise.all([
        inventarisService.fetchInventaris({
          kategori: activeTab,
          kondisi: filterKondisi || undefined,
          search: search || undefined
        }),
        inventarisService.fetchRekap()
      ]);
      setItems(Array.isArray(itemList) ? itemList : []);
      setRekap(rekapData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data inventaris';
      console.error('Gagal memuat inventaris:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterKondisi, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddClick = () => {
    setEditingData(null);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (item: InventarisItem) => {
    setEditingData(item);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number, nama: string) => {
    setDeleteConfirm({
      isOpen: true,
      itemId: id,
      itemNama: nama
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.itemId) return;

    try {
      setIsDeleting(true);
      await inventarisService.deleteInventaris(deleteConfirm.itemId);
      toast.success(`Barang "${deleteConfirm.itemNama}" berhasil dihapus dari inventaris.`);
      setDeleteConfirm({ isOpen: false, itemId: null, itemNama: '' });
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus barang inventaris';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSubmit = async (data: InventarisFormData) => {
    setIsSubmitting(true);
    setModalError('');

    try {
      if (editingData) {
        await inventarisService.updateInventaris(editingData.id, data);
        toast.success(`Barang "${data.nama_barang}" berhasil diperbarui.`);
      } else {
        await inventarisService.createInventaris(data);
        toast.success(`Barang "${data.nama_barang}" berhasil ditambahkan.`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan data inventaris';
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find rekap for active tab
  const activeTabRekap = useMemo(() => {
    const found = rekap?.kategori?.find(k => k.kategori.toLowerCase() === activeTab);
    if (found) return found;

    return {
      kategori: activeTab,
      total_item: items.length,
      total_kuantitas: items.reduce((a, b) => a + (Number(b.jumlah) || 0), 0),
      baik: items.filter(i => i.kondisi === 'Baik').reduce((a, b) => a + (Number(b.jumlah) || 0), 0),
      rusak_ringan: items.filter(i => i.kondisi === 'Rusak Ringan').reduce((a, b) => a + (Number(b.jumlah) || 0), 0),
      rusak_berat: items.filter(i => i.kondisi === 'Rusak Berat').reduce((a, b) => a + (Number(b.jumlah) || 0), 0)
    };
  }, [rekap, activeTab, items]);

  const kondisiOptions = [
    { label: 'Semua Kondisi', value: '' },
    { label: '🟢 Hanya Kondisi Baik', value: 'Baik' },
    { label: '🟡 Rusak Ringan', value: 'Rusak Ringan' },
    { label: '🔴 Rusak Berat', value: 'Rusak Berat' }
  ];

  const getKondisiBadge = (kondisi: string) => {
    switch (kondisi) {
      case 'Baik':
        return (
          <span className="kondisi-badge-pill baik">
            <CheckCircle2 size={12} className="inline-badge-icon" />
            <span>Baik</span>
          </span>
        );
      case 'Rusak Ringan':
        return (
          <span className="kondisi-badge-pill rusak-ringan">
            <AlertTriangle size={12} className="inline-badge-icon" />
            <span>Rusak Ringan</span>
          </span>
        );
      case 'Rusak Berat':
        return (
          <span className="kondisi-badge-pill rusak-berat">
            <XCircle size={12} className="inline-badge-icon" />
            <span>Rusak Berat</span>
          </span>
        );
      default:
        return <span className="kondisi-badge-pill">{kondisi}</span>;
    }
  };

  return (
    <div className="inventaris-page tactile-redesign">
      {/* ─── 1. TACTILE PAGE HEADER (Option A Dock Header) ───────── */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Inventaris Sarana & Prasarana</h2>
          <p className="page-subtitle">
            Pencatatan dan monitoring aset fisik Pondok, Madrasah Diniyah, dan Pendidikan Murottilil Qur'an (PMQ)
          </p>
        </div>

        <div className="header-actions-row">
          <button
            type="button"
            className="action-pill-btn primary-pill"
            onClick={handleAddClick}
          >
            <Plus size={15} />
            <span>Tambah Barang</span>
          </button>
        </div>
      </header>

      {/* ─── 2. SEGMENTED CONTROL TABS DOCK (3 Main Kategori) ─────── */}
      <div className="tactile-segmented-dock">
        <button
          type="button"
          className={`segmented-tab-btn tab-pondok ${activeTab === 'pondok' ? 'active' : ''}`}
          onClick={() => setActiveTab('pondok')}
        >
          <Building size={15} />
          <span>Inventaris Pondok</span>
          <span className="tab-counter">
            {rekap?.kategori?.find(k => k.kategori === 'pondok')?.total_item || 0}
          </span>
        </button>

        <button
          type="button"
          className={`segmented-tab-btn tab-madin ${activeTab === 'madin' ? 'active' : ''}`}
          onClick={() => setActiveTab('madin')}
        >
          <BookOpen size={15} />
          <span>Inventaris Madin</span>
          <span className="tab-counter">
            {rekap?.kategori?.find(k => k.kategori === 'madin')?.total_item || 0}
          </span>
        </button>

        <button
          type="button"
          className={`segmented-tab-btn tab-pmq ${activeTab === 'pmq' ? 'active' : ''}`}
          onClick={() => setActiveTab('pmq')}
        >
          <BookmarkCheck size={15} />
          <span>Inventaris PMQ</span>
          <span className="tab-counter">
            {rekap?.kategori?.find(k => k.kategori === 'pmq')?.total_item || 0}
          </span>
        </button>
      </div>

      {/* ─── 3. FROSTED KPI GLASS CARDS ──────────────────────────── */}
      <div className="inventaris-kpi-grid">
        <div className="summary-glass-card card-total">
          <div className="card-lens-orb orb-blue">
            <Package size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Macam Barang</span>
            <span className="metric-value">
              {activeTabRekap.total_item} <span className="metric-unit">Jenis</span>
            </span>
          </div>
        </div>

        <div className="summary-glass-card card-kuantitas">
          <div className="card-lens-orb orb-indigo">
            <Layers size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Total Kuantitas</span>
            <span className="metric-value">
              {activeTabRekap.total_kuantitas} <span className="metric-unit">Unit / Buah</span>
            </span>
          </div>
        </div>

        <div className="summary-glass-card card-baik">
          <div className="card-lens-orb orb-emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Kondisi Baik</span>
            <span className="metric-value">
              {activeTabRekap.baik} <span className="metric-unit">Unit</span>
            </span>
          </div>
        </div>

        <div className="summary-glass-card card-rusak">
          <div className="card-lens-orb orb-amber">
            <AlertTriangle size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Rusak (Perlu Servis)</span>
            <span className="metric-value">
              {Number(activeTabRekap.rusak_ringan) + Number(activeTabRekap.rusak_berat)} <span className="metric-unit">Unit</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── 4. SEARCH & FILTER TOOLBAR ──────────────────────────── */}
      <div className="tactile-filter-toolbar">
        <div className="tactile-search-pill">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Cari barang, kode, lokasi, atau penanggung jawab..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearch('')}
              title="Hapus pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="toolbar-controls-dock">
          <div className="filter-select-wrap">
            <CustomSelect
              value={filterKondisi}
              onChange={val => setFilterKondisi(val)}
              options={kondisiOptions}
              placeholder="Filter Kondisi"
            />
          </div>

          {(search || filterKondisi) && (
            <button
              type="button"
              className="action-pill-btn neutral-pill reset-btn"
              onClick={() => { setSearch(''); setFilterKondisi(''); }}
              title="Reset semua filter"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 5. VISIONOS LIQUID GLASS TABLE CONTAINER ────────────── */}
      <div className="inventaris-table-card tactile-glass-table-container">
        <div className="table-specular-edge" />

        {loading ? (
          <div className="table-state-wrapper">
            <LoadingState message="Memuat daftar barang inventaris..." />
          </div>
        ) : error ? (
          <div className="table-state-wrapper">
            <ErrorState message={error} onRetry={loadData} />
          </div>
        ) : items.length === 0 ? (
          <div className="tactile-empty-card">
            <div className="empty-bubble-icon">
              <Package size={36} />
            </div>
            <h4>{search || filterKondisi ? 'Tidak Ada Barang yang Cocok' : `Belum Ada Data Inventaris ${activeTab.toUpperCase()}`}</h4>
            <p>
              {search || filterKondisi
                ? 'Coba sesuaikan kata kunci pencarian atau reset filter kondisi barang.'
                : `Belum ada barang yang tercatat pada bagian Inventaris ${activeTab.toUpperCase()}.`}
            </p>
            {search || filterKondisi ? (
              <button
                type="button"
                className="action-pill-btn neutral-pill"
                onClick={() => { setSearch(''); setFilterKondisi(''); }}
              >
                Reset Filter
              </button>
            ) : (
              <button
                type="button"
                className="action-pill-btn primary-pill"
                onClick={handleAddClick}
              >
                <Plus size={15} />
                <span>Tambah Barang Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive-wrapper custom-scrollbar">
            <table className="inventaris-tactile-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                  <th>Nama Barang & Kode</th>
                  <th style={{ width: '130px' }}>Jumlah</th>
                  <th style={{ width: '150px' }}>Kondisi Fisik</th>
                  <th>Lokasi Penempatan</th>
                  <th>Penanggung Jawab</th>
                  <th>Keterangan</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="tactile-table-row">
                    <td className="col-no">{idx + 1}</td>
                    <td className="col-item-name">
                      <div className="item-title-text">{item.nama_barang}</div>
                      {item.kode_barang && (
                        <span className="item-code-badge">{item.kode_barang}</span>
                      )}
                    </td>
                    <td className="col-qty">
                      <span className="qty-value"><strong>{item.jumlah}</strong></span>
                      <span className="qty-unit">{item.satuan || 'Unit'}</span>
                    </td>
                    <td>{getKondisiBadge(item.kondisi)}</td>
                    <td className="col-meta-info">
                      {item.lokasi ? (
                        <span className="meta-badge-inline" title={item.lokasi}>
                          <MapPin size={12} className="meta-icon pin" />
                          <span>{item.lokasi}</span>
                        </span>
                      ) : (
                        <span className="text-empty">-</span>
                      )}
                    </td>
                    <td className="col-meta-info">
                      {item.penanggung_jawab ? (
                        <span className="meta-badge-inline" title={item.penanggung_jawab}>
                          <User size={12} className="meta-icon user" />
                          <span>{item.penanggung_jawab}</span>
                        </span>
                      ) : (
                        <span className="text-empty">-</span>
                      )}
                    </td>
                    <td className="col-desc-text" title={item.keterangan || '-'}>
                      {item.keterangan || '-'}
                    </td>
                    <td className="col-actions">
                      <div className="actions-cell-wrap">
                        <button
                          type="button"
                          className="btn-table-act btn-act-edit"
                          onClick={() => handleEditClick(item)}
                          title="Edit barang inventaris"
                          aria-label="Edit barang"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-table-act btn-act-delete"
                          onClick={() => handleDeleteClick(item.id, item.nama_barang)}
                          title="Hapus barang inventaris"
                          aria-label="Hapus barang"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Summary Bar */}
        {items.length > 0 && (
          <div className="tactile-table-footer">
            <span className="footer-summary-text">
              Menampilkan <strong>{items.length}</strong> jenis barang di Inventaris {activeTab.toUpperCase()} &bull; Total <strong>{items.reduce((a, b) => a + (Number(b.jumlah) || 0), 0)}</strong> unit aset fisik
            </span>
          </div>
        )}
      </div>

      {/* ─── 6. MODAL TAMBAH / EDIT INVENTARIS ────────────────────── */}
      <InventarisModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editData={editingData}
        defaultCategory={activeTab}
        isSubmitting={isSubmitting}
        error={modalError}
      />

      {/* ─── 7. APPLE VISIONOS DELETE CONFIRM MODAL ──────────────── */}
      <CustomModal
        open={deleteConfirm.isOpen}
        onClose={() => !isDeleting && setDeleteConfirm({ isOpen: false, itemId: null, itemNama: '' })}
        title="Hapus Barang Inventaris"
        width={440}
        destroyOnClose
      >
        <div className="tactile-delete-dialog">
          <div className="delete-halo-orb">
            <AlertTriangle size={28} />
          </div>
          <h4 className="delete-title">Konfirmasi Hapus Barang</h4>
          <p className="delete-desc">
            Apakah Anda yakin ingin menghapus <strong>"{deleteConfirm.itemNama}"</strong> dari daftar inventaris?
          </p>
          <div className="delete-warning-box">
            <p>
              ⚠️ Data barang yang dihapus akan hilang dari catatan aset fisik dan kalkulasi rekapitulasi sarana & prasarana pesantren.
            </p>
          </div>
          <div className="delete-actions-row">
            <button
              type="button"
              className="action-pill-btn neutral-pill"
              onClick={() => setDeleteConfirm({ isOpen: false, itemId: null, itemNama: '' })}
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
                <span>Ya, Hapus Barang</span>
              )}
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default Inventaris;

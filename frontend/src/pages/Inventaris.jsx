import React, { useState, useEffect, useCallback } from 'react';
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
  RotateCcw
} from 'lucide-react';
import { inventarisService } from '../services/inventarisService';
import { InventarisModal } from '../components/features/InventarisModal';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../components/common';
import './Inventaris.scss';

export function Inventaris() {
  const [activeTab, setActiveTab] = useState('pondok'); // 'pondok' | 'madin' | 'pmq'
  const [items, setItems] = useState([]);
  const [rekap, setRekap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

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
      setItems(itemList);
      setRekap(rekapData);
    } catch (err) {
      console.error('Gagal memuat inventaris:', err);
      setError(err.message || 'Gagal memuat data inventaris');
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

  const handleEditClick = (item) => {
    setEditingData(item);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id, nama) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${nama}" dari inventaris?`)) return;

    try {
      await inventarisService.deleteInventaris(id);
      await loadData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus barang inventaris');
    }
  };

  const handleModalSubmit = async (data) => {
    setIsSubmitting(true);
    setModalError('');

    try {
      if (editingData) {
        await inventarisService.updateInventaris(editingData.id, data);
      } else {
        await inventarisService.createInventaris(data);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan data inventaris');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find rekap for active tab
  const activeTabRekap = rekap?.kategori?.find(k => k.kategori.toLowerCase() === activeTab) || {
    total_item: items.length,
    total_kuantitas: items.reduce((a, b) => a + (Number(b.jumlah) || 0), 0),
    baik: items.filter(i => i.kondisi === 'Baik').reduce((a, b) => a + (Number(b.jumlah) || 0), 0),
    rusak_ringan: items.filter(i => i.kondisi === 'Rusak Ringan').reduce((a, b) => a + (Number(b.jumlah) || 0), 0),
    rusak_berat: items.filter(i => i.kondisi === 'Rusak Berat').reduce((a, b) => a + (Number(b.jumlah) || 0), 0)
  };

  const getKondisiBadge = (kondisi) => {
    switch (kondisi) {
      case 'Baik':
        return <span className="kondisi-badge baik"><CheckCircle2 size={12} /> Baik</span>;
      case 'Rusak Ringan':
        return <span className="kondisi-badge rusak-ringan"><AlertTriangle size={12} /> Rusak Ringan</span>;
      case 'Rusak Berat':
        return <span className="kondisi-badge rusak-berat"><XCircle size={12} /> Rusak Berat</span>;
      default:
        return <span className="kondisi-badge">{kondisi}</span>;
    }
  };

  return (
    <div className="inventaris-page">
      <PageHeader
        title="📦 Inventaris Sarana & Prasarana Pesantren"
        subtitle="Pencatatan dan monitoring aset fisik Pondok, Madrasah Diniyah, dan Pendidikan Murottilil Qur'an (PMQ)"
        extra={
          <button type="button" className="btn-custom btn-primary" onClick={handleAddClick}>
            <Plus size={16} /> Tambah Barang
          </button>
        }
      />

      {/* 3 Main Sections Tabs */}
      <div className="inventaris-tabs-bar">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'pondok' ? 'active tab-pondok' : ''}`}
          onClick={() => setActiveTab('pondok')}
        >
          <Building size={16} />
          <span>Inventaris Pondok</span>
          <span className="tab-badge">
            {rekap?.kategori?.find(k => k.kategori === 'pondok')?.total_item || 0}
          </span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'madin' ? 'active tab-madin' : ''}`}
          onClick={() => setActiveTab('madin')}
        >
          <BookOpen size={16} />
          <span>Inventaris Madin</span>
          <span className="tab-badge">
            {rekap?.kategori?.find(k => k.kategori === 'madin')?.total_item || 0}
          </span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'pmq' ? 'active tab-pmq' : ''}`}
          onClick={() => setActiveTab('pmq')}
        >
          <BookmarkCheck size={16} />
          <span>Inventaris PMQ</span>
          <span className="tab-badge">
            {rekap?.kategori?.find(k => k.kategori === 'pmq')?.total_item || 0}
          </span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="inventaris-kpi-grid">
        <div className="kpi-card total">
          <div className="kpi-icon">
            <Package size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Macam Barang</span>
            <span className="kpi-val">{activeTabRekap.total_item} Jenis</span>
          </div>
        </div>

        <div className="kpi-card kuantitas">
          <div className="kpi-icon">
            <Package size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Kuantitas</span>
            <span className="kpi-val">{activeTabRekap.total_kuantitas} Unit</span>
          </div>
        </div>

        <div className="kpi-card baik">
          <div className="kpi-icon">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Kondisi Baik</span>
            <span className="kpi-val">{activeTabRekap.baik} Unit</span>
          </div>
        </div>

        <div className="kpi-card rusak">
          <div className="kpi-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Rusak (Perlu Servis)</span>
            <span className="kpi-val">
              {Number(activeTabRekap.rusak_ringan) + Number(activeTabRekap.rusak_berat)} Unit
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="inventaris-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Cari barang, kode, lokasi, atau penanggung jawab..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            value={filterKondisi}
            onChange={e => setFilterKondisi(e.target.value)}
            className="filter-select"
          >
            <option value="">Semua Kondisi</option>
            <option value="Baik">Hanya Kondisi Baik</option>
            <option value="Rusak Ringan">Rusak Ringan</option>
            <option value="Rusak Berat">Rusak Berat</option>
          </select>

          {(search || filterKondisi) && (
            <button
              type="button"
              className="btn-reset-filter"
              onClick={() => { setSearch(''); setFilterKondisi(''); }}
              title="Reset filter"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="inventaris-table-container">
        {loading ? (
          <LoadingState message="Memuat daftar inventaris..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : items.length === 0 ? (
          <EmptyState
            description={`Belum ada data barang di Inventaris ${activeTab.toUpperCase()}`}
            action={
              <button type="button" className="btn-custom btn-primary" onClick={handleAddClick}>
                <Plus size={16} /> Tambah Barang Pertama
              </button>
            }
          />
        ) : (
          <table className="inventaris-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Barang & Kode</th>
                <th>Jumlah</th>
                <th>Kondisi</th>
                <th>Lokasi</th>
                <th>Penanggung Jawab</th>
                <th>Keterangan</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="col-no">{idx + 1}</td>
                  <td className="col-name">
                    <div className="item-title">{item.nama_barang}</div>
                    {item.kode_barang && (
                      <span className="item-code">{item.kode_barang}</span>
                    )}
                  </td>
                  <td className="col-qty">
                    <strong>{item.jumlah}</strong> {item.satuan || 'Unit'}
                  </td>
                  <td>{getKondisiBadge(item.kondisi)}</td>
                  <td className="col-location">
                    {item.lokasi ? (
                      <span><MapPin size={12} className="inline-icon" /> {item.lokasi}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="col-pj">
                    {item.penanggung_jawab ? (
                      <span><User size={12} className="inline-icon" /> {item.penanggung_jawab}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="col-desc" title={item.keterangan || '-'}>
                    {item.keterangan || '-'}
                  </td>
                  <td className="col-actions">
                    <button
                      type="button"
                      className="btn-action edit"
                      onClick={() => handleEditClick(item)}
                      title="Edit barang"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-action delete"
                      onClick={() => handleDeleteClick(item.id, item.nama_barang)}
                      title="Hapus barang"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Tambah / Edit */}
      <InventarisModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editData={editingData}
        defaultCategory={activeTab}
        isSubmitting={isSubmitting}
        error={modalError}
      />
    </div>
  );
}

export default Inventaris;

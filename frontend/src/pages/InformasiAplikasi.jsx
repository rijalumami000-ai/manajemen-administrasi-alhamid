import { useState, useEffect } from 'react';
import {
  HelpCircle, Info, Code, Plus, Search, Edit2, Trash2, CheckCircle2,
  AlertCircle, X, ExternalLink, RefreshCw, Layers
} from 'lucide-react';
import { appContentService } from '../services/appContentService';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import './InformasiAplikasi.scss';

export default function InformasiAplikasi() {
  const [activeTab, setActiveTab] = useState('pusat_bantuan'); // 'pusat_bantuan' | 'tentang' | 'pengembang'
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    section: 'pusat_bantuan',
    category: '',
    title: '',
    content: '',
    icon: 'info',
    order_index: 0,
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchContents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await appContentService.getAll({ section: activeTab, search: search || undefined });
      setContents(data);
    } catch (err) {
      setError(err.message || 'Gagal memuat konten aplikasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchContents();
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      section: activeTab,
      category: activeTab === 'pusat_bantuan' ? 'Akademik' : 'Profil Aplikasi',
      title: '',
      content: '',
      icon: activeTab === 'pengembang' ? 'code' : 'info',
      order_index: (contents.length + 1),
      is_active: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      section: item.section,
      category: item.category || '',
      title: item.title || '',
      content: item.content || '',
      icon: item.icon || 'info',
      order_index: item.order_index ?? 0,
      is_active: item.is_active !== false
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Judul dan isi konten wajib diisi.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingItem) {
        await appContentService.update(editingItem.id, formData);
        showToast('Konten berhasil diperbarui!');
      } else {
        await appContentService.create(formData);
        showToast('Konten berhasil ditambahkan!');
      }
      setModalOpen(false);
      fetchContents();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan konten.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await appContentService.delete(id);
      showToast('Konten berhasil dihapus.');
      setDeleteConfirmId(null);
      fetchContents();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus konten.', 'error');
    }
  };

  return (
    <div className="info-app-page">
      {toast && (
        <div className={`info-app-toast info-app-toast--${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      <PageHeader
        title="Pusat Bantuan & Konten Alhamid One"
        subtitle="Kelola panduan fitur, dokumentasi Pusat Bantuan, profil Tentang, dan informasi Pengembang (Alhamid Studio Code) yang sinkron langsung ke aplikasi mobile."
        action={
          <button className="btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Tambah Konten</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="info-app-tabs">
        <button
          className={`info-app-tab ${activeTab === 'pusat_bantuan' ? 'active' : ''}`}
          onClick={() => setActiveTab('pusat_bantuan')}
        >
          <HelpCircle size={18} />
          <span>Pusat Bantuan ({activeTab === 'pusat_bantuan' ? contents.length : 'Panduan'})</span>
        </button>
        <button
          className={`info-app-tab ${activeTab === 'tentang' ? 'active' : ''}`}
          onClick={() => setActiveTab('tentang')}
        >
          <Info size={18} />
          <span>Tentang Aplikasi</span>
        </button>
        <button
          className={`info-app-tab ${activeTab === 'pengembang' ? 'active' : ''}`}
          onClick={() => setActiveTab('pengembang')}
        >
          <Code size={18} />
          <span>Pengembang (Alhamid Studio Code)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="info-app-toolbar">
        <form onSubmit={handleSearchSubmit} className="info-app-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={`Cari di ${activeTab === 'pusat_bantuan' ? 'Pusat Bantuan' : activeTab === 'tentang' ? 'Tentang' : 'Pengembang'}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); fetchContents(); }}>
              <X size={14} />
            </button>
          )}
        </form>

        <button className="btn-secondary btn-icon" onClick={fetchContents} title="Muat Ulang">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Content List */}
      {loading ? (
        <LoadingState message="Memuat konten..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchContents} />
      ) : contents.length === 0 ? (
        <div className="info-app-empty">
          <Layers size={48} className="empty-icon" />
          <h3>Belum Ada Konten</h3>
          <p>Belum ada data untuk segmen ini. Silakan klik "Tambah Konten" untuk membuat panduan baru.</p>
        </div>
      ) : (
        <div className="info-app-grid">
          {contents.map((item) => (
            <div key={item.id} className={`info-app-card ${!item.is_active ? 'inactive' : ''}`}>
              <div className="card-top">
                <span className="card-category">{item.category || 'Umum'}</span>
                <span className="card-order">Urutan #{item.order_index}</span>
              </div>
              <h3 className="card-title">{item.title}</h3>
              <p className="card-body-text">{item.content}</p>
              
              <div className="card-actions">
                <span className={`status-pill ${item.is_active ? 'active' : 'inactive'}`}>
                  {item.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
                <div className="action-buttons">
                  <button className="btn-edit" onClick={() => handleOpenEdit(item)} title="Edit">
                    <Edit2 size={15} />
                  </button>
                  <button className="btn-delete" onClick={() => setDeleteConfirmId(item.id)} title="Hapus">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {deleteConfirmId === item.id && (
                <div className="delete-confirm-box">
                  <p>Yakin ingin menghapus konten ini?</p>
                  <div className="delete-btns">
                    <button className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>Batal</button>
                    <button className="btn-confirm-del" onClick={() => handleDelete(item.id)}>Hapus</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Konten' : 'Tambah Konten Baru'}</h2>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Segmen Halaman</label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  required
                >
                  <option value="pusat_bantuan">Pusat Bantuan (Panduan Fitur)</option>
                  <option value="tentang">Tentang (Profil Aplikasi & Pesantren)</option>
                  <option value="pengembang">Pengembang (Alhamid Studio Code)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Kategori / Sub-Segmen</label>
                <input
                  type="text"
                  placeholder="Misal: Akademik, Kelasku, Akun & Keamanan, Profil"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Judul Panduan / Informasi *</label>
                <input
                  type="text"
                  placeholder="Judul topik atau fitur..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Isi Penjelasan / Deskripsi *</label>
                <textarea
                  rows={6}
                  placeholder="Jelaskan secara akurat, matang, dan detail cara kerja fitur atau informasi terkait..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Urutan Tampil (Nomor)</label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="form-group half checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span>Tampilkan di Aplikasi (Aktif)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Simpan Konten'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

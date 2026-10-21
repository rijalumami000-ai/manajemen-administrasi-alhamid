import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  Info,
  Code,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  RefreshCw,
  Layers,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Save,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { appContentService } from '../services/appContentService';
import { CustomModal } from '../components/ui/CustomModal';
import { FloatingInput } from '../components/ui/FloatingInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SmartAlert } from '../components/ui/SmartAlert';
import { LoadingState, ErrorState, useToast } from '../components/common';
import {
  AppContentItem,
  AppContentFormData,
  AppContentSection,
  AppContentDeleteConfirmState,
  AppContentStats
} from '../types/appContent';
import './InformasiAplikasi.scss';

const SECTION_TABS: { key: AppContentSection; label: string; icon: React.ElementType }[] = [
  { key: 'pusat_bantuan', label: 'Pusat Bantuan & Panduan', icon: HelpCircle },
  { key: 'tentang', label: 'Tentang Aplikasi', icon: Info },
  { key: 'pengembang', label: 'Pengembang (Alhamid Studio)', icon: Code }
];

export function InformasiAplikasi() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AppContentSection>('pusat_bantuan');
  const [contents, setContents] = useState<AppContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<AppContentItem | null>(null);
  const [formData, setFormData] = useState<AppContentFormData>({
    section: 'pusat_bantuan',
    category: 'Akademik',
    title: '',
    content: '',
    icon: 'info',
    order_index: 1,
    is_active: true
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // VisionOS Delete Dialog State
  const [deleteConfirm, setDeleteConfirm] = useState<AppContentDeleteConfirmState>({
    isOpen: false,
    item: null
  });

  const fetchContents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await appContentService.getAll({
        section: activeTab,
        search: searchQuery.trim() || undefined
      });
      setContents(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('Failed to load app contents:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat konten aplikasi';
      setError(msg);
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [activeTab]);

  // Overall Stats
  const [allContents, setAllContents] = useState<AppContentItem[]>([]);
  useEffect(() => {
    appContentService.getAll().then(res => {
      if (Array.isArray(res)) setAllContents(res);
    }).catch(() => {});
  }, [contents]);

  const stats: AppContentStats = useMemo(() => {
    const list = allContents.length > 0 ? allContents : contents;
    const total = list.length;
    const pusatBantuan = list.filter(c => c.section === 'pusat_bantuan').length;
    const tentang = list.filter(c => c.section === 'tentang').length;
    const pengembang = list.filter(c => c.section === 'pengembang').length;
    return { total, pusatBantuan, tentang, pengembang };
  }, [allContents, contents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContents();
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormError(null);
    setFormData({
      section: activeTab,
      category: activeTab === 'pusat_bantuan' ? 'Panduan Penggunaan' : 'Profil Aplikasi',
      title: '',
      content: '',
      icon: activeTab === 'pengembang' ? 'code' : 'info',
      order_index: contents.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AppContentItem) => {
    setEditingItem(item);
    setFormError(null);
    setFormData({
      section: String(item.section),
      category: item.category || '',
      title: item.title || '',
      content: item.content || '',
      icon: item.icon || 'info',
      order_index: item.order_index ?? 0,
      is_active: item.is_active !== false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError('Judul dan isi konten wajib diisi!');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      if (editingItem) {
        await appContentService.update(editingItem.id, formData);
        toast.show('Konten berhasil diperbarui!', 'success');
      } else {
        await appContentService.create(formData);
        toast.show('Konten baru berhasil ditambahkan!', 'success');
      }
      setIsModalOpen(false);
      fetchContents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan konten';
      setFormError(msg);
      toast.show(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.item) return;

    try {
      await appContentService.delete(deleteConfirm.item.id);
      toast.show('Konten berhasil dihapus!', 'success');
      setDeleteConfirm({ isOpen: false, item: null });
      fetchContents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus konten';
      toast.show(msg, 'error');
    }
  };

  return (
    <div className="info-app-page-container">
      {/* 🍏 Sacred Dock Header (Option A) */}
      <div className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Pusat Bantuan & Info Aplikasi</h2>
          <p className="page-subtitle">
            Kelola panduan operasional, FAQ, profil aplikasi, dan informasi pengembang
          </p>
        </div>

        <div className="header-action-dock">
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={fetchContents}
            title="Segarkan Data"
          >
            <RefreshCw size={15} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            className="action-pill-btn primary-pill"
            onClick={handleOpenAdd}
          >
            <Plus size={16} />
            <span>Tambah Konten</span>
          </button>
        </div>
      </div>

      {/* 📊 4 KPI Summary Cards */}
      <div className="info-app-kpi-grid">
        <div className="kpi-glass-card kpi-sapphire">
          <div className="kpi-icon-orb orb-sapphire">
            <Layers size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.total}</span>
            <span className="kpi-label">Total Entri Konten</span>
            <span className="kpi-subtext">Semua segmen aktif</span>
          </div>
        </div>

        <div className="kpi-glass-card kpi-emerald">
          <div className="kpi-icon-orb orb-emerald">
            <HelpCircle size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.pusatBantuan}</span>
            <span className="kpi-label">Panduan & Bantuan</span>
            <span className="kpi-subtext">Dokumentasi fitur</span>
          </div>
        </div>

        <div className="kpi-glass-card kpi-purple">
          <div className="kpi-icon-orb orb-purple">
            <Info size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.tentang}</span>
            <span className="kpi-label">Profil Aplikasi</span>
            <span className="kpi-subtext">Spesifikasi sistem</span>
          </div>
        </div>

        <div className="kpi-glass-card kpi-amber">
          <div className="kpi-icon-orb orb-amber">
            <Code size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.pengembang}</span>
            <span className="kpi-label">Tim Pengembang</span>
            <span className="kpi-subtext">Alhamid Studio Code</span>
          </div>
        </div>
      </div>

      {/* 🏷️ Segmented Control Pills */}
      <div className="info-app-tabs-dock">
        {SECTION_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`info-app-tab-pill ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={16} />
            <span>{label}</span>
            {activeTab === key && contents.length > 0 && (
              <span className="tab-counter-badge">{contents.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* 🔍 Search Toolbar */}
      <div className="info-app-filter-dock">
        <form onSubmit={handleSearchSubmit} className="search-pill-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={`Cari materi di ${activeTab === 'pusat_bantuan' ? 'Pusat Bantuan' : activeTab === 'tentang' ? 'Tentang' : 'Pengembang'}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setSearchQuery('');
                setTimeout(fetchContents, 50);
              }}
            >
              <X size={14} />
            </button>
          )}
        </form>

        <div className="filter-summary">
          <span>Menampilkan <strong>{contents.length}</strong> entri konten</span>
        </div>
      </div>

      {/* 💎 Content Cards Grid */}
      {loading ? (
        <LoadingState message="Memuat konten..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchContents} />
      ) : contents.length === 0 ? (
        <div className="info-app-empty-card">
          <BookOpen size={48} />
          <h3>Belum Ada Konten di Segmen Ini</h3>
          <p>Klik tombol <strong>Tambah Konten</strong> di atas untuk mempublikasikan panduan atau informasi baru.</p>
        </div>
      ) : (
        <div className="content-cards-grid">
          {contents.map(item => (
            <div key={item.id} className="content-glass-card">
              <div className="card-top-row">
                <div className="category-meta">
                  <span className="category-frosted-pill">
                    {item.category || 'Umum'}
                  </span>
                  {typeof item.order_index === 'number' && (
                    <span className="order-pill">Urutan: #{item.order_index}</span>
                  )}
                </div>

                <div className="actions-cluster">
                  <button
                    type="button"
                    className="btn-card-act btn-edit"
                    onClick={() => handleOpenEdit(item)}
                    title="Edit Konten"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn-card-act btn-delete"
                    onClick={() => setDeleteConfirm({ isOpen: true, item })}
                    title="Hapus Konten"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="card-body">
                <h4 className="content-title">{item.title}</h4>
                <div className="content-text">
                  <p>{item.content}</p>
                </div>
              </div>

              <div className="card-footer-meta">
                <span className="status-indicator">
                  <span className="dot" />
                  <span>Aktif di Mobile</span>
                </span>
                {item.created_at && (
                  <span className="date-text">
                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📝 Content Form Modal */}
      {isModalOpen && (
        <CustomModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? 'Edit Konten Informasi' : 'Tambah Konten Baru'}
          subtitle={`Segmen: ${SECTION_TABS.find(t => t.key === formData.section)?.label || formData.section}`}
          icon={<FileText size={20} />}
          width={560}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
              <button
                type="button"
                className="action-pill-btn secondary-pill"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </button>
              <button
                type="button"
                className="action-pill-btn primary-pill"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Menyimpan...' : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Save size={15} />
                    <span>{editingItem ? 'Simpan Perubahan' : 'Terbitkan Konten'}</span>
                  </span>
                )}
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {formError && <SmartAlert message={formError} type="error" />}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <CustomSelect
                label="Segmen Tampilan"
                value={formData.section}
                onChange={val => setFormData(p => ({ ...p, section: val }))}
                options={[
                  { value: 'pusat_bantuan', label: 'Pusat Bantuan & Panduan' },
                  { value: 'tentang', label: 'Tentang Aplikasi' },
                  { value: 'pengembang', label: 'Pengembang' }
                ]}
                required
              />

              <FloatingInput
                label="Kategori / Topik"
                name="category"
                value={formData.category}
                onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                placeholder="Cth: Fitur Absensi, Keuangan, dsb."
                required
                disabled={submitting}
              />
            </div>

            <FloatingInput
              label="Judul Konten / Pertanyaan FAQ"
              name="title"
              value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="Cth: Cara Melakukan Absensi Mengajar Menggunakan Ponsel"
              required
              disabled={submitting}
            />

            <div className="textarea-wrapper">
              <label className="input-label">Isi Konten / Penjelasan Lengkap</label>
              <textarea
                className="glass-textarea"
                rows={6}
                placeholder="Tuliskan penjelasan langkah-langkah atau deskripsi fitur secara komprehensif..."
                value={formData.content}
                onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                required
                disabled={submitting}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FloatingInput
                label="Urutan Tampil (Angka)"
                name="order_index"
                type="number"
                value={String(formData.order_index)}
                onChange={e => setFormData(p => ({ ...p, order_index: parseInt(e.target.value, 10) || 0 }))}
                disabled={submitting}
              />

              <CustomSelect
                label="Ikon / Tanda"
                value={formData.icon}
                onChange={val => setFormData(p => ({ ...p, icon: val }))}
                options={[
                  { value: 'info', label: 'ℹ️ Informasi' },
                  { value: 'help', label: '❓ Panduan / FAQ' },
                  { value: 'code', label: '💻 Kode / Pengembang' },
                  { value: 'book', label: '📖 Buku Pedoman' }
                ]}
              />
            </div>
          </form>
        </CustomModal>
      )}

      {/* ⚠️ VisionOS Destructive Dialog */}
      <CustomModal
        open={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
        title="Hapus Konten Informasi"
        width={420}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button
              type="button"
              className="action-pill-btn secondary-pill"
              onClick={() => setDeleteConfirm({ isOpen: false, item: null })}
            >
              Batal
            </button>
            <button
              type="button"
              className="action-pill-btn danger-pill"
              onClick={handleConfirmDelete}
            >
              Ya, Hapus
            </button>
          </div>
        }
      >
        <div className="visionos-confirm-dialog">
          <div className="dialog-icon-halo halo-rose">
            <AlertTriangle size={28} />
          </div>
          <div className="dialog-text-content">
            <h4>Konfirmasi Penghapusan</h4>
            <p>
              Apakah Anda yakin ingin menghapus konten <strong>"{deleteConfirm.item?.title}"</strong> secara permanen?
            </p>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default InformasiAplikasi;

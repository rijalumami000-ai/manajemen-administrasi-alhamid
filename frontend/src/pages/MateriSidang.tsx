import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  Upload, 
  Download, 
  ExternalLink,
  Search,
  X,
  Calendar,
  Layers,
  BookOpen,
  BookmarkCheck,
  Building,
  GraduationCap,
  FileArchive,
  RefreshCw,
  AlertTriangle,
  User,
  Hash
} from 'lucide-react';
import { materiSidangService } from '../services/materiSidangService';
import { CustomModal } from '../components/ui/CustomModal';
import { FloatingInput } from '../components/ui/FloatingInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { LoadingState, ErrorState, useToast } from '../components/common';
import {
  MateriSidangItem,
  MateriSidangFormData,
  MateriSidangKategori,
  MateriSidangDeleteConfirmState
} from '../types/materiSidang';
import { TahunAjaranSimple } from '../types/pelanggaranPrestasi';
import './MateriSidang.scss';

const KATEGORI_OPTIONS = [
  { value: 'madin', label: '📚 Sidang Madin' },
  { value: 'pmq', label: '📖 Sidang PMQ' },
  { value: 'pondok', label: '🏛️ Sidang Pondok' },
  { value: 'haflah', label: '🎓 Sidang Haflah' }
];

const KATEGORI_LABELS: Record<string, string> = {
  madin: 'Sidang Madin',
  pmq: 'Sidang PMQ',
  pondok: 'Sidang Pondok',
  haflah: 'Sidang Haflah'
};

const KATEGORI_COLORS: Record<string, string> = {
  madin: '#10b981',
  pmq: '#3b82f6',
  pondok: '#8b5cf6',
  haflah: '#f59e0b'
};

export function MateriSidang() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MateriSidangItem[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranSimple[]>([]);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<number | string | null>(null);
  const [activeTab, setActiveTab] = useState<MateriSidangKategori>('madin');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MateriSidangItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState<MateriSidangFormData>({
    tahun_ajaran_id: null,
    tahun_masehi: '',
    kategori: 'madin',
    judul: '',
    no_surat: '',
    tanggal: '',
    halaman: '',
    ukuran: '',
    status: '',
    pengesah: '',
    ringkasan: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<MateriSidangDeleteConfirmState>({
    isOpen: false,
    id: null,
    judul: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadTahunAjaran();
  }, []);

  useEffect(() => {
    if (selectedTahunAjaran) {
      loadData();
    }
  }, [selectedTahunAjaran]);

  const loadTahunAjaran = async () => {
    try {
      const list = await materiSidangService.fetchTahunAjaran();
      setTahunAjaranList(Array.isArray(list) ? list : []);
      const active = list.find((t: TahunAjaranSimple) => t.is_active);
      if (active) {
        setSelectedTahunAjaran(active.id);
      } else if (list.length) {
        setSelectedTahunAjaran(list[0].id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat tahun ajaran';
      console.error(err);
      toast.error('Gagal memuat tahun ajaran: ' + msg);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await materiSidangService.fetchMateriSidang(selectedTahunAjaran);
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data dokumen';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedYearObj = tahunAjaranList.find(t => t.id === Number(selectedTahunAjaran));
  const selectedYearKode = selectedYearObj ? selectedYearObj.kode : '';

  const tahunOptions = tahunAjaranList.map(t => ({
    value: String(t.id),
    label: `${t.kode} ${t.is_active ? '(Aktif)' : ''}`
  }));

  const openAdd = () => {
    setEditing(null);
    setSelectedFile(null);
    setFormErrors({});
    setForm({
      tahun_ajaran_id: selectedTahunAjaran ? Number(selectedTahunAjaran) : null,
      tahun_masehi: selectedYearKode,
      kategori: activeTab,
      judul: '',
      no_surat: '',
      tanggal: new Date().toISOString().split('T')[0],
      halaman: '',
      ukuran: '',
      status: 'Disahkan & Resmi',
      pengesah: '',
      ringkasan: ''
    });
    setModalOpen(true);
  };

  const openEdit = (item: MateriSidangItem) => {
    setEditing(item);
    setSelectedFile(null);
    setFormErrors({});
    setForm({
      tahun_ajaran_id: item.tahun_ajaran_id || (selectedTahunAjaran ? Number(selectedTahunAjaran) : null),
      tahun_masehi: item.tahun_masehi || selectedYearKode,
      kategori: item.kategori,
      judul: item.judul || '',
      no_surat: item.no_surat || '',
      tanggal: item.tanggal ? item.tanggal.split('T')[0] : '',
      halaman: item.halaman !== null && item.halaman !== undefined ? String(item.halaman) : '',
      ukuran: item.ukuran || '',
      status: item.status || '',
      pengesah: item.pengesah || '',
      ringkasan: item.ringkasan || ''
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    if (!form.judul || !form.judul.trim()) errors.judul = 'Judul dokumen wajib diisi';
    if (!form.kategori) errors.kategori = 'Kategori sidang wajib dipilih';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') formData.append(k, String(v));
      });
      if (selectedFile) formData.append('file', selectedFile);

      if (editing) {
        await materiSidangService.updateMateriSidang(editing.id, formData);
        toast.success('Dokumen sidang berhasil diperbarui.');
      } else {
        await materiSidangService.createMateriSidang(formData);
        toast.success('Dokumen sidang baru berhasil ditambahkan.');
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan dokumen';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: number, judul: string) => {
    setDeleteConfirm({
      isOpen: true,
      id,
      judul
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      setIsDeleting(true);
      await materiSidangService.deleteMateriSidang(deleteConfirm.id);
      toast.success(`Dokumen "${deleteConfirm.judul}" berhasil dihapus.`);
      setDeleteConfirm({ isOpen: false, id: null, judul: '' });
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus dokumen';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered documents by tab & search query
  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchKategori = d.kategori === activeTab;
      if (!matchKategori) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (d.judul && d.judul.toLowerCase().includes(q)) ||
        (d.no_surat && d.no_surat.toLowerCase().includes(q)) ||
        (d.pengesah && d.pengesah.toLowerCase().includes(q)) ||
        (d.ringkasan && d.ringkasan.toLowerCase().includes(q))
      );
    });
  }, [data, activeTab, searchQuery]);

  // Statistics
  const countMadin = data.filter(d => d.kategori === 'madin').length;
  const countPmq = data.filter(d => d.kategori === 'pmq').length;
  const countPondok = data.filter(d => d.kategori === 'pondok').length;
  const countHaflah = data.filter(d => d.kategori === 'haflah').length;

  return (
    <div className="materi-sidang-page tactile-redesign">
      {/* ─── 1. TACTILE PAGE HEADER (Option A Apple Dock Header) ─── */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">PDF Materi Sidang</h2>
          <p className="page-subtitle">
            Arsip digital naskah resmi keputusan sidang Madin, PMQ, Pondok, dan Haflah per tahun ajaran
          </p>
        </div>

        <div className="header-actions-row">
          {/* Tactile Inset Search Pill */}
          <div className="tactile-search-pill">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Cari naskah, nomor SK, pengesah..."
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
              options={tahunOptions}
              value={selectedTahunAjaran ? String(selectedTahunAjaran) : ''}
              onChange={(v) => setSelectedTahunAjaran(v)}
              placeholder="Pilih Tahun Ajaran"
            />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className="action-pill-btn neutral-pill refresh-btn"
            onClick={loadData}
            disabled={loading}
            title="Muat Ulang Dokumen"
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            <span>Segarkan</span>
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            className="action-pill-btn primary-pill"
            onClick={openAdd}
          >
            <Plus size={15} />
            <span>Tambah Dokumen</span>
          </button>
        </div>
      </header>

      {/* ─── 2. FROSTED KPI GLASS CARDS ──────────────────────────── */}
      <div className="materi-sidang-kpi-grid">
        <div className="summary-glass-card card-total">
          <div className="card-lens-orb orb-blue">
            <FileArchive size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Total Naskah Sidang</span>
            <span className="metric-value">
              {data.length} <span className="metric-unit">Dokumen</span>
            </span>
          </div>
        </div>

        <div className="summary-glass-card card-madin">
          <div className="card-lens-orb orb-emerald">
            <BookOpen size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Sidang Madin & PMQ</span>
            <span className="metric-value">
              {countMadin + countPmq} <span className="metric-unit">Naskah</span>
            </span>
          </div>
        </div>

        <div className="summary-glass-card card-pondok">
          <div className="card-lens-orb orb-purple">
            <Building size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Sidang Pondok & Haflah</span>
            <span className="metric-value">
              {countPondok + countHaflah} <span className="metric-unit">Naskah</span>
            </span>
          </div>
        </div>

        <div className="summary-glass-card card-tahun">
          <div className="card-lens-orb orb-amber">
            <Calendar size={20} />
          </div>
          <div className="card-metric-info">
            <span className="metric-label">Tahun Ajaran Aktif</span>
            <span className="metric-value">
              {selectedYearKode || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. SEGMENTED CONTROL TABS DOCK ──────────────────────── */}
      <div className="tactile-segmented-dock">
        <button
          type="button"
          onClick={() => setActiveTab('madin')}
          className={`segmented-tab-btn tab-madin ${activeTab === 'madin' ? 'active' : ''}`}
        >
          <BookOpen size={15} />
          <span>Sidang Madin</span>
          <span className="tab-counter counter-emerald">{countMadin}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pmq')}
          className={`segmented-tab-btn tab-pmq ${activeTab === 'pmq' ? 'active' : ''}`}
        >
          <BookmarkCheck size={15} />
          <span>Sidang PMQ</span>
          <span className="tab-counter counter-blue">{countPmq}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pondok')}
          className={`segmented-tab-btn tab-pondok ${activeTab === 'pondok' ? 'active' : ''}`}
        >
          <Building size={15} />
          <span>Sidang Pondok</span>
          <span className="tab-counter counter-purple">{countPondok}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('haflah')}
          className={`segmented-tab-btn tab-haflah ${activeTab === 'haflah' ? 'active' : ''}`}
        >
          <GraduationCap size={15} />
          <span>Sidang Haflah</span>
          <span className="tab-counter counter-amber">{countHaflah}</span>
        </button>
      </div>

      {/* ─── 4. MAIN CONTENT (DOCUMENTS GRID) ────────────────────── */}
      <div className="materi-sidang-content">
        {loading ? (
          <div className="loading-state-card">
            <LoadingState message="Memuat arsip naskah sidang..." />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="tactile-empty-card">
            <div className="empty-bubble-icon">
              <FileText size={40} />
            </div>
            <h4>
              {searchQuery ? 'Tidak Ada Naskah yang Cocok' : `Belum Ada Dokumen ${KATEGORI_LABELS[activeTab]}`}
            </h4>
            <p>
              {searchQuery
                ? `Tidak ditemukan naskah sidang yang sesuai dengan pencarian "${searchQuery}".`
                : `Belum ada dokumen resmi untuk ${KATEGORI_LABELS[activeTab]} pada tahun ajaran ${selectedYearKode}.`}
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
                onClick={openAdd}
              >
                <Plus size={15} />
                <span>Upload Dokumen Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <div className="tactile-docs-grid">
            {filteredData.map(doc => {
              const themeColor = KATEGORI_COLORS[doc.kategori] || '#3b82f6';

              return (
                <div 
                  key={doc.id} 
                  className="tactile-doc-card"
                  style={{ '--doc-theme': themeColor } as React.CSSProperties}
                >
                  <div className="card-specular-edge" />

                  {/* Header Row */}
                  <div className="doc-card-header">
                    <span 
                      className="doc-status-badge"
                      style={{ color: themeColor, borderColor: `${themeColor}40`, background: `${themeColor}12` }}
                    >
                      {doc.status || KATEGORI_LABELS[doc.kategori] || 'Resmi'}
                    </span>

                    <div className="doc-actions-cell">
                      <button
                        type="button"
                        className="btn-table-act btn-act-edit"
                        onClick={() => openEdit(doc)}
                        title="Edit Dokumen"
                        aria-label="Edit dokumen"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-table-act btn-act-delete"
                        onClick={() => handleDeleteClick(doc.id, doc.judul)}
                        title="Hapus Dokumen"
                        aria-label="Hapus dokumen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Surat */}
                  <h4 className="doc-title" title={doc.judul}>{doc.judul}</h4>
                  {doc.no_surat && (
                    <div className="doc-nosurat-badge">
                      <Hash size={11} className="inline-icon" />
                      <span>{doc.no_surat}</span>
                    </div>
                  )}

                  {doc.ringkasan && (
                    <p className="doc-ringkasan" title={doc.ringkasan}>
                      {doc.ringkasan}
                    </p>
                  )}

                  {/* Metadata Chips */}
                  <div className="doc-metadata-row">
                    {doc.tanggal && (
                      <span className="meta-pill" title="Tanggal Naskah">
                        <Calendar size={11} className="inline-icon" />
                        <span>{new Date(doc.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </span>
                    )}
                    {Number(doc.halaman) > 0 && (
                      <span className="meta-pill" title="Jumlah Halaman">
                        <Layers size={11} className="inline-icon" />
                        <span>{doc.halaman} Hlm</span>
                      </span>
                    )}
                    {doc.ukuran && (
                      <span className="meta-pill" title="Ukuran File">
                        <span>{doc.ukuran}</span>
                      </span>
                    )}
                    {doc.pengesah && (
                      <span className="meta-pill pengesah" title="Pengesah Dokumen">
                        <User size={11} className="inline-icon" />
                        <span>Oleh: {doc.pengesah}</span>
                      </span>
                    )}
                  </div>

                  {/* Action Download Footer */}
                  {doc.file_url && (
                    <div className="doc-card-footer">
                      <a 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="doc-download-pill"
                      >
                        <Download size={14} />
                        <span>Unduh Naskah PDF</span>
                        <ExternalLink size={12} className="ext-icon" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 5. MODAL TAMBAH / EDIT DOKUMEN ──────────────────────── */}
      <CustomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Dokumen Sidang' : 'Tambah Dokumen Sidang'}
        subtitle={editing ? 'Perbarui naskah atau metadata arsip sidang' : 'Upload dan daftarkan naskah hasil sidang keputusan'}
        icon={<FileArchive size={20} />}
        width={620}
        destroyOnClose
        footer={
          <div className="modal-tactile-footer">
            <button
              type="button"
              className="action-pill-btn neutral-pill"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="button"
              className="action-pill-btn primary-pill"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <span className="loading-spinner" />
              ) : (
                <span>{editing ? 'Perbarui Dokumen' : 'Simpan & Upload'}</span>
              )}
            </button>
          </div>
        }
      >
        <div className="materi-sidang-form-container">
          <form className="materi-sidang-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* Section 1 */}
            <div className="form-group-section">
              <h4 className="section-title">Klasifikasi Dokumen</h4>
              <div className="form-grid-2">
                <FloatingInput 
                  label="Judul Dokumen Sidang *" 
                  value={form.judul} 
                  onChange={e => setForm(p => ({ ...p, judul: e.target.value }))}
                  error={formErrors.judul}
                  required
                />
                <CustomSelect 
                  label="Kategori Sidang *" 
                  options={KATEGORI_OPTIONS} 
                  value={form.kategori} 
                  onChange={v => setForm(p => ({ ...p, kategori: v }))} 
                />
              </div>

              <div className="form-grid-2" style={{ marginTop: '10px' }}>
                <FloatingInput 
                  label="Nomor Surat / SK" 
                  value={form.no_surat || ''} 
                  onChange={e => setForm(p => ({ ...p, no_surat: e.target.value }))}
                  placeholder="Contoh: 042/SK-MDN/ALH/2026"
                />
                <FloatingInput 
                  label="Tanggal Keputusan" 
                  type="date" 
                  value={form.tanggal || ''} 
                  onChange={e => setForm(p => ({ ...p, tanggal: e.target.value }))} 
                />
              </div>
            </div>

            {/* Section 2 */}
            <div className="form-group-section">
              <h4 className="section-title">Spesifikasi & Pengesahan</h4>
              <div className="form-grid-3">
                <FloatingInput 
                  label="Jumlah Halaman" 
                  type="number" 
                  value={form.halaman !== null && form.halaman !== undefined ? String(form.halaman) : ''} 
                  onChange={e => setForm(p => ({ ...p, halaman: e.target.value }))} 
                />
                <FloatingInput 
                  label="Ukuran File" 
                  value={form.ukuran || ''} 
                  onChange={e => setForm(p => ({ ...p, ukuran: e.target.value }))} 
                  placeholder="Contoh: 2.4 MB" 
                />
                <FloatingInput 
                  label="Status Naskah" 
                  value={form.status || ''} 
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))} 
                  placeholder="Disahkan & Resmi" 
                />
              </div>

              <div className="form-full-stack" style={{ marginTop: '10px' }}>
                <FloatingInput 
                  label="Pengesah / Pimpinan Sidang" 
                  value={form.pengesah || ''} 
                  onChange={e => setForm(p => ({ ...p, pengesah: e.target.value }))} 
                  placeholder="Contoh: KH. Ahmad Asrori, Dewan Asatidz"
                />
                <FloatingInput 
                  label="Ringkasan / Poin Penting Keputusan" 
                  value={form.ringkasan || ''} 
                  onChange={e => setForm(p => ({ ...p, ringkasan: e.target.value }))} 
                  placeholder="Poin utama hasil musyawarah atau ketetapan sidang (opsional)"
                />
              </div>
            </div>

            {/* Section 3: File Upload */}
            <div className="form-group-section">
              <h4 className="section-title">Lampiran Berkas PDF</h4>
              <div className="file-upload-tactile-area">
                <label className="file-upload-label-box">
                  <div className="upload-icon-orb">
                    <Upload size={22} />
                  </div>
                  <div className="upload-text-block">
                    <span className="upload-primary-text">
                      {selectedFile ? selectedFile.name : 'Pilih Berkas Naskah PDF'}
                    </span>
                    <span className="upload-secondary-text">Format .pdf dengan ukuran maksimal 20 MB</span>
                  </div>
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} 
                    hidden 
                  />
                </label>
                {editing?.file_url && !selectedFile && (
                  <p className="existing-file-banner">
                    File terlampir saat ini: <a href={editing.file_url} target="_blank" rel="noopener noreferrer">{editing.file_url.split('/').pop()}</a>
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      </CustomModal>

      {/* ─── 6. APPLE VISIONOS DELETE CONFIRM MODAL ──────────────── */}
      <CustomModal
        open={deleteConfirm.isOpen}
        onClose={() => !isDeleting && setDeleteConfirm({ isOpen: false, id: null, judul: '' })}
        title="Hapus Dokumen Sidang"
        width={440}
        destroyOnClose
      >
        <div className="tactile-delete-dialog">
          <div className="delete-halo-orb">
            <AlertTriangle size={28} />
          </div>
          <h4 className="delete-title">Konfirmasi Hapus Naskah</h4>
          <p className="delete-desc">
            Apakah Anda yakin ingin menghapus naskah sidang <strong>"{deleteConfirm.judul}"</strong>?
          </p>
          <div className="delete-warning-box">
            <p>
              ⚠️ Dokumen ini beserta file PDF terlampir akan dihapus dari arsip resmi keputusan sidang pesantren.
            </p>
          </div>
          <div className="delete-actions-row">
            <button
              type="button"
              className="action-pill-btn neutral-pill"
              onClick={() => setDeleteConfirm({ isOpen: false, id: null, judul: '' })}
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
                <span>Ya, Hapus Dokumen</span>
              )}
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default MateriSidang;

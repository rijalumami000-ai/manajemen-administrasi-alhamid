import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, FileText, Upload, Download, ExternalLink } from 'lucide-react';
import { materiSidangService } from '../services/materiSidangService';
import { CustomModal } from '../components/ui/CustomModal';
import { FloatingInput } from '../components/ui/FloatingInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomTabs } from '../components/ui/CustomTabs';
import { PageHeader, LoadingState, useToast } from '../components/common';
import './MateriSidang.scss';

const KATEGORI_OPTIONS = [
  { value: 'madin', label: 'Sidang Madin' },
  { value: 'pmq', label: 'Sidang PMQ' },
  { value: 'pondok', label: 'Sidang Pondok' },
  { value: 'haflah', label: 'Sidang Haflah' },
];

const KATEGORI_LABELS = { madin: 'Sidang Madin', pmq: 'Sidang PMQ', pondok: 'Sidang Pondok', haflah: 'Sidang Haflah' };
const KATEGORI_COLORS = { madin: '#10b981', pmq: '#3b82f6', pondok: '#8b5cf6', haflah: '#f59e0b' };

export function MateriSidang() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);
  const [activeTab, setActiveTab] = useState('madin');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
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
    ringkasan: '',
  });

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
      setTahunAjaranList(list);
      const active = list.find(t => t.is_active);
      if (active) {
        setSelectedTahunAjaran(active.id);
      } else if (list.length) {
        setSelectedTahunAjaran(list[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat tahun ajaran: ' + err.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await materiSidangService.fetchMateriSidang(selectedTahunAjaran);
      setData(result);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedYearObj = tahunAjaranList.find(t => t.id === selectedTahunAjaran);
  const selectedYearKode = selectedYearObj ? selectedYearObj.kode : '';

  const tahunOptions = tahunAjaranList.map(t => ({
    value: t.id,
    label: `${t.kode}${t.is_active ? ' (Aktif)' : ''}`
  }));

  const openAdd = () => {
    setEditing(null);
    setSelectedFile(null);
    setForm({
      tahun_ajaran_id: selectedTahunAjaran,
      tahun_masehi: selectedYearKode,
      kategori: activeTab,
      judul: '', no_surat: '', tanggal: '', halaman: '', ukuran: '', status: '', pengesah: '', ringkasan: ''
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setSelectedFile(null);
    setForm({
      tahun_ajaran_id: item.tahun_ajaran_id || selectedTahunAjaran,
      tahun_masehi: item.tahun_masehi || selectedYearKode,
      kategori: item.kategori,
      judul: item.judul || '',
      no_surat: item.no_surat || '',
      tanggal: item.tanggal ? item.tanggal.split('T')[0] : '',
      halaman: item.halaman || '',
      ukuran: item.ukuran || '',
      status: item.status || '',
      pengesah: item.pengesah || '',
      ringkasan: item.ringkasan || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.judul || !form.kategori) {
      toast.error('Judul dan kategori wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) formData.append(k, v);
      });
      if (selectedFile) formData.append('file', selectedFile);

      if (editing) {
        await materiSidangService.updateMateriSidang(editing.id, formData);
        toast.success('Dokumen berhasil diperbarui.');
      } else {
        await materiSidangService.createMateriSidang(formData);
        toast.success('Dokumen berhasil ditambahkan.');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus dokumen ini?')) return;
    try {
      await materiSidangService.deleteMateriSidang(id);
      toast.success('Dokumen berhasil dihapus.');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredData = data.filter(d => d.kategori === activeTab);

  const tabItems = KATEGORI_OPTIONS.map(kat => ({
    key: kat.value,
    label: kat.label,
    icon: <FileText size={16} style={{ color: KATEGORI_COLORS[kat.value] }} />,
    badge: data.filter(d => d.kategori === kat.value).length,
    children: (
      <div className="sidang-tab-content">
        <div className="sidang-toolbar">
          <button className="btn-custom btn-primary" onClick={openAdd}>
            <Plus size={16} /> Tambah Dokumen
          </button>
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="empty-state">
            <FileText size={48} />
            <p>Belum ada dokumen {kat.label} untuk tahun ajaran {selectedYearKode}.</p>
          </div>
        )}

        <div className="docs-grid">
          {filteredData.map(doc => (
            <div key={doc.id} className="doc-card" style={{ borderLeftColor: KATEGORI_COLORS[doc.kategori] }}>
              <div className="doc-header">
                <span className="doc-status" style={{ color: KATEGORI_COLORS[doc.kategori], background: `${KATEGORI_COLORS[doc.kategori]}15` }}>
                  {doc.status || KATEGORI_LABELS[doc.kategori]}
                </span>
                <div className="doc-actions">
                  <button className="btn-icon btn-edit" onClick={() => openEdit(doc)} title="Edit"><Edit3 size={14} /></button>
                  <button className="btn-icon btn-delete" onClick={() => handleDelete(doc.id)} title="Hapus"><Trash2 size={14} /></button>
                </div>
              </div>
              <h4 className="doc-title">{doc.judul}</h4>
              {doc.no_surat && <p className="doc-nosurat">{doc.no_surat}</p>}
              {doc.ringkasan && <p className="doc-ringkasan">{doc.ringkasan}</p>}
              <div className="doc-meta">
                {doc.tanggal && <span>{new Date(doc.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                {doc.halaman > 0 && <span>{doc.halaman} hlm</span>}
                {doc.ukuran && <span>{doc.ukuran}</span>}
                {doc.pengesah && <span>Oleh: {doc.pengesah}</span>}
              </div>
              {doc.file_url && (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="doc-download">
                  <Download size={14} /> Unduh PDF <ExternalLink size={12} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }));

  return (
    <div className="materi-sidang-page">
      <PageHeader
        title="📜 PDF Materi Sidang"
        subtitle="Kelola arsip naskah resmi sidang madin, PMQ, pondok, dan haflah"
        extra={
          <CustomSelect
            options={tahunOptions}
            value={selectedTahunAjaran}
            onChange={setSelectedTahunAjaran}
            placeholder="Pilih Tahun Ajaran"
            style={{ minWidth: 220 }}
          />
        }
      />

      <div style={{ marginTop: 16 }}>
        <CustomTabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
      </div>

      <CustomModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Dokumen Sidang' : 'Tambah Dokumen Sidang'}
        onOk={handleSave}
        okText={saving ? 'Menyimpan...' : 'Simpan'}
        okLoading={saving}
        size="large"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FloatingInput label="Judul Dokumen *" value={form.judul} onChange={e => setForm(p => ({ ...p, judul: e.target.value }))} />
          <CustomSelect label="Kategori *" options={KATEGORI_OPTIONS} value={form.kategori} onChange={v => setForm(p => ({ ...p, kategori: v }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FloatingInput label="No. Surat / SK" value={form.no_surat} onChange={e => setForm(p => ({ ...p, no_surat: e.target.value }))} />
          <FloatingInput label="Tanggal" type="date" value={form.tanggal} onChange={e => setForm(p => ({ ...p, tanggal: e.target.value }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FloatingInput label="Jumlah Halaman" type="number" value={form.halaman} onChange={e => setForm(p => ({ ...p, halaman: e.target.value }))} />
          <FloatingInput label="Ukuran File" value={form.ukuran} onChange={e => setForm(p => ({ ...p, ukuran: e.target.value }))} placeholder="Contoh: 2.4 MB" />
          <FloatingInput label="Status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} placeholder="Contoh: Disahkan & Resmi" />
        </div>
        <FloatingInput label="Pengesah" value={form.pengesah} onChange={e => setForm(p => ({ ...p, pengesah: e.target.value }))} />
        <FloatingInput label="Ringkasan" value={form.ringkasan} onChange={e => setForm(p => ({ ...p, ringkasan: e.target.value }))} multiline rows={3} />
        <div className="file-upload-area">
          <label className="file-upload-label">
            <Upload size={20} />
            <span>{selectedFile ? selectedFile.name : 'Pilih file PDF (max 20MB)'}</span>
            <input type="file" accept=".pdf" onChange={e => setSelectedFile(e.target.files[0])} hidden />
          </label>
          {editing?.file_url && !selectedFile && (
            <p className="existing-file">File saat ini: <a href={editing.file_url} target="_blank" rel="noopener noreferrer">{editing.file_url.split('/').pop()}</a></p>
          )}
        </div>
      </CustomModal>
    </div>
  );
}

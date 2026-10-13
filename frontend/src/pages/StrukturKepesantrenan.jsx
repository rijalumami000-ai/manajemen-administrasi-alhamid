import { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Trash2, 
  RefreshCw, 
  Info,
  ShieldCheck,
  Briefcase,
  Plus,
  AlertTriangle,
  Building,
  BookOpen,
  Calendar,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { strukturService } from '../services/strukturService';
import { guruService } from '../services/guruService';
import { CustomModal } from '../components/ui/CustomModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { FloatingInput } from '../components/ui/FloatingInput';
import { PageHeader, LoadingState, ErrorState, useToast } from '../components/common';
import './StrukturOrganisasi.scss';

const TABS = [
  { key: 'pondok_putra', label: 'Pondok Putra', icon: Building, color: 'accent-blue' },
  { key: 'pondok_putri', label: 'Pondok Putri', icon: Building, color: 'accent-purple' },
  { key: 'pmq', label: 'Struktur PMQ', icon: BookOpen, color: 'accent-emerald' },
  { key: 'panitia_sambangan', label: 'Panitia Sambangan', icon: Calendar, color: 'accent-amber' },
  { key: 'panitia_haflah', label: 'Panitia Haflah', icon: Sparkles, color: 'accent-cyan' },
  { key: 'panitia_psb', label: 'Panitia PSB', icon: UserCheck, color: 'accent-slate' },
];

export function StrukturKepesantrenan() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  
  // Active Tab
  const [activeTab, setActiveTab] = useState('pondok_putra');
  const [loading, setLoading] = useState(false);
  const [strukturData, setStrukturData] = useState([]);
  const [guruList, setGuruList] = useState([]);
  
  // Academic Year State
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);
  
  // Edit Form States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedGuruId, setSelectedGuruId] = useState(null);
  const [customName, setCustomName] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Add Dynamic Position Modal
  const [addPosModalOpen, setAddPosModalOpen] = useState(false);
  const [newJabatan, setNewJabatan] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newGuruId, setNewGuruId] = useState(null);
  const [newKeterangan, setNewKeterangan] = useState('');
  const [addPosLoading, setAddPosLoading] = useState(false);

  // Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    nodeId: null,
    jabatan: '',
    nama: ''
  });

  const loadTahunAjaran = async () => {
    try {
      const list = await strukturService.fetchTahunAjaran();
      setTahunAjaranList(list || []);
      const active = (list || []).find(t => t.is_active);
      if (active) {
        setSelectedTahunAjaran(active.id);
      } else if (list && list.length > 0) {
        setSelectedTahunAjaran(list[0].id);
      }
    } catch (err) {
      console.error('Gagal memuat tahun ajaran:', err);
    }
  };

  const loadStruktur = async (tipe, tahunId = selectedTahunAjaran) => {
    setLoading(true);
    try {
      const data = await strukturService.fetchStruktur(tipe, tahunId);
      setStrukturData(data);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data struktur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadGuru = async () => {
    try {
      const data = await guruService.fetchGuru();
      setGuruList(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadTahunAjaran();
    loadGuru();
  }, []);

  useEffect(() => {
    if (selectedTahunAjaran !== null) {
      loadStruktur(activeTab, selectedTahunAjaran);
    }
  }, [activeTab, selectedTahunAjaran]);

  const handleEditClick = (node) => {
    setSelectedNode(node);
    setSelectedGuruId(node.guru_id ? String(node.guru_id) : null);
    setCustomName(node.nama_custom || '');
    setKeterangan(node.keterangan || '');
    setFormErrors({});
    setEditModalOpen(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!selectedNode) return;
    
    if (!selectedGuruId && (!customName || !customName.trim())) {
      setFormErrors({
        selectedGuruId: 'Pilih guru atau masukkan nama kustom',
        customName: 'Pilih guru atau masukkan nama kustom'
      });
      return;
    }

    setSaveLoading(true);
    try {
      if (selectedNode.id && !String(selectedNode.id).startsWith('placeholder-')) {
        await strukturService.updateStruktur({
          id: selectedNode.id,
          guru_id: selectedGuruId,
          nama_custom: customName,
          keterangan: keterangan,
          tahun_ajaran_id: selectedTahunAjaran
        });
        toast.success(`Berhasil memperbarui posisi ${selectedNode.jabatan}`);
      } else {
        await strukturService.addStruktur({
          tipe: selectedNode.tipe || activeTab,
          jabatan: selectedNode.jabatan,
          guru_id: selectedGuruId,
          nama_custom: customName,
          keterangan: keterangan,
          no_urut: selectedNode.no_urut || 99,
          tahun_ajaran_id: selectedTahunAjaran
        });
        toast.success(`Berhasil menambahkan personel untuk ${selectedNode.jabatan}`);
      }

      setEditModalOpen(false);
      loadStruktur(activeTab, selectedTahunAjaran);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan data: ' + error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddCustomPosition = async (e) => {
    if (e) e.preventDefault();
    if (!newJabatan.trim()) {
      toast.error('Nama jabatan wajib diisi.');
      return;
    }
    if (!newGuruId && !newNama.trim()) {
      toast.error('Pilih guru atau masukkan nama personel.');
      return;
    }

    setAddPosLoading(true);
    try {
      await strukturService.addStruktur({
        tipe: activeTab,
        jabatan: newJabatan.trim(),
        guru_id: newGuruId,
        nama_custom: newNama.trim() || null,
        keterangan: newKeterangan.trim() || null,
        no_urut: strukturData.length + 1,
        tahun_ajaran_id: selectedTahunAjaran
      });
      toast.success(`Berhasil menambahkan posisi ${newJabatan}`);
      setAddPosModalOpen(false);
      setNewJabatan('');
      setNewNama('');
      setNewGuruId(null);
      setNewKeterangan('');
      loadStruktur(activeTab, selectedTahunAjaran);
    } catch (err) {
      toast.error('Gagal menambah posisi: ' + err.message);
    } finally {
      setAddPosLoading(false);
    }
  };

  const handleDeleteMemberClick = (id, jabatan, nama) => {
    setDeleteConfirm({
      isOpen: true,
      nodeId: id,
      jabatan: jabatan,
      nama: nama
    });
  };

  const handleConfirmDelete = async () => {
    const { nodeId } = deleteConfirm;
    if (!nodeId) return;

    setLoading(true);
    try {
      await strukturService.deleteStruktur(nodeId);
      toast.success('Personel berhasil dihapus dari struktur.');
      setDeleteConfirm({ isOpen: false, nodeId: null, jabatan: '', nama: '' });
      loadStruktur(activeTab, selectedTahunAjaran);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus personel: ' + error.message);
      setLoading(false);
    }
  };

  const getAvatarColor = (name) => {
    if (!name || name === 'Belum diisi') return '#cbd5e1';
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    return colors[name.length % colors.length];
  };

  const getDisplayName = (node) => {
    if (node.guru_nama) return node.guru_nama;
    if (node.nama_custom) return node.nama_custom;
    return 'Belum diisi';
  };

  const renderCard = (node, accentClass, isDeletable = false) => {
    if (!node.id) return <div className="org-card-placeholder">Memuat data...</div>;

    const isPlaceholderCard = String(node.id).startsWith('placeholder-');
    const displayName = getDisplayName(node);
    const hasPerson = (node.guru_id || node.nama_custom) && !isPlaceholderCard;
    const initial = hasPerson ? displayName.slice(0, 2).toUpperCase() : '?';

    const handleCardEditClick = () => {
      if (isPlaceholderCard) {
        setSelectedNode({
          id: null,
          tipe: node.tipe,
          jabatan: node.jabatan,
          no_urut: node.no_urut
        });
        setSelectedGuruId(null);
        setCustomName('');
        setKeterangan('');
        setFormErrors({});
        setEditModalOpen(true);
      } else {
        handleEditClick(node);
      }
    };

    return (
      <div className={`org-node-card ${accentClass} ${!hasPerson ? 'is-empty' : ''}`}>
        <div className="node-badge">{node.jabatan}</div>
        
        <div className="node-content">
          {node.guru_foto_url && !isPlaceholderCard ? (
            <img 
              src={node.guru_foto_url} 
              alt={displayName} 
              className="node-avatar-image" 
            />
          ) : (
            <div 
              className="node-avatar" 
              style={{ backgroundColor: getAvatarColor(displayName) }}
            >
              {initial}
            </div>
          )}
          
          <div className="node-info">
            <h4 className="person-name" title={displayName}>{displayName}</h4>
            {node.guru_no_hp && !isPlaceholderCard && (
              <span className="person-phone">
                <Phone size={11} style={{ marginRight: '4px' }} />
                {node.guru_no_hp}
              </span>
            )}
            {node.keterangan && !isPlaceholderCard && (
              <span className="person-note" title={node.keterangan}>
                <Info size={11} style={{ marginRight: '4px' }} />
                {node.keterangan}
              </span>
            )}
          </div>

          {isAdmin() && (
            <div className="card-actions-row">
              <button 
                type="button" 
                onClick={handleCardEditClick}
                className="action-icon-btn edit-btn node-edit-btn"
                title="Tugaskan Jabatan"
              >
                <Plus size={14} />
              </button>
              {isDeletable && !isPlaceholderCard && (
                <button 
                  type="button"
                  onClick={() => handleDeleteMemberClick(node.id, node.jabatan, displayName)}
                  className="action-icon-btn delete-btn node-delete-btn"
                  title="Hapus Personel"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const guruOptions = guruList.map(g => ({
    value: String(g.id),
    label: `${g.nama} (${g.nip || 'Guru/Ustadz'})`
  }));

  // Render tree structure for each kepesantrenan tab
  const renderTabContent = () => {
    if (!strukturData.length) {
      return (
        <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Briefcase size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
          <p style={{ color: '#64748b' }}>Belum ada susunan struktur untuk bagian ini.</p>
          {isAdmin() && (
            <button 
              className="btn-custom btn-primary" 
              onClick={() => setAddPosModalOpen(true)}
              style={{ marginTop: 12 }}
            >
              <Plus size={16} /> Tambah Jabatan Baru
            </button>
          )}
        </div>
      );
    }

    // Top leadership node (no_urut 1)
    const topNode = strukturData.find(n => n.no_urut === 1) || strukturData[0];
    const secondaryNodes = strukturData.filter(n => n.no_urut >= 2 && n.no_urut <= 3);
    const regularNodes = strukturData.filter(n => n.no_urut > 3);

    return (
      <div className="org-tree-wrapper animate-fade-in">
        {/* Level 1: Pimpinan Utama */}
        {topNode && (
          <div className="org-row level-1">
            {renderCard(topNode, 'accent-amber')}
          </div>
        )}

        {topNode && secondaryNodes.length > 0 && (
          <div className="tree-connector-vertical"></div>
        )}

        {/* Level 2: Koordinator / Wakil / Sekretaris */}
        {secondaryNodes.length > 0 && (
          <div className={`org-row level-2 ${secondaryNodes.length === 2 ? 'split-2' : ''}`}>
            {secondaryNodes.map(node => renderCard(node, 'accent-blue', true))}
          </div>
        )}

        {secondaryNodes.length > 0 && regularNodes.length > 0 && (
          <div className="tree-connector-vertical"></div>
        )}

        {/* Level 3: Divisi / Anggota / Pengurus */}
        {regularNodes.length > 0 && (
          <div className="org-row level-3 multiple-row">
            <div className="multiple-header">
              <span className="multiple-title">Jajaran Pengurus & Divisi</span>
              {isAdmin() && (
                <button 
                  type="button"
                  onClick={() => setAddPosModalOpen(true)}
                  className="add-member-btn"
                >
                  <Plus size={14} />
                  <span>Tambah Jabatan / Anggota</span>
                </button>
              )}
            </div>
            <div className="multiple-cards-container">
              {regularNodes.map(node => renderCard(node, 'accent-emerald', true))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="struktur-organisasi-page">
      <PageHeader
        title="🏛️ Struktur Organisasi Kepesantrenan"
        subtitle="Kelola struktur pengurus Pondok Pesantren, PMQ, Panitia Sambangan, Haflah, dan PSB"
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '220px' }}>
              <CustomSelect
                value={selectedTahunAjaran ? String(selectedTahunAjaran) : ''}
                onChange={(val) => setSelectedTahunAjaran(val ? Number(val) : '')}
                options={[
                  { value: '', label: 'Semua Tahun Ajaran' },
                  ...tahunAjaranList.map(t => ({
                    value: String(t.id),
                    label: `${t.tahun} (${t.semester || '-'}) ${t.is_active ? '★ Aktif' : ''}`
                  }))
                ]}
                placeholder="Pilih Tahun Ajaran"
              />
            </div>
            {isAdmin() && (
              <button 
                type="button" 
                className="btn-custom btn-primary"
                onClick={() => setAddPosModalOpen(true)}
                style={{ height: '36px', padding: '0 16px', borderRadius: '10px' }}
              >
                <Plus size={14} style={{ marginRight: '6px' }} />
                <span>Tambah Jabatan</span>
              </button>
            )}
            <button 
              type="button" 
              className="btn-custom btn-secondary"
              onClick={() => loadStruktur(activeTab, selectedTahunAjaran)}
              disabled={loading}
              style={{ height: '36px', padding: '0 16px', borderRadius: '10px' }}
            >
              <RefreshCw size={14} className={loading ? 'spin-anim' : ''} style={{ marginRight: '6px' }} />
              <span>Reload</span>
            </button>
          </div>
        }
      />

      <div className="content-layout">
        <div className="custom-tabs-container">
          <div className="custom-tabs-nav-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(226, 232, 240, 0.6)', paddingBottom: '0', marginBottom: '24px', overflowX: 'auto' }}>
            <div className="custom-tabs-nav" style={{ display: 'flex', gap: '12px', borderBottom: 'none', marginBottom: 0, paddingBottom: 0, flexWrap: 'nowrap' }}>
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button 
                    key={tab.key}
                    type="button"
                    className={`custom-tabs-tab ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                    style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="custom-tabs-content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
                <span style={{ marginTop: '12px', fontSize: '14px', fontWeight: 500, color: '#64748b' }}>Memuat struktur kepesantrenan...</span>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>

      {/* Modal Tugaskan Jabatan */}
      <CustomModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Tugaskan Jabatan"
        subtitle={`Tugaskan personel untuk posisi ${selectedNode?.jabatan || ''}`}
        icon={<ShieldCheck />}
        width={460}
        destroyOnClose
        onOk={handleSave}
        okText={saveLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
        okLoading={saveLoading}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <CustomSelect
              label="Pilih Guru / Ustadz"
              value={selectedGuruId}
              onChange={(val) => {
                setSelectedGuruId(val);
                if (val) {
                  setCustomName('');
                  setFormErrors({});
                }
              }}
              placeholder="Pilih dari daftar guru"
              options={guruOptions}
              allowClear
              disabled={saveLoading}
            />
            <span style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '4px' }}>
              Pilih guru yang terdaftar dalam database.
            </span>
          </div>

          <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#94a3b8', margin: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(226, 232, 240, 0.8)' }}></div>
            <span>Atau input nama eksternal / kustom</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(226, 232, 240, 0.8)' }}></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <FloatingInput
              label="Nama Kustom (Luar Database)"
              name="customName"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                if (e.target.value) {
                  setSelectedGuruId(null);
                  setFormErrors({});
                }
              }}
              disabled={!!selectedGuruId || saveLoading}
            />
            <span style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '4px' }}>
              Digunakan jika personel bukan dari daftar guru (misal: pengurus santri/wali).
            </span>
          </div>

          <FloatingInput
            label="Catatan / Bidang / Keterangan"
            name="keterangan"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            disabled={saveLoading}
            placeholder="Contoh: SK Pengurus, masa bakti, atau bidang tugas"
          />
        </div>
      </CustomModal>

      {/* Modal Tambah Jabatan Baru */}
      <CustomModal
        open={addPosModalOpen}
        onClose={() => setAddPosModalOpen(false)}
        title="Tambah Jabatan Baru"
        subtitle={`Tambahkan posisi baru ke dalam ${TABS.find(t => t.key === activeTab)?.label || 'struktur'}`}
        icon={<Plus />}
        width={460}
        destroyOnClose
        onOk={handleAddCustomPosition}
        okText={addPosLoading ? 'Menyimpan...' : 'Tambah Jabatan'}
        okLoading={addPosLoading}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FloatingInput
            label="Nama Jabatan / Divisi *"
            value={newJabatan}
            onChange={(e) => setNewJabatan(e.target.value)}
            placeholder="Contoh: Sie Keamanan Asrama, Koordinator Konsumsi"
          />

          <CustomSelect
            label="Pilih Guru / Ustadz"
            value={newGuruId}
            onChange={(val) => {
              setNewGuruId(val);
              if (val) setNewNama('');
            }}
            placeholder="Pilih dari daftar guru"
            options={guruOptions}
            allowClear
          />

          <FloatingInput
            label="Atau Nama Kustom Personel"
            value={newNama}
            onChange={(e) => {
              setNewNama(e.target.value);
              if (e.target.value) setNewGuruId(null);
            }}
            placeholder="Nama lengkap personel"
            disabled={!!newGuruId}
          />

          <FloatingInput
            label="Keterangan / Bidang Tugas"
            value={newKeterangan}
            onChange={(e) => setNewKeterangan(e.target.value)}
            placeholder="Uraian tugas atau keterangan tambahan"
          />
        </div>
      </CustomModal>

      {/* Modal Konfirmasi Hapus */}
      <CustomModal
        open={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, nodeId: null, jabatan: '', nama: '' })}
        title="Konfirmasi Hapus Personel"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        icon={<AlertTriangle style={{ color: '#ef4444' }} />}
        width={420}
        destroyOnClose
        onOk={handleConfirmDelete}
        okText="Hapus Personel"
        okLoading={loading}
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <p style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>
            Apakah Anda yakin ingin menghapus <strong>{deleteConfirm.nama}</strong> dari posisi <strong>{deleteConfirm.jabatan}</strong>?
          </p>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Personel akan dihapus dari daftar bagan organisasi.
          </span>
        </div>
      </CustomModal>
    </div>
  );
}
export default StrukturKepesantrenan;

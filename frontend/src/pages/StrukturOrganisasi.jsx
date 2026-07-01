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
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { strukturService } from '../services/strukturService';
import { guruService } from '../services/guruService';
import { CustomModal } from '../components/ui/CustomModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { FloatingInput } from '../components/ui/FloatingInput';
import { PageHeader, LoadingState, ErrorState, useToast } from '../components/common';
import './StrukturOrganisasi.scss';

export function StrukturOrganisasi() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  
  // States
  const [activeTab, setActiveTab] = useState('madrasah_diniyah');
  const [loading, setLoading] = useState(false);
  const [strukturData, setStrukturData] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Edit Form States
  const [selectedGuruId, setSelectedGuruId] = useState(null);
  const [customName, setCustomName] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Custom Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    nodeId: null,
    jabatan: '',
    nama: ''
  });

  // Load structure data based on active tab
  const loadStruktur = async (tipe) => {
    setLoading(true);
    try {
      const data = await strukturService.fetchStruktur(tipe);
      setStrukturData(data);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data struktur organisasi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load teacher list for selections
  const loadGuru = async () => {
    try {
      const data = await guruService.fetchGuru();
      setGuruList(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadStruktur(activeTab);
  }, [activeTab]);

  useEffect(() => {
    loadGuru();
  }, []);

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
    
    // Validation: must select a teacher OR input a custom name
    if (!selectedGuruId && (!customName || !customName.trim())) {
      setFormErrors({
        selectedGuruId: 'Pilih guru atau masukkan nama kustom',
        customName: 'Pilih guru atau masukkan nama kustom'
      });
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        guru_id: selectedGuruId ? Number(selectedGuruId) : null,
        nama_custom: selectedGuruId ? null : customName.trim(), // clear custom name if a teacher is selected
        keterangan: keterangan.trim()
      };

      if (selectedNode.id === null) {
        // Create new record
        await strukturService.addStruktur({
          ...payload,
          tipe: selectedNode.tipe,
          jabatan: selectedNode.jabatan,
          no_urut: selectedNode.no_urut
        });
        toast.success(`Berhasil menambahkan personel ${selectedNode.jabatan}`);
      } else {
        // Update existing record
        await strukturService.updateStruktur({
          ...payload,
          id: selectedNode.id
        });
        toast.success(`Berhasil memperbarui posisi ${selectedNode.jabatan}`);
      }
      
      setEditModalOpen(false);
      loadStruktur(activeTab);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan posisi: ' + error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddMember = (jabatan, noUrut) => {
    setSelectedNode({
      id: null,
      tipe: activeTab,
      jabatan: jabatan,
      no_urut: noUrut
    });
    setSelectedGuruId(null);
    setCustomName('');
    setKeterangan('');
    setFormErrors({});
    setEditModalOpen(true);
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
      loadStruktur(activeTab);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus personel: ' + error.message);
      setLoading(false);
    }
  };

  // Helper to generate avatar color based on name length
  const getAvatarColor = (name) => {
    if (!name || name === 'Belum diisi') return '#cbd5e1';
    const colors = [
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#f59e0b', // amber
      '#10b981', // emerald
      '#06b6d4', // cyan
    ];
    return colors[name.length % colors.length];
  };

  const getDisplayName = (node) => {
    if (node.guru_nama) return node.guru_nama;
    if (node.nama_custom) return node.nama_custom;
    return 'Belum diisi';
  };

  // Group nodes by levels or specific placements to construct the tree UI
  // Madrasah Diniyah Levels:
  // 1: Pelindung & Penasehat
  // 2: Kepala Madrasah
  // 3: Waka Kurikulum, Waka Kesiswaan
  // 4: Sekretaris, Bendahara
  // 5: TU (Multiple)
  const getDiniyahTree = () => {
    const findNode = (jabatan) => strukturData.find(n => n.jabatan.toLowerCase() === jabatan.toLowerCase()) || { jabatan };
    const filterNodes = (jabatan, defaultNoUrut) => {
      const nodes = strukturData.filter(n => n.jabatan.toLowerCase() === jabatan.toLowerCase());
      return nodes.length > 0 ? nodes : [{ id: `placeholder-${jabatan}`, jabatan, tipe: 'madrasah_diniyah', no_urut: defaultNoUrut }];
    };

    const pelindung = findNode('Pelindung & Penasehat');
    const kepala = findNode('Kepala Madrasah');
    const wakaKur = findNode('Waka Kurikulum');
    const wakaKes = findNode('Waka Kesiswaan');
    const sekretaris = findNode('Sekretaris');
    const bendahara = findNode('Bendahara');
    const tuList = filterNodes('TU', 7);

    return (
      <div className="org-tree-wrapper animate-fade-in">
        {/* Level 1: Pelindung */}
        <div className="org-row level-1">
          {renderCard(pelindung, 'accent-amber')}
        </div>

        <div className="tree-connector-vertical"></div>

        {/* Level 2: Kepala */}
        <div className="org-row level-2">
          {renderCard(kepala, 'accent-blue')}
        </div>

        <div className="tree-connector-vertical"></div>

        {/* Level 3: Waka (Kurikulum & Kesiswaan) */}
        <div className="org-row level-3 split-2">
          <div className="tree-branch-left"></div>
          {renderCard(wakaKur, 'accent-purple')}
          {renderCard(wakaKes, 'accent-purple')}
          <div className="tree-branch-right"></div>
        </div>

        <div className="tree-connector-double"></div>

        {/* Level 4: Sekretaris & Bendahara */}
        <div className="org-row level-4 split-2">
          {renderCard(sekretaris, 'accent-cyan')}
          {renderCard(bendahara, 'accent-emerald')}
        </div>

        <div className="tree-connector-vertical"></div>

        {/* Level 5: TU (Multiple) */}
        <div className="org-row level-5 multiple-row">
          <div className="multiple-header">
            <span className="multiple-title">Tata Usaha (TU)</span>
            {isAdmin() && (
              <button 
                type="button"
                onClick={() => handleAddMember('TU', 7)}
                className="add-member-btn"
              >
                <Plus size={14} />
                <span>Tambah Anggota TU</span>
              </button>
            )}
          </div>
          <div className="multiple-cards-container">
            {tuList.map(node => renderCard(node, 'accent-slate', true))}
          </div>
        </div>
      </div>
    );
  };

  // Panitia Ujian Levels:
  // 1: Penanggungjawab
  // 2: Ketua Panitia
  // 3: Sekretaris & Bendahara
  // 4: Seksi Konsumsi (Multiple) & Asisten Ujian (Multiple)
  const getPanitiaTree = () => {
    const findNode = (jabatan) => strukturData.find(n => n.jabatan.toLowerCase() === jabatan.toLowerCase()) || { jabatan };
    const filterNodes = (jabatan, defaultNoUrut) => {
      const nodes = strukturData.filter(n => n.jabatan.toLowerCase() === jabatan.toLowerCase());
      return nodes.length > 0 ? nodes : [{ id: `placeholder-${jabatan}`, jabatan, tipe: 'panitia_ujian', no_urut: defaultNoUrut }];
    };

    const pj = findNode('Penanggungjawab');
    const ketua = findNode('Ketua Panitia');
    const sek = findNode('Sekretaris');
    const bend = findNode('Bendahara');
    const konsumsiList = filterNodes('Seksi Konsumsi', 5);
    const asistenList = filterNodes('Asisten Ujian', 6);

    return (
      <div className="org-tree-wrapper animate-fade-in">
        {/* Level 1: PJ */}
        <div className="org-row level-1">
          {renderCard(pj, 'accent-amber')}
        </div>

        <div className="tree-connector-vertical"></div>

        {/* Level 2: Ketua */}
        <div className="org-row level-2">
          {renderCard(ketua, 'accent-blue')}
        </div>

        <div className="tree-connector-vertical"></div>

        {/* Level 3: Sekretaris & Bendahara */}
        <div className="org-row level-3 split-2">
          {renderCard(sek, 'accent-cyan')}
          {renderCard(bend, 'accent-emerald')}
        </div>

        <div className="tree-connector-double"></div>

        {/* Level 4: Konsumsi (Multiple) */}
        <div className="org-row level-4 multiple-row">
          <div className="multiple-header">
            <span className="multiple-title">Seksi Konsumsi</span>
            {isAdmin() && (
              <button 
                type="button" 
                onClick={() => handleAddMember('Seksi Konsumsi', 5)}
                className="add-member-btn"
              >
                <Plus size={14} />
                <span>Tambah Anggota Konsumsi</span>
              </button>
            )}
          </div>
          <div className="multiple-cards-container">
            {konsumsiList.map(node => renderCard(node, 'accent-purple', true))}
          </div>
        </div>

        <div className="tree-connector-vertical"></div>

        {/* Level 5: Asisten Ujian (Multiple) */}
        <div className="org-row level-5 multiple-row">
          <div className="multiple-header">
            <span className="multiple-title">Asisten Ujian</span>
            {isAdmin() && (
              <button 
                type="button"
                onClick={() => handleAddMember('Asisten Ujian', 6)}
                className="add-member-btn"
              >
                <Plus size={14} />
                <span>Tambah Asisten Ujian</span>
              </button>
            )}
          </div>
          <div className="multiple-cards-container">
            {asistenList.map(node => renderCard(node, 'accent-slate', true))}
          </div>
        </div>
      </div>
    );
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
    label: g.nama
  }));

  return (
    <div className="struktur-organisasi-page">
      {/* Premium Header */}
      <div className="page-header-container">
        <div className="header-left">
          <Briefcase size={26} className="header-icon" />
          <div>
            <h1 className="page-title">Struktur Organisasi</h1>
            <p className="page-subtitle">Kelola struktur kepengurusan Madrasah Diniyah dan Panitia Ujian</p>
          </div>
        </div>
      </div>

      <div className="content-layout">
        {/* Custom Tabs Navigation */}
        <div className="custom-tabs-container">
          <div className="custom-tabs-nav-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(226, 232, 240, 0.6)', paddingBottom: '0', marginBottom: '24px' }}>
            <div className="custom-tabs-nav" style={{ display: 'flex', gap: '16px', borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
              <button 
                type="button"
                className={`custom-tabs-tab ${activeTab === 'madrasah_diniyah' ? 'active' : ''}`}
                onClick={() => setActiveTab('madrasah_diniyah')}
              >
                Struktur Madrasah Diniyah
              </button>
              <button 
                type="button"
                className={`custom-tabs-tab ${activeTab === 'panitia_ujian' ? 'active' : ''}`}
                onClick={() => setActiveTab('panitia_ujian')}
              >
                Panitia Ujian Madrasah
              </button>
            </div>
            
            <button 
              type="button" 
              className="btn-custom btn-secondary"
              onClick={() => loadStruktur(activeTab)}
              disabled={loading}
              style={{ height: '36px', padding: '0 16px', borderRadius: '10px' }}
            >
              <RefreshCw size={14} className={loading ? 'spin-anim' : ''} style={{ marginRight: '6px' }} />
              <span>Reload</span>
            </button>
          </div>

          <div className="custom-tabs-content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
                <span style={{ marginTop: '12px', fontSize: '14px', fontWeight: 500, color: 'var(--lt-text-secondary, #64748b)' }}>Memuat bagan struktur...</span>
              </div>
            ) : (
              activeTab === 'madrasah_diniyah' ? getDiniyahTree() : getPanitiaTree()
            )}
          </div>
        </div>
      </div>

      {/* Edit/Add Position Modal */}
      <CustomModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Tugaskan Jabatan"
        subtitle={`Tugaskan personel untuk posisi ${selectedNode?.jabatan || ''}`}
        icon={<ShieldCheck />}
        width={450}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button
              type="button"
              className="btn-custom btn-secondary"
              onClick={() => setEditModalOpen(false)}
              disabled={saveLoading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-custom btn-primary"
              onClick={handleSave}
              disabled={saveLoading}
            >
              {saveLoading ? (
                <span className="loading-spinner"></span>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="modal-body-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <CustomSelect
              label="Pilih Guru / Ustadz"
              value={selectedGuruId}
              onChange={(val) => {
                setSelectedGuruId(val);
                if (val) {
                  setCustomName(''); // clear custom name if guru selected
                  setFormErrors({});
                }
              }}
              placeholder="Pilih dari daftar guru"
              options={guruOptions}
              allowClear
              disabled={saveLoading}
            />
            <span className="input-helper" style={{ fontSize: '11px', color: 'var(--lt-text-tertiary, #94a3b8)', paddingLeft: '4px' }}>
              Pilih guru yang terdaftar dalam database.
            </span>
          </div>

          <div className="form-divider" style={{ textAlign: 'center', position: 'relative', fontSize: '12px', fontWeight: 700, color: 'var(--lt-text-tertiary, #94a3b8)', margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
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
                  setSelectedGuruId(null); // clear guru if typing custom
                  setFormErrors({});
                }
              }}
              disabled={!!selectedGuruId || saveLoading}
            />
            <span className="input-helper" style={{ fontSize: '11px', color: 'var(--lt-text-tertiary, #94a3b8)', paddingLeft: '4px' }}>
              Digunakan jika personel bukan dari daftar guru (misal: pembina eksternal).
            </span>
          </div>

          <div className="form-group-textarea">
            <div className={`ui-floating-input ${keterangan ? 'active' : ''} ${saveLoading ? 'disabled' : ''}`}>
              <div className="ui-floating-input__wrapper textarea-wrapper" style={{ minHeight: '80px' }}>
                <textarea
                  name="keterangan"
                  className="ui-floating-input__field textarea-field"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  rows={2}
                  disabled={saveLoading}
                  style={{ resize: 'vertical', paddingTop: '20px', minHeight: '60px' }}
                  placeholder="Contoh: SK Pengangkatan, masa bakti, atau info tambahan"
                />
                <label className="ui-floating-input__label">
                  Catatan / Keterangan
                </label>
              </div>
            </div>
          </div>

          {formErrors.selectedGuruId && (
            <div style={{ marginTop: '8px' }}>
              <SmartAlert message="Silakan pilih guru atau masukkan nama kustom terlebih dahulu" type="error" />
            </div>
          )}
        </form>
      </CustomModal>

      {/* Custom Delete Confirmation Modal */}
      <CustomModal
        open={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, nodeId: null, jabatan: '', nama: '' })}
        title="Hapus Personel"
        subtitle="Konfirmasi Penghapusan Struktur Organisasi"
        icon={<AlertTriangle color="#ef4444" />}
        width={440}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button
              type="button"
              className="btn-custom btn-secondary"
              onClick={() => setDeleteConfirm({ isOpen: false, nodeId: null, jabatan: '', nama: '' })}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn-custom btn-danger"
              onClick={handleConfirmDelete}
            >
              Hapus Personel
            </button>
          </div>
        }
      >
        <div style={{ padding: '4px 0' }}>
          <p style={{ margin: 0, color: 'var(--lt-text-primary, #0f172a)', fontSize: '14px', fontWeight: 500 }}>
            Apakah Anda yakin ingin menghapus <strong>{deleteConfirm.nama}</strong> dari jabatan <strong>{deleteConfirm.jabatan}</strong>?
          </p>
          <p style={{ marginTop: '10px', marginBottom: 0, color: 'var(--lt-text-secondary, #64748b)', fontSize: '13px', lineHeight: 1.5 }}>
            Tindakan ini hanya akan mengosongkan posisi jabatan ini dalam bagan organisasi dan tidak akan menghapus data guru dari database.
          </p>
        </div>
      </CustomModal>
    </div>
  );
}

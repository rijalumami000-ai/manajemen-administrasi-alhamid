import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  Card, 
  Button, 
  Modal, 
  Select, 
  Input, 
  Spin, 
  message, 
  Avatar, 
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  Edit3, 
  User, 
  Phone, 
  Trash2, 
  RefreshCw, 
  Info,
  ShieldCheck,
  Briefcase,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { strukturService } from '../services/strukturService';
import { guruService } from '../services/guruService';
import './StrukturOrganisasi.scss';

const { TabPane } = Tabs;

export function StrukturOrganisasi() {
  const { isAdmin } = useAuth();
  
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

  // Load structure data based on active tab
  const loadStruktur = async (tipe) => {
    setLoading(true);
    try {
      const data = await strukturService.fetchStruktur(tipe);
      setStrukturData(data);
    } catch (error) {
      console.error(error);
      message.error('Gagal memuat data struktur organisasi: ' + error.message);
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
    setSelectedGuruId(node.guru_id || null);
    setCustomName(node.nama_custom || '');
    setKeterangan(node.keterangan || '');
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedNode) return;
    
    setSaveLoading(true);
    try {
      const payload = {
        guru_id: selectedGuruId,
        nama_custom: selectedGuruId ? null : customName, // clear custom name if a teacher is selected
        keterangan: keterangan
      };

      if (selectedNode.id === null) {
        // Create new record
        await strukturService.addStruktur({
          ...payload,
          tipe: selectedNode.tipe,
          jabatan: selectedNode.jabatan,
          no_urut: selectedNode.no_urut
        });
        message.success(`Berhasil menambahkan personel ${selectedNode.jabatan}`);
      } else {
        // Update existing record
        await strukturService.updateStruktur({
          ...payload,
          id: selectedNode.id
        });
        message.success(`Berhasil memperbarui posisi ${selectedNode.jabatan}`);
      }
      
      setEditModalOpen(false);
      loadStruktur(activeTab);
    } catch (error) {
      console.error(error);
      message.error('Gagal menyimpan posisi: ' + error.message);
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
    setEditModalOpen(true);
  };

  const handleDeleteMember = async (id) => {
    setLoading(true);
    try {
      await strukturService.deleteStruktur(id);
      message.success('Personel berhasil dihapus.');
      loadStruktur(activeTab);
    } catch (error) {
      console.error(error);
      message.error('Gagal menghapus personel: ' + error.message);
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
      <div className="org-tree-wrapper">
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
              <Button 
                type="dashed" 
                size="small" 
                icon={<Plus size={12} />} 
                onClick={() => handleAddMember('TU', 7)}
                className="add-member-btn"
              >
                Tambah Anggota TU
              </Button>
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
      <div className="org-tree-wrapper">
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
              <Button 
                type="dashed" 
                size="small" 
                icon={<Plus size={12} />} 
                onClick={() => handleAddMember('Seksi Konsumsi', 5)}
                className="add-member-btn"
              >
                Tambah Anggota Konsumsi
              </Button>
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
              <Button 
                type="dashed" 
                size="small" 
                icon={<Plus size={12} />} 
                onClick={() => handleAddMember('Asisten Ujian', 6)}
                className="add-member-btn"
              >
                Tambah Asisten Ujian
              </Button>
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
            <Avatar 
              size={46} 
              style={{ backgroundColor: getAvatarColor(displayName) }}
              className="node-avatar"
            >
              {initial}
            </Avatar>
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
              <Tooltip title="Edit Posisi">
                <Button 
                  type="text" 
                  shape="circle" 
                  icon={<Edit3 size={15} />} 
                  onClick={handleCardEditClick}
                  className="node-edit-btn"
                />
              </Tooltip>
              {isDeletable && !isPlaceholderCard && (
                <Popconfirm
                  title="Hapus Personel"
                  description="Apakah Anda yakin ingin menghapus personel ini dari struktur?"
                  onConfirm={() => handleDeleteMember(node.id)}
                  okText="Hapus"
                  cancelText="Batal"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Hapus Personel">
                    <Button 
                      type="text" 
                      shape="circle" 
                      danger
                      icon={<Trash2 size={15} />} 
                      className="node-delete-btn"
                    />
                  </Tooltip>
                </Popconfirm>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

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
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          className="org-tabs"
          tabBarExtraContent={
            <Button 
              type="text" 
              icon={<RefreshCw size={14} className={loading ? 'spin-anim' : ''} />} 
              onClick={() => loadStruktur(activeTab)}
            >
              Reload
            </Button>
          }
        >
          <TabPane 
            tab="Struktur Madrasah Diniyah" 
            key="madrasah_diniyah"
          >
            {loading ? (
              <div className="loading-container">
                <Spin size="large" tip="Memuat bagan struktur..." />
              </div>
            ) : (
              getDiniyahTree()
            )}
          </TabPane>

          <TabPane 
            tab="Panitia Ujian Madrasah" 
            key="panitia_ujian"
          >
            {loading ? (
              <div className="loading-container">
                <Spin size="large" tip="Memuat bagan panitia..." />
              </div>
            ) : (
              getPanitiaTree()
            )}
          </TabPane>
        </Tabs>
      </div>

      {/* Edit/Add Position Modal */}
      <Modal
        title={
          <div className="modal-title-wrapper">
            <ShieldCheck size={20} className="modal-icon" />
            <span>Tugaskan Jabatan: {selectedNode?.jabatan}</span>
          </div>
        }
        open={editModalOpen}
        onOk={handleSave}
        onCancel={() => setEditModalOpen(false)}
        confirmLoading={saveLoading}
        okText="Simpan Perubahan"
        cancelText="Batal"
        width={450}
        centered
        className="org-edit-modal"
      >
        <div className="modal-body-container">
          <div className="form-group">
            <label className="form-label">Pilih Guru / Ustadz</label>
            <Select
              placeholder="Pilih dari daftar guru"
              value={selectedGuruId}
              onChange={(val) => {
                setSelectedGuruId(val);
                if (val) setCustomName(''); // clear custom name if guru selected
              }}
              allowClear
              showSearch
              filterOption={(input, option) => 
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={guruList.map(g => ({
                value: g.id,
                label: g.nama
              }))}
              className="w-full-select"
            />
            <span className="input-helper">Pilih guru yang terdaftar dalam database.</span>
          </div>

          <div className="form-divider">Atau input nama eksternal / kustom</div>

          <div className="form-group">
            <label className="form-label">Nama Kustom (Luar Database)</label>
            <Input
              placeholder="Masukkan nama lengkap"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                if (e.target.value) setSelectedGuruId(null); // clear guru if typing custom
              }}
              disabled={!!selectedGuruId}
            />
            <span className="input-helper">Digunakan jika personel bukan dari daftar guru (misal: pembina/pelindung eksternal).</span>
          </div>

          <div className="form-group">
            <label className="form-label">Catatan / Keterangan</label>
            <Input.TextArea
              placeholder="Contoh: SK Pengangkatan, masa bakti, atau info tambahan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

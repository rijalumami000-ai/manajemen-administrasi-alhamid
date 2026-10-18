import { useState, useEffect, useMemo } from 'react';
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
  UserCheck,
  Search,
  MapPin,
  LayoutGrid,
  Table as TableIcon,
  Crown,
  Award,
  Users
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
  { key: 'dewan_penyantun', label: 'Dewan Penyantun', icon: Crown, color: 'accent-amber', desc: 'Pengasuh Ndalem, Dewan Penasihat & Pembina Asrama' },
  { key: 'pondok_putra', label: 'Pengurus Putra', icon: Building, color: 'accent-blue', desc: 'Dewan Harian, Dewan Pleno, PJ Kamar & Ketua Kamar Putra' },
  { key: 'pondok_putri', label: 'Pengurus Putri', icon: Building, color: 'accent-purple', desc: 'Dewan Harian, Dewan Pleno, PJ Komplek & Ketua Kamar Putri' },
  { key: 'jamiyyah', label: 'Jam\'iyyah Santri', icon: Users, color: 'accent-emerald', desc: 'Jam\'iyyah Pusat, Jam\'iyyah Putra & Jam\'iyyah Putri' },
  { key: 'pmq', label: 'Struktur PMQ', icon: BookOpen, color: 'accent-cyan', desc: 'Pendidikan Murottilil Qur\'an' },
  { key: 'panitia_sambangan', label: 'Panitia Sambangan', icon: Calendar, color: 'accent-amber', desc: 'Kepanitiaan Sambangan & Kunjungan Santri' },
  { key: 'panitia_haflah', label: 'Panitia Haflah', icon: Sparkles, color: 'accent-rose', desc: 'Kepanitiaan Haflah Akhirussanah' },
  { key: 'panitia_psb', label: 'Panitia PSB', icon: UserCheck, color: 'accent-slate', desc: 'Penerimaan Santri Baru' },
];

export function StrukturKepesantrenan() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  
  // Active Tab & View Mode
  const [activeTab, setActiveTab] = useState('dewan_penyantun');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('ALL');
  
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
  const [alamat, setAlamat] = useState('');
  const [kategori, setKategori] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Add Position Modal
  const [addPosModalOpen, setAddPosModalOpen] = useState(false);
  const [newJabatan, setNewJabatan] = useState('');
  const [newKategori, setNewKategori] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newGuruId, setNewGuruId] = useState(null);
  const [newAlamat, setNewAlamat] = useState('');
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
      setStrukturData(data || []);
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
      setGuruList(data || []);
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
      setSelectedKategori('ALL');
    }
  }, [activeTab, selectedTahunAjaran]);

  // Extract distinct categories in active dataset
  const categoriesInTab = useMemo(() => {
    const set = new Set();
    strukturData.forEach(item => {
      if (item.kategori) set.add(item.kategori);
    });
    return Array.from(set);
  }, [strukturData]);

  // Filtered dataset based on search and category
  const filteredData = useMemo(() => {
    return strukturData.filter(item => {
      const matchKategori = selectedKategori === 'ALL' || item.kategori === selectedKategori;
      if (!matchKategori) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const nama = (item.guru_nama || item.nama_custom || '').toLowerCase();
      const jabatan = (item.jabatan || '').toLowerCase();
      const alm = (item.alamat || '').toLowerCase();
      const ket = (item.keterangan || '').toLowerCase();
      const kat = (item.kategori || '').toLowerCase();

      return nama.includes(q) || jabatan.includes(q) || alm.includes(q) || ket.includes(q) || kat.includes(q);
    });
  }, [strukturData, selectedKategori, searchQuery]);

  // Group filtered items by category
  const groupedData = useMemo(() => {
    const groups = {};
    filteredData.forEach(item => {
      const groupKey = item.kategori || 'Kepengurusan Umum';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });
    return groups;
  }, [filteredData]);

  const handleEditClick = (node) => {
    setSelectedNode(node);
    setSelectedGuruId(node.guru_id ? String(node.guru_id) : null);
    setCustomName(node.nama_custom || '');
    setAlamat(node.alamat || '');
    setKategori(node.kategori || '');
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
          alamat: alamat,
          kategori: kategori,
          keterangan: keterangan,
          tahun_ajaran_id: selectedTahunAjaran
        });
        toast.success(`Berhasil memperbarui posisi ${selectedNode.jabatan}`);
      } else {
        await strukturService.addStruktur({
          tipe: selectedNode.tipe || activeTab,
          kategori: kategori || selectedNode.kategori,
          jabatan: selectedNode.jabatan,
          guru_id: selectedGuruId,
          nama_custom: customName,
          alamat: alamat,
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
        kategori: newKategori.trim() || null,
        jabatan: newJabatan.trim(),
        guru_id: newGuruId,
        nama_custom: newNama.trim() || null,
        alamat: newAlamat.trim() || null,
        keterangan: newKeterangan.trim() || null,
        no_urut: strukturData.length + 1,
        tahun_ajaran_id: selectedTahunAjaran
      });
      toast.success(`Berhasil menambahkan posisi ${newJabatan}`);
      setAddPosModalOpen(false);
      setNewJabatan('');
      setNewKategori('');
      setNewNama('');
      setNewAlamat('');
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
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];
    return colors[name.length % colors.length];
  };

  const getDisplayName = (node) => {
    if (node.guru_nama) return node.guru_nama;
    if (node.nama_custom) return node.nama_custom;
    return 'Belum diisi';
  };

  const guruOptions = guruList.map(g => ({
    value: String(g.id),
    label: `${g.nama} (${g.nip || 'Guru/Ustadz'})`
  }));

  // Render Card in Grid
  const renderCard = (node, accentColor = 'blue') => {
    const displayName = getDisplayName(node);
    const hasPerson = node.guru_id || node.nama_custom;
    const initial = hasPerson ? displayName.replace(/^(Bpk\.|Ibu\.|Sdr\.|Sdri\.|Kyai|Umi|Ust\.|Usth\.)\s+/i, '').slice(0, 2).toUpperCase() : '?';

    const isKoordinator = node.keterangan && node.keterangan.toLowerCase().includes('koordinator');
    const isPimpinan = node.no_urut <= 2;

    return (
      <div 
        key={node.id} 
        className={`org-node-card-modern ${isKoordinator || isPimpinan ? 'is-lead' : ''}`}
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: isKoordinator ? '1.5px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: isKoordinator ? '0 10px 25px -5px rgba(245, 158, 11, 0.12)' : '0 4px 16px -2px rgba(0, 0, 0, 0.04)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative'
        }}
      >
        <div>
          {/* Header Role Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
            <span 
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '8px',
                letterSpacing: '0.3px',
                background: isKoordinator ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                color: isKoordinator ? '#b45309' : '#1d4ed8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isKoordinator && <Award size={12} />}
              {node.jabatan}
            </span>

            {isAdmin() && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleEditClick(node)}
                  title="Edit Personel"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    color: '#64748b'
                  }}
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMemberClick(node.id, node.jabatan, displayName)}
                  title="Hapus"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    color: '#ef4444'
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Person Content */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            {node.guru_foto_url ? (
              <img 
                src={node.guru_foto_url} 
                alt={displayName} 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  border: '2px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)'
                }}
              />
            ) : (
              <div 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: getAvatarColor(displayName),
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: 800,
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)'
                }}
              >
                {initial}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div 
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={displayName}
              >
                {displayName}
              </div>

              {node.alamat && node.alamat !== '-' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  <MapPin size={11} style={{ color: '#ec4899', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>{node.alamat}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Note or Phone */}
        {(node.keterangan || node.guru_no_hp) && (
          <div 
            style={{
              paddingTop: '8px',
              borderTop: '1px solid rgba(226, 232, 240, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#64748b',
              marginTop: '4px'
            }}
          >
            <span style={{ fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={node.keterangan}>
              {node.keterangan || '-'}
            </span>
            {node.guru_no_hp && (
              <a 
                href={`https://wa.me/${node.guru_no_hp.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#10b981', fontWeight: 600, textDecoration: 'none', marginLeft: '6px' }}
                title="Hubungi via WhatsApp"
              >
                <Phone size={11} />
                <span>WA</span>
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render Tab Content
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

    if (viewMode === 'table') {
      return (
        <div style={{ overflowX: 'auto', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(241, 245, 249, 0.8)', borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
                <th style={{ padding: '12px 16px', width: '60px' }}>No</th>
                <th style={{ padding: '12px 16px' }}>Jabatan / Penugasan</th>
                <th style={{ padding: '12px 16px' }}>Nama Personel</th>
                <th style={{ padding: '12px 16px' }}>Asal Daerah</th>
                <th style={{ padding: '12px 16px' }}>Keterangan / Peran</th>
                {isAdmin() && <th style={{ padding: '12px 16px', textAlign: 'center', width: '90px' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((node, idx) => {
                const displayName = getDisplayName(node);
                return (
                  <tr key={node.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{node.jabatan}</span>
                        {node.kategori && <span style={{ fontSize: '10px', color: '#6366f1', fontWeight: 600 }}>{node.kategori}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: getAvatarColor(displayName), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                          {displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{displayName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {node.alamat && node.alamat !== '-' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fdf2f8', color: '#db2777', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                          <MapPin size={10} /> {node.alamat}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>{node.keterangan || '-'}</td>
                    {isAdmin() && (
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleEditClick(node)}
                            style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#3b82f6' }}
                            title="Edit"
                          >
                            <Plus size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMemberClick(node.id, node.jabatan, displayName)}
                            style={{ background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#ef4444' }}
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Grid View grouped by category
    const groupKeys = Object.keys(groupedData);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {groupKeys.map(kategoriKey => {
          const items = groupedData[kategoriKey];
          return (
            <div key={kategoriKey} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Group Header Badge */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  border: '1px solid rgba(226, 232, 240, 0.8)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '22px', borderRadius: '4px', background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)' }}></div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                    {kategoriKey}
                  </h3>
                </div>
                <span 
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    background: '#e0e7ff', 
                    color: '#4338ca' 
                  }}
                >
                  {items.length} Personel
                </span>
              </div>

              {/* Cards Grid: 3 columns on desktop, 2 on tablet, 1 on mobile */}
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                  gap: '16px' 
                }}
              >
                {items.map(node => renderCard(node))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const activeTabMeta = TABS.find(t => t.key === activeTab);

  return (
    <div className="struktur-organisasi-page">
      <PageHeader
        title="🏛️ Struktur Kepengurusan Pondok Pesantren"
        subtitle="Masa Khidmah 2026 - 2027 M. Pondok Pesantren Al-Hamid"
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '200px' }}>
              <CustomSelect
                value={selectedTahunAjaran ? String(selectedTahunAjaran) : ''}
                onChange={(val) => setSelectedTahunAjaran(val ? Number(val) : '')}
                options={[
                  { value: '', label: 'Semua Tahun Ajaran' },
                  ...tahunAjaranList.map(t => ({
                    value: String(t.id),
                    label: `${t.kode || t.tahun || '-'} ${t.is_active ? '★ Aktif' : ''}`
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

      <div className="content-layout" style={{ padding: '24px' }}>
        {/* Navigation Tabs */}
        <div className="custom-tabs-container">
          <div 
            className="custom-tabs-nav-row" 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
              paddingBottom: '12px', 
              marginBottom: '20px', 
              overflowX: 'auto',
              gap: '12px'
            }}
          >
            <div className="custom-tabs-nav" style={{ display: 'flex', gap: '8px', borderBottom: 'none', marginBottom: 0, paddingBottom: 0, flexWrap: 'nowrap' }}>
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button 
                    key={tab.key}
                    type="button"
                    className={`custom-tabs-tab ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                    style={{ 
                      whiteSpace: 'nowrap', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontWeight: isActive ? 700 : 500
                    }}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subheader Toolbar: Search, Category Filter & View Mode */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '12px', 
              marginBottom: '24px',
              background: 'rgba(248, 250, 252, 0.7)',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(226, 232, 240, 0.6)'
            }}
          >
            {/* Live Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px', position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Cari nama pengurus, jabatan, daerah asal..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Category Pills Filter */}
            {categoriesInTab.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedKategori('ALL')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: selectedKategori === 'ALL' ? 700 : 500,
                    background: selectedKategori === 'ALL' ? '#3b82f6' : '#f1f5f9',
                    color: selectedKategori === 'ALL' ? '#ffffff' : '#64748b'
                  }}
                >
                  Semua ({strukturData.length})
                </button>
                {categoriesInTab.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedKategori(cat)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: selectedKategori === cat ? 700 : 500,
                      background: selectedKategori === cat ? '#3b82f6' : '#f1f5f9',
                      color: selectedKategori === cat ? '#ffffff' : '#64748b',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Tampilan Kartu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'grid' ? '#ffffff' : 'transparent',
                  color: viewMode === 'grid' ? '#0f172a' : '#64748b',
                  fontWeight: viewMode === 'grid' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <LayoutGrid size={13} />
                <span>Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Tampilan Tabel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#0f172a' : '#64748b',
                  fontWeight: viewMode === 'table' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <TableIcon size={13} />
                <span>Tabel</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="custom-tabs-content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
                <span style={{ marginTop: '12px', fontSize: '14px', fontWeight: 500, color: '#64748b' }}>
                  Memuat data kepengurusan...
                </span>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>

      {/* Modal Tugaskan / Edit Personel */}
      <CustomModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit / Tugaskan Personel"
        subtitle={`Posisi: ${selectedNode?.jabatan || ''}`}
        icon={<ShieldCheck />}
        width={480}
        destroyOnClose
        onOk={handleSave}
        okText={saveLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
        okLoading={saveLoading}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FloatingInput
            label="Kategori / Bidang"
            name="kategori"
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            disabled={saveLoading}
            placeholder="Contoh: Dewan Harian Putra, Seksi Keamanan"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <CustomSelect
              label="Pilih Guru / Ustadz Terdaftar"
              value={selectedGuruId}
              onChange={(val) => {
                setSelectedGuruId(val);
                if (val) {
                  setCustomName('');
                  setFormErrors({});
                }
              }}
              placeholder="Pilih dari database guru (opsional)"
              options={guruOptions}
              allowClear
              disabled={saveLoading}
            />
          </div>

          <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#94a3b8', margin: '2px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(226, 232, 240, 0.8)' }}></div>
            <span>Atau Nama Personel Kustom / Santri</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(226, 232, 240, 0.8)' }}></div>
          </div>

          <FloatingInput
            label="Nama Personel *"
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
            placeholder="Contoh: Sdr. Bara Alvin Azkia / Bpk. Indra Pratama"
          />

          <FloatingInput
            label="Asal Daerah / Alamat"
            name="alamat"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            disabled={saveLoading}
            placeholder="Contoh: Katibung, Sidomulyo, Way Sulan, Cirebon"
          />

          <FloatingInput
            label="Catatan / Bidang / Keterangan"
            name="keterangan"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            disabled={saveLoading}
            placeholder="Contoh: Koordinator Seksi, Wakil PJ: Bpk. Sifaul Huda"
          />
        </div>
      </CustomModal>

      {/* Modal Tambah Jabatan Baru */}
      <CustomModal
        open={addPosModalOpen}
        onClose={() => setAddPosModalOpen(false)}
        title="Tambah Jabatan / Posisi Baru"
        subtitle={`Tambahkan ke bagian ${activeTabMeta?.label || 'struktur'}`}
        icon={<Plus />}
        width={480}
        destroyOnClose
        onOk={handleAddCustomPosition}
        okText={addPosLoading ? 'Menyimpan...' : 'Tambah Jabatan'}
        okLoading={addPosLoading}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FloatingInput
            label="Nama Jabatan / Posisi *"
            value={newJabatan}
            onChange={(e) => setNewJabatan(e.target.value)}
            placeholder="Contoh: Seksi Keamanan, PJ Kamar B1"
          />

          <FloatingInput
            label="Kategori / Kelompok Bagian"
            value={newKategori}
            onChange={(e) => setNewKategori(e.target.value)}
            placeholder="Contoh: Dewan Pleno Putra, PJ Kamar Putra"
          />

          <CustomSelect
            label="Pilih Guru / Ustadz (Opsional)"
            value={newGuruId}
            onChange={(val) => {
              setNewGuruId(val);
              if (val) setNewNama('');
            }}
            placeholder="Pilih dari daftar guru jika ada"
            options={guruOptions}
            allowClear
          />

          <FloatingInput
            label="Atau Nama Personel Kustom / Santri *"
            value={newNama}
            onChange={(e) => {
              setNewNama(e.target.value);
              if (e.target.value) setNewGuruId(null);
            }}
            placeholder="Contoh: Bpk. Kelvin Kastawa"
            disabled={!!newGuruId}
          />

          <FloatingInput
            label="Asal Daerah / Alamat"
            value={newAlamat}
            onChange={(e) => setNewAlamat(e.target.value)}
            placeholder="Contoh: Sidomulyo, Katibung, Cintamulya"
          />

          <FloatingInput
            label="Keterangan / Bidang Tugas"
            value={newKeterangan}
            onChange={(e) => setNewKeterangan(e.target.value)}
            placeholder="Contoh: Koordinator Seksi, Anggota Seksi"
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

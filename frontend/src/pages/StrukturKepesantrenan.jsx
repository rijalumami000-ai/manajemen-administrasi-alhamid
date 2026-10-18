import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Users,
  GraduationCap,
  FileCheck,
  Settings2,
  FolderPlus,
  Sliders,
  Check,
  X,
  Edit2,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { strukturService } from '../services/strukturService';
import { guruService } from '../services/guruService';
import { CustomModal } from '../components/ui/CustomModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { FloatingInput } from '../components/ui/FloatingInput';
import { PageHeader, LoadingState, ErrorState, useToast } from '../components/common';
import './StrukturOrganisasi.scss';

const MAIN_TABS = [
  { key: 'dewan_penyantun', label: 'Dewan Penyantun', icon: Crown, color: 'accent-amber', desc: 'Pengasuh Ndalem, Dewan Penasihat & Pembina Asrama' },
  { key: 'pondok_putra', label: 'Pengurus Putra', icon: Building, color: 'accent-blue', desc: 'Dewan Harian, Dewan Pleno, PJ Kamar & Ketua Kamar Putra' },
  { key: 'pondok_putri', label: 'Pengurus Putri', icon: Building, color: 'accent-purple', desc: 'Dewan Harian, Dewan Pleno, PJ Komplek & Ketua Kamar Putri' },
  { key: 'jamiyyah', label: "Jam'iyyah Santri", icon: Users, color: 'accent-emerald', desc: "Jam'iyyah Pusat, Jam'iyyah Putra & Jam'iyyah Putri" },
  { key: 'pmq', label: 'Struktur PMQ', icon: BookOpen, color: 'accent-cyan', desc: "Pendidikan Murottilil Qur'an" },
  { key: 'madrasah_diniyah', label: 'Struktur Madrasah Diniyah', icon: GraduationCap, color: 'accent-blue', desc: 'Pimpinan & Pengurus Madrasah Diniyah' },
  { key: 'panitia_ujian', label: 'Panitia Ujian Semester', icon: FileCheck, color: 'accent-purple', desc: 'Kepanitiaan Ujian Semester Ganjil & Genap', isSemester: true },
  { key: 'panitia_sambangan', label: 'Panitia Sambangan', icon: Calendar, color: 'accent-amber', desc: 'Kepanitiaan Sambangan & Kunjungan Santri' },
  { key: 'panitia_haflah', label: 'Panitia Haflah', icon: Sparkles, color: 'accent-rose', desc: 'Kepanitiaan Haflah Akhirussanah' },
  { key: 'panitia_psb', label: 'Panitia PSB', icon: UserCheck, color: 'accent-slate', desc: 'Penerimaan Santri Baru' },
];

export function StrukturKepesantrenan({ defaultTab }) {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Main Tab
  const initialTab = defaultTab || searchParams.get('tab') || 'dewan_penyantun';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-tabs / Categories State
  const [categories, setCategories] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('Ganjil');

  // Academic Year State
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);

  // Main Data
  const [loading, setLoading] = useState(false);
  const [strukturData, setStrukturData] = useState([]);
  const [guruList, setGuruList] = useState([]);

  // Position Templates for Active Category
  const [jabatanTemplates, setJabatanTemplates] = useState([]);

  // ── Modals State ─────────────────────────────────────────────────────────
  // 1. Add / Edit Person Modal
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [personType, setPersonType] = useState('santri'); // 'santri' | 'guru' | 'manual'
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [selectedGuruId, setSelectedGuruId] = useState(null);
  const [customNama, setCustomNama] = useState('');
  const [customAlamat, setCustomAlamat] = useState('');
  const [modalJabatan, setModalJabatan] = useState('');
  const [isCustomJabatan, setIsCustomJabatan] = useState(false);
  const [modalKeterangan, setModalKeterangan] = useState('');
  const [modalNoUrut, setModalNoUrut] = useState(99);
  const [modalSemester, setModalSemester] = useState('Ganjil');
  const [saveLoading, setSaveLoading] = useState(false);

  // Live Santri Search inside Modal
  const [santriSearchQuery, setSantriSearchQuery] = useState('');
  const [santriSearchResults, setSantriSearchResults] = useState([]);
  const [santriSearching, setSantriSearching] = useState(false);

  // 2. Category Management Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [catActionLoading, setCatActionLoading] = useState(false);

  // 3. Jabatan Management Modal
  const [jabatanModalOpen, setJabatanModalOpen] = useState(false);
  const [newJabatanName, setNewJabatanName] = useState('');
  const [newJabatanKeterangan, setNewJabatanKeterangan] = useState('');
  const [editingJabatanId, setEditingJabatanId] = useState(null);
  const [editingJabatanName, setEditingJabatanName] = useState('');
  const [editingJabatanKeterangan, setEditingJabatanKeterangan] = useState('');
  const [jabActionLoading, setJabActionLoading] = useState(false);

  // 4. Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    nodeId: null,
    jabatan: '',
    nama: ''
  });

  // Current Main Tab Object
  const currentTabObj = MAIN_TABS.find(t => t.key === activeTab) || MAIN_TABS[0];
  const isPanitiaUjian = activeTab === 'panitia_ujian';

  // ── Initial Load: Academic Years & Teachers ──────────────────────────────
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [taList, gurus] = await Promise.all([
        strukturService.fetchTahunAjaran(),
        guruService.fetchGuru()
      ]);
      setTahunAjaranList(taList || []);
      setGuruList(gurus || []);

      const active = (taList || []).find(t => t.is_active);
      if (active) {
        setSelectedTahunAjaran(active.id);
      } else if (taList && taList.length > 0) {
        setSelectedTahunAjaran(taList[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  // ── When activeTab changes: load categories and select first sub-tab ──────
  useEffect(() => {
    if (isPanitiaUjian) {
      setCategories([
        { nama_kategori: 'Panitia Ujian', sem: 'Ganjil' },
        { nama_kategori: 'Panitia Ujian', sem: 'Genap' }
      ]);
      setSelectedSemester('Ganjil');
    } else {
      loadCategories(activeTab);
    }
  }, [activeTab]);

  const loadCategories = async (tipe) => {
    try {
      const list = await strukturService.fetchKategori(tipe);
      setCategories(list || []);
      if (list && list.length > 0) {
        setSelectedKategori(list[0].nama_kategori);
      } else {
        setSelectedKategori('');
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // ── Load Structure Data ──────────────────────────────────────────────────
  useEffect(() => {
    if (selectedTahunAjaran) {
      loadStruktur();
    }
  }, [activeTab, selectedTahunAjaran, selectedKategori, selectedSemester]);

  // Load configured Jabatan templates when active category changes
  useEffect(() => {
    if (activeTab && selectedKategori && !isPanitiaUjian) {
      loadJabatanTemplates(activeTab, selectedKategori);
    }
  }, [activeTab, selectedKategori]);

  const loadJabatanTemplates = async (tipe, kategori) => {
    try {
      const list = await strukturService.fetchJabatan(tipe, kategori);
      setJabatanTemplates(list || []);
    } catch (err) {
      console.error('Failed to load jabatan templates:', err);
    }
  };

  const loadStruktur = async () => {
    setLoading(true);
    try {
      const semParam = isPanitiaUjian ? selectedSemester : null;
      const katParam = isPanitiaUjian ? null : selectedKategori;
      const data = await strukturService.fetchStruktur(activeTab, selectedTahunAjaran, katParam, semParam);
      setStrukturData(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data struktur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Debounced Santri Search in Modal ──────────────────────────────────────
  const searchTimeoutRef = useRef(null);
  useEffect(() => {
    if (personType !== 'santri' || !personModalOpen) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setSantriSearching(true);
      try {
        const results = await strukturService.searchSantri(santriSearchQuery);
        setSantriSearchResults(results || []);
      } catch (err) {
        console.error('Santri search error:', err);
      } finally {
        setSantriSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [santriSearchQuery, personType, personModalOpen]);

  // ── Open Add Person Modal ────────────────────────────────────────────────
  const handleOpenAddModal = (presetJabatan = '', presetKeterangan = '') => {
    setEditingNodeId(null);
    setPersonType('santri');
    setSelectedSantri(null);
    setSelectedGuruId(null);
    setCustomNama('');
    setCustomAlamat('');
    setSantriSearchQuery('');
    setSantriSearchResults([]);
    setModalKeterangan(presetKeterangan || '');
    setModalNoUrut(strukturData.length + 1);
    setModalSemester(isPanitiaUjian ? selectedSemester : 'Ganjil');

    if (presetJabatan) {
      setModalJabatan(presetJabatan);
      setIsCustomJabatan(false);
    } else if (jabatanTemplates.length > 0) {
      setModalJabatan(jabatanTemplates[0].nama_jabatan);
      setIsCustomJabatan(false);
      if (jabatanTemplates[0].keterangan_default && !presetKeterangan) {
        setModalKeterangan(jabatanTemplates[0].keterangan_default);
      }
    } else {
      setModalJabatan('');
      setIsCustomJabatan(true);
    }

    setPersonModalOpen(true);
  };

  // ── Open Edit Person Modal ───────────────────────────────────────────────
  const handleOpenEditModal = (node) => {
    setEditingNodeId(node.id);
    setModalJabatan(node.jabatan || '');
    setIsCustomJabatan(false);
    setModalKeterangan(node.keterangan || '');
    setModalNoUrut(node.no_urut || 99);
    setModalSemester(node.semester || 'Ganjil');

    if (node.santri_id) {
      setPersonType('santri');
      setSelectedSantri({
        id: node.santri_id,
        nama: node.santri_nama || node.display_nama,
        nis: node.santri_nis,
        foto_url: node.santri_foto_url,
        alamat: node.santri_alamat
      });
      setSelectedGuruId(null);
      setCustomNama('');
      setCustomAlamat('');
    } else if (node.guru_id) {
      setPersonType('guru');
      setSelectedGuruId(node.guru_id);
      setSelectedSantri(null);
      setCustomNama('');
      setCustomAlamat('');
    } else {
      setPersonType('manual');
      setCustomNama(node.nama_custom || node.display_nama || '');
      setCustomAlamat(node.alamat || '');
      setSelectedSantri(null);
      setSelectedGuruId(null);
    }

    setPersonModalOpen(true);
  };

  // ── Save Person (Add or Update) ──────────────────────────────────────────
  const handleSavePerson = async (e) => {
    e.preventDefault();
    if (!modalJabatan.trim()) {
      toast.error('Nama jabatan wajib diisi.');
      return;
    }

    let guru_id = null;
    let santri_id = null;
    let nama_custom = null;
    let alamat = null;

    if (personType === 'santri') {
      if (!selectedSantri) {
        toast.error('Pilih santri dari Buku Induk terlebih dahulu.');
        return;
      }
      santri_id = selectedSantri.id;
      alamat = selectedSantri.alamat || null;
    } else if (personType === 'guru') {
      if (!selectedGuruId) {
        toast.error('Pilih guru/asatidz terlebih dahulu.');
        return;
      }
      guru_id = selectedGuruId;
    } else {
      if (!customNama.trim()) {
        toast.error('Nama pejabat wajib diisi.');
        return;
      }
      nama_custom = customNama.trim();
      alamat = customAlamat.trim() || null;
    }

    setSaveLoading(true);
    try {
      const payload = {
        tipe: activeTab,
        kategori: isPanitiaUjian ? 'Panitia Ujian' : (selectedKategori || 'Umum'),
        jabatan: modalJabatan.trim(),
        guru_id,
        santri_id,
        nama_custom,
        alamat,
        keterangan: modalKeterangan ? modalKeterangan.trim() : null,
        no_urut: Number(modalNoUrut) || 99,
        tahun_ajaran_id: selectedTahunAjaran,
        semester: isPanitiaUjian ? selectedSemester : null
      };

      if (editingNodeId) {
        await strukturService.updateStruktur({ id: editingNodeId, ...payload });
        toast.success('Data personel berhasil diperbarui.');
      } else {
        await strukturService.addStruktur(payload);
        toast.success('Personel baru berhasil ditambahkan.');
      }

      setPersonModalOpen(false);
      loadStruktur();
      loadCategories(activeTab);
      if (selectedKategori) loadJabatanTemplates(activeTab, selectedKategori);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal menyimpan data personel.');
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Delete Person ────────────────────────────────────────────────────────
  const handleDeletePerson = async () => {
    if (!deleteConfirm.nodeId) return;
    try {
      await strukturService.deleteStruktur(deleteConfirm.nodeId);
      toast.success('Personel berhasil dihapus.');
      setDeleteConfirm({ isOpen: false, nodeId: null, jabatan: '', nama: '' });
      loadStruktur();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal menghapus personel.');
    }
  };

  // ── Category Management Handlers ─────────────────────────────────────────
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatActionLoading(true);
    try {
      await strukturService.createKategori(activeTab, newCatName.trim(), categories.length + 1);
      toast.success(`Kategori "${newCatName}" berhasil ditambahkan.`);
      setNewCatName('');
      await loadCategories(activeTab);
      setSelectedKategori(newCatName.trim());
    } catch (err) {
      toast.error(err.message || 'Gagal menambahkan kategori.');
    } finally {
      setCatActionLoading(false);
    }
  };

  const handleUpdateCategory = async (id) => {
    if (!editingCatName.trim()) return;
    setCatActionLoading(true);
    try {
      await strukturService.updateKategori(id, editingCatName.trim());
      toast.success('Kategori berhasil diperbarui.');
      setEditingCatId(null);
      await loadCategories(activeTab);
      setSelectedKategori(editingCatName.trim());
      loadStruktur();
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui kategori.');
    } finally {
      setCatActionLoading(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!cat.id) {
      toast.error('Kategori bawaan belum tersimpan secara kustom.');
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus kategori "${cat.nama_kategori}"?`)) return;
    setCatActionLoading(true);
    try {
      await strukturService.deleteKategori(cat.id);
      toast.success('Kategori berhasil dihapus.');
      await loadCategories(activeTab);
    } catch (err) {
      if (err.count) {
        if (window.confirm(`${err.error}\n\nApakah Anda ingin MENGHAPUS SEMUA PERSONEL di kategori ini secara paksa?`)) {
          await strukturService.deleteKategori(cat.id, true);
          toast.success('Kategori dan seluruh personel terkait berhasil dihapus.');
          await loadCategories(activeTab);
          loadStruktur();
        }
      } else {
        toast.error(err.message || 'Gagal menghapus kategori.');
      }
    } finally {
      setCatActionLoading(false);
    }
  };

  // ── Jabatan Management Handlers ──────────────────────────────────────────
  const handleAddJabatan = async (e) => {
    e.preventDefault();
    if (!newJabatanName.trim() || !selectedKategori) return;
    setJabActionLoading(true);
    try {
      await strukturService.createJabatan(
        activeTab,
        selectedKategori,
        newJabatanName.trim(),
        newJabatanKeterangan.trim() || null,
        jabatanTemplates.length + 1
      );
      toast.success(`Jabatan "${newJabatanName}" berhasil ditambahkan.`);
      setNewJabatanName('');
      setNewJabatanKeterangan('');
      loadJabatanTemplates(activeTab, selectedKategori);
    } catch (err) {
      toast.error(err.message || 'Gagal menambahkan jabatan.');
    } finally {
      setJabActionLoading(false);
    }
  };

  const handleUpdateJabatan = async (id) => {
    if (!editingJabatanName.trim()) return;
    setJabActionLoading(true);
    try {
      await strukturService.updateJabatan(id, editingJabatanName.trim(), editingJabatanKeterangan.trim() || null);
      toast.success('Jabatan berhasil diperbarui.');
      setEditingJabatanId(null);
      loadJabatanTemplates(activeTab, selectedKategori);
      loadStruktur();
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui jabatan.');
    } finally {
      setJabActionLoading(false);
    }
  };

  const handleDeleteJabatan = async (id) => {
    if (!window.confirm('Hapus template jabatan ini dari daftar?')) return;
    setJabActionLoading(true);
    try {
      await strukturService.deleteJabatan(id);
      toast.success('Jabatan berhasil dihapus dari daftar opsi.');
      loadJabatanTemplates(activeTab, selectedKategori);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus jabatan.');
    } finally {
      setJabActionLoading(false);
    }
  };

  // ── Helper: Grouping Personnel into Unified Section Cards ────────────────
  // For sections (e.g. Seksi Keamanan, Seksi Media, Seksi Kebersihan, etc.),
  // Koordinator and Anggota must be unified into one visual card container!
  const groupedSections = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = strukturData.filter(item => {
      if (!query) return true;
      const nama = (item.display_nama || '').toLowerCase();
      const jabatan = (item.jabatan || '').toLowerCase();
      const alamat = (item.display_alamat || item.alamat || '').toLowerCase();
      const ket = (item.keterangan || '').toLowerCase();
      return nama.includes(query) || jabatan.includes(query) || alamat.includes(query) || ket.includes(query);
    });

    // Detect if items belong to a section with Koordinator & Anggota
    // We group by base section name (e.g. "Seksi Keamanan", "Seksi PHI")
    const groups = [];
    const sectionMap = new Map();

    for (const item of filtered) {
      const jab = item.jabatan || 'Anggota';
      const ket = (item.keterangan || '').toLowerCase();
      const isSeksi = jab.toLowerCase().startsWith('seksi ') || jab.toLowerCase().includes('seksi') || ket.includes('koordinator') || ket.includes('anggota');

      if (isSeksi) {
        // Group by base jabatan name
        if (!sectionMap.has(jab)) {
          sectionMap.set(jab, {
            isSection: true,
            title: jab,
            koordinator: null,
            anggota: []
          });
        }
        const sGroup = sectionMap.get(jab);
        const isKoor = ket.includes('koordinator') || jab.toLowerCase().includes('koordinator');
        if (isKoor && !sGroup.koordinator) {
          sGroup.koordinator = item;
        } else {
          sGroup.anggota.push(item);
        }
      } else {
        // Standalone person card
        groups.push({
          isSection: false,
          item
        });
      }
    }

    // Append all grouped sections
    for (const sGroup of sectionMap.values()) {
      groups.push(sGroup);
    }

    return groups;
  }, [strukturData, searchQuery]);

  // Helper for Circular Avatar
  const renderCircularAvatar = (item, size = 44) => {
    const foto = item.display_foto_url || item.guru_foto_url || item.santri_foto_url;
    const nama = item.display_nama || item.guru_nama || item.santri_nama || item.nama_custom || '?';
    const initial = nama.trim().charAt(0).toUpperCase();

    if (foto) {
      return (
        <img
          src={foto}
          alt={nama}
          className="rounded-full object-cover shadow-sm ring-2 ring-primary/20"
          style={{ width: `${size}px`, height: `${size}px` }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
          }}
        />
      );
    }

    // Pastel gradient fallback
    return (
      <div
        className="rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-primary/20 flex-shrink-0"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
          fontSize: `${Math.round(size * 0.4)}px`
        }}
      >
        {initial}
      </div>
    );
  };

  return (
    <div className="struktur-organisasi-page">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="page-header-container">
        <div className="header-left">
          <div className="header-icon">
            <currentTabObj.icon size={26} />
          </div>
          <div>
            <h1 className="page-title">{currentTabObj.label}</h1>
            <p className="page-subtitle">{currentTabObj.desc}</p>
          </div>
        </div>

        <div className="header-actions flex items-center gap-3 flex-wrap">
          {/* Academic Year Selector */}
          {tahunAjaranList.length > 0 && (
            <div className="tahun-ajaran-select" style={{ minWidth: '180px' }}>
              <CustomSelect
                label="Tahun Ajaran"
                value={selectedTahunAjaran}
                onChange={(val) => setSelectedTahunAjaran(Number(val))}
                options={tahunAjaranList.map(t => ({
                  value: t.id,
                  label: `${t.nama}${t.is_active ? ' (Aktif)' : ''}`
                }))}
              />
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="view-mode-toggle flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
              onClick={() => setViewMode('grid')}
              title="Tampilan Kartu"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
              onClick={() => setViewMode('table')}
              title="Tampilan Tabel"
            >
              <TableIcon size={18} />
            </button>
          </div>

          <button
            className="action-pill-btn"
            onClick={loadStruktur}
            title="Muat Ulang"
          >
            <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* ── Main Tabs Scrollbar ─────────────────────────────────────────── */}
      <div className="tabs-navigation">
        <div className="tabs-container">
          {MAIN_TABS.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                className={`tab-item ${isActive ? `active ${tab.color}` : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearchQuery('');
                }}
              >
                <div className="tab-icon-wrapper">
                  <IconComp size={18} />
                </div>
                <div className="tab-text-wrapper">
                  <span className="tab-label">{tab.label}</span>
                  <span className="tab-desc">{tab.desc.split(',')[0]}</span>
                </div>
                {isActive && <div className="active-indicator" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sub-Tabs (Categories) Bar & Management Controls ─────────────── */}
      <div className="subtabs-bar">
        {/* Subtabs list */}
        <div className="subtabs-scroll">
          {isPanitiaUjian ? (
            // Panitia Ujian has Semester Ganjil & Genap sub-tabs
            <>
              <button
                className={`subtab-pill ${selectedSemester === 'Ganjil' ? 'active' : ''}`}
                onClick={() => setSelectedSemester('Ganjil')}
              >
                <Calendar size={14} />
                <span>Semester Ganjil</span>
              </button>
              <button
                className={`subtab-pill ${selectedSemester === 'Genap' ? 'active' : ''}`}
                onClick={() => setSelectedSemester('Genap')}
              >
                <Calendar size={14} />
                <span>Semester Genap</span>
              </button>
            </>
          ) : (
            // Dynamic Categories for this Main Tab
            categories.map((cat, idx) => {
              const count = strukturData.filter(d => d.kategori === cat.nama_kategori).length;
              const isSelected = selectedKategori === cat.nama_kategori;
              return (
                <button
                  key={cat.id || idx}
                  className={`subtab-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedKategori(cat.nama_kategori)}
                >
                  <span>{cat.nama_kategori}</span>
                  {count > 0 && <span className="count-badge">{count}</span>}
                </button>
              );
            })
          )}
        </div>

        {/* Subtabs Action Buttons */}
        <div className="subtabs-actions">
          {isAdmin && !isPanitiaUjian && (
            <>
              <button
                className="action-pill-btn"
                onClick={() => setCategoryModalOpen(true)}
                title="Kelola Sub-Tab / Kategori Bagian"
              >
                <FolderPlus size={15} className="text-amber-500" />
                <span>Kelola Kategori</span>
              </button>

              <button
                className="action-pill-btn"
                onClick={() => setJabatanModalOpen(true)}
                title="Kelola Template Nama Jabatan untuk Sub-Tab ini"
              >
                <Sliders size={15} className="text-blue-500" />
                <span>Kelola Jabatan</span>
              </button>
            </>
          )}

          {isAdmin && (
            <button
              className="action-pill-btn primary-pill"
              onClick={() => handleOpenAddModal()}
            >
              <Plus size={16} />
              <span>Tambah Pejabat</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Search Bar Filter ────────────────────────────────────────────── */}
      <div className="search-filter-row flex items-center justify-between gap-4">
        <div className="search-input-wrapper relative flex-1" style={{ maxWidth: '420px' }}>
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            placeholder="Cari nama pejabat, jabatan, daerah asal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <strong>{groupedSections.length}</strong> posisi / seksi di sub-tab ini
        </div>
      </div>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <div className="content-layout">
        {loading ? (
          <div className="loading-container">
            <RefreshCw size={36} className="spin-anim text-blue-500 mb-3" />
            <p className="font-semibold text-slate-600">Memuat susunan struktur organisasi...</p>
          </div>
        ) : strukturData.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-500 mx-auto mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Belum Ada Pejabat di Sub-Tab Ini</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Silakan tambahkan personel kepengurusan atau konfigurasi template jabatan pada sub-tab {selectedKategori || 'ini'}.
            </p>
            {isAdmin && (
              <button
                className="action-pill-btn primary-pill mx-auto"
                onClick={() => handleOpenAddModal()}
              >
                <Plus size={16} />
                <span>Tambah Pejabat Sekarang</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ── GRID VIEW (Grouped Koordinator + Anggota) ─────────────────── */
          <div className="sections-container">
            {groupedSections.map((group, gIdx) => {
              if (group.isSection) {
                // Section Card: Unified Koordinator + Anggota
                return (
                  <div key={gIdx} className="section-group-card">
                    {/* Group Header */}
                    <div className="group-header">
                      <div className="group-title-box">
                        <div className="group-icon">
                          <ShieldCheck size={18} />
                        </div>
                        <h4 className="group-title">{group.title}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="group-count-badge">
                          {(group.koordinator ? 1 : 0) + group.anggota.length} Personel
                        </span>
                        {isAdmin && (
                          <button
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-slate-700 text-blue-600 hover:bg-blue-100 transition-colors"
                            onClick={() => handleOpenAddModal(group.title, 'Anggota Seksi')}
                            title={`Tambah Anggota ke ${group.title}`}
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="group-body">
                      {/* Koordinator Highlight Box */}
                      {group.koordinator ? (
                        <div className="koordinator-box">
                          <div className="flex items-center gap-3.5 min-w-0">
                            {renderCircularAvatar(group.koordinator, 48)}
                            <div className="min-w-0">
                              <span className="koor-badge">
                                <Crown size={12} />
                                <span>{group.koordinator.keterangan || 'Koordinator Seksi'}</span>
                              </span>
                              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                                {group.koordinator.display_nama}
                              </h5>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                {(group.koordinator.display_alamat || group.koordinator.alamat) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={11} />
                                    <span>{group.koordinator.display_alamat || group.koordinator.alamat}</span>
                                  </span>
                                )}
                                {group.koordinator.guru_no_hp && (
                                  <span className="flex items-center gap-1 text-emerald-600">
                                    <Phone size={11} />
                                    <span>{group.koordinator.guru_no_hp}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {isAdmin && (
                            <div className="card-actions-mini">
                              <button
                                className="mini-btn edit-mini"
                                onClick={() => handleOpenEditModal(group.koordinator)}
                                title="Edit Data"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                className="mini-btn delete-mini"
                                onClick={() => setDeleteConfirm({
                                  isOpen: true,
                                  nodeId: group.koordinator.id,
                                  jabatan: group.koordinator.jabatan,
                                  nama: group.koordinator.display_nama
                                })}
                                title="Hapus Personel"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        isAdmin && (
                          <div className="border border-dashed border-amber-300 dark:border-amber-800 rounded-xl p-3 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
                            <span>Posisi Koordinator untuk <strong>{group.title}</strong> belum ditentukan.</span>
                            <button
                              className="px-3 py-1 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors"
                              onClick={() => handleOpenAddModal(group.title, 'Koordinator Seksi')}
                            >
                              Tunjuk Koordinator
                            </button>
                          </div>
                        )
                      )}

                      {/* Anggota List inside the same card */}
                      {group.anggota.length > 0 && (
                        <div className="anggota-section">
                          <div className="anggota-section-title">
                            <Users size={12} />
                            <span>Anggota Seksi ({group.anggota.length})</span>
                          </div>

                          <div className="anggota-grid">
                            {group.anggota.map((ang) => (
                              <div key={ang.id} className="anggota-item-card">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {renderCircularAvatar(ang, 34)}
                                  <div className="min-w-0">
                                    <h6 className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                                      {ang.display_nama}
                                    </h6>
                                    <div className="text-[11px] text-slate-400 truncate">
                                      {ang.display_alamat || ang.alamat || ang.keterangan || 'Anggota'}
                                    </div>
                                  </div>
                                </div>

                                {isAdmin && (
                                  <div className="card-actions-mini">
                                    <button
                                      className="mini-btn edit-mini"
                                      onClick={() => handleOpenEditModal(ang)}
                                      title="Edit"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      className="mini-btn delete-mini"
                                      onClick={() => setDeleteConfirm({
                                        isOpen: true,
                                        nodeId: ang.id,
                                        jabatan: ang.jabatan,
                                        nama: ang.display_nama
                                      })}
                                      title="Hapus"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Standalone Single Person Card
              const item = group.item;
              return (
                <div key={item.id} className="struktur-card-node">
                  <div className="node-badge-row">
                    <span className="node-badge">{item.jabatan}</span>
                    {item.keterangan && (
                      <span className="text-xs text-slate-400 font-medium">{item.keterangan}</span>
                    )}
                  </div>

                  <div className="node-main-content">
                    <div className="node-avatar-box">
                      {renderCircularAvatar(item, 46)}
                    </div>

                    <div className="node-info">
                      <h4 className="person-name">{item.display_nama}</h4>
                      {(item.display_alamat || item.alamat) && (
                        <div className="person-phone">
                          <MapPin size={12} className="mr-1" />
                          <span>{item.display_alamat || item.alamat}</span>
                        </div>
                      )}
                      {item.guru_no_hp && (
                        <div className="person-phone text-emerald-600">
                          <Phone size={12} className="mr-1" />
                          <span>{item.guru_no_hp}</span>
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="card-actions-row">
                        <button
                          className="action-icon-btn node-edit-btn"
                          onClick={() => handleOpenEditModal(item)}
                          title="Edit Personel"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="action-icon-btn node-delete-btn"
                          onClick={() => setDeleteConfirm({
                            isOpen: true,
                            nodeId: item.id,
                            jabatan: item.jabatan,
                            nama: item.display_nama
                          })}
                          title="Hapus Personel"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── TABLE VIEW ─────────────────────────────────────────────────── */
          <div className="table-responsive bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Personel</th>
                  <th className="py-3.5 px-4">Jabatan / Posisi</th>
                  <th className="py-3.5 px-4">Kategori / Sub-Tab</th>
                  <th className="py-3.5 px-4">Tugas / Keterangan</th>
                  <th className="py-3.5 px-4">Alamat / Kontak</th>
                  {isAdmin && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {strukturData.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {renderCircularAvatar(row, 36)}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{row.display_nama}</div>
                          {row.santri_nis && (
                            <div className="text-[11px] text-slate-400 font-mono">NIS: {row.santri_nis}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{row.jabatan}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {row.kategori || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {row.keterangan || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {row.display_alamat || row.alamat || row.guru_no_hp || '-'}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            onClick={() => handleOpenEditModal(row)}
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            onClick={() => setDeleteConfirm({
                              isOpen: true,
                              nodeId: row.id,
                              jabatan: row.jabatan,
                              nama: row.display_nama
                            })}
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: TAMBAH / EDIT PEJABAT                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <CustomModal
        isOpen={personModalOpen}
        onClose={() => setPersonModalOpen(false)}
        title={editingNodeId ? 'Edit Pejabat / Pengurus' : 'Tambah Pejabat Baru'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSavePerson} className="space-y-4">
          {/* Active Sub-Tab Info Banner */}
          <div className="p-3 bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Sub-Tab / Kategori:</span>
              <strong className="ml-1.5 text-blue-700 dark:text-blue-300 font-bold">
                {isPanitiaUjian ? `Panitia Ujian (${modalSemester})` : (selectedKategori || 'Umum')}
              </strong>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-semibold text-[10px]">
              {currentTabObj.label}
            </span>
          </div>

          {/* Jabatan Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nama Jabatan / Posisi <span className="text-red-500">*</span>
            </label>
            {!isCustomJabatan && jabatanTemplates.length > 0 ? (
              <div className="space-y-2">
                <select
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={modalJabatan}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__CUSTOM__') {
                      setIsCustomJabatan(true);
                      setModalJabatan('');
                    } else {
                      setModalJabatan(val);
                      const tmpl = jabatanTemplates.find(t => t.nama_jabatan === val);
                      if (tmpl && tmpl.keterangan_default && !modalKeterangan) {
                        setModalKeterangan(tmpl.keterangan_default);
                      }
                    }
                  }}
                >
                  {jabatanTemplates.map((t) => (
                    <option key={t.id} value={t.nama_jabatan}>
                      {t.nama_jabatan} {t.keterangan_default ? `(${t.keterangan_default})` : ''}
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ Ketik Jabatan Kustom Baru...</option>
                </select>
              </div>
            ) : (
              <div className="relative">
                <FloatingInput
                  label="Nama Jabatan (misal: Seksi Keamanan, Ketua Kamar 01)"
                  value={modalJabatan}
                  onChange={(e) => setModalJabatan(e.target.value)}
                  required
                />
                {jabatanTemplates.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-blue-600 mt-1 hover:underline font-semibold"
                    onClick={() => {
                      setIsCustomJabatan(false);
                      setModalJabatan(jabatanTemplates[0].nama_jabatan);
                    }}
                  >
                    ← Pilih dari daftar jabatan terdaftar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Person Type Selector: Santri (Buku Induk) vs Guru vs Manual */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Pilih Sumber Pejabat:
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  personType === 'santri'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setPersonType('santri')}
              >
                Santri (Buku Induk)
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  personType === 'guru'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setPersonType('guru')}
              >
                Guru / Asatidz
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  personType === 'manual'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setPersonType('manual')}
              >
                Input Manual
              </button>
            </div>
          </div>

          {/* OPSI 1: SANTRI DARI BUKU INDUK */}
          {personType === 'santri' && (
            <div className="space-y-3 pt-1">
              <div className="relative">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Cari Nama Santri atau NIS dari Buku Induk:
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ketik minimal 2 huruf nama santri atau NIS..."
                    value={santriSearchQuery}
                    onChange={(e) => setSantriSearchQuery(e.target.value)}
                  />
                  {santriSearching && (
                    <RefreshCw size={14} className="spin-anim absolute right-3 top-1/2 -translate-y-1/2 text-blue-500" />
                  )}
                </div>

                {/* Dropdown Results */}
                {santriSearchResults.length > 0 && !selectedSantri && (
                  <div className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                    {santriSearchResults.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedSantri(s);
                          setSantriSearchQuery('');
                          setSantriSearchResults([]);
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          {renderCircularAvatar({ display_nama: s.nama, display_foto_url: s.foto_url }, 34)}
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{s.nama}</div>
                            <div className="text-[11px] text-slate-400">
                              NIS: {s.nis || '-'} • {s.kelas_diniyah || s.kamar || s.jenis_kelamin || ''}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-blue-600 font-semibold">Pilih</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Santri Preview Card */}
              {selectedSantri && (
                <div className="p-3 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {renderCircularAvatar({ display_nama: selectedSantri.nama, display_foto_url: selectedSantri.foto_url }, 42)}
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedSantri.nama}</div>
                      <div className="text-xs text-slate-500">
                        NIS: {selectedSantri.nis || '-'} • {selectedSantri.alamat || 'Alamat pesantren'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    onClick={() => setSelectedSantri(null)}
                    title="Ganti Santri"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* OPSI 2: GURU / ASATIDZ */}
          {personType === 'guru' && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                Pilih Dewan Guru / Asatidz:
              </label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                value={selectedGuruId || ''}
                onChange={(e) => setSelectedGuruId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">-- Pilih Asatidz --</option>
                {guruList.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nama} {g.no_hp ? `(${g.no_hp})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* OPSI 3: INPUT MANUAL */}
          {personType === 'manual' && (
            <div className="space-y-3 pt-1">
              <FloatingInput
                label="Nama Lengkap Pejabat (misal: Bpk. Sifaul Huda)"
                value={customNama}
                onChange={(e) => setCustomNama(e.target.value)}
                required
              />
              <FloatingInput
                label="Alamat / Domisili Asal (misal: Cilacap, Jawa Tengah)"
                value={customAlamat}
                onChange={(e) => setCustomAlamat(e.target.value)}
              />
            </div>
          )}

          {/* Bidang Tugas / Keterangan (e.g. Koordinator Seksi, Anggota Seksi) */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tugas / Keterangan
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Koordinator Seksi / Anggota Seksi"
                value={modalKeterangan}
                onChange={(e) => setModalKeterangan(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nomor Urut Tampil
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={modalNoUrut}
                onChange={(e) => setModalNoUrut(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
              onClick={() => setPersonModalOpen(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saveLoading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
            >
              {saveLoading && <RefreshCw size={14} className="spin-anim" />}
              <span>{editingNodeId ? 'Simpan Perubahan' : 'Tambahkan Pejabat'}</span>
            </button>
          </div>
        </form>
      </CustomModal>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: KELOLA KATEGORI / SUB-TAB                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <CustomModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={`Kelola Kategori / Bagian (${currentTabObj.label})`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Kategori ini menjadi sub-tab mandiri untuk mengelompokkan struktur kepengurusan.
          </p>

          {/* Form Tambah Kategori */}
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              placeholder="Nama Kategori Baru (misal: Dewan Penasihat)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
            />
            <button
              type="submit"
              disabled={catActionLoading || !newCatName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow hover:bg-blue-700 transition-colors flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Tambah</span>
            </button>
          </form>

          {/* List Existing Categories */}
          <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {categories.map((cat) => (
              <div key={cat.id || cat.nama_kategori} className="pt-2 pb-2 flex items-center justify-between gap-2">
                {editingCatId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-blue-400 text-xs font-semibold bg-white dark:bg-slate-800"
                    />
                    <button
                      className="p-1.5 bg-emerald-600 text-white rounded-lg"
                      onClick={() => handleUpdateCategory(cat.id)}
                    >
                      <Check size={13} />
                    </button>
                    <button
                      className="p-1.5 bg-slate-200 text-slate-600 rounded-lg"
                      onClick={() => setEditingCatId(null)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {cat.nama_kategori}
                    </span>
                    <div className="flex items-center gap-1">
                      {cat.id && (
                        <>
                          <button
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditingCatName(cat.nama_kategori);
                            }}
                            title="Edit Nama"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            onClick={() => handleDeleteCategory(cat)}
                            title="Hapus Kategori"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200"
              onClick={() => setCategoryModalOpen(false)}
            >
              Tutup
            </button>
          </div>
        </div>
      </CustomModal>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: KELOLA JABATAN PADA SUB-TAB                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <CustomModal
        isOpen={jabatanModalOpen}
        onClose={() => setJabatanModalOpen(false)}
        title={`Kelola Nama Jabatan (${selectedKategori || 'Sub-Tab'})`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Daftar posisi jabatan yang dapat dipilih saat menambahkan pejabat pada sub-tab <strong>{selectedKategori}</strong>.
          </p>

          {/* Form Tambah Jabatan Template */}
          <form onSubmit={handleAddJabatan} className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="font-semibold text-xs text-slate-700 dark:text-slate-300">Tambah Opsi Jabatan Baru:</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama Jabatan (misal: Seksi Media)"
                value={newJabatanName}
                onChange={(e) => setNewJabatanName(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white dark:bg-slate-700"
                required
              />
              <input
                type="text"
                placeholder="Tugas Default (opsional)"
                value={newJabatanKeterangan}
                onChange={(e) => setNewJabatanKeterangan(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white dark:bg-slate-700"
              />
            </div>
            <button
              type="submit"
              disabled={jabActionLoading || !newJabatanName.trim()}
              className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
            >
              <Plus size={13} />
              <span>Tambahkan ke Opsi Jabatan</span>
            </button>
          </form>

          {/* List Configured Positions */}
          <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {jabatanTemplates.map((t) => (
              <div key={t.id} className="pt-2 pb-2 flex items-center justify-between gap-2">
                {editingJabatanId === t.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingJabatanName}
                      onChange={(e) => setEditingJabatanName(e.target.value)}
                      className="flex-1 px-2.5 py-1 rounded-lg border border-blue-400 text-xs font-semibold bg-white dark:bg-slate-800"
                    />
                    <button
                      className="p-1 bg-emerald-600 text-white rounded-lg"
                      onClick={() => handleUpdateJabatan(t.id)}
                    >
                      <Check size={13} />
                    </button>
                    <button
                      className="p-1 bg-slate-200 text-slate-600 rounded-lg"
                      onClick={() => setEditingJabatanId(null)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        {t.nama_jabatan}
                      </div>
                      {t.keterangan_default && (
                        <div className="text-[10px] text-slate-400">{t.keterangan_default}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                        onClick={() => {
                          setEditingJabatanId(t.id);
                          setEditingJabatanName(t.nama_jabatan);
                          setEditingJabatanKeterangan(t.keterangan_default || '');
                        }}
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                        onClick={() => handleDeleteJabatan(t.id)}
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200"
              onClick={() => setJabatanModalOpen(false)}
            >
              Tutup
            </button>
          </div>
        </div>
      </CustomModal>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: KONFIRMASI HAPUS                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <CustomModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, nodeId: null, jabatan: '', nama: '' })}
        title="Hapus Pejabat"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-red-700 dark:text-red-300">
              Apakah Anda yakin ingin menghapus <strong>{deleteConfirm.nama}</strong> dari posisi{' '}
              <strong>{deleteConfirm.jabatan}</strong>? Tindakan ini tidak dapat dibatalkan.
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-50"
              onClick={() => setDeleteConfirm({ isOpen: false, nodeId: null, jabatan: '', nama: '' })}
            >
              Batal
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow-sm"
              onClick={handleDeletePerson}
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default StrukturKepesantrenan;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Phone, 
  Trash2, 
  RefreshCw, 
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
  Users, 
  GraduationCap, 
  FileCheck, 
  FolderPlus, 
  Sliders, 
  Check, 
  X, 
  Edit2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { strukturService } from '../services/strukturService';
import { guruService } from '../services/guruService';
import { CustomModal } from '../components/ui/CustomModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { FloatingInput } from '../components/ui/FloatingInput';
import { useToast } from '../components/common';
import type { 
  StrukturItem, 
  KategoriItem, 
  JabatanTemplateItem, 
  TahunAjaranItem, 
  SantriSearchResult, 
  MainTabItem, 
  DeleteConfirmState, 
  GuruItem, 
  GroupedSection, 
  StrukturKepesantrenanProps 
} from '../types/struktur';
import './StrukturOrganisasi.scss';

const MAIN_TABS: MainTabItem[] = [
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

export function StrukturKepesantrenan({ defaultTab }: StrukturKepesantrenanProps) {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  // Active Main Tab
  const initialTab = defaultTab || searchParams.get('tab') || 'dewan_penyantun';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sub-tabs / Categories State
  const [categories, setCategories] = useState<KategoriItem[]>([]);
  const [selectedKategori, setSelectedKategori] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('Ganjil');

  // Academic Year State
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranItem[]>([]);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<number | null>(null);

  // Main Data
  const [loading, setLoading] = useState<boolean>(false);
  const [strukturData, setStrukturData] = useState<StrukturItem[]>([]);
  const [guruList, setGuruList] = useState<GuruItem[]>([]);

  // Position Templates for Active Category
  const [jabatanTemplates, setJabatanTemplates] = useState<JabatanTemplateItem[]>([]);

  // ── Modals State ─────────────────────────────────────────────────────────
  // 1. Add / Edit Person Modal
  const [personModalOpen, setPersonModalOpen] = useState<boolean>(false);
  const [editingNodeId, setEditingNodeId] = useState<number | null>(null);
  const [personType, setPersonType] = useState<'santri' | 'guru' | 'manual'>('santri');
  const [selectedSantri, setSelectedSantri] = useState<SantriSearchResult | null>(null);
  const [selectedGuruId, setSelectedGuruId] = useState<number | null>(null);
  const [customNama, setCustomNama] = useState<string>('');
  const [customAlamat, setCustomAlamat] = useState<string>('');
  const [modalJabatan, setModalJabatan] = useState<string>('');
  const [isCustomJabatan, setIsCustomJabatan] = useState<boolean>(false);
  const [modalKeterangan, setModalKeterangan] = useState<string>('');
  const [modalNoUrut, setModalNoUrut] = useState<number>(99);
  const [modalSemester, setModalSemester] = useState<string>('Ganjil');
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // Live Santri Search inside Modal
  const [santriSearchQuery, setSantriSearchQuery] = useState<string>('');
  const [santriSearchResults, setSantriSearchResults] = useState<SantriSearchResult[]>([]);
  const [santriSearching, setSantriSearching] = useState<boolean>(false);

  // 2. Category Management Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState<string>('');
  const [catActionLoading, setCatActionLoading] = useState<boolean>(false);

  // 3. Jabatan Management Modal
  const [jabatanModalOpen, setJabatanModalOpen] = useState<boolean>(false);
  const [newJabatanName, setNewJabatanName] = useState<string>('');
  const [newJabatanKeterangan, setNewJabatanKeterangan] = useState<string>('');
  const [editingJabatanId, setEditingJabatanId] = useState<number | null>(null);
  const [editingJabatanName, setEditingJabatanName] = useState<string>('');
  const [editingJabatanKeterangan, setEditingJabatanKeterangan] = useState<string>('');
  const [jabActionLoading, setJabActionLoading] = useState<boolean>(false);

  // 4. Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
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

      const active = (taList || []).find((t: TahunAjaranItem) => t.is_active);
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

  const loadCategories = async (tipe: string) => {
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

  const loadJabatanTemplates = async (tipe: string, kategori: string) => {
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
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal memuat data struktur: ' + (error?.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  // ── Debounced Santri Search in Modal ──────────────────────────────────────
  const searchTimeoutRef = useRef<any>(null);
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
  const handleOpenEditModal = (node: StrukturItem) => {
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
        nis: node.santri_nis || undefined,
        foto_url: node.santri_foto_url,
        alamat: node.santri_alamat || undefined
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
  const handleSavePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalJabatan.trim()) {
      toast.error('Nama jabatan wajib diisi.');
      return;
    }

    let guru_id: number | null = null;
    let santri_id: number | null = null;
    let nama_custom: string | null = null;
    let alamat: string | null = null;

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
    } catch (err: any) {
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal menghapus personel.');
    }
  };

  // ── Category Management Handlers ─────────────────────────────────────────
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatActionLoading(true);
    try {
      await strukturService.createKategori(activeTab, newCatName.trim(), categories.length + 1);
      toast.success(`Kategori "${newCatName}" berhasil ditambahkan.`);
      setNewCatName('');
      await loadCategories(activeTab);
      setSelectedKategori(newCatName.trim());
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan kategori.');
    } finally {
      setCatActionLoading(false);
    }
  };

  const handleUpdateCategory = async (id: number) => {
    if (!editingCatName.trim()) return;
    setCatActionLoading(true);
    try {
      await strukturService.updateKategori(id, editingCatName.trim());
      toast.success('Kategori berhasil diperbarui.');
      setEditingCatId(null);
      await loadCategories(activeTab);
      setSelectedKategori(editingCatName.trim());
      loadStruktur();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui kategori.');
    } finally {
      setCatActionLoading(false);
    }
  };

  const handleDeleteCategory = async (cat: KategoriItem) => {
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
    } catch (err: any) {
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
  const handleAddJabatan = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan jabatan.');
    } finally {
      setJabActionLoading(false);
    }
  };

  const handleUpdateJabatan = async (id: number) => {
    if (!editingJabatanName.trim()) return;
    setJabActionLoading(true);
    try {
      await strukturService.updateJabatan(id, editingJabatanName.trim(), editingJabatanKeterangan.trim() || null);
      toast.success('Jabatan berhasil diperbarui.');
      setEditingJabatanId(null);
      loadJabatanTemplates(activeTab, selectedKategori);
      loadStruktur();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui jabatan.');
    } finally {
      setJabActionLoading(false);
    }
  };

  const handleDeleteJabatan = async (id: number) => {
    if (!window.confirm('Hapus template jabatan ini dari daftar?')) return;
    setJabActionLoading(true);
    try {
      await strukturService.deleteJabatan(id);
      toast.success('Jabatan berhasil dihapus dari daftar opsi.');
      loadJabatanTemplates(activeTab, selectedKategori);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus jabatan.');
    } finally {
      setJabActionLoading(false);
    }
  };

  // ── Helper: Grouping Personnel into Unified Section Cards ────────────────
  const groupedSections: GroupedSection[] = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = strukturData.filter(item => {
      if (!query) return true;
      const nama = (item.display_nama || '').toLowerCase();
      const jabatan = (item.jabatan || '').toLowerCase();
      const alamat = (item.display_alamat || item.alamat || '').toLowerCase();
      const ket = (item.keterangan || '').toLowerCase();
      return nama.includes(query) || jabatan.includes(query) || alamat.includes(query) || ket.includes(query);
    });

    const groups: GroupedSection[] = [];
    const sectionMap = new Map<string, { isSection: boolean; title: string; koordinator: StrukturItem | null; anggota: StrukturItem[] }>();

    for (const item of filtered) {
      const jab = item.jabatan || 'Anggota';
      const ket = (item.keterangan || '').toLowerCase();
      const isSeksi = jab.toLowerCase().startsWith('seksi ') || jab.toLowerCase().includes('seksi') || ket.includes('koordinator') || ket.includes('anggota');

      if (isSeksi) {
        if (!sectionMap.has(jab)) {
          sectionMap.set(jab, {
            isSection: true,
            title: jab,
            koordinator: null,
            anggota: []
          });
        }
        const sGroup = sectionMap.get(jab)!;
        const isKoor = ket.includes('koordinator') || jab.toLowerCase().includes('koordinator');
        if (isKoor && !sGroup.koordinator) {
          sGroup.koordinator = item;
        } else {
          sGroup.anggota.push(item);
        }
      } else {
        groups.push({
          isSection: false,
          item
        });
      }
    }

    for (const sGroup of sectionMap.values()) {
      groups.push(sGroup);
    }

    return groups;
  }, [strukturData, searchQuery]);

  // Helper for Circular Avatar
  const renderCircularAvatar = (item: { display_foto_url?: string | null; guru_foto_url?: string | null; santri_foto_url?: string | null; display_nama?: string; guru_nama?: string | null; santri_nama?: string | null; nama_custom?: string | null }, size = 44) => {
    const foto = item.display_foto_url || item.guru_foto_url || item.santri_foto_url;
    const nama = item.display_nama || item.guru_nama || item.santri_nama || item.nama_custom || '?';
    const initial = (nama.trim().charAt(0) || '?').toUpperCase();

    return (
      <div
        className="circular-avatar-box"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: `${Math.round(size * 0.42)}px`,
          lineHeight: '1',
          textAlign: 'center',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          boxShadow: '0 3px 10px rgba(59, 130, 246, 0.25)',
          border: '2px solid rgba(255, 255, 255, 0.9)'
        }}
      >
        {foto ? (
          <img
            src={foto}
            alt={nama}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 2
            }}
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}
        <span style={{ color: '#ffffff', display: 'block', lineHeight: 1, zIndex: 1, fontWeight: 800 }}>
          {initial}
        </span>
      </div>
    );
  };

  return (
    <div className="struktur-organisasi-page">
      {/* ─── 1. APPLE FLOATING DOCK HEADER ───────────────────────── */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">{currentTabObj.label}</h2>
          <p className="page-subtitle">{currentTabObj.desc}</p>
        </div>

        <div className="header-actions-row">
          {/* Academic Year Selector */}
          {tahunAjaranList.length > 0 && (
            <div className="tahun-ajaran-select" style={{ minWidth: '180px' }}>
              <CustomSelect
                label="Tahun Ajaran"
                value={selectedTahunAjaran}
                onChange={(val) => setSelectedTahunAjaran(Number(val))}
                options={tahunAjaranList.map(t => ({
                  value: t.id,
                  label: `${t.kode || t.nama || 'Tahun Ajaran'}${t.is_active ? ' (Aktif)' : ''}`
                }))}
              />
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Tampilan Kartu"
            >
              <LayoutGrid size={17} />
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Tampilan Tabel"
            >
              <TableIcon size={17} />
            </button>
          </div>

          <button
            type="button"
            className="action-pill-btn"
            onClick={loadStruktur}
            title="Muat Ulang"
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </header>

      {/* ── Main Tabs Scrollbar ─────────────────────────────────────────── */}
      <div className="tabs-navigation">
        <div className="tabs-container">
          {MAIN_TABS.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                type="button"
                key={tab.key}
                className={`tab-item ${isActive ? `active ${tab.color}` : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearchQuery('');
                }}
                title={tab.desc}
              >
                <div className="tab-icon-wrapper">
                  <IconComp size={17} />
                </div>
                <span className="tab-label">{tab.label}</span>
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
            <>
              <button
                type="button"
                className={`subtab-pill ${selectedSemester === 'Ganjil' ? 'active' : ''}`}
                onClick={() => setSelectedSemester('Ganjil')}
              >
                <Calendar size={14} />
                <span>Semester Ganjil</span>
              </button>
              <button
                type="button"
                className={`subtab-pill ${selectedSemester === 'Genap' ? 'active' : ''}`}
                onClick={() => setSelectedSemester('Genap')}
              >
                <Calendar size={14} />
                <span>Semester Genap</span>
              </button>
            </>
          ) : (
            categories.map((cat, idx) => {
              const count = strukturData.filter(d => d.kategori === cat.nama_kategori).length;
              const isSelected = selectedKategori === cat.nama_kategori;
              return (
                <button
                  type="button"
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
                type="button"
                className="action-pill-btn"
                onClick={() => setCategoryModalOpen(true)}
                title="Kelola Sub-Tab / Kategori Bagian"
              >
                <FolderPlus size={15} className="text-amber-500" />
                <span>Kelola Kategori</span>
              </button>

              <button
                type="button"
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
              type="button"
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
      <div className="search-filter-row">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon-inside" />
          <input
            type="text"
            className="search-field-input"
            placeholder="Cari nama pejabat, jabatan, daerah asal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="clear-search-btn"
              title="Bersihkan Pencarian"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="search-count-label">
          Menampilkan <strong>{groupedSections.length}</strong> posisi / seksi di sub-tab ini
        </div>
      </div>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <div className="content-layout">
        {loading ? (
          <div className="loading-container">
            <RefreshCw size={36} className="spin-anim mb-3" style={{ color: '#3b82f6' }} />
            <p style={{ fontWeight: 600, color: '#475569' }}>Memuat susunan struktur organisasi...</p>
          </div>
        ) : strukturData.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon-circle">
              <Users size={32} />
            </div>
            <h3 className="empty-title">Belum Ada Pejabat di Sub-Tab Ini</h3>
            <p className="empty-desc">
              Silakan tambahkan personel kepengurusan atau konfigurasi template jabatan pada sub-tab {selectedKategori || 'ini'}.
            </p>
            {isAdmin && (
              <button
                className="action-pill-btn primary-pill"
                onClick={() => handleOpenAddModal()}
              >
                <Plus size={16} />
                <span>Tambah Pejabat Sekarang</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ── GRID VIEW (Standalone Multi-Column Grid + Section Group Cards) ─── */
          <>
            {/* Standalone Personnel Cards in a Handsome Multi-Column Grid */}
            {groupedSections.some(g => !g.isSection) && (
              <div className="standalone-grid">
                {groupedSections.filter(g => !g.isSection).map((group) => {
                  const item = group.item!;
                  const cleanAlamat = (item.display_alamat || item.alamat || '').trim();
                  const hasAlamat = cleanAlamat && cleanAlamat !== '-' && cleanAlamat !== 'null' && cleanAlamat !== 'undefined';
                  const cleanPhone = (item.guru_no_hp || '').trim();
                  const hasPhone = cleanPhone && cleanPhone !== '-' && cleanPhone !== 'null' && cleanPhone !== 'undefined';

                  return (
                    <div key={item.id} className="struktur-card-node">
                      <div className="node-badge-row">
                        <span className="node-badge">{item.jabatan}</span>
                        {item.keterangan && (
                          <span className="node-ket">{item.keterangan}</span>
                        )}
                      </div>

                      <div className="node-main-content">
                        <div className="node-avatar-box">
                          {renderCircularAvatar(item, 48)}
                        </div>

                        <div className="node-info">
                          <h4 className="person-name">{item.display_nama}</h4>
                          <div className="person-phone">
                            {hasAlamat && (
                              <span className="detail-item">
                                <MapPin size={11} />
                                <span>{cleanAlamat}</span>
                              </span>
                            )}
                            {hasPhone && (
                              <span className="detail-item phone-link">
                                <Phone size={11} />
                                <span>{cleanPhone}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="card-actions-row">
                            <button
                              type="button"
                              className="action-icon-btn node-edit-btn"
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit Personel"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn node-delete-btn"
                              onClick={() => setDeleteConfirm({
                                isOpen: true,
                                nodeId: item.id,
                                jabatan: item.jabatan,
                                nama: item.display_nama
                              })}
                              title="Hapus Personel"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Unified Section Group Cards (Koordinator + Anggota) */}
            {groupedSections.some(g => g.isSection) && (
              <div className="sections-grid">
                {groupedSections.filter(g => g.isSection).map((group, sIdx) => {
                  const koor = group.koordinator;
                  const cleanKoorAlamat = (koor?.display_alamat || koor?.alamat || '').trim();
                  const hasKoorAlamat = cleanKoorAlamat && cleanKoorAlamat !== '-' && cleanKoorAlamat !== 'null';
                  const cleanKoorPhone = (koor?.guru_no_hp || '').trim();
                  const hasKoorPhone = cleanKoorPhone && cleanKoorPhone !== '-' && cleanKoorPhone !== 'null';

                  return (
                    <div key={sIdx} className="section-group-card">
                      {/* Section Card Header */}
                      <div className="section-header">
                        <div className="section-title-wrap">
                          <span className="section-pill-tag">Divisi / Bidang</span>
                          <h3 className="section-main-title">{group.title}</h3>
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            className="action-pill-btn primary-pill add-anggota-btn"
                            onClick={() => handleOpenAddModal(group.title, 'Anggota Seksi')}
                            title={`Tambah anggota untuk ${group.title}`}
                          >
                            <Plus size={14} />
                            <span>Tambah Anggota</span>
                          </button>
                        )}
                      </div>

                      {/* Section Card Body */}
                      <div className="section-body">
                        {/* Koordinator Hero Banner inside the card */}
                        {koor ? (
                          <div className="koordinator-hero-box">
                            <div className="koor-left">
                              {renderCircularAvatar(koor, 48)}
                              <div className="koor-text-wrap">
                                <span className="koor-badge">
                                  <Crown size={12} />
                                  <span>{koor.keterangan || 'Koordinator'}</span>
                                </span>
                                <h5 className="koor-name">{koor.display_nama}</h5>
                                <div className="koor-details">
                                  {hasKoorAlamat && (
                                    <span className="detail-item">
                                      <MapPin size={11} />
                                      <span>{cleanKoorAlamat}</span>
                                    </span>
                                  )}
                                  {hasKoorPhone && (
                                    <span className="detail-item phone-link">
                                      <Phone size={11} />
                                      <span>{cleanKoorPhone}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {isAdmin && (
                              <div className="card-actions-mini">
                                <button
                                  type="button"
                                  className="mini-btn edit-mini"
                                  onClick={() => handleOpenEditModal(koor)}
                                  title="Edit Koordinator"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  className="mini-btn delete-mini"
                                  onClick={() => setDeleteConfirm({
                                    isOpen: true,
                                    nodeId: koor.id,
                                    jabatan: koor.jabatan,
                                    nama: koor.display_nama
                                  })}
                                  title="Hapus Koordinator"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          isAdmin && (
                            <div style={{
                              border: '1px dashed #f59e0b',
                              borderRadius: '12px',
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '12px',
                              color: '#b45309',
                              background: 'rgba(254, 243, 199, 0.4)'
                            }}>
                              <span>Posisi Koordinator untuk <strong>{group.title}</strong> belum ditentukan.</span>
                              <button
                                type="button"
                                className="action-pill-btn amber-pill"
                                style={{ padding: '4px 12px', fontSize: '11.5px' }}
                                onClick={() => handleOpenAddModal(group.title, 'Koordinator Seksi')}
                              >
                                Tunjuk Koordinator
                              </button>
                            </div>
                          )
                        )}

                        {/* Anggota List inside the same card */}
                        {group.anggota && group.anggota.length > 0 && (
                          <div className="anggota-section">
                            <div className="anggota-section-title">
                              <Users size={12} />
                              <span>Anggota Seksi ({group.anggota.length})</span>
                            </div>

                            <div className="anggota-grid">
                              {group.anggota.map((ang) => {
                                const angSub = (ang.display_alamat || ang.alamat || ang.keterangan || '').trim();
                                const hasAngSub = angSub && angSub !== '-' && angSub !== 'null';
                                return (
                                  <div key={ang.id} className="anggota-item-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                      {renderCircularAvatar(ang, 34)}
                                      <div className="anggota-info">
                                        <h6 className="anggota-name">
                                          {ang.display_nama}
                                        </h6>
                                        {hasAngSub && (
                                          <div className="anggota-sub">
                                            {angSub}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {isAdmin && (
                                      <div className="card-actions-mini">
                                        <button
                                          type="button"
                                          className="mini-btn edit-mini"
                                          onClick={() => handleOpenEditModal(ang)}
                                          title="Edit"
                                        >
                                          <Edit2 size={12} />
                                        </button>
                                        <button
                                          type="button"
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
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ── TABLE VIEW (Option A Apple Liquid Glass Table) ─────────────── */
          <div className="struktur-table-card">
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th style={{ width: '48px', textAlign: 'center' }}>No</th>
                    <th>Nama Personel</th>
                    <th>Jabatan / Posisi</th>
                    <th>Kategori / Sub-Tab</th>
                    <th>Tugas / Keterangan</th>
                    <th>Alamat / Kontak</th>
                    {isAdmin && <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {strukturData.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8' }}>
                        Tidak ada data pejabat pada sub-tab ini.
                      </td>
                    </tr>
                  ) : (
                    strukturData.map((row, idx) => {
                      const cleanAlamat = (row.display_alamat || row.alamat || '').trim();
                      const hasAlamat = cleanAlamat && cleanAlamat !== '-' && cleanAlamat !== 'null' && cleanAlamat !== 'undefined';
                      const cleanPhone = (row.guru_no_hp || '').trim();
                      const hasPhone = cleanPhone && cleanPhone !== '-' && cleanPhone !== 'null' && cleanPhone !== 'undefined';

                      return (
                        <tr key={row.id}>
                          <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                          <td>
                            <div className="person-cell">
                              {renderCircularAvatar(row, 38)}
                              <div className="person-name-box">
                                <span className="person-text-name">{row.display_nama}</span>
                                {row.santri_nis ? (
                                  <span className="person-nis-sub">NIS: {row.santri_nis}</span>
                                ) : row.guru_nip ? (
                                  <span className="person-nis-sub">NIP: {row.guru_nip}</span>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="table-badge-jabatan">{row.jabatan}</span>
                          </td>
                          <td>
                            <span className="table-badge-kategori">{row.kategori || '-'}</span>
                          </td>
                          <td>
                            <span className="table-desc-text">{row.keterangan || '-'}</span>
                          </td>
                          <td>
                            <div className="table-contact-box">
                              {hasAlamat && (
                                <span className="contact-item">
                                  <MapPin size={11} className="contact-icon" />
                                  <span>{cleanAlamat}</span>
                                </span>
                              )}
                              {hasPhone && (
                                <span className="contact-item contact-phone">
                                  <Phone size={11} className="contact-icon" />
                                  <span>{cleanPhone}</span>
                                </span>
                              )}
                              {!hasAlamat && !hasPhone && (
                                <span style={{ color: '#94a3b8' }}>-</span>
                              )}
                            </div>
                          </td>
                          {isAdmin && (
                            <td>
                              <div className="table-action-btns">
                                <button
                                  type="button"
                                  className="btn-table-act edit-act"
                                  onClick={() => handleOpenEditModal(row)}
                                  title="Edit Data Pejabat"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-table-act delete-act"
                                  onClick={() => setDeleteConfirm({
                                    isOpen: true,
                                    nodeId: row.id,
                                    jabatan: row.jabatan,
                                    nama: row.display_nama
                                  })}
                                  title="Hapus Pejabat"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {strukturData.length > 0 && (
              <div className="table-footer-bar">
                <span>Total <strong>{strukturData.length}</strong> pejabat terdaftar pada sub-tab ini</span>
              </div>
            )}
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
        <form onSubmit={handleSavePerson}>
          {/* Active Sub-Tab Info Banner */}
          <div className="modal-subtab-banner">
            <div>
              <span className="banner-label">Sub-Tab / Kategori:</span>
              <strong className="banner-value">
                {isPanitiaUjian ? `Panitia Ujian (${modalSemester})` : (selectedKategori || 'Umum')}
              </strong>
            </div>
            <span className="banner-tab-tag">
              {currentTabObj.label}
            </span>
          </div>

          {/* Jabatan Selection */}
          <div className="modal-form-group">
            <label className="modal-label">
              Nama Jabatan / Posisi <span className="req-star">*</span>
            </label>
            {!isCustomJabatan && jabatanTemplates.length > 0 ? (
              <div>
                <select
                  className="modal-select"
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
              <div style={{ position: 'relative' }}>
                <FloatingInput
                  label="Nama Jabatan (misal: Seksi Keamanan, Ketua Kamar 01)"
                  value={modalJabatan}
                  onChange={(e) => setModalJabatan(e.target.value)}
                  required
                />
                {jabatanTemplates.length > 0 && (
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: '4px',
                      padding: 0
                    }}
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
          <div className="modal-form-group">
            <label className="modal-label">Pilih Sumber Pejabat:</label>
            <div className="source-tabs-grid">
              <button
                type="button"
                className={`source-tab-btn ${personType === 'santri' ? 'active' : ''}`}
                onClick={() => setPersonType('santri')}
              >
                Santri (Buku Induk)
              </button>
              <button
                type="button"
                className={`source-tab-btn ${personType === 'guru' ? 'active' : ''}`}
                onClick={() => setPersonType('guru')}
              >
                Guru / Asatidz
              </button>
              <button
                type="button"
                className={`source-tab-btn ${personType === 'manual' ? 'active' : ''}`}
                onClick={() => setPersonType('manual')}
              >
                Input Manual
              </button>
            </div>
          </div>

          {/* OPSI 1: SANTRI DARI BUKU INDUK */}
          {personType === 'santri' && (
            <div className="santri-search-wrapper">
              <label className="modal-label" style={{ marginBottom: '6px', display: 'block' }}>
                Cari Nama Santri atau NIS dari Buku Induk:
              </label>
              <div className="search-input-box">
                <Search size={16} className="icon-inside" />
                <input
                  type="text"
                  className="santri-input"
                  placeholder="Ketik minimal 2 huruf nama santri atau NIS..."
                  value={santriSearchQuery}
                  onChange={(e) => setSantriSearchQuery(e.target.value)}
                />
                {santriSearching && (
                  <RefreshCw size={14} className="spin-anim spin-loader" />
                )}
              </div>

              {/* Dropdown Results */}
              {santriSearchResults.length > 0 && !selectedSantri && (
                <div className="santri-results-dropdown">
                  {santriSearchResults.map((s) => (
                    <div
                      key={s.id}
                      className="santri-result-item"
                      onClick={() => {
                        setSelectedSantri(s);
                        setSantriSearchQuery('');
                        setSantriSearchResults([]);
                      }}
                    >
                      <div className="santri-res-left">
                        {renderCircularAvatar({ display_nama: s.nama, display_foto_url: s.foto_url }, 34)}
                        <div>
                          <div className="res-name">{s.nama}</div>
                          <div className="res-sub">
                            NIS: {s.nis || '-'} • {s.kelas || s.kamar || ''}
                          </div>
                        </div>
                      </div>
                      <span className="res-pick-label">Pilih</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Santri Preview Card */}
              {selectedSantri && (
                <div className="selected-santri-card" style={{ marginTop: '10px' }}>
                  <div className="card-left">
                    {renderCircularAvatar({ display_nama: selectedSantri.nama, display_foto_url: selectedSantri.foto_url }, 42)}
                    <div>
                      <div className="sel-name">{selectedSantri.nama}</div>
                      <div className="sel-sub">
                        NIS: {selectedSantri.nis || '-'} • {selectedSantri.alamat || 'Alamat pesantren'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-remove-santri"
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
            <div className="modal-form-group">
              <label className="modal-label">Pilih Dewan Guru / Asatidz:</label>
              <select
                className="modal-select"
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
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

          {/* Bidang Tugas & Nomor Urut */}
          <div className="modal-form-grid-2">
            <div className="modal-form-group">
              <label className="modal-label">Tugas / Keterangan</label>
              <input
                type="text"
                className="modal-input"
                placeholder="Contoh: Koordinator Seksi / Anggota Seksi"
                value={modalKeterangan}
                onChange={(e) => setModalKeterangan(e.target.value)}
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Nomor Urut Tampil</label>
              <input
                type="number"
                className="modal-input"
                value={modalNoUrut}
                onChange={(e) => setModalNoUrut(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="modal-footer-row">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={() => setPersonModalOpen(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saveLoading}
              className="modal-btn-submit"
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
        <div>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
            Kategori ini menjadi sub-tab mandiri untuk mengelompokkan struktur kepengurusan.
          </p>

          {/* Form Tambah Kategori */}
          <form onSubmit={handleAddCategory} className="modal-form-inline">
            <input
              type="text"
              placeholder="Nama Kategori Baru (misal: Dewan Penasihat)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="modal-input-field"
            />
            <button
              type="submit"
              disabled={catActionLoading || !newCatName.trim()}
              className="modal-submit-btn"
            >
              <Plus size={15} />
              <span>Tambah</span>
            </button>
          </form>

          {/* List Existing Categories */}
          <div className="modal-items-list">
            {categories.map((cat) => (
              <div key={cat.id || cat.nama_kategori} className="modal-item-row">
                {editingCatId === cat.id ? (
                  <div className="modal-inline-edit-wrap">
                    <input
                      type="text"
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      className="modal-inline-edit-input"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateCategory(cat.id!);
                        if (e.key === 'Escape') setEditingCatId(null);
                      }}
                    />
                    <div className="modal-inline-edit-actions">
                      <button
                        type="button"
                        className="modal-icon-btn btn-save"
                        onClick={() => handleUpdateCategory(cat.id!)}
                        title="Simpan Perubahan"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className="modal-icon-btn btn-cancel"
                        onClick={() => setEditingCatId(null)}
                        title="Batal"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span>{cat.nama_kategori}</span>
                    <div className="modal-item-actions">
                      {cat.id && (
                        <>
                          <button
                            type="button"
                            className="modal-icon-btn btn-edit"
                            onClick={() => {
                              setEditingCatId(cat.id!);
                              setEditingCatName(cat.nama_kategori);
                            }}
                            title="Edit Nama"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="modal-icon-btn btn-del"
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

          <div className="modal-footer-row">
            <button
              type="button"
              className="modal-btn-cancel"
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
        <div>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
            Daftar posisi jabatan yang dapat dipilih saat menambahkan pejabat pada sub-tab <strong>{selectedKategori}</strong>.
          </p>

          {/* Form Tambah Jabatan Template */}
          <form onSubmit={handleAddJabatan} className="add-jabatan-box">
            <div className="add-jabatan-title">
              <Plus size={14} />
              <span>Tambah Opsi Jabatan Baru:</span>
            </div>
            <div className="modal-form-grid-2" style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Nama Jabatan (misal: Seksi Media)"
                value={newJabatanName}
                onChange={(e) => setNewJabatanName(e.target.value)}
                className="modal-input-field"
                required
              />
              <input
                type="text"
                placeholder="Tugas Default (opsional)"
                value={newJabatanKeterangan}
                onChange={(e) => setNewJabatanKeterangan(e.target.value)}
                className="modal-input-field"
              />
            </div>
            <button
              type="submit"
              disabled={jabActionLoading || !newJabatanName.trim()}
              className="modal-btn-submit"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Plus size={15} />
              <span>Tambahkan ke Opsi Jabatan</span>
            </button>
          </form>

          {/* List Configured Positions */}
          <div className="modal-items-list">
            {jabatanTemplates.map((t) => (
              <div key={t.id} className="modal-item-row">
                {editingJabatanId === t.id ? (
                  <div className="modal-inline-edit-wrap">
                    <input
                      type="text"
                      value={editingJabatanName}
                      onChange={(e) => setEditingJabatanName(e.target.value)}
                      className="modal-inline-edit-input"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateJabatan(t.id);
                        if (e.key === 'Escape') setEditingJabatanId(null);
                      }}
                    />
                    <div className="modal-inline-edit-actions">
                      <button
                        type="button"
                        className="modal-icon-btn btn-save"
                        onClick={() => handleUpdateJabatan(t.id)}
                        title="Simpan Perubahan"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className="modal-icon-btn btn-cancel"
                        onClick={() => setEditingJabatanId(null)}
                        title="Batal"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="jabatan-name-badge">{t.nama_jabatan}</div>
                      {t.keterangan_default && (
                        <div className="jabatan-desc-sub">{t.keterangan_default}</div>
                      )}
                    </div>
                    <div className="modal-item-actions">
                      <button
                        type="button"
                        className="modal-icon-btn btn-edit"
                        onClick={() => {
                          setEditingJabatanId(t.id);
                          setEditingJabatanName(t.nama_jabatan);
                          setEditingJabatanKeterangan(t.keterangan_default || '');
                        }}
                        title="Edit Jabatan"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="modal-icon-btn btn-del"
                        onClick={() => handleDeleteJabatan(t.id)}
                        title="Hapus Jabatan"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="modal-footer-row">
            <button
              type="button"
              className="modal-btn-cancel"
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
        <div>
          <div className="delete-confirm-box">
            <AlertTriangle className="delete-warning-icon" size={20} />
            <div className="delete-warning-text">
              Apakah Anda yakin ingin menghapus <strong>{deleteConfirm.nama}</strong> dari posisi{' '}
              <strong>{deleteConfirm.jabatan}</strong>? Tindakan ini tidak dapat dibatalkan.
            </div>
          </div>
          <div className="modal-footer-row">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={() => setDeleteConfirm({ isOpen: false, nodeId: null, jabatan: '', nama: '' })}
            >
              Batal
            </button>
            <button
              type="button"
              className="modal-btn-submit"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)' }}
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

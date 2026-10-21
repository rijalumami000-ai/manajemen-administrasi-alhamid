import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Info, 
  Calendar, 
  Save, 
  Edit3, 
  X, 
  Plus, 
  Trash2, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { nilaiService } from '../services/nilaiService';
import { settingsService } from '../services/settingsService';
import { useToast } from '../components/common';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SmartAlert } from '../components/ui/SmartAlert';
import type { 
  MuhafadzohRow, 
  QiroahClassMaqro, 
  TaftisyRow, 
  UjianTulisRow, 
  KalenderRow, 
  TahunAjaranItem, 
  KategoriItem, 
  ClassItem, 
  InformasiUjianTabKey 
} from '../types/informasiUjian';
import './InformasiUjian.scss';

const defaultMuhafadzohTemplate: MuhafadzohRow[] = [
  { kelas: "Sifir", kitab: "Lughotul ‘Arobiyah", mumtaz: "80", jayyid: "70-79", mutawasith: "60-69", rodi: "1-59" },
  { kelas: "Satu", kitab: "Jurumiyah Jawa", mumtaz: "171", jayyid: "160-170", mutawasith: "150-159", rodi: "1-149" },
  { kelas: "SP", kitab: "Matan Jurumiyah", mumtaz: "باب المخفوضات من الاسماء", jayyid: "باب المفعول من اجله – باب المفعول معه", mutawasith: "باب لا – باب المنادي", rodi: "باب الكلام – باب الاستثناء" },
  { kelas: "Dua", kitab: "Matan Jurumiyah", mumtaz: "باب المخفوضات من الاسماء", jayyid: "باب المفعول dari اجله – باب المفعول معه", mutawasith: "باب لا – باب المنادي", rodi: "باب الكلام – باب الاستثناء" },
  { kelas: "Tiga", kitab: "Nadzom ‘Imrithi", mumtaz: "254", jayyid: "245 - 253", mutawasith: "235 - 244", rodi: "1 - 234" },
  { kelas: "Empat", kitab: "Nadzom Alfiyah", mumtaz: "350", jayyid: "300 - 349", mutawasith: "245 - 299", rodi: "1 - 244" },
  { kelas: "Lima", kitab: "Nadzom Alfiyah", mumtaz: "600", jayyid: "525 - 599", mutawasith: "450 - 524", rodi: "201 - 449" },
  { kelas: "Enam", kitab: "Nadzom Alfiyah", mumtaz: "1002", jayyid: "925 - 1001", mutawasith: "850 - 924", rodi: "601 - 849" }
];

const emptyMuhafadzohTemplate: MuhafadzohRow[] = [
  { kelas: "Sifir", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "Satu", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "SP", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "Dua", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "Tiga", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "Empat", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "Lima", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "Enam", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" }
];

const defaultMaqroTemplate: QiroahClassMaqro[] = [
  { kelas: "Sifir", maqro: ["Mabadi Fiqih Juz 1", "Khulasoh Juz 1", "Aqidatul Awam", "Hidayatus Shibyan"] },
  { kelas: "SP", maqro: ["Fathul Qorib (Thoharoh - Sholat)", "Khulasoh Juz 2", "Tijan Darori", "Tuhfatul Athfal"] },
  { kelas: "Satu", maqro: ["Safinatun Naja", "Khulasoh Juz 1", "Tijan Darori", "Hidayatus Shibyan"] },
  { kelas: "Dua", maqro: ["Fathul Qorib (Thoharoh - Sholat)", "Khulasoh Juz 2", "Aqidatul Awam", "Tuhfatul Athfal"] },
  { kelas: "Tiga", maqro: ["Fathul Qorib (Zakat - Haji)", "Khulasoh Juz 3", "Jawahirul Kalamiyah", "Jazariyyah"] },
  { kelas: "Empat", maqro: ["Fathul Mu'in (Thoharoh - Sholat)", "Tarikh Tasyri'", "Uqudul Lujain", "Minhatul Mughits"] },
  { kelas: "Lima", maqro: ["Fathul Mu'in (Zakat - Jinayat)", "Kifayatul Ashab", "Idhotun Nasyi'in", "Qowaidul Fiqhiyyah"] },
  { kelas: "Enam", maqro: ["Fathul Mu'in (Muamalah - Munakahat)", "Bulughul Marom", "Waroqot", "Jauharul Maknun"] }
];

const emptyMaqroTemplate: QiroahClassMaqro[] = [
  { kelas: "Sifir", maqro: [""] },
  { kelas: "SP", maqro: [""] },
  { kelas: "Satu", maqro: [""] },
  { kelas: "Dua", maqro: [""] },
  { kelas: "Tiga", maqro: [""] },
  { kelas: "Empat", maqro: [""] },
  { kelas: "Lima", maqro: [""] },
  { kelas: "Enam", maqro: [""] }
];

const TINGKAT_UJIAN_TULIS_OPTIONS = [
  { value: '0', label: 'Kelas Sifir' },
  { value: '99', label: 'Kelas SP' },
  { value: '1', label: 'Kelas 1' },
  { value: '2', label: 'Kelas 2' },
  { value: '3', label: 'Kelas 3' },
  { value: '4', label: 'Kelas 4' },
  { value: '5', label: 'Kelas 5' },
  { value: '6', label: 'Kelas 6' }
];

export function InformasiUjian() {
  const toast = useToast();

  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaranItem | null>(null);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranItem[]>([]);
  const [kategori, setKategori] = useState<KategoriItem[]>([]);
  const [selectedKategori, setSelectedKategori] = useState<number | null>(null);
  
  // Tab control state
  const [activeTabKey, setActiveTabKey] = useState<InformasiUjianTabKey>('ketentuan-muhafadzoh');

  // Muhafadzoh states
  const [muhafadzohInfo, setMuhafadzohInfo] = useState<MuhafadzohRow[]>([]);
  const [editData, setEditData] = useState<MuhafadzohRow[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Qiroah Maqro states
  const [qiroahMaqro, setQiroahMaqro] = useState<QiroahClassMaqro[]>([]);
  const [editQiroahMaqro, setEditQiroahMaqro] = useState<QiroahClassMaqro[]>([]);
  const [isEditingQiroah, setIsEditingQiroah] = useState(false);

  // Taftisyul Kutub states
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<number | null>(null);
  const [taftisyMateri, setTaftisyMateri] = useState<TaftisyRow[]>([]);
  const [editTaftisyMateri, setEditTaftisyMateri] = useState<TaftisyRow[]>([]);
  const [isEditingTaftisy, setIsEditingTaftisy] = useState(false);

  // Ujian Tulis states
  const [selectedTingkatUjianTulis, setSelectedTingkatUjianTulis] = useState<string>('0');
  const [ujianTulisMateri, setUjianTulisMateri] = useState<UjianTulisRow[]>([]);
  const [editUjianTulisMateri, setEditUjianTulisMateri] = useState<UjianTulisRow[]>([]);
  const [isEditingUjianTulis, setIsEditingUjianTulis] = useState(false);

  // Kalender Akademik states
  const [kalenderAkademik, setKalenderAkademik] = useState<KalenderRow[]>([]);
  const [editKalender, setEditKalender] = useState<KalenderRow[]>([]);
  const [isEditingKalender, setIsEditingKalender] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [taData, katData, systemSettings, classesData] = await Promise.all([
        nilaiService.fetchTahunAjaran(),
        nilaiService.fetchKategori(),
        settingsService.fetchSettings().catch(() => ({})),
        nilaiService.fetchKelas().catch(() => [])
      ]);

      setTahunAjaranList(Array.isArray(taData) ? taData : []);
      setKategori(Array.isArray(katData) ? katData : []);

      const diniyahClasses = Array.isArray(classesData) ? classesData.filter((c: any) => c.jenis === 'Diniyah') : [];
      setClassList(diniyahClasses);
      if (diniyahClasses.length > 0) {
        setSelectedKelas(diniyahClasses[0].id);
      }

      const activeTA = Array.isArray(taData) ? taData.find((ta: any) => ta.is_active) : null;
      setTahunAjaran(activeTA || (taData.length > 0 ? taData[0] : null));

      if (Array.isArray(katData)) {
        const activeSemester = (systemSettings as any)?.active_semester || 'Ganjil';
        const defaultKat = katData.find((k: any) => k.nama?.toLowerCase().includes(activeSemester.toLowerCase()));
        if (defaultKat) {
          setSelectedKategori(defaultKat.id);
        } else if (katData.length > 0) {
          setSelectedKategori(katData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      toast.error('Gagal memuat data filter tahun ajaran, semester, dan kelas.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch info whenever filters change
  useEffect(() => {
    if (tahunAjaran?.id && selectedKategori) {
      fetchData();
      fetchKalenderData();
    }
  }, [tahunAjaran, selectedKategori]);

  // Fetch taftisy data whenever filters or class change
  useEffect(() => {
    if (tahunAjaran?.id && selectedKategori && selectedKelas) {
      fetchTaftisyData();
    }
  }, [tahunAjaran, selectedKategori, selectedKelas]);

  // Fetch ujian tulis data whenever filters or tingkat change
  useEffect(() => {
    if (tahunAjaran?.id && selectedKategori && selectedTingkatUjianTulis !== null) {
      fetchUjianTulisData();
    }
  }, [tahunAjaran, selectedKategori, selectedTingkatUjianTulis]);

  const fetchData = async () => {
    if (!tahunAjaran?.id || !selectedKategori) return;
    try {
      setLoading(true);
      setIsEditing(false);
      setIsEditingQiroah(false);
      
      const [muhafadzohData, qiroahData] = await Promise.all([
        nilaiService.fetchMuhafadzohInfo(tahunAjaran.id, selectedKategori),
        nilaiService.fetchQiroahMaqro(tahunAjaran.id, selectedKategori)
      ]);

      const mSorted = Array.isArray(muhafadzohData) ? muhafadzohData : [];
      setMuhafadzohInfo(mSorted);
      setEditData(JSON.parse(JSON.stringify(mSorted)));

      const qSorted = Array.isArray(qiroahData) ? qiroahData : [];
      setQiroahMaqro(qSorted);
      setEditQiroahMaqro(JSON.parse(JSON.stringify(qSorted)));
    } catch (err) {
      console.error('Failed to fetch info:', err);
      toast.error('Gagal mengambil data ketentuan nilai dan maqro.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaftisyData = async () => {
    if (!tahunAjaran?.id || !selectedKategori || !selectedKelas) return;
    try {
      setIsEditingTaftisy(false);
      const data = await nilaiService.fetchTaftisyMateri(tahunAjaran.id, selectedKategori, selectedKelas);
      const sorted = Array.isArray(data) ? data : [];
      setTaftisyMateri(sorted);
      setEditTaftisyMateri(JSON.parse(JSON.stringify(sorted)));
    } catch (err) {
      console.error('Failed to fetch taftisy info:', err);
      toast.error('Gagal mengambil data batasan materi Taftisyul Kutub.');
    }
  };

  const fetchUjianTulisData = async () => {
    if (!tahunAjaran?.id || !selectedKategori || selectedTingkatUjianTulis === null) return;
    try {
      setIsEditingUjianTulis(false);
      const data = await nilaiService.fetchMateriUjianTulis(tahunAjaran.id, selectedKategori, Number(selectedTingkatUjianTulis));
      const sorted = Array.isArray(data) ? data : [];
      setUjianTulisMateri(sorted);
      setEditUjianTulisMateri(JSON.parse(JSON.stringify(sorted)));
    } catch (err) {
      console.error('Failed to fetch written exam info:', err);
      toast.error('Gagal mengambil data batasan materi Ujian Tulis.');
    }
  };

  const fetchKalenderData = async () => {
    if (!tahunAjaran?.id || !selectedKategori) return;
    try {
      setIsEditingKalender(false);
      const kat = kategori.find(k => k.id === selectedKategori);
      const semesterName = kat?.nama?.toLowerCase().includes('genap') ? 'Genap' : 'Ganjil';
      const data = await nilaiService.fetchKalenderAkademik(tahunAjaran.id, semesterName);
      const list = Array.isArray(data) ? data : [];
      setKalenderAkademik(list);
      setEditKalender(JSON.parse(JSON.stringify(list)));
    } catch (err) {
      console.error('Failed to fetch kalender:', err);
    }
  };

  const handleSaveKalender = async () => {
    if (!tahunAjaran?.id || !selectedKategori) return;
    try {
      setSaveLoading(true);
      const kat = kategori.find(k => k.id === selectedKategori);
      const semesterName = kat?.nama?.toLowerCase().includes('genap') ? 'Genap' : 'Ganjil';
      await nilaiService.saveKalenderAkademik({
        tahun_ajaran_id: tahunAjaran.id,
        semester: semesterName,
        data: editKalender
      });
      toast.success('Kalender akademik berhasil disimpan!');
      setKalenderAkademik(JSON.parse(JSON.stringify(editKalender)));
      setIsEditingKalender(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan kalender akademik.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleKalenderRowChange = (index: number, field: keyof KalenderRow, value: string) => {
    const updated = [...editKalender];
    updated[index] = { ...updated[index], [field]: value };
    setEditKalender(updated);
  };

  const handleAddKalenderRow = () => {
    setEditKalender([...editKalender, { tanggal: '', kegiatan: '' }]);
  };

  const handleRemoveKalenderRow = (index: number) => {
    setEditKalender(editKalender.filter((_, i) => i !== index));
  };

  const handleInputChange = (index: number, field: keyof MuhafadzohRow, value: string) => {
    const updated = [...editData];
    updated[index] = { ...updated[index], [field]: value };
    setEditData(updated);
  };

  const handleSave = async () => {
    if (!tahunAjaran?.id || !selectedKategori) return;
    try {
      setSaveLoading(true);
      await nilaiService.saveMuhafadzohInfo({
        tahun_ajaran_id: tahunAjaran.id,
        kategori_evaluasi_id: selectedKategori,
        data: editData
      });
      toast.success('Ketentuan nilai muhafadzoh berhasil diperbarui!');
      setMuhafadzohInfo(JSON.parse(JSON.stringify(editData)));
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to save muhafadzoh info:', err);
      toast.error(err.message || 'Gagal menyimpan ketentuan nilai.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData(JSON.parse(JSON.stringify(muhafadzohInfo)));
    setIsEditing(false);
  };

  // Qiroah Maqro change handlers
  const handleQiroahInputChange = (classIndex: number, maqroIndex: number, value: string) => {
    const updated = JSON.parse(JSON.stringify(editQiroahMaqro));
    updated[classIndex].maqro[maqroIndex] = value;
    setEditQiroahMaqro(updated);
  };

  const handleRemoveQiroahRow = (classIndex: number, maqroIndex: number) => {
    const updated = JSON.parse(JSON.stringify(editQiroahMaqro));
    updated[classIndex].maqro = updated[classIndex].maqro.filter((_: any, idx: number) => idx !== maqroIndex);
    setEditQiroahMaqro(updated);
  };

  const handleAddQiroahRow = (classIndex: number) => {
    const updated = JSON.parse(JSON.stringify(editQiroahMaqro));
    updated[classIndex].maqro.push("");
    setEditQiroahMaqro(updated);
  };

  const handleQiroahSave = async () => {
    if (!tahunAjaran?.id || !selectedKategori) return;
    try {
      setSaveLoading(true);
      await nilaiService.saveQiroahMaqro({
        tahun_ajaran_id: tahunAjaran.id,
        kategori_evaluasi_id: selectedKategori,
        data: editQiroahMaqro
      });
      toast.success('Maqro qiroatul kitab berhasil diperbarui!');
      setQiroahMaqro(JSON.parse(JSON.stringify(editQiroahMaqro)));
      setIsEditingQiroah(false);
    } catch (err: any) {
      console.error('Failed to save qiroah maqro:', err);
      toast.error(err.message || 'Gagal menyimpan maqro.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleQiroahCancel = () => {
    setEditQiroahMaqro(JSON.parse(JSON.stringify(qiroahMaqro)));
    setIsEditingQiroah(false);
  };

  // Taftisyul Kutub change handlers
  const handleTaftisyInputChange = (index: number, field: keyof TaftisyRow, value: string) => {
    const updated = [...editTaftisyMateri];
    updated[index] = { ...updated[index], [field]: value };
    setEditTaftisyMateri(updated);
  };

  const handleTaftisySave = async () => {
    if (!tahunAjaran?.id || !selectedKategori || !selectedKelas) return;
    try {
      setSaveLoading(true);
      await nilaiService.saveTaftisyMateri({
        tahun_ajaran_id: tahunAjaran.id,
        kategori_evaluasi_id: selectedKategori,
        kelas_id: selectedKelas,
        data: editTaftisyMateri
      });
      toast.success('Batasan materi Taftisyul Kutub berhasil diperbarui!');
      setTaftisyMateri(JSON.parse(JSON.stringify(editTaftisyMateri)));
      setIsEditingTaftisy(false);
    } catch (err: any) {
      console.error('Failed to save taftisy materi:', err);
      toast.error(err.message || 'Gagal menyimpan batasan materi.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTaftisyCancel = () => {
    setEditTaftisyMateri(JSON.parse(JSON.stringify(taftisyMateri)));
    setIsEditingTaftisy(false);
  };

  const handleAddTaftisyRow = () => {
    setEditTaftisyMateri([...editTaftisyMateri, { mata_pelajaran: '', kitab: '', batasan: '', keterangan: '' }]);
  };

  const handleRemoveTaftisyRow = (index: number) => {
    setEditTaftisyMateri(editTaftisyMateri.filter((_, i) => i !== index));
  };

  // Ujian Tulis change handlers
  const handleUjianTulisInputChange = (index: number, field: keyof UjianTulisRow, value: string) => {
    const updated = [...editUjianTulisMateri];
    updated[index] = { ...updated[index], [field]: value };
    setEditUjianTulisMateri(updated);
  };

  const handleUjianTulisSave = async () => {
    if (!tahunAjaran?.id || !selectedKategori || selectedTingkatUjianTulis === null) return;
    try {
      setSaveLoading(true);
      await nilaiService.saveMateriUjianTulis({
        tahun_ajaran_id: tahunAjaran.id,
        kategori_evaluasi_id: selectedKategori,
        tingkat: Number(selectedTingkatUjianTulis),
        data: editUjianTulisMateri
      });
      toast.success('Batasan materi Ujian Tulis berhasil diperbarui!');
      setUjianTulisMateri(JSON.parse(JSON.stringify(editUjianTulisMateri)));
      setIsEditingUjianTulis(false);
    } catch (err: any) {
      console.error('Failed to save written exam materi:', err);
      toast.error(err.message || 'Gagal menyimpan batasan materi.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleUjianTulisCancel = () => {
    setEditUjianTulisMateri(JSON.parse(JSON.stringify(ujianTulisMateri)));
    setIsEditingUjianTulis(false);
  };

  const handleAddUjianTulisRow = () => {
    setEditUjianTulisMateri([...editUjianTulisMateri, { mata_pelajaran: '', kitab: '', batasan: '', keterangan: '' }]);
  };

  const handleRemoveUjianTulisRow = (index: number) => {
    setEditUjianTulisMateri(editUjianTulisMateri.filter((_, i) => i !== index));
  };

  const handleInitializeMuhafadzoh = (type: 'default' | 'empty') => {
    const template = type === 'default' ? defaultMuhafadzohTemplate : emptyMuhafadzohTemplate;
    setEditData(JSON.parse(JSON.stringify(template)));
    setIsEditing(true);
  };

  const handleInitializeQiroah = (type: 'default' | 'empty') => {
    const template = type === 'default' ? defaultMaqroTemplate : emptyMaqroTemplate;
    setEditQiroahMaqro(JSON.parse(JSON.stringify(template)));
    setIsEditingQiroah(true);
  };

  if (loading && muhafadzohInfo.length === 0) {
    return (
      <div className="informasi-ujian-page">
        <div className="loading-container">
          <RefreshCw size={36} className="spin-anim" style={{ color: '#3b82f6' }} />
          <p style={{ fontWeight: 600, color: '#475569' }}>Memuat informasi ujian...</p>
        </div>
      </div>
    );
  }

  const taOptions = tahunAjaranList.map(ta => ({
    value: String(ta.id),
    label: `${ta.kode} ${ta.is_active ? '(Aktif)' : ''}`
  }));

  const katOptions = kategori
    .filter(k => !k.nama.toLowerCase().includes('harian') && !k.nama.toLowerCase().includes('tugas'))
    .map(k => ({
      value: String(k.id),
      label: k.nama
    }));

  const classOptions = classList.map(c => ({
    value: String(c.id),
    label: c.nama
  }));

  const isAnyEditing = isEditing || isEditingQiroah || isEditingTaftisy || isEditingUjianTulis || isEditingKalender;

  return (
    <div className="informasi-ujian-page">
      {/* ─── 1. APPLE FLOATING DOCK HEADER (NO ICON ORB) ─────────── */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Ketentuan & Informasi Ujian</h2>
          <p className="page-subtitle">Kelola parameter, ketentuan nilai, dan panduan batasan materi ujian diniyah</p>
        </div>

        <div className="header-actions-row">
          <div className="selector-box">
            <CustomSelect
              value={selectedKategori ? String(selectedKategori) : ''}
              onChange={(val) => setSelectedKategori(val ? Number(val) : null)}
              options={katOptions}
              placeholder="Pilih Semester"
              disabled={isAnyEditing}
            />
          </div>

          <div className="selector-box">
            <CustomSelect
              value={tahunAjaran?.id ? String(tahunAjaran.id) : ''}
              onChange={(val) => {
                const selected = tahunAjaranList.find(ta => ta.id === Number(val));
                setTahunAjaran(selected || null);
              }}
              options={taOptions}
              placeholder="Tahun Ajaran"
              disabled={isAnyEditing}
            />
          </div>

          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={fetchData}
            title="Segarkan Data"
            disabled={isAnyEditing}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>
      </header>

      {/* ─── 2. SEGMENTED TABS DOCK ──────────────────────────────── */}
      <div className="controls-bar">
        <div className="segmented-control-dock" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTabKey === 'ketentuan-muhafadzoh'}
            className={`segment-btn ${activeTabKey === 'ketentuan-muhafadzoh' ? 'active' : ''}`}
            onClick={() => !isAnyEditing && setActiveTabKey('ketentuan-muhafadzoh')}
            disabled={isAnyEditing}
          >
            <BookOpen size={14} />
            <span>Ketentuan Muhafadzoh</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTabKey === 'maqro-qiroah'}
            className={`segment-btn ${activeTabKey === 'maqro-qiroah' ? 'active' : ''}`}
            onClick={() => !isAnyEditing && setActiveTabKey('maqro-qiroah')}
            disabled={isAnyEditing}
          >
            <Info size={14} />
            <span>Maqro Qiroah</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTabKey === 'taftisyul-kutub'}
            className={`segment-btn ${activeTabKey === 'taftisyul-kutub' ? 'active' : ''}`}
            onClick={() => !isAnyEditing && setActiveTabKey('taftisyul-kutub')}
            disabled={isAnyEditing}
          >
            <BookOpen size={14} />
            <span>Batasan Taftisyul Kutub</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTabKey === 'materi-ujian-tulis'}
            className={`segment-btn ${activeTabKey === 'materi-ujian-tulis' ? 'active' : ''}`}
            onClick={() => !isAnyEditing && setActiveTabKey('materi-ujian-tulis')}
            disabled={isAnyEditing}
          >
            <FileText size={14} />
            <span>Materi Ujian Tulis</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTabKey === 'kalender-akademik'}
            className={`segment-btn ${activeTabKey === 'kalender-akademik' ? 'active' : ''}`}
            onClick={() => !isAnyEditing && setActiveTabKey('kalender-akademik')}
            disabled={isAnyEditing}
          >
            <Calendar size={14} />
            <span>Kalender Akademik</span>
          </button>
        </div>
      </div>

      {/* ─── 3. TABS CONTENT AREA ─────────────────────────────────── */}
      <div className="tab-pane-content">
        {/* TAB 1: KETENTUAN MUHAFADZOH */}
        {activeTabKey === 'ketentuan-muhafadzoh' && (
          <div>
            <div className="tab-actions-header">
              <div className="header-left-title">
                <h3 className="tab-title-text">Parameter Standar Nilai Muhafadzoh</h3>
                <p className="tab-desc-text">Kriteria predikat kelulusan berdasarkan pencapaian bait atau bab yang dihafal santri</p>
              </div>

              <div className="header-right-btns">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      className="action-pill-btn secondary-pill"
                      onClick={handleCancel}
                      disabled={saveLoading}
                    >
                      <X size={14} />
                      <span>Batal</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn primary-pill"
                      onClick={handleSave}
                      disabled={saveLoading}
                    >
                      {saveLoading ? <RefreshCw size={14} className="spin-anim" /> : <Save size={14} />}
                      <span>Simpan Perubahan</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="action-pill-btn secondary-pill"
                      onClick={() => handleInitializeMuhafadzoh('default')}
                    >
                      <span>Gunakan Template Default</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn secondary-pill"
                      onClick={() => handleInitializeMuhafadzoh('empty')}
                    >
                      <span>Mulai Format Kosong</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn primary-pill"
                      onClick={() => {
                        setEditData(JSON.parse(JSON.stringify(muhafadzohInfo.length > 0 ? muhafadzohInfo : defaultMuhafadzohTemplate)));
                        setIsEditing(true);
                      }}
                    >
                      <Edit3 size={14} />
                      <span>Edit Ketentuan</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="ujian-table-card">
              <div className="table-responsive">
                <table className="ujian-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '110px' }}>Kelas</th>
                      <th>Kitab Muhafadzoh</th>
                      <th>Mumtaz (Istimewa)</th>
                      <th>Jayyid (Baik)</th>
                      <th>Mutawasith (Sedang)</th>
                      <th>Rodi' (Kurang)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(isEditing ? editData : muhafadzohInfo).map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              className="table-edit-input"
                              value={row.kelas}
                              onChange={(e) => handleInputChange(idx, 'kelas', e.target.value)}
                            />
                          ) : (
                            <span className="kelas-badge">{row.kelas}</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              className="table-edit-input"
                              value={row.kitab}
                              onChange={(e) => handleInputChange(idx, 'kitab', e.target.value)}
                            />
                          ) : (
                            <span className="kitab-name">{row.kitab || '-'}</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              className="table-edit-input"
                              value={row.mumtaz}
                              onChange={(e) => handleInputChange(idx, 'mumtaz', e.target.value)}
                            />
                          ) : (
                            <span>{row.mumtaz || '-'}</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              className="table-edit-input"
                              value={row.jayyid}
                              onChange={(e) => handleInputChange(idx, 'jayyid', e.target.value)}
                            />
                          ) : (
                            <span>{row.jayyid || '-'}</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              className="table-edit-input"
                              value={row.mutawasith}
                              onChange={(e) => handleInputChange(idx, 'mutawasith', e.target.value)}
                            />
                          ) : (
                            <span>{row.mutawasith || '-'}</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              className="table-edit-input"
                              value={row.rodi}
                              onChange={(e) => handleInputChange(idx, 'rodi', e.target.value)}
                            />
                          ) : (
                            <span>{row.rodi || '-'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MAQRO QIROAH */}
        {activeTabKey === 'maqro-qiroah' && (
          <div>
            <div className="tab-actions-header">
              <div className="header-left-title">
                <h3 className="tab-title-text">Daftar Maqro Ujian Qiroatul Kitab</h3>
                <p className="tab-desc-text">Materi bab atau kitab yang diujikan dalam tes membaca kitab kuning per tingkatan kelas</p>
              </div>

              <div className="header-right-btns">
                {isEditingQiroah ? (
                  <>
                    <button
                      type="button"
                      className="action-pill-btn secondary-pill"
                      onClick={handleQiroahCancel}
                      disabled={saveLoading}
                    >
                      <X size={14} />
                      <span>Batal</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn primary-pill"
                      onClick={handleQiroahSave}
                      disabled={saveLoading}
                    >
                      {saveLoading ? <RefreshCw size={14} className="spin-anim" /> : <Save size={14} />}
                      <span>Simpan Maqro</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="action-pill-btn secondary-pill"
                      onClick={() => handleInitializeQiroah('default')}
                    >
                      <span>Gunakan Template Default</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn secondary-pill"
                      onClick={() => handleInitializeQiroah('empty')}
                    >
                      <span>Mulai Format Kosong</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn primary-pill"
                      onClick={() => {
                        setEditQiroahMaqro(JSON.parse(JSON.stringify(qiroahMaqro.length > 0 ? qiroahMaqro : defaultMaqroTemplate)));
                        setIsEditingQiroah(true);
                      }}
                    >
                      <Edit3 size={14} />
                      <span>Edit Maqro</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="qiroah-grid-container">
              {(isEditingQiroah ? editQiroahMaqro : qiroahMaqro).map((classItem, classIdx) => (
                <div key={classIdx} className="qiroah-class-card">
                  <div className="card-top-header">
                    <span className="class-title-badge">
                      <BookOpen size={16} />
                      <span>Kelas {classItem.kelas}</span>
                    </span>
                    <span className="maqro-count-pill">
                      {classItem.maqro?.length || 0} Materi
                    </span>
                  </div>

                  <div className="maqro-items-list">
                    {(classItem.maqro || []).map((maqro, mIdx) => (
                      <div key={mIdx}>
                        {isEditingQiroah ? (
                          <div className="maqro-edit-row">
                            <input
                              type="text"
                              className="edit-maqro-input"
                              value={maqro}
                              placeholder="Ketik nama kitab / materi..."
                              onChange={(e) => handleQiroahInputChange(classIdx, mIdx, e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn-remove-maqro"
                              onClick={() => handleRemoveQiroahRow(classIdx, mIdx)}
                              title="Hapus baris"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="maqro-view-item">
                            <span className="num-badge">{mIdx + 1}</span>
                            <span>{maqro || '-'}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {isEditingQiroah && (
                    <button
                      type="button"
                      className="btn-add-maqro"
                      onClick={() => handleAddQiroahRow(classIdx)}
                    >
                      <Plus size={13} />
                      <span>Tambah Materi Maqro</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TAFTISYUL KUTUB */}
        {activeTabKey === 'taftisyul-kutub' && (
          <div>
            <div className="tab-actions-header">
              <div className="header-left-title">
                <h3 className="tab-title-text">Batasan Materi Taftisyul Kutub</h3>
                <p className="tab-desc-text">Kelola batasan bab dan halaman pemeriksaan keabsahan makna kitab santri</p>
              </div>

              <div className="header-right-btns">
                <div style={{ minWidth: '180px' }}>
                  <CustomSelect
                    value={selectedKelas ? String(selectedKelas) : ''}
                    onChange={(val) => setSelectedKelas(val ? Number(val) : null)}
                    options={classOptions}
                    placeholder="Pilih Kelas"
                    disabled={isEditingTaftisy}
                  />
                </div>

                {isEditingTaftisy ? (
                  <>
                    <button
                      type="button"
                      className="action-pill-btn secondary-pill"
                      onClick={handleTaftisyCancel}
                      disabled={saveLoading}
                    >
                      <X size={14} />
                      <span>Batal</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn dashed-pill"
                      onClick={handleAddTaftisyRow}
                      disabled={saveLoading}
                    >
                      <Plus size={14} />
                      <span>Tambah Baris</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn primary-pill"
                      onClick={handleTaftisySave}
                      disabled={saveLoading}
                    >
                      {saveLoading ? <RefreshCw size={14} className="spin-anim" /> : <Save size={14} />}
                      <span>Simpan Perubahan</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="action-pill-btn primary-pill"
                    onClick={() => {
                      setEditTaftisyMateri(JSON.parse(JSON.stringify(taftisyMateri)));
                      setIsEditingTaftisy(true);
                    }}
                    disabled={!selectedKelas}
                  >
                    <Edit3 size={14} />
                    <span>Edit Batasan Materi</span>
                  </button>
                )}
              </div>
            </div>

            <div className="ujian-table-card">
              <div className="table-responsive">
                <table className="ujian-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }} className="th-center">No</th>
                      <th>Mata Pelajaran</th>
                      <th>Kitab</th>
                      <th>Batasan Materi / Halaman</th>
                      <th>Keterangan</th>
                      {isEditingTaftisy && <th style={{ width: '80px' }} className="th-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(isEditingTaftisy ? editTaftisyMateri : taftisyMateri).length === 0 ? (
                      <tr>
                        <td colSpan={isEditingTaftisy ? 6 : 5} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                          Belum ada data batasan materi Taftisyul Kutub untuk kelas ini. Klik "Edit Batasan Materi" untuk menambahkan.
                        </td>
                      </tr>
                    ) : (
                      (isEditingTaftisy ? editTaftisyMateri : taftisyMateri).map((row, idx) => (
                        <tr key={idx}>
                          <td className="td-center">{idx + 1}</td>
                          <td>
                            {isEditingTaftisy ? (
                              <input
                                type="text"
                                className="table-edit-input"
                                value={row.mata_pelajaran}
                                placeholder="Nama Mapel"
                                onChange={(e) => handleTaftisyInputChange(idx, 'mata_pelajaran', e.target.value)}
                              />
                            ) : (
                              <strong>{row.mata_pelajaran || '-'}</strong>
                            )}
                          </td>
                          <td>
                            {isEditingTaftisy ? (
                              <input
                                type="text"
                                className="table-edit-input"
                                value={row.kitab}
                                placeholder="Nama Kitab"
                                onChange={(e) => handleTaftisyInputChange(idx, 'kitab', e.target.value)}
                              />
                            ) : (
                              <span>{row.kitab || '-'}</span>
                            )}
                          </td>
                          <td>
                            {isEditingTaftisy ? (
                              <input
                                type="text"
                                className="table-edit-input"
                                value={row.batasan}
                                placeholder="Contoh: Bab Thoharoh s.d Sholat Hal. 1-45"
                                onChange={(e) => handleTaftisyInputChange(idx, 'batasan', e.target.value)}
                              />
                            ) : (
                              <span>{row.batasan || '-'}</span>
                            )}
                          </td>
                          <td>
                            {isEditingTaftisy ? (
                              <input
                                type="text"
                                className="table-edit-input"
                                value={row.keterangan || ''}
                                placeholder="Keterangan opsional"
                                onChange={(e) => handleTaftisyInputChange(idx, 'keterangan', e.target.value)}
                              />
                            ) : (
                              <span>{row.keterangan || '-'}</span>
                            )}
                          </td>
                          {isEditingTaftisy && (
                            <td className="td-center">
                              <button
                                type="button"
                                className="btn-del-row"
                                onClick={() => handleRemoveTaftisyRow(idx)}
                                title="Hapus baris"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MATERI UJIAN TULIS */}
        {activeTabKey === 'materi-ujian-tulis' && (
          <div>
            <div className="tab-actions-header">
              <div className="header-left-title">
                <h3 className="tab-title-text">Batasan Materi Ujian Tulis</h3>
                <p className="tab-desc-text">Kelola batasan bab, kisi-kisi, dan pedoman ujian tulis semester</p>
              </div>

              <div className="header-right-btns">
                <div style={{ minWidth: '180px' }}>
                  <CustomSelect
                    value={selectedTingkatUjianTulis}
                    onChange={(val) => setSelectedTingkatUjianTulis(val || '0')}
                    options={TINGKAT_UJIAN_TULIS_OPTIONS}
                    placeholder="Pilih Tingkatan"
                    disabled={isEditingUjianTulis}
                  />
                </div>

                {isEditingUjianTulis ? (
                  <>
                    <button
                      type="button"
                      className="action-pill-btn secondary-pill"
                      onClick={handleUjianTulisCancel}
                      disabled={saveLoading}
                    >
                      <X size={14} />
                      <span>Batal</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn dashed-pill"
                      onClick={handleAddUjianTulisRow}
                      disabled={saveLoading}
                    >
                      <Plus size={14} />
                      <span>Tambah Baris</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn primary-pill"
                      onClick={handleUjianTulisSave}
                      disabled={saveLoading}
                    >
                      {saveLoading ? <RefreshCw size={14} className="spin-anim" /> : <Save size={14} />}
                      <span>Simpan Perubahan</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="action-pill-btn primary-pill"
                    onClick={() => {
                      setEditUjianTulisMateri(JSON.parse(JSON.stringify(ujianTulisMateri)));
                      setIsEditingUjianTulis(true);
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Materi</span>
                  </button>
                )}
              </div>
            </div>

            <div className="ujian-table-card">
              <div className="table-responsive">
                <table className="ujian-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }} className="th-center">No</th>
                      <th>Mata Pelajaran</th>
                      <th>Kitab</th>
                      <th>Batasan Materi / Bab / Halaman</th>
                      <th>Keterangan</th>
                      {isEditingUjianTulis && <th style={{ width: '80px' }} className="th-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(isEditingUjianTulis ? editUjianTulisMateri : ujianTulisMateri).length === 0 ? (
                      <tr>
                        <td colSpan={isEditingUjianTulis ? 6 : 5} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                          Belum ada data materi Ujian Tulis untuk tingkatan ini. Klik "Edit Materi" untuk menambahkan.
                        </td>
                      </tr>
                    ) : (
                      (isEditingUjianTulis ? editUjianTulisMateri : ujianTulisMateri).map((row, idx) => (
                        <tr key={idx}>
                          <td className="td-center">{idx + 1}</td>
                          <td>
                            {isEditingUjianTulis ? (
                              <input
                                type="text"
                                className="table-edit-input"
                                value={row.mata_pelajaran}
                                placeholder="Nama Mapel"
                                onChange={(e) => handleUjianTulisInputChange(idx, 'mata_pelajaran', e.target.value)}
                              />
                            ) : (
                              <strong>{row.mata_pelajaran || '-'}</strong>
                            )}
                          </td>
                          <td>
                            {isEditingUjianTulis ? (
                              <input
                                type="text"
                                className="table-edit-input"
                                value={row.kitab}
                                placeholder="Nama Kitab"
                                onChange={(e) => handleUjianTulisInputChange(idx, 'kitab', e.target.value)}
                              />
                            ) : (
                              <span>{row.kitab || '-'}</span>
                            )}
                          </td>
                          <td>
                            {isEditingUjianTulis ? (
                              <input
                                type="text"
                                className="table-edit-input"
                                value={row.batasan}
                                placeholder="Contoh: Bab 1 - 4 / Halaman 10 - 50"
                                onChange={(e) => handleUjianTulisInputChange(idx, 'batasan', e.target.value)}
                              />
                            ) : (
                              <span>{row.batasan || '-'}</span>
                            )}
                          </td>
                          <td>
                            {isEditingUjianTulis ? (
                              <input
                                type="text"
                                className="table-edit-input"
                                value={row.keterangan || ''}
                                placeholder="Keterangan opsional"
                                onChange={(e) => handleUjianTulisInputChange(idx, 'keterangan', e.target.value)}
                              />
                            ) : (
                              <span>{row.keterangan || '-'}</span>
                            )}
                          </td>
                          {isEditingUjianTulis && (
                            <td className="td-center">
                              <button
                                type="button"
                                className="btn-del-row"
                                onClick={() => handleRemoveUjianTulisRow(idx)}
                                title="Hapus baris"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: KALENDER AKADEMIK */}
        {activeTabKey === 'kalender-akademik' && (
          <div>
            <div className="tab-actions-header">
              <div className="header-left-title">
                <h3 className="tab-title-text">Kalender & Agenda Akademik Madrasah</h3>
                <p className="tab-desc-text">Rangkaian jadwal penting pelaksanaan evaluasi dan agenda kepesantrenan</p>
              </div>

              <div className="header-right-btns">
                {isEditingKalender ? (
                  <>
                    <button
                      type="button"
                      className="action-pill-btn secondary-pill"
                      onClick={() => {
                        setEditKalender(JSON.parse(JSON.stringify(kalenderAkademik)));
                        setIsEditingKalender(false);
                      }}
                      disabled={saveLoading}
                    >
                      <X size={14} />
                      <span>Batal</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn dashed-pill"
                      onClick={handleAddKalenderRow}
                      disabled={saveLoading}
                    >
                      <Plus size={14} />
                      <span>Tambah Agenda</span>
                    </button>
                    <button
                      type="button"
                      className="action-pill-btn primary-pill"
                      onClick={handleSaveKalender}
                      disabled={saveLoading}
                    >
                      {saveLoading ? <RefreshCw size={14} className="spin-anim" /> : <Save size={14} />}
                      <span>Simpan Kalender</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="action-pill-btn primary-pill"
                    onClick={() => {
                      setEditKalender(JSON.parse(JSON.stringify(kalenderAkademik)));
                      setIsEditingKalender(true);
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Kalender</span>
                  </button>
                )}
              </div>
            </div>

            <div className="ujian-table-card">
              <div className="table-responsive">
                <table className="ujian-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }} className="th-center">No</th>
                      <th style={{ width: '220px' }}>Tanggal / Waktu</th>
                      <th>Rincian Kegiatan / Agenda Akademik</th>
                      {isEditingKalender && <th style={{ width: '80px' }} className="th-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(isEditingKalender ? editKalender : kalenderAkademik).length === 0 ? (
                      <tr>
                        <td colSpan={isEditingKalender ? 4 : 3} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                          Belum ada agenda kalender akademik untuk semester ini. Klik "Edit Kalender" untuk menambahkan.
                        </td>
                      </tr>
                    ) : (
                      (isEditingKalender ? editKalender : kalenderAkademik).map((row, idx) => (
                        <tr key={idx}>
                          <td className="td-center">{idx + 1}</td>
                          <td>
                            {isEditingKalender ? (
                              <input
                                type="text"
                                className="table-edit-input"
                                value={row.tanggal}
                                placeholder="Contoh: 15 - 20 Rajab 1448 H"
                                onChange={(e) => handleKalenderRowChange(idx, 'tanggal', e.target.value)}
                              />
                            ) : (
                              <strong>{row.tanggal || '-'}</strong>
                            )}
                          </td>
                          <td>
                            {isEditingKalender ? (
                              <input
                                type="text"
                                className="table-edit-input"
                                value={row.kegiatan}
                                placeholder="Uraian agenda kegiatan..."
                                onChange={(e) => handleKalenderRowChange(idx, 'kegiatan', e.target.value)}
                              />
                            ) : (
                              <span>{row.kegiatan || '-'}</span>
                            )}
                          </td>
                          {isEditingKalender && (
                            <td className="td-center">
                              <button
                                type="button"
                                className="btn-del-row"
                                onClick={() => handleRemoveKalenderRow(idx)}
                                title="Hapus baris"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InformasiUjian;

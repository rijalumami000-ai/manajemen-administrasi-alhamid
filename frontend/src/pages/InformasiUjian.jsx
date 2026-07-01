import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Info, 
  Calendar, 
  Save, 
  Edit3, 
  X, 
  Plus, 
  Trash2, 
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { nilaiService } from '../services/nilaiService';
import { settingsService } from '../services/settingsService';
import { PageHeader, LoadingState, ErrorState, useToast } from '../components/common';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SmartAlert } from '../components/ui/SmartAlert';
import { CustomModal } from '../components/ui/CustomModal';
import './InformasiUjian.scss';

const defaultMuhafadzohTemplate = [
  {
    kelas: "Sifir",
    kitab: "Lughotul ‘Arobiyah",
    mumtaz: "80",
    jayyid: "70-79",
    mutawasith: "60-69",
    rodi: "1-59"
  },
  {
    kelas: "Satu",
    kitab: "Jurumiyah Jawa",
    mumtaz: "171",
    jayyid: "160-170",
    mutawasith: "150-159",
    rodi: "1-149"
  },
  {
    kelas: "SP",
    kitab: "Matan Jurumiyah",
    mumtaz: "باب المخفوضات من الاسماء",
    jayyid: "باب المفعول من اجله – باب المفعول معه",
    mutawasith: "باب لا – باب المنادي",
    rodi: "باب الكلام – باب الاستثناء"
  },
  {
    kelas: "Dua",
    kitab: "Matan Jurumiyah",
    mumtaz: "باب المخفوضات من الاسماء",
    jayyid: "باب المفعول dari اجله – باب المفعول معه",
    mutawasith: "باب لا – باب المنادي",
    rodi: "باب الكلام – باب الاستثناء"
  },
  {
    kelas: "Tiga",
    kitab: "Nadzom ‘Imrithi",
    mumtaz: "254",
    jayyid: "245 - 253",
    mutawasith: "235 - 244",
    rodi: "1 - 234"
  },
  {
    kelas: "Empat",
    kitab: "Nadzom Alfiyah",
    mumtaz: "350",
    jayyid: "300 - 349",
    mutawasith: "245 - 299",
    rodi: "1 - 244"
  },
  {
    kelas: "Lima",
    kitab: "Nadzom Alfiyah",
    mumtaz: "600",
    jayyid: "525 - 599",
    mutawasith: "450 - 524",
    rodi: "201 - 449"
  },
  {
    kelas: "Enam",
    kitab: "Nadzom Alfiyah",
    mumtaz: "1002",
    jayyid: "925 - 1001",
    mutawasith: "850 - 924",
    rodi: "601 - 849"
  }
];

const emptyMuhafadzohTemplate = [
  { kelas: "Sifir", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "Satu", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "SP", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "Dua", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "Tiga", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "Empat", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "Lima", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" },
  { kelas: "Enam", kitab: "", mumtaz: "", jayyid: "", mutawasith: "", rodi: "" }
];

const defaultMaqroTemplate = [
  {
    kelas: "Sifir",
    maqro: [
      "س : ما ذا تقول في الجلوس للتشهد الأخير ج :",
      "س : ما ذا تقول بعد التشهد الأخير ج :"
    ]
  },
  {
    kelas: "Satu",
    maqro: [
      "النجاسات",
      "الإستنجاء"
    ]
  },
  {
    kelas: "SP",
    maqro: [
      "فصل ينبش الميت",
      "الإستعانات",
      "الأمwal التي تلزم فيها الزكاة"
    ]
  },
  {
    kelas: "Dua",
    maqro: [
      "فصل ومن معاصي القلب",
      "فصل ومن معاصي البطن",
      "فصل ومن معاصي العين"
    ]
  },
  {
    kelas: "Tiga",
    maqro: [
      "كتاب الفرائض والوصايا",
      "فصل والفروض المقدرة",
      "فصل ويجوز الوصية"
    ]
  },
  {
    kelas: "Empat",
    maqro: [
      "فصل في عدد مبطلات الصلاة",
      "فصل والمتروك من الصلاة"
    ]
  },
  {
    kelas: "Lima",
    maqro: [
      "كتاب احكام الفرائض والوصايا",
      "فصل والفروض المقدرة",
      "فصل في احكام الوصية"
    ]
  },
  {
    kelas: "Enam",
    maqro: [
      "كتاب احكام الجنايات",
      "فصل في بيان الدية"
    ]
  }
];

const emptyMaqroTemplate = [
  { kelas: "Sifir", maqro: [""] },
  { kelas: "Satu", maqro: [""] },
  { kelas: "SP", maqro: [""] },
  { kelas: "Dua", maqro: [""] },
  { kelas: "Tiga", maqro: [""] },
  { kelas: "Empat", maqro: [""] },
  { kelas: "Lima", maqro: [""] },
  { kelas: "Enam", maqro: [""] }
];

const staticTingkatanList = [
  { value: '0', label: 'Sifir' },
  { value: '1', label: 'Kelas 1' },
  { value: '99', label: 'SP' },
  { value: '2', label: 'Kelas 2' },
  { value: '3', label: 'Kelas 3' },
  { value: '4', label: 'Kelas 4' },
  { value: '5', label: 'Kelas 5' },
  { value: '6', label: 'Kelas 6' }
];

export function InformasiUjian() {
  const toast = useToast();

  const [tahunAjaran, setTahunAjaran] = useState(null);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState(null);
  
  // Tab control state
  const [activeTabKey, setActiveTabKey] = useState('ketentuan-muhafadzoh');

  // Muhafadzoh states
  const [muhafadzohInfo, setMuhafadzohInfo] = useState([]);
  const [editData, setEditData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Qiroah Maqro states
  const [qiroahMaqro, setQiroahMaqro] = useState([]);
  const [editQiroahMaqro, setEditQiroahMaqro] = useState([]);
  const [isEditingQiroah, setIsEditingQiroah] = useState(false);

  // Taftisyul Kutub states
  const [classList, setClassList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [taftisyMateri, setTaftisyMateri] = useState([]);
  const [editTaftisyMateri, setEditTaftisyMateri] = useState([]);
  const [isEditingTaftisy, setIsEditingTaftisy] = useState(false);

  // Ujian Tulis states
  const [selectedTingkatUjianTulis, setSelectedTingkatUjianTulis] = useState('0');
  const [ujianTulisMateri, setUjianTulisMateri] = useState([]);
  const [editUjianTulisMateri, setEditUjianTulisMateri] = useState([]);
  const [isEditingUjianTulis, setIsEditingUjianTulis] = useState(false);

  // Kalender Akademik states
  const [kalenderAkademik, setKalenderAkademik] = useState([]);
  const [editKalender, setEditKalender] = useState([]);
  const [isEditingKalender, setIsEditingKalender] = useState(false);
  const [kalenderLoading, setKalenderLoading] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [taData, katData, systemSettings, classesData] = await Promise.all([
        nilaiService.fetchTahunAjaran(),
        nilaiService.fetchKategori(),
        settingsService.fetchSettings().catch(() => ({})),
        nilaiService.fetchKelas().catch(() => [])
      ]);

      setTahunAjaranList(Array.isArray(taData) ? taData : []);
      setKategori(Array.isArray(katData) ? katData : []);

      const diniyahClasses = Array.isArray(classesData) ? classesData.filter(c => c.jenis === 'Diniyah') : [];
      setClassList(diniyahClasses);
      if (diniyahClasses.length > 0) {
        setSelectedKelas(diniyahClasses[0].id);
      }

      const activeTA = Array.isArray(taData) ? taData.find(ta => ta.is_active) : null;
      setTahunAjaran(activeTA || (taData.length > 0 ? taData[0] : null));

      if (Array.isArray(katData)) {
        const activeSemester = systemSettings.active_semester || 'Ganjil';
        const defaultKat = katData.find(k => k.nama?.toLowerCase().includes(activeSemester.toLowerCase()));
        if (defaultKat) {
          setSelectedKategori(defaultKat.id);
        } else if (katData.length > 0) {
          setSelectedKategori(katData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Gagal memuat data filter tahun ajaran, semester, dan kelas.');
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
      setKalenderLoading(true);
      setIsEditingKalender(false);
      const kat = kategori.find(k => k.id === selectedKategori);
      const semesterName = kat?.nama?.toLowerCase().includes('genap') ? 'Genap' : 'Ganjil';
      const data = await nilaiService.fetchKalenderAkademik(tahunAjaran.id, semesterName);
      const list = Array.isArray(data) ? data : [];
      setKalenderAkademik(list);
      setEditKalender(JSON.parse(JSON.stringify(list)));
    } catch (err) {
      console.error('Failed to fetch kalender:', err);
    } finally {
      setKalenderLoading(false);
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
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan kalender akademik.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleKalenderRowChange = (index, field, value) => {
    const updated = [...editKalender];
    updated[index] = { ...updated[index], [field]: value };
    setEditKalender(updated);
  };

  const handleAddKalenderRow = () => {
    setEditKalender([...editKalender, { tanggal: '', kegiatan: '' }]);
  };

  const handleRemoveKalenderRow = (index) => {
    setEditKalender(editKalender.filter((_, i) => i !== index));
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...editData];
    updated[index][field] = value;
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
    } catch (err) {
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
  const handleQiroahInputChange = (classIndex, maqroIndex, value) => {
    const updated = JSON.parse(JSON.stringify(editQiroahMaqro));
    updated[classIndex].maqro[maqroIndex] = value;
    setEditQiroahMaqro(updated);
  };

  const handleRemoveQiroahRow = (classIndex, maqroIndex) => {
    const updated = JSON.parse(JSON.stringify(editQiroahMaqro));
    updated[classIndex].maqro = updated[classIndex].maqro.filter((_, idx) => idx !== maqroIndex);
    setEditQiroahMaqro(updated);
  };

  const handleAddQiroahRow = (classIndex) => {
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
    } catch (err) {
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
  const handleTaftisyInputChange = (index, field, value) => {
    const updated = [...editTaftisyMateri];
    updated[index][field] = value;
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
    } catch (err) {
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

  // Ujian Tulis change handlers
  const handleUjianTulisInputChange = (index, field, value) => {
    const updated = [...editUjianTulisMateri];
    updated[index][field] = value;
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
    } catch (err) {
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

  const handleInitializeMuhafadzoh = (type) => {
    const template = type === 'default' ? defaultMuhafadzohTemplate : emptyMuhafadzohTemplate;
    setEditData(JSON.parse(JSON.stringify(template)));
    setIsEditing(true);
  };

  const handleInitializeQiroah = (type) => {
    const template = type === 'default' ? defaultMaqroTemplate : emptyMaqroTemplate;
    setEditQiroahMaqro(JSON.parse(JSON.stringify(template)));
    setIsEditingQiroah(true);
  };

  if (loading && muhafadzohInfo.length === 0) {
    return <LoadingState message="Memuat informasi ujian..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadInitialData} />;
  }

  const taOptions = tahunAjaranList.map(ta => ({
    value: String(ta.id),
    label: ta.kode
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

  return (
    <div className="informasi-ujian-page">
      <PageHeader 
        title="📝 Ketentuan & Informasi Ujian" 
        subtitle="Kelola parameter, ketentuan nilai, dan panduan batasan materi ujian diniyah"
        extra={[
          <div key="selectors" className="header-selectors-row">
            <div className="selector-box">
              <CustomSelect
                value={selectedKategori ? String(selectedKategori) : ''}
                onChange={(val) => setSelectedKategori(val ? Number(val) : null)}
                options={katOptions}
                placeholder="Pilih Semester"
                disabled={isEditing || isEditingQiroah || isEditingTaftisy || isEditingUjianTulis || isEditingKalender}
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
                disabled={isEditing || isEditingQiroah || isEditingTaftisy || isEditingUjianTulis || isEditingKalender}
              />
            </div>
          </div>
        ]}
      />

      {/* Tabs Navigation */}
      <div className="custom-tabs-nav">
        <button
          type="button"
          className={`custom-tabs-tab ${activeTabKey === 'ketentuan-muhafadzoh' ? 'active' : ''}`}
          onClick={() => !isEditing && !isEditingQiroah && !isEditingTaftisy && !isEditingUjianTulis && !isEditingKalender && setActiveTabKey('ketentuan-muhafadzoh')}
        >
          <BookOpen size={16} />
          <span>Ketentuan Muhafadzoh</span>
        </button>
        <button
          type="button"
          className={`custom-tabs-tab ${activeTabKey === 'maqro-qiroah' ? 'active' : ''}`}
          onClick={() => !isEditing && !isEditingQiroah && !isEditingTaftisy && !isEditingUjianTulis && !isEditingKalender && setActiveTabKey('maqro-qiroah')}
        >
          <Info size={16} />
          <span>Maqro Qiroah</span>
        </button>
        <button
          type="button"
          className={`custom-tabs-tab ${activeTabKey === 'taftisyul-kutub' ? 'active' : ''}`}
          onClick={() => !isEditing && !isEditingQiroah && !isEditingTaftisy && !isEditingUjianTulis && !isEditingKalender && setActiveTabKey('taftisyul-kutub')}
        >
          <BookOpen size={16} />
          <span>Batasan Taftisyul Kutub</span>
        </button>
        <button
          type="button"
          className={`custom-tabs-tab ${activeTabKey === 'materi-ujian-tulis' ? 'active' : ''}`}
          onClick={() => !isEditing && !isEditingQiroah && !isEditingTaftisy && !isEditingUjianTulis && !isEditingKalender && setActiveTabKey('materi-ujian-tulis')}
        >
          <BookOpen size={16} />
          <span>Materi Ujian Tulis</span>
        </button>
        <button
          type="button"
          className={`custom-tabs-tab ${activeTabKey === 'kalender-akademik' ? 'active' : ''}`}
          onClick={() => !isEditing && !isEditingQiroah && !isEditingTaftisy && !isEditingUjianTulis && !isEditingKalender && setActiveTabKey('kalender-akademik')}
        >
          <Calendar size={16} />
          <span>Kalender Akademik</span>
        </button>
      </div>

      {/* Tabs Content */}
      <div className="tabs-content-container">
        
        {/* TAB 1: KETENTUAN MUHAFADZOH */}
        {activeTabKey === 'ketentuan-muhafadzoh' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SmartAlert
              message="Tabel ini merupakan acuan ketentuan / rentang kriteria nilai Ujian Muhafadzoh yang berlaku di Ponpes Al-Hamid. Data ini hanya bersifat informatif / administratif sebagai panduan pengisian nilai dan BUKAN merupakan aturan otomatis perhitungan nilai baru."
              type="info"
            />

            <div className="info-card-container">
              <div className="card-header">
                <h3 className="card-title">Daftar Ketentuan Nilai Muhafadzoh</h3>
                <div className="card-actions">
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn-custom btn-secondary"
                        onClick={handleCancel}
                        disabled={saveLoading}
                      >
                        <X size={16} />
                        <span>Batal</span>
                      </button>
                      <button
                        type="button"
                        className="btn-custom btn-primary"
                        onClick={handleSave}
                        disabled={saveLoading}
                      >
                        {saveLoading ? <span className="loading-spinner"></span> : <><Save size={16} /><span>Simpan Ketentuan</span></>}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-custom btn-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 size={16} />
                      <span>Ubah Ketentuan</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body">
                {muhafadzohInfo.length > 0 || isEditing ? (
                  <div className="table-wrapper">
                    <table className="custom-data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '120px', textAlign: 'center' }}>Kelas</th>
                          <th style={{ minWidth: '220px' }}>Kitab</th>
                          <th style={{ textAlign: 'center' }}>Mumtaz (Istimewa)</th>
                          <th style={{ textAlign: 'center' }}>Jayyid (Baik)</th>
                          <th style={{ textAlign: 'center' }}>Mutawassith (Cukup)</th>
                          <th style={{ textAlign: 'center' }}>Rodi' (Kurang)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(isEditing ? editData : muhafadzohInfo).map((row, index) => {
                          const isArabicMumtaz = /[\u0600-\u06FF]/.test(row.mumtaz || '');
                          const isArabicJayyid = /[\u0600-\u06FF]/.test(row.jayyid || '');
                          const isArabicMutawasith = /[\u0600-\u06FF]/.test(row.mutawasith || '');
                          const isArabicRodi = /[\u0600-\u06FF]/.test(row.rodi || '');

                          return (
                            <tr key={index}>
                              <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{row.kelas}</td>
                              <td>
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    className="cell-input"
                                    value={editData[index]?.kitab || ''}
                                    onChange={(e) => handleInputChange(index, 'kitab', e.target.value)}
                                  />
                                ) : (
                                  <span style={{ fontWeight: 700, color: 'var(--lt-text-primary, #1a365d)' }}>{row.kitab || '-'}</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    className={`cell-input ${isArabicMumtaz ? 'arabic-font' : ''}`}
                                    value={editData[index]?.mumtaz || ''}
                                    onChange={(e) => handleInputChange(index, 'mumtaz', e.target.value)}
                                  />
                                ) : (
                                  <span className={isArabicMumtaz ? 'arabic-text' : ''} style={isArabicMumtaz ? { fontSize: '18px', color: '#00c49f', fontWeight: 'bold' } : { color: '#10b981', fontWeight: 'bold' }}>{row.mumtaz || '-'}</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    className={`cell-input ${isArabicJayyid ? 'arabic-font' : ''}`}
                                    value={editData[index]?.jayyid || ''}
                                    onChange={(e) => handleInputChange(index, 'jayyid', e.target.value)}
                                  />
                                ) : (
                                  <span className={isArabicJayyid ? 'arabic-text' : ''} style={isArabicJayyid ? { fontSize: '18px', color: '#b25900', fontWeight: '500' } : { color: '#334155', fontWeight: '500' }}>{row.jayyid || '-'}</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    className={`cell-input ${isArabicMutawasith ? 'arabic-font' : ''}`}
                                    value={editData[index]?.mutawasith || ''}
                                    onChange={(e) => handleInputChange(index, 'mutawasith', e.target.value)}
                                  />
                                ) : (
                                  <span className={isArabicMutawasith ? 'arabic-text' : ''} style={isArabicMutawasith ? { fontSize: '18px', color: '#b25900', fontWeight: '500' } : { color: '#334155', fontWeight: '500' }}>{row.mutawasith || '-'}</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    className={`cell-input ${isArabicRodi ? 'arabic-font' : ''}`}
                                    value={editData[index]?.rodi || ''}
                                    onChange={(e) => handleInputChange(index, 'rodi', e.target.value)}
                                  />
                                ) : (
                                  <span className={isArabicRodi ? 'arabic-text' : ''} style={isArabicRodi ? { fontSize: '18px', color: '#ef4444', fontWeight: 'bold' } : { color: '#ef4444', fontWeight: 'bold' }}>{row.rodi || '-'}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state-card">
                    <BookOpen size={48} className="icon-box" />
                    <p className="empty-desc">Tidak ada data ketentuan muhafadzoh untuk tahun ajaran dan semester terpilih.</p>
                    <div className="init-buttons-row">
                      <button
                        type="button"
                        className="btn-custom btn-primary"
                        onClick={() => handleInitializeMuhafadzoh('default')}
                      >
                        Gunakan Template Default
                      </button>
                      <button
                        type="button"
                        className="btn-custom btn-secondary"
                        onClick={() => handleInitializeMuhafadzoh('empty')}
                      >
                        Mulai dari Kosong
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MAQRO QIROAH */}
        {activeTabKey === 'maqro-qiroah' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SmartAlert
              message="Tabel ini merupakan acuan daftar bahan bacaan (Maqro') Ujian Qiroatul Kitab yang berlaku di Ponpes Al-Hamid. Data ini bersifat informatif / administratif sebagai panduan pengujian."
              type="info"
            />

            <div className="info-card-container">
              <div className="card-header">
                <h3 className="card-title">Daftar Maqro Ujian Qiroatul Kitab</h3>
                <div className="card-actions">
                  {isEditingQiroah ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn-custom btn-secondary"
                        onClick={handleQiroahCancel}
                        disabled={saveLoading}
                      >
                        <X size={16} />
                        <span>Batal</span>
                      </button>
                      <button
                        type="button"
                        className="btn-custom btn-primary"
                        onClick={handleQiroahSave}
                        disabled={saveLoading}
                      >
                        {saveLoading ? <span className="loading-spinner"></span> : <><Save size={16} /><span>Simpan Maqro</span></>}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-custom btn-primary"
                      onClick={() => setIsEditingQiroah(true)}
                    >
                      <Edit3 size={16} />
                      <span>Ubah Maqro</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body">
                {qiroahMaqro.length > 0 || isEditingQiroah ? (
                  <div className="table-wrapper">
                    <table className="custom-data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '150px', textAlign: 'center' }}>Kelas</th>
                          <th>Daftar Maqro' Ujian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(isEditingQiroah ? editQiroahMaqro : qiroahMaqro).map((row, index) => (
                          <tr key={index}>
                            <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{row.kelas}</td>
                            <td>
                              {isEditingQiroah ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {(editQiroahMaqro[index]?.maqro || []).map((text, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <input 
                                        type="text"
                                        className="cell-input arabic-font"
                                        value={text || ''}
                                        placeholder="Tulis baris maqro dalam bahasa Arab/Indonesia"
                                        onChange={(e) => handleQiroahInputChange(index, idx, e.target.value)}
                                      />
                                      <button
                                        type="button"
                                        className="action-icon-btn delete-btn"
                                        onClick={() => handleRemoveQiroahRow(index, idx)}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="dashed-btn"
                                    onClick={() => handleAddQiroahRow(index)}
                                    style={{ maxWidth: '200px', marginTop: '4px' }}
                                  >
                                    <Plus size={14} />
                                    <span>Tambah Baris Maqro</span>
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {(row.maqro || []).map((text, idx) => {
                                    const isArabic = /[\u0600-\u06FF]/.test(text);
                                    return (
                                      <div 
                                        key={idx} 
                                        className={`maqro-item-box ${isArabic ? 'arabic-aligned' : 'latin-aligned'}`}
                                      >
                                        <span>{text || '-'}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state-card">
                    <Info size={48} className="icon-box" />
                    <p className="empty-desc">Tidak ada data maqro qiroatul kitab untuk tahun ajaran dan semester terpilih.</p>
                    <div className="init-buttons-row">
                      <button
                        type="button"
                        className="btn-custom btn-primary"
                        onClick={() => handleInitializeQiroah('default')}
                      >
                        Gunakan Template Default
                      </button>
                      <button
                        type="button"
                        className="btn-custom btn-secondary"
                        onClick={() => handleInitializeQiroah('empty')}
                      >
                        Mulai dari Kosong
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BATASAN TAFTISYUL KUTUB */}
        {activeTabKey === 'taftisyul-kutub' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SmartAlert
              message="Tabel ini merupakan acuan batasan materi Ujian Taftisyul Kutub (Pemeriksaan Kelengkapan Kitab) yang berlaku di Ponpes Al-Hamid. Data pelajaran dimuat otomatis dari konfigurasi Jadwal Pelajaran semester terkait."
              type="info"
            />

            <div className="inline-filter-bar">
              <span className="bar-label">Pilih Kelas Diniyah:</span>
              <div className="bar-select">
                <CustomSelect
                  value={selectedKelas ? String(selectedKelas) : ''}
                  onChange={(val) => setSelectedKelas(val ? Number(val) : null)}
                  options={classOptions}
                  placeholder="Pilih Kelas"
                  disabled={isEditingTaftisy}
                />
              </div>
            </div>

            <div className="info-card-container">
              <div className="card-header">
                <h3 className="card-title">
                  Batasan Materi Taftisyul Kutub - Kelas {classList.find(c => c.id === selectedKelas)?.nama || ''}
                </h3>
                <div className="card-actions">
                  {isEditingTaftisy ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn-custom btn-secondary"
                        onClick={handleTaftisyCancel}
                        disabled={saveLoading}
                      >
                        <X size={16} />
                        <span>Batal</span>
                      </button>
                      <button
                        type="button"
                        className="btn-custom btn-primary"
                        onClick={handleTaftisySave}
                        disabled={saveLoading}
                      >
                        {saveLoading ? <span className="loading-spinner"></span> : <><Save size={16} /><span>Simpan Batasan</span></>}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-custom btn-primary"
                      onClick={() => setIsEditingTaftisy(true)}
                      disabled={!selectedKelas || taftisyMateri.length === 0}
                    >
                      <Edit3 size={16} />
                      <span>Ubah Batasan</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body">
                {!selectedKelas ? (
                  <div className="empty-state-card">
                    <HelpCircle size={40} className="icon-box" />
                    <p className="empty-desc">Silakan pilih kelas diniyah terlebih dahulu di atas.</p>
                  </div>
                ) : taftisyMateri.length > 0 || isEditingTaftisy ? (
                  <div className="table-wrapper">
                    <table className="custom-data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px', textAlign: 'center' }}>No</th>
                          <th style={{ minWidth: '220px' }}>Pelajaran</th>
                          <th>Batas Awal</th>
                          <th>Batas Akhir</th>
                          <th style={{ width: '160px', textAlign: 'center' }}>Halaman</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(isEditingTaftisy ? editTaftisyMateri : taftisyMateri).map((row, index) => {
                          const isArabicPelajaran = /[\u0600-\u06FF]/.test(row.pelajaran || '');
                          const isArabicBawal = /[\u0600-\u06FF]/.test(row.batas_awal || '');
                          const isArabicBakhir = /[\u0600-\u06FF]/.test(row.batas_akhir || '');
                          const isArabicHalaman = /[\u0600-\u06FF]/.test(row.halaman || '');

                          return (
                            <tr key={index}>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                              <td style={{ fontWeight: 'bold', color: 'var(--lt-text-primary, #1a365d)' }}>
                                <span className={isArabicPelajaran ? 'arabic-text' : ''} style={isArabicPelajaran ? { fontSize: '18px' } : {}}>{row.pelajaran}</span>
                              </td>
                              <td>
                                {isEditingTaftisy ? (
                                  <input 
                                    type="text" 
                                    className={`cell-input ${isArabicBawal ? 'arabic-font' : ''}`}
                                    value={editTaftisyMateri[index]?.batas_awal || ''}
                                    onChange={(e) => handleTaftisyInputChange(index, 'batas_awal', e.target.value)}
                                  />
                                ) : (
                                  <span className={isArabicBawal ? 'arabic-text' : ''} style={isArabicBawal ? { fontSize: '18px', color: '#111827', fontWeight: 600 } : { color: '#374151', fontWeight: 600 }}>{row.batas_awal || '-'}</span>
                                )}
                              </td>
                              <td>
                                {isEditingTaftisy ? (
                                  <input 
                                    type="text" 
                                    className={`cell-input ${isArabicBakhir ? 'arabic-font' : ''}`}
                                    value={editTaftisyMateri[index]?.batas_akhir || ''}
                                    onChange={(e) => handleTaftisyInputChange(index, 'batas_akhir', e.target.value)}
                                  />
                                ) : (
                                  <span className={isArabicBakhir ? 'arabic-text' : ''} style={isArabicBakhir ? { fontSize: '18px', color: '#111827', fontWeight: 600 } : { color: '#374151', fontWeight: 600 }}>{row.batas_akhir || '-'}</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {isEditingTaftisy ? (
                                  <input 
                                    type="text" 
                                    className={`cell-input ${isArabicHalaman ? 'arabic-font' : ''}`}
                                    value={editTaftisyMateri[index]?.halaman || ''}
                                    onChange={(e) => handleTaftisyInputChange(index, 'halaman', e.target.value)}
                                  />
                                ) : (
                                  <span className={isArabicHalaman ? 'arabic-text' : ''} style={isArabicHalaman ? { fontSize: '18px', color: '#111827', fontWeight: 600 } : { color: '#374151', fontWeight: 600 }}>{row.halaman || '-'}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '8px 0' }}>
                    <SmartAlert
                      message="Jadwal Pelajaran Belum Dikonfigurasi. Tidak ditemukan mata pelajaran Reguler untuk tingkat kelas ini pada tahun ajaran dan semester terpilih. Silakan konfigurasikan Jadwal Pelajaran terlebih dahulu untuk memuat daftar pelajaran secara otomatis."
                      type="info"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MATERI UJIAN TULIS */}
        {activeTabKey === 'materi-ujian-tulis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SmartAlert
              message="Tabel ini merupakan acuan batasan materi (Batas Awal, Batas Akhir) Ujian Tulis yang berlaku di Ponpes Al-Hamid. Data pelajaran dimuat otomatis dari konfigurasi Jadwal Pelajaran semester terkait."
              type="info"
            />

            <div className="inline-filter-bar">
              <span className="bar-label">Pilih Tingkatan Kelas:</span>
              <div className="bar-select">
                <CustomSelect
                  value={selectedTingkatUjianTulis !== null ? String(selectedTingkatUjianTulis) : ''}
                  onChange={(val) => setSelectedTingkatUjianTulis(val)}
                  options={staticTingkatanList}
                  placeholder="Pilih Tingkat"
                  disabled={isEditingUjianTulis}
                />
              </div>
            </div>

            <div className="info-card-container">
              <div className="card-header">
                <h3 className="card-title">
                  Batasan Materi Ujian Tulis - {staticTingkatanList.find(t => t.value === selectedTingkatUjianTulis)?.label || ''}
                </h3>
                <div className="card-actions">
                  {isEditingUjianTulis ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn-custom btn-secondary"
                        onClick={handleUjianTulisCancel}
                        disabled={saveLoading}
                      >
                        <X size={16} />
                        <span>Batal</span>
                      </button>
                      <button
                        type="button"
                        className="btn-custom btn-primary"
                        onClick={handleUjianTulisSave}
                        disabled={saveLoading}
                      >
                        {saveLoading ? <span className="loading-spinner"></span> : <><Save size={16} /><span>Simpan Batasan</span></>}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-custom btn-primary"
                      onClick={() => setIsEditingUjianTulis(true)}
                      disabled={selectedTingkatUjianTulis === null || ujianTulisMateri.length === 0}
                    >
                      <Edit3 size={16} />
                      <span>Ubah Batasan</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body">
                {selectedTingkatUjianTulis === null ? (
                  <div className="empty-state-card">
                    <HelpCircle size={40} className="icon-box" />
                    <p className="empty-desc">Silakan pilih tingkatan kelas terlebih dahulu di atas.</p>
                  </div>
                ) : ujianTulisMateri.length > 0 || isEditingUjianTulis ? (
                  <div className="table-wrapper">
                    <table className="custom-data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px', textAlign: 'center' }}>No</th>
                          <th style={{ minWidth: '220px' }}>Pelajaran</th>
                          <th>Batas Awal</th>
                          <th>Batas Akhir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(isEditingUjianTulis ? editUjianTulisMateri : ujianTulisMateri).map((row, index) => {
                          const isArabicPelajaran = /[\u0600-\u06FF]/.test(row.pelajaran || '');
                          const isArabicBawal = /[\u0600-\u06FF]/.test(row.batas_awal || '');
                          const isArabicBakhir = /[\u0600-\u06FF]/.test(row.batas_akhir || '');

                          return (
                            <tr key={index}>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                              <td style={{ fontWeight: 'bold', color: 'var(--lt-text-primary, #1a365d)' }}>
                                <span className={isArabicPelajaran ? 'arabic-text' : ''} style={isArabicPelajaran ? { fontSize: '18px' } : {}}>{row.pelajaran}</span>
                              </td>
                              <td>
                                {isEditingUjianTulis ? (
                                  <input 
                                    type="text" 
                                    className={`cell-input ${isArabicBawal ? 'arabic-font' : ''}`}
                                    value={editUjianTulisMateri[index]?.batas_awal || ''}
                                    onChange={(e) => handleUjianTulisInputChange(index, 'batas_awal', e.target.value)}
                                  />
                                ) : (
                                  <span className={isArabicBawal ? 'arabic-text' : ''} style={isArabicBawal ? { fontSize: '18px', color: '#111827', fontWeight: 600 } : { color: '#374151', fontWeight: 600 }}>{row.batas_awal || '-'}</span>
                                )}
                              </td>
                              <td>
                                {isEditingUjianTulis ? (
                                  <input 
                                    type="text" 
                                    className={`cell-input ${isArabicBakhir ? 'arabic-font' : ''}`}
                                    value={editUjianTulisMateri[index]?.batas_akhir || ''}
                                    onChange={(e) => handleUjianTulisInputChange(index, 'batas_akhir', e.target.value)}
                                  />
                                ) : (
                                  <span className={isArabicBakhir ? 'arabic-text' : ''} style={isArabicBakhir ? { fontSize: '18px', color: '#111827', fontWeight: 600 } : { color: '#374151', fontWeight: 600 }}>{row.batas_akhir || '-'}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '8px 0' }}>
                    <SmartAlert
                      message="Jadwal Pelajaran Belum Dikonfigurasi. Tidak ditemukan mata pelajaran Reguler untuk tingkat kelas ini pada tahun ajaran dan semester terpilih. Silakan konfigurasikan Jadwal Pelajaran terlebih dahulu untuk memuat daftar pelajaran secara otomatis."
                      type="info"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: KALENDER AKADEMIK */}
        {activeTabKey === 'kalender-akademik' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SmartAlert
              message="Agenda kegiatan dan jadwal akademik penting semester ini. Data bersifat informatif dan dapat diperbarui setiap saat."
              type="info"
            />

            <div className="info-card-container">
              <div className="card-header">
                <h3 className="card-title">Jadwal Kegiatan Akademik Semester</h3>
                <div className="card-actions">
                  {isEditingKalender ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn-custom btn-secondary"
                        onClick={() => {
                          setEditKalender(JSON.parse(JSON.stringify(kalenderAkademik)));
                          setIsEditingKalender(false);
                        }}
                        disabled={saveLoading}
                      >
                        <X size={16} />
                        <span>Batal</span>
                      </button>
                      <button
                        type="button"
                        className="btn-custom btn-primary"
                        onClick={handleSaveKalender}
                        disabled={saveLoading}
                      >
                        {saveLoading ? <span className="loading-spinner"></span> : <><Save size={16} /><span>Simpan Kalender</span></>}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-custom btn-primary"
                      onClick={() => setIsEditingKalender(true)}
                    >
                      <Edit3 size={16} />
                      <span>Ubah Kalender</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body">
                {kalenderLoading ? (
                  <div className="loading-box">
                    <div className="spinner-bar"></div>
                    <span style={{ marginTop: '12px', fontSize: '13.5px', fontWeight: 500, color: '#64748b' }}>Memuat data kalender...</span>
                  </div>
                ) : isEditingKalender ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="kalender-edit-list">
                      {editKalender.map((row, index) => (
                        <div key={index} className="kalender-edit-row">
                          <div className="date-col">
                            <input 
                              type="text" 
                              className="cell-input"
                              placeholder="Contoh: 12 - 18 Juli 2026"
                              value={row.tanggal || ''}
                              onChange={(e) => handleKalenderRowChange(index, 'tanggal', e.target.value)}
                            />
                          </div>
                          <div className="desc-col">
                            <input 
                              type="text" 
                              className="cell-input"
                              placeholder="Keterangan Kegiatan Akademik"
                              value={row.kegiatan || ''}
                              onChange={(e) => handleKalenderRowChange(index, 'kegiatan', e.target.value)}
                            />
                          </div>
                          <button
                            type="button"
                            className="action-icon-btn delete-btn"
                            onClick={() => handleRemoveKalenderRow(index)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="dashed-btn block-btn"
                      onClick={handleAddKalenderRow}
                    >
                      <Plus size={16} />
                      <span>Tambah Baris Kegiatan Baru</span>
                    </button>
                  </div>
                ) : kalenderAkademik.length > 0 ? (
                  <div className="table-wrapper">
                    <table className="custom-data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px', textAlign: 'center' }}>No</th>
                          <th style={{ width: '240px' }}>Tanggal / Periode</th>
                          <th>Kegiatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kalenderAkademik.map((row, index) => (
                          <tr key={index}>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--lt-text-primary, #1a365d)' }}>{row.tanggal || '-'}</td>
                            <td style={{ color: '#334155', fontWeight: 500 }}>{row.kegiatan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state-card">
                    <Calendar size={48} className="icon-box" />
                    <p className="empty-desc">Belum ada data kalender akademik. Klik 'Ubah Kalender' untuk mulai menambahkan.</p>
                    <button
                      type="button"
                      className="btn-custom btn-primary"
                      onClick={() => setIsEditingKalender(true)}
                    >
                      <Plus size={16} />
                      <span>Buat Kalender Baru</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default InformasiUjian;

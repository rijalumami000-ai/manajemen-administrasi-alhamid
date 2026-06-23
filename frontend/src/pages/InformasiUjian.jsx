import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Select, Input, Tag, Space, Typography, 
  message, Button, Tabs, Alert, Segmented, Row, Col, Empty 
} from 'antd';
import { 
  EditOutlined, SaveOutlined, CloseOutlined, 
  InfoCircleOutlined, BookOutlined, DeleteOutlined, PlusOutlined 
} from '@ant-design/icons';
import { nilaiService } from '../services/nilaiService';
import { settingsService } from '../services/settingsService';
import { PageHeader, LoadingState, ErrorState } from '../components/common';

const { Title, Text } = Typography;

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
    jayyid: "باب المفعول من اجله – باب المفعول معه",
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
      "الأموال التي تلزم فيها الزكاة"
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

export function InformasiUjian() {
  const [tahunAjaran, setTahunAjaran] = useState(null);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState(null);
  
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

      // Filter Diniyah classes
      const diniyahClasses = Array.isArray(classesData) ? classesData.filter(c => c.jenis === 'Diniyah') : [];
      setClassList(diniyahClasses);
      if (diniyahClasses.length > 0) {
        setSelectedKelas(diniyahClasses[0].id);
      }

      // Find active academic year
      const activeTA = Array.isArray(taData) ? taData.find(ta => ta.is_active) : null;
      setTahunAjaran(activeTA || (taData.length > 0 ? taData[0] : null));

      // Find active semester
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
    }
  }, [tahunAjaran, selectedKategori]);

  // Fetch taftisy data whenever filters or class change
  useEffect(() => {
    if (tahunAjaran?.id && selectedKategori && selectedKelas) {
      fetchTaftisyData();
    }
  }, [tahunAjaran, selectedKategori, selectedKelas]);

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
      message.error('Gagal mengambil data ketentuan nilai dan maqro.');
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
      message.error('Gagal mengambil data batasan materi Taftisyul Kutub.');
    }
  };

  const handleTahunAjaranChange = (val) => {
    const selected = tahunAjaranList.find(ta => ta.id === val);
    setTahunAjaran(selected);
  };

  // Muhafadzoh change handlers
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
      message.success('Ketentuan nilai muhafadzoh berhasil diperbarui!');
      setMuhafadzohInfo(JSON.parse(JSON.stringify(editData)));
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save muhafadzoh info:', err);
      message.error(err.message || 'Gagal menyimpan ketentuan nilai.');
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
      message.success('Maqro qiroatul kitab berhasil diperbarui!');
      setQiroahMaqro(JSON.parse(JSON.stringify(editQiroahMaqro)));
      setIsEditingQiroah(false);
    } catch (err) {
      console.error('Failed to save qiroah maqro:', err);
      message.error(err.message || 'Gagal menyimpan maqro.');
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
      message.success('Batasan materi Taftisyul Kutub berhasil diperbarui!');
      setTaftisyMateri(JSON.parse(JSON.stringify(editTaftisyMateri)));
      setIsEditingTaftisy(false);
    } catch (err) {
      console.error('Failed to save taftisy materi:', err);
      message.error(err.message || 'Gagal menyimpan batasan materi.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTaftisyCancel = () => {
    setEditTaftisyMateri(JSON.parse(JSON.stringify(taftisyMateri)));
    setIsEditingTaftisy(false);
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

  const taftisyColumns = [
    {
      title: 'No',
      key: 'index',
      width: 60,
      align: 'center',
      render: (text, record, index) => index + 1
    },
    {
      title: 'Pelajaran',
      dataIndex: 'pelajaran',
      key: 'pelajaran',
      width: 250,
      render: (text) => {
        const isArabic = /[\u0600-\u06FF]/.test(text);
        return (
          <Text 
            strong 
            className={isArabic ? "arabic-text" : ""}
            style={isArabic ? { fontSize: '18px', color: '#1a365d' } : { color: '#1a365d' }}
          >
            {text}
          </Text>
        );
      }
    },
    {
      title: 'Batas Awal',
      dataIndex: 'batas_awal',
      key: 'batas_awal',
      align: 'center',
      render: (text, record, index) => {
        if (isEditingTaftisy) {
          const isArabic = /[\u0600-\u06FF]/.test(editTaftisyMateri[index]?.batas_awal || '');
          return (
            <Input 
              value={editTaftisyMateri[index]?.batas_awal} 
              className={isArabic ? "arabic-text" : ""}
              style={isArabic ? { direction: 'rtl', textAlign: 'right' } : {}}
              onChange={(e) => handleTaftisyInputChange(index, 'batas_awal', e.target.value)} 
            />
          );
        }
        const isArabic = /[\u0600-\u06FF]/.test(text);
        return (
          <Text 
            className={isArabic ? "arabic-text" : ""} 
            style={isArabic ? { fontSize: '18px', color: '#0f172a' } : { color: '#334155' }} 
            strong
          >
            {text || '-'}
          </Text>
        );
      }
    },
    {
      title: 'Batas Akhir',
      dataIndex: 'batas_akhir',
      key: 'batas_akhir',
      align: 'center',
      render: (text, record, index) => {
        if (isEditingTaftisy) {
          const isArabic = /[\u0600-\u06FF]/.test(editTaftisyMateri[index]?.batas_akhir || '');
          return (
            <Input 
              value={editTaftisyMateri[index]?.batas_akhir} 
              className={isArabic ? "arabic-text" : ""}
              style={isArabic ? { direction: 'rtl', textAlign: 'right' } : {}}
              onChange={(e) => handleTaftisyInputChange(index, 'batas_akhir', e.target.value)} 
            />
          );
        }
        const isArabic = /[\u0600-\u06FF]/.test(text);
        return (
          <Text 
            className={isArabic ? "arabic-text" : ""} 
            style={isArabic ? { fontSize: '18px', color: '#0f172a' } : { color: '#334155' }} 
            strong
          >
            {text || '-'}
          </Text>
        );
      }
    },
    {
      title: 'Halaman',
      dataIndex: 'halaman',
      key: 'halaman',
      width: 120,
      align: 'center',
      render: (text, record, index) => {
        if (isEditingTaftisy) {
          const isArabic = /[\u0600-\u06FF]/.test(editTaftisyMateri[index]?.halaman || '');
          return (
            <Input 
              value={editTaftisyMateri[index]?.halaman} 
              className={isArabic ? "arabic-text" : ""}
              style={isArabic ? { direction: 'rtl', textAlign: 'right' } : {}}
              onChange={(e) => handleTaftisyInputChange(index, 'halaman', e.target.value)} 
            />
          );
        }
        const isArabic = /[\u0600-\u06FF]/.test(text);
        return (
          <Text 
            className={isArabic ? "arabic-text" : ""} 
            style={isArabic ? { fontSize: '18px', color: '#0f172a' } : { color: '#334155' }} 
            strong
          >
            {text || '-'}
          </Text>
        );
      }
    }
  ];

  const muhafadzohColumns = [
    {
      title: 'Kelas',
      dataIndex: 'kelas',
      key: 'kelas',
      width: 120,
      align: 'center',
      fixed: 'left',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Kitab',
      dataIndex: 'kitab',
      key: 'kitab',
      width: 220,
      render: (text, record, index) => {
        if (isEditing) {
          return (
            <Input 
              value={editData[index]?.kitab} 
              onChange={(e) => handleInputChange(index, 'kitab', e.target.value)} 
            />
          );
        }
        return <Text strong style={{ color: '#1a365d' }}>{text}</Text>;
      }
    },
    {
      title: 'Mumtaz (Istimewa)',
      dataIndex: 'mumtaz',
      key: 'mumtaz',
      align: 'center',
      render: (text, record, index) => {
        if (isEditing) {
          const isArabic = /[\u0600-\u06FF]/.test(editData[index]?.mumtaz || '');
          return (
            <Input 
              value={editData[index]?.mumtaz} 
              className={isArabic ? "arabic-text" : ""}
              style={isArabic ? { direction: 'rtl', textAlign: 'right' } : {}}
              onChange={(e) => handleInputChange(index, 'mumtaz', e.target.value)} 
            />
          );
        }
        const isArabic = /[\u0600-\u06FF]/.test(text);
        return (
          <Text 
            className={isArabic ? "arabic-text" : ""} 
            style={isArabic ? { fontSize: '18px', color: '#b25900' } : { color: '#52c41a' }} 
            strong
          >
            {text}
          </Text>
        );
      }
    },
    {
      title: 'Jayyid (Baik)',
      dataIndex: 'jayyid',
      key: 'jayyid',
      align: 'center',
      render: (text, record, index) => {
        if (isEditing) {
          const isArabic = /[\u0600-\u06FF]/.test(editData[index]?.jayyid || '');
          return (
            <Input 
              value={editData[index]?.jayyid} 
              className={isArabic ? "arabic-text" : ""}
              style={isArabic ? { direction: 'rtl', textAlign: 'right' } : {}}
              onChange={(e) => handleInputChange(index, 'jayyid', e.target.value)} 
            />
          );
        }
        const isArabic = /[\u0600-\u06FF]/.test(text);
        return (
          <Text 
            className={isArabic ? "arabic-text" : ""} 
            style={isArabic ? { fontSize: '18px', color: '#b25900' } : {}}
          >
            {text}
          </Text>
        );
      }
    },
    {
      title: 'Mutawassith (Cukup)',
      dataIndex: 'mutawasith',
      key: 'mutawasith',
      align: 'center',
      render: (text, record, index) => {
        if (isEditing) {
          const isArabic = /[\u0600-\u06FF]/.test(editData[index]?.mutawasith || '');
          return (
            <Input 
              value={editData[index]?.mutawasith} 
              className={isArabic ? "arabic-text" : ""}
              style={isArabic ? { direction: 'rtl', textAlign: 'right' } : {}}
              onChange={(e) => handleInputChange(index, 'mutawasith', e.target.value)} 
            />
          );
        }
        const isArabic = /[\u0600-\u06FF]/.test(text);
        return (
          <Text 
            className={isArabic ? "arabic-text" : ""} 
            style={isArabic ? { fontSize: '18px', color: '#b25900' } : {}}
          >
            {text}
          </Text>
        );
      }
    },
    {
      title: 'Rodi\' (Kurang)',
      dataIndex: 'rodi',
      key: 'rodi',
      align: 'center',
      render: (text, record, index) => {
        if (isEditing) {
          const isArabic = /[\u0600-\u06FF]/.test(editData[index]?.rodi || '');
          return (
            <Input 
              value={editData[index]?.rodi} 
              className={isArabic ? "arabic-text" : ""}
              style={isArabic ? { direction: 'rtl', textAlign: 'right' } : {}}
              onChange={(e) => handleInputChange(index, 'rodi', e.target.value)} 
            />
          );
        }
        const isArabic = /[\u0600-\u06FF]/.test(text);
        return (
          <Text 
            className={isArabic ? "arabic-text" : ""} 
            style={isArabic ? { fontSize: '18px', color: '#b25900' } : { color: '#ff4d4f' }} 
            strong
          >
            {text}
          </Text>
        );
      }
    }
  ];

  const qiroahColumns = [
    {
      title: 'Kelas',
      dataIndex: 'kelas',
      key: 'kelas',
      width: 150,
      align: 'center',
      fixed: 'left',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Daftar Maqro\'',
      dataIndex: 'maqro',
      key: 'maqro',
      render: (maqroList, record, index) => {
        if (isEditingQiroah) {
          const currentList = editQiroahMaqro[index]?.maqro || [];
          return (
            <Space direction="vertical" style={{ width: '100%' }}>
              {currentList.map((text, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Input 
                    value={text} 
                    className="arabic-text"
                    style={{ direction: 'rtl', textAlign: 'right', fontSize: '16px' }}
                    onChange={(e) => handleQiroahInputChange(index, idx, e.target.value)} 
                  />
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleRemoveQiroahRow(index, idx)}
                  />
                </div>
              ))}
              <Button 
                type="dashed" 
                icon={<PlusOutlined />}
                onClick={() => handleAddQiroahRow(index)}
                style={{ width: '180px', marginTop: '4px' }}
              >
                Tambah Baris Maqro
              </Button>
            </Space>
          );
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(maqroList || []).map((text, idx) => {
              const isArabic = /[\u0600-\u06FF]/.test(text);
              return (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    textAlign: isArabic ? 'right' : 'left',
                    direction: isArabic ? 'rtl' : 'ltr'
                  }}
                >
                  <Text 
                    className={isArabic ? "arabic-text" : ""} 
                    style={isArabic ? { fontSize: '18px', color: '#0f172a' } : { color: '#334155' }} 
                    strong
                  >
                    {text}
                  </Text>
                </div>
              );
            })}
          </div>
        );
      }
    }
  ];

  if (loading && muhafadzohInfo.length === 0) {
    return <LoadingState message="Memuat informasi ujian..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadInitialData} />;
  }

  return (
    <div className="informasi-ujian-page" style={{ padding: '24px' }}>
      <PageHeader 
        title="Informasi Ujian" 
        subtitle="Kelola parameter, ketentuan, dan panduan administrasi ujian kepesantrenan"
        extra={[
          <Segmented 
            key="semester"
            className="semester-segmented-highlight"
            options={kategori
              .filter(k => !k.nama.toLowerCase().includes('harian') && !k.nama.toLowerCase().includes('tugas'))
              .map(k => ({ label: k.nama, value: k.id }))}
            value={selectedKategori}
            onChange={setSelectedKategori}
            size="default"
            style={{ marginRight: 16 }}
            disabled={isEditing || isEditingQiroah}
          />,
          <Select
            key="ta"
            style={{ width: 150, alignSelf: 'center' }}
            value={tahunAjaran?.id}
            onChange={handleTahunAjaranChange}
            options={tahunAjaranList.map(ta => ({ value: ta.id, label: ta.kode }))}
            size="large"
            disabled={isEditing || isEditingQiroah}
          />
        ]}
      />

      <div className="page-content" style={{ marginTop: '16px' }}>
        <Tabs 
          defaultActiveKey="ketentuan-muhafadzoh" 
          type="line"
          items={[
            {
              key: 'ketentuan-muhafadzoh',
              label: (
                <span>
                  <BookOutlined />
                  Ketentuan Muhafadzoh
                </span>
              ),
              children: (
                <div style={{ marginTop: '16px' }}>
                  <Alert 
                    message="Informasi Penting & Administratif" 
                    description={
                      <div>
                        Tabel ini merupakan acuan ketentuan / rentang kriteria nilai Ujian Muhafadzoh yang berlaku di Ponpes Al-Hamid. 
                        <strong> Data ini hanya bersifat informatif / administratif sebagai panduan pengisian nilai dan BUKAN merupakan aturan atau rumusan otomatis perhitungan nilai baru.</strong>
                      </div>
                    } 
                    type="warning" 
                    showIcon 
                    style={{ marginBottom: 20, borderRadius: '8px' }}
                  />

                  <Card 
                    title="Daftar Ketentuan Nilai Muhafadzoh"
                    extra={
                      isEditing ? (
                        <Space>
                          <Button 
                            icon={<CloseOutlined />} 
                            onClick={handleCancel}
                            disabled={saveLoading}
                          >
                            Batal
                          </Button>
                          <Button 
                            type="primary" 
                            icon={<SaveOutlined />} 
                            onClick={handleSave}
                            loading={saveLoading}
                            style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                          >
                            Simpan Perubahan
                          </Button>
                        </Space>
                      ) : (
                        <Button 
                          type="primary" 
                          icon={<EditOutlined />} 
                          onClick={() => setIsEditing(true)}
                          disabled={isEditingQiroah}
                        >
                          Ubah Ketentuan
                        </Button>
                      )
                    }
                    style={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.06)' }}
                  >
                    {muhafadzohInfo.length > 0 || isEditing ? (
                      <Table 
                        dataSource={isEditing ? editData : muhafadzohInfo} 
                        columns={muhafadzohColumns} 
                        pagination={false} 
                        size="middle"
                        bordered
                        scroll={{ x: 'max-content' }}
                        rowKey={(record, idx) => idx}
                      />
                    ) : (
                      <Empty 
                        description="Tidak ada data ketentuan muhafadzoh untuk tahun ajaran dan semester terpilih."
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      >
                        <Space size="middle" style={{ marginTop: 8 }}>
                          <Button 
                            type="primary" 
                            onClick={() => handleInitializeMuhafadzoh('default')}
                          >
                            Gunakan Template Default
                          </Button>
                          <Button 
                            onClick={() => handleInitializeMuhafadzoh('empty')}
                          >
                            Mulai dari Kosong
                          </Button>
                        </Space>
                      </Empty>
                    )}
                  </Card>
                </div>
              )
            },
            {
              key: 'maqro-qiroah',
              label: (
                <span>
                  <InfoCircleOutlined />
                  Maqro Qiroatul Kitab
                </span>
              ),
              children: (
                <div style={{ marginTop: '16px' }}>
                  <Alert 
                    message="Informasi Penting & Administratif" 
                    description={
                      <div>
                        Tabel ini merupakan acuan daftar bahan bacaan (**Maqro**) Ujian Qiroatul Kitab yang berlaku di Ponpes Al-Hamid. 
                        <strong> Data ini hanya bersifat informatif / administratif sebagai panduan pengujian dan BUKAN merupakan aturan atau rumusan otomatis perhitungan nilai baru.</strong>
                      </div>
                    } 
                    type="warning" 
                    showIcon 
                    style={{ marginBottom: 20, borderRadius: '8px' }}
                  />

                  <Card 
                    title="Daftar Maqro Ujian Qiroatul Kitab"
                    extra={
                      isEditingQiroah ? (
                        <Space>
                          <Button 
                            icon={<CloseOutlined />} 
                            onClick={handleQiroahCancel}
                            disabled={saveLoading}
                          >
                            Batal
                          </Button>
                          <Button 
                            type="primary" 
                            icon={<SaveOutlined />} 
                            onClick={handleQiroahSave}
                            loading={saveLoading}
                            style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                          >
                            Simpan Perubahan
                          </Button>
                        </Space>
                      ) : (
                        <Button 
                          type="primary" 
                          icon={<EditOutlined />} 
                          onClick={() => setIsEditingQiroah(true)}
                          disabled={isEditing}
                        >
                          Ubah Maqro
                        </Button>
                      )
                    }
                    style={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.06)' }}
                  >
                    {qiroahMaqro.length > 0 || isEditingQiroah ? (
                      <Table 
                        dataSource={isEditingQiroah ? editQiroahMaqro : qiroahMaqro} 
                        columns={qiroahColumns} 
                        pagination={false} 
                        size="middle"
                        bordered
                        scroll={{ x: 'max-content' }}
                        rowKey={(record, idx) => idx}
                      />
                    ) : (
                      <Empty 
                        description="Tidak ada data maqro qiroatul kitab untuk tahun ajaran dan semester terpilih."
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      >
                        <Space size="middle" style={{ marginTop: 8 }}>
                          <Button 
                            type="primary" 
                            onClick={() => handleInitializeQiroah('default')}
                          >
                            Gunakan Template Default
                          </Button>
                          <Button 
                            onClick={() => handleInitializeQiroah('empty')}
                          >
                            Mulai dari Kosong
                          </Button>
                        </Space>
                      </Empty>
                    )}
                  </Card>
                </div>
              )
            },
            {
              key: 'taftisyul-kutub',
              label: (
                <span>
                  <BookOutlined />
                  Batasan Taftisyul Kutub
                </span>
              ),
              children: (
                <div style={{ marginTop: '16px' }}>
                  <Alert 
                    message="Informasi Penting & Administratif" 
                    description={
                      <div>
                        Tabel ini merupakan acuan batasan materi (**Batas Awal, Batas Akhir, dan Halaman**) Ujian Taftisyul Kutub yang berlaku di Ponpes Al-Hamid. 
                        <strong> Data pelajaran diambil otomatis dari Jadwal Pelajaran (Reguler) tingkat kelas terkait untuk tahun ajaran dan semester terpilih.</strong>
                      </div>
                    } 
                    type="warning" 
                    showIcon 
                    style={{ marginBottom: 20, borderRadius: '8px' }}
                  />

                  <div style={{ marginBottom: 20, display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Text strong>Pilih Kelas Diniyah:</Text>
                    <Select
                      style={{ width: 200 }}
                      placeholder="Pilih Kelas"
                      value={selectedKelas}
                      onChange={setSelectedKelas}
                      options={classList.map(c => ({ value: c.id, label: c.nama }))}
                      disabled={isEditingTaftisy}
                    />
                  </div>

                  <Card 
                    title={`Batasan Materi Taftisyul Kutub - Kelas ${classList.find(c => c.id === selectedKelas)?.nama || ''}`}
                    extra={
                      isEditingTaftisy ? (
                        <Space>
                          <Button 
                            icon={<CloseOutlined />} 
                            onClick={handleTaftisyCancel}
                            disabled={saveLoading}
                          >
                            Batal
                          </Button>
                          <Button 
                            type="primary" 
                            icon={<SaveOutlined />} 
                            onClick={handleTaftisySave}
                            loading={saveLoading}
                            style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                          >
                            Simpan Perubahan
                          </Button>
                        </Space>
                      ) : (
                        <Button 
                          type="primary" 
                          icon={<EditOutlined />} 
                          onClick={() => setIsEditingTaftisy(true)}
                          disabled={isEditing || isEditingQiroah || !selectedKelas || taftisyMateri.length === 0}
                        >
                          Ubah Batasan
                        </Button>
                      )
                    }
                    style={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.06)' }}
                  >
                    {!selectedKelas ? (
                      <Empty description="Silakan pilih kelas diniyah terlebih dahulu." />
                    ) : taftisyMateri.length > 0 || isEditingTaftisy ? (
                      <Table 
                        dataSource={isEditingTaftisy ? editTaftisyMateri : taftisyMateri} 
                        columns={taftisyColumns} 
                        pagination={false} 
                        size="middle"
                        bordered
                        rowKey={(record, idx) => idx}
                      />
                    ) : (
                      <Alert
                        message="Jadwal Pelajaran Belum Dikonfigurasi"
                        description={
                          <div>
                            Tidak ditemukan mata pelajaran Reguler untuk tingkat kelas ini pada tahun ajaran dan semester terpilih. 
                            Silakan konfigurasikan <strong>Jadwal Pelajaran</strong> terlebih dahulu untuk memuat daftar pelajaran secara otomatis.
                          </div>
                        }
                        type="info"
                        showIcon
                      />
                    )}
                  </Card>
                </div>
              )
            }
          ]} 
        />
      </div>
    </div>
  );
}

export default InformasiUjian;

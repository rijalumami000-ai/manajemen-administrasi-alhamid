import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Table, Button, Space, Typography, Card, Spin, Empty, Tag, Radio, Select, Tabs } from 'antd';
import { BookOutlined, PrinterOutlined, ShareAltOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined, BarChartOutlined, UndoOutlined, ExportOutlined, FilePdfOutlined } from '@ant-design/icons';
import { nilaiService } from '../services/nilaiService';
import { useResponsive } from '../hooks/useResponsive';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ManajemenNilai.scss'; // Reuse styles

const { Title, Text } = Typography;

export const LaporanUjianKhusus = () => {
  const [loading, setLoading] = useState(false);
  const [kelas, setKelas] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [selectedTingkat, setSelectedTingkat] = useState(0);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [selectedKategori, setSelectedKategori] = useState(null);
  const [data, setData] = useState([]);
  const [akumulasiData, setAkumulasiData] = useState([]);
  const [santriSearchList, setSantriSearchList] = useState([]);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [tahunAjaran, setTahunAjaran] = useState(null);
  const [mapelAkbar, setMapelAkbar] = useState(null);
  const [mapelQiroah, setMapelQiroah] = useState(null);
  const [mapelTaftisy, setMapelTaftisy] = useState(null);
  const [activeTab, setActiveTab] = useState('muhafadzoh'); // 'muhafadzoh', 'qiroatul_kitab', 'taftisyul_kutub'
  const [viewMode, setViewMode] = useState('detail'); // 'detail' or 'akumulasi'
  const { isMobile } = useResponsive();
  const listRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [taData, kelasData, mapelData, katData] = await Promise.all([
          nilaiService.fetchTahunAjaran(),
          nilaiService.fetchKelas(),
          nilaiService.fetchMataPelajaran(),
          nilaiService.fetchKategori()
        ]);

        setTahunAjaranList(Array.isArray(taData) ? taData : []);

        const savedTA = localStorage.getItem('sekolah_info_selected_tahun_ajaran');
        let activeTA = null;
        
        if (savedTA && Array.isArray(taData) && taData.some(ta => ta.id === Number(savedTA))) {
          activeTA = taData.find(ta => ta.id === Number(savedTA));
        } else if (Array.isArray(taData)) {
          activeTA = taData.find(ta => ta.is_active);
          if (activeTA) {
            localStorage.setItem('sekolah_info_selected_tahun_ajaran', activeTA.id);
          }
        }
        setTahunAjaran(activeTA);

        const diniyahKelas = Array.isArray(kelasData) ? kelasData.filter(k => k.jenis === 'Diniyah').map(k => {
          if (k.nama === 'SP' && k.tingkat === 1) return { ...k, tingkat: 1.5 };
          return k;
        }).sort((a, b) => {
          if (a.tingkat !== b.tingkat) return a.tingkat - b.tingkat;
          return a.nama.localeCompare(b.nama);
        }) : [];
        setKelas(diniyahKelas);
        
        setKategori(Array.isArray(katData) ? katData : []);

        const akbar = Array.isArray(mapelData) ? mapelData.find(m => m.nama?.includes('Muhafadzoh Akbar')) : null;
        const qiroah = Array.isArray(mapelData) ? mapelData.find(m => m.nama?.includes('Qiroatul Kitab')) : null;
        const taftisy = Array.isArray(mapelData) ? mapelData.find(m => m.nama?.includes('Taftisyul Kutub')) : null;
        setMapelAkbar(akbar);
        setMapelQiroah(qiroah);
        setMapelTaftisy(taftisy);

        const params = new URLSearchParams(window.location.search);
        const kelasIdParam = params.get('kelas_id');
        const kategoriIdParam = params.get('kategori_id');

        if (Array.isArray(katData)) {
          if (kategoriIdParam) {
            setSelectedKategori(Number(kategoriIdParam));
          } else {
            const ganjil = katData.find(k => k.nama?.toLowerCase().includes('ganjil'));
            if (ganjil) setSelectedKategori(ganjil.id);
          }
        }

        if (kelasIdParam) {
          const targetKelas = diniyahKelas.find(k => k.id === Number(kelasIdParam));
          if (targetKelas) {
            setSelectedTingkat(targetKelas.tingkat);
            setSelectedKelas(targetKelas.id);
          }
        } else {
          const sifirKelas = diniyahKelas.find(k => k.tingkat === 0);
          if (sifirKelas) {
            setSelectedTingkat(0);
            setSelectedKelas(sifirKelas.id);
          }
        }

        if (activeTA) {
          const searchRes = await nilaiService.fetchSantriReport(activeTA.id);
          setSantriSearchList(Array.isArray(searchRes) ? searchRes : []);
        }
      } catch (err) {
        console.error('Gagal memuat data awal:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const getCurrentMapel = () => {
    if (activeTab === 'muhafadzoh') return mapelAkbar;
    if (activeTab === 'qiroatul_kitab') return mapelQiroah;
    if (activeTab === 'taftisyul_kutub') return mapelTaftisy;
    return null;
  };

  useEffect(() => {
    const loadData = async () => {
      const currentMapel = getCurrentMapel();
      if (!selectedKelas || !tahunAjaran || !currentMapel || !selectedKategori || viewMode !== 'detail') return;
      setLoading(true);
      try {
        const res = await nilaiService.fetchNilaiSantri({
          tahun_ajaran_id: tahunAjaran.id,
          kelas_id: selectedKelas,
          mapel_id: currentMapel.id,
          kategori_id: selectedKategori
        });
        setData(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('Gagal memuat laporan:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedKelas, selectedKategori, tahunAjaran, mapelAkbar, mapelQiroah, mapelTaftisy, activeTab, viewMode]);

  useEffect(() => {
    const loadAkumulasi = async () => {
      const currentMapel = getCurrentMapel();
      if (!tahunAjaran || !currentMapel || !selectedKategori || viewMode !== 'akumulasi') return;
      setLoading(true);
      try {
        const res = await nilaiService.fetchAkumulasiKelas({
          tahun_ajaran_id: tahunAjaran.id,
          mapel_id: currentMapel.id,
          kategori_id: selectedKategori
        });
        setAkumulasiData(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('Gagal memuat akumulasi:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAkumulasi();
  }, [viewMode, selectedKategori, tahunAjaran, mapelAkbar, mapelQiroah, mapelTaftisy, activeTab]);

  useEffect(() => {
    const refetchSearch = async () => {
      if (tahunAjaran) {
        try {
          const searchRes = await nilaiService.fetchSantriReport(tahunAjaran.id);
          setSantriSearchList(searchRes || []);
        } catch (err) {}
      }
    };
    refetchSearch();
  }, [tahunAjaran]);

  const filteredKelas = useMemo(() => {
    return kelas.filter(k => k.tingkat === selectedTingkat);
  }, [kelas, selectedTingkat]);

  useEffect(() => {
    if (filteredKelas.length > 0) {
      const currentValid = filteredKelas.find(k => k.id === selectedKelas);
      if (!currentValid) {
        setSelectedKelas(filteredKelas[0].id);
      }
    } else {
      setSelectedKelas(null);
    }
  }, [filteredKelas, selectedTingkat]);

  const currentKategoriObj = useMemo(() => kategori.find(k => k.id === selectedKategori), [kategori, selectedKategori]);
  const currentKelasObj = useMemo(() => kelas.find(k => k.id === selectedKelas), [kelas, selectedKelas]);

  const summary = useMemo(() => {
    let counts = {};
    if (!Array.isArray(data)) return { total: 0, counts: {}, percents: {} };
    if (activeTab === 'muhafadzoh') {
      counts = {
        Rodi: data.filter(r => r.predikat === "Rodi'").length,
        Mutawassith: data.filter(r => r.predikat === "Mutawassith").length,
        Jayyid: data.filter(r => r.predikat === "Jayyid").length,
        Mumtaz: data.filter(r => r.predikat === "Mumtaz").length,
        Lulus: data.filter(r => ["Mutawassith", "Jayyid", "Mumtaz"].includes(r.predikat)).length,
        Tidak: data.filter(r => r.predikat === "Rodi'").length,
        Ghoib: data.filter(r => r.nilai_angka === null && !r.capaian).length,
      };
    } else if (activeTab === 'taftisyul_kutub') {
      counts = {
        Tam: data.filter(r => r.predikat === "Tam").length,
        Naqish: data.filter(r => r.predikat === "Naqish").length,
        Lulus: data.filter(r => r.predikat === "Tam").length,
        Tidak: data.filter(r => r.predikat === "Naqish").length,
        Ghoib: data.filter(r => r.nilai_angka === null && !r.capaian).length,
      };
    } else {
      const rated = data.filter(r => r.nilai_angka !== null).length;
      const sum = data.reduce((acc, curr) => acc + (curr.nilai_angka !== null ? Number(curr.nilai_angka) : 0), 0);
      counts = {
        Rated: rated,
        Ghoib: data.filter(r => r.nilai_angka === null && !r.capaian).length,
        Rata: rated > 0 ? (sum / rated).toFixed(2) : 0
      };
    }
    const total = data.length;
    return {
      total,
      counts,
      percents: Object.fromEntries(
        Object.entries(counts).map(([k, v]) => [k, total > 0 ? `${Math.round((v / total) * 100)}%` : '0%'])
      )
    };
  }, [data, activeTab]);

  const grandTotal = useMemo(() => {
    let counts = {};
    if (!Array.isArray(akumulasiData)) return { totalSiswa: 0, counts: {}, percents: {} };
    const totalSiswa = akumulasiData.reduce((acc, curr) => acc + Number(curr.jumlah_siswa || 0), 0);
    if (activeTab === 'muhafadzoh') {
      counts = {
        rodi: akumulasiData.reduce((acc, curr) => acc + Number(curr.rodi || 0), 0),
        mutawassith: akumulasiData.reduce((acc, curr) => acc + Number(curr.mutawassith || 0), 0),
        jayyid: akumulasiData.reduce((acc, curr) => acc + Number(curr.jayyid || 0), 0),
        mumtaz: akumulasiData.reduce((acc, curr) => acc + Number(curr.mumtaz || 0), 0),
        lulus: akumulasiData.reduce((acc, curr) => acc + Number(curr.lulus || 0), 0),
        tidak: akumulasiData.reduce((acc, curr) => acc + Number(curr.tidak || 0), 0),
        ghoib: akumulasiData.reduce((acc, curr) => acc + Number(curr.ghoib || 0), 0),
      };
    } else if (activeTab === 'taftisyul_kutub') {
      counts = {
        tam: akumulasiData.reduce((acc, curr) => acc + Number(curr.tam), 0),
        naqish: akumulasiData.reduce((acc, curr) => acc + Number(curr.naqish), 0),
        lulus: akumulasiData.reduce((acc, curr) => acc + Number(curr.lulus), 0),
        tidak: akumulasiData.reduce((acc, curr) => acc + Number(curr.tidak), 0),
        ghoib: akumulasiData.reduce((acc, curr) => acc + Number(curr.ghoib), 0),
      };
    } else {
      counts = {
        rata_rata: akumulasiData.length > 0 ? (akumulasiData.reduce((acc, curr) => acc + Number(curr.rata_rata || 0), 0) / akumulasiData.length).toFixed(2) : 0,
        ghoib: akumulasiData.reduce((acc, curr) => acc + Number(curr.ghoib), 0),
      };
    }
    return {
      totalSiswa,
      counts,
      percents: Object.fromEntries(
        Object.entries(counts).map(([k, v]) => [k, totalSiswa > 0 ? `${Math.round((v / totalSiswa) * 100)}%` : '0%'])
      )
    };
  }, [akumulasiData, activeTab]);

  const getPredikatColor = (pred) => {
    switch (pred) {
      case 'Mumtaz': return '#52c41a';
      case 'Jayyid': return '#1890ff';
      case 'Mutawassith': return '#faad14';
      case "Rodi'": return '#ff4d4f';
      case 'Tam': return '#52c41a';
      case 'Naqish': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const formatNilai = (val) => val === null || val === undefined ? '-' : Number(val).toString();

  const isArabic = (text) => /[\u0600-\u06FF]/.test(text);

  const renderArabicTextToImage = (text) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = '24px Arial';
    const width = ctx.measureText(text).width;
    canvas.width = width + 10;
    canvas.height = 36;
    ctx.font = '24px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width + 5, 18);
    return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
  };

  const renderCountCell = (v, total) => {
    const percent = total > 0 ? Math.round((v / total) * 100) : 0;
    return (
      <div style={{ textAlign: 'center' }}>
        <div>{v}</div>
        <div style={{ fontSize: 10, color: '#8c8c8c' }}>{percent}%</div>
      </div>
    );
  };

  const handleSearchSelect = (val, option) => {
    if (option.tingkat !== undefined) {
      setSelectedTingkat(option.tingkat);
    }
    if (option.kelas_id) {
      setSelectedKelas(option.kelas_id);
    }
  };

  const getPageTitle = () => {
    if (activeTab === 'muhafadzoh') return 'LAPORAN MUHAFADZOH KUBRO';
    if (activeTab === 'qiroatul_kitab') return 'LAPORAN QIROATUL KITAB';
    if (activeTab === 'taftisyul_kutub') return 'LAPORAN TAFTISYUL KUTUB';
    return 'LAPORAN';
  };

  const getColumns = () => {
    const base = [
      { title: 'No', width: 50, align: 'center', render: (_, __, idx) => idx + 1 },
      { title: 'Nama Santri', dataIndex: 'nama', className: 'font-weight-bold' },
      { 
        title: 'Nilai', 
        width: 150, 
        align: 'center', 
        render: (_, r) => r.nilai_angka !== null ? Number(r.nilai_angka).toString() : (r.capaian || '-')
      }
    ];

    if (activeTab === 'muhafadzoh') {
      return [
        ...base,
        {
          title: 'Predikat',
          children: [
            { title: "Rodi'", width: 80, align: 'center', render: (_, r) => r.predikat === "Rodi'" ? <Text type="danger">✓</Text> : '' },
            { title: 'Mutawasith', width: 100, align: 'center', render: (_, r) => r.predikat === "Mutawassith" ? <Text type="warning">✓</Text> : '' },
            { title: 'Jayyid', width: 80, align: 'center', render: (_, r) => r.predikat === "Jayyid" ? <Text type="primary">✓</Text> : '' },
            { title: 'Mumtaz', width: 80, align: 'center', render: (_, r) => r.predikat === "Mumtaz" ? <Text style={{ color: '#52c41a' }}>✓</Text> : '' },
          ]
        },
        {
          title: 'Kelulusan',
          children: [
            { title: 'Lulus', width: 80, align: 'center', render: (_, r) => ["Mutawassith", "Jayyid", "Mumtaz"].includes(r.predikat) ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : '' },
            { title: 'Tidak', width: 80, align: 'center', render: (_, r) => r.predikat === "Rodi'" ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> : '' },
          ]
        },
        { title: 'Ghoib', width: 80, align: 'center', render: (_, r) => (r.nilai_angka === null && !r.capaian) ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> : '' }
      ];
    } else if (activeTab === 'taftisyul_kutub') {
      return [
        ...base,
        {
          title: 'Hasil',
          children: [
            { title: 'Naqish', width: 100, align: 'center', render: (_, r) => r.predikat === "Naqish" ? <Text type="danger">✓</Text> : '' },
            { title: 'Tam', width: 100, align: 'center', render: (_, r) => r.predikat === "Tam" ? <Text style={{ color: '#52c41a' }}>✓</Text> : '' },
          ]
        },
        {
          title: 'Kelulusan',
          children: [
            { title: 'Lulus', width: 80, align: 'center', render: (_, r) => r.predikat === "Tam" ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : '' },
            { title: 'Tidak', width: 80, align: 'center', render: (_, r) => r.predikat === "Naqish" ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> : '' },
          ]
        },
        { title: 'Ghoib', width: 80, align: 'center', render: (_, r) => (r.nilai_angka === null && !r.capaian) ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> : '' }
      ];
    } else {
      return [
        ...base,
        { title: 'Ghoib', width: 100, align: 'center', render: (_, r) => (r.nilai_angka === null && !r.capaian) ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> : '' }
      ];
    }
  };

  const getAkumulasiColumns = () => {
    const base = [
      { title: 'No', width: 50, align: 'center', render: (_, __, idx) => idx + 1 },
      { title: 'Kelas-Kelas', dataIndex: 'nama_kelas', className: 'font-weight-bold' },
      { title: 'Jumlah Siswa', dataIndex: 'jumlah_siswa', align: 'center', className: 'font-weight-bold' }
    ];

    if (activeTab === 'muhafadzoh') {
      return [
        ...base,
        {
          title: 'Predikat',
          children: [
            { title: "Rodi'", dataIndex: 'rodi', align: 'center', render: (v, r) => renderCountCell(v, r.jumlah_siswa) },
            { title: 'Mutawasith', dataIndex: 'mutawassith', align: 'center', render: (v, r) => renderCountCell(v, r.jumlah_siswa) },
            { title: 'Jayyid', dataIndex: 'jayyid', align: 'center', render: (v, r) => renderCountCell(v, r.jumlah_siswa) },
            { title: 'Mumtaz', dataIndex: 'mumtaz', align: 'center', render: (v, r) => renderCountCell(v, r.jumlah_siswa) },
          ]
        },
        {
          title: 'Kelulusan',
          children: [
            { title: 'Lulus', dataIndex: 'lulus', align: 'center', render: (v, r) => renderCountCell(v, r.jumlah_siswa) },
            { title: 'Tidak', dataIndex: 'tidak', align: 'center', render: (v, r) => renderCountCell(v, r.jumlah_siswa) },
          ]
        },
        { title: 'Ghoib', dataIndex: 'ghoib', align: 'center', render: (v, r) => renderCountCell(v, r.jumlah_siswa) }
      ];
    } else if (activeTab === 'taftisyul_kutub') {
      return [
        ...base,
        {
          title: 'Hasil',
          children: [
            { title: 'Naqish', dataIndex: 'naqish', align: 'center', render: (v, r) => renderCountCell(v, r.jumlah_siswa) },
            { title: 'Tam', dataIndex: 'tam', align: 'center', render: (v, r) => renderCountCell(v, r.jumlah_siswa) },
          ]
        },
        {
          title: 'Kelulusan',
          children: [
            { title: 'Lulus', dataIndex: 'lulus', align: 'center', render: (v, r) => renderCountCell(v, r.jumlah_siswa) },
            { title: 'Tidak', dataIndex: 'tidak', align: 'center', render: (v, r) => renderCountCell(v, r.jumlah_siswa) },
          ]
        },
        { title: 'Ghoib', dataIndex: 'ghoib', align: 'center', render: (v, r) => renderCountCell(v, r.jumlah_siswa) }
      ];
    } else {
      return [
        ...base,
        { title: 'Rata-rata Nilai', dataIndex: 'rata_rata', align: 'center', render: (v) => <div style={{fontWeight:'bold'}}>{v}</div> },
        { title: 'Ghoib', dataIndex: 'ghoib', align: 'center', render: (v, r) => renderCountCell(v, r.jumlah_siswa) }
      ];
    }
  };

  const generatePDFContent = (doc, classObj, classData) => {
    const count = classData.length;
    let rowHeight = Math.floor(240 / count);
    if (rowHeight > 10) rowHeight = 10;
    if (rowHeight < 6.5) rowHeight = 6.5;
    const fontSize = count > 26 ? 8 : 9;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(getPageTitle(), 107.9, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`KELAS: ${classObj?.nama || '-'}`, 107.9, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${tahunAjaran?.kode || '-'} | ${currentKategoriObj?.nama || '-'}`, 107.9, 28, { align: 'center' });

    let headers = [];
    let columnStyles = {
      0: { width: 8 },
      1: { width: 55, halign: 'left' },
      2: { width: 30 }
    };

    if (activeTab === 'muhafadzoh') {
      headers = [
        [
          { content: 'No', rowSpan: 2, valign: 'middle' },
          { content: 'Nama Santri', rowSpan: 2, valign: 'middle' },
          { content: 'Nilai', rowSpan: 2, valign: 'middle' },
          { content: 'Predikat', colSpan: 4, halign: 'center' },
          { content: 'Kelulusan', colSpan: 2, halign: 'center' },
          { content: 'Ghoib', rowSpan: 2, valign: 'middle' }
        ],
        ["Rodi'", 'Mutawasith', 'Jayyid', 'Mumtaz', 'Lulus', 'Tidak']
      ];
      for (let i = 3; i <= 9; i++) columnStyles[i] = { width: 12 };
    } else if (activeTab === 'taftisyul_kutub') {
      headers = [
        [
          { content: 'No', rowSpan: 2, valign: 'middle' },
          { content: 'Nama Santri', rowSpan: 2, valign: 'middle' },
          { content: 'Nilai', rowSpan: 2, valign: 'middle' },
          { content: 'Hasil', colSpan: 2, halign: 'center' },
          { content: 'Kelulusan', colSpan: 2, halign: 'center' },
          { content: 'Ghoib', rowSpan: 2, valign: 'middle' }
        ],
        ['Naqish', 'Tam', 'Lulus', 'Tidak']
      ];
      for (let i = 3; i <= 7; i++) columnStyles[i] = { width: 16 };
    } else {
      headers = [
        [
          { content: 'No', valign: 'middle' },
          { content: 'Nama Santri', valign: 'middle' },
          { content: 'Nilai', valign: 'middle' },
          { content: 'Ghoib', valign: 'middle' }
        ]
      ];
      columnStyles[3] = { width: 25 };
    }

    const tableData = classData.map((r, idx) => {
      const isGhoib = r.nilai_angka === null && !r.capaian;
      const nilaiText = r.nilai_angka !== null ? Number(r.nilai_angka).toString() : (r.capaian || '-');
      const isAr = isArabic(nilaiText);
      const valArr = [idx + 1, r.nama, isAr ? '' : nilaiText];

      if (activeTab === 'muhafadzoh') {
        valArr.push('', '', '', '', '', '', isGhoib ? '' : '-');
      } else if (activeTab === 'taftisyul_kutub') {
        valArr.push('', '', '', '', isGhoib ? '' : '-');
      } else {
        valArr.push(isGhoib ? '' : '-');
      }
      return valArr;
    });

    const totalSiswa = classData.length;
    let localCounts = {};
    let localPercents = {};
    
    if (activeTab === 'muhafadzoh') {
      localCounts = {
        Rodi: classData.filter(r => r.predikat === "Rodi'").length,
        Mutawassith: classData.filter(r => r.predikat === "Mutawassith").length,
        Jayyid: classData.filter(r => r.predikat === "Jayyid").length,
        Mumtaz: classData.filter(r => r.predikat === "Mumtaz").length,
        Lulus: classData.filter(r => ["Mutawassith", "Jayyid", "Mumtaz"].includes(r.predikat)).length,
        Tidak: classData.filter(r => r.predikat === "Rodi'").length,
        Ghoib: classData.filter(r => r.nilai_angka === null && !r.capaian).length,
      };
    } else if (activeTab === 'taftisyul_kutub') {
      localCounts = {
        Tam: classData.filter(r => r.predikat === "Tam").length,
        Naqish: classData.filter(r => r.predikat === "Naqish").length,
        Lulus: classData.filter(r => r.predikat === "Tam").length,
        Tidak: classData.filter(r => r.predikat === "Naqish").length,
        Ghoib: classData.filter(r => r.nilai_angka === null && !r.capaian).length,
      };
    } else {
      const rated = classData.filter(r => r.nilai_angka !== null).length;
      const sum = classData.reduce((acc, curr) => acc + (curr.nilai_angka !== null ? Number(curr.nilai_angka) : 0), 0);
      localCounts = {
        Rata: rated > 0 ? (sum / rated).toFixed(2) : 0,
        Ghoib: classData.filter(r => r.nilai_angka === null && !r.capaian).length
      };
    }

    Object.entries(localCounts).forEach(([k, v]) => {
      localPercents[k] = totalSiswa > 0 ? `${Math.round((v / totalSiswa) * 100)}%` : '0%';
    });

    const ghoibCount = localCounts.Ghoib || 0;
    const ghoibPercent = localPercents.Ghoib || '0%';
    let footData = [];

    if (activeTab === 'muhafadzoh') {
      footData = [
        [{ content: '', colSpan: 10, styles: { minCellHeight: 4, fillColor: [255, 255, 255], lineWidth: 0 } }],
        [
          { content: 'Jumlah (Akumulasi)', colSpan: 3, halign: 'right', fontStyle: 'bold' },
          { content: localCounts.Rodi.toString(), halign: 'center' },
          { content: localCounts.Mutawassith.toString(), halign: 'center' },
          { content: localCounts.Jayyid.toString(), halign: 'center' },
          { content: localCounts.Mumtaz.toString(), halign: 'center' },
          { content: localCounts.Lulus.toString(), halign: 'center' },
          { content: localCounts.Tidak.toString(), halign: 'center' },
          { content: ghoibCount.toString(), halign: 'center' }
        ],
        [
          { content: 'Persentase (%)', colSpan: 3, halign: 'right', fontStyle: 'bold' },
          { content: localPercents.Rodi, halign: 'center' },
          { content: localPercents.Mutawassith, halign: 'center' },
          { content: localPercents.Jayyid, halign: 'center' },
          { content: localPercents.Mumtaz, halign: 'center' },
          { content: localPercents.Lulus, halign: 'center' },
          { content: localPercents.Tidak, halign: 'center' },
          { content: ghoibPercent, halign: 'center' }
        ]
      ];
    } else if (activeTab === 'taftisyul_kutub') {
      footData = [
        [{ content: '', colSpan: 8, styles: { minCellHeight: 4, fillColor: [255, 255, 255], lineWidth: 0 } }],
        [
          { content: 'Jumlah (Akumulasi)', colSpan: 3, halign: 'right', fontStyle: 'bold' },
          { content: localCounts.Naqish.toString(), halign: 'center' },
          { content: localCounts.Tam.toString(), halign: 'center' },
          { content: localCounts.Lulus.toString(), halign: 'center' },
          { content: localCounts.Tidak.toString(), halign: 'center' },
          { content: ghoibCount.toString(), halign: 'center' }
        ],
        [
          { content: 'Persentase (%)', colSpan: 3, halign: 'right', fontStyle: 'bold' },
          { content: localPercents.Naqish, halign: 'center' },
          { content: localPercents.Tam, halign: 'center' },
          { content: localPercents.Lulus, halign: 'center' },
          { content: localPercents.Tidak, halign: 'center' },
          { content: ghoibPercent, halign: 'center' }
        ]
      ];
    } else {
      footData = [
        [{ content: '', colSpan: 4, styles: { minCellHeight: 4, fillColor: [255, 255, 255], lineWidth: 0 } }],
        [
          { content: 'Rata-rata Nilai', colSpan: 2, halign: 'right', fontStyle: 'bold' },
          { content: localCounts.Rata.toString(), halign: 'center' },
          { content: ghoibCount.toString(), halign: 'center' }
        ]
      ];
    }

    autoTable(doc, {
      head: headers,
      body: tableData,
      foot: footData,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: fontSize, cellPadding: 1.5, halign: 'center', valign: 'middle', minCellHeight: rowHeight },
      headStyles: { fillColor: [26, 54, 93], textColor: 255, fontStyle: 'bold', lineWidth: 0.2, lineColor: [255, 255, 255] },
      footStyles: { fillColor: [240, 242, 245], textColor: 0, fontStyle: 'bold' },
      columnStyles: columnStyles,
      margin: { left: 15, right: 15 },
      didDrawCell: (data) => {
        if (data.section === 'body') {
          const rowIndex = data.row.index;
          const colIndex = data.column.index;
          const r = classData[rowIndex];
          if (!r) return;

          if (colIndex === 2) {
            const nilaiText = r.nilai_angka !== null ? Number(r.nilai_angka).toString() : (r.capaian || '-');
            if (isArabic(nilaiText)) {
              const imgInfo = renderArabicTextToImage(nilaiText);
              let imgHeight = data.cell.height * 0.65;
              let imgWidth = imgInfo.width * (imgHeight / imgInfo.height);
              if (imgWidth > data.cell.width - 2) {
                imgWidth = data.cell.width - 2;
                imgHeight = imgInfo.height * (imgWidth / imgInfo.width);
              }
              const x = data.cell.x + (data.cell.width - imgWidth) / 2;
              const y = data.cell.y + (data.cell.height - imgHeight) / 2;
              doc.addImage(imgInfo.dataUrl, 'PNG', x, y, imgWidth, imgHeight);
            }
          }

          let shouldDrawCheck = false;
          let isRed = false;
          const isLulusMuhafadzoh = ["Mutawassith", "Jayyid", "Mumtaz"].includes(r.predikat);
          const isLulusTaftisy = r.predikat === "Tam";
          const isGhoib = r.nilai_angka === null && !r.capaian;

          if (activeTab === 'muhafadzoh' && colIndex >= 3 && colIndex <= 9) {
            if (colIndex === 3 && r.predikat === "Rodi'") { shouldDrawCheck = true; isRed = true; }
            else if (colIndex === 4 && r.predikat === "Mutawassith") { shouldDrawCheck = true; }
            else if (colIndex === 5 && r.predikat === "Jayyid") { shouldDrawCheck = true; }
            else if (colIndex === 6 && r.predikat === "Mumtaz") { shouldDrawCheck = true; }
            else if (colIndex === 7 && isLulusMuhafadzoh) { shouldDrawCheck = true; }
            else if (colIndex === 8 && r.predikat === "Rodi'") { shouldDrawCheck = true; isRed = true; }
            else if (colIndex === 9 && isGhoib) { shouldDrawCheck = true; isRed = true; }
          } else if (activeTab === 'taftisyul_kutub' && colIndex >= 3 && colIndex <= 7) {
            if (colIndex === 3 && r.predikat === "Naqish") { shouldDrawCheck = true; isRed = true; }
            else if (colIndex === 4 && r.predikat === "Tam") { shouldDrawCheck = true; }
            else if (colIndex === 5 && isLulusTaftisy) { shouldDrawCheck = true; }
            else if (colIndex === 6 && r.predikat === "Naqish") { shouldDrawCheck = true; isRed = true; }
            else if (colIndex === 7 && isGhoib) { shouldDrawCheck = true; isRed = true; }
          } else if (activeTab === 'qiroatul_kitab' && colIndex === 3) {
            if (isGhoib) { shouldDrawCheck = true; isRed = true; }
          }

          if (shouldDrawCheck) {
            const x = data.cell.x + data.cell.width / 2;
            const y = data.cell.y + data.cell.height / 2;
            if (isRed) doc.setDrawColor(220, 53, 69);
            else doc.setDrawColor(40, 167, 69);
            doc.setLineWidth(0.4);
            doc.line(x - 1.5, y, x, y + 1.5);
            doc.line(x, y + 1.5, x + 2.5, y - 1.5);
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.2);
          }
        }
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.text(`Halaman ${data.pageNumber}`, 107.9, 320, { align: 'center' });
      }
    });
  };

  const generatePDFAkumulasi = (doc, akumulasiData, currentKategoriObj, tahunAjaran) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Akumulasi Nilai Seluruh Kelas`, 107.9, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${tahunAjaran?.kode || '-'} | ${currentKategoriObj?.nama || '-'} (${getPageTitle()})`, 107.9, 22, { align: 'center' });

    let headers = [];
    let columnStyles = {
      0: { width: 10 },
      1: { width: 30, halign: 'left' },
      2: { width: 20 }
    };

    if (activeTab === 'muhafadzoh') {
      headers = [
        [
          { content: 'NO', rowSpan: 2, valign: 'middle', halign: 'center' },
          { content: 'KELAS-KELAS', rowSpan: 2, valign: 'middle', halign: 'center' },
          { content: 'JUMLAH SISWA', rowSpan: 2, valign: 'middle', halign: 'center' },
          { content: 'PREDIKAT', colSpan: 4, halign: 'center' },
          { content: 'KELULUSAN', colSpan: 2, halign: 'center' },
          { content: 'GHOIB', rowSpan: 2, valign: 'middle', halign: 'center' }
        ],
        ["RODI'", 'MUTAWASITH', 'JAYYID', 'MUMTAZ', 'LULUS', 'TIDAK']
      ];
      for (let i = 3; i <= 9; i++) columnStyles[i] = { width: 18 };
    } else if (activeTab === 'taftisyul_kutub') {
      headers = [
        [
          { content: 'NO', rowSpan: 2, valign: 'middle', halign: 'center' },
          { content: 'KELAS-KELAS', rowSpan: 2, valign: 'middle', halign: 'center' },
          { content: 'JUMLAH SISWA', rowSpan: 2, valign: 'middle', halign: 'center' },
          { content: 'HASIL', colSpan: 2, halign: 'center' },
          { content: 'KELULUSAN', colSpan: 2, halign: 'center' },
          { content: 'GHOIB', rowSpan: 2, valign: 'middle', halign: 'center' }
        ],
        ['NAQISH', 'TAM', 'LULUS', 'TIDAK']
      ];
      for (let i = 3; i <= 7; i++) columnStyles[i] = { width: 25 };
    } else {
      headers = [
        [
          { content: 'NO', valign: 'middle', halign: 'center' },
          { content: 'KELAS-KELAS', valign: 'middle', halign: 'center' },
          { content: 'JUMLAH SISWA', valign: 'middle', halign: 'center' },
          { content: 'RATA-RATA NILAI', valign: 'middle', halign: 'center' },
          { content: 'GHOIB', valign: 'middle', halign: 'center' }
        ]
      ];
      columnStyles[3] = { width: 40 };
      columnStyles[4] = { width: 40 };
    }

    const percent = (v, total) => total > 0 ? `${Math.round((v / total) * 100)}%` : '0%';

    const tableData = akumulasiData.map((r, idx) => {
      const total = Number(r.jumlah_siswa);
      const valArr = [idx + 1, r.nama_kelas, total];
      if (activeTab === 'muhafadzoh') {
        valArr.push(
          `${r.rodi}\n${percent(r.rodi, total)}`,
          `${r.mutawassith}\n${percent(r.mutawassith, total)}`,
          `${r.jayyid}\n${percent(r.jayyid, total)}`,
          `${r.mumtaz}\n${percent(r.mumtaz, total)}`,
          `${r.lulus}\n${percent(r.lulus, total)}`,
          `${r.tidak}\n${percent(r.tidak, total)}`,
          `${r.ghoib}\n${percent(r.ghoib, total)}`
        );
      } else if (activeTab === 'taftisyul_kutub') {
        valArr.push(
          `${r.naqish}\n${percent(r.naqish, total)}`,
          `${r.tam}\n${percent(r.tam, total)}`,
          `${r.lulus}\n${percent(r.lulus, total)}`,
          `${r.tidak}\n${percent(r.tidak, total)}`,
          `${r.ghoib}\n${percent(r.ghoib, total)}`
        );
      } else {
        valArr.push(
          `${r.rata_rata || '0'}`,
          `${r.ghoib}\n${percent(r.ghoib, total)}`
        );
      }
      return valArr;
    });

    let footData = [];
    if (activeTab === 'muhafadzoh') {
      footData = [
        [
          { content: 'Grand Total', colSpan: 2, halign: 'right', fontStyle: 'bold' },
          { content: grandTotal.totalSiswa.toString(), halign: 'center' },
          { content: grandTotal.counts.rodi.toString(), halign: 'center', styles: { textColor: [220, 53, 69] } },
          { content: grandTotal.counts.mutawassith.toString(), halign: 'center' },
          { content: grandTotal.counts.jayyid.toString(), halign: 'center' },
          { content: grandTotal.counts.mumtaz.toString(), halign: 'center' },
          { content: grandTotal.counts.lulus.toString(), halign: 'center' },
          { content: grandTotal.counts.tidak.toString(), halign: 'center', styles: { textColor: [220, 53, 69] } },
          { content: grandTotal.counts.ghoib.toString(), halign: 'center', styles: { textColor: [220, 53, 69] } }
        ],
        [
          { content: 'Persentase (%)', colSpan: 2, halign: 'right', fontStyle: 'bold' },
          { content: '100%', halign: 'center' },
          { content: percent(grandTotal.counts.rodi, grandTotal.totalSiswa), halign: 'center', styles: { textColor: [220, 53, 69] } },
          { content: percent(grandTotal.counts.mutawassith, grandTotal.totalSiswa), halign: 'center' },
          { content: percent(grandTotal.counts.jayyid, grandTotal.totalSiswa), halign: 'center' },
          { content: percent(grandTotal.counts.mumtaz, grandTotal.totalSiswa), halign: 'center' },
          { content: percent(grandTotal.counts.lulus, grandTotal.totalSiswa), halign: 'center' },
          { content: percent(grandTotal.counts.tidak, grandTotal.totalSiswa), halign: 'center', styles: { textColor: [220, 53, 69] } },
          { content: percent(grandTotal.counts.ghoib, grandTotal.totalSiswa), halign: 'center', styles: { textColor: [220, 53, 69] } }
        ]
      ];
    } else if (activeTab === 'taftisyul_kutub') {
      footData = [
        [
          { content: 'Grand Total', colSpan: 2, halign: 'right', fontStyle: 'bold' },
          { content: grandTotal.totalSiswa.toString(), halign: 'center' },
          { content: grandTotal.counts.naqish.toString(), halign: 'center', styles: { textColor: [220, 53, 69] } },
          { content: grandTotal.counts.tam.toString(), halign: 'center' },
          { content: grandTotal.counts.lulus.toString(), halign: 'center' },
          { content: grandTotal.counts.tidak.toString(), halign: 'center', styles: { textColor: [220, 53, 69] } },
          { content: grandTotal.counts.ghoib.toString(), halign: 'center', styles: { textColor: [220, 53, 69] } }
        ],
        [
          { content: 'Persentase (%)', colSpan: 2, halign: 'right', fontStyle: 'bold' },
          { content: '100%', halign: 'center' },
          { content: percent(grandTotal.counts.naqish, grandTotal.totalSiswa), halign: 'center', styles: { textColor: [220, 53, 69] } },
          { content: percent(grandTotal.counts.tam, grandTotal.totalSiswa), halign: 'center' },
          { content: percent(grandTotal.counts.lulus, grandTotal.totalSiswa), halign: 'center' },
          { content: percent(grandTotal.counts.tidak, grandTotal.totalSiswa), halign: 'center', styles: { textColor: [220, 53, 69] } },
          { content: percent(grandTotal.counts.ghoib, grandTotal.totalSiswa), halign: 'center', styles: { textColor: [220, 53, 69] } }
        ]
      ];
    } else {
      footData = [
        [
          { content: 'Total / Rata-rata Keseluruhan', colSpan: 2, halign: 'right', fontStyle: 'bold' },
          { content: grandTotal.totalSiswa.toString(), halign: 'center' },
          { content: grandTotal.counts.rata_rata.toString(), halign: 'center', styles: { textColor: [24, 144, 255] } },
          { content: grandTotal.counts.ghoib.toString(), halign: 'center', styles: { textColor: [220, 53, 69] } }
        ]
      ];
    }

    autoTable(doc, {
      head: headers,
      body: tableData,
      foot: footData,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [248, 249, 250], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [220, 220, 220] },
      footStyles: { fillColor: [248, 249, 250], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: columnStyles,
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.text(`Halaman ${data.pageNumber}`, 107.9, 320, { align: 'center' });
      }
    });
  };

  const exportLaporanToPDF = async () => {
    const currentMapel = getCurrentMapel();
    if (!currentMapel) return;
    setLoading(true);
    try {
      const doc = jsPDF({ orientation: 'portrait', unit: 'mm', format: [215.9, 330.2] });
      const akData = await nilaiService.fetchAkumulasiKelas({
        tahun_ajaran_id: tahunAjaran.id,
        mapel_id: currentMapel.id,
        kategori_id: selectedKategori
      });
      generatePDFAkumulasi(doc, akData, currentKategoriObj, tahunAjaran);
      doc.addPage();
      generatePDFContent(doc, currentKelasObj, data);
      doc.save(`${getPageTitle()}_${currentKelasObj?.nama || 'Kelas'}_${tahunAjaran?.kode || 'TA'}.pdf`);
    } catch (error) {
      console.error('Error saat ekspor PDF:', error);
      alert('Terjadi kesalahan saat membuat PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportAllToPDF = async () => {
    const currentMapel = getCurrentMapel();
    if (!currentMapel) return;
    setLoading(true);
    try {
      const doc = jsPDF({ orientation: 'portrait', unit: 'mm', format: [215.9, 330.2] });
      const akData = await nilaiService.fetchAkumulasiKelas({
        tahun_ajaran_id: tahunAjaran.id,
        mapel_id: currentMapel.id,
        kategori_id: selectedKategori
      });
      generatePDFAkumulasi(doc, akData, currentKategoriObj, tahunAjaran);

      for (let i = 0; i < kelas.length; i++) {
        const k = kelas[i];
        const classData = await nilaiService.fetchNilaiSantri({
          tahun_ajaran_id: tahunAjaran.id,
          kelas_id: k.id,
          mapel_id: currentMapel.id,
          kategori_id: selectedKategori
        });
        doc.addPage();
        generatePDFContent(doc, k, classData);
      }
      doc.save(`${getPageTitle()}_Semua_Kelas_${tahunAjaran?.kode || 'TA'}.pdf`);
    } catch (error) {
      console.error('Error saat ekspor semua kelas:', error);
      alert('Terjadi kesalahan saat membuat PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMobileView = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="small" ref={listRef}>
      {data.map((r, idx) => {
        let isLulus = false;
        if (activeTab === 'muhafadzoh') isLulus = ["Mutawassith", "Jayyid", "Mumtaz"].includes(r.predikat);
        else if (activeTab === 'taftisyul_kutub') isLulus = r.predikat === "Tam";
        
        return (
          <Card key={r.santri_id} size="small" className="mobile-santri-card" style={{ borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Text type="secondary">{idx + 1}.</Text>
                <Text strong>{r.nama}</Text>
              </Space>
              <Text strong style={{ fontSize: 14, maxWidth: '40%', textAlign: 'right' }}>
                {r.nilai_angka !== null ? formatNilai(r.nilai_angka) : (r.capaian || '-')}
              </Text>
            </div>
            {activeTab !== 'qiroatul_kitab' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                <Tag color={getPredikatColor(r.predikat)}>{r.predikat || 'Belum Diisi'}</Tag>
                {r.predikat && (
                  <Tag color={isLulus ? 'green' : 'red'}>
                    {isLulus ? 'Lulus' : 'Tidak Lulus'}
                  </Tag>
                )}
              </div>
            )}
          </Card>
        );
      })}

      <Card title="Ringkasan Kelas" size="small" style={{ marginTop: 12, borderRadius: 8 }}>
        {activeTab === 'muhafadzoh' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {['Mumtaz', 'Jayyid', 'Mutawassith', "Rodi'"].map(p => (
              <div key={p} style={{ textAlign: 'center', padding: 8, background: '#f5f5f5', borderRadius: 6 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>{p}</Text>
                <div style={{ fontSize: 14, fontWeight: 'bold' }}>{summary.counts[p.replace("'", "")]}</div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'taftisyul_kutub' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div style={{ textAlign: 'center', padding: 8, background: '#f5f5f5', borderRadius: 6 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Tam</Text>
              <div style={{ fontSize: 14, fontWeight: 'bold' }}>{summary.counts.Tam}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 8, background: '#f5f5f5', borderRadius: 6 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Naqish</Text>
              <div style={{ fontSize: 14, fontWeight: 'bold' }}>{summary.counts.Naqish}</div>
            </div>
          </div>
        )}
        {activeTab === 'qiroatul_kitab' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div style={{ textAlign: 'center', padding: 8, background: '#e6f7ff', borderRadius: 6 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Dinilai</Text>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1890ff' }}>{summary.counts.Rated}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 8, background: '#fff1f0', borderRadius: 6 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Ghoib</Text>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#ff4d4f' }}>{summary.counts.Ghoib}</div>
            </div>
          </div>
        )}
      </Card>
    </Space>
  );

  const renderMobileAkumulasi = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      {akumulasiData.map((k, idx) => (
        <Card key={k.kelas_id} size="small" style={{ borderRadius: 8, borderLeft: '4px solid #1890ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text strong>{idx + 1}. {k.nama_kelas}</Text>
            <Text type="secondary">{k.jumlah_siswa} Siswa</Text>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Text type="secondary">Silakan gunakan layar lebar/cetak PDF untuk detail lengkap.</Text>
          </div>
        </Card>
      ))}
      <Card title="Total Keseluruhan" size="small" style={{ marginTop: 12, borderRadius: 8, background: '#fafafa' }}>
        <div style={{ textAlign: 'center' }}>
          <Text strong style={{ fontSize: 16 }}>{grandTotal.totalSiswa} Siswa</Text>
        </div>
      </Card>
    </Space>
  );

  const tingkatOptions = [
    { label: 'Sifir', value: 0 },
    { label: 'Kelas 1', value: 1 },
    { label: 'SP', value: 1.5 },
    { label: 'Kelas 2', value: 2 },
    { label: 'Kelas 3', value: 3 },
    { label: 'Kelas 4', value: 4 },
    { label: 'Kelas 5', value: 5 },
    { label: 'Kelas 6', value: 6 },
  ];

  const handleTahunAjaranChange = (val) => {
    const selected = tahunAjaranList.find(t => t.id === val);
    setTahunAjaran(selected);
    localStorage.setItem('sekolah_info_selected_tahun_ajaran', val);
  };

  const handleShare = () => {
    if (!selectedKelas || !selectedKategori) return;
    const shareUrl = `${window.location.origin}/pub/laporan-ujian-khusus?kelas_id=${selectedKelas}&kategori_id=${selectedKategori}`;
    
    if (navigator.share && window.isSecureContext) {
      navigator.share({
        title: getPageTitle(),
        text: `Lihat ${getPageTitle()} untuk kelas ${currentKelasObj?.nama || ''}`,
        url: shareUrl
      }).catch(console.error);
    } else if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('Link laporan disalin ke clipboard!'))
        .catch(() => prompt('Silakan salin link berikut secara manual:', shareUrl));
    } else {
      prompt('Salin link laporan berikut:', shareUrl);
    }
  };

  return (
    <div className={`laporan-container ${isMobile ? 'mobile' : 'desktop'}`} style={{ padding: isMobile ? 8 : 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Card 
        style={{ marginBottom: 12, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 10 }}
        bodyStyle={{ padding: isMobile ? 12 : 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Title level={isMobile ? 5 : 4} style={{ margin: 0, color: '#1a365d' }}>
              Laporan Ujian Khusus
            </Title>
            <Space wrap style={{ marginTop: 8 }}>
              <Select
                size="small"
                value={tahunAjaran?.id}
                onChange={handleTahunAjaranChange}
                style={{ width: 140 }}
                options={tahunAjaranList.map(t => ({ label: t.kode, value: t.id }))}
                placeholder="Tahun Ajaran"
              />
              <Select
                size="small"
                value={selectedKategori}
                onChange={setSelectedKategori}
                style={{ width: 140 }}
                options={kategori.map(k => ({ label: k.nama, value: k.id }))}
                placeholder="Semester"
              />
            </Space>
          </div>
          
          <Space wrap>
            <Button 
              size="small" 
              type={viewMode === 'akumulasi' ? 'primary' : 'default'}
              icon={viewMode === 'akumulasi' ? <UndoOutlined /> : <BarChartOutlined />}
              onClick={() => setViewMode(viewMode === 'detail' ? 'akumulasi' : 'detail')}
            >
              {viewMode === 'detail' ? 'Lihat Akumulasi' : 'Kembali ke Detail'}
            </Button>
            
            {!isMobile && (
              <Space wrap>
                <Button size="small" icon={<PrinterOutlined />} onClick={() => window.print()}>Cetak</Button>
                {viewMode === 'detail' && (
                  <>
                    <Button size="small" icon={<ShareAltOutlined />} onClick={handleShare}>Bagikan</Button>
                    <Button size="small" type="primary" icon={<FilePdfOutlined />} onClick={exportLaporanToPDF} loading={loading}>Ekspor PDF</Button>
                  </>
                )}
                {viewMode === 'akumulasi' && (
                  <Button size="small" type="primary" icon={<ExportOutlined />} onClick={exportAllToPDF} loading={loading}>Ekspor Semua Kelas (PDF)</Button>
                )}
              </Space>
            )}
          </Space>
        </div>
      </Card>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} bodyStyle={{ padding: isMobile ? 12 : 24 }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => { setActiveTab(key); setViewMode('detail'); }} 
          type="card" 
          style={{ marginBottom: 16 }}
          items={[
            { key: 'muhafadzoh', label: 'Muhafadzoh Akbar' },
            { key: 'qiroatul_kitab', label: 'Qiroatul Kitab' },
            { key: 'taftisyul_kutub', label: 'Taftisyul Kutub' },
          ]}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="Memuat Data Laporan..." />
          </div>
        ) : (
          <>
            {viewMode === 'detail' ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
                    <Radio.Group 
                      value={selectedTingkat} 
                      onChange={e => setSelectedTingkat(e.target.value)}
                      buttonStyle="solid"
                      size="small"
                      style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}
                    >
                      {tingkatOptions.map(opt => (
                        <Radio.Button key={opt.value} value={opt.value} style={{ borderRadius: 4 }}>
                          {opt.label}
                        </Radio.Button>
                      ))}
                    </Radio.Group>

                    <Select
                      showSearch
                      placeholder="Cari Santri..."
                      style={{ width: isMobile ? '100%' : 250 }}
                      size="small"
                      filterOption={false}
                      suffixIcon={<SearchOutlined />}
                      onSelect={handleSearchSelect}
                      options={santriSearchList.map(s => ({
                        value: s.santri_id,
                        label: `${s.nama} - ${s.nama_kelas}`,
                        kelas_id: s.kelas_id,
                        tingkat: s.tingkat
                      }))}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {filteredKelas.map(k => (
                      <Button
                        key={k.id}
                        type={selectedKelas === k.id ? 'primary' : 'default'}
                        onClick={() => setSelectedKelas(k.id)}
                        size="small"
                        style={{ borderRadius: 12 }}
                      >
                        {k.nama}
                      </Button>
                    ))}
                  </div>
                </div>

                {isMobile ? renderMobileView() : (
                  <Table 
                    columns={getColumns()} 
                    dataSource={data} 
                    rowKey="santri_id"
                    pagination={false}
                    size="small"
                    bordered
                    scroll={{ x: 'max-content' }}
                    className="laporan-table"
                  />
                )}
              </>
            ) : (
              <>
                {isMobile ? renderMobileAkumulasi() : (
                  <Table 
                    columns={getAkumulasiColumns()} 
                    dataSource={akumulasiData} 
                    rowKey="kelas_id"
                    pagination={false}
                    size="small"
                    bordered
                    scroll={{ x: 'max-content' }}
                    className="laporan-table akumulasi-table"
                  />
                )}
              </>
            )}
          </>
        )}
      </Card>
      
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 64, right: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {viewMode === 'detail' ? (
            <>
              <Button type="primary" shape="circle" icon={<ShareAltOutlined />} size="large" onClick={handleShare} style={{ boxShadow: '0 4px 12px rgba(24,144,255,0.5)', background: '#52c41a', borderColor: '#52c41a' }} />
              <Button type="primary" shape="circle" icon={<FilePdfOutlined />} size="large" onClick={exportLaporanToPDF} loading={loading} style={{ boxShadow: '0 4px 12px rgba(24,144,255,0.5)' }} />
            </>
          ) : (
            <Button type="primary" shape="circle" icon={<ExportOutlined />} size="large" onClick={exportAllToPDF} loading={loading} style={{ boxShadow: '0 4px 12px rgba(24,144,255,0.5)' }} />
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Table, Button, Space, Typography, Card, Spin, Empty, Tag, Radio, Select } from 'antd';
import { BookOutlined, PrinterOutlined, ShareAltOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined, BarChartOutlined, UndoOutlined } from '@ant-design/icons';
import { nilaiService } from '../services/nilaiService';
import { useResponsive } from '../hooks/useResponsive';
import './ManajemenNilai.scss'; // Reuse styles

const { Title, Text } = Typography;

export const LaporanMuhafadzoh = () => {
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
  const [viewMode, setViewMode] = useState('detail'); // 'detail' or 'akumulasi'
  const { isMobile } = useResponsive();
  const listRef = useRef(null);

  // Load Initial Data
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

        // Handle Tahun Ajaran from LocalStorage or default to active
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

        // Filter Diniyah classes and handle SP mapping
        const diniyahKelas = Array.isArray(kelasData) ? kelasData.filter(k => k.jenis === 'Diniyah').map(k => {
          if (k.nama === 'SP' && k.tingkat === 1) return { ...k, tingkat: 99 };
          return k;
        }) : [];
        setKelas(diniyahKelas);
        
        setKategori(Array.isArray(katData) ? katData : []);

        // Find Muhafadzoh Akbar subject
        const akbar = mapelData.find(m => m.nama.includes('Muhafadzoh Akbar'));
        setMapelAkbar(akbar);

        // Set default category (Ganjil)
        if (Array.isArray(katData)) {
          const ganjil = katData.find(k => k.nama?.toLowerCase().includes('ganjil'));
          if (ganjil) setSelectedKategori(ganjil.id);
        }

        // Auto select first class of Sifir if available
        const sifirKelas = diniyahKelas.find(k => k.tingkat === 0);
        if (sifirKelas) {
          setSelectedTingkat(0);
          setSelectedKelas(sifirKelas.id);
        }

        // Fetch search list if TA is active
        if (activeTA) {
          const searchRes = await nilaiService.fetchSantriReport(activeTA.id);
          setSantriSearchList(searchRes || []);
        }
      } catch (err) {
        console.error('Gagal memuat data awal:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Parse query params for shared links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kelasId = params.get('kelas_id');
    const kategoriId = params.get('kategori_id');
    
    if (kelasId) setSelectedKelas(Number(kelasId));
    if (kategoriId) setSelectedKategori(Number(kategoriId));
  }, []);

  // Load Laporan Data when class or category changes (Detail Mode)
  useEffect(() => {
    const loadData = async () => {
      if (!selectedKelas || !tahunAjaran || !mapelAkbar || !selectedKategori || viewMode !== 'detail') return;
      setLoading(true);
      try {
        const res = await nilaiService.fetchNilaiSantri({
          tahun_ajaran_id: tahunAjaran.id,
          kelas_id: selectedKelas,
          mapel_id: mapelAkbar.id,
          kategori_id: selectedKategori
        });
        setData(res || []);
      } catch (err) {
        console.error('Gagal memuat laporan:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedKelas, selectedKategori, tahunAjaran, mapelAkbar, viewMode]);

  // Load Akumulasi Data (Akumulasi Mode)
  useEffect(() => {
    const loadAkumulasi = async () => {
      if (!tahunAjaran || !mapelAkbar || !selectedKategori || viewMode !== 'akumulasi') return;
      setLoading(true);
      try {
        const res = await nilaiService.fetchAkumulasiKelas({
          tahun_ajaran_id: tahunAjaran.id,
          mapel_id: mapelAkbar.id,
          kategori_id: selectedKategori
        });
        setAkumulasiData(res || []);
      } catch (err) {
        console.error('Gagal memuat akumulasi:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAkumulasi();
  }, [viewMode, selectedKategori, tahunAjaran, mapelAkbar]);

  // Refetch search list when Year changes
  useEffect(() => {
    const refetchSearch = async () => {
      if (tahunAjaran) {
        try {
          const searchRes = await nilaiService.fetchSantriReport(tahunAjaran.id);
          setSantriSearchList(searchRes || []);
        } catch (err) {
          console.error('Gagal memuat daftar pencarian:', err);
        }
      }
    };
    refetchSearch();
  }, [tahunAjaran]);

  // Filtered classes based on selected tingkat
  const filteredKelas = useMemo(() => {
    return kelas.filter(k => k.tingkat === selectedTingkat);
  }, [kelas, selectedTingkat]);

  // Auto update selected class when tingkat changes
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

  // Compute Summary (Akumulasi & Presentase) for Detail View
  const summary = useMemo(() => {
    const total = data.length;
    const counts = {
      Rodi: data.filter(r => r.predikat === "Rodi'").length,
      Mutawassith: data.filter(r => r.predikat === "Mutawassith").length,
      Jayyid: data.filter(r => r.predikat === "Jayyid").length,
      Mumtaz: data.filter(r => r.predikat === "Mumtaz").length,
      Lulus: data.filter(r => ["Mutawassith", "Jayyid", "Mumtaz"].includes(r.predikat)).length,
      Tidak: data.filter(r => r.predikat === "Rodi'").length,
    };

    return {
      total,
      counts,
      percents: Object.fromEntries(
        Object.entries(counts).map(([k, v]) => [
          k, 
          total > 0 ? `${Math.round((v / total) * 100)}%` : '0%'
        ])
      )
    };
  }, [data]);

  // Compute Grand Total for Akumulasi View
  const grandTotal = useMemo(() => {
    const totalSiswa = akumulasiData.reduce((acc, curr) => acc + Number(curr.jumlah_siswa), 0);
    const counts = {
      rodi: akumulasiData.reduce((acc, curr) => acc + Number(curr.rodi), 0),
      mutawassith: akumulasiData.reduce((acc, curr) => acc + Number(curr.mutawassith), 0),
      jayyid: akumulasiData.reduce((acc, curr) => acc + Number(curr.jayyid), 0),
      mumtaz: akumulasiData.reduce((acc, curr) => acc + Number(curr.mumtaz), 0),
      lulus: akumulasiData.reduce((acc, curr) => acc + Number(curr.lulus), 0),
      tidak: akumulasiData.reduce((acc, curr) => acc + Number(curr.tidak), 0),
      ghoib: akumulasiData.reduce((acc, curr) => acc + Number(curr.ghoib), 0),
    };

    return {
      totalSiswa,
      counts,
      percents: Object.fromEntries(
        Object.entries(counts).map(([k, v]) => [
          k, 
          totalSiswa > 0 ? `${Math.round((v / totalSiswa) * 100)}%` : '0%'
        ])
      )
    };
  }, [akumulasiData]);

  const getPredikatColor = (pred) => {
    switch (pred) {
      case 'Mumtaz': return '#52c41a';
      case 'Jayyid': return '#1890ff';
      case 'Mutawassith': return '#faad14';
      case "Rodi'": return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const formatNilai = (val) => {
    if (val === null || val === undefined) return '-';
    return Number(val).toString();
  };

  const handleTahunAjaranChange = (val) => {
    const selected = tahunAjaranList.find(ta => ta.id === val);
    setTahunAjaran(selected);
    localStorage.setItem('sekolah_info_selected_tahun_ajaran', val);
  };

  // Helper to render count with percentage in table
  const renderCountCell = (v, total) => {
    const percent = total > 0 ? Math.round((v / total) * 100) : 0;
    return (
      <div style={{ textAlign: 'center' }}>
        <div>{v}</div>
        <div style={{ fontSize: 10, color: '#8c8c8c' }}>{percent}%</div>
      </div>
    );
  };

  // Columns for Detail View
  const columns = [
    { title: 'No', width: 50, align: 'center', render: (_, __, idx) => idx + 1 },
    { title: 'Nama Santri', dataIndex: 'nama', className: 'font-weight-bold' },
    { 
      title: 'Nilai', 
      width: 150, 
      align: 'center', 
      render: (_, r) => r.nilai_angka !== null ? Number(r.nilai_angka).toString() : (r.capaian || '-')
    },
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
    }
  ];

  // Columns for Akumulasi View
  const akumulasiColumns = [
    { title: 'No', width: 50, align: 'center', render: (_, __, idx) => idx + 1 },
    { title: 'Kelas-Kelas', dataIndex: 'nama_kelas', className: 'font-weight-bold' },
    { title: 'Jumlah Siswa', dataIndex: 'jumlah_siswa', align: 'center', className: 'font-weight-bold' },
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

  const currentKelasObj = kelas.find(k => k.id === selectedKelas);
  const currentKategoriObj = kategori.find(k => k.id === selectedKategori);

  const handleSearchSelect = (val, option) => {
    setViewMode('detail'); // Switch to detail if searching
    setSelectedTingkat(option.tingkat);
    setSelectedKelas(option.kelas_id);
    setTimeout(() => {
      listRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  };

  // Render Mobile View (Cards for Detail)
  const renderMobileView = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="small" ref={listRef}>
      {data.map((r, idx) => {
        const isLulus = ["Mutawassith", "Jayyid", "Mumtaz"].includes(r.predikat);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
              <Tag color={getPredikatColor(r.predikat)}>{r.predikat || 'Belum Diisi'}</Tag>
              {r.predikat && (
                <Tag color={isLulus ? 'green' : 'red'}>
                  {isLulus ? 'Lulus' : 'Tidak Lulus'}
                </Tag>
              )}
            </div>
          </Card>
        );
      })}

      {/* Mobile Summary */}
      <Card title="Ringkasan Kelas" size="small" style={{ marginTop: 12, borderRadius: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {['Mumtaz', 'Jayyid', 'Mutawassith', "Rodi'"].map(p => (
            <div key={p} style={{ textAlign: 'center', padding: 8, background: '#f5f5f5', borderRadius: 6 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>{p}</Text>
              <div style={{ fontSize: 14, fontWeight: 'bold' }}>{summary.counts[p.replace("'", "")]} ({summary.percents[p.replace("'", "")]})</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
          <div style={{ textAlign: 'center', padding: 8, background: '#e6f7ff', borderRadius: 6 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Lulus</Text>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1890ff' }}>{summary.counts.Lulus} ({summary.percents.Lulus})</div>
          </div>
          <div style={{ textAlign: 'center', padding: 8, background: '#fff1f0', borderRadius: 6 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Tidak Lulus</Text>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#ff4d4f' }}>{summary.counts.Tidak} ({summary.percents.Tidak})</div>
          </div>
        </div>
      </Card>
    </Space>
  );

  // Helper to calculate percent for mobile
  const getPercent = (v, total) => {
    return total > 0 ? `${Math.round((v / total) * 100)}%` : '0%';
  };

  // Render Mobile View (Cards for Akumulasi)
  const renderMobileAkumulasi = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      {akumulasiData.map((k, idx) => {
        const isSelected = k.kelas_id === selectedKelas;
        return (
          <Card 
            key={k.kelas_id} 
            size="small" 
            style={{ 
              borderRadius: 8,
              border: isSelected ? '2px solid #1890ff' : '1px solid #f0f0f0',
              background: isSelected ? '#e6f7ff' : '#fff',
              transition: 'all 0.3s'
            }}
            onClick={() => setSelectedKelas(k.kelas_id)} // Allow selecting class by clicking card
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                {isSelected && <Tag color="blue">Aktif</Tag>}
                <Text strong>{k.nama_kelas}</Text>
              </Space>
              <Tag color="blue">{k.jumlah_siswa} Siswa</Tag>
            </div>
            
            {/* Predikat Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginTop: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 10 }}>Rodi'</Text>
                <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{k.rodi}</div>
                <div style={{ fontSize: 9, color: '#8c8c8c' }}>{getPercent(k.rodi, k.jumlah_siswa)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 10 }}>Mutaws</Text>
                <div style={{ fontWeight: 'bold' }}>{k.mutawassith}</div>
                <div style={{ fontSize: 9, color: '#8c8c8c' }}>{getPercent(k.mutawassith, k.jumlah_siswa)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 10 }}>Jayyid</Text>
                <div style={{ fontWeight: 'bold' }}>{k.jayyid}</div>
                <div style={{ fontSize: 9, color: '#8c8c8c' }}>{getPercent(k.jayyid, k.jumlah_siswa)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 10 }}>Mumtaz</Text>
                <div style={{ fontWeight: 'bold' }}>{k.mumtaz}</div>
                <div style={{ fontSize: 9, color: '#8c8c8c' }}>{getPercent(k.mumtaz, k.jumlah_siswa)}</div>
              </div>
            </div>

            {/* Kelulusan & Ghoib Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginTop: 8, borderTop: '1px solid #f0f0f0', paddingTop: 4 }}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 10 }}>Lulus</Text>
                <div style={{ color: '#52c41a', fontWeight: 'bold' }}>{k.lulus}</div>
                <div style={{ fontSize: 9, color: '#8c8c8c' }}>{getPercent(k.lulus, k.jumlah_siswa)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 10 }}>Tidak</Text>
                <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{k.tidak}</div>
                <div style={{ fontSize: 9, color: '#8c8c8c' }}>{getPercent(k.tidak, k.jumlah_siswa)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 10 }}>Ghoib</Text>
                <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{k.ghoib}</div>
                <div style={{ fontSize: 9, color: '#8c8c8c' }}>{getPercent(k.ghoib, k.jumlah_siswa)}</div>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Grand Total Mobile */}
      <Card title="Total Akumulasi Seluruh Kelas" size="small" style={{ marginTop: 12, borderRadius: 8, background: '#fafafa' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Text strong style={{ fontSize: 16 }}>{grandTotal.totalSiswa} Siswa ({akumulasiData.length} Kelas)</Text>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {['Mumtaz', 'Jayyid', 'Mutawassith', "Rodi'"].map(p => {
            const key = p.replace("'", "").toLowerCase();
            return (
              <div key={p} style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 10 }}>{p}</Text>
                <div style={{ fontWeight: 'bold' }}>{grandTotal.counts[key]}</div>
                <div style={{ fontSize: 10, color: '#8c8c8c' }}>{grandTotal.percents[key]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginTop: 8, borderTop: '1px solid #e8e8e8', paddingTop: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 10 }}>Lulus</Text>
            <div style={{ fontWeight: 'bold', color: '#1890ff' }}>{grandTotal.counts.lulus}</div>
            <div style={{ fontSize: 10, color: '#8c8c8c' }}>{grandTotal.percents.lulus}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 10 }}>Tidak</Text>
            <div style={{ fontWeight: 'bold', color: '#ff4d4f' }}>{grandTotal.counts.tidak}</div>
            <div style={{ fontSize: 10, color: '#8c8c8c' }}>{grandTotal.percents.tidak}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 10 }}>Ghoib</Text>
            <div style={{ fontWeight: 'bold', color: '#ff4d4f' }}>{grandTotal.counts.ghoib}</div>
            <div style={{ fontSize: 10, color: '#8c8c8c' }}>{grandTotal.percents.ghoib}</div>
          </div>
        </div>
      </Card>
    </Space>
  );

  const tingkatOptions = [
    { label: 'Sifir', value: 0 },
    { label: 'Kelas 1', value: 1 },
    { label: 'Kelas 2', value: 2 },
    { label: 'Kelas 3', value: 3 },
    { label: 'Kelas 4', value: 4 },
    { label: 'Kelas 5', value: 5 },
    { label: 'Kelas 6', value: 6 },
    { label: 'SP', value: 99 },
  ];

  return (
    <div className={`laporan-container ${isMobile ? 'mobile' : 'desktop'}`} style={{ padding: isMobile ? 8 : 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Sticky Header Card */}
      <Card 
        style={{ 
          marginBottom: 12, 
          borderRadius: 12, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#fff'
        }}
        bodyStyle={{ padding: isMobile ? 12 : 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Title level={isMobile ? 5 : 4} style={{ margin: 0, color: '#1a365d' }}>
              {viewMode === 'detail' ? 'Laporan Muhafadzoh Akbar' : 'Akumulasi Seluruh Kelas'}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>{tahunAjaran?.kode || '-'} | {currentKategoriObj?.nama || '-'}</Text>
          </div>
          
          <Space wrap>
            {/* Toggle View Button */}
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
                <Button size="small" type="primary" icon={<ShareAltOutlined />} onClick={() => {
                  const url = `${window.location.origin}/pub/laporan-muhafadzoh?kelas_id=${selectedKelas}&kategori_id=${selectedKategori}`;
                  navigator.clipboard.writeText(url);
                  alert('Link khusus Wali Kelas telah disalin!');
                }}>Salin Link Wali Kelas</Button>
              </Space>
            )}
          </Space>
        </div>

        {/* Temporal Filters: Year & Semester */}
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Space>
            <Text strong size="small">Tahun:</Text>
            <Select
              style={{ width: 120 }}
              value={tahunAjaran?.id}
              onChange={handleTahunAjaranChange}
              options={tahunAjaranList.map(ta => ({ value: ta.id, label: ta.kode }))}
              size="small"
            />
          </Space>

          <Radio.Group 
            value={selectedKategori} 
            onChange={e => setSelectedKategori(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="small"
          >
            {kategori
              .filter(k => k.nama?.toLowerCase().includes('ganjil') || k.nama?.toLowerCase().includes('genap'))
              .map(k => (
                <Radio.Button key={k.id} value={k.id}>{k.nama}</Radio.Button>
              ))}
          </Radio.Group>
        </div>

        {/* Search Box (Only in Detail Mode) */}
        {viewMode === 'detail' && (
          <div style={{ marginTop: 12 }}>
            <Select
              showSearch
              style={{ width: '100%' }}
              placeholder="Cari nama santri..."
              optionFilterProp="children"
              onChange={handleSearchSelect}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={santriSearchList.map(s => ({
                value: s.santri_id,
                label: `${s.nama} (${s.nama_kelas})`,
                kelas_id: s.kelas_id,
                tingkat: s.tingkat
              }))}
              suffixIcon={<SearchOutlined />}
            />
          </div>
        )}

        {/* Tingkatan & Kelas Selector (Only in Detail Mode) */}
        {viewMode === 'detail' && (
          <>
            <div style={{ marginTop: 12 }}>
              {isMobile ? (
                <div style={{ display: 'flex', overflowX: 'auto', gap: 6, paddingBottom: 6 }}>
                  {tingkatOptions.map(opt => (
                    <Button
                      key={opt.value}
                      type={selectedTingkat === opt.value ? 'primary' : 'default'}
                      onClick={() => setSelectedTingkat(opt.value)}
                      size="small"
                      shape="round"
                      style={{ flexShrink: 0 }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  {tingkatOptions.map(opt => (
                    <Button
                      key={opt.value}
                      type={selectedTingkat === opt.value ? 'primary' : 'default'}
                      onClick={() => setSelectedTingkat(opt.value)}
                      size="middle"
                      shape="round"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6 }}>
              {filteredKelas.length > 0 ? (
                filteredKelas.map(k => (
                  <Button 
                    key={k.id} 
                    type={selectedKelas === k.id ? 'primary' : 'default'}
                    onClick={() => setSelectedKelas(k.id)}
                    shape="round"
                    size="small"
                  >
                    {k.nama}
                  </Button>
                ))
              ) : (
                <Empty description="Tidak ada kelas" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </>
        )}
      </Card>

      {/* Content Card */}
      {viewMode === 'detail' ? (
        selectedKelas && (
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} bodyStyle={{ padding: isMobile ? 12 : 16 }}>
            <div style={{ marginBottom: 12, textAlign: 'center' }}>
              <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>KELAS: {currentKelasObj?.nama} ({currentKategoriObj?.nama})</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Total: {summary.total} Santri</Text>
            </div>

            <Spin spinning={loading}>
              {data.length > 0 ? (
                isMobile ? renderMobileView() : (
                  <Table
                    dataSource={data}
                    columns={columns}
                    pagination={false}
                    bordered
                    size="middle"
                    rowKey="santri_id"
                    summary={() => (
                      <Table.Summary fixed>
                        <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                          <Table.Summary.Cell index={0} colSpan={3} align="right">Jumlah (Akumulasi)</Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="center">{summary.counts.Rodi}</Table.Summary.Cell>
                          <Table.Summary.Cell index={2} align="center">{summary.counts.Mutawassith}</Table.Summary.Cell>
                          <Table.Summary.Cell index={3} align="center">{summary.counts.Jayyid}</Table.Summary.Cell>
                          <Table.Summary.Cell index={4} align="center">{summary.counts.Mumtaz}</Table.Summary.Cell>
                          <Table.Summary.Cell index={5} align="center">{summary.counts.Lulus}</Table.Summary.Cell>
                          <Table.Summary.Cell index={6} align="center">{summary.counts.Tidak}</Table.Summary.Cell>
                        </Table.Summary.Row>
                        <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                          <Table.Summary.Cell index={0} colSpan={3} align="right">Persentase (%)</Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="center">{summary.percents.Rodi}</Table.Summary.Cell>
                          <Table.Summary.Cell index={2} align="center">{summary.percents.Mutawassith}</Table.Summary.Cell>
                          <Table.Summary.Cell index={3} align="center">{summary.percents.Jayyid}</Table.Summary.Cell>
                          <Table.Summary.Cell index={4} align="center">{summary.percents.Mumtaz}</Table.Summary.Cell>
                          <Table.Summary.Cell index={5} align="center">{summary.percents.Lulus}</Table.Summary.Cell>
                          <Table.Summary.Cell index={6} align="center">{summary.percents.Tidak}</Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                )
              ) : (
                <Empty description="Belum ada data nilai untuk kelas ini" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Spin>
          </Card>
        )
      ) : (
        /* Akumulasi View */
        <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} bodyStyle={{ padding: isMobile ? 12 : 16 }}>
          <div style={{ marginBottom: 12, textAlign: 'center' }}>
            <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>Akumulasi Nilai Seluruh Kelas</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>{currentKategoriObj?.nama}</Text>
          </div>

          <Spin spinning={loading}>
            {akumulasiData.length > 0 ? (
              isMobile ? renderMobileAkumulasi() : (
                <Table
                  dataSource={akumulasiData}
                  columns={akumulasiColumns}
                  pagination={false}
                  bordered
                  size="middle"
                  rowKey="kelas_id"
                  onRow={(record) => ({
                    style: {
                      background: record.kelas_id === selectedKelas ? '#e6f7ff' : undefined,
                      cursor: 'pointer'
                    },
                    onClick: () => setSelectedKelas(record.kelas_id)
                  })}
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                        <Table.Summary.Cell index={0} colSpan={2} align="right">Grand Total</Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="center">{grandTotal.totalSiswa}</Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="center"><Text type="danger">{grandTotal.counts.rodi}</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="center">{grandTotal.counts.mutawassith}</Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="center">{grandTotal.counts.jayyid}</Table.Summary.Cell>
                        <Table.Summary.Cell index={5} align="center">{grandTotal.counts.mumtaz}</Table.Summary.Cell>
                        <Table.Summary.Cell index={6} align="center"><Text type="primary">{grandTotal.counts.lulus}</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={7} align="center"><Text type="danger">{grandTotal.counts.tidak}</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={8} align="center"><Text type="danger">{grandTotal.counts.ghoib}</Text></Table.Summary.Cell>
                      </Table.Summary.Row>
                      <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                        <Table.Summary.Cell index={0} colSpan={2} align="right">Persentase (%)</Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="center">100%</Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="center"><Text type="danger">{grandTotal.percents.rodi}</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="center">{grandTotal.percents.mutawassith}</Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="center">{grandTotal.percents.jayyid}</Table.Summary.Cell>
                        <Table.Summary.Cell index={5} align="center">{grandTotal.percents.mumtaz}</Table.Summary.Cell>
                        <Table.Summary.Cell index={6} align="center"><Text type="primary">{grandTotal.percents.lulus}</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={7} align="center"><Text type="danger">{grandTotal.percents.tidak}</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={8} align="center"><Text type="danger">{grandTotal.percents.ghoib}</Text></Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              )
            ) : (
              <Empty description="Belum ada data akumulasi" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Spin>
        </Card>
      )}

      {/* CSS for Print Mode */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .ant-card:has(.ant-table) {
            visibility: visible !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .ant-card:has(.ant-table) * {
            visibility: visible !important;
          }
          .ant-segmented, .ant-space, .ant-btn, .ant-radio-group {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

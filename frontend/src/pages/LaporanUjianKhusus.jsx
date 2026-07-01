import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BookOpen, 
  Printer, 
  Share2, 
  CheckCircle, 
  XCircle, 
  Search, 
  BarChart2, 
  RotateCcw, 
  Download, 
  FileText, 
  Grid,
  Info,
  ChevronDown
} from 'lucide-react';
import { nilaiService } from '../services/nilaiService';
import { settingsService } from '../services/settingsService';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useResponsive } from '../hooks/useResponsive';
import { useLocation } from 'react-router-dom';
import { BottomNav } from '../components/layout/BottomNav';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './LaporanUjianKhusus.scss';

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
  const [activeTab, setActiveTab] = useState('muhafadzoh'); // 'muhafadzoh', 'qiroatul_kitab', 'taftisyul_kutub', 'ringkasan'
  const [viewMode, setViewMode] = useState('detail'); // 'detail' or 'akumulasi'
  
  // Search text states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { isMobile } = useResponsive();
  const location = useLocation();
  const listRef = useRef(null);
  const searchContainerRef = useRef(null);

  const isPublicRoute = location.pathname.startsWith('/pub/');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [taData, kelasData, mapelData, katData, systemSettings] = await Promise.all([
          nilaiService.fetchTahunAjaran(),
          nilaiService.fetchKelas(),
          nilaiService.fetchMataPelajaran(),
          nilaiService.fetchKategori(),
          settingsService.fetchSettings().catch(() => ({}))
        ]);

        setTahunAjaranList(Array.isArray(taData) ? taData : []);

        const activeTA = Array.isArray(taData) ? taData.find(ta => ta.is_active) : null;
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

        let initialKategoriId = null;
        if (Array.isArray(katData)) {
          if (kategoriIdParam) {
            initialKategoriId = Number(kategoriIdParam);
            setSelectedKategori(initialKategoriId);
          } else {
            const activeSemester = systemSettings.active_semester || 'Ganjil';
            const defaultKat = katData.find(k => k.nama?.toLowerCase().includes(activeSemester.toLowerCase()));
            if (defaultKat) {
              initialKategoriId = defaultKat.id;
              setSelectedKategori(initialKategoriId);
            } else if (katData.length > 0) {
              initialKategoriId = katData[0].id;
              setSelectedKategori(initialKategoriId);
            }
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
          const searchRes = await nilaiService.fetchSantriReport(activeTA.id, initialKategoriId);
          setSantriSearchList(Array.isArray(searchRes) ? searchRes : []);
        }
      } catch (err) {
        console.error('Gagal memuat data awal:', err);
      } finally {
        setLoading(false);
      }
    };
    init();

    // Click outside search container listener
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const getCurrentMapel = () => {
    if (activeTab === 'muhafadzoh') return mapelAkbar;
    if (activeTab === 'qiroatul_kitab') return mapelQiroah;
    if (activeTab === 'taftisyul_kutub') return mapelTaftisy;
    return null;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!selectedKelas || !tahunAjaran || !selectedKategori || viewMode !== 'detail') return;

      if (activeTab === 'ringkasan') {
        if (!mapelAkbar || !mapelQiroah || !mapelTaftisy) return;
        setLoading(true);
        try {
          const [resAkbar, resQiroah, resTaftisy] = await Promise.all([
            nilaiService.fetchNilaiSantri({
              tahun_ajaran_id: tahunAjaran.id,
              kelas_id: selectedKelas,
              mapel_id: mapelAkbar.id,
              kategori_id: selectedKategori
            }),
            nilaiService.fetchNilaiSantri({
              tahun_ajaran_id: tahunAjaran.id,
              kelas_id: selectedKelas,
              mapel_id: mapelQiroah.id,
              kategori_id: selectedKategori
            }),
            nilaiService.fetchNilaiSantri({
              tahun_ajaran_id: tahunAjaran.id,
              kelas_id: selectedKelas,
              mapel_id: mapelTaftisy.id,
              kategori_id: selectedKategori
            })
          ]);
          
          const merged = {};
          const processRes = (resArray, mapelKey) => {
            if (Array.isArray(resArray)) {
              resArray.forEach(r => {
                if (!merged[r.santri_id]) {
                  merged[r.santri_id] = { santri_id: r.santri_id, nama: r.nama, nis: r.nis };
                }
                merged[r.santri_id][mapelKey] = r;
              });
            }
          };
          processRes(resAkbar, 'akbar');
          processRes(resQiroah, 'qiroah');
          processRes(resTaftisy, 'taftisy');
          
          setData(Object.values(merged).sort((a, b) => a.nama.localeCompare(b.nama)));
        } catch (err) {
          console.error('Gagal memuat laporan ringkasan:', err);
          setData([]);
        } finally {
          setLoading(false);
        }
      } else {
        const currentMapel = getCurrentMapel();
        if (!currentMapel) return;
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
          const searchRes = await nilaiService.fetchSantriReport(tahunAjaran.id, selectedKategori);
          setSantriSearchList(searchRes || []);
        } catch (err) {}
      }
    };
    refetchSearch();
  }, [tahunAjaran, selectedKategori]);

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
    if (activeTab === 'ringkasan') {
      return { total: data.length, counts: {}, percents: {} };
    }
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
        Tam: data.filter(r => r.predikat === "Tam" || r.capaian === "Tam").length,
        Naqish: data.filter(r => r.predikat === "Naqish" || r.capaian === "Naqish").length,
        Lulus: data.filter(r => r.predikat === "Tam" || r.capaian === "Tam").length,
        Tidak: data.filter(r => r.predikat === "Naqish" || r.capaian === "Naqish").length,
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
    if (activeTab === 'ringkasan') {
      return { totalSiswa: 0, counts: {}, percents: {} };
    }
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
      const ratedSiswaTotal = akumulasiData.reduce((acc, curr) => acc + (Number(curr.jumlah_siswa || 0) - Number(curr.ghoib || 0)), 0);
      const totalWeight = akumulasiData.reduce((acc, curr) => acc + (Number(curr.rata_rata || 0) * (Number(curr.jumlah_siswa || 0) - Number(curr.ghoib || 0))), 0);
      const weightedAverage = ratedSiswaTotal > 0 ? (totalWeight / ratedSiswaTotal).toFixed(2) : 0;

      counts = {
        rata_rata: weightedAverage,
        ghoib: akumulasiData.reduce((acc, curr) => acc + Number(curr.ghoib), 0),
      };
    }
    return {
      totalSiswa,
      counts,
      percents: Object.fromEntries(
        Object.entries(counts)
          .filter(([k]) => k !== 'rata_rata')
          .map(([k, v]) => [k, totalSiswa > 0 ? `${Math.round((v / totalSiswa) * 100)}%` : '0%'])
      )
    };
  }, [akumulasiData, activeTab]);

  const getPredikatClass = (pred) => {
    if (!pred) return 'empty';
    const cleanPred = pred.toLowerCase().replace("'", "");
    return cleanPred;
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

  const handleSearchSelect = (s) => {
    if (s.tingkat !== undefined) {
      setSelectedTingkat(s.tingkat);
    }
    if (s.kelas_id) {
      setSelectedKelas(s.kelas_id);
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const getPageTitle = () => {
    if (activeTab === 'muhafadzoh') return 'LAPORAN MUHAFADZOH KUBRO';
    if (activeTab === 'qiroatul_kitab') return 'LAPORAN QIROATUL KITAB';
    if (activeTab === 'taftisyul_kutub') return 'LAPORAN TAFTISYUL KUTUB';
    return 'LAPORAN';
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
        Tam: classData.filter(r => r.predikat === "Tam" || r.capaian === "Tam").length,
        Naqish: classData.filter(r => r.predikat === "Naqish" || r.capaian === "Naqish").length,
        Lulus: classData.filter(r => r.predikat === "Tam" || r.capaian === "Tam").length,
        Tidak: classData.filter(r => r.predikat === "Naqish" || r.capaian === "Naqish").length,
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
          const isLulusTaftisy = r.predikat === "Tam" || r.capaian === "Tam";
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
            if (colIndex === 3 && (r.predikat === "Naqish" || r.capaian === "Naqish")) { shouldDrawCheck = true; isRed = true; }
            else if (colIndex === 4 && (r.predikat === "Tam" || r.capaian === "Tam")) { shouldDrawCheck = true; }
            else if (colIndex === 5 && isLulusTaftisy) { shouldDrawCheck = true; }
            else if (colIndex === 6 && (r.predikat === "Naqish" || r.capaian === "Naqish")) { shouldDrawCheck = true; isRed = true; }
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

  const exportRingkasanToPDF = async () => {
    setLoading(true);
    try {
      const doc = jsPDF({ orientation: 'portrait', unit: 'mm', format: [215.9, 330.2] });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RINGKASAN HASIL UJIAN KHUSUS', 107.9, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`KELAS: ${currentKelasObj?.nama || '-'}`, 107.9, 22, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${tahunAjaran?.kode || '-'} | ${currentKategoriObj?.nama || '-'}`, 107.9, 28, { align: 'center' });

      const headers = ['No', 'Nama Santri', 'Hasil Muhafazdoh', 'Hasil Qiroatul Kitab', 'Hasil Taftisyul Kutub'];
      
      const body = data.map((r, idx) => [
        idx + 1,
        r.nama,
        r.akbar?.predikat || '-',
        r.qiroah?.nilai_angka !== null && r.qiroah?.nilai_angka !== undefined ? Number(r.qiroah.nilai_angka).toString() : (r.qiroah?.capaian || '-'),
        r.taftisy?.predikat || r.taftisy?.capaian || '-'
      ]);

      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2, halign: 'center', valign: 'middle' },
        headStyles: { fillColor: [26, 54, 93], textColor: 255, fontStyle: 'bold', lineWidth: 0.2, lineColor: [255, 255, 255] },
        columnStyles: {
          0: { width: 12 },
          1: { width: 65, halign: 'left' },
          2: { width: 40 },
          3: { width: 40 },
          4: { width: 40 }
        },
        margin: { left: 15, right: 15 },
        didDrawPage: (d) => {
          doc.setFontSize(8);
          doc.text(`Halaman ${d.pageNumber}`, 107.9, 320, { align: 'center' });
        }
      });

      doc.save(`Ringkasan_Hasil_Ujian_Khusus_${currentKelasObj?.nama || 'Kelas'}_${tahunAjaran?.kode || 'TA'}.pdf`);
    } catch (error) {
      console.error('Error saat ekspor PDF Ringkasan:', error);
      alert('Terjadi kesalahan saat membuat PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportLaporanToPDF = async () => {
    if (activeTab === 'ringkasan') {
      await exportRingkasanToPDF();
      return;
    }
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

  const exportToExcel = () => {
    if (activeTab !== 'ringkasan' || data.length === 0) return;
    const exportData = data.map((r, idx) => ({
      'No': idx + 1,
      'Nama Santri': r.nama,
      'Hasil Muhafazdoh': r.akbar?.predikat || '-',
      'Hasil Qiroatul Kitab': r.qiroah?.nilai_angka !== null && r.qiroah?.nilai_angka !== undefined ? Number(r.qiroah.nilai_angka).toString() : (r.qiroah?.capaian || '-'),
      'Hasil Taftisyul Kutub': r.taftisy?.predikat || r.taftisy?.capaian || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ringkasan");
    XLSX.writeFile(wb, `Ringkasan_Hasil_Ujian_Khusus_${currentKelasObj?.nama || 'Kelas'}_${tahunAjaran?.kode || 'TA'}.xlsx`);
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

  // Local filtered search results for autocomplete search input
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return santriSearchList.filter(s => 
      s.nama.toLowerCase().includes(query) ||
      (s.nis && s.nis.toLowerCase().includes(query))
    );
  }, [searchQuery, santriSearchList]);

  return (
    <div className="laporan-page-container">
      <PageHeader 
        title="📊 Laporan Hasil Ujian Khusus"
        subtitle="Laporan kumulatif hasil evaluasi ujian Muhafadzoh, Qiroah, dan Taftisy"
        extra={[
          <div key="filters" className="header-actions-row" style={{ width: '100%' }}>
            <div className="left-filters">
              <div style={{ width: '150px' }}>
                <CustomSelect
                  value={tahunAjaran?.id ? String(tahunAjaran.id) : ''}
                  onChange={(val) => {
                    const selected = tahunAjaranList.find(t => t.id === Number(val));
                    setTahunAjaran(selected || null);
                  }}
                  options={tahunAjaranList.map(t => ({ value: String(t.id), label: t.kode }))}
                  placeholder="Tahun Ajaran"
                />
              </div>
              <div style={{ width: '150px' }}>
                <CustomSelect
                  value={selectedKategori ? String(selectedKategori) : ''}
                  onChange={(val) => setSelectedKategori(val ? Number(val) : null)}
                  options={kategori.map(k => ({ value: String(k.id), label: k.nama }))}
                  placeholder="Semester"
                />
              </div>
            </div>

            <div className="right-buttons">
              {activeTab !== 'ringkasan' && (
                <button 
                  type="button" 
                  className={`btn-custom ${viewMode === 'akumulasi' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setViewMode(viewMode === 'detail' ? 'akumulasi' : 'detail')}
                >
                  {viewMode === 'detail' ? <BarChart2 size={16} /> : <RotateCcw size={16} />}
                  <span>{viewMode === 'detail' ? 'Lihat Akumulasi' : 'Kembali ke Detail'}</span>
                </button>
              )}

              {!isMobile && (
                <>
                  {activeTab !== 'ringkasan' && (
                    <button type="button" className="btn-custom btn-secondary" onClick={() => window.print()}>
                      <Printer size={16} />
                      <span>Cetak</span>
                    </button>
                  )}
                  {viewMode === 'detail' && activeTab !== 'ringkasan' && (
                    <>
                      <button type="button" className="btn-custom btn-secondary" onClick={handleShare}>
                        <Share2 size={16} />
                        <span>Bagikan</span>
                      </button>
                      <button type="button" className="btn-custom btn-primary" onClick={exportLaporanToPDF} disabled={loading}>
                        <FileText size={16} />
                        <span>Ekspor PDF</span>
                      </button>
                    </>
                  )}
                  {viewMode === 'akumulasi' && activeTab !== 'ringkasan' && (
                    <button type="button" className="btn-custom btn-primary" onClick={exportAllToPDF} disabled={loading}>
                      <Download size={16} />
                      <span>Ekspor Semua Kelas (PDF)</span>
                    </button>
                  )}
                  {activeTab === 'ringkasan' && (
                    <>
                      <button type="button" className="btn-custom btn-primary" onClick={exportLaporanToPDF} disabled={loading}>
                        <FileText size={16} />
                        <span>Ekspor PDF</span>
                      </button>
                      <button type="button" className="btn-custom btn-secondary" onClick={exportToExcel} disabled={loading} style={{ background: '#10b981', color: '#ffffff', borderColor: '#10b981' }}>
                        <Grid size={16} />
                        <span>Ekspor Excel</span>
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ]}
      />

      <div className="laporan-frosted-card">
        
        {/* Custom tabs row navigation */}
        <div className="custom-tabs-nav">
          <button
            type="button"
            className={`custom-tabs-tab ${activeTab === 'muhafadzoh' ? 'active' : ''}`}
            onClick={() => { setActiveTab('muhafadzoh'); setViewMode('detail'); }}
          >
            <span>Muhafadzoh Akbar</span>
          </button>
          <button
            type="button"
            className={`custom-tabs-tab ${activeTab === 'qiroatul_kitab' ? 'active' : ''}`}
            onClick={() => { setActiveTab('qiroatul_kitab'); setViewMode('detail'); }}
          >
            <span>Qiroatul Kitab</span>
          </button>
          <button
            type="button"
            className={`custom-tabs-tab ${activeTab === 'taftisyul_kutub' ? 'active' : ''}`}
            onClick={() => { setActiveTab('taftisyul_kutub'); setViewMode('detail'); }}
          >
            <span>Taftisyul Kutub</span>
          </button>
          <button
            type="button"
            className={`custom-tabs-tab ${activeTab === 'ringkasan' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ringkasan'); setViewMode('detail'); }}
          >
            <span>Ringkasan Hasil</span>
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
            <div className="rapor-loading-spinner" style={{ minHeight: 'unset' }}><div className="spinner"></div></div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Memuat data laporan...</span>
          </div>
        ) : (
          <>
            {viewMode === 'detail' ? (
              <>
                <div className="inner-filter-bar">
                  
                  {/* Levels toggles */}
                  <div className="segmented-pills-row">
                    {tingkatOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`pill-btn ${selectedTingkat === opt.value ? 'active' : ''}`}
                        onClick={() => setSelectedTingkat(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Autocomplete Search input */}
                  <div className="student-search-box" ref={searchContainerRef}>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        className="settings-text-input" 
                        placeholder="Cari nama santri..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSearchResults(true);
                        }}
                        onFocus={() => setShowSearchResults(true)}
                        style={{ paddingLeft: '34px', fontSize: '12.5px' }}
                      />
                      <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    </div>

                    {showSearchResults && searchResults.length > 0 && (
                      <div className="custom-select-portal-dropdown" style={{ 
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        right: 0, 
                        zIndex: 9999,
                        background: '#ffffff',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                        maxHeight: '240px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}>
                        {searchResults.map(s => (
                          <div 
                            key={s.santri_id}
                            className="dropdown-item-custom"
                            onClick={() => handleSearchSelect(s)}
                            style={{ 
                              padding: '10px 14px', 
                              cursor: 'pointer', 
                              fontSize: '12.5px',
                              borderBottom: '1px solid rgba(226,232,240,0.4)',
                              color: '#334155'
                            }}
                          >
                            <span style={{ fontWeight: 700 }}>{s.nama}</span>
                            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>— {s.nama_kelas}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Class selector row */}
                <div className="class-selection-row">
                  {filteredKelas.map(k => (
                    <button
                      key={k.id}
                      type="button"
                      className={`class-pill-btn ${selectedKelas === k.id ? 'active' : ''}`}
                      onClick={() => setSelectedKelas(k.id)}
                    >
                      {k.nama}
                    </button>
                  ))}
                </div>

                {/* HTML Table Detail View */}
                <div className="table-responsive-laporan">
                  <table className="custom-data-table">
                    <thead>
                      {activeTab === 'muhafadzoh' && (
                        <>
                          <tr>
                            <th rowSpan={2} style={{ width: '50px', textAlign: 'center' }}>No</th>
                            <th rowSpan={2}>Nama Santri</th>
                            <th rowSpan={2} style={{ width: '100px', textAlign: 'center' }}>Nilai</th>
                            <th colSpan={4} className="main-span-header">Predikat</th>
                            <th colSpan={2} className="main-span-header">Kelulusan</th>
                            <th rowSpan={2} style={{ width: '80px', textAlign: 'center' }}>Ghoib</th>
                          </tr>
                          <tr>
                            <th className="sub-header-th">Rodi'</th>
                            <th className="sub-header-th">Mutawasith</th>
                            <th className="sub-header-th">Jayyid</th>
                            <th className="sub-header-th">Mumtaz</th>
                            <th className="sub-header-th">Lulus</th>
                            <th className="sub-header-th">Tidak</th>
                          </tr>
                        </>
                      )}

                      {activeTab === 'taftisyul_kutub' && (
                        <>
                          <tr>
                            <th rowSpan={2} style={{ width: '50px', textAlign: 'center' }}>No</th>
                            <th rowSpan={2}>Nama Santri</th>
                            <th rowSpan={2} style={{ width: '100px', textAlign: 'center' }}>Nilai</th>
                            <th colSpan={2} className="main-span-header">Hasil</th>
                            <th colSpan={2} className="main-span-header">Kelulusan</th>
                            <th rowSpan={2} style={{ width: '80px', textAlign: 'center' }}>Ghoib</th>
                          </tr>
                          <tr>
                            <th className="sub-header-th">Naqish</th>
                            <th className="sub-header-th">Tam</th>
                            <th className="sub-header-th">Lulus</th>
                            <th className="sub-header-th">Tidak</th>
                          </tr>
                        </>
                      )}

                      {activeTab === 'qiroatul_kitab' && (
                        <tr>
                          <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                          <th>Nama Santri</th>
                          <th style={{ width: '120px', textAlign: 'center' }}>Nilai</th>
                          <th style={{ width: '100px', textAlign: 'center' }}>Ghoib</th>
                        </tr>
                      )}

                      {activeTab === 'ringkasan' && (
                        <tr>
                          <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                          <th>Nama Santri</th>
                          <th style={{ textAlign: 'center' }}>Hasil Muhafadzoh</th>
                          <th style={{ textAlign: 'center' }}>Hasil Qiroatul Kitab</th>
                          <th style={{ textAlign: 'center' }}>Hasil Taftisyul Kutub</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {data.map((record, idx) => {
                        const isGhoib = record.nilai_angka === null && !record.capaian;
                        
                        if (activeTab === 'ringkasan') {
                          return (
                            <tr key={record.santri_id}>
                              <td className="center-text">{idx + 1}</td>
                              <td className="student-name-cell">{record.nama}</td>
                              <td className="center-text">
                                <span className={`predikat-badge ${getPredClass(record.akbar?.predikat)}`}>
                                  {record.akbar?.predikat || '-'}
                                </span>
                              </td>
                              <td className="center-text" style={{ fontWeight: 'bold' }}>
                                {record.qiroah?.nilai_angka !== null && record.qiroah?.nilai_angka !== undefined 
                                  ? Number(record.qiroah.nilai_angka).toString() 
                                  : (record.qiroah?.capaian || '-')}
                              </td>
                              <td className="center-text">
                                <span className={`predikat-badge ${getPredClass(record.taftisy?.predikat || record.taftisy?.capaian)}`}>
                                  {record.taftisy?.predikat || record.taftisy?.capaian || '-'}
                                </span>
                              </td>
                            </tr>
                          );
                        }

                        if (activeTab === 'muhafadzoh') {
                          const isLulus = ["Mutawassith", "Jayyid", "Mumtaz"].includes(record.predikat);
                          return (
                            <tr key={record.santri_id}>
                              <td className="center-text">{idx + 1}</td>
                              <td className="student-name-cell">{record.nama}</td>
                              <td className="center-text" style={{ fontWeight: 'bold' }}>
                                {record.nilai_angka !== null ? Number(record.nilai_angka).toString() : (record.capaian || '-')}
                              </td>
                              {/* Predikats */}
                              <td className="center-text">{record.predikat === "Rodi'" && <span className="tidak-cross">✓</span>}</td>
                              <td className="center-text">{record.predikat === "Mutawassith" && <span style={{ color: '#eab308' }}>✓</span>}</td>
                              <td className="center-text">{record.predikat === "Jayyid" && <span className="lulus-check">✓</span>}</td>
                              <td className="center-text">{record.predikat === "Mumtaz" && <span className="lulus-check" style={{ color: '#10b981' }}>✓</span>}</td>
                              {/* Kelulusan */}
                              <td className="center-text">{isLulus && <CheckCircle size={16} className="lulus-check" />}</td>
                              <td className="center-text">{record.predikat === "Rodi'" && <XCircle size={16} className="tidak-cross" />}</td>
                              {/* Ghoib */}
                              <td className="center-text">{isGhoib && <XCircle size={16} className="tidak-cross" />}</td>
                            </tr>
                          );
                        }

                        if (activeTab === 'taftisyul_kutub') {
                          const isLulus = record.predikat === "Tam" || record.capaian === "Tam";
                          return (
                            <tr key={record.santri_id}>
                              <td className="center-text">{idx + 1}</td>
                              <td className="student-name-cell">{record.nama}</td>
                              <td className="center-text" style={{ fontWeight: 'bold' }}>
                                {record.nilai_angka !== null ? Number(record.nilai_angka).toString() : (record.capaian || '-')}
                              </td>
                              {/* Hasil */}
                              <td className="center-text">{(record.predikat === "Naqish" || record.capaian === "Naqish") && <span className="tidak-cross">✓</span>}</td>
                              <td className="center-text">{(record.predikat === "Tam" || record.capaian === "Tam") && <span className="lulus-check">✓</span>}</td>
                              {/* Kelulusan */}
                              <td className="center-text">{isLulus && <CheckCircle size={16} className="lulus-check" />}</td>
                              <td className="center-text">{(record.predikat === "Naqish" || record.capaian === "Naqish") && <XCircle size={16} className="tidak-cross" />}</td>
                              {/* Ghoib */}
                              <td className="center-text">{isGhoib && <XCircle size={16} className="tidak-cross" />}</td>
                            </tr>
                          );
                        }

                        // Qiroatul Kitab default view
                        return (
                          <tr key={record.santri_id}>
                            <td className="center-text">{idx + 1}</td>
                            <td className="student-name-cell">{record.nama}</td>
                            <td className="center-text" style={{ fontWeight: 'bold' }}>
                              {record.nilai_angka !== null ? Number(record.nilai_angka).toString() : (record.capaian || '-')}
                            </td>
                            <td className="center-text">{isGhoib && <XCircle size={16} className="tidak-cross" />}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Class summary widgets footer */}
                {activeTab !== 'ringkasan' && (
                  <div className="ringkasan-summary-grid">
                    {activeTab === 'muhafadzoh' && (
                      <>
                        <div className="summary-widget">
                          <span className="widget-title">Rodi'</span>
                          <span className="widget-val">{summary.counts.Rodi || 0}</span>
                        </div>
                        <div className="summary-widget">
                          <span className="widget-title">Mutawassith</span>
                          <span className="widget-val">{summary.counts.Mutawassith || 0}</span>
                        </div>
                        <div className="summary-widget">
                          <span className="widget-title">Jayyid</span>
                          <span className="widget-val">{summary.counts.Jayyid || 0}</span>
                        </div>
                        <div className="summary-widget">
                          <span className="widget-title">Mumtaz</span>
                          <span className="widget-val">{summary.counts.Mumtaz || 0}</span>
                        </div>
                      </>
                    )}
                    {activeTab === 'taftisyul_kutub' && (
                      <>
                        <div className="summary-widget">
                          <span className="widget-title">Tam</span>
                          <span className="widget-val">{summary.counts.Tam || 0}</span>
                        </div>
                        <div className="summary-widget">
                          <span className="widget-title">Naqish</span>
                          <span className="widget-val">{summary.counts.Naqish || 0}</span>
                        </div>
                      </>
                    )}
                    {activeTab === 'qiroatul_kitab' && (
                      <>
                        <div className="summary-widget">
                          <span className="widget-title">Dinilai</span>
                          <span className="widget-val">{summary.counts.Rated || 0}</span>
                        </div>
                        <div className="summary-widget">
                          <span className="widget-title">Rerata Kelas</span>
                          <span className="widget-val" style={{ color: '#4f46e5' }}>{summary.counts.Rata || 0}</span>
                        </div>
                      </>
                    )}
                    <div className="summary-widget">
                      <span className="widget-title">Lulus</span>
                      <span className="widget-val" style={{ color: '#10b981' }}>{summary.counts.Lulus ?? (summary.total - (summary.counts.Ghoib || 0))}</span>
                    </div>
                    <div className="summary-widget">
                      <span className="widget-title">Ghoib / Kosong</span>
                      <span className="widget-val" style={{ color: '#ef4444' }}>{summary.counts.Ghoib || 0}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Akumulasi View */
              <div className="table-responsive-laporan">
                <table className="custom-data-table">
                  <thead>
                    {activeTab === 'muhafadzoh' && (
                      <>
                        <tr>
                          <th rowSpan={2} style={{ width: '50px', textAlign: 'center' }}>No</th>
                          <th rowSpan={2}>Kelas-Kelas</th>
                          <th rowSpan={2} style={{ width: '110px', textAlign: 'center' }}>Jumlah Siswa</th>
                          <th colSpan={4} className="main-span-header">Predikat</th>
                          <th colSpan={2} className="main-span-header">Kelulusan</th>
                          <th rowSpan={2} style={{ width: '90px', textAlign: 'center' }}>Ghoib</th>
                        </tr>
                        <tr>
                          <th className="sub-header-th">Rodi'</th>
                          <th className="sub-header-th">Mutawasith</th>
                          <th className="sub-header-th">Jayyid</th>
                          <th className="sub-header-th">Mumtaz</th>
                          <th className="sub-header-th">Lulus</th>
                          <th className="sub-header-th">Tidak</th>
                        </tr>
                      </>
                    )}

                    {activeTab === 'taftisyul_kutub' && (
                      <>
                        <tr>
                          <th rowSpan={2} style={{ width: '50px', textAlign: 'center' }}>No</th>
                          <th rowSpan={2}>Kelas-Kelas</th>
                          <th rowSpan={2} style={{ width: '110px', textAlign: 'center' }}>Jumlah Siswa</th>
                          <th colSpan={2} className="main-span-header">Hasil</th>
                          <th colSpan={2} className="main-span-header">Kelulusan</th>
                          <th rowSpan={2} style={{ width: '90px', textAlign: 'center' }}>Ghoib</th>
                        </tr>
                        <tr>
                          <th className="sub-header-th">Naqish</th>
                          <th className="sub-header-th">Tam</th>
                          <th className="sub-header-th">Lulus</th>
                          <th className="sub-header-th">Tidak</th>
                        </tr>
                      </>
                    )}

                    {activeTab !== 'muhafadzoh' && activeTab !== 'taftisyul_kutub' && (
                      <tr>
                        <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                        <th>Kelas-Kelas</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Jumlah Siswa</th>
                        <th style={{ width: '140px', textAlign: 'center' }}>Rerata Ujian</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Ghoib</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {akumulasiData.map((row, idx) => {
                      const total = Number(row.jumlah_siswa);
                      const getPercentSpan = (val) => {
                        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700 }}>{val}</span>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>{pct}%</span>
                          </div>
                        );
                      };

                      if (activeTab === 'muhafadzoh') {
                        return (
                          <tr key={row.kelas_id}>
                            <td className="center-text">{idx + 1}</td>
                            <td className="student-name-cell">{row.nama_kelas}</td>
                            <td className="center-text" style={{ fontWeight: 'bold' }}>{row.jumlah_siswa}</td>
                            <td className="center-text">{getPercentSpan(row.rodi || 0)}</td>
                            <td className="center-text">{getPercentSpan(row.mutawassith || 0)}</td>
                            <td className="center-text">{getPercentSpan(row.jayyid || 0)}</td>
                            <td className="center-text">{getPercentSpan(row.mumtaz || 0)}</td>
                            <td className="center-text">{getPercentSpan(row.lulus || 0)}</td>
                            <td className="center-text">{getPercentSpan(row.tidak || 0)}</td>
                            <td className="center-text">{getPercentSpan(row.ghoib || 0)}</td>
                          </tr>
                        );
                      }

                      if (activeTab === 'taftisyul_kutub') {
                        return (
                          <tr key={row.kelas_id}>
                            <td className="center-text">{idx + 1}</td>
                            <td className="student-name-cell">{row.nama_kelas}</td>
                            <td className="center-text" style={{ fontWeight: 'bold' }}>{row.jumlah_siswa}</td>
                            <td className="center-text">{getPercentSpan(row.naqish || 0)}</td>
                            <td className="center-text">{getPercentSpan(row.tam || 0)}</td>
                            <td className="center-text">{getPercentSpan(row.lulus || 0)}</td>
                            <td className="center-text">{getPercentSpan(row.tidak || 0)}</td>
                            <td className="center-text">{getPercentSpan(row.ghoib || 0)}</td>
                          </tr>
                        );
                      }

                      // Qiroatul kitab default view
                      return (
                        <tr key={row.kelas_id}>
                          <td className="center-text">{idx + 1}</td>
                          <td className="student-name-cell">{row.nama_kelas}</td>
                          <td className="center-text" style={{ fontWeight: 'bold' }}>{row.jumlah_siswa}</td>
                          <td className="center-text" style={{ fontWeight: 'bold', color: '#4f46e5' }}>{row.rata_rata || '0'}</td>
                          <td className="center-text">{getPercentSpan(row.ghoib || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      </div>

      {/* Floating Action Button Column for mobile */}
      {isMobile && (
        <div className="mobile-fab-column">
          {viewMode === 'detail' ? (
            <>
              {activeTab !== 'ringkasan' && (
                <button type="button" className="fab-btn" onClick={handleShare}>
                  <Share2 size={18} />
                </button>
              )}
              <button type="button" className="fab-btn" onClick={exportLaporanToPDF} disabled={loading}>
                <FileText size={18} />
              </button>
              {activeTab === 'ringkasan' && (
                <button type="button" className="fab-btn excel" onClick={exportToExcel} disabled={loading}>
                  <Grid size={18} />
                </button>
              )}
            </>
          ) : (
            <button type="button" className="fab-btn" onClick={exportAllToPDF} disabled={loading}>
              <Download size={18} />
            </button>
          )}
        </div>
      )}

      {isMobile && isPublicRoute && <BottomNav />}
    </div>
  );
};

// Helper: map predicate name to css suffix
function getPredClass(pred) {
  if (!pred) return 'empty';
  return pred.toLowerCase().replace("'", "");
}

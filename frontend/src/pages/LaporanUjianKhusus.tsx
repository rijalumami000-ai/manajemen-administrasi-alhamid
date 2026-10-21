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
  ChevronDown, 
  Layers 
} from 'lucide-react';
import { nilaiService } from '../services/nilaiService';
import { settingsService } from '../services/settingsService';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useResponsive } from '../hooks/useResponsive';
import { useLocation } from 'react-router-dom';
import { BottomNav } from '../components/layout/BottomNav';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { 
  TahunAjaranItem, 
  KelasItem, 
  KategoriItem, 
  MataPelajaranItem, 
  SantriNilaiRow, 
  AkumulasiKelasItem, 
  TingkatOption, 
  UjianKhususTab, 
  ViewMode 
} from '../types/laporanUjianKhusus';
import './LaporanUjianKhusus.scss';

export const LaporanUjianKhusus = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [kelas, setKelas] = useState<KelasItem[]>([]);
  const [kategori, setKategori] = useState<KategoriItem[]>([]);
  const [selectedTingkat, setSelectedTingkat] = useState<number>(0);
  const [selectedKelas, setSelectedKelas] = useState<number | null>(null);
  const [selectedKategori, setSelectedKategori] = useState<number | null>(null);
  const [data, setData] = useState<SantriNilaiRow[]>([]);
  const [akumulasiData, setAkumulasiData] = useState<any[]>([]);
  const [santriSearchList, setSantriSearchList] = useState<any[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranItem[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaranItem | null>(null);
  const [mapelAkbar, setMapelAkbar] = useState<MataPelajaranItem | null>(null);
  const [mapelQiroah, setMapelQiroah] = useState<MataPelajaranItem | null>(null);
  const [mapelTaftisy, setMapelTaftisy] = useState<MataPelajaranItem | null>(null);
  const [activeTab, setActiveTab] = useState<UjianKhususTab>('muhafadzoh');
  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  
  // Search text states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  const { isMobile } = useResponsive();
  const location = useLocation();
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
          settingsService.fetchSettings().catch(() => ({} as any))
        ]);

        setTahunAjaranList(Array.isArray(taData) ? taData : []);

        const activeTA = Array.isArray(taData) ? taData.find((ta: any) => ta.is_active) : null;
        setTahunAjaran(activeTA);

        const diniyahKelas: KelasItem[] = Array.isArray(kelasData) ? kelasData.filter((k: any) => k.jenis === 'Diniyah').map((k: any) => {
          if (k.nama === 'SP' && k.tingkat === 1) return { ...k, tingkat: 1.5 };
          return k;
        }).sort((a: any, b: any) => {
          if (a.tingkat !== b.tingkat) return a.tingkat - b.tingkat;
          return a.nama.localeCompare(b.nama);
        }) : [];
        setKelas(diniyahKelas);
        
        setKategori(Array.isArray(katData) ? katData : []);

        const akbar = Array.isArray(mapelData) ? mapelData.find((m: any) => m.nama?.includes('Muhafadzoh Akbar')) : null;
        const qiroah = Array.isArray(mapelData) ? mapelData.find((m: any) => m.nama?.includes('Qiroatul Kitab')) : null;
        const taftisy = Array.isArray(mapelData) ? mapelData.find((m: any) => m.nama?.includes('Taftisyul Kutub')) : null;
        setMapelAkbar(akbar);
        setMapelQiroah(qiroah);
        setMapelTaftisy(taftisy);

        const params = new URLSearchParams(window.location.search);
        const kelasIdParam = params.get('kelas_id');
        const kategoriIdParam = params.get('kategori_id');

        let initialKategoriId: number | null = null;
        if (Array.isArray(katData)) {
          if (kategoriIdParam) {
            initialKategoriId = Number(kategoriIdParam);
            setSelectedKategori(initialKategoriId);
          } else {
            const activeSemester = systemSettings?.active_semester || 'Ganjil';
            const defaultKat = katData.find((k: any) => k.nama?.toLowerCase().includes(activeSemester.toLowerCase()));
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

        if (activeTA && initialKategoriId) {
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
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
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
          
          const merged: Record<number, SantriNilaiRow> = {};
          const processRes = (resArray: any[], mapelKey: 'akbar' | 'qiroah' | 'taftisy') => {
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

  // Reload kelas when tahunAjaran changes
  useEffect(() => {
    if (tahunAjaran?.id) {
      nilaiService.fetchKelas(tahunAjaran.id).then((kelasData: any) => {
        const diniyahKelas: KelasItem[] = Array.isArray(kelasData) ? kelasData.filter((k: any) => k.jenis === 'Diniyah').map((k: any) => {
          if (k.nama === 'SP' && k.tingkat === 1) return { ...k, tingkat: 1.5 };
          return k;
        }).sort((a: any, b: any) => {
          if (a.tingkat !== b.tingkat) return a.tingkat - b.tingkat;
          return a.nama.localeCompare(b.nama);
        }) : [];
        setKelas(diniyahKelas);
      }).catch((err: any) => {
        console.error('Gagal memuat kelas per tahun ajaran di LaporanUjianKhusus:', err);
      });
    }
  }, [tahunAjaran?.id]);

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
  }, [filteredKelas, selectedTingkat, selectedKelas]);

  const currentKategoriObj = useMemo(() => kategori.find(k => k.id === selectedKategori), [kategori, selectedKategori]);
  const currentKelasObj = useMemo(() => kelas.find(k => k.id === selectedKelas), [kelas, selectedKelas]);

  const summary = useMemo(() => {
    let counts: Record<string, number | string> = {};
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
        Lulus: data.filter(r => ["Mutawassith", "Jayyid", "Mumtaz"].includes(r.predikat || '')).length,
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
        Object.entries(counts).map(([k, v]) => [k, total > 0 ? `${Math.round((Number(v) / total) * 100)}%` : '0%'])
      )
    };
  }, [data, activeTab]);

  const grandTotal = useMemo(() => {
    let counts: Record<string, number | string> = {};
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
        tam: akumulasiData.reduce((acc, curr) => acc + Number(curr.tam || 0), 0),
        naqish: akumulasiData.reduce((acc, curr) => acc + Number(curr.naqish || 0), 0),
        lulus: akumulasiData.reduce((acc, curr) => acc + Number(curr.lulus || 0), 0),
        tidak: akumulasiData.reduce((acc, curr) => acc + Number(curr.tidak || 0), 0),
        ghoib: akumulasiData.reduce((acc, curr) => acc + Number(curr.ghoib || 0), 0),
      };
    } else {
      const ratedSiswaTotal = akumulasiData.reduce((acc, curr) => acc + (Number(curr.jumlah_siswa || 0) - Number(curr.ghoib || 0)), 0);
      const totalWeight = akumulasiData.reduce((acc, curr) => acc + (Number(curr.rata_rata || 0) * (Number(curr.jumlah_siswa || 0) - Number(curr.ghoib || 0))), 0);
      const weightedAverage = ratedSiswaTotal > 0 ? (totalWeight / ratedSiswaTotal).toFixed(2) : 0;

      counts = {
        rata_rata: weightedAverage,
        ghoib: akumulasiData.reduce((acc, curr) => acc + Number(curr.ghoib || 0), 0),
      };
    }
    return {
      totalSiswa,
      counts,
      percents: Object.fromEntries(
        Object.entries(counts)
          .filter(([k]) => k !== 'rata_rata')
          .map(([k, v]) => [k, totalSiswa > 0 ? `${Math.round((Number(v) / totalSiswa) * 100)}%` : '0%'])
      )
    };
  }, [akumulasiData, activeTab]);

  const formatNilai = (val: any) => val === null || val === undefined ? '-' : Number(val).toString();

  const handleSearchSelect = (s: any) => {
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

  const generatePDFContent = (doc: jsPDF, classObj: KelasItem | undefined, classData: SantriNilaiRow[]) => {
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

    let headers: any[] = [];
    let body: any[] = [];

    if (activeTab === 'muhafadzoh') {
      headers = [['NO', 'NAMA SANTRI', 'NILAI', 'PREDIKAT', 'STATUS', 'CATATAN']];
      body = classData.map((r, i) => [
        i + 1,
        r.nama,
        r.nilai_angka !== null ? r.nilai_angka : '-',
        r.predikat || '-',
        r.status_kelulusan || '-',
        r.catatan || '-'
      ]);
    } else if (activeTab === 'taftisyul_kutub') {
      headers = [['NO', 'NAMA SANTRI', 'CAPAIAN', 'STATUS', 'CATATAN']];
      body = classData.map((r, i) => [
        i + 1,
        r.nama,
        r.capaian || r.predikat || '-',
        r.status_kelulusan || '-',
        r.catatan || '-'
      ]);
    } else if (activeTab === 'qiroatul_kitab') {
      headers = [['NO', 'NAMA SANTRI', 'NILAI', 'NILAI HURUF', 'CATATAN']];
      body = classData.map((r, i) => [
        i + 1,
        r.nama,
        r.nilai_angka !== null ? r.nilai_angka : '-',
        r.nilai_huruf || '-',
        r.catatan || '-'
      ]);
    } else if (activeTab === 'ringkasan') {
      headers = [['NO', 'NAMA SANTRI', 'MUHAFADZOH', 'QIROATUL KITAB', 'TAFTISYUL KUTUB']];
      body = classData.map((r, i) => [
        i + 1,
        r.nama,
        r.akbar ? `${r.akbar.predikat || '-'} (${r.akbar.status_kelulusan || '-'})` : '-',
        r.qiroah ? (r.qiroah.nilai_angka !== null ? r.qiroah.nilai_angka : '-') : '-',
        r.taftisy ? (r.taftisy.capaian || r.taftisy.predikat || '-') : '-'
      ]);
    }

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 34,
      styles: { fontSize, cellPadding: 2, minCellHeight: rowHeight },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      theme: 'grid'
    });
  };

  const exportLaporanToPDF = () => {
    if (!currentKelasObj || data.length === 0) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    generatePDFContent(doc, currentKelasObj, data);
    doc.save(`Laporan_${activeTab}_${currentKelasObj.nama}.pdf`);
  };

  const exportAllToPDF = async () => {
    if (!tahunAjaran || !selectedKategori) return;
    const currentMapel = getCurrentMapel();
    if (!currentMapel) return;

    setLoading(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      for (let i = 0; i < kelas.length; i++) {
        const k = kelas[i];
        const res = await nilaiService.fetchNilaiSantri({
          tahun_ajaran_id: tahunAjaran.id,
          kelas_id: k.id,
          mapel_id: currentMapel.id,
          kategori_id: selectedKategori
        });
        if (i > 0) doc.addPage();
        generatePDFContent(doc, k, Array.isArray(res) ? res : []);
      }
      doc.save(`Laporan_${activeTab}_Semua_Kelas.pdf`);
    } catch (err) {
      console.error('Gagal export semua kelas:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) return;
    let exportData: any[] = [];
    if (activeTab === 'ringkasan') {
      exportData = data.map((r, i) => ({
        No: i + 1,
        Nama: r.nama,
        NIS: r.nis || '',
        'Muhafadzoh Predikat': r.akbar?.predikat || '-',
        'Muhafadzoh Status': r.akbar?.status_kelulusan || '-',
        'Qiroatul Kitab Nilai': r.qiroah?.nilai_angka !== null ? r.qiroah?.nilai_angka : '-',
        'Taftisyul Kutub': r.taftisy?.capaian || r.taftisy?.predikat || '-'
      }));
    } else {
      exportData = data.map((r, i) => ({
        No: i + 1,
        Nama: r.nama,
        NIS: r.nis || '',
        Nilai: r.nilai_angka !== null ? r.nilai_angka : '-',
        Predikat: r.predikat || r.capaian || '-',
        Status: r.status_kelulusan || '-',
        Catatan: r.catatan || '-'
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Ujian');
    XLSX.writeFile(wb, `Laporan_${activeTab}_${currentKelasObj?.nama || 'Ringkasan'}.xlsx`);
  };

  const handleShare = async () => {
    if (!navigator.share) {
      alert('Fitur bagikan tidak didukung pada browser ini.');
      return;
    }
    try {
      await navigator.share({
        title: getPageTitle(),
        text: `Laporan ${getPageTitle()} Kelas ${currentKelasObj?.nama || '-'}`,
        url: window.location.href
      });
    } catch (err) {}
  };

  const tingkatOptions: TingkatOption[] = [
    { label: 'Sifir', value: 0 },
    { label: 'Kelas 1', value: 1 },
    { label: 'SP', value: 1.5 },
    { label: 'Kelas 2', value: 2 },
    { label: 'Kelas 3', value: 3 },
    { label: 'Kelas 4', value: 4 },
    { label: 'Kelas 5', value: 5 },
    { label: 'Kelas 6', value: 6 }
  ];

  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return santriSearchList.filter(s => 
      s.nama?.toLowerCase().includes(q) || (s.nis && s.nis.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [searchQuery, santriSearchList]);

  return (
    <div className="laporan-page-container">
      {/* HEADER TACTILE BAKU (Murni teks tanpa emoji/orb di judul) */}
      <header className="tactile-page-header no-print">
        <div className="header-text-block">
          <h2 className="page-title">Laporan Hasil Ujian Khusus</h2>
          <p className="page-subtitle">Laporan kumulatif hasil evaluasi ujian Muhafadzoh, Qiroah, dan Taftisy</p>
        </div>

        <div className="header-actions-row">
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
                className={`action-pill-btn ${viewMode === 'akumulasi' ? 'primary-pill' : 'secondary-pill'}`}
                onClick={() => setViewMode(viewMode === 'detail' ? 'akumulasi' : 'detail')}
              >
                {viewMode === 'detail' ? <BarChart2 size={15} /> : <RotateCcw size={15} />}
                <span>{viewMode === 'detail' ? 'Lihat Akumulasi' : 'Kembali ke Detail'}</span>
              </button>
            )}

            {!isMobile && (
              <>
                {activeTab !== 'ringkasan' && (
                  <button type="button" className="action-pill-btn secondary-pill" onClick={() => window.print()}>
                    <Printer size={15} />
                    <span>Cetak</span>
                  </button>
                )}
                {viewMode === 'detail' && activeTab !== 'ringkasan' && (
                  <>
                    <button type="button" className="action-pill-btn secondary-pill" onClick={handleShare}>
                      <Share2 size={15} />
                      <span>Bagikan</span>
                    </button>
                    <button type="button" className="action-pill-btn primary-pill" onClick={exportLaporanToPDF} disabled={loading}>
                      <FileText size={15} />
                      <span>Ekspor PDF</span>
                    </button>
                  </>
                )}
                {viewMode === 'akumulasi' && activeTab !== 'ringkasan' && (
                  <button type="button" className="action-pill-btn primary-pill" onClick={exportAllToPDF} disabled={loading}>
                    <Download size={15} />
                    <span>Ekspor Semua Kelas (PDF)</span>
                  </button>
                )}
                {activeTab === 'ringkasan' && (
                  <>
                    <button type="button" className="action-pill-btn primary-pill" onClick={exportLaporanToPDF} disabled={loading}>
                      <FileText size={15} />
                      <span>Ekspor PDF</span>
                    </button>
                    <button type="button" className="action-pill-btn success-pill" onClick={exportToExcel} disabled={loading}>
                      <Grid size={15} />
                      <span>Ekspor Excel</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <div className="laporan-frosted-card">
        
        {/* Option A Segmented Control Dock for Tabs */}
        <div className="segmented-tabs-dock no-print" style={{ alignSelf: 'flex-start' }}>
          <button
            type="button"
            className={`segmented-tab-btn ${activeTab === 'muhafadzoh' ? 'active' : ''}`}
            onClick={() => { setActiveTab('muhafadzoh'); setViewMode('detail'); }}
          >
            <BookOpen size={14} />
            <span>Muhafadzoh Akbar</span>
          </button>
          <button
            type="button"
            className={`segmented-tab-btn ${activeTab === 'qiroatul_kitab' ? 'active' : ''}`}
            onClick={() => { setActiveTab('qiroatul_kitab'); setViewMode('detail'); }}
          >
            <FileText size={14} />
            <span>Qiroatul Kitab</span>
          </button>
          <button
            type="button"
            className={`segmented-tab-btn ${activeTab === 'taftisyul_kutub' ? 'active' : ''}`}
            onClick={() => { setActiveTab('taftisyul_kutub'); setViewMode('detail'); }}
          >
            <Layers size={14} />
            <span>Taftisyul Kutub</span>
          </button>
          <button
            type="button"
            className={`segmented-tab-btn ${activeTab === 'ringkasan' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ringkasan'); setViewMode('detail'); }}
          >
            <BarChart2 size={14} />
            <span>Ringkasan Hasil</span>
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
            <div className="rapor-loading-spinner" style={{ minHeight: 'unset' }}><div className="spinner"></div></div>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Memuat data laporan...</span>
          </div>
        ) : (
          <>
            {viewMode === 'detail' ? (
              <>
                {/* Quick Class Selection Bar (Tingkatan & Rincian Kelas - Option A Liquid Glass) */}
                <div className="rapor-class-switcher-bar no-print">
                  <div className="switcher-group">
                    <div className="switcher-label-wrapper">
                      <Layers size={14} className="switcher-icon" />
                      <span className="switcher-title">Tingkatan:</span>
                    </div>
                    <div className="switcher-pills">
                      {tingkatOptions.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`switcher-pill-btn ${selectedTingkat === opt.value ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedTingkat(opt.value);
                            const classesInT = kelas.filter(k => k.tingkat === opt.value);
                            if (classesInT.length > 0) {
                              setSelectedKelas(classesInT[0].id);
                            }
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedTingkat !== null && (
                    <div className="switcher-group sub-classes">
                      <div className="switcher-label-wrapper">
                        <span className="switcher-title">Rincian Kelas:</span>
                      </div>
                      <div className="switcher-pills">
                        {filteredKelas.map(k => (
                          <button
                            key={k.id}
                            type="button"
                            className={`switcher-pill-btn sub-class ${selectedKelas === k.id ? 'active' : ''}`}
                            onClick={() => setSelectedKelas(k.id)}
                          >
                            {k.nama}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Autocomplete Search input */}
                <div className="inner-filter-bar no-print" style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 0, paddingBottom: 0 }}>
                  <div className="student-search-box" ref={searchContainerRef} style={{ position: 'relative', width: '280px' }}>
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
                        style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '10px', border: '1px solid rgba(226,232,240,0.9)', fontSize: '13px' }}
                      />
                      <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    </div>

                    {showSearchResults && filteredSearchResults.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        border: '1px solid rgba(226,232,240,0.9)',
                        borderRadius: '10px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        zIndex: 100,
                        marginTop: '4px',
                        maxHeight: '220px',
                        overflowY: 'auto'
                      }}>
                        {filteredSearchResults.map((s, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleSearchSelect(s)}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid rgba(241,245,249,0.9)',
                              fontSize: '12.5px'
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.nama}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Kelas: {s.nama_kelas || '-'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Table Detail */}
                <div className="table-responsive-laporan">
                  <table className="custom-data-table">
                    <thead>
                      {activeTab === 'muhafadzoh' && (
                        <tr>
                          <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                          <th>Nama Santri</th>
                          <th style={{ width: '90px', textAlign: 'center' }}>Nilai</th>
                          <th style={{ width: '130px', textAlign: 'center' }}>Predikat</th>
                          <th style={{ width: '110px', textAlign: 'center' }}>Status</th>
                          <th>Catatan</th>
                        </tr>
                      )}

                      {activeTab === 'taftisyul_kutub' && (
                        <tr>
                          <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                          <th>Nama Santri</th>
                          <th style={{ width: '130px', textAlign: 'center' }}>Capaian</th>
                          <th style={{ width: '110px', textAlign: 'center' }}>Status</th>
                          <th>Catatan</th>
                        </tr>
                      )}

                      {activeTab === 'qiroatul_kitab' && (
                        <tr>
                          <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                          <th>Nama Santri</th>
                          <th style={{ width: '90px', textAlign: 'center' }}>Nilai</th>
                          <th style={{ width: '120px', textAlign: 'center' }}>Nilai Huruf</th>
                          <th>Catatan</th>
                        </tr>
                      )}

                      {activeTab === 'ringkasan' && (
                        <tr>
                          <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                          <th>Nama Santri</th>
                          <th style={{ textAlign: 'center' }}>Muhafadzoh</th>
                          <th style={{ textAlign: 'center' }}>Qiroatul Kitab</th>
                          <th style={{ textAlign: 'center' }}>Taftisyul Kutub</th>
                        </tr>
                      )}
                    </thead>

                    <tbody>
                      {data.map((row, idx) => {
                        if (activeTab === 'muhafadzoh') {
                          return (
                            <tr key={row.santri_id || idx}>
                              <td className="center-text">{idx + 1}</td>
                              <td className="student-name-cell">{row.nama}</td>
                              <td className="center-text" style={{ fontWeight: 'bold' }}>{formatNilai(row.nilai_angka)}</td>
                              <td className="center-text">
                                <span className={`predikat-badge ${getPredClass(row.predikat)}`}>
                                  {row.predikat || '-'}
                                </span>
                              </td>
                              <td className="center-text">
                                {row.status_kelulusan === 'Lulus' ? (
                                  <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle size={14} /> Lulus
                                  </span>
                                ) : row.status_kelulusan ? (
                                  <span style={{ color: '#ef4444', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <XCircle size={14} /> Tidak Lulus
                                  </span>
                                ) : '-'}
                              </td>
                              <td>{row.catatan || '-'}</td>
                            </tr>
                          );
                        }

                        if (activeTab === 'taftisyul_kutub') {
                          return (
                            <tr key={row.santri_id || idx}>
                              <td className="center-text">{idx + 1}</td>
                              <td className="student-name-cell">{row.nama}</td>
                              <td className="center-text">
                                <span className={`predikat-badge ${getPredClass(row.capaian || row.predikat)}`}>
                                  {row.capaian || row.predikat || '-'}
                                </span>
                              </td>
                              <td className="center-text">
                                {row.status_kelulusan === 'Lulus' ? (
                                  <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle size={14} /> Lulus
                                  </span>
                                ) : row.status_kelulusan ? (
                                  <span style={{ color: '#ef4444', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <XCircle size={14} /> Tidak Lulus
                                  </span>
                                ) : '-'}
                              </td>
                              <td>{row.catatan || '-'}</td>
                            </tr>
                          );
                        }

                        if (activeTab === 'qiroatul_kitab') {
                          return (
                            <tr key={row.santri_id || idx}>
                              <td className="center-text">{idx + 1}</td>
                              <td className="student-name-cell">{row.nama}</td>
                              <td className="center-text" style={{ fontWeight: 'bold' }}>{formatNilai(row.nilai_angka)}</td>
                              <td className="center-text" style={{ fontWeight: 'bold' }}>{row.nilai_huruf || '-'}</td>
                              <td>{row.catatan || '-'}</td>
                            </tr>
                          );
                        }

                        // Ringkasan View
                        return (
                          <tr key={row.santri_id || idx}>
                            <td className="center-text">{idx + 1}</td>
                            <td className="student-name-cell">{row.nama}</td>
                            <td className="center-text">
                              {row.akbar ? (
                                <span className={`predikat-badge ${getPredClass(row.akbar.predikat)}`}>
                                  {row.akbar.predikat || '-'} ({row.akbar.status_kelulusan || '-'})
                                </span>
                              ) : '-'}
                            </td>
                            <td className="center-text" style={{ fontWeight: 'bold' }}>
                              {row.qiroah ? (row.qiroah.nilai_angka !== null ? row.qiroah.nilai_angka : '-') : '-'}
                            </td>
                            <td className="center-text">
                              {row.taftisy ? (
                                <span className={`predikat-badge ${getPredClass(row.taftisy.capaian || row.taftisy.predikat)}`}>
                                  {row.taftisy.capaian || row.taftisy.predikat || '-'}
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        );
                      })}

                      {data.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                            Belum ada data nilai untuk kelas terpilih.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Ringkasan Summary Widgets */}
                {activeTab !== 'ringkasan' && summary.total > 0 && (
                  <div className="ringkasan-summary-grid">
                    <div className="summary-widget">
                      <span className="widget-title">Total Santri</span>
                      <span className="widget-val">{summary.total}</span>
                    </div>
                    {Object.entries(summary.counts).map(([k, v]) => (
                      <div key={k} className="summary-widget">
                        <span className="widget-title">{k}</span>
                        <span className="widget-val">{v} ({summary.percents[k]})</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Akumulasi View Mode */
              <div className="table-responsive-laporan">
                <table className="custom-data-table">
                  <thead>
                    {activeTab === 'muhafadzoh' && (
                      <tr>
                        <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                        <th>Kelas-Kelas</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Siswa</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Rodi</th>
                        <th style={{ width: '110px', textAlign: 'center' }}>Mutawassith</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Jayyid</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Mumtaz</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Lulus</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Tidak</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Ghoib</th>
                      </tr>
                    )}

                    {activeTab === 'taftisyul_kutub' && (
                      <tr>
                        <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                        <th>Kelas-Kelas</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Siswa</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Naqish</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Tam</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Lulus</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Tidak</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Ghoib</th>
                      </tr>
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
                      const getPercentSpan = (val: number) => {
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

                      return (
                        <tr key={row.kelas_id}>
                          <td className="center-text">{idx + 1}</td>
                          <td className="student-name-cell">{row.nama_kelas}</td>
                          <td className="center-text" style={{ fontWeight: 'bold' }}>{row.jumlah_siswa}</td>
                          <td className="center-text" style={{ fontWeight: 'bold', color: '#0052ff' }}>{row.rata_rata || '0'}</td>
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
function getPredClass(pred?: string | null): string {
  if (!pred) return 'empty';
  return pred.toLowerCase().replace("'", "");
}

export default LaporanUjianKhusus;

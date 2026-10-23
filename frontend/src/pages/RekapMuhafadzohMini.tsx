import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Award, 
  Printer, 
  Search, 
  Download, 
  FileText, 
  RefreshCw,
  Sparkles,
  School,
  Layers,
  ChevronDown
} from 'lucide-react';
import { nilaiService } from '../services/nilaiService';
import { settingsService } from '../services/settingsService';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useResponsive } from '../hooks/useResponsive';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { 
  TahunAjaranItem, 
  KelasItem, 
  KategoriItem, 
  MataPelajaranItem, 
  MiniNilaiItem, 
  RekapMiniTab 
} from '../types/rekapMuhafadzohMini';
import './RekapMuhafadzohMini.scss';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const RekapMuhafadzohMini: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [kelas, setKelas] = useState<KelasItem[]>([]);
  const [kategori, setKategori] = useState<KategoriItem[]>([]);
  const [selectedTingkat, setSelectedTingkat] = useState<number>(0);
  const [selectedKelas, setSelectedKelas] = useState<number | null>(null);
  const [selectedKategori, setSelectedKategori] = useState<number | null>(null);
  const [data, setData] = useState<MiniNilaiItem[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranItem[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaranItem | null>(null);

  // Mata Pelajaran Mini 1 - 4
  const [miniMapels, setMiniMapels] = useState<Record<number, MataPelajaranItem | null>>({
    1: null,
    2: null,
    3: null,
    4: null
  });

  const [activeTab, setActiveTab] = useState<RekapMiniTab>('mini1');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { isMobile } = useResponsive();

  // ── 1. INITIAL MASTER DATA LOADING ───────────────────────────
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

        const diniyahKelas: KelasItem[] = Array.isArray(kelasData)
          ? kelasData
              .filter((k: any) => k.jenis === 'Diniyah')
              .map((k: any) => (k.nama === 'SP' && k.tingkat === 1 ? { ...k, tingkat: 99 } : k))
              .sort((a: any, b: any) => {
                if (a.tingkat !== b.tingkat) return a.tingkat - b.tingkat;
                return a.nama.localeCompare(b.nama);
              })
          : [];
        setKelas(diniyahKelas);

        const filteredKat = (Array.isArray(katData) ? katData : []).filter(
          (k: any) => !k.nama?.toLowerCase().includes('harian') && !k.nama?.toLowerCase().includes('tugas')
        );
        setKategori(filteredKat);

        // Find Mini 1 - 4 mapels
        if (Array.isArray(mapelData)) {
          const map: Record<number, MataPelajaranItem | null> = { 1: null, 2: null, 3: null, 4: null };
          for (let i = 1; i <= 4; i++) {
            const found = mapelData.find(
              (m: any) =>
                m.nama?.toLowerCase() === `muhafadzoh mini ${i}` ||
                (m.jenis === 'Muhafadzoh' && m.nama?.toLowerCase().includes(`mini ${i}`))
            );
            map[i] = found || null;
          }
          setMiniMapels(map);
        }

        // Active semester selection
        if (filteredKat.length > 0) {
          const activeSemester = systemSettings.active_semester || 'Ganjil';
          const defKat = filteredKat.find(k => k.nama?.toLowerCase().includes(activeSemester.toLowerCase()));
          setSelectedKategori(defKat ? defKat.id : filteredKat[0].id);
        }

        // Select first class default
        if (diniyahKelas.length > 0) {
          setSelectedTingkat(diniyahKelas[0].tingkat);
          setSelectedKelas(diniyahKelas[0].id);
        }
      } catch (err) {
        console.error('Gagal memuat master data Rekap Muhafadzoh Mini:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── 2. GET CURRENT MAPEL HELPER ─────────────────────────────
  const getCurrentMapel = (): MataPelajaranItem | null => {
    if (activeTab === 'mini1') return miniMapels[1];
    if (activeTab === 'mini2') return miniMapels[2];
    if (activeTab === 'mini3') return miniMapels[3];
    if (activeTab === 'mini4') return miniMapels[4];
    return null;
  };

  // ── 3. FETCH NILAI DATA ─────────────────────────────────────
  const loadData = async () => {
    if (!selectedKelas || !tahunAjaran || !selectedKategori) return;

    if (activeTab === 'ringkasan') {
      const m1 = miniMapels[1];
      const m2 = miniMapels[2];
      const m3 = miniMapels[3];
      const m4 = miniMapels[4];

      if (!m1 && !m2 && !m3 && !m4) return;
      setLoading(true);
      try {
        const fetchPromises = [1, 2, 3, 4].map(num => {
          const mapel = miniMapels[num];
          if (!mapel) return Promise.resolve([]);
          return nilaiService.fetchNilaiSantri({
            tahun_ajaran_id: tahunAjaran.id,
            kelas_id: selectedKelas,
            mapel_id: mapel.id,
            kategori_id: selectedKategori
          });
        });

        const [res1, res2, res3, res4] = await Promise.all(fetchPromises);

        const merged: Record<number, MiniNilaiItem> = {};
        const processRes = (resArray: any[], miniKey: 'mini1' | 'mini2' | 'mini3' | 'mini4') => {
          if (Array.isArray(resArray)) {
            resArray.forEach(r => {
              if (!merged[r.santri_id]) {
                merged[r.santri_id] = { santri_id: r.santri_id, nama: r.nama, nis: r.nis, foto_url: r.foto_url };
              } else if (!merged[r.santri_id].foto_url && r.foto_url) {
                merged[r.santri_id].foto_url = r.foto_url;
              }
              merged[r.santri_id][miniKey] = r;
            });
          }
        };

        processRes(res1, 'mini1');
        processRes(res2, 'mini2');
        processRes(res3, 'mini3');
        processRes(res4, 'mini4');

        setData(Object.values(merged).sort((a, b) => a.nama.localeCompare(b.nama)));
      } catch (err) {
        console.error('Gagal memuat ringkasan muhafadzoh mini:', err);
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
        console.error('Gagal memuat data muhafadzoh mini:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedKelas, selectedKategori, tahunAjaran, miniMapels, activeTab]);

  // ── 4. DERIVED STATES & FILTERING ────────────────────────────
  const currentKelasObj = useMemo(() => {
    return kelas.find(k => k.id === selectedKelas);
  }, [kelas, selectedKelas]);

  const currentKategoriObj = useMemo(() => {
    return kategori.find(k => k.id === selectedKategori);
  }, [kategori, selectedKategori]);

  const uniqueLevels = useMemo(() => {
    const set = new Set<number>();
    kelas.forEach(k => {
      if (k.tingkat !== null && k.tingkat !== undefined) set.add(k.tingkat);
    });
    return Array.from(set).sort((a, b) => {
      if (a === 99) return 1;
      if (b === 99) return -1;
      return a - b;
    });
  }, [kelas]);

  const classesInSelectedTingkat = useMemo(() => {
    if (selectedTingkat === null || selectedTingkat === undefined) return [];
    return kelas.filter(k => k.tingkat === selectedTingkat);
  }, [kelas, selectedTingkat]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(r => r.nama?.toLowerCase().includes(q) || (r.nis && String(r.nis).includes(q)));
  }, [data, searchQuery]);

  const getTingkatLabel = (tingkat: number): string => {
    if (tingkat === 99) return 'Kelas SP';
    return `Tingkat ${tingkat}`;
  };

  const getPredClass = (pred?: string | null): string => {
    if (!pred) return 'none';
    const clean = pred.toLowerCase().replace("'", "").trim();
    if (clean === 'mumtaz') return 'mumtaz';
    if (clean === 'jayyid') return 'jayyid';
    if (clean === 'mutawassith') return 'mutawassith';
    if (clean === 'rodi') return 'rodi';
    return 'custom';
  };

  const formatNilai = (val: any) => {
    if (val === null || val === undefined || val === '') return '-';
    return Number(val).toString();
  };

  // ── 5. STATS & SUMMARY CALCULATION ──────────────────────────
  const summary = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return { total: 0, counts: {}, percents: {} };
    if (activeTab === 'ringkasan') {
      return { total: data.length, counts: {}, percents: {} };
    }
    const counts = {
      Mumtaz: data.filter(r => r.predikat === 'Mumtaz').length,
      Jayyid: data.filter(r => r.predikat === 'Jayyid').length,
      Mutawassith: data.filter(r => r.predikat === 'Mutawassith').length,
      Rodi: data.filter(r => r.predikat === "Rodi'").length,
      Ghoib: data.filter(r => r.nilai_angka === null && !r.capaian).length
    };
    const total = data.length;
    return {
      total,
      counts,
      percents: Object.fromEntries(
        Object.entries(counts).map(([k, v]) => [k, total > 0 ? `${Math.round((Number(v) / total) * 100)}%` : '0%'])
      )
    };
  }, [data, activeTab]);

  // ── 6. PDF & EXCEL EXPORTS ──────────────────────────────────
  const getTabTitle = () => {
    if (activeTab === 'mini1') return 'Muhafadzoh Mini 1';
    if (activeTab === 'mini2') return 'Muhafadzoh Mini 2';
    if (activeTab === 'mini3') return 'Muhafadzoh Mini 3';
    if (activeTab === 'mini4') return 'Muhafadzoh Mini 4';
    return 'Ringkasan Muhafadzoh Mini (1-4)';
  };

  const generatePDFContent = (doc: jsPDF, classObj: KelasItem, classData: MiniNilaiItem[]) => {
    const count = classData.length || 1;
    let rowHeight = Math.floor(240 / count);
    if (rowHeight > 10) rowHeight = 10;
    if (rowHeight < 6.5) rowHeight = 6.5;
    const fontSize = count > 26 ? 8 : 9;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`REKAPITULASI ${getTabTitle().toUpperCase()}`, 107.9, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`KELAS: ${classObj?.nama || '-'}`, 107.9, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${tahunAjaran?.kode || '-'} | ${currentKategoriObj?.nama || '-'}`, 107.9, 28, { align: 'center' });

    let headers: any[] = [];
    let body: any[] = [];

    if (activeTab === 'ringkasan') {
      headers = [['NO', 'NAMA SANTRI', 'MINI 1', 'MINI 2', 'MINI 3', 'MINI 4', 'RERATA']];
      body = classData.map((r, i) => {
        const val1 = r.mini1 ? ((r.mini1.nilai_angka !== null && r.mini1.nilai_angka !== undefined && r.mini1.nilai_angka !== '') ? r.mini1.nilai_angka : (r.mini1.capaian || r.mini1.predikat || '-')) : '-';
        const val2 = r.mini2 ? ((r.mini2.nilai_angka !== null && r.mini2.nilai_angka !== undefined && r.mini2.nilai_angka !== '') ? r.mini2.nilai_angka : (r.mini2.capaian || r.mini2.predikat || '-')) : '-';
        const val3 = r.mini3 ? ((r.mini3.nilai_angka !== null && r.mini3.nilai_angka !== undefined && r.mini3.nilai_angka !== '') ? r.mini3.nilai_angka : (r.mini3.capaian || r.mini3.predikat || '-')) : '-';
        const val4 = r.mini4 ? ((r.mini4.nilai_angka !== null && r.mini4.nilai_angka !== undefined && r.mini4.nilai_angka !== '') ? r.mini4.nilai_angka : (r.mini4.capaian || r.mini4.predikat || '-')) : '-';

        // Calculate numeric average if available
        const numVals = [r.mini1?.nilai_angka, r.mini2?.nilai_angka, r.mini3?.nilai_angka, r.mini4?.nilai_angka]
          .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
          .map(v => Number(v));
        const avg = numVals.length > 0 ? (numVals.reduce((a, b) => a + b, 0) / numVals.length).toFixed(1) : '-';

        return [i + 1, r.nama, val1, val2, val3, val4, avg];
      });
    } else {
      headers = [['NO', 'NAMA SANTRI', 'NILAI', 'PREDIKAT']];
      body = classData.map((r, i) => [
        i + 1,
        r.nama,
        (r.nilai_angka !== null && r.nilai_angka !== undefined && r.nilai_angka !== '') ? r.nilai_angka : (r.capaian || '-'),
        r.predikat || '-'
      ]);
    }

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 34,
      styles: { fontSize, cellPadding: 2, minCellHeight: rowHeight },
      headStyles: { fillColor: [14, 116, 144], textColor: 255 },
      theme: 'grid'
    });
  };

  const exportLaporanToPDF = () => {
    if (!currentKelasObj || data.length === 0) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    generatePDFContent(doc, currentKelasObj, data);
    doc.save(`Rekap_${activeTab}_${currentKelasObj.nama}.pdf`);
  };

  const exportAllToPDF = async () => {
    if (!tahunAjaran || !selectedKategori) return;
    const currentMapel = getCurrentMapel();
    if (!currentMapel && activeTab !== 'ringkasan') return;

    setLoading(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      for (let i = 0; i < kelas.length; i++) {
        const k = kelas[i];
        let classList: MiniNilaiItem[] = [];

        if (activeTab === 'ringkasan') {
          const fetchPromises = [1, 2, 3, 4].map(num => {
            const mapel = miniMapels[num];
            if (!mapel) return Promise.resolve([]);
            return nilaiService.fetchNilaiSantri({
              tahun_ajaran_id: tahunAjaran.id,
              kelas_id: k.id,
              mapel_id: mapel.id,
              kategori_id: selectedKategori
            });
          });
          const [r1, r2, r3, r4] = await Promise.all(fetchPromises);
          const merged: Record<number, MiniNilaiItem> = {};
          const add = (arr: any[], key: 'mini1' | 'mini2' | 'mini3' | 'mini4') => {
            if (Array.isArray(arr)) {
              arr.forEach(item => {
                if (!merged[item.santri_id]) merged[item.santri_id] = { santri_id: item.santri_id, nama: item.nama, nis: item.nis };
                merged[item.santri_id][key] = item;
              });
            }
          };
          add(r1, 'mini1'); add(r2, 'mini2'); add(r3, 'mini3'); add(r4, 'mini4');
          classList = Object.values(merged).sort((a, b) => a.nama.localeCompare(b.nama));
        } else {
          const res = await nilaiService.fetchNilaiSantri({
            tahun_ajaran_id: tahunAjaran.id,
            kelas_id: k.id,
            mapel_id: currentMapel!.id,
            kategori_id: selectedKategori
          });
          classList = Array.isArray(res) ? res : [];
        }

        if (i > 0) doc.addPage();
        generatePDFContent(doc, k, classList);
      }
      doc.save(`Rekap_${activeTab}_Semua_Kelas.pdf`);
    } catch (err) {
      console.error('Gagal export PDF semua kelas:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) return;
    let exportData: any[] = [];
    if (activeTab === 'ringkasan') {
      exportData = data.map((r, i) => {
        const val1 = r.mini1 ? ((r.mini1.nilai_angka !== null && r.mini1.nilai_angka !== undefined && r.mini1.nilai_angka !== '') ? r.mini1.nilai_angka : (r.mini1.capaian || r.mini1.predikat || '-')) : '-';
        const val2 = r.mini2 ? ((r.mini2.nilai_angka !== null && r.mini2.nilai_angka !== undefined && r.mini2.nilai_angka !== '') ? r.mini2.nilai_angka : (r.mini2.capaian || r.mini2.predikat || '-')) : '-';
        const val3 = r.mini3 ? ((r.mini3.nilai_angka !== null && r.mini3.nilai_angka !== undefined && r.mini3.nilai_angka !== '') ? r.mini3.nilai_angka : (r.mini3.capaian || r.mini3.predikat || '-')) : '-';
        const val4 = r.mini4 ? ((r.mini4.nilai_angka !== null && r.mini4.nilai_angka !== undefined && r.mini4.nilai_angka !== '') ? r.mini4.nilai_angka : (r.mini4.capaian || r.mini4.predikat || '-')) : '-';

        const numVals = [r.mini1?.nilai_angka, r.mini2?.nilai_angka, r.mini3?.nilai_angka, r.mini4?.nilai_angka]
          .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
          .map(v => Number(v));
        const avg = numVals.length > 0 ? (numVals.reduce((a, b) => a + b, 0) / numVals.length).toFixed(1) : '-';

        return {
          No: i + 1,
          Nama: r.nama,
          NIS: r.nis || '',
          'Muhafadzoh Mini 1': val1,
          'Muhafadzoh Mini 2': val2,
          'Muhafadzoh Mini 3': val3,
          'Muhafadzoh Mini 4': val4,
          'Rerata Nilai': avg
        };
      });
    } else {
      exportData = data.map((r, i) => ({
        No: i + 1,
        Nama: r.nama,
        NIS: r.nis || '',
        Nilai: (r.nilai_angka !== null && r.nilai_angka !== undefined && r.nilai_angka !== '') ? r.nilai_angka : (r.capaian || '-'),
        Predikat: r.predikat || '-'
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Muhafadzoh Mini');
    XLSX.writeFile(wb, `Rekap_${activeTab}_${currentKelasObj?.nama || 'Kelas'}.xlsx`);
  };

  return (
    <div className="rekap-mini-page-container">
      {/* ── 1. HEADER HALAMAN (Option A: Strict Typography, No Orb beside title) ── */}
      <header className="tactile-page-header">
        <div>
          <h2 className="page-title">Rekap Muhafadzoh Mini</h2>
          <p className="page-subtitle">
            Laporan dan rekapitulasi penilaian hafalan Muhafadzoh Mini 1 s/d 4 madrasah diniyyah
          </p>
        </div>

        <div className="header-actions-dock">
          <button
            type="button"
            className="action-pill-btn"
            onClick={exportLaporanToPDF}
            disabled={loading || data.length === 0}
            title="Unduh berkas PDF kelas terpilih"
          >
            <Printer size={13} />
            <span>PDF Kelas</span>
          </button>
          <button
            type="button"
            className="action-pill-btn"
            onClick={exportAllToPDF}
            disabled={loading || kelas.length === 0}
            title="Unduh berkas PDF seluruh kelas madrasah diniyyah"
          >
            <FileText size={13} />
            <span>PDF Semua Kelas</span>
          </button>
          <button
            type="button"
            className="action-pill-btn primary-pill"
            onClick={exportToExcel}
            disabled={loading || data.length === 0}
            title="Unduh berkas spreadsheet Excel"
          >
            <Download size={13} />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </header>

      {/* ── 2. GLOBAL FILTERS BAR ─────────────────────────────────── */}
      <div className="liquid-glass-filter-card">
        <div className="filter-item">
          <label className="filter-label">Tahun Ajaran</label>
          <CustomSelect
            value={tahunAjaran?.id || ''}
            onChange={(val: any) => {
              const selected = tahunAjaranList.find(ta => ta.id === Number(val));
              if (selected) setTahunAjaran(selected);
            }}
            options={tahunAjaranList.map(ta => ({
              value: ta.id,
              label: `${ta.kode} ${ta.is_active ? '(Aktif)' : ''}`
            }))}
            placeholder="Pilih Tahun Ajaran"
          />
        </div>

        <div className="filter-item">
          <label className="filter-label">Semester / Evaluasi</label>
          <CustomSelect
            value={selectedKategori || ''}
            onChange={(val: any) => setSelectedKategori(Number(val))}
            options={kategori.map(kat => ({
              value: kat.id,
              label: kat.nama
            }))}
            placeholder="Pilih Semester"
          />
        </div>

        <div className="filter-item search-filter-item">
          <label className="filter-label">Pencarian Santri</label>
          <div className="search-input-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Cari nama atau NIS santri..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="clear-btn" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. SEGMENTED TABS DOCK (MINI 1, 2, 3, 4, RINGKASAN) ──── */}
      <nav className="tactile-tabs-nav">
        <button
          type="button"
          className={`tactile-tab-pill ${activeTab === 'mini1' ? 'active' : ''}`}
          onClick={() => setActiveTab('mini1')}
        >
          <Award size={15} />
          <span>Muhafadzoh Mini 1</span>
        </button>
        <button
          type="button"
          className={`tactile-tab-pill ${activeTab === 'mini2' ? 'active' : ''}`}
          onClick={() => setActiveTab('mini2')}
        >
          <Award size={15} />
          <span>Muhafadzoh Mini 2</span>
        </button>
        <button
          type="button"
          className={`tactile-tab-pill ${activeTab === 'mini3' ? 'active' : ''}`}
          onClick={() => setActiveTab('mini3')}
        >
          <Award size={15} />
          <span>Muhafadzoh Mini 3</span>
        </button>
        <button
          type="button"
          className={`tactile-tab-pill ${activeTab === 'mini4' ? 'active' : ''}`}
          onClick={() => setActiveTab('mini4')}
        >
          <Award size={15} />
          <span>Muhafadzoh Mini 4</span>
        </button>

        <div className="tabs-nav-divider" />

        <button
          type="button"
          className={`tactile-tab-pill ${activeTab === 'ringkasan' ? 'active' : ''}`}
          onClick={() => setActiveTab('ringkasan')}
        >
          <Layers size={15} />
          <span>Ringkasan Mini (1-4)</span>
        </button>
      </nav>

      {/* ── 4. MAIN DATA CARD WITH QUICK CLASS SWITCHER ───────────── */}
      <div className="liquid-glass-table-card">
        {/* Quick Class Selection Bar */}
        <div className="rapor-class-switcher-bar">
          <div className="switcher-group tingkat-group">
            <div className="switcher-label-wrapper">
              <School size={14} className="switcher-icon" />
              <span className="switcher-title">Tingkatan</span>
            </div>
            <div className="pills-scroll-container">
              {uniqueLevels.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`level-pill-btn ${selectedTingkat === t ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTingkat(t);
                    const classesInT = kelas.filter(k => k.tingkat === t);
                    if (classesInT.length > 0) setSelectedKelas(classesInT[0].id);
                  }}
                >
                  {getTingkatLabel(t)}
                </button>
              ))}
            </div>
          </div>

          <div className="switcher-group class-group">
            <div className="switcher-label-wrapper">
              <Sparkles size={14} className="switcher-icon" style={{ color: '#0284c7' }} />
              <span className="switcher-title">Rincian Kelas</span>
            </div>
            <div className="pills-scroll-container">
              {classesInSelectedTingkat.map(k => (
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
          </div>
        </div>

        {/* Table Top Info & Controls */}
        {currentKelasObj ? (
          <>
            <div className="table-top-bar">
              <div className="info-cluster">
                <h3 className="cluster-title">
                  {currentKelasObj.nama} • {getTabTitle()}
                </h3>
                <span className="cluster-count-pill">
                  {filteredData.length} Santri
                </span>
              </div>

              <div className="actions-cluster">
                <button
                  type="button"
                  className="action-pill-btn"
                  onClick={loadData}
                  title="Segarkan data dari server"
                >
                  <RefreshCw size={13} />
                  <span>Segarkan</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="page-loading-box">
                <div className="spinner"></div>
                <span>Memproses data rekapitulasi penilaian santri...</span>
              </div>
            ) : (
              <>
                <div className="table-responsive-box">
                  <table className="glass-data-table">
                    <thead>
                      {activeTab === 'ringkasan' ? (
                        <tr>
                          <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                          <th>Nama Santri</th>
                          <th style={{ textAlign: 'center' }}>Mini 1</th>
                          <th style={{ textAlign: 'center' }}>Mini 2</th>
                          <th style={{ textAlign: 'center' }}>Mini 3</th>
                          <th style={{ textAlign: 'center' }}>Mini 4</th>
                          <th style={{ width: '100px', textAlign: 'center' }}>Rata-rata</th>
                        </tr>
                      ) : (
                        <tr>
                          <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                          <th style={{ width: '280px', textAlign: 'left' }}>Identitas Santri</th>
                          <th style={{ width: '180px', textAlign: 'center' }}>Nilai / Capaian</th>
                          <th style={{ width: '180px', textAlign: 'center' }}>Predikat</th>
                          <th></th>
                        </tr>
                      )}
                    </thead>

                    <tbody>
                      {filteredData.map((row, idx) => {
                        if (activeTab === 'ringkasan') {
                          const val1 = row.mini1 ? ((row.mini1.nilai_angka !== null && row.mini1.nilai_angka !== undefined && row.mini1.nilai_angka !== '') ? row.mini1.nilai_angka : (row.mini1.capaian || '-')) : '-';
                          const val2 = row.mini2 ? ((row.mini2.nilai_angka !== null && row.mini2.nilai_angka !== undefined && row.mini2.nilai_angka !== '') ? row.mini2.nilai_angka : (row.mini2.capaian || '-')) : '-';
                          const val3 = row.mini3 ? ((row.mini3.nilai_angka !== null && row.mini3.nilai_angka !== undefined && row.mini3.nilai_angka !== '') ? row.mini3.nilai_angka : (row.mini3.capaian || '-')) : '-';
                          const val4 = row.mini4 ? ((row.mini4.nilai_angka !== null && row.mini4.nilai_angka !== undefined && row.mini4.nilai_angka !== '') ? row.mini4.nilai_angka : (row.mini4.capaian || '-')) : '-';

                          const numVals = [row.mini1?.nilai_angka, row.mini2?.nilai_angka, row.mini3?.nilai_angka, row.mini4?.nilai_angka]
                            .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
                            .map(v => Number(v));
                          const avg = numVals.length > 0 ? (numVals.reduce((a, b) => a + b, 0) / numVals.length).toFixed(1) : '-';

                          return (
                            <tr key={row.santri_id || idx}>
                              <td className="center-text">{idx + 1}</td>
                              <td className="student-name-cell">
                                <div className="person-lens-cell">
                                  <div className="lens-orb-avatar">
                                    {row.foto_url ? (
                                      <img
                                        src={`${API_BASE}${row.foto_url}`}
                                        alt={row.nama}
                                        onError={(e) => {
                                          const target = e.currentTarget;
                                          target.style.display = 'none';
                                          const next = target.nextElementSibling as HTMLElement | null;
                                          if (next) next.style.display = 'block';
                                        }}
                                      />
                                    ) : null}
                                    <span style={{ display: row.foto_url ? 'none' : 'block' }}>
                                      {row.nama ? row.nama.charAt(0).toUpperCase() : 'S'}
                                    </span>
                                  </div>
                                  <div className="person-name-stack">
                                    <span className="person-name">{row.nama}</span>
                                    <span className="person-nis">NIS: {row.nis || '-'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="center-text">
                                {row.mini1 ? (
                                  <span className={`predikat-badge ${getPredClass(row.mini1.predikat)}`}>
                                    {val1} {row.mini1.predikat ? `(${row.mini1.predikat})` : ''}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="center-text">
                                {row.mini2 ? (
                                  <span className={`predikat-badge ${getPredClass(row.mini2.predikat)}`}>
                                    {val2} {row.mini2.predikat ? `(${row.mini2.predikat})` : ''}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="center-text">
                                {row.mini3 ? (
                                  <span className={`predikat-badge ${getPredClass(row.mini3.predikat)}`}>
                                    {val3} {row.mini3.predikat ? `(${row.mini3.predikat})` : ''}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="center-text">
                                {row.mini4 ? (
                                  <span className={`predikat-badge ${getPredClass(row.mini4.predikat)}`}>
                                    {val4} {row.mini4.predikat ? `(${row.mini4.predikat})` : ''}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="center-text" style={{ fontWeight: 800, color: '#0369a1' }}>
                                {avg}
                              </td>
                            </tr>
                          );
                        }

                        const displayNilai = (row.nilai_angka !== null && row.nilai_angka !== undefined && row.nilai_angka !== '')
                          ? formatNilai(row.nilai_angka)
                          : (row.capaian || '-');

                        return (
                          <tr key={row.santri_id || idx}>
                            <td className="center-text">{idx + 1}</td>
                            <td className="student-name-cell">
                              <div className="person-lens-cell">
                                <div className="lens-orb-avatar">
                                  {row.foto_url ? (
                                    <img
                                      src={`${API_BASE}${row.foto_url}`}
                                      alt={row.nama}
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        target.style.display = 'none';
                                        const next = target.nextElementSibling as HTMLElement | null;
                                        if (next) next.style.display = 'block';
                                      }}
                                    />
                                  ) : null}
                                  <span style={{ display: row.foto_url ? 'none' : 'block' }}>
                                    {row.nama ? row.nama.charAt(0).toUpperCase() : 'S'}
                                  </span>
                                </div>
                                <div className="person-name-stack">
                                  <span className="person-name">{row.nama}</span>
                                  <span className="person-nis">NIS: {row.nis || '-'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="center-text" style={{ fontWeight: 'bold' }}>
                              {displayNilai}
                            </td>
                            <td className="center-text">
                              <span className={`predikat-badge ${getPredClass(row.predikat)}`}>
                                {row.predikat || '-'}
                              </span>
                            </td>
                            <td></td>
                          </tr>
                        );
                      })}

                      {filteredData.length === 0 && (
                        <tr>
                          <td colSpan={activeTab === 'ringkasan' ? 7 : 5} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                            Belum ada rekaman nilai muhafadzoh mini untuk kelas ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Widgets Dock */}
                {activeTab !== 'ringkasan' && summary.total > 0 && (
                  <div className="rekap-mini-summary-grid">
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
            )}
          </>
        ) : (
          <div className="liquid-empty-hero">
            <School size={36} />
            <h3>Pilih Kelas Diniyah</h3>
            <p>Silakan pilih tingkatan dan kelas dari bilah tombol di atas untuk memuat rekaman rekap.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default RekapMuhafadzohMini;

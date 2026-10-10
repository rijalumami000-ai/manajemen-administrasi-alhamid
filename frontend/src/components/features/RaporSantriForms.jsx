import { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Save, 
  Sparkles, 
  Check, 
  AlertCircle,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { nilaiService } from '../../services/nilaiService';
import { useToast } from '../common';
import { CustomSelect } from '../ui/CustomSelect';
import './RaporSantriForms.scss';

export function RaporSantriForms({
  type, // 'absensi', 'kepribadian', 'catatan', 'kenaikan_kelas'
  tahunAjaran,
  selectedKelasDetail,
  selectedKategori,
  kelasName,
  kategoriNama,
  kelasList = [],
  levels = [],
  selectedTingkat = null,
  onSelectTingkat,
  onSelectKelasDetail,
  getTingkatLabel
}) {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [visibleMonths, setVisibleMonths] = useState([]);
  const [tableWidth, setTableWidth] = useState(1200);

  // References for synchronized top/bottom horizontal scrolling & excel input
  const topScrollRef = useRef(null);
  const tableScrollRef = useRef(null);
  const tableRef = useRef(null);
  const excelInputRef = useRef(null);
  const isSyncingScroll = useRef(false);

  const isGenap = (kategoriNama || '').toLowerCase().includes('genap');
  const daftarBulan = isGenap 
    ? ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni']
    : ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  useEffect(() => {
    if (tahunAjaran && selectedKelasDetail && selectedKategori) {
      loadData();
    } else {
      setData([]);
    }
    setVisibleMonths(daftarBulan);
  }, [tahunAjaran, selectedKelasDetail, selectedKategori, kategoriNama]);

  // Synchronize table width for the top horizontal scrollbar
  useEffect(() => {
    const updateWidth = () => {
      if (tableRef.current) {
        setTableWidth(tableRef.current.scrollWidth);
      }
    };
    updateWidth();
    const timer = setTimeout(updateWidth, 150);
    return () => clearTimeout(timer);
  }, [data, visibleMonths, type]);

  const handleTopScroll = () => {
    if (isSyncingScroll.current) return;
    if (topScrollRef.current && tableScrollRef.current) {
      isSyncingScroll.current = true;
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    }
  };

  const handleTableScroll = () => {
    if (isSyncingScroll.current) return;
    if (topScrollRef.current && tableScrollRef.current) {
      isSyncingScroll.current = true;
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    }
  };

  const scrollToStart = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
    if (topScrollRef.current) {
      topScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scrollToEnd = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ left: tableScrollRef.current.scrollWidth, behavior: 'smooth' });
    }
    if (topScrollRef.current) {
      topScrollRef.current.scrollTo({ left: topScrollRef.current.scrollWidth, behavior: 'smooth' });
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const raporData = await nilaiService.fetchRaporData({
        tahun_ajaran_id: tahunAjaran.id,
        kelas_id: selectedKelasDetail,
        kategori_evaluasi_id: selectedKategori
      });
      
      const initialized = raporData.map(item => {
        const detail = item.detail_absensi || {};
        const initializedDetail = {};
        daftarBulan.forEach(bulan => {
          initializedDetail[bulan] = detail[bulan] || { sakit: 0, izin: 0, alpa: 0 };
        });

        return {
          ...item,
          sakit: item.sakit || 0,
          izin: item.izin || 0,
          alpa: item.alpa || 0,
          detail_absensi: initializedDetail,
          keaktifan: item.keaktifan || null,
          akhlaq: item.akhlaq || null,
          kerapihan: item.kerapihan || null,
          catatan: item.catatan || '',
          keputusan_kenaikan: item.keputusan_kenaikan || ''
        };
      });
      setData(initialized);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data rapor');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data.length) return;
    try {
      setSaving(true);
      await nilaiService.saveRaporBulk({
        tahun_ajaran_id: tahunAjaran.id,
        kategori_evaluasi_id: selectedKategori,
        data: data
      });
      toast.success(`Data ${titles[type]} berhasil disimpan`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(`Gagal menyimpan data ${titles[type]}`);
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (santriId, field, value) => {
    setData(prev => prev.map(item => 
      item.santri_id === santriId ? { ...item, [field]: value } : item
    ));
  };

  const handleDetailValueChange = (santriId, bulan, field, value) => {
    setData(prev => prev.map(item => {
      if (item.santri_id === santriId) {
        const updatedDetail = {
          ...item.detail_absensi,
          [bulan]: {
            ...(item.detail_absensi[bulan] || { sakit: 0, izin: 0, alpa: 0 }),
            [field]: value === '' ? 0 : Number(value)
          }
        };

        let totalSakit = 0;
        let totalIzin = 0;
        let totalAlpa = 0;
        
        daftarBulan.forEach(b => {
          const det = updatedDetail[b] || { sakit: 0, izin: 0, alpa: 0 };
          totalSakit += det.sakit || 0;
          totalIzin += det.izin || 0;
          totalAlpa += det.alpa || 0;
        });

        return {
          ...item,
          detail_absensi: updatedDetail,
          sakit: totalSakit,
          izin: totalIzin,
          alpa: totalAlpa
        };
      }
      return item;
    }));
  };

  // Unduh Template Format Excel Absensi
  const handleExportTemplate = () => {
    if (!data.length) {
      toast.warning('Pilih kelas terlebih dahulu atau data santri kosong.');
      return;
    }

    try {
      const headers = ['No', 'NIS', 'Nama Santri'];
      daftarBulan.forEach(b => {
        headers.push(`${b} (Sakit)`);
        headers.push(`${b} (Izin)`);
        headers.push(`${b} (Alpa)`);
      });

      const rows = data.map((item, idx) => {
        const row = [idx + 1, item.nis || '', item.nama || ''];
        daftarBulan.forEach(b => {
          const d = item.detail_absensi?.[b] || { sakit: 0, izin: 0, alpa: 0 };
          row.push(d.sakit ?? 0);
          row.push(d.izin ?? 0);
          row.push(d.alpa ?? 0);
        });
        return row;
      });

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 32 },
        ...daftarBulan.flatMap(() => [{ wch: 12 }, { wch: 12 }, { wch: 12 }])
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi');

      const cleanKelas = (kelasName || 'Kelas').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Format_Absensi_${cleanKelas}_${tahunAjaran?.kode || ''}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success(`Template Excel berhasil diunduh: ${filename}`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh template Excel: ' + err.message);
    }
  };

  // Impor Data Absensi dari Excel
  const handleExcelImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson.length) {
          toast.error('Berkas Excel kosong atau lembar tidak memiliki data.');
          return;
        }

        let updatedCount = 0;

        setData(prevData => {
          return prevData.map(santri => {
            const cleanSantriName = (santri.nama || '').trim().toLowerCase();
            const cleanSantriNis = String(santri.nis || '').trim();

            const foundRow = rawJson.find(row => {
              const rowNis = String(row['NIS'] || row['nis'] || '').trim();
              const rowNama = String(row['Nama Santri'] || row['Nama'] || row['nama'] || row['nama_santri'] || '').trim().toLowerCase();

              if (cleanSantriNis && rowNis && cleanSantriNis === rowNis) return true;
              if (rowNama && cleanSantriName && (rowNama === cleanSantriName || cleanSantriName.includes(rowNama) || rowNama.includes(cleanSantriName))) return true;
              return false;
            });

            if (!foundRow) return santri;

            updatedCount++;

            const updatedDetail = { ...(santri.detail_absensi || {}) };

            daftarBulan.forEach(bulan => {
              const curMonthDetail = { ...(updatedDetail[bulan] || { sakit: 0, izin: 0, alpa: 0 }) };

              Object.keys(foundRow).forEach(colKey => {
                const normKey = colKey.toLowerCase();
                const normBulan = bulan.toLowerCase();
                if (normKey.includes(normBulan)) {
                  const val = Number(foundRow[colKey]) || 0;
                  if (normKey.includes('sakit') || normKey.endsWith(' s') || normKey.includes('-s') || normKey.includes('(s)')) {
                    curMonthDetail.sakit = Math.max(0, val);
                  } else if (normKey.includes('izin') || normKey.endsWith(' i') || normKey.includes('-i') || normKey.includes('(i)')) {
                    curMonthDetail.izin = Math.max(0, val);
                  } else if (normKey.includes('alpa') || normKey.includes('alpha') || normKey.endsWith(' a') || normKey.includes('-a') || normKey.includes('(a)')) {
                    curMonthDetail.alpa = Math.max(0, val);
                  }
                }
              });

              updatedDetail[bulan] = curMonthDetail;
            });

            let totalSakit = 0;
            let totalIzin = 0;
            let totalAlpa = 0;
            daftarBulan.forEach(b => {
              const det = updatedDetail[b] || { sakit: 0, izin: 0, alpa: 0 };
              totalSakit += det.sakit || 0;
              totalIzin += det.izin || 0;
              totalAlpa += det.alpa || 0;
            });

            return {
              ...santri,
              detail_absensi: updatedDetail,
              sakit: totalSakit,
              izin: totalIzin,
              alpa: totalAlpa
            };
          });
        });

        if (updatedCount > 0) {
          toast.success(`Berhasil mengimpor absensi ${updatedCount} santri! Klik "Simpan Data" untuk menyimpan permanen.`);
        } else {
          toast.warning('Tidak ada data santri yang cocok dengan NIS atau Nama di berkas Excel.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Gagal memproses berkas Excel: ' + err.message);
      } finally {
        if (excelInputRef.current) {
          excelInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAutoFillKenaikan = () => {
    let nextClass = '';
    const current = (kelasName || '').toLowerCase();
    
    if (current.includes('sifir')) nextClass = 'Satu';
    else if (current.includes('sp')) nextClass = 'Dua';
    else if (current.includes('1')) nextClass = 'Dua';
    else if (current.includes('2')) nextClass = 'Tiga';
    else if (current.includes('3')) nextClass = 'Empat';
    else if (current.includes('4')) nextClass = 'Lima';
    else if (current.includes('5')) nextClass = 'Enam';
    else if (current.includes('6')) {
      toast.info('Kelas 6 tidak memiliki tingkatan kelas selanjutnya.');
      return;
    }

    if (nextClass) {
      setData(prev => prev.map(item => ({ ...item, keputusan_kenaikan: `Naik ke Kelas ${nextClass}` })));
      toast.success(`Berhasil mengisi otomatis kenaikan ke Kelas ${nextClass}`);
    }
  };

  const handleAutoFillCatatan = () => {
    setData(prev => prev.map(item => ({ ...item, catatan: 'Tingkatkan lagi belajarnya!' })));
    toast.success(`Berhasil mengisi otomatis catatan motivasi wali kelas`);
  };

  const handleAutoFillKepribadian = () => {
    setData(prev => prev.map(item => ({ ...item, keaktifan: 'B', akhlaq: 'B', kerapihan: 'B' })));
    toast.success(`Berhasil mengisi otomatis kepribadian dengan predikat B`);
  };

  const titles = {
    absensi: 'Input Absensi',
    kepribadian: 'Input Nilai Kepribadian',
    catatan: 'Input Catatan Wali Kelas',
    kenaikan_kelas: 'Input Kenaikan Kelas'
  };

  const kepribadianOptions = [
    { value: 'A', label: 'A (Sangat Baik)' },
    { value: 'B', label: 'B (Baik)' },
    { value: 'C', label: 'C (Cukup)' },
    { value: 'D', label: 'D (Kurang)' }
  ];

  return (
    <div className="rapor-form-card frosted-card-rapor">
      
      {/* 1. Quick Class Selector directly inside Absensi, Kepribadian & Catatan */}
      {kelasList && kelasList.length > 0 && (
        <div className="rapor-class-switcher-bar">
          <div className="switcher-group">
            <div className="switcher-label-wrapper">
              <Layers size={14} className="switcher-icon" />
              <span className="switcher-title">Tingkatan:</span>
            </div>
            <div className="switcher-pills">
              {levels.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`switcher-pill-btn ${selectedTingkat === t ? 'active' : ''}`}
                  onClick={() => onSelectTingkat && onSelectTingkat(t)}
                >
                  {getTingkatLabel ? getTingkatLabel(t) : `Kelas ${t}`}
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
                {kelasList.filter(k => k.tingkat === selectedTingkat).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`switcher-pill-btn sub-class ${selectedKelasDetail === c.id ? 'active' : ''}`}
                    onClick={() => onSelectKelasDetail && onSelectKelasDetail(c.id)}
                  >
                    {c.nama}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Header with Title & Action Buttons */}
      <div className="rapor-form-header">
        <div className="header-title-box">
          <FileText size={18} className="header-icon" />
          <h3 className="header-title">{titles[type]} - {kelasName || 'Pilih Kelas'}</h3>
        </div>
        <div className="header-actions">
          {/* Excel Import & Download for Absensi */}
          {type === 'absensi' && (
            <>
              <input 
                type="file" 
                ref={excelInputRef} 
                accept=".xlsx, .xls, .csv" 
                style={{ display: 'none' }} 
                onChange={handleExcelImport}
              />
              <button
                type="button"
                className="btn-custom btn-secondary btn-auto"
                onClick={handleExportTemplate}
                disabled={!data.length}
                title="Unduh format file Excel berisi daftar nama santri kelas ini"
              >
                <Download size={14} />
                <span>Unduh Format Excel</span>
              </button>
              <button
                type="button"
                className="btn-custom btn-secondary btn-auto"
                onClick={() => excelInputRef.current?.click()}
                disabled={!selectedKelasDetail}
                title="Impor nilai absensi dari file Excel"
              >
                <Upload size={14} />
                <span>Impor Excel</span>
              </button>
            </>
          )}

          {type === 'kenaikan_kelas' && (
            <button 
              type="button" 
              className="btn-custom btn-secondary btn-auto" 
              onClick={handleAutoFillKenaikan} 
              disabled={!data.length}
            >
              <Sparkles size={14} />
              <span>Isi Otomatis</span>
            </button>
          )}
          {type === 'catatan' && (
            <button 
              type="button" 
              className="btn-custom btn-secondary btn-auto" 
              onClick={handleAutoFillCatatan} 
              disabled={!data.length}
            >
              <Sparkles size={14} />
              <span>Isi Otomatis</span>
            </button>
          )}
          {type === 'kepribadian' && (
            <button 
              type="button" 
              className="btn-custom btn-secondary btn-auto" 
              onClick={handleAutoFillKepribadian} 
              disabled={!data.length}
            >
              <Sparkles size={14} />
              <span>Isi B Semua</span>
            </button>
          )}
          <button 
            type="button" 
            className="btn-custom btn-primary" 
            onClick={handleSave} 
            loading={saving ? 'true' : undefined} 
            disabled={saving || !data.length}
          >
            <Save size={15} />
            <span>{saving ? 'Menyimpan...' : 'Simpan Data'}</span>
          </button>
        </div>
      </div>

      <div className="rapor-form-body">
        {type === 'absensi' && data.length > 0 && (
          <div className="month-toggles-container">
            <span className="toggle-label">Filter Bulan Kerja:</span>
            <div className="toggle-group-buttons">
              <button 
                type="button" 
                className={`toggle-btn-small ${visibleMonths.length === daftarBulan.length ? 'active' : ''}`}
                onClick={() => setVisibleMonths(daftarBulan)}
              >
                Tampilkan Semua
              </button>
              <button 
                type="button" 
                className={`toggle-btn-small danger ${visibleMonths.length === 0 ? 'active' : ''}`}
                onClick={() => setVisibleMonths([])}
              >
                Sembunyikan Semua
              </button>
              <div className="divider-vertical"></div>
              {daftarBulan.map(bulan => {
                const isVisible = visibleMonths.includes(bulan);
                return (
                  <button
                    key={bulan}
                    type="button"
                    className={`toggle-pill-item ${isVisible ? 'selected' : ''}`}
                    onClick={() => {
                      if (isVisible) {
                        setVisibleMonths(prev => prev.filter(m => m !== bulan));
                      } else {
                        setVisibleMonths(prev => [...prev, bulan]);
                      }
                    }}
                  >
                    {bulan} {isVisible && <Check size={11} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="rapor-loading-spinner">
            <div className="spinner"></div>
            <span>Memuat data form santri...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="rapor-empty-state">
            <AlertCircle size={40} className="empty-icon" />
            <span>
              {!selectedKelasDetail 
                ? "Silakan pilih tingkatan dan rincian kelas di atas untuk memulai." 
                : "Tidak ada data santri ditemukan pada kelas yang dipilih."}
            </span>
          </div>
        ) : (
          <>
            {/* 3. Top Horizontal Scroll Helper Bar for Absensi */}
            {type === 'absensi' && (
              <div className="top-scroll-helper-bar">
                <div className="top-scroll-info-row">
                  <span className="scroll-hint-text">
                    👉 Geser scrollbar di bawah ini untuk melihat bulan lainnya secara langsung:
                  </span>
                  <div className="quick-scroll-nav-btns">
                    <button 
                      type="button" 
                      className="quick-scroll-btn" 
                      onClick={scrollToStart}
                      title="Geser ke bulan awal"
                    >
                      <ChevronLeft size={13} />
                      <span>Bulan Awal</span>
                    </button>
                    <button 
                      type="button" 
                      className="quick-scroll-btn highlight" 
                      onClick={scrollToEnd}
                      title="Geser langsung ke bulan terakhir dan total"
                    >
                      <span>Bulan Terakhir</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
                <div 
                  className="top-scrollbar-track" 
                  ref={topScrollRef} 
                  onScroll={handleTopScroll}
                >
                  <div 
                    className="top-scrollbar-dummy" 
                    style={{ width: `${Math.max(tableWidth, 1200)}px`, height: '8px' }} 
                  />
                </div>
              </div>
            )}

            {/* 4. Table with Sticky Name Column and 1-line student name */}
            <div 
              className="table-responsive-rapor" 
              ref={tableScrollRef} 
              onScroll={handleTableScroll}
            >
              <table className="rapor-custom-table" ref={tableRef}>
                {type === 'absensi' ? (
                  <>
                    <thead>
                      <tr>
                        <th rowSpan={2} className="sticky-name-th" style={{ minWidth: '220px' }}>
                          Nama Santri
                        </th>
                        {daftarBulan.filter(b => visibleMonths.includes(b)).map(bulan => (
                          <th colSpan={3} key={bulan} className="bulan-header">{bulan}</th>
                        ))}
                        <th colSpan={3} className="total-header">Total Akumulasi</th>
                      </tr>
                      <tr>
                        {daftarBulan.filter(b => visibleMonths.includes(b)).flatMap(bulan => [
                          <th key={`${bulan}-s`} className="sub-th s-col">S</th>,
                          <th key={`${bulan}-i`} className="sub-th i-col">I</th>,
                          <th key={`${bulan}-a`} className="sub-th a-col">A</th>
                        ])}
                        <th className="sub-th s-col font-bold">S</th>
                        <th className="sub-th i-col font-bold">I</th>
                        <th className="sub-th a-col font-bold">A</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((record) => (
                        <tr key={record.santri_id}>
                          <td className="student-name-cell" title={record.nama}>
                            {record.nama}
                          </td>
                          {daftarBulan.filter(b => visibleMonths.includes(b)).flatMap(bulan => {
                            const valS = record.detail_absensi?.[bulan]?.sakit ?? 0;
                            const valI = record.detail_absensi?.[bulan]?.izin ?? 0;
                            const valA = record.detail_absensi?.[bulan]?.alpa ?? 0;
                            return [
                              <td key={`${record.santri_id}-${bulan}-s`} className="input-cell text-center">
                                <input 
                                  type="number" 
                                  className="number-cell-input" 
                                  min={0} 
                                  value={valS} 
                                  onChange={(e) => handleDetailValueChange(record.santri_id, bulan, 'sakit', e.target.value)}
                                />
                              </td>,
                              <td key={`${record.santri_id}-${bulan}-i`} className="input-cell text-center">
                                <input 
                                  type="number" 
                                  className="number-cell-input" 
                                  min={0} 
                                  value={valI} 
                                  onChange={(e) => handleDetailValueChange(record.santri_id, bulan, 'izin', e.target.value)}
                                />
                              </td>,
                              <td key={`${record.santri_id}-${bulan}-a`} className="input-cell text-center">
                                <input 
                                  type="number" 
                                  className="number-cell-input" 
                                  min={0} 
                                  value={valA} 
                                  onChange={(e) => handleDetailValueChange(record.santri_id, bulan, 'alpa', e.target.value)}
                                />
                              </td>
                            ];
                          })}
                          <td className="total-cell text-center font-bold text-s">{record.sakit}</td>
                          <td className="total-cell text-center font-bold text-i">{record.izin}</td>
                          <td className="total-cell text-center font-bold text-a">{record.alpa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead>
                      <tr>
                        <th style={{ width: '120px' }}>NIS</th>
                        <th className="sticky-name-th" style={{ minWidth: '220px' }}>Nama Santri</th>
                        {type === 'kepribadian' && (
                          <>
                            <th>Keaktifan</th>
                            <th>Akhlaq</th>
                            <th>Kerapihan</th>
                          </>
                        )}
                        {type === 'catatan' && <th>Catatan Pembimbing Wali Kelas</th>}
                        {type === 'kenaikan_kelas' && <th>Keputusan Kenaikan Kelas</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((record) => (
                        <tr key={record.santri_id}>
                          <td className="student-nis-cell">{record.nis || '-'}</td>
                          <td className="student-name-cell" title={record.nama}>{record.nama}</td>
                          {type === 'kepribadian' && (
                            <>
                              <td className="select-cell-rapor">
                                <CustomSelect
                                  value={record.keaktifan ? String(record.keaktifan) : ''}
                                  onChange={(val) => handleValueChange(record.santri_id, 'keaktifan', val || null)}
                                  options={kepribadianOptions}
                                  placeholder="Pilih Nilai"
                                  allowClear
                                />
                              </td>
                              <td className="select-cell-rapor">
                                <CustomSelect
                                  value={record.akhlaq ? String(record.akhlaq) : ''}
                                  onChange={(val) => handleValueChange(record.santri_id, 'akhlaq', val || null)}
                                  options={kepribadianOptions}
                                  placeholder="Pilih Nilai"
                                  allowClear
                                />
                              </td>
                              <td className="select-cell-rapor">
                                <CustomSelect
                                  value={record.kerapihan ? String(record.kerapihan) : ''}
                                  onChange={(val) => handleValueChange(record.santri_id, 'kerapihan', val || null)}
                                  options={kepribadianOptions}
                                  placeholder="Pilih Nilai"
                                  allowClear
                                />
                              </td>
                            </>
                          )}
                          {type === 'catatan' && (
                            <td className="textarea-cell-rapor">
                              <textarea
                                rows={2}
                                className="textarea-input-rapor"
                                value={record.catatan || ''}
                                onChange={(e) => handleValueChange(record.santri_id, 'catatan', e.target.value)}
                                placeholder="Tuliskan catatan motivasi pembimbing..."
                              />
                            </td>
                          )}
                          {type === 'kenaikan_kelas' && (
                            <td className="text-cell-rapor">
                              <input
                                type="text"
                                className="text-input-rapor"
                                value={record.keputusan_kenaikan || ''}
                                onChange={(e) => handleValueChange(record.santri_id, 'keputusan_kenaikan', e.target.value)}
                                placeholder="Contoh: Naik ke Kelas 2"
                              />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RaporSantriForms;

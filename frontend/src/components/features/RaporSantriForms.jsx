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
  Layers,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    const parsedVal = (value === '' || isNaN(Number(value))) ? 0 : Math.max(0, parseInt(value, 10));
    setData(prev => prev.map(item => {
      if (item.santri_id === santriId) {
        const updatedDetail = {
          ...item.detail_absensi,
          [bulan]: {
            ...(item.detail_absensi[bulan] || { sakit: 0, izin: 0, alpa: 0 }),
            [field]: parsedVal
          }
        };

        let totalSakit = 0;
        let totalIzin = 0;
        let totalAlpa = 0;
        
        daftarBulan.forEach(b => {
          const det = updatedDetail[b] || { sakit: 0, izin: 0, alpa: 0 };
          totalSakit += Number(det.sakit) || 0;
          totalIzin += Number(det.izin) || 0;
          totalAlpa += Number(det.alpa) || 0;
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

  // Unduh Rekapitulasi Absensi Lengkap (Excel)
  const handleExportExcel = () => {
    if (!data.length) {
      toast.warning('Pilih kelas terlebih dahulu atau data santri kosong.');
      return;
    }

    try {
      const cleanKelas = (kelasName || 'Kelas').trim();
      const taKode = tahunAjaran?.nama || tahunAjaran?.kode || '-';
      const semNama = kategoriNama || (isGenap ? 'Semester Genap' : 'Semester Ganjil');
      const cetakDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      // Title rows
      const titleRow0 = ['PONDOK PESANTREN AL-HAMID CINTAMULYA - MADRASAH DINIYAH'];
      const titleRow1 = [`REKAPITULASI ABSENSI BULANAN KELAS ${cleanKelas.toUpperCase()}`];
      const titleRow2 = [`Tahun Ajaran: ${taKode}   |   Semester: ${semNama}   |   Dicetak: ${cetakDate}`];
      const emptyRow = [];

      // Header 1: Month merged titles
      const headerRow1 = ['No', 'NIS', 'Nama Santri'];
      daftarBulan.forEach(b => {
        headerRow1.push(b.toUpperCase(), '', '');
      });
      headerRow1.push('TOTAL AKUMULASI', '', '');

      // Header 2: Sub columns S, I, A
      const headerRow2 = ['', '', ''];
      daftarBulan.forEach(() => {
        headerRow2.push('S', 'I', 'A');
      });
      headerRow2.push('S', 'I', 'A');

      // Col totals calculation
      const colTotals = {
        months: {},
        totalS: 0,
        totalI: 0,
        totalA: 0
      };
      daftarBulan.forEach(b => {
        colTotals.months[b] = { s: 0, i: 0, a: 0 };
      });

      // Data Rows
      const dataRows = data.map((item, idx) => {
        const row = [idx + 1, item.nis || '', item.nama || ''];
        daftarBulan.forEach(b => {
          const d = item.detail_absensi?.[b] || { sakit: 0, izin: 0, alpa: 0 };
          const s = d.sakit > 0 ? d.sakit : '';
          const i = d.izin > 0 ? d.izin : '';
          const a = d.alpa > 0 ? d.alpa : '';

          if (d.sakit > 0) colTotals.months[b].s += d.sakit;
          if (d.izin > 0) colTotals.months[b].i += d.izin;
          if (d.alpa > 0) colTotals.months[b].a += d.alpa;

          row.push(s, i, a);
        });

        const totS = item.sakit > 0 ? item.sakit : '';
        const totI = item.izin > 0 ? item.izin : '';
        const totA = item.alpa > 0 ? item.alpa : '';

        if (item.sakit > 0) colTotals.totalS += item.sakit;
        if (item.izin > 0) colTotals.totalI += item.izin;
        if (item.alpa > 0) colTotals.totalA += item.alpa;

        row.push(totS, totI, totA);
        return row;
      });

      // Summary Footer Row
      const footRow = ['JUMLAH TOTAL KELAS', '', ''];
      daftarBulan.forEach(b => {
        footRow.push(
          colTotals.months[b].s > 0 ? colTotals.months[b].s : '',
          colTotals.months[b].i > 0 ? colTotals.months[b].i : '',
          colTotals.months[b].a > 0 ? colTotals.months[b].a : ''
        );
      });
      footRow.push(
        colTotals.totalS > 0 ? colTotals.totalS : '',
        colTotals.totalI > 0 ? colTotals.totalI : '',
        colTotals.totalA > 0 ? colTotals.totalA : ''
      );

      const allRows = [titleRow0, titleRow1, titleRow2, emptyRow, headerRow1, headerRow2, ...dataRows, footRow];
      const worksheet = XLSX.utils.aoa_to_sheet(allRows);

      // Total columns count = 3 (No, NIS, Nama) + 6 * 3 + 3 = 24 (index 0 to 23)
      const lastColIndex = 23;

      // Merges
      worksheet['!merges'] = [
        // Title 0 (Pesantren)
        { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } },
        // Title 1 (Rekap Kelas)
        { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } },
        // Title 2 (Metadata)
        { s: { r: 2, c: 0 }, e: { r: 2, c: lastColIndex } },
        // No
        { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
        // NIS
        { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
        // Nama
        { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
        // Month headers
        ...daftarBulan.map((_, i) => ({
          s: { r: 4, c: 3 + i * 3 },
          e: { r: 4, c: 5 + i * 3 }
        })),
        // Total Akumulasi header
        { s: { r: 4, c: 3 + daftarBulan.length * 3 }, e: { r: 4, c: 5 + daftarBulan.length * 3 } },
        // Footer JUMLAH TOTAL KELAS
        { s: { r: allRows.length - 1, c: 0 }, e: { r: allRows.length - 1, c: 2 } }
      ];

      // Column widths
      worksheet['!cols'] = [
        { wch: 6 },  // No
        { wch: 14 }, // NIS
        { wch: 34 }, // Nama
        ...daftarBulan.flatMap(() => [{ wch: 6 }, { wch: 6 }, { wch: 6 }]),
        { wch: 7 }, { wch: 7 }, { wch: 7 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Absensi');

      const fileCleanName = cleanKelas.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Rekap_Absensi_${fileCleanName}_${tahunAjaran?.kode || ''}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success(`Rekapitulasi Excel berhasil diunduh: ${filename}`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh Excel: ' + err.message);
    }
  };

  // Unduh Rekapitulasi Absensi Lengkap (PDF)
  const handleExportPDF = () => {
    if (!data.length) {
      toast.warning('Pilih kelas terlebih dahulu atau data santri kosong.');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
      const cleanKelas = (kelasName || 'Kelas').trim();
      const taText = tahunAjaran?.nama || tahunAjaran?.kode || '-';
      const semText = kategoriNama || (isGenap ? 'Semester Genap' : 'Semester Ganjil');
      const cetakDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      // 1. Kop Madrasah & Pondok Pesantren Al-Hamid Cintamulya
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('MADRASAH DINIYAH AL-HAMID', pageWidth / 2, 9.5, { align: 'center' });

      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text('PONDOK PESANTREN AL-HAMID CINTAMULYA', pageWidth / 2, 14, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('Jl. S. Parman No 07 Desa Cintamulya, Kec. Candipuro Kab. Lampung Selatan | 081361380022 | alhamidcintamulya.com', pageWidth / 2, 18, { align: 'center' });

      // Double line separator kop
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.5);
      doc.line(10, 20.2, pageWidth - 10, 20.2);
      doc.setLineWidth(0.15);
      doc.line(10, 20.9, pageWidth - 10, 20.9);

      // 2. Judul Laporan
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`REKAPITULASI ABSENSI BULANAN KELAS ${cleanKelas.toUpperCase()}`, pageWidth / 2, 25.5, { align: 'center' });

      // 3. Metadata Bar (Ringkas & Proporsional)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);

      doc.text(`Kelas / Tingkat   : ${cleanKelas}`, 10, 29.5);
      doc.text(`Tahun Ajaran    : ${taText}`, 10, 33);

      doc.text(`Semester / Periode : ${semText}`, pageWidth - 10, 29.5, { align: 'right' });
      doc.text(`Tanggal Cetak         : ${cetakDate}`, pageWidth - 10, 33, { align: 'right' });

      // 4. Construct Table Data
      const headRow1 = [
        { content: 'NO', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'NIS', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'NAMA SANTRI', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
        ...daftarBulan.map(b => ({
          content: b.toUpperCase(),
          colSpan: 3,
          styles: { halign: 'center', valign: 'middle' }
        })),
        { content: 'TOTAL AKUMULASI', colSpan: 3, styles: { halign: 'center', valign: 'middle' } }
      ];

      const headRow2 = [
        ...daftarBulan.flatMap(() => [
          { content: 'S', styles: { halign: 'center' } },
          { content: 'I', styles: { halign: 'center' } },
          { content: 'A', styles: { halign: 'center' } }
        ]),
        { content: 'S', styles: { halign: 'center' } },
        { content: 'I', styles: { halign: 'center' } },
        { content: 'A', styles: { halign: 'center' } }
      ];

      const bodyRows = data.map((item, idx) => {
        const row = [
          idx + 1,
          item.nis || '-',
          (item.nama || '').trim()
        ];

        daftarBulan.forEach(b => {
          const d = item.detail_absensi?.[b] || { sakit: 0, izin: 0, alpa: 0 };
          const s = d.sakit > 0 ? d.sakit : '';
          const i = d.izin > 0 ? d.izin : '';
          const a = d.alpa > 0 ? d.alpa : '';
          row.push(s, i, a);
        });

        const totS = item.sakit > 0 ? item.sakit : '';
        const totI = item.izin > 0 ? item.izin : '';
        const totA = item.alpa > 0 ? item.alpa : '';
        row.push(totS, totI, totA);
        return row;
      });

      // Optimasi proporsional agar 100% muat 1 lembar (bahkan sampai 30-35 siswa)
      const totalStudents = data.length;
      let dynamicFontSize = 7.2;
      let dynamicCellPadding = 1.1;

      if (totalStudents > 20 && totalStudents <= 26) {
        dynamicFontSize = 7.0;
        dynamicCellPadding = 0.9;
      } else if (totalStudents > 26 && totalStudents <= 32) {
        dynamicFontSize = 6.6;
        dynamicCellPadding = 0.7;
      } else if (totalStudents > 32) {
        dynamicFontSize = 6.2;
        dynamicCellPadding = 0.5;
      }

      // AutoTable
      autoTable(doc, {
        head: [headRow1, headRow2],
        body: bodyRows,
        startY: 35.5,
        theme: 'grid',
        margin: { left: 10, right: 10, bottom: 6, top: 6 },
        styles: {
          fontSize: dynamicFontSize,
          cellPadding: dynamicCellPadding,
          font: 'helvetica',
          lineColor: [203, 213, 225],
          lineWidth: 0.15,
          textColor: [30, 41, 59],
          valign: 'middle'
        },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          lineWidth: 0.15,
          lineColor: [100, 116, 139],
          fontSize: dynamicFontSize
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 18, halign: 'center' },
          2: { cellWidth: 52, halign: 'left', fontStyle: 'bold' },
          ...Object.fromEntries(
            Array.from({ length: 18 }, (_, i) => [i + 3, { cellWidth: 9.5, halign: 'center' }])
          ),
          21: { cellWidth: 9.3, halign: 'center', fontStyle: 'bold', fillColor: [248, 250, 252] },
          22: { cellWidth: 9.3, halign: 'center', fontStyle: 'bold', fillColor: [248, 250, 252] },
          23: { cellWidth: 9.3, halign: 'center', fontStyle: 'bold', fillColor: [248, 250, 252] }
        },
        didDrawCell: (cellData) => {
          // Sub-header styling S (teal), I (amber), A (red)
          if (cellData.section === 'head' && cellData.row.index === 1) {
            const colIdx = cellData.column.index;
            if (colIdx >= 3) {
              const rem = (colIdx - 3) % 3;
              cellData.cell.styles.fillColor = [241, 245, 249];
              if (rem === 0) cellData.cell.styles.textColor = [15, 118, 110];
              else if (rem === 1) cellData.cell.styles.textColor = [217, 119, 6];
              else if (rem === 2) cellData.cell.styles.textColor = [220, 38, 38];
            }
          }
          // Highlight Alfa in body rows
          if (cellData.section === 'body' && cellData.column.index >= 3) {
            const rem = (cellData.column.index - 3) % 3;
            const val = cellData.cell.raw;
            if (rem === 2 && val && val !== '') {
              cellData.cell.styles.textColor = [220, 38, 38];
              cellData.cell.styles.fontStyle = 'bold';
            }
          }
        },
        didDrawPage: () => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184);
          doc.text('Sistem Informasi Pesantren Al-Hamid Cintamulya', 10, pageHeight - 4);
        }
      });

      const fileCleanName = cleanKelas.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Rekap_Absensi_${fileCleanName}_${tahunAjaran?.kode || ''}.pdf`;
      doc.save(filename);
      toast.success(`Rekapitulasi PDF berhasil diunduh: ${filename}`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Gagal membuat dokumen PDF: ' + err.message);
    }
  };

  // Unduh Template Format Excel Absensi (Khusus untuk Re-impor)
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
          row.push(d.sakit > 0 ? d.sakit : '');
          row.push(d.izin > 0 ? d.izin : '');
          row.push(d.alpa > 0 ? d.alpa : '');
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
      toast.success(`Format Impor Excel berhasil diunduh: ${filename}`);
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
          {/* Excel & PDF Actions for Absensi */}
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
                onClick={handleExportExcel}
                disabled={!data.length}
                title="Unduh rekapitulasi absensi bulanan lengkap dalam format Excel (.xlsx)"
              >
                <FileSpreadsheet size={14} className="text-emerald-600" />
                <span>Unduh Excel</span>
              </button>
              <button
                type="button"
                className="btn-custom btn-secondary btn-auto"
                onClick={handleExportPDF}
                disabled={!data.length}
                title="Unduh rekapitulasi absensi bulanan resmi & rapi dalam format PDF (.pdf)"
              >
                <Printer size={14} className="text-rose-600" />
                <span>Unduh PDF</span>
              </button>
              <button
                type="button"
                className="btn-custom btn-secondary btn-auto"
                onClick={handleExportTemplate}
                disabled={!data.length}
                title="Unduh format spreadsheet khusus untuk impor data santri kelas ini"
              >
                <Download size={14} />
                <span>Format Impor</span>
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
                            const rawS = record.detail_absensi?.[bulan]?.sakit ?? 0;
                            const rawI = record.detail_absensi?.[bulan]?.izin ?? 0;
                            const rawA = record.detail_absensi?.[bulan]?.alpa ?? 0;

                            const numS = Number(rawS) || 0;
                            const numI = Number(rawI) || 0;
                            const numA = Number(rawA) || 0;

                            return [
                              <td key={`${record.santri_id}-${bulan}-s`} className="input-cell text-center">
                                <input 
                                  type="number" 
                                  className={`number-cell-input ${numS > 0 ? 'has-value val-s' : 'is-empty'}`} 
                                  min={0} 
                                  value={numS > 0 ? numS : ''} 
                                  placeholder=""
                                  onChange={(e) => handleDetailValueChange(record.santri_id, bulan, 'sakit', e.target.value)}
                                />
                              </td>,
                              <td key={`${record.santri_id}-${bulan}-i`} className="input-cell text-center">
                                <input 
                                  type="number" 
                                  className={`number-cell-input ${numI > 0 ? 'has-value val-i' : 'is-empty'}`} 
                                  min={0} 
                                  value={numI > 0 ? numI : ''} 
                                  placeholder=""
                                  onChange={(e) => handleDetailValueChange(record.santri_id, bulan, 'izin', e.target.value)}
                                />
                              </td>,
                              <td key={`${record.santri_id}-${bulan}-a`} className="input-cell text-center">
                                <input 
                                  type="number" 
                                  className={`number-cell-input ${numA > 0 ? 'has-value val-a' : 'is-empty'}`} 
                                  min={0} 
                                  value={numA > 0 ? numA : ''} 
                                  placeholder=""
                                  onChange={(e) => handleDetailValueChange(record.santri_id, bulan, 'alpa', e.target.value)}
                                />
                              </td>
                            ];
                          })}
                          <td className={`total-cell text-center font-bold text-s ${record.sakit > 0 ? 'has-val' : 'is-empty'}`}>
                            {record.sakit > 0 ? record.sakit : ''}
                          </td>
                          <td className={`total-cell text-center font-bold text-i ${record.izin > 0 ? 'has-val' : 'is-empty'}`}>
                            {record.izin > 0 ? record.izin : ''}
                          </td>
                          <td className={`total-cell text-center font-bold text-a ${record.alpa > 0 ? 'has-val' : 'is-empty'}`}>
                            {record.alpa > 0 ? record.alpa : ''}
                          </td>
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

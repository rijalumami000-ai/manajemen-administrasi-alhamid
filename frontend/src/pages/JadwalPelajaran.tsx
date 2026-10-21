import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  BookOpen, 
  User, 
  Edit3, 
  AlertTriangle,
  RefreshCw,
  Trash2,
  Printer,
  FileDown,
  LayoutGrid
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { jadwalService } from '../services/jadwalService';
import { guruService } from '../services/guruService';
import { nilaiService } from '../services/nilaiService';
import { CustomModal } from '../components/ui/CustomModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SmartAlert } from '../components/ui/SmartAlert';
import { useToast } from '../components/common';
import type { 
  JadwalItem, 
  TahunAjaranItem, 
  KelasItem, 
  GuruItem, 
  MapelItem, 
  EditingSlotState, 
  ClashWarningState, 
  ClearConfirmState 
} from '../types/jadwal';
import './JadwalPelajaran.scss';

const LIST_MALAM = [
  'Malam Ahad',
  'Malam Senin',
  'Malam Selasa',
  'Malam Rabu',
  'Malam Kamis',
  'Malam Sabtu'
];

export function JadwalPelajaran() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  // Settings / Master States
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranItem[]>([]);
  const [selectedTahunId, setSelectedTahunId] = useState<number | null>(null);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);
  const [guruList, setGuruList] = useState<GuruItem[]>([]);
  const [mapelList, setMapelList] = useState<MapelItem[]>([]);

  // Data States
  const [loading, setLoading] = useState<boolean>(false);
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [activeTab, setActiveTab] = useState<'per_kelas' | 'master_matrix'>('per_kelas');

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<EditingSlotState | null>(null);
  const [selectedMapelId, setSelectedMapelId] = useState<string | null>(null);
  const [selectedGuruId, setSelectedGuruId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [clashWarning, setClashWarning] = useState<ClashWarningState | null>(null);

  // Custom Confirm modal for clearing slot
  const [clearConfirm, setClearConfirm] = useState<ClearConfirmState>({
    isOpen: false,
    kelasId: null,
    malam: '',
    jamKe: null,
    kelasNama: ''
  });

  // Initialize master data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const years: TahunAjaranItem[] = await nilaiService.fetchTahunAjaran();
        setTahunAjaranList(years);
        const activeYear = years.find(y => y.is_active);
        if (activeYear) {
          setSelectedTahunId(activeYear.id);
        } else if (years.length > 0) {
          setSelectedTahunId(years[0].id);
        }

        const classes: KelasItem[] = await nilaiService.fetchKelas();
        const diniyahClasses = classes.filter(k => k.jenis === 'Diniyah');

        const getTingkatOrder = (k: KelasItem) => {
          const name = (k.nama || '').toLowerCase();
          if (name.includes('sifir')) return 0;
          if (name.startsWith('1') || name.includes('kelas 1')) return 1;
          if (name === 'sp' || name.startsWith('sp') || name.includes('sp ')) return 1.5;
          if (name.startsWith('2') || name.includes('kelas 2')) return 2;
          if (name.startsWith('3') || name.includes('kelas 3')) return 3;
          if (name.startsWith('4') || name.includes('kelas 4')) return 4;
          if (name.startsWith('5') || name.includes('kelas 5')) return 5;
          if (name.startsWith('6') || name.includes('kelas 6')) return 6;
          if (k.tingkat === 99) return 1.5;
          return k.tingkat ?? 999;
        };

        diniyahClasses.sort((a, b) => {
          const orderA = getTingkatOrder(a);
          const orderB = getTingkatOrder(b);
          if (orderA !== orderB) return orderA - orderB;
          return (a.nama || '').localeCompare(b.nama || '');
        });

        setKelasList(diniyahClasses);
        if (diniyahClasses.length > 0) {
          setSelectedKelasId(diniyahClasses[0].id);
        }

        const gurus: GuruItem[] = await guruService.fetchGuru();
        setGuruList(gurus || []);

        const mapels: MapelItem[] = await guruService.fetchMataPelajaran();
        setMapelList(mapels || []);
      } catch (err) {
        console.error('Error initializing jadwal data:', err);
        toast.error('Gagal menginisialisasi data pengaturan jadwal.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // Fetch schedules when academic year changes
  const loadJadwal = async () => {
    if (!selectedTahunId) return;
    setLoading(true);
    try {
      const data: JadwalItem[] = await jadwalService.fetchJadwal(selectedTahunId);
      setJadwalList(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal memuat data jadwal pelajaran: ' + (err?.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJadwal();
  }, [selectedTahunId]);

  // Handle slot editing
  const handleOpenEdit = (kelasId: number, malam: string, jamKe: number) => {
    const existing = jadwalList.find(
      j => j.kelas_id === kelasId && j.malam === malam && j.jam_ke === jamKe
    );

    const classObj = kelasList.find(k => k.id === kelasId);

    setEditingSlot({ 
      kelas_id: kelasId, 
      malam, 
      jam_ke: jamKe,
      kelasNama: classObj?.nama || 'Kelas'
    });
    const existingMapel = existing?.mata_pelajaran_id ?? existing?.mapel_id;
    setSelectedMapelId(existingMapel ? String(existingMapel) : null);
    setSelectedGuruId(existing?.guru_id ? String(existing.guru_id) : null);
    setClashWarning(null);
    setEditModalOpen(true);
  };

  // Clash detection when choosing a teacher in modal
  useEffect(() => {
    if (!editingSlot || !selectedGuruId) {
      setClashWarning(null);
      return;
    }

    const numericGuruId = Number(selectedGuruId);

    // Find if this teacher is already teaching at the same night & period in ANOTHER class
    const clash = jadwalList.find(
      j => j.guru_id === numericGuruId &&
           j.malam === editingSlot.malam &&
           j.jam_ke === editingSlot.jam_ke &&
           j.kelas_id !== editingSlot.kelas_id
    );

    if (clash) {
      const className = kelasList.find(k => k.id === clash.kelas_id)?.nama || 'Kelas Lain';
      const teacherName = guruList.find(g => g.id === numericGuruId)?.nama || 'Guru';
      setClashWarning({
        message: `Bentrokan Jadwal Mengajar!`,
        description: `${teacherName} sudah dijadwalkan mengajar di ${className} pada ${editingSlot.malam} Jam ke-${editingSlot.jam_ke}.`
      });
    } else {
      setClashWarning(null);
    }
  }, [selectedGuruId, editingSlot, jadwalList, kelasList, guruList]);

  // Save schedule slot
  const handleSaveJadwal = async () => {
    if (!editingSlot || !selectedTahunId) return;

    // Check if slot was previously set and is now being cleared
    const existing = jadwalList.find(
      j => j.kelas_id === editingSlot.kelas_id && j.malam === editingSlot.malam && j.jam_ke === editingSlot.jam_ke
    );
    
    if (existing && !selectedMapelId && !selectedGuruId) {
      const classObj = kelasList.find(k => k.id === editingSlot.kelas_id);
      setEditModalOpen(false);
      setClearConfirm({
        isOpen: true,
        kelasId: editingSlot.kelas_id,
        malam: editingSlot.malam,
        jamKe: editingSlot.jam_ke,
        kelasNama: classObj ? classObj.nama : 'Kelas'
      });
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        tahun_ajaran_id: selectedTahunId,
        kelas_id: editingSlot.kelas_id,
        malam: editingSlot.malam,
        jam_ke: editingSlot.jam_ke,
        mata_pelajaran_id: selectedMapelId ? Number(selectedMapelId) : null,
        guru_id: selectedGuruId ? Number(selectedGuruId) : null
      };

      await jadwalService.saveJadwal(payload);
      toast.success('Jadwal pelajaran berhasil disimpan.');
      setEditModalOpen(false);
      loadJadwal();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menyimpan jadwal: ' + (err?.message || 'Error'));
    } finally {
      setSaveLoading(false);
    }
  };

  // Trigger confirm modal for clearing slot
  const handleClearSlotClick = (kelasId: number, malam: string, jamKe: number) => {
    const classObj = kelasList.find(k => k.id === kelasId);
    setClearConfirm({
      isOpen: true,
      kelasId,
      malam,
      jamKe,
      kelasNama: classObj ? classObj.nama : 'Kelas'
    });
  };

  // Perform clear slot
  const handleConfirmClearSlot = async () => {
    const { kelasId, malam, jamKe } = clearConfirm;
    if (!kelasId || !selectedTahunId || !jamKe) return;

    setLoading(true);
    try {
      const payload = {
        tahun_ajaran_id: selectedTahunId,
        kelas_id: kelasId,
        malam: malam,
        jam_ke: jamKe,
        mata_pelajaran_id: null,
        guru_id: null
      };

      await jadwalService.saveJadwal(payload);
      toast.success('Slot jadwal berhasil dikosongkan.');
      setClearConfirm({ isOpen: false, kelasId: null, malam: '', jamKe: null, kelasNama: '' });
      loadJadwal();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengosongkan slot: ' + (err?.message || 'Error'));
      setLoading(false);
    }
  };

  // Date Formatter helper
  const getFormattedDate = () => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const d = new Date();
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Export PDF custom
  const exportJadwalPDF = () => {
    try {
      const activeTAObj = tahunAjaranList.find(y => y.id === selectedTahunId);
      const taKode = activeTAObj ? activeTAObj.kode : '';
      
      if (activeTab === 'per_kelas') {
        const targetKelas = kelasList.find(k => k.id === selectedKelasId);
        if (!targetKelas) {
          toast.error('Silakan pilih kelas terlebih dahulu.');
          return;
        }

        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('PONDOK PESANTREN AL-HAMID', 105, 16, { align: 'center' });
        doc.setFontSize(12);
        doc.text('MADRASAH DINIYAH', 105, 22, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`JADWAL PELAJARAN HARIAN - TAHUN AJARAN ${taKode}`, 105, 28, { align: 'center' });
        doc.text(`KELAS: ${targetKelas.nama.toUpperCase()}`, 105, 34, { align: 'center' });

        doc.setLineWidth(0.5);
        doc.line(15, 38, 195, 38);

        const tableData: any[] = [];
        LIST_MALAM.forEach(malam => {
          const j1 = jadwalList.find(j => j.kelas_id === selectedKelasId && j.malam === malam && j.jam_ke === 1);
          const j2 = jadwalList.find(j => j.kelas_id === selectedKelasId && j.malam === malam && j.jam_ke === 2);

          const s1 = j1?.mata_pelajaran_nama || j1?.mapel_nama;
          const s2 = j2?.mata_pelajaran_nama || j2?.mapel_nama;
          const g1 = j1?.guru_nama || j1?.guru_panggilan;
          const g2 = j2?.guru_nama || j2?.guru_panggilan;

          tableData.push([
            malam,
            'Jam Ke-1\n(19.30 - 20.30)',
            j1 && s1 ? `${s1}\nUst. ${g1 || '-'}` : 'Draf Kosong'
          ]);

          tableData.push([
            malam,
            'Jam Ke-2\n(20.30 - 21.30)',
            j2 && s2 ? `${s2}\nUst. ${g2 || '-'}` : 'Draf Kosong'
          ]);
        });

        autoTable(doc, {
          head: [['Malam', 'Waktu Belajar', 'Mata Pelajaran & Pengajar']],
          body: tableData,
          startY: 42,
          theme: 'grid',
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle'
          },
          styles: {
            fontSize: 9,
            cellPadding: 4,
            valign: 'middle'
          },
          columnStyles: {
            0: { width: 35, fontStyle: 'bold', halign: 'center' },
            1: { width: 45, halign: 'center' },
            2: { width: 100 }
          },
          didParseCell: (data) => {
            if (data.column.index === 0 && data.section === 'body') {
              const rowIndex = data.row.index;
              if (rowIndex % 2 === 0) {
                data.cell.rowSpan = 2;
              }
            }
          }
        });

        const sigY = (doc as any).lastAutoTable.finalY + 15;
        const formattedDate = getFormattedDate();

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Mengetahui,', 30, sigY);
        doc.text('Kepala Madrasah Diniyah', 30, sigY + 5);
        doc.line(30, sigY + 25, 75, sigY + 25);

        doc.text(`Jakarta, ${formattedDate}`, 140, sigY);
        doc.text('Wali Kelas', 140, sigY + 5);
        doc.line(140, sigY + 25, 180, sigY + 25);

        doc.save(`Jadwal_Diniyah_${targetKelas.nama.replace(/\s+/g, '_')}_${taKode.replace(/\//g, '-')}.pdf`);
      } else {
        // Master matrix export
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('PONDOK PESANTREN AL-HAMID - MADRASAH DINIYAH', 148, 16, { align: 'center' });
        doc.setFontSize(11);
        doc.text(`MATRIKS MASTER JADWAL PELAJARAN HARIAN - SEMUA KELAS (${taKode})`, 148, 22, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.line(15, 26, 282, 26);

        const headers = [['Malam', 'Jam', ...kelasList.map(k => k.nama)]];
        const body: any[] = [];

        LIST_MALAM.forEach(malam => {
          [1, 2].forEach(jamKe => {
            const rowData: string[] = [malam, `Ke-${jamKe}`];
            kelasList.forEach(k => {
              const match = jadwalList.find(j => j.kelas_id === k.id && j.malam === malam && j.jam_ke === jamKe);
              const subjectName = match?.mata_pelajaran_nama || match?.mapel_nama;
              const teacherName = match?.guru_nama || match?.guru_panggilan;
              if (match && subjectName) {
                rowData.push(`${subjectName}\n(${teacherName || 'Ust'})`);
              } else {
                rowData.push('-');
              }
            });
            body.push(rowData);
          });
        });

        const classColWidth = Math.floor(215 / (kelasList.length || 1));
        const columnStyles: any = {
          0: { cellWidth: 32, fontStyle: 'bold', fillColor: [245, 247, 250], valign: 'middle', halign: 'center' },
          1: { cellWidth: 18, fontStyle: 'bold', fillColor: [245, 247, 250], valign: 'middle', halign: 'center' }
        };
        for (let i = 2; i < 2 + kelasList.length; i++) {
          columnStyles[i] = { cellWidth: classColWidth, fontSize: 8 };
        }

        autoTable(doc, {
          head: headers,
          body: body,
          startY: 32,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'center',
            valign: 'middle',
            lineColor: [180, 180, 180],
            lineWidth: 0.1
          },
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: columnStyles,
          margin: { left: 15, right: 15 },
          didParseCell: (data) => {
            if (data.column.index === 0 && data.section === 'body') {
              const rowIndex = data.row.index;
              if (rowIndex % 2 === 0) {
                data.cell.rowSpan = 2;
              }
            }
          }
        });

        doc.save(`Matriks_Master_Jadwal_Diniyah_${taKode.replace(/\//g, '-')}.pdf`);
      }
      toast.success('Ekspor PDF jadwal berhasil diunduh.');
    } catch (error: any) {
      console.error('Gagal ekspor PDF:', error);
      toast.error('Gagal membuat file PDF: ' + (error?.message || 'Error'));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Views Helpers ---

  // 1. Render card cell content
  const renderCellContent = (kelasId: number, malam: string, jamKe: number) => {
    const slot = jadwalList.find(
      j => j.kelas_id === kelasId && j.malam === malam && j.jam_ke === jamKe
    );

    const subjectName = slot?.mata_pelajaran_nama || slot?.mapel_nama;
    const teacherName = slot?.guru_nama || slot?.guru_panggilan;
    const hasAdminAccess = typeof isAdmin === 'function' ? (isAdmin as () => boolean)() : Boolean(isAdmin);

    if (!slot || !subjectName) {
      return (
        <div className="empty-slot-card">
          <span className="empty-slot-label">Slot Belum Terisi</span>
          {hasAdminAccess && (
            <button 
              type="button" 
              onClick={() => handleOpenEdit(kelasId, malam, jamKe)}
              className="btn-slot-add"
              title="Isi Slot Jadwal"
            >
              <Edit3 size={12} />
              <span>Atur Pelajaran</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="filled-slot-card">
        <div className="slot-info-col">
          <div className="subject-row">
            <BookOpen size={14} className="slot-badge-icon" />
            <span className="subject-name" title={subjectName}>
              {subjectName}
            </span>
          </div>
          <div className="teacher-row">
            <User size={13} className="slot-badge-icon teacher-icon" />
            <span className="teacher-name" title={teacherName || ''}>
              {teacherName || 'Belum Ditentukan'}
            </span>
          </div>
        </div>

        {hasAdminAccess && (
          <div className="slot-action-btns">
            <button 
              type="button"
              onClick={() => handleOpenEdit(kelasId, malam, jamKe)}
              className="btn-slot-act edit-act"
              title="Edit Slot Pelajaran"
            >
              <Edit3 size={13} />
            </button>
            <button 
              type="button"
              onClick={() => handleClearSlotClick(kelasId, malam, jamKe)}
              className="btn-slot-act delete-act"
              title="Kosongkan Slot"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // 2. TIMETABLE VIEW (Per Kelas)
  const renderTimetableView = () => {
    const targetKelas = kelasList.find(k => k.id === selectedKelasId);
    if (!targetKelas) return <div className="no-data-msg">Silakan pilih kelas terlebih dahulu.</div>;

    return (
      <div className="timetable-container" id="printable-timetable">
        <div className="timetable-grid">
          {LIST_MALAM.map(malam => (
            <div key={malam} className="malam-row-card">
              <div className="malam-header-badge">
                <span className="malam-icon-tag">Malam Belajar</span>
                <h4 className="malam-title">{malam}</h4>
              </div>
              <div className="periods-row">
                {/* Jam 1 */}
                <div className="period-box">
                  <div className="period-label">
                    <Clock size={12} />
                    <span>Jam Pertama (Ke-1) • 19.30 - 20.30</span>
                  </div>
                  <div className="period-content">
                    {renderCellContent(selectedKelasId!, malam, 1)}
                  </div>
                </div>

                {/* Jam 2 */}
                <div className="period-box">
                  <div className="period-label">
                    <Clock size={12} />
                    <span>Jam Kedua (Ke-2) • 20.30 - 21.30</span>
                  </div>
                  <div className="period-content">
                    {renderCellContent(selectedKelasId!, malam, 2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 3. MASTER MATRIX VIEW (All Classes Grid Table)
  const renderMatrixView = () => {
    if (kelasList.length === 0) return <div className="no-data-msg">Memuat kelas...</div>;

    const dataSource: any[] = [];
    LIST_MALAM.forEach(malam => {
      [1, 2].forEach(jamKe => {
        dataSource.push({ malam, jam_ke: jamKe });
      });
    });

    return (
      <div className="matrix-table-card">
        <div className="table-responsive">
          <table className="matrix-modern-table">
            <thead>
              <tr>
                <th style={{ width: '130px', textAlign: 'center' }}>Malam</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Jam Ke</th>
                {kelasList.map(kelas => (
                  <th key={kelas.id} style={{ minWidth: '170px', textAlign: 'center' }}>
                    <span className="matrix-th-kelas">{kelas.nama}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataSource.map((row, idx) => {
                const isEvenRow = idx % 2 === 0;

                return (
                  <tr key={`${row.malam}-${row.jam_ke}`}>
                    {isEvenRow && (
                      <td rowSpan={2} className="matrix-malam-cell">
                        <span className="matrix-malam-label">{row.malam}</span>
                      </td>
                    )}
                    <td className="matrix-period-cell">
                      <span className="period-pill">Jam {row.jam_ke}</span>
                    </td>
                    {kelasList.map(kelas => (
                      <td key={kelas.id} className="matrix-slot-cell">
                        {renderCellContent(kelas.id, row.malam, row.jam_ke)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const taOptions = tahunAjaranList.map(ta => ({
    value: String(ta.id),
    label: `${ta.kode} ${ta.is_active ? '(Aktif)' : ''}`
  }));

  const classOptions = kelasList.map(k => ({
    value: String(k.id),
    label: k.nama
  }));

  const mapelOptions = mapelList.map(m => ({
    value: String(m.id),
    label: m.nama
  }));

  const guruOptions = guruList.map(g => ({
    value: String(g.id),
    label: g.nama
  }));

  return (
    <div className="jadwal-pelajaran-page">
      {/* ─── 1. APPLE FLOATING DOCK HEADER ───────────────────────── */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Jadwal Pelajaran Harian</h2>
          <p className="page-subtitle">Kelola pembagian kelas, malam belajar, mata pelajaran, dan asatidz/ustadzah</p>
        </div>

        <div className="header-actions-row">
          {/* Tahun Ajaran Selector */}
          <div className="tahun-ajaran-select" style={{ minWidth: '180px' }}>
            <CustomSelect
              value={selectedTahunId ? String(selectedTahunId) : ''}
              onChange={(val) => setSelectedTahunId(val ? Number(val) : null)}
              options={taOptions}
              disabled={loading}
              placeholder="Pilih Tahun Ajaran"
            />
          </div>

          <button 
            type="button"
            onClick={exportJadwalPDF}
            className="action-pill-btn primary-pill"
          >
            <FileDown size={15} />
            <span>Ekspor PDF</span>
          </button>

          <button 
            type="button" 
            onClick={handlePrint}
            className="action-pill-btn"
          >
            <Printer size={15} />
            <span>Cetak Jadwal</span>
          </button>

          <button 
            type="button" 
            className="action-pill-btn"
            onClick={loadJadwal}
            disabled={loading}
            title="Segarkan Jadwal"
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>
      </header>

      {/* ─── 2. APPLE SEGMENTED CONTROL TABS ─────────────────────── */}
      <div className="tactile-tabs-row">
        <div className="tactile-segmented-control" role="tablist">
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === 'per_kelas'}
            className={`segment-btn ${activeTab === 'per_kelas' ? 'active' : ''}`}
            onClick={() => setActiveTab('per_kelas')}
          >
            <Clock size={15} />
            <span>Jadwal Per Kelas</span>
          </button>
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === 'master_matrix'}
            className={`segment-btn ${activeTab === 'master_matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('master_matrix')}
          >
            <LayoutGrid size={15} />
            <span>Matriks Master (Semua Kelas)</span>
          </button>
        </div>

        {activeTab === 'per_kelas' && (
          <div className="class-filter-pill-box">
            <span className="filter-pill-label">Kelas:</span>
            <div style={{ width: '200px' }}>
              <CustomSelect
                value={selectedKelasId ? String(selectedKelasId) : ''}
                onChange={(val) => setSelectedKelasId(val ? Number(val) : null)}
                options={classOptions}
                placeholder="Pilih Kelas"
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. MAIN CONTENT AREA ─────────────────────────────────── */}
      <div className="content-layout">
        {loading ? (
          <div className="loading-container">
            <RefreshCw size={36} className="spin-anim mb-3" style={{ color: '#3b82f6' }} />
            <p style={{ fontWeight: 600, color: '#475569' }}>Memuat jadwal pelajaran harian...</p>
          </div>
        ) : activeTab === 'per_kelas' ? (
          renderTimetableView()
        ) : (
          renderMatrixView()
        )}
      </div>

      {/* ─── 4. MODAL EDIT SLOT JADWAL ────────────────────────────── */}
      <CustomModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Slot Pelajaran"
        maxWidth="max-w-md"
      >
        <div className="modal-content-wrap">
          {/* Active slot banner */}
          <div className="modal-subtab-banner">
            <div>
              <span className="banner-label">Kelas:</span>
              <strong className="banner-value">{editingSlot?.kelasNama}</strong>
            </div>
            <span className="banner-tab-tag">
              {editingSlot?.malam} • Jam {editingSlot?.jam_ke}
            </span>
          </div>

          {clashWarning && (
            <div style={{ marginBottom: '14px' }}>
              <SmartAlert
                message={clashWarning.message}
                description={clashWarning.description}
                type="warning"
              />
            </div>
          )}

          <div className="modal-form-group">
            <label className="modal-label">Mata Pelajaran:</label>
            <CustomSelect
              value={selectedMapelId}
              onChange={setSelectedMapelId}
              options={mapelOptions}
              placeholder="-- Pilih Mata Pelajaran --"
              allowClear
              disabled={saveLoading}
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Ustadz / Ustadzah (Pengajar):</label>
            <CustomSelect
              value={selectedGuruId}
              onChange={setSelectedGuruId}
              options={guruOptions}
              placeholder="-- Pilih Asatidz / Pengajar --"
              allowClear
              disabled={saveLoading}
            />
          </div>

          <p className="modal-info-note">
            💡 <em>Catatan:</em> Kosongkan kedua pilihan di atas jika ingin menghapus/mengosongkan jadwal pada slot ini.
          </p>

          <div className="modal-footer-row">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={() => setEditModalOpen(false)}
              disabled={saveLoading}
            >
              Batal
            </button>
            <button
              type="button"
              className="modal-btn-submit"
              onClick={handleSaveJadwal}
              disabled={saveLoading}
            >
              {saveLoading && <RefreshCw size={14} className="spin-anim" />}
              <span>Simpan Jadwal</span>
            </button>
          </div>
        </div>
      </CustomModal>

      {/* ─── 5. MODAL KONFIRMASI KOSONGKAN SLOT ───────────────────── */}
      <CustomModal
        isOpen={clearConfirm.isOpen}
        onClose={() => setClearConfirm({ isOpen: false, kelasId: null, malam: '', jamKe: null, kelasNama: '' })}
        title="Kosongkan Slot Pelajaran"
        maxWidth="max-w-md"
      >
        <div>
          <div className="delete-confirm-box">
            <AlertTriangle className="delete-warning-icon" size={24} />
            <div className="delete-warning-text">
              Apakah Anda yakin ingin menghapus jadwal pelajaran pada kelas <strong>{clearConfirm.kelasNama}</strong> untuk <strong>{clearConfirm.malam}</strong> Jam <strong>ke-{clearConfirm.jamKe}</strong>?
            </div>
          </div>
          <div className="modal-footer-row">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={() => setClearConfirm({ isOpen: false, kelasId: null, malam: '', jamKe: null, kelasNama: '' })}
            >
              Batal
            </button>
            <button
              type="button"
              className="modal-btn-submit"
              style={{ background: 'linear-gradient(180deg, #f43f5e 0%, #e11d48 100%)', boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)' }}
              onClick={handleConfirmClearSlot}
            >
              Ya, Kosongkan
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default JadwalPelajaran;

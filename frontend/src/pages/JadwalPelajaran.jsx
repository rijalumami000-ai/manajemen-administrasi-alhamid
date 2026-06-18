import React, { useState, useEffect } from 'react';
import { 
  Select, 
  Card, 
  Button, 
  Modal, 
  Spin, 
  message, 
  Alert, 
  Tabs, 
  Table,
  Badge,
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  Clock, 
  BookOpen, 
  User, 
  Edit3, 
  Calendar,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Printer,
  FileDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { jadwalService } from '../services/jadwalService';
import { guruService } from '../services/guruService';
import { nilaiService } from '../services/nilaiService';
import './JadwalPelajaran.scss';

const { TabPane } = Tabs;

const LIST_MALAM = [
  'Malam Ahad',
  'Malam Senin',
  'Malam Selasa',
  'Malam Rabu',
  'Malam Kamis'
];

export function JadwalPelajaran() {
  const { isAdmin } = useAuth();

  // Settings / Master States
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [selectedTahunId, setSelectedTahunId] = useState(null);
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelasId, setSelectedKelasId] = useState(null);
  const [guruList, setGuruList] = useState([]);
  const [mapelList, setMapelList] = useState([]);

  // Data States
  const [loading, setLoading] = useState(false);
  const [jadwalList, setJadwalList] = useState([]);
  const [activeTab, setActiveTab] = useState('per_kelas');

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null); // { kelas_id, malam, jam_ke }
  const [selectedMapelId, setSelectedMapelId] = useState(null);
  const [selectedGuruId, setSelectedGuruId] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [clashWarning, setClashWarning] = useState(null);

  // Initialize master data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // Fetch tahun ajaran
        const years = await nilaiService.fetchTahunAjaran();
        setTahunAjaranList(years);
        const activeYear = years.find(y => y.is_active);
        if (activeYear) {
          setSelectedTahunId(activeYear.id);
        } else if (years.length > 0) {
          setSelectedTahunId(years[0].id);
        }

        // Fetch Diniyah classes
        const classes = await nilaiService.fetchKelas();
        const diniyahClasses = classes.filter(k => k.jenis === 'Diniyah');

        const getTingkatOrder = (k) => {
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

        const sortedClasses = diniyahClasses.sort((a, b) => {
          const orderA = getTingkatOrder(a);
          const orderB = getTingkatOrder(b);
          if (orderA !== orderB) return orderA - orderB;
          return a.nama.localeCompare(b.nama, 'id', { numeric: true, sensitivity: 'base' });
        });

        setKelasList(sortedClasses);
        if (sortedClasses.length > 0) {
          setSelectedKelasId(sortedClasses[0].id);
        }

        // Fetch Guru
        const gurus = await guruService.fetchGuru();
        setGuruList(gurus);

        // Fetch Mata Pelajaran
        const mapels = await guruService.fetchMataPelajaran();
        setMapelList(mapels);
      } catch (err) {
        console.error(err);
        message.error('Gagal memuat data referensi.');
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
      const data = await jadwalService.fetchJadwal(selectedTahunId);
      setJadwalList(data);
    } catch (err) {
      console.error(err);
      message.error('Gagal memuat data jadwal pelajaran.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJadwal();
  }, [selectedTahunId]);

  // Handle slot editing
  const handleOpenEdit = (kelasId, malam, jamKe) => {
    const existing = jadwalList.find(
      j => j.kelas_id === kelasId && j.malam === malam && j.jam_ke === jamKe
    );

    setEditingSlot({ kelas_id: kelasId, malam, jam_ke: jamKe });
    setSelectedMapelId(existing?.mata_pelajaran_id || null);
    setSelectedGuruId(existing?.guru_id || null);
    setClashWarning(null);
    setEditModalOpen(true);
  };

  // Clash detection when choosing a teacher in modal
  useEffect(() => {
    if (!editingSlot || !selectedGuruId) {
      setClashWarning(null);
      return;
    }

    // Find if this teacher is already teaching at the same night & period in ANOTHER class
    const clash = jadwalList.find(
      j => j.guru_id === selectedGuruId &&
           j.malam === editingSlot.malam &&
           j.jam_ke === editingSlot.jam_ke &&
           j.kelas_id !== editingSlot.kelas_id
    );

    if (clash) {
      const className = kelasList.find(k => k.id === clash.kelas_id)?.nama || 'Kelas Lain';
      const teacherName = guruList.find(g => g.id === selectedGuruId)?.nama || 'Guru';
      setClashWarning({
        message: `Bentrokan Jadwal!`,
        description: `${teacherName} sudah dijadwalkan mengajar di ${className} pada ${editingSlot.malam} Jam ke-${editingSlot.jam_ke}.`
      });
    } else {
      setClashWarning(null);
    }
  }, [selectedGuruId, editingSlot, jadwalList]);

  // Save schedule slot
  const handleSaveJadwal = async () => {
    if (!editingSlot) return;

    // Check if slot was previously set and is now being cleared
    const existing = jadwalList.find(
      j => j.kelas_id === editingSlot.kelas_id && j.malam === editingSlot.malam && j.jam_ke === editingSlot.jam_ke
    );
    
    if (existing && !selectedMapelId && !selectedGuruId) {
      if (!confirm('Apakah Anda yakin ingin menghapus/mengosongkan jadwal pelajaran pada slot ini?')) {
        return;
      }
    }

    setSaveLoading(true);
    try {
      const payload = {
        tahun_ajaran_id: selectedTahunId,
        kelas_id: editingSlot.kelas_id,
        malam: editingSlot.malam,
        jam_ke: editingSlot.jam_ke,
        mata_pelajaran_id: selectedMapelId,
        guru_id: selectedGuruId
      };

      await jadwalService.saveJadwal(payload);
      message.success('Jadwal pelajaran berhasil diperbarui.');
      setEditModalOpen(false);
      loadJadwal();
    } catch (err) {
      console.error(err);
      message.error('Gagal menyimpan jadwal: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Clear slot directly
  const handleClearSlot = async (kelasId, malam, jamKe) => {
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
      message.success('Slot jadwal dikosongkan.');
      loadJadwal();
    } catch (err) {
      console.error(err);
      message.error('Gagal mengosongkan slot: ' + err.message);
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
          message.error('Silakan pilih kelas terlebih dahulu.');
          return;
        }

        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Kop Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('MADRASAH DINIYAH AL-HAMID', 105, 18, { align: 'center' });
        doc.setFontSize(11);
        doc.text('PONDOK PESANTREN AL-HAMID JAKARTA', 105, 23, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Cilangkap, Cipayung, Jakarta Timur, DKI Jakarta', 105, 27, { align: 'center' });
        
        doc.setLineWidth(0.6);
        doc.line(15, 30, 195, 30);
        doc.setLineWidth(0.2);
        doc.line(15, 31, 195, 31);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('JADWAL PELAJARAN HARIAN', 105, 40, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`KELAS: ${targetKelas.nama.toUpperCase()}  |  TAHUN AJARAN: ${taKode}`, 105, 46, { align: 'center' });

        const headers = [['HARI / MALAM', 'JAM PERTAMA (KE-1)', 'JAM KEDUA (KE-2)']];
        
        const body = LIST_MALAM.map(malam => {
          const getSlotText = (jamKe) => {
            const slot = jadwalList.find(
              j => j.kelas_id === selectedKelasId && j.malam === malam && j.jam_ke === jamKe
            );
            if (!slot) return '-';
            return `${slot.mata_pelajaran_nama}\n(${slot.guru_nama})`;
          };
          return [
            malam.toUpperCase(),
            getSlotText(1),
            getSlotText(2)
          ];
        });

        autoTable(doc, {
          head: headers,
          body: body,
          startY: 52,
          theme: 'grid',
          styles: { 
            fontSize: 9, 
            cellPadding: 4, 
            halign: 'center', 
            valign: 'middle',
            lineColor: [180, 180, 180],
            lineWidth: 0.1
          },
          headStyles: { 
            fillColor: [16, 185, 129],
            textColor: 255, 
            fontStyle: 'bold',
            fontSize: 10,
            cellPadding: 5
          },
          columnStyles: {
            0: { width: 45, fontStyle: 'bold', fillColor: [245, 247, 250] },
            1: { width: 70 },
            2: { width: 70 }
          },
          margin: { left: 15, right: 15 }
        });

        const pageHeight = doc.internal.pageSize.height;
        if (doc.lastAutoTable.finalY + 40 > pageHeight) {
          doc.addPage();
          doc.lastAutoTable.finalY = 15;
        }

        const sigY = doc.lastAutoTable.finalY + 15;
        const formattedDate = getFormattedDate();

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        doc.text('Mengetahui,', 35, sigY);
        doc.text('Kepala Madrasah Diniyah', 35, sigY + 5);
        doc.line(35, sigY + 30, 80, sigY + 30);
        
        doc.text(`Jakarta, ${formattedDate}`, 135, sigY);
        doc.text('Sekretaris Madrasah Diniyah', 135, sigY + 5);
        doc.line(135, sigY + 30, 180, sigY + 30);

        doc.save(`Jadwal_Diniyah_${targetKelas.nama.replace(/\s+/g, '_')}_${taKode.replace(/\//g, '-')}.pdf`);
      } else {
        if (kelasList.length === 0) {
          message.error('Data kelas belum dimuat.');
          return;
        }

        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text('MADRASAH DINIYAH AL-HAMID', 148, 15, { align: 'center' });
        doc.setFontSize(11);
        doc.text('PONDOK PESANTREN AL-HAMID JAKARTA', 148, 20, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Cilangkap, Cipayung, Jakarta Timur, DKI Jakarta', 148, 24, { align: 'center' });

        doc.setLineWidth(0.6);
        doc.line(15, 27, 282, 27);
        doc.setLineWidth(0.2);
        doc.line(15, 28, 282, 28);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('MATRIKS MASTER JADWAL PELAJARAN HARIAN', 148, 35, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`TAHUN AJARAN: ${taKode}`, 148, 40, { align: 'center' });

        const headers = [[
          { content: 'HARI / MALAM', rowSpan: 2, valign: 'middle', halign: 'center' },
          { content: 'JAM', rowSpan: 2, valign: 'middle', halign: 'center' },
          { content: 'KELAS-KELAS DINIYAH', colSpan: kelasList.length, halign: 'center' }
        ],
        kelasList.map(k => k.nama.toUpperCase())
        ];

        const body = [];
        LIST_MALAM.forEach(malam => {
          [1, 2].forEach(jam_ke => {
            const rowData = [];
            rowData.push(malam.toUpperCase());
            rowData.push(`Ke-${jam_ke}`);

            kelasList.forEach(kelas => {
              const slot = jadwalList.find(
                j => j.kelas_id === kelas.id && j.malam === malam && j.jam_ke === jam_ke
              );
              if (!slot) {
                rowData.push('-');
              } else {
                rowData.push(`${slot.mata_pelajaran_nama}\n(${slot.guru_nama})`);
              }
            });

            body.push(rowData);
          });
        });

        const classColWidth = Math.floor(215 / kelasList.length);
        const columnStyles = {
          0: { width: 32, fontStyle: 'bold', fillColor: [245, 247, 250], valign: 'middle', halign: 'center' },
          1: { width: 18, fontStyle: 'bold', fillColor: [245, 247, 250], valign: 'middle', halign: 'center' }
        };
        for (let i = 2; i < 2 + kelasList.length; i++) {
          columnStyles[i] = { width: classColWidth, fontSize: 8 };
        }

        autoTable(doc, {
          head: headers,
          body: body,
          startY: 45,
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
            fillColor: [16, 185, 129],
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

        const pageHeight = doc.internal.pageSize.height;
        if (doc.lastAutoTable.finalY + 35 > pageHeight) {
          doc.addPage();
          doc.lastAutoTable.finalY = 15;
        }

        const sigY = doc.lastAutoTable.finalY + 12;
        const formattedDate = getFormattedDate();

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        doc.text('Mengetahui,', 40, sigY);
        doc.text('Kepala Madrasah Diniyah', 40, sigY + 4);
        doc.line(40, sigY + 24, 85, sigY + 24);

        doc.text(`Jakarta, ${formattedDate}`, 210, sigY);
        doc.text('Sekretaris Madrasah Diniyah', 210, sigY + 4);
        doc.line(210, sigY + 24, 255, sigY + 24);

        doc.save(`Matriks_Master_Jadwal_Diniyah_${taKode.replace(/\//g, '-')}.pdf`);
      }
      message.success('Ekspor PDF berhasil diunduh.');
    } catch (error) {
      console.error('Gagal ekspor PDF:', error);
      message.error('Gagal membuat file PDF: ' + error.message);
    }
  };

  // Printing logic
  const handlePrint = () => {
    window.print();
  };

  // --- Views Helpers ---

  // 1. Render card cell content
  const renderCellContent = (kelasId, malam, jamKe) => {
    const slot = jadwalList.find(
      j => j.kelas_id === kelasId && j.malam === malam && j.jam_ke === jamKe
    );

    if (!slot) {
      return (
        <div className="empty-slot-text">
          <span>Draf Kosong</span>
          {isAdmin() && (
            <Button 
              type="text" 
              size="small" 
              icon={<Edit3 size={12} />} 
              onClick={() => handleOpenEdit(kelasId, malam, jamKe)}
              className="slot-hover-btn"
            />
          )}
        </div>
      );
    }

    return (
      <div className="filled-slot-content">
        <div className="subject-row">
          <BookOpen size={12} className="slot-icon" />
          <span className="subject-name" title={slot.mata_pelajaran_nama}>
            {slot.mata_pelajaran_nama}
          </span>
        </div>
        <div className="teacher-row">
          <User size={12} className="slot-icon" />
          <span className="teacher-name" title={slot.guru_nama}>
            {slot.guru_nama}
          </span>
        </div>
        {isAdmin() && (
          <div className="slot-action-overlay">
            <Tooltip title="Edit">
              <Button 
                type="text" 
                size="small" 
                icon={<Edit3 size={13} />} 
                onClick={() => handleOpenEdit(kelasId, malam, jamKe)}
              />
            </Tooltip>
            <Popconfirm
              title="Kosongkan Slot Jadwal"
              description="Apakah Anda yakin ingin mengosongkan slot jadwal pelajaran ini?"
              onConfirm={() => handleClearSlot(kelasId, malam, jamKe)}
              okText="Ya, Kosongkan"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Kosongkan">
                <Button 
                  type="text" 
                  size="small" 
                  danger
                  icon={<Trash2 size={13} />} 
                />
              </Tooltip>
            </Popconfirm>
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
        <div className="timetable-title-print">
          <h2>JADWAL PELAJARAN HARIAN MADRASAH DINIYAH</h2>
          <h3>KELAS: {targetKelas.nama} | TAHUN AJARAN: {tahunAjaranList.find(y => y.id === selectedTahunId)?.kode}</h3>
        </div>

        <div className="timetable-grid">
          {LIST_MALAM.map(malam => (
            <div key={malam} className="malam-row-card">
              <div className="malam-header-badge">
                <span className="malam-title">{malam}</span>
              </div>
              <div className="periods-row">
                {/* Jam 1 */}
                <div className="period-box">
                  <div className="period-label">
                    <Clock size={12} />
                    <span>Jam Pertama (Ke-1)</span>
                  </div>
                  <div className="period-content">
                    {renderCellContent(selectedKelasId, malam, 1)}
                  </div>
                </div>

                {/* Jam 2 */}
                <div className="period-box">
                  <div className="period-label">
                    <Clock size={12} />
                    <span>Jam Kedua (Ke-2)</span>
                  </div>
                  <div className="period-content">
                    {renderCellContent(selectedKelasId, malam, 2)}
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

    // Define table columns
    const columns = [
      {
        title: 'Hari/Malam',
        dataIndex: 'malam',
        key: 'malam',
        width: 130,
        fixed: 'left',
        render: (value, row, index) => {
          const obj = {
            children: <span className="matrix-malam-label">{value}</span>,
            props: {}
          };
          // Group rows by malam (each malam has jam 1 and jam 2)
          if (index % 2 === 0) {
            obj.props.rowSpan = 2;
          } else {
            obj.props.rowSpan = 0;
          }
          return obj;
        }
      },
      {
        title: 'Jam',
        dataIndex: 'jam_ke',
        key: 'jam_ke',
        width: 80,
        fixed: 'left',
        align: 'center',
        render: (value) => <Badge count={`Ke-${value}`} style={{ backgroundColor: value === 1 ? '#3b82f6' : '#8b5cf6' }} />
      },
      // Dynamically add a column for each class
      ...kelasList.map(kelas => ({
        title: kelas.nama,
        dataIndex: `kelas_${kelas.id}`,
        key: `kelas_${kelas.id}`,
        width: 190,
        render: (_, row) => renderCellContent(kelas.id, row.malam, row.jam_ke)
      }))
    ];

    // Form data source
    // Rows represent (Malam 1, Jam 1), (Malam 1, Jam 2), etc.
    const dataSource = [];
    let idx = 1;
    LIST_MALAM.forEach(malam => {
      [1, 2].forEach(jam_ke => {
        dataSource.push({
          key: idx++,
          malam,
          jam_ke
        });
      });
    });

    return (
      <div className="matrix-table-container">
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          bordered
          scroll={{ x: 'max-content', y: 600 }}
          className="matrix-table"
        />
      </div>
    );
  };

  return (
    <div className="jadwal-pelajaran-page">
      {/* Premium Header */}
      <div className="page-header-container">
        <div className="header-left">
          <Calendar size={26} className="header-icon" />
          <div>
            <h1 className="page-title">Jadwal Pelajaran Harian</h1>
            <p className="page-subtitle">Kelola pembagian kelas, malam belajar, mata pelajaran, dan ustadz/ustadzah</p>
          </div>
        </div>

        {/* Global Selectors */}
        <div className="header-actions">
          <div className="select-control">
            <span className="control-label">Tahun Ajaran</span>
            <Select
              value={selectedTahunId}
              onChange={setSelectedTahunId}
              className="ta-select"
              options={tahunAjaranList.map(ta => ({
                value: ta.id,
                label: `${ta.kode} ${ta.is_active ? '(Aktif)' : ''}`
              }))}
            />
          </div>

          <Button 
            type="primary"
            icon={<FileDown size={16} />} 
            onClick={exportJadwalPDF}
            className="export-pdf-btn"
            style={{ background: '#10b981', borderColor: '#10b981' }}
          >
            Ekspor PDF
          </Button>

          <Button 
            icon={<Printer size={16} />} 
            onClick={handlePrint}
            className="print-btn"
          >
            Cetak Jadwal
          </Button>

          <Button 
            type="text" 
            icon={<RefreshCw size={14} className={loading ? 'spin-anim' : ''} />} 
            onClick={loadJadwal}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="content-layout">
        <Tabs activeKey={activeTab} onChange={setActiveTab} className="schedule-tabs">
          <TabPane 
            tab="Jadwal Per Kelas" 
            key="per_kelas"
          >
            <div className="class-selector-bar">
              <span className="select-label">Pilih Kelas Diniyah:</span>
              <Select
                value={selectedKelasId}
                onChange={setSelectedKelasId}
                className="class-select"
                options={kelasList.map(k => ({
                  value: k.id,
                  label: k.nama
                }))}
              />
            </div>

            {loading ? (
              <div className="loading-container">
                <Spin size="large" tip="Memuat jadwal pelajaran..." />
              </div>
            ) : (
              renderTimetableView()
            )}
          </TabPane>

          <TabPane 
            tab="Matriks Master (Semua Kelas)" 
            key="master_matrix"
          >
            {loading ? (
              <div className="loading-container">
                <Spin size="large" tip="Memuat matriks jadwal..." />
              </div>
            ) : (
              renderMatrixView()
            )}
          </TabPane>
        </Tabs>
      </div>

      {/* Edit Schedule Modal */}
      <Modal
        title={
          <div className="modal-title-wrapper">
            <Clock size={20} className="modal-icon" />
            <span>Edit Slot: {editingSlot?.malam} - Jam Ke-{editingSlot?.jam_ke}</span>
          </div>
        }
        open={editModalOpen}
        onOk={handleSaveJadwal}
        onCancel={() => setEditModalOpen(false)}
        confirmLoading={saveLoading}
        okText="Simpan Jadwal"
        cancelText="Batal"
        width={450}
        centered
        className="schedule-edit-modal"
      >
        <div className="modal-body-container">
          {clashWarning && (
            <Alert
              message={clashWarning.message}
              description={clashWarning.description}
              type="warning"
              showIcon
              icon={<AlertTriangle size={18} />}
              className="clash-alert"
            />
          )}

          <div className="form-group">
            <label className="form-label">Mata Pelajaran</label>
            <Select
              placeholder="Pilih mata pelajaran"
              value={selectedMapelId}
              onChange={setSelectedMapelId}
              allowClear
              showSearch
              filterOption={(input, option) => 
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={mapelList.map(m => ({
                value: m.id,
                label: m.nama
              }))}
              className="w-full-select"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ustadz / Ustadzah</label>
            <Select
              placeholder="Pilih pengajar"
              value={selectedGuruId}
              onChange={setSelectedGuruId}
              allowClear
              showSearch
              filterOption={(input, option) => 
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={guruList.map(g => ({
                value: g.id,
                label: g.nama
              }))}
              className="w-full-select"
            />
          </div>
          
          <span className="modal-helper-text">
            Kosongkan kedua pilihan di atas jika ingin menghapus pelajaran pada slot waktu ini.
          </span>
        </div>
      </Modal>
    </div>
  );
}

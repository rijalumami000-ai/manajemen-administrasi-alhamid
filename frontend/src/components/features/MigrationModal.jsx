import { useState, useEffect, useMemo } from 'react';
import { Modal, Table, Checkbox, Alert, Space, Typography, Tag, Tooltip, Input } from 'antd';
import { ExclamationCircleOutlined, ArrowRightOutlined, TrophyOutlined, SearchOutlined } from '@ant-design/icons';
import './MigrationModal.scss';

const { Text, Title } = Typography;

// Helper function to extract tingkat from class name
function extractTingkat(kelasNama) {
  if (!kelasNama) return null;

  // Handle SP (Sifir Persiapan, tingkat 1)
  if (kelasNama.toLowerCase() === 'sp') return 1;

  // Handle Sifir
  if (kelasNama.toLowerCase().includes('sifir')) return 0;

  // Extract number from class name (e.g., "1A" -> 1, "Kelas 2" -> 2)
  const match = kelasNama.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Helper function to determine next class level label (Sifir -> Class 1, Class 1 -> Class 2, etc.)
function getNextClass(currentClass) {
  if (!currentClass) return null;

  const tingkat = extractTingkat(currentClass);
  if (tingkat === null) return null;

  // Sifir (0) goes to Kelas 1
  if (tingkat === 0) return 'Kelas 1';
  
  // Diniyah standard progression: tingkat 1 goes directly to 2, 2 to 3, etc.
  if (tingkat >= 1 && tingkat < 6) return `Kelas ${tingkat + 1}`;
  
  // Tingkat 6 is graduation
  if (tingkat === 6) return '🎓 Lulus Diniyah';
  
  return null;
}

// Helper function to get next tingkat level
function getNextTingkatAndSP(currentClassNama) {
  if (!currentClassNama) return { tingkat: null, isSp: false };
  const tingkat = extractTingkat(currentClassNama);
  if (tingkat === null) return { tingkat: null, isSp: false };

  if (tingkat === 0) return { tingkat: 1, isSp: false };
  if (tingkat >= 1 && tingkat < 6) return { tingkat: tingkat + 1, isSp: false };
  return { tingkat: null, isSp: false };
}

// Helper function to determine Diniyah graduation status
function getGraduationStatus(santri) {
  const diniyahTingkat = extractTingkat(santri.nama_diniyah);
  if (diniyahTingkat === 6) {
    return { type: 'alumni', label: 'Lulus Diniyah Kelas 6', icon: '🎓', color: 'gold' };
  }
  return null;
}

export function MigrationModal({
  isOpen,
  onClose,
  onConfirm,
  santriList,
  sourceYear,
  targetYear,
  isSubmitting,
  kelasList = []
}) {
  const [excludedIds, setExcludedIds] = useState([]);
  const [activeClassTab, setActiveClassTab] = useState('Semua Kelas');
  const [searchQuery, setSearchQuery] = useState('');
  const [customPromotions, setCustomPromotions] = useState({});

  // Helper to filter next-year Diniyah class options
  const getTargetClassOptions = (currentClassNama) => {
    if (!kelasList || kelasList.length === 0) return [];
    
    // If student has no current class, let them choose any Diniyah class
    if (!currentClassNama) {
      return kelasList.filter(k => k.jenis.toLowerCase() === 'diniyah');
    }
    
    const target = getNextTingkatAndSP(currentClassNama);
    if (target.tingkat === null) return [];

    return kelasList.filter(k => {
      return k.jenis.toLowerCase() === 'diniyah' && k.tingkat === target.tingkat;
    });
  };

  // Pre-populate default class values when modal opens
  useEffect(() => {
    if (isOpen && santriList && kelasList.length > 0) {
      const defaults = {};
      santriList.forEach(s => {
        const diniyahOptions = getTargetClassOptions(s.nama_diniyah);
        
        defaults[s.id] = {
          kelas_diniyah_id: diniyahOptions.length > 0 ? diniyahOptions[0].id : null,
          kelas_sekolah_id: undefined // Let school classes auto-advance in the backend
        };
      });
      setCustomPromotions(defaults);
      setExcludedIds([]);
      setActiveClassTab('Semua Kelas');
      setSearchQuery('');
    }
  }, [isOpen, santriList, kelasList]);

  const handleDiniyahChange = (santriId, classId) => {
    setCustomPromotions(prev => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        kelas_diniyah_id: classId
      }
    }));
  };

  const handleToggleSantri = (santriId) => {
    setExcludedIds(prev => {
      if (prev.includes(santriId)) {
        return prev.filter(id => id !== santriId);
      } else {
        return [...prev, santriId];
      }
    });
  };

  // Get dynamic unique Diniyah classes list from current students
  const classTabs = useMemo(() => {
    const classes = new Set();
    santriList.forEach(s => {
      if (s.nama_diniyah) classes.add(s.nama_diniyah);
    });
    return ['Semua Kelas', ...Array.from(classes).sort()];
  }, [santriList]);

  // Filter students based on active class tab and search query
  const filteredSantri = useMemo(() => {
    return santriList.filter(s => {
      const matchesClass = activeClassTab === 'Semua Kelas' || s.nama_diniyah === activeClassTab;

      const keyword = searchQuery.toLowerCase();
      const matchesSearch = !keyword ||
        (s.nama && s.nama.toLowerCase().includes(keyword)) ||
        (s.nis && s.nis.toLowerCase().includes(keyword));

      return matchesClass && matchesSearch;
    });
  }, [santriList, activeClassTab, searchQuery]);

  // Handle Select-All for the currently filtered list
  const isAllFilteredSelected = useMemo(() => {
    if (filteredSantri.length === 0) return false;
    return filteredSantri.every(s => !excludedIds.includes(s.id));
  }, [filteredSantri, excludedIds]);

  const isFilteredIndeterminate = useMemo(() => {
    if (filteredSantri.length === 0) return false;
    const selectedCount = filteredSantri.filter(s => !excludedIds.includes(s.id)).length;
    return selectedCount > 0 && selectedCount < filteredSantri.length;
  }, [filteredSantri, excludedIds]);

  const handleSelectAllFiltered = (checked) => {
    const visibleIds = filteredSantri.map(s => s.id);
    if (checked) {
      // Include all visible (remove from exclusions)
      setExcludedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Exclude all visible (add to exclusions)
      setExcludedIds(prev => {
        const nextExcluded = [...prev];
        visibleIds.forEach(id => {
          if (!nextExcluded.includes(id)) {
            nextExcluded.push(id);
          }
        });
        return nextExcluded;
      });
    }
  };

  const handleConfirm = () => {
    const promotionsArray = Object.entries(customPromotions)
      .filter(([id]) => !excludedIds.includes(Number(id)))
      .map(([id, promo]) => ({
        santri_id: Number(id),
        kelas_diniyah_id: promo.kelas_diniyah_id,
        kelas_sekolah_id: undefined // Handled automatically on the backend
      }));
    onConfirm(excludedIds, promotionsArray);
  };

  const migratingCount = santriList.length - excludedIds.length;
  const notPromotedCount = excludedIds.length;

  // Calculate statistics
  const alumniCount = useMemo(() => {
    return santriList.filter(s => {
      if (excludedIds.includes(s.id)) return false;
      const status = getGraduationStatus(s);
      return status && status.type === 'alumni';
    }).length;
  }, [santriList, excludedIds]);

  const columns = [
    {
      title: (
        <Checkbox
          checked={isAllFilteredSelected}
          indeterminate={isFilteredIndeterminate}
          onChange={(e) => handleSelectAllFiltered(e.target.checked)}
          className="migration-table-checkbox"
        >
          Naik
        </Checkbox>
      ),
      dataIndex: 'migrate',
      key: 'migrate',
      width: 100,
      render: (_, record) => (
        <Checkbox
          checked={!excludedIds.includes(record.id)}
          onChange={() => handleToggleSantri(record.id)}
          className="migration-table-checkbox"
        >
          Naik Kelas
        </Checkbox>
      ),
    },
    {
      title: 'NIS',
      dataIndex: 'nis',
      key: 'nis',
      width: 110,
      render: (text) => <span className="mono-text">{text || '-'}</span>
    },
    {
      title: 'Nama Santri',
      dataIndex: 'nama',
      key: 'nama',
      ellipsis: true,
      render: (text) => <strong style={{ color: '#0f172a' }}>{text}</strong>
    },
    {
      title: 'Kelas Diniyah Baru',
      dataIndex: 'nama_diniyah',
      key: 'nama_diniyah',
      width: 320,
      render: (text, record) => {
        const isExcluded = excludedIds.includes(record.id);
        if (isExcluded) {
          return (
            <div className="class-adv-wrap is-repeating">
              <span className="current-class">{text || '-'}</span>
              <span className="next-class-indicator repeating">
                <ArrowRightOutlined style={{ fontSize: 9 }} /> {text || '-'} (Mengulang)
              </span>
            </div>
          );
        }

        const options = getTargetClassOptions(text);
        const nextClassDefault = getNextClass(text);

        if (nextClassDefault && nextClassDefault.includes('Lulus')) {
          return (
            <div className="class-adv-wrap">
              <span className="current-class">{text}</span>
              <span className="next-class-indicator success">
                <ArrowRightOutlined /> {nextClassDefault}
              </span>
            </div>
          );
        }

        if (options.length === 0) {
          return <span className="current-class">{text || '-'}</span>;
        }

        const value = customPromotions[record.id]?.kelas_diniyah_id || undefined;

        return (
          <div className="class-promotion-select-cell">
            <span className="current-class-label">{text || '-'}</span>
            <div className="adv-arrow-wrap">&rarr;</div>
            <select
              value={value || ''}
              onChange={(e) => handleDiniyahChange(record.id, e.target.value ? Number(e.target.value) : null)}
              className="modal-table-select"
              style={{ width: 140 }}
            >
              <option value="">Pilih</option>
              {options.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
            </select>
          </div>
        );
      },
    },
    {
      title: 'Status Kelulusan',
      key: 'graduation',
      width: 180,
      render: (_, record) => {
        const isExcluded = excludedIds.includes(record.id);
        if (isExcluded) return '-';

        const status = getGraduationStatus(record);
        if (!status) return '-';

        return (
          <Tooltip title={status.label}>
            <Tag color={status.color} icon={<TrophyOutlined />} className="grad-badge">
              {status.label}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status_tahun_ajaran',
      key: 'status',
      width: 95,
      render: (status) => {
        const colors = {
          aktif: 'success',
          draft: 'default',
          tidak_naik: 'error',
        };
        return <span className={`status-tag-mini ${colors[status] || 'default'}`}>{status || 'aktif'}</span>;
      },
    },
  ];

  return (
    <Modal
      open={isOpen}
      title={
        <div className="migration-modal-header">
          <ExclamationCircleOutlined className="modal-title-icon" />
          <div className="title-desc">
            <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
              Migrasi Periode Akademik Diniyah
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Proses menaikkan kelas Diniyah secara massal dari {sourceYear?.kode} ke {targetYear}
            </Text>
          </div>
        </div>
      }
      onCancel={onClose}
      onOk={handleConfirm}
      okText="Proses Migrasi"
      cancelText="Batal"
      width={1050}
      confirmLoading={isSubmitting}
      okButtonProps={{
        danger: true,
        disabled: migratingCount === 0
      }}
      className="migration-modal-redesign"
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        
        {/* Solution Notice for Division Assignment */}
        <Alert
          message="💡 Informasi Migrasi & Pembagian Kelas Diniyah (Contoh: 1A ke 2A / 2C)"
          description={
            <div className="division-solution-guide">
              <p>
                * Hanya santri yang aktif di **Semester Genap** pada tahun ajaran ini yang terdaftar untuk dimigrasikan.
              </p>
              <p>
                * Santri kelas **1** (Diniyah tingkat 1) akan otomatis didorong langsung naik ke kelas tingkat **2** (melewati tahapan SP).
              </p>
              <p style={{ marginBottom: 0 }}>
                * Jika tingkat berikutnya memiliki beberapa pilihan kelas/divisi (contoh: dari <strong>1A</strong> ke <strong>2A</strong>, <strong>2B</strong>, atau <strong>2C</strong>), Anda dapat memilih kelas tujuannya secara langsung di bawah ini pada kolom <strong>Kelas Diniyah Baru</strong> sebelum memproses migrasi.
              </p>
            </div>
          }
          type="info"
          showIcon
          className="solution-alert"
        />

        {/* Statistics Summary Cards */}
        <div className="migration-stats-strip">
          <div className="stat-pill-card">
            <span className="stat-pill-label">Total Santri (Sem. Genap)</span>
            <span className="stat-pill-val">{santriList.length}</span>
          </div>
          <div className="stat-pill-card success">
            <span className="stat-pill-label">Akan Naik Kelas</span>
            <span className="stat-pill-val">{migratingCount}</span>
          </div>
          <div className="stat-pill-card danger">
            <span className="stat-pill-label">Tinggal Kelas</span>
            <span className="stat-pill-val">{notPromotedCount}</span>
          </div>
          <div className="stat-pill-card warning">
            <span className="stat-pill-label">Lulus Jadi Alumni Diniyah</span>
            <span className="stat-pill-val">{alumniCount}</span>
          </div>
        </div>

        {/* Dynamic Class Tabs Filter & Search Controls */}
        <div className="migration-controls-row">
          {/* Left: Class selection pill tabs */}
          <div className="class-tabs-container">
            <div className="class-tabs-track">
              {classTabs.map((tab) => {
                const isActive = activeClassTab === tab;
                const count = tab === 'Semua Kelas'
                  ? santriList.length
                  : santriList.filter(s => s.nama_diniyah === tab).length;

                return (
                  <button
                    key={tab}
                    type="button"
                    className={`class-pill-tab ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveClassTab(tab)}
                  >
                    <span>{tab}</span>
                    <span className="class-count-badge">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Search Input */}
          <div className="modal-search-wrapper">
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Cari nama / NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="modal-search-input"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="migration-table-wrap">
          <Table
            columns={columns}
            dataSource={filteredSantri}
            rowKey="id"
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} santri di kelas ini`
            }}
            scroll={{ y: 320 }}
            size="small"
            rowClassName={(record) =>
              excludedIds.includes(record.id) ? 'not-promoted-row' : 'promoted-row'
            }
            locale={{
              emptyText: 'Tidak ada data santri untuk kelas atau kata kunci ini.'
            }}
          />
        </div>

        {migratingCount === 0 && (
          <Alert
            message="Validasi Gagal"
            description="Pilih minimal satu santri yang dicentang 'Naik Kelas' untuk memproses migrasi."
            type="error"
            showIcon
          />
        )}
      </Space>
    </Modal>
  );
}

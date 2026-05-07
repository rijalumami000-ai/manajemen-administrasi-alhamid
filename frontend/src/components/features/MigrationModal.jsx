import { useState, useEffect } from 'react';
import { Modal, Table, Checkbox, Alert, Space, Typography, Tag, Tooltip } from 'antd';
import { ExclamationCircleOutlined, ArrowRightOutlined, TrophyOutlined, BookOutlined } from '@ant-design/icons';
import './MigrationModal.scss';

const { Text, Title } = Typography;

// Helper function to extract tingkat from class name
function extractTingkat(kelasNama) {
  if (!kelasNama) return null;

  // Handle special cases
  if (kelasNama.toLowerCase().includes('sifir')) return 0;
  if (kelasNama.toLowerCase().includes('sp')) return 1; // Special Program

  // Extract number from class name (e.g., "1A" -> 1, "Kelas 2" -> 2, "11-IPA" -> 11)
  const match = kelasNama.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Helper function to determine next class level
function getNextClass(currentClass, jenis) {
  if (!currentClass) return null;

  const tingkat = extractTingkat(currentClass);
  if (tingkat === null) return null;

  if (jenis === 'diniyah') {
    // Diniyah progression: Sifir(0) → 1 → SP → 2 → 3 → 4 → 5 → 6 → Graduation
    if (tingkat === 0) return 'Kelas 1';
    if (tingkat === 1 && !currentClass.toLowerCase().includes('sp')) return 'Kelas SP';
    if (tingkat === 1 && currentClass.toLowerCase().includes('sp')) return 'Kelas 2';
    if (tingkat >= 2 && tingkat < 6) return `Kelas ${tingkat + 1}`;
    if (tingkat === 6) return '🎓 Lulus Diniyah';
    return null;
  } else if (jenis === 'sekolah') {
    // Sekolah progression: 7 → 8 → 9 → 10 → 11 → 12 → Graduation
    if (tingkat >= 7 && tingkat < 12) return `Kelas ${tingkat + 1}`;
    if (tingkat === 9) return 'Kelas 10 (MA)'; // MTs to MA transition
    if (tingkat === 12) return '🎓 Lulus MA';
    return null;
  }

  return null;
}

// Helper function to determine graduation status
function getGraduationStatus(santri) {
  const diniyahTingkat = extractTingkat(santri.nama_diniyah);
  const sekolahTingkat = extractTingkat(santri.nama_sekolah);

  // MA Graduation (tingkat 12) - always becomes alumni
  if (sekolahTingkat === 12) {
    if (diniyahTingkat === 6) {
      return { type: 'alumni', label: 'Lulus Diniyah & MA', icon: '🎓', color: 'gold' };
    }
    return { type: 'alumni', label: 'Lulus MA', icon: '🎓', color: 'gold' };
  }

  // MTs Graduation (tingkat 9) - marked but not alumni
  if (sekolahTingkat === 9) {
    return { type: 'mts_graduate', label: 'Lulus MTs', icon: '📝', color: 'blue' };
  }

  // Diniyah Graduation (tingkat 6) - only if no Sekolah enrollment
  if (diniyahTingkat === 6 && !sekolahTingkat) {
    return { type: 'alumni', label: 'Lulus Diniyah Kelas 6', icon: '🎓', color: 'gold' };
  }

  // Dual-track Diniyah completion (tingkat 6 with active Sekolah)
  if (diniyahTingkat === 6 && sekolahTingkat && sekolahTingkat < 12) {
    return { type: 'diniyah_complete', label: 'Lulus Diniyah (Lanjut Sekolah)', icon: '📚', color: 'green' };
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
  isSubmitting
}) {
  const [excludedIds, setExcludedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setExcludedIds([]);
      setSelectAll(true);
    }
  }, [isOpen]);

  const handleToggleSantri = (santriId) => {
    setExcludedIds(prev => {
      if (prev.includes(santriId)) {
        return prev.filter(id => id !== santriId);
      } else {
        return [...prev, santriId];
      }
    });
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (!checked) {
      // Exclude all
      setExcludedIds(santriList.map(s => s.id));
    } else {
      // Include all
      setExcludedIds([]);
    }
  };

  const handleConfirm = () => {
    onConfirm(excludedIds);
  };

  const migratingCount = santriList.length - excludedIds.length;
  const notPromotedCount = excludedIds.length;

  // Calculate statistics
  const alumniCount = santriList.filter(s => {
    if (excludedIds.includes(s.id)) return false;
    const status = getGraduationStatus(s);
    return status && status.type === 'alumni';
  }).length;

  const mtsGraduatesCount = santriList.filter(s => {
    if (excludedIds.includes(s.id)) return false;
    const status = getGraduationStatus(s);
    return status && status.type === 'mts_graduate';
  }).length;

  const columns = [
    {
      title: (
        <Checkbox
          checked={selectAll}
          indeterminate={excludedIds.length > 0 && excludedIds.length < santriList.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          Pilih Semua
        </Checkbox>
      ),
      dataIndex: 'migrate',
      key: 'migrate',
      width: 120,
      render: (_, record) => (
        <Checkbox
          checked={!excludedIds.includes(record.id)}
          onChange={() => handleToggleSantri(record.id)}
        >
          Naik Kelas
        </Checkbox>
      ),
    },
    {
      title: 'NIS',
      dataIndex: 'nis',
      key: 'nis',
      width: 100,
    },
    {
      title: 'Nama',
      dataIndex: 'nama',
      key: 'nama',
      ellipsis: true,
    },
    {
      title: 'Kelas Diniyah',
      dataIndex: 'nama_diniyah',
      key: 'nama_diniyah',
      width: 200,
      render: (text, record) => {
        if (!text) return '-';

        const isExcluded = excludedIds.includes(record.id);
        const nextClass = isExcluded ? null : getNextClass(text, 'diniyah');

        return (
          <Space direction="vertical" size={0}>
            <Text>{text}</Text>
            {nextClass && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ArrowRightOutlined style={{ fontSize: 10 }} /> {nextClass}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Kelas Sekolah',
      dataIndex: 'nama_sekolah',
      key: 'nama_sekolah',
      width: 200,
      render: (text, record) => {
        if (!text) return '-';

        const isExcluded = excludedIds.includes(record.id);
        const nextClass = isExcluded ? null : getNextClass(text, 'sekolah');

        return (
          <Space direction="vertical" size={0}>
            <Text>{text}</Text>
            {nextClass && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ArrowRightOutlined style={{ fontSize: 10 }} /> {nextClass}
              </Text>
            )}
          </Space>
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
            <Tag color={status.color} icon={status.type === 'alumni' ? <TrophyOutlined /> : <BookOutlined />}>
              {status.icon} {status.label}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status_tahun_ajaran',
      key: 'status',
      width: 100,
      render: (status) => {
        const colors = {
          aktif: 'green',
          draft: 'orange',
          tidak_naik: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status || 'aktif'}</Tag>;
      },
    },
  ];

  return (
    <Modal
      open={isOpen}
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 24 }} />
          <Title level={4} style={{ margin: 0 }}>
            Konfirmasi Migrasi Tahun Ajaran
          </Title>
        </Space>
      }
      onCancel={onClose}
      onOk={handleConfirm}
      okText="Proses Migrasi"
      cancelText="Batal"
      width={1000}
      confirmLoading={isSubmitting}
      okButtonProps={{
        danger: true,
        disabled: migratingCount === 0
      }}
      className="migration-modal"
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="Perhatian: Proses Migrasi Tahun Ajaran"
          description={
            <div>
              <p>
                Anda akan memigrasikan data santri dari <strong>{sourceYear?.kode}</strong> ke{' '}
                <strong>{targetYear}</strong>.
              </p>
              <p>
                <strong>Pilih santri yang akan naik kelas:</strong>
              </p>
              <ul>
                <li>✓ Centang = Santri akan naik ke tahun ajaran berikutnya</li>
                <li>✗ Tidak dicentang = Santri tidak naik kelas (status: tidak_naik)</li>
              </ul>
              <p>
                <strong>Sistem akan otomatis:</strong>
              </p>
              <ul>
                <li>🎓 Membuat record alumni untuk santri yang lulus (Diniyah 6, MA 12)</li>
                <li>📝 Menandai santri yang lulus MTs (tingkat 9) dan melanjutkan ke MA</li>
                <li>📚 Menandai santri yang menyelesaikan Diniyah 6 sambil melanjutkan Sekolah</li>
                <li>➡️ Menaikkan tingkat kelas secara otomatis sesuai jalur pendidikan</li>
              </ul>
              <p style={{ marginBottom: 0 }}>
                <strong>Catatan:</strong> Proses ini akan mengubah tahun ajaran berjalan dan dapat di-rollback jika diperlukan.
              </p>
            </div>
          }
          type="warning"
          showIcon
        />

        <div className="migration-summary">
          <Space size="large">
            <div>
              <Text type="secondary">Total Santri:</Text>
              <br />
              <Text strong style={{ fontSize: 20 }}>{santriList.length}</Text>
            </div>
            <div>
              <Text type="secondary">Akan Naik Kelas:</Text>
              <br />
              <Text strong style={{ fontSize: 20, color: '#52c41a' }}>{migratingCount}</Text>
            </div>
            <div>
              <Text type="secondary">Tidak Naik Kelas:</Text>
              <br />
              <Text strong style={{ fontSize: 20, color: '#ff4d4f' }}>{notPromotedCount}</Text>
            </div>
            <div>
              <Text type="secondary">🎓 Akan Jadi Alumni:</Text>
              <br />
              <Text strong style={{ fontSize: 20, color: '#faad14' }}>{alumniCount}</Text>
            </div>
            <div>
              <Text type="secondary">📝 Lulus MTs:</Text>
              <br />
              <Text strong style={{ fontSize: 20, color: '#1890ff' }}>{mtsGraduatesCount}</Text>
            </div>
          </Space>
        </div>

        <div className="migration-table">
          <Table
            columns={columns}
            dataSource={santriList}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} santri`
            }}
            scroll={{ y: 400 }}
            size="small"
            rowClassName={(record) =>
              excludedIds.includes(record.id) ? 'not-promoted-row' : 'promoted-row'
            }
          />
        </div>

        {migratingCount === 0 && (
          <Alert
            message="Tidak ada santri yang akan dimigrasi"
            description="Pilih minimal satu santri untuk melanjutkan proses migrasi."
            type="error"
            showIcon
          />
        )}
      </Space>
    </Modal>
  );
}

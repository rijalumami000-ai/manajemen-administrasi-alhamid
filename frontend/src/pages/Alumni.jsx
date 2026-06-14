import { useState, useEffect, useMemo } from 'react';
import { Button, Row, Col, message as antMessage, Tabs, Select, Input, Table, Tag, Space, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { UserCheck, UserX } from 'lucide-react';
import { alumniService } from '../services/alumniService';
import { AlumniStats } from '../components/features/AlumniStats';
import { AlumniCard } from '../components/features/AlumniCard';
import { MigrateSantriModal } from '../components/features/MigrateSantriModal';
import { AlumniEditModal } from '../components/features/AlumniEditModal';
import { AlumniDetailModal } from '../components/features/AlumniDetailModal';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../components/common';
import { santriService } from '../services/santriService';
import './Alumni.scss';

const { Option } = Select;

export function Alumni() {
  // All data
  const [allAlumni, setAllAlumni] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);

  // Tabs
  const [activeTab, setActiveTab] = useState('alumni');

  // Filters (shared)
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('');
  const [filterTahunLulus, setFilterTahunLulus] = useState('');

  // Modals
  const [isMigrateModalOpen, setIsMigrateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState(null);
  const [detailAlumniId, setDetailAlumniId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [migrateModalError, setMigrateModalError] = useState('');
  const [editModalError, setEditModalError] = useState('');

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [alumniData, santriData, tahunData] = await Promise.all([
        alumniService.fetchAlumni(),
        alumniService.fetchActiveSantri().catch(() => []),
        santriService.fetchTahunAjaran().catch(() => [])
      ]);
      setAllAlumni(alumniData);
      setSantriList(santriData);
      setTahunAjaranList(tahunData);
    } catch (err) {
      console.error('Gagal memuat data alumni:', err);
      setError(err.message || 'Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  const loadAlumni = async () => {
    try {
      const data = await alumniService.fetchAlumni();
      setAllAlumni(data);
    } catch (err) {
      console.error('Gagal memuat data alumni:', err);
      antMessage.error('Gagal memuat data alumni');
    }
  };

  // Filter helper
  const filterData = (list) => {
    return list.filter(item => {
      const keyword = searchKeyword.toLowerCase();
      const nama = (item.nama || '').toLowerCase();
      const nis = String(item.nis || '').toLowerCase();
      const matchesSearch = !keyword || nama.includes(keyword) || nis.includes(keyword);

      const matchesTahunLulus = !filterTahunLulus || item.tahun_lulus == filterTahunLulus;

      const matchesTahunAjaran = !filterTahunAjaran ||
        item.tahun_ajaran_id == filterTahunAjaran;

      return matchesSearch && matchesTahunLulus && matchesTahunAjaran;
    });
  };

  // Derived lists per tab
  const alumniDataList = useMemo(() =>
    filterData(allAlumni.filter(a => a.tipe === 'alumni' || !a.tipe)),
    [allAlumni, searchKeyword, filterTahunLulus, filterTahunAjaran]
  );

  const pindahDataList = useMemo(() =>
    filterData(allAlumni.filter(a => a.tipe === 'pindah')),
    [allAlumni, searchKeyword, filterTahunLulus, filterTahunAjaran]
  );

  // Year options for filter
  const tahunLulusOptions = useMemo(() => {
    const years = [...new Set(allAlumni.map(a => a.tahun_lulus))].filter(Boolean);
    return years.sort((a, b) => b - a);
  }, [allAlumni]);

  // Handlers
  const handleMigrateClick = () => {
    setMigrateModalError('');
    setIsMigrateModalOpen(true);
  };

  const handleMigrateSubmit = async (data) => {
    setIsSubmitting(true);
    setMigrateModalError('');
    try {
      const result = await alumniService.migrateSantri(data);
      antMessage.success(result.message || 'Data santri berhasil dipindahkan ke alumni');
      setIsMigrateModalOpen(false);
      await loadAlumni();
      const santriData = await alumniService.fetchActiveSantri().catch(() => []);
      setSantriList(santriData);
    } catch (err) {
      setMigrateModalError(err.message || 'Gagal migrasi santri');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (alumni) => {
    setEditingAlumni(alumni);
    setEditModalError('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data) => {
    setIsSubmitting(true);
    setEditModalError('');
    try {
      await alumniService.updateAlumni(editingAlumni.id, data);
      antMessage.success('Data berhasil diperbarui');
      setIsEditModalOpen(false);
      await loadAlumni();
    } catch (err) {
      setEditModalError(err.message || 'Gagal memperbarui data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (id, nama) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data ${nama}?`)) return;
    try {
      const result = await alumniService.deleteAlumni(id);
      antMessage.success(result.message || 'Data berhasil dihapus');
      await loadAlumni();
    } catch (err) {
      antMessage.error(err.message || 'Gagal menghapus data');
    }
  };

  const handleReactivateClick = async (id, nama) => {
    if (!confirm(`Apakah Anda yakin ingin mengaktifkan kembali ${nama} ke tahun ajaran berjalan? Data alumni/pindah ini akan dihapus dan dipindahkan kembali ke daftar santri aktif.`)) return;
    try {
      setLoading(true);
      const result = await alumniService.reactivateAlumni(id);
      antMessage.success(result.message || 'Siswa berhasil diaktifkan kembali');
      await loadAlumni();
      const santriData = await alumniService.fetchActiveSantri().catch(() => []);
      setSantriList(santriData);
    } catch (err) {
      antMessage.error(err.message || 'Gagal mengaktifkan kembali siswa');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailClick = (id) => {
    setDetailAlumniId(id);
    setIsDetailModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchKeyword('');
    setFilterTahunAjaran('');
    setFilterTahunLulus('');
  };

  if (loading) return <LoadingState message="Memuat data alumni..." />;
  if (error) return <ErrorState message={error} onRetry={loadInitialData} />;

  // Pindah tab columns
  const pindahColumns = [
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
      render: (nama, record) => (
        <span
          style={{ cursor: 'pointer', color: '#1677ff', fontWeight: 500 }}
          onClick={() => handleDetailClick(record.id)}
        >
          {nama}
        </span>
      )
    },
    {
      title: 'Kelas Terakhir',
      dataIndex: 'kelas_terakhir',
      key: 'kelas_terakhir',
      render: v => v || '-'
    },
    {
      title: 'Tahun',
      dataIndex: 'tahun_lulus',
      key: 'tahun_lulus',
      width: 80,
    },
    {
      title: 'Tahun Ajaran',
      key: 'tahun_ajaran',
      render: (_, record) => {
        const ta = tahunAjaranList.find(t => t.id === record.tahun_ajaran_id);
        return ta ? ta.kode : (record.tahun_ajaran_id || '-');
      },
      width: 120
    },
    {
      title: 'Status',
      key: 'tipe',
      width: 120,
      render: () => <Tag color="orange">Pindah / Migrasi</Tag>
    },
    {
      title: 'Keterangan',
      dataIndex: 'keterangan',
      key: 'keterangan',
      render: v => v || '-'
    },
    {
      title: 'Aksi',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.santri_id && (
            <Tooltip title="Aktifkan kembali siswa ini ke tahun ajaran berjalan">
              <Button
                size="small"
                type="primary"
                ghost
                icon={<UserCheck size={14} style={{ verticalAlign: 'middle' }} />}
                onClick={() => handleReactivateClick(record.id, record.nama)}
              >
                Reaktifkan
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <Button size="small" onClick={() => handleEditClick(record)}>Edit</Button>
          </Tooltip>
          <Tooltip title="Hapus">
            <Button size="small" danger onClick={() => handleDeleteClick(record.id, record.nama)}>Hapus</Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  // Shared filter bar
  const FilterBar = () => (
    <div className="alumni-filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
      <Input
        placeholder="Cari nama / NIS..."
        prefix={<SearchOutlined />}
        value={searchKeyword}
        onChange={e => setSearchKeyword(e.target.value)}
        allowClear
        style={{ width: 220 }}
      />
      <Select
        placeholder="Filter Tahun Ajaran"
        value={filterTahunAjaran || undefined}
        onChange={setFilterTahunAjaran}
        allowClear
        style={{ width: 170 }}
      >
        {tahunAjaranList.map(ta => (
          <Option key={ta.id} value={ta.id}>{ta.kode}{ta.is_active ? ' (Aktif)' : ''}</Option>
        ))}
      </Select>
      <Select
        placeholder="Filter Tahun Lulus"
        value={filterTahunLulus || undefined}
        onChange={setFilterTahunLulus}
        allowClear
        style={{ width: 150 }}
      >
        {tahunLulusOptions.map(y => (
          <Option key={y} value={y}>{y}</Option>
        ))}
      </Select>
      <Button icon={<ClearOutlined />} onClick={handleResetFilters}>Reset</Button>
    </div>
  );

  const tabItems = [
    {
      key: 'alumni',
      label: (
        <span>
          <UserCheck size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Alumni / Lulusan
          <Tag color="green" style={{ marginLeft: 8 }}>{alumniDataList.length}</Tag>
        </span>
      ),
      children: (
        <>
          <FilterBar />
          {alumniDataList.length === 0 ? (
            <EmptyState description="Tidak ada data alumni yang sesuai" />
          ) : (
            <Row gutter={[16, 16]}>
              {alumniDataList.map(alumni => (
                <Col key={alumni.id} xs={24} sm={24} md={12} lg={8} xl={6}>
                  <AlumniCard
                    alumni={alumni}
                    onDetail={handleDetailClick}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                </Col>
              ))}
            </Row>
          )}
        </>
      )
    },
    {
      key: 'pindah',
      label: (
        <span>
          <UserX size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Siswa Pindah / Migrasi
          <Tag color="orange" style={{ marginLeft: 8 }}>{pindahDataList.length}</Tag>
        </span>
      ),
      children: (
        <>
          <FilterBar />
          <Table
            dataSource={pindahDataList}
            columns={pindahColumns}
            rowKey="id"
            size="middle"
            pagination={{ pageSize: 20, showTotal: (total) => `Total: ${total} siswa` }}
            locale={{ emptyText: <EmptyState description="Tidak ada data siswa pindah yang sesuai" /> }}
            scroll={{ x: 800 }}
          />
        </>
      )
    }
  ];

  return (
    <div className="alumni-page">
      <PageHeader
        title="📚 Data Alumni & Pindah"
        subtitle="Kelola data alumni lulusan dan siswa pindah pesantren"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleMigrateClick}
          >
            Tambah dari Santri
          </Button>
        }
      />

      <AlumniStats alumni={allAlumni.filter(a => a.tipe === 'alumni' || !a.tipe)} />

      <div className="alumni-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="alumni-tabs"
        />
      </div>

      {/* Modals */}
      <MigrateSantriModal
        isOpen={isMigrateModalOpen}
        onClose={() => setIsMigrateModalOpen(false)}
        onSubmit={handleMigrateSubmit}
        santriList={santriList}
        isSubmitting={isSubmitting}
        error={migrateModalError}
      />

      <AlumniEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        editData={editingAlumni}
        isSubmitting={isSubmitting}
        error={editModalError}
      />

      <AlumniDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        alumniId={detailAlumniId}
      />
    </div>
  );
}

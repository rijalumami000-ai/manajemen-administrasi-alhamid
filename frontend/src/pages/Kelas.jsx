import { useState, useEffect, useMemo } from 'react';
import { Button, Select, Row, Col, message as antMessage, Divider } from 'antd';
import { PlusOutlined, BookOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { kelasService } from '../services/kelasService';
import { guruService } from '../services/guruService';
import { santriService } from '../services/santriService';
import { KelasCard } from '../components/features/KelasCard';
import { KelasModal } from '../components/features/KelasModal';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../components/common';
import './Kelas.scss';

const { Option } = Select;

export function Kelas() {
  const [kelasList, setKelasList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState(null);
  const [sortBy, setSortBy] = useState('nama-asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tahun ajaran first
      const years = await santriService.fetchTahunAjaran();
      setTahunAjaranList(years);

      const active = years.find(y => y.is_active);
      const activeId = active ? String(active.id) : null;
      setSelectedTahunAjaranId(activeId);

      const [data, gurus, mapels] = await Promise.all([
        kelasService.fetchKelas(activeId),
        guruService.fetchGuru(),
        guruService.fetchMataPelajaran()
      ]);

      setKelasList(data);
      setGuruList(gurus);
      setMapelList(mapels);
    } catch (err) {
      console.error('Gagal memuat data kelas:', err);
      setError(err.message || 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  const loadKelas = async (tahunAjaranId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await kelasService.fetchKelas(tahunAjaranId);
      setKelasList(data);
    } catch (err) {
      console.error('Gagal memuat data kelas:', err);
      setError(err.message || 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingData(null);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (kelas) => {
    setEditingData(kelas);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id, nama) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas ${nama}?`)) return;

    try {
      await kelasService.deleteKelas(id);
      antMessage.success('Data kelas berhasil dihapus');
      await loadKelas(selectedTahunAjaranId);
    } catch (err) {
      antMessage.error(err.message || 'Gagal menghapus kelas');
    }
  };

  const handleModalSubmit = async (data) => {
    setIsSubmitting(true);
    setModalError('');

    try {
      const payload = {
        ...data,
        tahun_ajaran_id: selectedTahunAjaranId ? Number(selectedTahunAjaranId) : null
      };

      if (editingData) {
        await kelasService.updateKelas(editingData.id, payload);
        antMessage.success('Data kelas berhasil diperbarui');
      } else {
        await kelasService.createKelas(payload);
        antMessage.success('Data kelas berhasil disimpan');
      }

      setIsModalOpen(false);
      await loadKelas(selectedTahunAjaranId);
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTahunAjaranChange = (value) => {
    setSelectedTahunAjaranId(value);
    loadKelas(value);
  };

  // Sort kelas
  const sortedKelas = useMemo(() => {
    const sorted = [...kelasList];

    if (sortBy === 'terbaru' || sortBy === 'terlama') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return sortBy === 'terbaru' ? dateB - dateA : dateA - dateB;
      });
    } else {
      sorted.sort((a, b) => {
        const nameA = a.nama || '';
        const nameB = b.nama || '';
        return sortBy === 'nama-desc'
          ? nameB.localeCompare(nameA, 'id', { numeric: true, sensitivity: 'base' })
          : nameA.localeCompare(nameB, 'id', { numeric: true, sensitivity: 'base' });
      });
    }

    return sorted;
  }, [kelasList, sortBy]);

  // Group by jenis
  const kelasDiniyah = sortedKelas.filter(k => k.jenis === 'Diniyah');
  const kelasSekolah = sortedKelas.filter(k => k.jenis === 'Sekolah');

  const renderKelasGroup = (items, title, jenis, icon) => (
    <div className="kelas-group">
      <div className="kelas-group-header">
        <div className="kelas-group-title">
          {icon}
          <h3>{title}</h3>
          <span className="kelas-count">{items.length} kelas</span>
        </div>
      </div>

      {items.length > 0 ? (
        <Row gutter={[16, 16]}>
          {items.map(kelas => (
            <Col key={kelas.id} xs={24} sm={12} md={8} lg={6} xl={4}>
              <KelasCard
                kelas={kelas}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <EmptyState description={`Belum ada ${title.toLowerCase()}`} />
      )}
    </div>
  );

  if (loading) {
    return <LoadingState message="Memuat data kelas..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => loadKelas(selectedTahunAjaranId)}
      />
    );
  }

  return (
    <div className="kelas-page">
      <PageHeader
        title="📚 Manajemen Data Kelas"
        subtitle="Kelola daftar kelas Diniyah dan Sekolah"
        extra={
          <div className="kelas-header-actions">
            <Select
              value={selectedTahunAjaranId}
              onChange={handleTahunAjaranChange}
              style={{ width: 180 }}
              placeholder="Pilih Tahun Ajaran"
              className="year-select"
            >
              {tahunAjaranList.map(option => (
                <Option key={option.id} value={String(option.id)}>
                  {option.kode}{option.is_active ? ' (Berjalan)' : ''}
                </Option>
              ))}
            </Select>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 160 }}
              suffixIcon={<SortAscendingOutlined />}
            >
              <Option value="nama-asc">Nama A-Z</Option>
              <Option value="nama-desc">Nama Z-A</Option>
              <Option value="terbaru">Terbaru</Option>
              <Option value="terlama">Terlama</Option>
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddClick}
            >
              Tambah Kelas
            </Button>
          </div>
        }
      />

      <div className="kelas-content">
        {kelasList.length === 0 ? (
          <EmptyState
            description="Belum ada data kelas"
            action={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick}>
                Tambah Kelas Pertama
              </Button>
            }
          />
        ) : (
          <>
            {renderKelasGroup(kelasDiniyah, 'Kelas Diniyah', 'Diniyah', <BookOutlined style={{ color: '#2196f3' }} />)}
            <Divider />
            {renderKelasGroup(kelasSekolah, 'Kelas Sekolah', 'Sekolah', <BookOutlined style={{ color: '#9c27b0' }} />)}
          </>
        )}
      </div>

      <KelasModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editData={editingData}
        isSubmitting={isSubmitting}
        error={modalError}
        guruList={guruList}
        mapelList={mapelList}
      />
    </div>
  );
}

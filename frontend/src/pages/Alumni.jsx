import { useState, useEffect, useMemo } from 'react';
import { Button, Row, Col, message as antMessage } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { alumniService } from '../services/alumniService';
import { AlumniStats } from '../components/features/AlumniStats';
import { AlumniFilters } from '../components/features/AlumniFilters';
import { AlumniCard } from '../components/features/AlumniCard';
import { MigrateSantriModal } from '../components/features/MigrateSantriModal';
import { AlumniEditModal } from '../components/features/AlumniEditModal';
import { AlumniDetailModal } from '../components/features/AlumniDetailModal';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../components/common';
import './Alumni.scss';

export function Alumni() {
  // State
  const [alumniList, setAlumniList] = useState([]);
  const [santriList, setSantriList] = useState([]);

  // Filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Modals
  const [isMigrateModalOpen, setIsMigrateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [editingAlumni, setEditingAlumni] = useState(null);
  const [detailAlumniId, setDetailAlumniId] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Messages
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
      await Promise.all([
        loadAlumni(),
        loadSantri()
      ]);
    } catch (err) {
      console.error('Gagal memuat data awal:', err);
      setError(err.message || 'Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  const loadAlumni = async () => {
    try {
      const data = await alumniService.fetchAlumni();
      setAlumniList(data);
    } catch (err) {
      console.error('Gagal memuat data alumni:', err);
      throw err;
    }
  };

  const loadSantri = async () => {
    try {
      const data = await alumniService.fetchActiveSantri();
      setSantriList(data);
    } catch (err) {
      console.error('Gagal memuat data santri:', err);
    }
  };

  // Filter alumni
  const filteredAlumni = useMemo(() => {
    return alumniList.filter(alumni => {
      const keyword = searchKeyword.toLowerCase();
      const matchesSearch = !keyword ||
        alumni.nama.toLowerCase().includes(keyword) ||
        alumni.nis.toLowerCase().includes(keyword);

      const matchesYear = !filterYear || alumni.tahun_lulus == filterYear;

      return matchesSearch && matchesYear;
    });
  }, [alumniList, searchKeyword, filterYear]);

  // Get unique years for filter
  const yearOptions = useMemo(() => {
    const years = [...new Set(alumniList.map(a => a.tahun_lulus))];
    return years.sort((a, b) => b - a);
  }, [alumniList]);

  // Migrate handlers
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
      await loadSantri();
    } catch (err) {
      setMigrateModalError(err.message || 'Gagal migrasi santri');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit handlers
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
      antMessage.success('Data alumni berhasil diperbarui');
      setIsEditModalOpen(false);
      await loadAlumni();
    } catch (err) {
      setEditModalError(err.message || 'Gagal memperbarui data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handler
  const handleDeleteClick = async (id, nama) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data alumni ${nama}?`)) return;

    try {
      const result = await alumniService.deleteAlumni(id);
      antMessage.success(result.message || 'Data alumni berhasil dihapus');
      await loadAlumni();
      await loadSantri();
    } catch (err) {
      antMessage.error(err.message || 'Gagal menghapus alumni');
    }
  };

  // Detail handler
  const handleDetailClick = (id) => {
    setDetailAlumniId(id);
    setIsDetailModalOpen(true);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchKeyword('');
    setFilterYear('');
  };

  if (loading) {
    return <LoadingState message="Memuat data alumni..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadInitialData}
      />
    );
  }

  return (
    <div className="alumni-page">
      <PageHeader
        title="📚 Data Alumni"
        subtitle="Kelola data alumni pesantren dengan lengkap"
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

      <AlumniStats alumni={alumniList} />

      <div className="alumni-content">
        <AlumniFilters
          searchValue={searchKeyword}
          onSearchChange={setSearchKeyword}
          yearValue={filterYear}
          onYearChange={setFilterYear}
          yearOptions={yearOptions}
          onReset={handleResetFilters}
        />

        {filteredAlumni.length === 0 ? (
          <EmptyState description="Tidak ada data alumni yang sesuai" />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredAlumni.map(alumni => (
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

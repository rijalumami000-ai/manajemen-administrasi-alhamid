import { useState, useEffect } from 'react';
import { Button, Row, Col, message as antMessage, Divider } from 'antd';
import { PlusOutlined, HomeOutlined } from '@ant-design/icons';
import { kamarService } from '../services/kamarService';
import { KamarCard } from '../components/features/KamarCard';
import { KamarModal } from '../components/features/KamarModal';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../components/common';
import './Kamar.scss';

export function Kamar() {
  const [kamarList, setKamarList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadKamar();
  }, []);

  const loadKamar = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kamarService.fetchKamar();
      setKamarList(data);
    } catch (err) {
      console.error('Gagal memuat data kamar:', err);
      setError(err.message || 'Gagal memuat data kamar');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingData(null);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (kamar) => {
    setEditingData(kamar);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id, nama) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kamar ${nama}?`)) return;

    try {
      await kamarService.deleteKamar(id);
      antMessage.success('Data kamar berhasil dihapus');
      await loadKamar();
    } catch (err) {
      antMessage.error(err.message || 'Gagal menghapus kamar');
    }
  };

  const handleModalSubmit = async (data) => {
    setIsSubmitting(true);
    setModalError('');

    try {
      if (editingData) {
        await kamarService.updateKamar(editingData.id, data);
        antMessage.success('Data kamar berhasil diperbarui');
      } else {
        await kamarService.createKamar(data);
        antMessage.success('Data kamar berhasil disimpan');
      }

      setIsModalOpen(false);
      await loadKamar();
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group by jenis
  const kamarPutra = kamarList.filter(k => k.jenis === 'Putra');
  const kamarPutri = kamarList.filter(k => k.jenis === 'Putri');

  const renderKamarGroup = (items, title, icon) => (
    <div className="kamar-group">
      <div className="kamar-group-header">
        <div className="kamar-group-title">
          {icon}
          <h3>{title}</h3>
          <span className="kamar-count">{items.length} kamar</span>
        </div>
      </div>

      {items.length > 0 ? (
        <Row gutter={[16, 16]}>
          {items.map(kamar => (
            <Col key={kamar.id} xs={24} sm={12} md={8} lg={6}>
              <KamarCard
                kamar={kamar}
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
    return <LoadingState message="Memuat data kamar..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadKamar}
      />
    );
  }

  return (
    <div className="kamar-page">
      <PageHeader
        title="🏠 Manajemen Data Kamar Asrama"
        subtitle="Kelola data kamar asrama putra dan putri dengan informasi kapasitas dan status"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddClick}
          >
            Tambah Kamar
          </Button>
        }
      />

      <div className="kamar-content">
        {kamarList.length === 0 ? (
          <EmptyState
            description="Belum ada data kamar"
            action={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick}>
                Tambah Kamar Pertama
              </Button>
            }
          />
        ) : (
          <>
            {renderKamarGroup(kamarPutra, 'Kamar Putra', <HomeOutlined style={{ color: '#2196f3' }} />)}
            <Divider />
            {renderKamarGroup(kamarPutri, 'Kamar Putri', <HomeOutlined style={{ color: '#e91e63' }} />)}
          </>
        )}
      </div>

      <KamarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editData={editingData}
        isSubmitting={isSubmitting}
        error={modalError}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Home } from 'lucide-react';
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
      await loadKamar();
    } catch (err) {
      alert(err.message || 'Gagal menghapus kamar');
    }
  };

  const handleModalSubmit = async (data) => {
    setIsSubmitting(true);
    setModalError('');

    try {
      if (editingData) {
        await kamarService.updateKamar(editingData.id, data);
      } else {
        await kamarService.createKamar(data);
      }

      setIsModalOpen(false);
      await loadKamar();
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan data kamar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const kamarPutra = kamarList.filter(k => k.jenis === 'Putra');
  const kamarPutri = kamarList.filter(k => k.jenis === 'Putri');

  const renderKamarGroup = (list, title, icon) => (
    <div className="kamar-group">
      <div className="group-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        {icon}
        <h3 className="group-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{title} ({list.length})</h3>
      </div>
      {list.length === 0 ? (
        <p className="empty-group-text" style={{ color: '#94a3b8', fontSize: '13px' }}>Belum ada {title.toLowerCase()}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {list.map(kamar => (
            <KamarCard
              key={kamar.id}
              kamar={kamar}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) return <LoadingState message="Memuat data kamar..." />;
  if (error) return <ErrorState message={error} onRetry={loadKamar} />;

  return (
    <div className="kamar-page">
      <PageHeader
        title="🏠 Manajemen Data Kamar Asrama"
        subtitle="Kelola data kamar asrama putra dan putri dengan informasi kapasitas dan status"
        extra={
          <button type="button" className="btn-custom btn-primary" onClick={handleAddClick}>
            <Plus size={16} /> Tambah Kamar
          </button>
        }
      />

      <div className="kamar-content" style={{ marginTop: '16px' }}>
        {kamarList.length === 0 ? (
          <EmptyState
            description="Belum ada data kamar"
            action={
              <button type="button" className="btn-custom btn-primary" onClick={handleAddClick}>
                <Plus size={16} /> Tambah Kamar Pertama
              </button>
            }
          />
        ) : (
          <>
            {renderKamarGroup(kamarPutra, 'Kamar Putra', <Home size={20} style={{ color: '#2196f3' }} />)}
            <div style={{ height: '1px', background: '#e2e8f0', margin: '24px 0' }} />
            {renderKamarGroup(kamarPutri, 'Kamar Putri', <Home size={20} style={{ color: '#e91e63' }} />)}
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

import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Trophy } from 'lucide-react';
import { pelanggaranService } from '../services/pelanggaranService';
import { PelanggaranTable } from '../components/features/PelanggaranTable';
import { PrestasiTable } from '../components/features/PrestasiTable';
import { PelanggaranModal } from '../components/features/PelanggaranModal';
import { PrestasiModal } from '../components/features/PrestasiModal';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import { CustomTabs } from '../components/ui/CustomTabs';
import './PelanggaranPrestasi.scss';

export function PelanggaranPrestasi() {
  const [pelanggaranList, setPelanggaranList] = useState([]);
  const [prestasiList, setPrestasiList] = useState([]);
  const [activeTab, setActiveTab] = useState('pelanggaran');

  const [isPelanggaranModalOpen, setIsPelanggaranModalOpen] = useState(false);
  const [isPrestasiModalOpen, setIsPrestasiModalOpen] = useState(false);
  const [editingPelanggaran, setEditingPelanggaran] = useState(null);
  const [editingPrestasi, setEditingPrestasi] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pelanggaranModalError, setPelanggaranModalError] = useState('');
  const [prestasiModalError, setPrestasiModalError] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadPelanggaran(), loadPrestasi()]);
    } catch (err) {
      console.error('Gagal memuat data awal:', err);
      setError(err.message || 'Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  const loadPelanggaran = async () => {
    const data = await pelanggaranService.fetchPelanggaran();
    setPelanggaranList(data);
  };

  const loadPrestasi = async () => {
    const data = await pelanggaranService.fetchPrestasi();
    setPrestasiList(data);
  };

  const handleAddPelanggaranClick = () => {
    setEditingPelanggaran(null);
    setPelanggaranModalError('');
    setIsPelanggaranModalOpen(true);
  };

  const handleEditPelanggaranClick = (pelanggaran) => {
    setEditingPelanggaran(pelanggaran);
    setPelanggaranModalError('');
    setIsPelanggaranModalOpen(true);
  };

  const handleDeletePelanggaranClick = async (id, namaSantri) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pelanggaran ${namaSantri}?`)) return;

    try {
      await pelanggaranService.deletePelanggaran(id);
      await loadPelanggaran();
    } catch (err) {
      alert(err.message || 'Gagal menghapus pelanggaran');
    }
  };

  const handlePelanggaranSubmit = async (data) => {
    setIsSubmitting(true);
    setPelanggaranModalError('');

    try {
      if (editingPelanggaran) {
        await pelanggaranService.updatePelanggaran(editingPelanggaran.id, data);
      } else {
        await pelanggaranService.createPelanggaran(data);
      }
      setIsPelanggaranModalOpen(false);
      await loadPelanggaran();
    } catch (err) {
      setPelanggaranModalError(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPrestasiClick = () => {
    setEditingPrestasi(null);
    setPrestasiModalError('');
    setIsPrestasiModalOpen(true);
  };

  const handleEditPrestasiClick = (prestasi) => {
    setEditingPrestasi(prestasi);
    setPrestasiModalError('');
    setIsPrestasiModalOpen(true);
  };

  const handleDeletePrestasiClick = async (id, namaSantri) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus prestasi ${namaSantri}?`)) return;

    try {
      await pelanggaranService.deletePrestasi(id);
      await loadPrestasi();
    } catch (err) {
      alert(err.message || 'Gagal menghapus prestasi');
    }
  };

  const handlePrestasiSubmit = async (data) => {
    setIsSubmitting(true);
    setPrestasiModalError('');

    try {
      if (editingPrestasi) {
        await pelanggaranService.updatePrestasi(editingPrestasi.id, data);
      } else {
        await pelanggaranService.createPrestasi(data);
      }
      setIsPrestasiModalOpen(false);
      await loadPrestasi();
    } catch (err) {
      setPrestasiModalError(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Memuat data pelanggaran & prestasi..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadInitialData} />;
  }

  const tabItems = [
    {
      key: 'pelanggaran',
      label: 'Pelanggaran',
      icon: <AlertTriangle size={16} style={{ color: '#ef4444' }} />,
      badge: pelanggaranList.length,
      children: (
        <PelanggaranTable
          data={pelanggaranList}
          onEdit={handleEditPelanggaranClick}
          onDelete={handleDeletePelanggaranClick}
        />
      )
    },
    {
      key: 'prestasi',
      label: 'Prestasi',
      icon: <Trophy size={16} style={{ color: '#f59e0b' }} />,
      badge: prestasiList.length,
      children: (
        <PrestasiTable
          data={prestasiList}
          onEdit={handleEditPrestasiClick}
          onDelete={handleDeletePrestasiClick}
        />
      )
    }
  ];

  return (
    <div className="pelanggaran-prestasi-page">
      <PageHeader
        title="⚠️ Manajemen Pelanggaran & Prestasi"
        subtitle="Kelola catatan pelanggaran dan prestasi santri dari satu tempat"
        extra={
          activeTab === 'pelanggaran' ? (
            <button type="button" className="btn-custom btn-primary" onClick={handleAddPelanggaranClick}>
              <Plus size={16} /> Tambah Pelanggaran
            </button>
          ) : (
            <button type="button" className="btn-custom btn-primary" onClick={handleAddPrestasiClick}>
              <Plus size={16} /> Tambah Prestasi
            </button>
          )
        }
      />

      <div className="pelanggaran-prestasi-content" style={{ marginTop: '16px' }}>
        <CustomTabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <PelanggaranModal
        isOpen={isPelanggaranModalOpen}
        onClose={() => setIsPelanggaranModalOpen(false)}
        onSubmit={handlePelanggaranSubmit}
        editData={editingPelanggaran}
        isSubmitting={isSubmitting}
        error={pelanggaranModalError}
      />

      <PrestasiModal
        isOpen={isPrestasiModalOpen}
        onClose={() => setIsPrestasiModalOpen(false)}
        onSubmit={handlePrestasiSubmit}
        editData={editingPrestasi}
        isSubmitting={isSubmitting}
        error={prestasiModalError}
      />
    </div>
  );
}

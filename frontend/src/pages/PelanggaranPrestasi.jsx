import { useState, useEffect } from 'react';
import { Tabs, Button, message as antMessage } from 'antd';
import { PlusOutlined, WarningOutlined, TrophyOutlined } from '@ant-design/icons';
import { pelanggaranService } from '../services/pelanggaranService';
import { PelanggaranTable } from '../components/features/PelanggaranTable';
import { PrestasiTable } from '../components/features/PrestasiTable';
import { PelanggaranModal } from '../components/features/PelanggaranModal';
import { PrestasiModal } from '../components/features/PrestasiModal';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import './PelanggaranPrestasi.scss';

export function PelanggaranPrestasi() {
  // State
  const [pelanggaranList, setPelanggaranList] = useState([]);
  const [prestasiList, setPrestasiList] = useState([]);

  // Active tab
  const [activeTab, setActiveTab] = useState('pelanggaran');

  // Modals
  const [isPelanggaranModalOpen, setIsPelanggaranModalOpen] = useState(false);
  const [isPrestasiModalOpen, setIsPrestasiModalOpen] = useState(false);

  const [editingPelanggaran, setEditingPelanggaran] = useState(null);
  const [editingPrestasi, setEditingPrestasi] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Messages
  const [pelanggaranModalError, setPelanggaranModalError] = useState('');
  const [prestasiModalError, setPrestasiModalError] = useState('');

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
        loadPelanggaran(),
        loadPrestasi()
      ]);
    } catch (err) {
      console.error('Gagal memuat data awal:', err);
      setError(err.message || 'Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  const loadPelanggaran = async () => {
    try {
      const data = await pelanggaranService.fetchPelanggaran();
      setPelanggaranList(data);
    } catch (err) {
      console.error('Gagal memuat data pelanggaran:', err);
      throw err;
    }
  };

  const loadPrestasi = async () => {
    try {
      const data = await pelanggaranService.fetchPrestasi();
      setPrestasiList(data);
    } catch (err) {
      console.error('Gagal memuat data prestasi:', err);
      throw err;
    }
  };

  // Pelanggaran handlers
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
      antMessage.success('Data pelanggaran berhasil dihapus');
      await loadPelanggaran();
    } catch (err) {
      antMessage.error(err.message || 'Gagal menghapus pelanggaran');
    }
  };

  const handlePelanggaranSubmit = async (data) => {
    setIsSubmitting(true);
    setPelanggaranModalError('');

    try {
      if (editingPelanggaran) {
        await pelanggaranService.updatePelanggaran(editingPelanggaran.id, data);
        antMessage.success('Data pelanggaran berhasil diperbarui');
      } else {
        await pelanggaranService.createPelanggaran(data);
        antMessage.success('Data pelanggaran berhasil disimpan');
      }

      setIsPelanggaranModalOpen(false);
      await loadPelanggaran();
    } catch (err) {
      setPelanggaranModalError(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prestasi handlers
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
      antMessage.success('Data prestasi berhasil dihapus');
      await loadPrestasi();
    } catch (err) {
      antMessage.error(err.message || 'Gagal menghapus prestasi');
    }
  };

  const handlePrestasiSubmit = async (data) => {
    setIsSubmitting(true);
    setPrestasiModalError('');

    try {
      if (editingPrestasi) {
        await pelanggaranService.updatePrestasi(editingPrestasi.id, data);
        antMessage.success('Data prestasi berhasil diperbarui');
      } else {
        await pelanggaranService.createPrestasi(data);
        antMessage.success('Data prestasi berhasil disimpan');
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
    return (
      <ErrorState
        message={error}
        onRetry={loadInitialData}
      />
    );
  }

  const tabItems = [
    {
      key: 'pelanggaran',
      label: (
        <span>
          <WarningOutlined /> Pelanggaran ({pelanggaranList.length})
        </span>
      ),
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
      label: (
        <span>
          <TrophyOutlined /> Prestasi ({prestasiList.length})
        </span>
      ),
      children: (
        <PrestasiTable
          data={prestasiList}
          onEdit={handleEditPrestasiClick}
          onDelete={handleDeletePrestasiClick}
        />
      )
    }
  ];

  const getTabExtra = () => {
    if (activeTab === 'pelanggaran') {
      return (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddPelanggaranClick}
        >
          Tambah Pelanggaran
        </Button>
      );
    }
    return (
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddPrestasiClick}
      >
        Tambah Prestasi
      </Button>
    );
  };

  return (
    <div className="pelanggaran-prestasi-page">
      <PageHeader
        title="⚠️ Manajemen Pelanggaran & Prestasi"
        subtitle="Kelola catatan pelanggaran dan prestasi santri dari satu tempat"
      />

      <div className="pelanggaran-prestasi-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarExtraContent={getTabExtra()}
          className="pelanggaran-prestasi-tabs"
        />
      </div>

      {/* Modals */}
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

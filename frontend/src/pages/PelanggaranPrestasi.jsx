import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Trophy, Filter, RefreshCw } from 'lucide-react';
import { pelanggaranService } from '../services/pelanggaranService';
import { PelanggaranTable } from '../components/features/PelanggaranTable';
import { PrestasiTable } from '../components/features/PrestasiTable';
import { PelanggaranModal } from '../components/features/PelanggaranModal';
import { PrestasiModal } from '../components/features/PrestasiModal';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import { CustomTabs } from '../components/ui/CustomTabs';
import { CustomSelect } from '../components/ui/CustomSelect';
import './PelanggaranPrestasi.scss';

export function PelanggaranPrestasi() {
  const [pelanggaranList, setPelanggaranList] = useState([]);
  const [prestasiList, setPrestasiList] = useState([]);
  const [activeTab, setActiveTab] = useState('pelanggaran');

  // Academic Year State
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);

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
    loadTahunAjaran();
  }, []);

  useEffect(() => {
    if (selectedTahunAjaran !== null) {
      loadData(selectedTahunAjaran);
    }
  }, [selectedTahunAjaran]);

  const loadTahunAjaran = async () => {
    try {
      setLoading(true);
      const list = await pelanggaranService.fetchTahunAjaran();
      setTahunAjaranList(list);
      const active = list.find(t => t.is_active);
      if (active) {
        setSelectedTahunAjaran(active.id);
      } else if (list.length > 0) {
        setSelectedTahunAjaran(list[0].id);
      } else {
        setSelectedTahunAjaran('');
      }
    } catch (err) {
      console.error('Gagal memuat tahun ajaran:', err);
      setError(err.message || 'Gagal memuat tahun ajaran');
      setLoading(false);
    }
  };

  const loadData = async (tahunId) => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        loadPelanggaran(tahunId),
        loadPrestasi(tahunId)
      ]);
    } catch (err) {
      console.error('Gagal memuat data:', err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadPelanggaran = async (tahunId) => {
    const tid = tahunId === 'all' ? null : tahunId;
    const data = await pelanggaranService.fetchPelanggaran(tid);
    setPelanggaranList(data);
  };

  const loadPrestasi = async (tahunId) => {
    const tid = tahunId === 'all' ? null : tahunId;
    const data = await pelanggaranService.fetchPrestasi(tid);
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
      await loadPelanggaran(selectedTahunAjaran);
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
      await loadPelanggaran(selectedTahunAjaran);
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
      await loadPrestasi(selectedTahunAjaran);
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
      await loadPrestasi(selectedTahunAjaran);
    } catch (err) {
      setPrestasiModalError(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !selectedTahunAjaran && tahunAjaranList.length === 0) {
    return <LoadingState message="Memuat data pelanggaran & prestasi..." />;
  }

  if (error && tahunAjaranList.length === 0) {
    return <ErrorState message={error} onRetry={loadTahunAjaran} />;
  }

  const tahunOptions = [
    { value: 'all', label: 'Semua Tahun Ajaran' },
    ...tahunAjaranList.map(t => ({
      value: String(t.id),
      label: `${t.kode} ${t.is_active ? '(Aktif)' : ''}`
    }))
  ];

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
        subtitle="Kelola catatan pelanggaran dan prestasi santri terintegrasi per tahun ajaran"
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ width: '220px' }}>
              <CustomSelect
                value={selectedTahunAjaran ? String(selectedTahunAjaran) : 'all'}
                onChange={(val) => setSelectedTahunAjaran(val === 'all' ? 'all' : Number(val))}
                options={tahunOptions}
                placeholder="Pilih Tahun Ajaran"
              />
            </div>
            {activeTab === 'pelanggaran' ? (
              <button type="button" className="btn-custom btn-primary" onClick={handleAddPelanggaranClick}>
                <Plus size={16} /> Tambah Pelanggaran
              </button>
            ) : (
              <button type="button" className="btn-custom btn-primary" onClick={handleAddPrestasiClick}>
                <Plus size={16} /> Tambah Prestasi
              </button>
            )}
            <button 
              type="button" 
              className="btn-custom btn-secondary" 
              onClick={() => loadData(selectedTahunAjaran)}
              disabled={loading}
              title="Muat Ulang"
            >
              <RefreshCw size={16} className={loading ? 'spin-anim' : ''} />
            </button>
          </div>
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
        tahunAjaranList={tahunAjaranList}
        defaultTahunAjaranId={selectedTahunAjaran === 'all' ? (tahunAjaranList.find(t => t.is_active)?.id || null) : selectedTahunAjaran}
      />

      <PrestasiModal
        isOpen={isPrestasiModalOpen}
        onClose={() => setIsPrestasiModalOpen(false)}
        onSubmit={handlePrestasiSubmit}
        editData={editingPrestasi}
        isSubmitting={isSubmitting}
        error={prestasiModalError}
        tahunAjaranList={tahunAjaranList}
        defaultTahunAjaranId={selectedTahunAjaran === 'all' ? (tahunAjaranList.find(t => t.is_active)?.id || null) : selectedTahunAjaran}
      />
    </div>
  );
}
export default PelanggaranPrestasi;

import React, { useState, useEffect } from 'react';
import { Plus, Home, Users, BedDouble, Building, Layers, CheckCircle2 } from 'lucide-react';
import { kamarService } from '../services/kamarService';
import { KamarCard } from '../components/features/KamarCard';
import { KamarModal } from '../components/features/KamarModal';
import { KamarAnggotaModal } from '../components/features/KamarAnggotaModal';
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

  // Filter & detail states
  const [activeTab, setActiveTab] = useState('semua'); // 'semua' | 'putra' | 'putri'
  const [selectedKamar, setSelectedKamar] = useState(null);
  const [isAnggotaModalOpen, setIsAnggotaModalOpen] = useState(false);

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

  const handleSelectKamar = (kamar) => {
    setSelectedKamar(kamar);
    setIsAnggotaModalOpen(true);
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

  // Overall statistics
  const totalKapasitas = kamarList.reduce((acc, k) => acc + (Number(k.kapasitas) || 0), 0);
  const totalTerisi = kamarList.reduce((acc, k) => acc + (Number(k.terisi) || 0), 0);
  const totalSisa = Math.max(0, totalKapasitas - totalTerisi);

  const totalSantriPutra = kamarPutra.reduce((acc, k) => acc + (Number(k.terisi) || 0), 0);
  const totalSantriPutri = kamarPutri.reduce((acc, k) => acc + (Number(k.terisi) || 0), 0);

  const renderKamarGrid = (list, title, theme) => (
    <div className={`kamar-group ${theme}`}>
      <div className="group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Home size={20} style={{ color: theme === 'theme-putra' ? '#2563eb' : '#db2777' }} />
          <h3 className="group-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            {title} ({list.length} Kamar)
          </h3>
        </div>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
          {list.reduce((acc, k) => acc + (Number(k.terisi) || 0), 0)} Penghuni Terdaftar
        </span>
      </div>

      {list.length === 0 ? (
        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
          Belum ada {title.toLowerCase()}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {list.map(kamar => (
            <KamarCard
              key={kamar.id}
              kamar={kamar}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onSelect={handleSelectKamar}
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
        subtitle="Kelola data kamar asrama putra dan putri, visualisasi kapasitas, lantai, serta daftar anggota kamar"
        extra={
          <button type="button" className="btn-custom btn-primary" onClick={handleAddClick}>
            <Plus size={16} /> Tambah Kamar
          </button>
        }
      />

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BedDouble size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Total Kamar</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{kamarList.length} Kamar</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Santri Terisi</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>{totalTerisi} / {totalKapasitas}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Sisa Kuota Kamar</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#d97706' }}>{totalSisa} Tempat</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fdf2f8', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Putra : Putri</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{totalSantriPutra} L : {totalSantriPutri} P</div>
          </div>
        </div>
      </div>

      {/* Segmented Tab Controls */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        <button
          type="button"
          onClick={() => setActiveTab('semua')}
          style={{
            padding: '8px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'semua' ? '#ffffff' : 'transparent',
            color: activeTab === 'semua' ? '#0f172a' : '#64748b',
            boxShadow: activeTab === 'semua' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Semua Kamar ({kamarList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('putra')}
          style={{
            padding: '8px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'putra' ? '#ffffff' : 'transparent',
            color: activeTab === 'putra' ? '#1d4ed8' : '#64748b',
            boxShadow: activeTab === 'putra' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          👦 Komplek Putra ({kamarPutra.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('putri')}
          style={{
            padding: '8px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'putri' ? '#ffffff' : 'transparent',
            color: activeTab === 'putri' ? '#be185d' : '#64748b',
            boxShadow: activeTab === 'putri' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          👧 Komplek Putri ({kamarPutri.length})
        </button>
      </div>

      {/* Kamar Content */}
      <div className="kamar-content">
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
            {(activeTab === 'semua' || activeTab === 'putra') && (
              <>
                {renderKamarGrid(kamarPutra, 'Kamar Asrama Putra', 'theme-putra')}
                {activeTab === 'semua' && <div style={{ height: '1px', background: '#e2e8f0', margin: '28px 0' }} />}
              </>
            )}

            {(activeTab === 'semua' || activeTab === 'putri') && (
              renderKamarGrid(kamarPutri, 'Kamar Asrama Putri', 'theme-putri')
            )}
          </>
        )}
      </div>

      {/* Modal Edit / Add Room */}
      <KamarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editData={editingData}
        isSubmitting={isSubmitting}
        error={modalError}
      />

      {/* Modal Detail & Anggota Kamar */}
      <KamarAnggotaModal
        isOpen={isAnggotaModalOpen}
        onClose={() => setIsAnggotaModalOpen(false)}
        kamarId={selectedKamar?.id}
        initialKamar={selectedKamar}
      />
    </div>
  );
}

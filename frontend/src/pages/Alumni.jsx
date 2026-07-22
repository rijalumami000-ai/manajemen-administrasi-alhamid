import { useState, useEffect, useMemo } from 'react';
import { UserCheck, UserX, Plus, RotateCcw, Edit2, Trash2 } from 'lucide-react';
import { alumniService } from '../services/alumniService';
import { AlumniStats } from '../components/features/AlumniStats';
import { AlumniCard } from '../components/features/AlumniCard';
import { MigrateSantriModal } from '../components/features/MigrateSantriModal';
import { AlumniEditModal } from '../components/features/AlumniEditModal';
import { AlumniDetailModal } from '../components/features/AlumniDetailModal';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../components/common';
import { CustomTabs } from '../components/ui/CustomTabs';
import { CustomTag } from '../components/ui/CustomTag';
import { SearchInput } from '../components/common/SearchInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { santriService } from '../services/santriService';
import './Alumni.scss';

export function Alumni() {
  const [allAlumni, setAllAlumni] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [activeTab, setActiveTab] = useState('alumni');

  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('');
  const [filterTahunLulus, setFilterTahunLulus] = useState('');

  const [isMigrateModalOpen, setIsMigrateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState(null);
  const [detailAlumniId, setDetailAlumniId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [migrateModalError, setMigrateModalError] = useState('');
  const [editModalError, setEditModalError] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    }
  };

  const filterData = (list) => {
    return list.filter(item => {
      const keyword = searchKeyword.toLowerCase();
      const nama = (item.nama || '').toLowerCase();
      const nis = String(item.nis || '').toLowerCase();
      const matchesSearch = !keyword || nama.includes(keyword) || nis.includes(keyword);

      const matchesTahunLulus = !filterTahunLulus || String(item.tahun_lulus) === String(filterTahunLulus);
      const matchesTahunAjaran = !filterTahunAjaran || String(item.tahun_ajaran_id) === String(filterTahunAjaran);

      return matchesSearch && matchesTahunLulus && matchesTahunAjaran;
    });
  };

  const alumniDataList = useMemo(() =>
    filterData(allAlumni.filter(a => a.tipe === 'alumni' || !a.tipe)),
    [allAlumni, searchKeyword, filterTahunLulus, filterTahunAjaran]
  );

  const pindahDataList = useMemo(() =>
    filterData(allAlumni.filter(a => a.tipe === 'pindah')),
    [allAlumni, searchKeyword, filterTahunLulus, filterTahunAjaran]
  );

  const tahunLulusOptions = useMemo(() => {
    const years = [...new Set(allAlumni.map(a => a.tahun_lulus))].filter(Boolean);
    return years.sort((a, b) => b - a);
  }, [allAlumni]);

  const handleMigrateClick = () => {
    setMigrateModalError('');
    setIsMigrateModalOpen(true);
  };

  const handleMigrateSubmit = async (data) => {
    setIsSubmitting(true);
    setMigrateModalError('');
    try {
      await alumniService.migrateSantri(data);
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
      await alumniService.deleteAlumni(id);
      await loadAlumni();
    } catch (err) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  const handleReactivateClick = async (id, nama) => {
    if (!confirm(`Apakah Anda yakin ingin mengaktifkan kembali ${nama} ke tahun ajaran berjalan?`)) return;
    try {
      setLoading(true);
      await alumniService.reactivateAlumni(id);
      await loadAlumni();
      const santriData = await alumniService.fetchActiveSantri().catch(() => []);
      setSantriList(santriData);
    } catch (err) {
      alert(err.message || 'Gagal mengaktifkan kembali siswa');
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

  const FilterBar = () => (
    <div className="alumni-filter-bar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
      <div style={{ width: '220px' }}>
        <SearchInput
          placeholder="Cari nama / NIS..."
          value={searchKeyword}
          onChange={setSearchKeyword}
        />
      </div>

      <div style={{ width: '180px' }}>
        <CustomSelect
          placeholder="Filter Tahun Ajaran"
          value={filterTahunAjaran}
          onChange={setFilterTahunAjaran}
          options={[
            { label: 'Semua Tahun Ajaran', value: '' },
            ...tahunAjaranList.map(ta => ({ label: `${ta.kode}${ta.is_active ? ' (Aktif)' : ''}`, value: String(ta.id) }))
          ]}
        />
      </div>

      <div style={{ width: '160px' }}>
        <CustomSelect
          placeholder="Filter Tahun Lulus"
          value={filterTahunLulus}
          onChange={setFilterTahunLulus}
          options={[
            { label: 'Semua Tahun Lulus', value: '' },
            ...tahunLulusOptions.map(y => ({ label: `Tahun ${y}`, value: String(y) }))
          ]}
        />
      </div>

      <button type="button" className="btn-custom btn-secondary" onClick={handleResetFilters} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <RotateCcw size={16} /> Reset
      </button>
    </div>
  );

  const tabItems = [
    {
      key: 'alumni',
      label: 'Alumni / Lulusan',
      icon: <UserCheck size={16} />,
      badge: alumniDataList.length,
      children: (
        <>
          <FilterBar />
          {alumniDataList.length === 0 ? (
            <EmptyState description="Tidak ada data alumni yang sesuai" />
          ) : (
            <div className="alumni-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {alumniDataList.map(alumni => (
                <AlumniCard
                  key={alumni.id}
                  alumni={alumni}
                  onDetail={handleDetailClick}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </>
      )
    },
    {
      key: 'pindah',
      label: 'Siswa Pindah / Migrasi',
      icon: <UserX size={16} />,
      badge: pindahDataList.length,
      children: (
        <>
          <FilterBar />
          <div style={{ width: '100%', overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>NIS</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Nama</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Kelas Terakhir</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Tahun</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Tahun Ajaran</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Keterangan</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '180px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pindahDataList.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada data siswa pindah yang sesuai.</td></tr>
                ) : (
                  pindahDataList.map((record) => {
                    const ta = tahunAjaranList.find(t => t.id === record.tahun_ajaran_id);
                    return (
                      <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{record.nis || '-'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ cursor: 'pointer', color: '#2196f3', fontWeight: 600 }} onClick={() => handleDetailClick(record.id)}>
                            {record.nama}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>{record.kelas_terakhir || '-'}</td>
                        <td style={{ padding: '10px 12px' }}>{record.tahun_lulus || '-'}</td>
                        <td style={{ padding: '10px 12px' }}>{ta ? ta.kode : (record.tahun_ajaran_id || '-')}</td>
                        <td style={{ padding: '10px 12px' }}><CustomTag color="orange">Pindah / Migrasi</CustomTag></td>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{record.keterangan || '-'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            {record.santri_id && (
                              <button
                                type="button"
                                className="btn-custom btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => handleReactivateClick(record.id, record.nama)}
                              >
                                Reaktifkan
                              </button>
                            )}
                            <button type="button" onClick={() => handleEditClick(record)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2196f3' }}>
                              <Edit2 size={16} />
                            </button>
                            <button type="button" onClick={() => handleDeleteClick(record.id, record.nama)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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
          <button type="button" className="btn-custom btn-primary" onClick={handleMigrateClick}>
            <Plus size={16} /> Tambah dari Santri
          </button>
        }
      />

      <AlumniStats alumni={allAlumni.filter(a => a.tipe === 'alumni' || !a.tipe)} />

      <div className="alumni-content" style={{ marginTop: '16px' }}>
        <CustomTabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </div>

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

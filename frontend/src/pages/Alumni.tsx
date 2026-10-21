import React, { useState, useEffect, useMemo } from 'react';
import { UserX, Plus, RotateCcw, Trash2, GraduationCap, BookOpen, Award } from 'lucide-react';
import { alumniService } from '../services/alumniService';
import { AlumniStats } from '../components/features/AlumniStats';
import { AlumniCard } from '../components/features/AlumniCard';
import { MigrateSantriModal } from '../components/features/MigrateSantriModal';
import { AlumniDetailModal } from '../components/features/AlumniDetailModal';
import { LoadingState, ErrorState, EmptyState } from '../components/common';
import { CustomTag } from '../components/ui/CustomTag';
import { SearchInput } from '../components/common/SearchInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { santriService } from '../services/santriService';
import type { AlumniItem, ActiveSantriItem, TahunAjaranItem } from '../types/alumni';
import './Alumni.scss';

export function Alumni() {
  const [allAlumni, setAllAlumni] = useState<AlumniItem[]>([]);
  const [santriList, setSantriList] = useState<ActiveSantriItem[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranItem[]>([]);
  const [activeTab, setActiveTab] = useState<'alumni' | 'lulus_mts' | 'lulus_aliyah' | 'pindah'>('alumni');

  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterTahunAjaran, setFilterTahunAjaran] = useState<string>('');
  const [filterTahunLulus, setFilterTahunLulus] = useState<string>('');

  const [isMigrateModalOpen, setIsMigrateModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [detailAlumniId, setDetailAlumniId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [migrateModalError, setMigrateModalError] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      setAllAlumni(Array.isArray(alumniData) ? alumniData : []);
      setSantriList(Array.isArray(santriData) ? santriData : []);
      setTahunAjaranList(Array.isArray(tahunData) ? tahunData : []);
    } catch (err: any) {
      console.error('Gagal memuat data alumni:', err);
      setError(err.message || 'Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  const loadAlumni = async () => {
    try {
      const data = await alumniService.fetchAlumni();
      setAllAlumni(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal memuat data alumni:', err);
    }
  };

  const filterData = (list: AlumniItem[]) => {
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

  const alumniDiniyahList = useMemo(() =>
    filterData(allAlumni.filter(a => a.tipe === 'alumni' || (!a.tipe && a.keterangan?.toLowerCase().includes('diniyah')))),
    [allAlumni, searchKeyword, filterTahunLulus, filterTahunAjaran]
  );

  const lulusMtsList = useMemo(() =>
    filterData(allAlumni.filter(a => a.tipe === 'lulus_mts')),
    [allAlumni, searchKeyword, filterTahunLulus, filterTahunAjaran]
  );

  const lulusAliyahList = useMemo(() =>
    filterData(allAlumni.filter(a => a.tipe === 'lulus_aliyah')),
    [allAlumni, searchKeyword, filterTahunLulus, filterTahunAjaran]
  );

  const pindahDataList = useMemo(() =>
    filterData(allAlumni.filter(a => a.tipe === 'pindah')),
    [allAlumni, searchKeyword, filterTahunLulus, filterTahunAjaran]
  );

  const tahunLulusOptions = useMemo(() => {
    const years = [...new Set(allAlumni.map(a => a.tahun_lulus))].filter(Boolean) as (number | string)[];
    return years.sort((a, b) => Number(b) - Number(a));
  }, [allAlumni]);

  const handleMigrateClick = () => {
    setMigrateModalError('');
    setIsMigrateModalOpen(true);
  };

  const handleMigrateSubmit = async (data: any) => {
    setIsSubmitting(true);
    setMigrateModalError('');
    try {
      await alumniService.migrateSantri(data);
      setIsMigrateModalOpen(false);
      await loadAlumni();
      const santriData = await alumniService.fetchActiveSantri().catch(() => []);
      setSantriList(santriData);
    } catch (err: any) {
      setMigrateModalError(err.message || 'Gagal migrasi santri');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: number, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data ${nama}?`)) return;
    try {
      await alumniService.deleteAlumni(id);
      await loadAlumni();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  const handleReactivateClick = async (id: number, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin mengaktifkan kembali ${nama} ke tahun ajaran berjalan?`)) return;
    try {
      setLoading(true);
      await alumniService.reactivateAlumni(id);
      await loadAlumni();
      const santriData = await alumniService.fetchActiveSantri().catch(() => []);
      setSantriList(santriData);
    } catch (err: any) {
      alert(err.message || 'Gagal mengaktifkan kembali siswa');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailClick = (id: number) => {
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
    <div className="alumni-filter-bar no-print">
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

      <button type="button" className="action-pill-btn secondary-pill" onClick={handleResetFilters}>
        <RotateCcw size={15} />
        <span>Reset</span>
      </button>
    </div>
  );

  const renderCardGrid = (list: AlumniItem[], emptyMessage: string) => (
    <>
      <FilterBar />
      {list.length === 0 ? (
        <EmptyState description={emptyMessage} />
      ) : (
        <div className="alumni-cards-grid">
          {list.map(alumni => (
            <AlumniCard
              key={alumni.id}
              alumni={alumni}
              onDetail={handleDetailClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="alumni-page">
      {/* HEADER TACTILE BAKU (Murni teks tanpa emoji/orb di samping judul) */}
      <header className="tactile-page-header no-print">
        <div className="header-text-block">
          <h2 className="page-title">Data Alumni, Kelulusan & Mutasi</h2>
          <p className="page-subtitle">Kelola data alumni Diniyah, lulusan MTs / Aliyah, dan santri pindah/mutasi pesantren</p>
        </div>
        <div className="header-actions">
          <button type="button" className="action-pill-btn primary-pill" onClick={handleMigrateClick}>
            <Plus size={16} />
            <span>Tambah Kelulusan / Mutasi</span>
          </button>
        </div>
      </header>

      {/* STATS SUMMARY OPTION A */}
      <AlumniStats alumni={allAlumni} />

      {/* OPTION A SEGMENTED CONTROL DOCK */}
      <div className="segmented-tabs-dock no-print" style={{ alignSelf: 'flex-start' }}>
        <button
          type="button"
          className={`segmented-tab-btn ${activeTab === 'alumni' ? 'active' : ''}`}
          onClick={() => setActiveTab('alumni')}
        >
          <GraduationCap size={15} />
          <span>Alumni Diniyah</span>
          <span className="tab-badge">{alumniDiniyahList.length}</span>
        </button>
        <button
          type="button"
          className={`segmented-tab-btn ${activeTab === 'lulus_mts' ? 'active' : ''}`}
          onClick={() => setActiveTab('lulus_mts')}
        >
          <BookOpen size={15} />
          <span>Lulusan MTs</span>
          <span className="tab-badge">{lulusMtsList.length}</span>
        </button>
        <button
          type="button"
          className={`segmented-tab-btn ${activeTab === 'lulus_aliyah' ? 'active' : ''}`}
          onClick={() => setActiveTab('lulus_aliyah')}
        >
          <Award size={15} />
          <span>Lulusan Aliyah</span>
          <span className="tab-badge">{lulusAliyahList.length}</span>
        </button>
        <button
          type="button"
          className={`segmented-tab-btn ${activeTab === 'pindah' ? 'active' : ''}`}
          onClick={() => setActiveTab('pindah')}
        >
          <UserX size={15} />
          <span>Siswa Pindah / Migrasi</span>
          <span className="tab-badge">{pindahDataList.length}</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="alumni-tab-content">
        {activeTab === 'alumni' && (
          <div>
            <div className="alumni-info-banner diniyah">
              <span><strong>Alumni Madrasah Diniyah:</strong> Data santri yang telah menyelesaikan pendidikan kepesantrenan dan dinyatakan lulus Madrasah Diniyah (Kelas 6 / Mutakhorijin Diniyah).</span>
            </div>
            {renderCardGrid(alumniDiniyahList, 'Tidak ada data alumni Diniyah yang sesuai')}
          </div>
        )}

        {activeTab === 'lulus_mts' && (
          <div>
            <div className="alumni-info-banner mts">
              <span><strong>Lulusan Madrasah Tsanawiyah (MTs):</strong> Data siswa yang telah menyelesaikan pendidikan formal dan dinyatakan Lulus jenjang MTs (Kelas 3 MTs / Kelas 9).</span>
            </div>
            {renderCardGrid(lulusMtsList, 'Tidak ada data lulusan MTs yang sesuai')}
          </div>
        )}

        {activeTab === 'lulus_aliyah' && (
          <div>
            <div className="alumni-info-banner aliyah">
              <span><strong>Lulusan Madrasah Aliyah (Aliyah/MA):</strong> Data siswa yang telah menyelesaikan pendidikan formal dan dinyatakan Lulus jenjang Aliyah (Kelas 3 Aliyah / Kelas 12).</span>
            </div>
            {renderCardGrid(lulusAliyahList, 'Tidak ada data lulusan Aliyah yang sesuai')}
          </div>
        )}

        {activeTab === 'pindah' && (
          <div>
            <div className="alumni-info-banner pindah">
              <span><strong>Siswa Pindah / Mutasi:</strong> Data santri yang mengajukan mutasi keluar atau pindah sekolah/pesantren.</span>
            </div>
            <FilterBar />
            <div className="alumni-table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>NIS</th>
                    <th>Nama</th>
                    <th>Kelas Terakhir</th>
                    <th>Tahun</th>
                    <th>Tahun Ajaran</th>
                    <th>Status</th>
                    <th>Keterangan</th>
                    <th style={{ textAlign: 'center', width: '190px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pindahDataList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        Tidak ada data siswa pindah yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    pindahDataList.map((record) => {
                      const ta = tahunAjaranList.find(t => t.id === record.tahun_ajaran_id);
                      return (
                        <tr key={record.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{record.nis || '-'}</td>
                          <td>
                            <span 
                              style={{ cursor: 'pointer', color: '#0052ff', fontWeight: 700 }} 
                              onClick={() => handleDetailClick(record.id)}
                            >
                              {record.nama}
                            </span>
                          </td>
                          <td>{record.kelas_terakhir || '-'}</td>
                          <td>{record.tahun_lulus || '-'}</td>
                          <td>{ta ? ta.kode : (record.tahun_ajaran_id || '-')}</td>
                          <td><CustomTag color="orange">Pindah / Migrasi</CustomTag></td>
                          <td style={{ color: '#64748b' }}>{record.keterangan || '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                              {record.santri_id && (
                                <button
                                  type="button"
                                  className="action-pill-btn secondary-pill btn-sm"
                                  onClick={() => handleReactivateClick(record.id, record.nama)}
                                >
                                  Reaktifkan
                                </button>
                              )}
                              <button
                                type="button"
                                className="action-pill-btn secondary-pill btn-sm"
                                onClick={() => handleDetailClick(record.id)}
                              >
                                Detail
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleDeleteClick(record.id, record.nama)} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                                title="Hapus"
                              >
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
          </div>
        )}
      </div>

      <MigrateSantriModal
        isOpen={isMigrateModalOpen}
        onClose={() => setIsMigrateModalOpen(false)}
        onSubmit={handleMigrateSubmit}
        santriList={santriList}
        isSubmitting={isSubmitting}
        error={migrateModalError}
      />

      <AlumniDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        alumniId={detailAlumniId}
      />
    </div>
  );
}

export default Alumni;

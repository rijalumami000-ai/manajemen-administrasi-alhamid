import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Calendar,
  Layers,
  User,
  History,
  Info,
  Edit2,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';
import { LoadingState, ErrorState, useToast } from '../components/common';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import { SmartAlert } from '../components/ui/SmartAlert';
import { nilaiService } from '../services/nilaiService';
import { setoranService } from '../services/setoranService';
import { settingsService } from '../services/settingsService';
import {
  SetoranOverviewResponse,
  SantriSetoranItem,
  SantriHistoryResponse,
  SetoranHistoryRow,
  EditSetoranFormData,
  DeleteConfirmModalState
} from '../types/setoran';
import './MonitoringSetoranHafalan.scss';

// Helper Format Tanggal DD/MM/YYYY
const formatDateDMY = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

export default function MonitoringSetoranHafalan(): React.ReactElement {
  const toast = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // References
  const [tahunAjaranList, setTahunAjaranList] = useState<any[]>([]);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<number | null>(null);
  const [, setSemesterList] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('Ganjil');
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<number | null>(null);

  // Setoran Overview Data
  const [overviewData, setOverviewData] = useState<SetoranOverviewResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all', 'tuntas', 'melampaui', 'belum_setor_pekan_ini'

  // Modal Detail Santri History
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [selectedSantriHistory, setSelectedSantriHistory] = useState<SantriHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Editing History Item State
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<EditSetoranFormData>({
    jumlah_bait: 0,
    status_kelancaran: 'Lancar',
    catatan: '',
    tanggal_setor: ''
  });
  const [editSaving, setEditSaving] = useState<boolean>(false);

  // VisionOS Destructive Delete Confirmation Modal
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<DeleteConfirmModalState>({
    isOpen: false,
    rowId: null,
    dateStr: ''
  });
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // 1. Load Initial Referensi (Tahun Ajaran & Semester Default)
  useEffect(() => {
    const loadInitialMeta = async () => {
      try {
        setLoading(true);
        const [taData, katData, sysSettings] = await Promise.all([
          nilaiService.fetchTahunAjaran(),
          nilaiService.fetchKategori(),
          settingsService.fetchSettings().catch(() => ({}))
        ]);

        const taArr = Array.isArray(taData) ? taData : [];
        setTahunAjaranList(taArr);
        const activeTA = taArr.find((ta: any) => ta.is_active) || taArr[0];
        if (activeTA) setSelectedTahunAjaran(activeTA.id);

        const katArr = Array.isArray(katData) ? katData.filter((k: any) => k.jenis === 'Semester') : [];
        setSemesterList(katArr);
        const activeSem = (sysSettings as any)?.active_semester || 'Ganjil';
        setSelectedSemester(activeSem);
      } catch (err: any) {
        console.error('Error loading initial filters:', err);
        setError('Gagal memuat opsi referensi.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialMeta();
  }, []);

  // 2. Fetch Classes dynamically whenever selectedTahunAjaran changes
  useEffect(() => {
    if (!selectedTahunAjaran) return;
    const loadKelasForTA = async () => {
      try {
        const kData = await nilaiService.fetchKelas(selectedTahunAjaran);
        const diniyahClasses = Array.isArray(kData) ? kData.filter((k: any) => k.jenis === 'Diniyah') : [];
        setKelasList(diniyahClasses);

        // Pastikan kelas yang terpilih valid untuk tahun ajaran yang dipilih
        setSelectedKelas(prevKelas => {
          if (prevKelas && diniyahClasses.some((k: any) => k.id === prevKelas)) {
            return prevKelas;
          }
          return diniyahClasses.length > 0 ? diniyahClasses[0].id : null;
        });
      } catch (err: any) {
        console.error('Error loading kelas for TA:', err);
      }
    };

    loadKelasForTA();
  }, [selectedTahunAjaran]);

  // 3. Fetch Setoran Overview when Kelas/TA/Semester changes
  const fetchOverview = async () => {
    if (!selectedKelas || !selectedTahunAjaran) return;
    try {
      setDataLoading(true);
      setError(null);
      const res = await setoranService.fetchOverview({
        kelas_id: selectedKelas,
        tahun_ajaran_id: selectedTahunAjaran,
        semester: selectedSemester
      });
      setOverviewData(res);
    } catch (err: any) {
      console.error('Error fetching setoran overview:', err);
      setOverviewData(null);
      setError(err.response?.data?.error || err.message || 'Gagal memuat rekap setoran.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (selectedKelas && selectedTahunAjaran) {
      fetchOverview();
    }
  }, [selectedKelas, selectedTahunAjaran, selectedSemester]);

  // 4. Open History Modal for a Santri
  const handleOpenHistory = async (santri: SantriSetoranItem) => {
    try {
      setHistoryLoading(true);
      setHistoryModalOpen(true);
      setEditingItemId(null);
      const res = await setoranService.fetchSantriHistory(santri.id, {
        tahun_ajaran_id: selectedTahunAjaran,
        kelas_id: selectedKelas
      });
      setSelectedSantriHistory(res);
    } catch (err: any) {
      console.error('Error fetching santri history:', err);
      toast.error('Gagal mengambil riwayat setoran santri.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Re-fetch active history modal data
  const reloadHistory = async () => {
    if (!selectedSantriHistory?.santri?.id) return;
    try {
      const res = await setoranService.fetchSantriHistory(selectedSantriHistory.santri.id, {
        tahun_ajaran_id: selectedTahunAjaran,
        kelas_id: selectedKelas
      });
      setSelectedSantriHistory(res);
      fetchOverview(); // also update overview stats
    } catch (err: any) {
      console.error('Error reloading history:', err);
    }
  };

  // Start Editing Item
  const handleStartEdit = (row: SetoranHistoryRow) => {
    setEditingItemId(row.id);
    setEditFormData({
      jumlah_bait: row.jumlah_bait || 0,
      status_kelancaran: row.status_kelancaran || 'Lancar',
      catatan: row.catatan || '',
      tanggal_setor: row.tanggal_setor ? row.tanggal_setor.substring(0, 10) : ''
    });
  };

  // Save Edited Item
  const handleSaveEdit = async (rowId: number) => {
    try {
      setEditSaving(true);
      await setoranService.updateSetoran(rowId, {
        jumlah_bait: Number(editFormData.jumlah_bait),
        status_kelancaran: editFormData.status_kelancaran,
        catatan: editFormData.catatan.trim(),
        tanggal_setor: editFormData.tanggal_setor || undefined
      });
      toast.success('Catatan setoran berhasil diperbarui.');
      setEditingItemId(null);
      await reloadHistory();
    } catch (err: any) {
      console.error('Error saving setoran edit:', err);
      toast.error(err.response?.data?.error || err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setEditSaving(false);
    }
  };

  // Trigger Apple VisionOS Destructive Confirmation Modal
  const requestDeleteItem = (row: SetoranHistoryRow) => {
    setDeleteConfirmModal({
      isOpen: true,
      rowId: row.id,
      dateStr: formatDateDMY(row.tanggal_setor)
    });
  };

  // Confirm and Execute Delete Item
  const executeDeleteItem = async () => {
    if (!deleteConfirmModal.rowId) return;
    try {
      setDeleteLoading(true);
      await setoranService.deleteSetoran(deleteConfirmModal.rowId);
      toast.success('Catatan setoran berhasil dihapus.');
      setDeleteConfirmModal({ isOpen: false, rowId: null, dateStr: '' });
      await reloadHistory();
    } catch (err: any) {
      console.error('Error deleting setoran:', err);
      toast.error(err.response?.data?.error || err.message || 'Gagal menghapus catatan setoran.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered Santri List
  const filteredSantriList = useMemo(() => {
    if (!overviewData?.santriList) return [];
    return overviewData.santriList.filter((s: SantriSetoranItem) => {
      // Search by name or NIS
      const matchSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.nis && s.nis.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchSearch) return false;

      // Filter Status
      if (filterStatus === 'tuntas') return s.persentase >= 100;
      if (filterStatus === 'melampaui') return s.is_melampaui_ganjil;
      if (filterStatus === 'belum_setor_pekan_ini') return !s.has_setor_this_week;
      return true;
    });
  }, [overviewData, searchQuery, filterStatus]);

  if (loading) {
    return <LoadingState message="Memuat halaman monitoring setoran..." />;
  }

  const kelasDetail = overviewData?.kelas;
  const stats = overviewData?.stats || {
    totalSantri: 0,
    countTuntasGanjil: 0,
    countMelampaui: 0,
    countBelumSetorPekanIni: 0
  };

  const isSemesterInactive = overviewData && overviewData.is_semester_active === false;

  return (
    <div className="monitoring-setoran-page">
      {/* 1. Sacred Header: .tactile-page-header (NO TITLE ICON ORB) */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Monitoring Setoran Hafalan Nadzom</h2>
          <p className="page-subtitle">Pantau progres dan pembinaan hafalan muhafadzoh santri oleh Mustahiq kelas.</p>
        </div>

        <div className="header-actions-row">
          <div style={{ minWidth: '160px' }}>
            <CustomSelect
              value={String(selectedTahunAjaran || '')}
              onChange={(val) => setSelectedTahunAjaran(Number(val))}
              options={tahunAjaranList.map((ta: any) => ({
                value: String(ta.id),
                label: `${ta.kode} ${ta.is_active ? '(Aktif)' : ''}`
              }))}
              placeholder="Tahun Ajaran"
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <CustomSelect
              value={selectedSemester}
              onChange={(val) => setSelectedSemester(val)}
              options={[
                { value: 'Ganjil', label: 'Semester Ganjil' },
                { value: 'Genap', label: 'Semester Genap' }
              ]}
              placeholder="Pilih Semester"
            />
          </div>

          <div style={{ minWidth: '170px' }}>
            <CustomSelect
              value={String(selectedKelas || '')}
              onChange={(val) => setSelectedKelas(Number(val))}
              options={kelasList.map((k: any) => ({
                value: String(k.id),
                label: `Kelas ${k.nama}`
              }))}
              placeholder="Pilih Kelas Diniyah"
            />
          </div>
        </div>
      </header>

      {/* Primary Context Notice: Catatan Operasional Mustahiq (Bukan Nilai Rapor) */}
      <div className="monitoring-notice-container">
        <SmartAlert
          type="info"
          message={
            <span>
              <strong>Buku Catatan Pembinaan Harian Mustahiq:</strong> Seluruh data riwayat & capaian nadzom di halaman ini merupakan catatan jurnal monitoring internal Mustahiq. Fitur ini bersifat memantau hafalan santri dan <u>tidak otomatis masuk ataupun menggantikan nilai rapor resmi</u>.
            </span>
          }
        />
      </div>

      {/* Inactive Semester Notice */}
      {isSemesterInactive && (
        <div className="inactive-semester-alert">
          <SmartAlert
            type="warning"
            message={
              <span>
                <strong>Perhatian:</strong> Semester <strong>{selectedSemester}</strong> belum aktif pada sistem pondok. Periode aktif saat ini adalah Semester <strong>{overviewData?.system_active_semester || 'Ganjil'}</strong>. Data setoran di bawah merupakan data riwayat untuk semester ini atau target pratinjau.
              </span>
            }
          />
        </div>
      )}

      {dataLoading ? (
        <LoadingState message="Memuat data capaian kelas..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOverview} />
      ) : (
        <>
          {/* Header Info Kelas */}
          <div className="class-info-card frosted-card">
            <div className="info-main">
              <div className="class-badge">
                <span>Kelas {kelasDetail?.nama || '-'}</span>
              </div>
              <div className="class-meta">
                <h3 className="kitab-title">
                  Kitab: {kelasDetail?.muhafadzoh_nama || 'Muhafadzoh Belum Diatur'}
                </h3>
                <div className="meta-sub">
                  <span>Mustahiq: <strong>{kelasDetail?.mustahiq_nama || 'Belum Ditentukan'}</strong></span>
                  <span className="dot">•</span>
                  <span>Model: <strong>{overviewData?.tipeInput === 'Teks' ? 'Nama Bab / Teks' : 'Skala Angka (Nadzom)'}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Standar Target & Skala Predikat Kelas */}
          {overviewData?.kriteriaInfo && (
            <div className="kriteria-guide-card frosted-card">
              <div className="guide-header">
                <div className="guide-title-box">
                  <Award size={18} style={{ color: '#2563eb' }} />
                  <h4>Standar Target & Kriteria Predikat — Kelas {kelasDetail?.nama || ''}</h4>
                </div>
                <div className="guide-target-badges">
                  {overviewData.tipeInput === 'Teks' ? (
                    <>
                      <span className="badge-target ganjil">
                        Target {overviewData.kriteriaInfo.is_ganjil ? 'Semester Ini' : 'Ganjil'} (Mumtaz): <strong>Bab ke-{overviewData.kriteriaInfo.total_bab_ganjil || 14} ({overviewData.kriteriaInfo.target_ganjil_nama || 'Bab Akhir'})</strong>
                      </span>
                      <span className="badge-target genap">
                        Batas Maksimal Genap: <strong>Bab ke-{overviewData.kriteriaInfo.total_bab_genap || 26} ({overviewData.kriteriaInfo.target_genap_nama || 'Khatam'})</strong>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="badge-target ganjil">
                        Target {overviewData.kriteriaInfo.is_ganjil ? 'Semester Ini' : 'Ganjil'} (Mumtaz): <strong>{overviewData.kriteriaInfo.target_ganjil} Nadzom</strong>
                      </span>
                      <span className="badge-target genap">
                        Batas Maksimal Genap: <strong>{overviewData.kriteriaInfo.target_genap} Nadzom</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {overviewData.tipeInput !== 'Teks' && overviewData.kriteriaInfo.skala_aktif && (
                <div className="predikat-scales-grid">
                  <div className="scale-item mumtaz">
                    <div className="scale-badge">Mumtaz (Maksimal)</div>
                    <div className="scale-range">
                      <strong>{overviewData.kriteriaInfo.skala_aktif.mumtaz?.min || '-'} - {overviewData.kriteriaInfo.skala_aktif.mumtaz?.max || '-'}</strong> Nadzom
                    </div>
                    <div className="scale-desc">
                      {overviewData.kriteriaInfo.is_ganjil 
                        ? `Melampaui: >${overviewData.kriteriaInfo.target_ganjil} s/d ${overviewData.kriteriaInfo.target_genap}` 
                        : 'Tuntas Target Akhir'}
                    </div>
                  </div>

                  <div className="scale-item jayyid">
                    <div className="scale-badge">Jayyid</div>
                    <div className="scale-range">
                      <strong>{overviewData.kriteriaInfo.skala_aktif.jayyid?.min || '-'} - {overviewData.kriteriaInfo.skala_aktif.jayyid?.max || '-'}</strong> Nadzom
                    </div>
                    <div className="scale-desc">Tingkat Baik</div>
                  </div>

                  <div className="scale-item mutawassith">
                    <div className="scale-badge">Mutawassith</div>
                    <div className="scale-range">
                      <strong>{overviewData.kriteriaInfo.skala_aktif.mutawassith?.min || '-'} - {overviewData.kriteriaInfo.skala_aktif.mutawassith?.max || '-'}</strong> Nadzom
                    </div>
                    <div className="scale-desc">Tingkat Cukup</div>
                  </div>

                  <div className="scale-item rodi">
                    <div className="scale-badge">Rodi'</div>
                    <div className="scale-range">
                      <strong>{overviewData.kriteriaInfo.skala_aktif.rodi?.min || '1'} - {overviewData.kriteriaInfo.skala_aktif.rodi?.max || '-'}</strong> Nadzom
                    </div>
                    <div className="scale-desc">Perlu Bimbingan</div>
                  </div>
                </div>
              )}

              {overviewData.tipeInput === 'Teks' && (
                <>
                  <div className="predikat-scales-grid">
                    <div className="scale-item mumtaz">
                      <div className="scale-badge">Mumtaz (Target Puncak)</div>
                      <div className="scale-range">
                        <strong>Bab ke-{overviewData.kriteriaInfo.total_bab_ganjil || 14}</strong>
                      </div>
                      <div className="scale-desc">
                        {overviewData.kriteriaInfo.target_ganjil_nama} • Melampaui: s/d Bab ke-{overviewData.kriteriaInfo.total_bab_genap || 26}
                      </div>
                    </div>

                    <div className="scale-item jayyid">
                      <div className="scale-badge">Jayyid</div>
                      <div className="scale-range">
                        <strong>{overviewData.kriteriaInfo.skala_bab?.jayyid?.range_text || 'Bab 12 - 13'}</strong>
                      </div>
                      <div className="scale-desc">Tingkat Baik</div>
                    </div>

                    <div className="scale-item mutawassith">
                      <div className="scale-badge">Mutawassith</div>
                      <div className="scale-range">
                        <strong>{overviewData.kriteriaInfo.skala_bab?.mutawassith?.range_text || 'Bab 10 - 11'}</strong>
                      </div>
                      <div className="scale-desc">Tingkat Cukup</div>
                    </div>

                    <div className="scale-item rodi">
                      <div className="scale-badge">Rodi'</div>
                      <div className="scale-range">
                        <strong>{overviewData.kriteriaInfo.skala_bab?.rodi?.range_text || 'Bab 1 - 9'}</strong>
                      </div>
                      <div className="scale-desc">Tahap Awal / Bimbingan</div>
                    </div>
                  </div>

                  <div className="teks-guide-note" style={{ marginTop: '12px' }}>
                    <span>Model materi bab. Target puncak Mumtaz di Semester Ganjil adalah <strong>Bab ke-{overviewData.kriteriaInfo.total_bab_ganjil || 14} ({overviewData.kriteriaInfo.target_ganjil_nama || 'Bab Akhir'})</strong>. Santri dapat melanjutkan setoran ke materi semester genap hingga <strong>Bab ke-{overviewData.kriteriaInfo.total_bab_genap || 26} ({overviewData.kriteriaInfo.target_genap_nama || 'Khatam'})</strong>.</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Quick Metrics Statistics */}
          <div className="metrics-grid">
            <div className="metric-box">
              <div className="metric-icon blue">
                <User size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-value">{stats.totalSantri}</span>
                <span className="metric-label">Total Santri</span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon green">
                <CheckCircle2 size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-value">{stats.countTuntasGanjil}</span>
                <span className="metric-label">Tuntas Target Semester</span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon purple">
                <Sparkles size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-value">{stats.countMelampaui}</span>
                <span className="metric-label">Melampaui Target (Akselerasi)</span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon orange">
                <AlertCircle size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-value">{stats.countBelumSetorPekanIni}</span>
                <span className="metric-label">Belum Setor 7 Hari Terakhir</span>
              </div>
            </div>
          </div>

          {/* Table Container & Filter Tabs */}
          <div className="table-card frosted-card">
            <div className="table-header-bar">
              <div className="search-input-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Cari nama santri atau NIS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-chips">
                <button
                  type="button"
                  className={`chip-btn ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  Semua ({overviewData?.santriList?.length || 0})
                </button>
                <button
                  type="button"
                  className={`chip-btn ${filterStatus === 'tuntas' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('tuntas')}
                >
                  Tuntas Target ({stats.countTuntasGanjil})
                </button>
                <button
                  type="button"
                  className={`chip-btn ${filterStatus === 'melampaui' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('melampaui')}
                >
                  Melampaui ({stats.countMelampaui})
                </button>
                <button
                  type="button"
                  className={`chip-btn ${filterStatus === 'belum_setor_pekan_ini' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('belum_setor_pekan_ini')}
                >
                  Belum Setor Pekan Ini ({stats.countBelumSetorPekanIni})
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="table-responsive">
              <table className="setoran-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>No</th>
                    <th>Santri</th>
                    <th>Capaian & Target</th>
                    <th>Aktivitas Setoran</th>
                    <th>Status Mutu</th>
                    <th style={{ width: '220px' }}>Progres Capaian</th>
                    <th>Predikat</th>
                    <th style={{ textAlign: 'center', width: '110px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSantriList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-row">
                        Tidak ada data santri yang sesuai kriteria pencarian/filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSantriList.map((santri: SantriSetoranItem, idx: number) => {
                      const isAngka = overviewData?.tipeInput !== 'Teks';
                      return (
                        <tr key={santri.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="santri-profile-cell">
                              <div className="avatar-circle">
                                {santri.foto_url ? (
                                  <img src={santri.foto_url} alt={santri.nama} />
                                ) : (
                                  santri.nama.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="santri-name-box">
                                <span className="santri-name">{santri.nama}</span>
                                <span className="santri-nis">NIS: {santri.nis || '-'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            {isAngka ? (
                              <div className="capaian-cell">
                                <span className="capaian-main">
                                  Bait ke-<strong>{santri.bait_terakhir}</strong> / {santri.target_semester}
                                </span>
                                {santri.bait_terakhir >= santri.target_genap ? (
                                  <span className="capaian-extra-tag" style={{ color: '#059669', fontSize: '11px', fontWeight: 700 }}>
                                    Tuntas Maksimal Kelas ({santri.target_genap})
                                  </span>
                                ) : santri.is_melampaui_ganjil ? (
                                  <span className="capaian-extra-tag" style={{ color: '#7c3aed', fontSize: '11px', fontWeight: 700 }}>
                                    Melampaui Ganjil (+{santri.bait_terakhir - santri.target_semester} nadzom) • Maks: {santri.target_genap}
                                  </span>
                                ) : (
                                  <span className="capaian-sub" style={{ fontSize: '11px', color: '#64748b' }}>
                                    Batas Maks Genap: {santri.target_genap}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="capaian-cell">
                                {santri.nama_bab_terakhir ? (
                                  <>
                                    <span className="capaian-main" style={{ fontSize: '13px', fontWeight: 700 }}>
                                      {santri.bab_index ? `Bab ke-${santri.bab_index}: ` : ''}{santri.nama_bab_terakhir}
                                    </span>
                                    {santri.is_melampaui_ganjil ? (
                                      <span className="capaian-extra-tag" style={{ color: '#7c3aed', fontSize: '11px', fontWeight: 700 }}>
                                        Melampaui Ganjil (Materi Genap) • Batas Maks: Bab ke-{santri.target_genap}
                                      </span>
                                    ) : (
                                      <span className="capaian-sub" style={{ fontSize: '11px', color: '#64748b' }}>
                                        Target Ganjil: Bab ke-{santri.target_semester} • Maks: Bab ke-{santri.target_genap}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="capaian-empty" style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
                                    Belum setor bab
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="activity-cell">
                              <span className="total-sessions">{santri.total_sesi_setoran}x Setoran</span>
                              <span className="last-date" style={{ fontSize: '11px', color: '#64748b' }}>
                                {santri.tanggal_setor_terakhir
                                  ? `Terakhir: ${formatDateDMY(santri.tanggal_setor_terakhir)}`
                                  : 'Belum pernah'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${santri.status_kelancaran_terakhir?.toLowerCase() || 'none'}`}>
                              {santri.status_kelancaran_terakhir || '-'}
                            </span>
                          </td>
                          <td>
                            <div className="progress-cell">
                              <div className="progress-bar-bg">
                                <div
                                  className={`progress-bar-fill ${santri.is_melampaui_ganjil ? 'extra' : ''}`}
                                  style={{ width: `${Math.min(100, santri.persentase)}%` }}
                                />
                              </div>
                              <div className="progress-text">
                                <span>{santri.persentase}%</span>
                                {santri.is_melampaui_ganjil && (
                                  <span className="extra-tag">Melampaui</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`predikat-pill ${santri.predikat.toLowerCase().replace(/[^a-z]/g, '')}`}>
                              {santri.predikat}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-history"
                              onClick={() => handleOpenHistory(santri)}
                              title="Lihat Riwayat Setoran"
                            >
                              <History size={14} />
                              <span>Riwayat</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Detail Riwayat Setoran Santri */}
      <CustomModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Riwayat Setoran: ${selectedSantriHistory?.santri?.nama || 'Santri'}`}
        size="large"
      >
        {historyLoading ? (
          <LoadingState message="Memuat catatan riwayat setoran..." />
        ) : (
          <div className="history-modal-body">
            <div className="santri-summary-bar">
              <div className="santri-basic">
                <strong>{selectedSantriHistory?.santri?.nama}</strong>
                <span>NIS: {selectedSantriHistory?.santri?.nis || '-'}</span>
              </div>
              <div className="total-entries">
                Total Catatan: <strong>{selectedSantriHistory?.riwayat?.length || 0} sesi</strong>
              </div>
            </div>

            {selectedSantriHistory?.riwayat?.length === 0 ? (
              <div className="empty-history">
                <Info size={32} />
                <p>Belum ada riwayat setoran nadzom yang dicatat untuk santri ini.</p>
              </div>
            ) : (
              <div className="timeline-container">
                {selectedSantriHistory?.riwayat?.map((row: SetoranHistoryRow, idx: number) => {
                  const isEditing = editingItemId === row.id;

                  return (
                    <div className="timeline-item" key={row.id || idx}>
                      <div className="timeline-dot" />
                      <div className="timeline-card">
                        <div className="timeline-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="session-date" style={{ fontWeight: 700 }}>
                            {formatDateDMY(row.tanggal_setor)}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`status-badge ${row.status_kelancaran?.toLowerCase()}`}>
                              {row.status_kelancaran}
                            </span>
                            {!isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(row)}
                                  title="Perbaiki / Edit Catatan"
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: '#2563eb',
                                    padding: '4px'
                                  }}
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => requestDeleteItem(row)}
                                  title="Hapus Catatan"
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: '#e11d48',
                                    padding: '4px'
                                  }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>

                        {/* Inline Edit Form */}
                        {isEditing ? (
                          <div className="inline-edit-box" style={{ marginTop: '10px', padding: '12px', background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#475569' }}>Jumlah Nadzom (+):</label>
                                <input
                                  type="number"
                                  value={editFormData.jumlah_bait}
                                  onChange={(e) => setEditFormData({ ...editFormData, jumlah_bait: e.target.value })}
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                                <span style={{ fontSize: '10px', color: '#64748b' }}>
                                  Bait Awal: {row.bait_awal} &rarr; Hasil Akhir: {Number(row.bait_awal || 0) + Number(editFormData.jumlah_bait || 0)}
                                </span>
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#475569' }}>Status Kelancaran:</label>
                                <select
                                  value={editFormData.status_kelancaran}
                                  onChange={(e) => setEditFormData({ ...editFormData, status_kelancaran: e.target.value })}
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                >
                                  <option value="Lancar">Lancar</option>
                                  <option value="Kurang Lancar">Kurang Lancar</option>
                                  <option value="Mengulang">Mengulang</option>
                                </select>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#475569' }}>Tanggal Setor:</label>
                                <input
                                  type="date"
                                  value={editFormData.tanggal_setor}
                                  onChange={(e) => setEditFormData({ ...editFormData, tanggal_setor: e.target.value })}
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#475569' }}>Catatan:</label>
                                <input
                                  type="text"
                                  placeholder="Catatan mustahiq..."
                                  value={editFormData.catatan}
                                  onChange={(e) => setEditFormData({ ...editFormData, catatan: e.target.value })}
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                              <button
                                type="button"
                                onClick={() => setEditingItemId(null)}
                                style={{ padding: '6px 14px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#475569' }}
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                disabled={editSaving}
                                onClick={() => handleSaveEdit(row.id)}
                                style={{ padding: '6px 16px', borderRadius: '9999px', border: 'none', background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                              >
                                <Save size={13} />
                                {editSaving ? 'Menyimpan...' : 'Simpan Perbaikan'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="timeline-content">
                            {row.tipe_setoran === 'Bab' ? (
                              <div className="achievement-text">
                                Bab yang disetor: <strong>{row.nama_bab}</strong>
                              </div>
                            ) : (
                              <div className="achievement-text">
                                Menyetor Bait <strong>{row.bait_awal}</strong> s/d <strong>{row.bait_akhir}</strong>
                                <span className="delta-tag">({row.jumlah_bait} Nadzom)</span>
                              </div>
                            )}
                            {row.catatan && (
                              <div className="teacher-note">
                                Catatan Mustahiq: &quot;{row.catatan}&quot;
                              </div>
                            )}
                            <div className="mustahiq-sign">
                              Disimak oleh: {row.mustahiq_nama || 'Mustahiq'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CustomModal>

      {/* Apple VisionOS Destructive Confirmation Modal */}
      <CustomModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, rowId: null, dateStr: '' })}
        title="Konfirmasi Hapus Setoran"
        size="small"
      >
        <div className="delete-confirm-body">
          <div className="delete-icon-halo">
            <AlertTriangle size={28} />
          </div>
          <h4 className="delete-title">Hapus Catatan Setoran?</h4>
          <p className="delete-desc">
            Anda akan menghapus catatan setoran tanggal <strong>{deleteConfirmModal.dateStr}</strong> dari riwayat. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="delete-actions">
            <button
              type="button"
              className="btn-cancel-modal"
              onClick={() => setDeleteConfirmModal({ isOpen: false, rowId: null, dateStr: '' })}
              disabled={deleteLoading}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn-confirm-delete"
              onClick={executeDeleteItem}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

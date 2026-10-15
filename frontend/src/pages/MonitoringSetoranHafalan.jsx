import { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Award, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Calendar,
  Layers,
  User,
  History,
  Info
} from 'lucide-react';
import { PageHeader, LoadingState, ErrorState, useToast } from '../components/common';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import { SmartAlert } from '../components/ui/SmartAlert';
import { nilaiService } from '../services/nilaiService';
import { setoranService } from '../services/setoranService';
import { settingsService } from '../services/settingsService';
import './MonitoringSetoranHafalan.scss';

export default function MonitoringSetoranHafalan() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);

  // References
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);
  const [semesterList, setSemesterList] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('Ganjil');
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState(null);

  // Setoran Overview Data
  const [overviewData, setOverviewData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'tuntas', 'melampaui', 'belum_setor_pekan_ini'

  // Modal Detail Santri History
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedSantriHistory, setSelectedSantriHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 1. Load Initial Filters (TA, Semester, Kelas Diniyah)
  useEffect(() => {
    const loadFilters = async () => {
      try {
        setLoading(true);
        const [taData, katData, kData, sysSettings] = await Promise.all([
          nilaiService.fetchTahunAjaran(),
          nilaiService.fetchKategori(),
          nilaiService.fetchKelas(),
          settingsService.fetchSettings().catch(() => ({}))
        ]);

        const taArr = Array.isArray(taData) ? taData : [];
        setTahunAjaranList(taArr);
        const activeTA = taArr.find(ta => ta.is_active) || taArr[0];
        if (activeTA) setSelectedTahunAjaran(activeTA.id);

        const katArr = Array.isArray(katData) ? katData.filter(k => k.jenis === 'Semester') : [];
        setSemesterList(katArr);
        const activeSem = sysSettings?.active_semester || 'Ganjil';
        setSelectedSemester(activeSem);

        const diniyahClasses = Array.isArray(kData) ? kData.filter(k => k.jenis === 'Diniyah') : [];
        setKelasList(diniyahClasses);
        if (diniyahClasses.length > 0) {
          setSelectedKelas(diniyahClasses[0].id);
        }
      } catch (err) {
        console.error('Error loading initial filters:', err);
        setError('Gagal memuat opsi referensi.');
      } finally {
        setLoading(false);
      }
    };

    loadFilters();
  }, []);

  // 2. Fetch Setoran Overview when Kelas/TA/Semester changes
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
    } catch (err) {
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

  // 3. Open History Modal for a Santri
  const handleOpenHistory = async (santri) => {
    try {
      setHistoryLoading(true);
      setHistoryModalOpen(true);
      const res = await setoranService.fetchSantriHistory(santri.id, {
        tahun_ajaran_id: selectedTahunAjaran,
        kelas_id: selectedKelas
      });
      setSelectedSantriHistory(res);
    } catch (err) {
      console.error('Error fetching santri history:', err);
      toast.error('Gagal mengambil riwayat setoran santri.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filtered Santri List
  const filteredSantriList = useMemo(() => {
    if (!overviewData?.santriList) return [];
    return overviewData.santriList.filter(s => {
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
  const ritme = overviewData?.konfigurasiRitme || {};

  return (
    <div className="monitoring-setoran-page">
      <PageHeader
        title="Monitoring Setoran Hafalan Nadzom"
        subtitle="Pantau progres dan pembinaan hafalan muhafadzoh santri oleh Mustahiq kelas."
      />

      {/* Primary Context Notice: Catatan Operasional Mustahiq (Bukan Nilai Rapor) */}
      <div className="monitoring-notice-container">
        <SmartAlert
          type="info"
          message={
            <span>
              <strong>Buku Catatan Pembinaan Harian Mustahiq:</strong> Seluruh data riwayat & capaian nadzom di halaman ini merupakan catatan jurnal monitoring internal Mustahiq. Fitur ini bersifat memantau ritme hafalan santri dan <u>tidak otomatis masuk ataupun menggantikan nilai rapor resmi</u>.
            </span>
          }
        />
      </div>

      {/* Filter Control Bar */}
      <div className="filter-card frosted-card">
        <div className="filter-grid">
          <div className="filter-group">
            <label className="filter-label">
              <Calendar size={14} />
              <span>Tahun Ajaran</span>
            </label>
            <CustomSelect
              value={String(selectedTahunAjaran || '')}
              onChange={(val) => setSelectedTahunAjaran(Number(val))}
              options={tahunAjaranList.map(ta => ({
                value: String(ta.id),
                label: `${ta.kode} ${ta.is_active ? '(Aktif)' : ''}`
              }))}
              placeholder="Pilih Tahun Ajaran"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Layers size={14} />
              <span>Semester</span>
            </label>
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

          <div className="filter-group">
            <label className="filter-label">
              <BookOpen size={14} />
              <span>Kelas Diniyah</span>
            </label>
            <CustomSelect
              value={String(selectedKelas || '')}
              onChange={(val) => setSelectedKelas(Number(val))}
              options={kelasList.map(k => ({
                value: String(k.id),
                label: `Kelas ${k.nama}`
              }))}
              placeholder="Pilih Kelas"
            />
          </div>
        </div>
      </div>

      {dataLoading ? (
        <LoadingState message="Memuat data capaian kelas..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOverview} />
      ) : (
        <>
          {/* Header Info Kelas & Ritme Pembinaan */}
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
                  <span>Model Setoran: <strong>{overviewData?.tipeInput === 'Teks' ? 'Nama Bab / Teks' : 'Skala Angka (Nadzom)'}</strong></span>
                </div>
              </div>
            </div>

            {/* Ritme Cadence Badge */}
            <div className="cadence-box">
              <div className="cadence-label">
                <Clock size={13} />
                <span>Ritme Penarikan Mustahiq</span>
              </div>
              <div className="cadence-value">
                {ritme.mode_frekuensi === 'harian' && 'Setiap Hari'}
                {ritme.mode_frekuensi === 'interval_hari' && `Setiap ${ritme.interval_hari || 3} Hari Sekali`}
                {ritme.mode_frekuensi === 'mingguan' && '1 Pekan Sekali'}
                {ritme.mode_frekuensi === 'bebas' && 'Fleksibel / Bebas'}
                {ritme.target_per_setoran ? ` (@ ${ritme.target_per_setoran} Nadzom)` : ''}
              </div>
            </div>
          </div>

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
                    <th>Capaian Terakhir</th>
                    <th>Aktivitas Setoran</th>
                    <th>Status Mutu</th>
                    <th style={{ width: '220px' }}>Progres Capaian</th>
                    <th>Predikat</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
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
                    filteredSantriList.map((santri, idx) => {
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
                                <span className="capaian-main">Bait ke-<strong>{santri.bait_terakhir}</strong></span>
                                <span className="capaian-sub">Target: {santri.target_semester}</span>
                              </div>
                            ) : (
                              <div className="capaian-cell">
                                <span className="capaian-main"><strong>{santri.nama_bab_terakhir || 'Belum ada'}</strong></span>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="activity-cell">
                              <span className="total-sessions">{santri.total_sesi_setoran}x Setoran</span>
                              <span className="last-date">
                                {santri.tanggal_setor_terakhir
                                  ? new Date(santri.tanggal_setor_terakhir).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })
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
                                  <span className="extra-tag">✨ Melampaui Target</span>
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
                              <History size={15} />
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
                {selectedSantriHistory?.riwayat?.map((row, idx) => (
                  <div className="timeline-item" key={row.id || idx}>
                    <div className="timeline-dot" />
                    <div className="timeline-card">
                      <div className="timeline-header">
                        <span className="session-date">
                          {new Date(row.tanggal_setor).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        <span className={`status-badge ${row.status_kelancaran?.toLowerCase()}`}>
                          {row.status_kelancaran}
                        </span>
                      </div>
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
                            <em>Catatan Mustahiq:</em> &quot;{row.catatan}&quot;
                          </div>
                        )}
                        <div className="mustahiq-sign">
                          Disimak oleh: {row.mustahiq_nama || 'Mustahiq'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CustomModal>
    </div>
  );
}

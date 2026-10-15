import { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Award, 
  TrendingUp, 
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
  X
} from 'lucide-react';
import { PageHeader, LoadingState, ErrorState, useToast } from '../components/common';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import { SmartAlert } from '../components/ui/SmartAlert';
import { nilaiService } from '../services/nilaiService';
import { setoranService } from '../services/setoranService';
import { settingsService } from '../services/settingsService';
import './MonitoringSetoranHafalan.scss';

// Helper Format Tanggal DD/MM/YYYY
const formatDateDMY = (dateStr) => {
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

  // Editing History Item State
  const [editingItemId, setEditingItemId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    jumlah_bait: 0,
    status_kelancaran: 'Lancar',
    catatan: '',
    tanggal_setor: ''
  });
  const [editSaving, setEditSaving] = useState(false);

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
        const activeTA = taArr.find(ta => ta.is_active) || taArr[0];
        if (activeTA) setSelectedTahunAjaran(activeTA.id);

        const katArr = Array.isArray(katData) ? katData.filter(k => k.jenis === 'Semester') : [];
        setSemesterList(katArr);
        const activeSem = sysSettings?.active_semester || 'Ganjil';
        setSelectedSemester(activeSem);
      } catch (err) {
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
        const diniyahClasses = Array.isArray(kData) ? kData.filter(k => k.jenis === 'Diniyah') : [];
        setKelasList(diniyahClasses);

        // Pastikan kelas yang terpilih valid untuk tahun ajaran yang dipilih
        setSelectedKelas(prevKelas => {
          if (prevKelas && diniyahClasses.some(k => k.id === prevKelas)) {
            return prevKelas;
          }
          return diniyahClasses.length > 0 ? diniyahClasses[0].id : null;
        });
      } catch (err) {
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

  // 4. Open History Modal for a Santri
  const handleOpenHistory = async (santri) => {
    try {
      setHistoryLoading(true);
      setHistoryModalOpen(true);
      setEditingItemId(null);
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
    } catch (err) {
      console.error('Error reloading history:', err);
    }
  };

  // Start Editing Item
  const handleStartEdit = (row) => {
    setEditingItemId(row.id);
    setEditFormData({
      jumlah_bait: row.jumlah_bait || 0,
      status_kelancaran: row.status_kelancaran || 'Lancar',
      catatan: row.catatan || '',
      tanggal_setor: row.tanggal_setor ? row.tanggal_setor.substring(0, 10) : ''
    });
  };

  // Save Edited Item
  const handleSaveEdit = async (rowId) => {
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
    } catch (err) {
      console.error('Error saving setoran edit:', err);
      toast.error(err.response?.data?.error || err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setEditSaving(false);
    }
  };

  // Delete History Item
  const handleDeleteItem = async (rowId) => {
    if (!window.confirm('Yakin ingin menghapus catatan setoran ini dari riwayat?')) return;
    try {
      await setoranService.deleteSetoran(rowId);
      toast.success('Catatan setoran berhasil dihapus.');
      await reloadHistory();
    } catch (err) {
      console.error('Error deleting setoran:', err);
      toast.error(err.response?.data?.error || err.message || 'Gagal menghapus catatan setoran.');
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

  const isSemesterInactive = overviewData && overviewData.is_semester_active === false;

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
              <strong>Buku Catatan Pembinaan Harian Mustahiq:</strong> Seluruh data riwayat & capaian nadzom di halaman ini merupakan catatan jurnal monitoring internal Mustahiq. Fitur ini bersifat memantau hafalan santri dan <u>tidak otomatis masuk ataupun menggantikan nilai rapor resmi</u>.
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

      {/* Inactive Semester Notice */}
      {isSemesterInactive && (
        <div className="inactive-semester-alert">
          <SmartAlert
            type="warning"
            message={
              <span>
                <strong>Perhatian:</strong> Semester <strong>{selectedSemester}</strong> belum aktif pada sistem pondok. Periode aktif saat ini adalah Semester <strong>{overviewData.system_active_semester}</strong>. Data setoran di bawah merupakan data riwayat untuk semester ini atau target pratinjau.
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
                  <Award size={18} style={{ color: '#3b82f6' }} />
                  <h4>Standar Target & Kriteria Predikat — Kelas {kelasDetail?.nama || ''}</h4>
                </div>
                <div className="guide-target-badges">
                  <span className="badge-target ganjil">
                    Target {overviewData.kriteriaInfo.is_ganjil ? 'Semester Ini' : 'Ganjil'} (Mumtaz): <strong>{overviewData.kriteriaInfo.target_ganjil} Nadzom</strong>
                  </span>
                  <span className="badge-target genap">
                    Batas Maksimal Genap: <strong>{overviewData.kriteriaInfo.target_genap} Nadzom</strong>
                  </span>
                </div>
              </div>

              {overviewData.tipeInput !== 'Teks' && overviewData.kriteriaInfo.skala_aktif && (
                <div className="predikat-scales-grid">
                  <div className="scale-item mumtaz">
                    <div className="scale-badge">🏆 Mumtaz (Maksimal)</div>
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
                    <div className="scale-badge">🌟 Jayyid</div>
                    <div className="scale-range">
                      <strong>{overviewData.kriteriaInfo.skala_aktif.jayyid?.min || '-'} - {overviewData.kriteriaInfo.skala_aktif.jayyid?.max || '-'}</strong> Nadzom
                    </div>
                    <div className="scale-desc">Tingkat Baik</div>
                  </div>

                  <div className="scale-item mutawassith">
                    <div className="scale-badge">⚡ Mutawassith</div>
                    <div className="scale-range">
                      <strong>{overviewData.kriteriaInfo.skala_aktif.mutawassith?.min || '-'} - {overviewData.kriteriaInfo.skala_aktif.mutawassith?.max || '-'}</strong> Nadzom
                    </div>
                    <div className="scale-desc">Tingkat Cukup</div>
                  </div>

                  <div className="scale-item rodi">
                    <div className="scale-badge">📖 Rodi'</div>
                    <div className="scale-range">
                      <strong>{overviewData.kriteriaInfo.skala_aktif.rodi?.min || '1'} - {overviewData.kriteriaInfo.skala_aktif.rodi?.max || '-'}</strong> Nadzom
                    </div>
                    <div className="scale-desc">Perlu Bimbingan</div>
                  </div>
                </div>
              )}

              {overviewData.tipeInput === 'Teks' && (
                <div className="teks-guide-note">
                  <span>Format model materi bab. Target puncak Mumtaz di Semester Ganjil adalah <strong>{overviewData.kriteriaInfo.daftar_bab_ganjil?.[overviewData.kriteriaInfo.daftar_bab_ganjil.length - 1]?.bab || 'Bab Akhir Ganjil'}</strong>. Santri dapat melanjutkan setoran ke materi semester genap hingga tuntas.</span>
                </div>
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
                                <span className="capaian-main">
                                  Bait ke-<strong>{santri.bait_terakhir}</strong> / {santri.target_semester}
                                </span>
                                {santri.bait_terakhir >= santri.target_genap ? (
                                  <span className="capaian-extra-tag" style={{ color: '#059669', fontSize: '11px', fontWeight: 'bold' }}>
                                    🏆 Tuntas Maksimal Kelas ({santri.target_genap})
                                  </span>
                                ) : santri.is_melampaui_ganjil ? (
                                  <span className="capaian-extra-tag" style={{ color: '#8b5cf6', fontSize: '11px', fontWeight: 'bold' }}>
                                    ✨ Melampaui Ganjil (+{santri.bait_terakhir - santri.target_semester} nadzom) • Maks: {santri.target_genap}
                                  </span>
                                ) : (
                                  <span className="capaian-sub" style={{ fontSize: '11px', color: '#64748b' }}>
                                    Batas Maks Genap: {santri.target_genap}
                                  </span>
                                )}
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
                                  <span className="extra-tag">✨ Melampaui</span>
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
                {selectedSantriHistory?.riwayat?.map((row, idx) => {
                  const isEditing = editingItemId === row.id;

                  return (
                    <div className="timeline-item" key={row.id || idx}>
                      <div className="timeline-dot" />
                      <div className="timeline-card">
                        <div className="timeline-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="session-date" style={{ fontWeight: 'bold' }}>
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
                                    color: '#3b82f6',
                                    padding: '4px'
                                  }}
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(row.id)}
                                  title="Hapus Catatan"
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: '#ef4444',
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
                          <div className="inline-edit-box" style={{ marginTop: '10px', padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Jumlah Nadzom (+):</label>
                                <input
                                  type="number"
                                  value={editFormData.jumlah_bait}
                                  onChange={(e) => setEditFormData({ ...editFormData, jumlah_bait: e.target.value })}
                                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                                <span style={{ fontSize: '10px', color: '#64748b' }}>
                                  Bait Awal: {row.bait_awal} &rarr; Hasil Akhir: {Number(row.bait_awal) + Number(editFormData.jumlah_bait || 0)}
                                </span>
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Status Kelancaran:</label>
                                <select
                                  value={editFormData.status_kelancaran}
                                  onChange={(e) => setEditFormData({ ...editFormData, status_kelancaran: e.target.value })}
                                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                >
                                  <option value="Lancar">Lancar</option>
                                  <option value="Kurang Lancar">Kurang Lancar</option>
                                  <option value="Mengulang">Mengulang</option>
                                </select>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Tanggal Setor:</label>
                                <input
                                  type="date"
                                  value={editFormData.tanggal_setor}
                                  onChange={(e) => setEditFormData({ ...editFormData, tanggal_setor: e.target.value })}
                                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Catatan:</label>
                                <input
                                  type="text"
                                  placeholder="Catatan mustahiq..."
                                  value={editFormData.catatan}
                                  onChange={(e) => setEditFormData({ ...editFormData, catatan: e.target.value })}
                                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => setEditingItemId(null)}
                                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #94a3b8', background: '#f1f5f9', cursor: 'pointer', fontSize: '12px' }}
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                disabled={editSaving}
                                onClick={() => handleSaveEdit(row.id)}
                                style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
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
                                <em>Catatan Mustahiq:</em> &quot;{row.catatan}&quot;
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
    </div>
  );
}

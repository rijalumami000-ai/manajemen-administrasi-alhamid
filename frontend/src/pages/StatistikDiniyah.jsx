import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  GraduationCap,
  Calendar,
  Layers,
  TrendingUp,
  BarChart2,
  PieChart,
  UserCheck,
  Building,
  School,
  ArrowRight,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import { apiGet } from '../services/apiClient';
import './StatistikDiniyah.scss';

export function StatistikDiniyah() {
  const [data, setData] = useState(null);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [selectedTaId, setSelectedTaId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('semua'); // 'semua' | 'ganjil' | 'genap'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load list of academic years
  useEffect(() => {
    async function loadTa() {
      try {
        const res = await apiGet('/tahun-ajaran');
        setTahunAjaranList(res);
        const active = res.find(t => t.is_active);
        if (active) {
          setSelectedTaId(String(active.id));
        } else if (res.length > 0) {
          setSelectedTaId(String(res[res.length - 1].id));
        }
      } catch (err) {
        console.error('Gagal memuat tahun ajaran:', err);
      }
    }
    loadTa();
  }, []);

  const loadStatistik = useCallback(async () => {
    if (!selectedTaId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiGet(
        `/santri/statistik-diniyah?tahun_ajaran_id=${selectedTaId}&semester=${selectedSemester}`,
        { noCache: true }
      );
      setData(res);
    } catch (err) {
      console.error('Gagal memuat statistik diniyah:', err);
      setError(err.message || 'Gagal memuat data statistik');
    } finally {
      setLoading(false);
    }
  }, [selectedTaId, selectedSemester]);

  useEffect(() => {
    if (selectedTaId) {
      loadStatistik();
    }
  }, [loadStatistik, selectedTaId, selectedSemester]);

  const summary = data?.summary || { total: 0, putra: 0, putri: 0, total_ganjil: 0, total_genap: 0 };
  const perTingkat = data?.per_tingkat || [];
  const perKelas = data?.per_kelas || [];
  const tren = data?.tren_tahun_ajaran || [];
  const semesterStatus = data?.semester_status || {};
  const ganjilStatus = semesterStatus.ganjil || summary.ganjil_status || 'selesai';
  const genapStatus = semesterStatus.genap || summary.genap_status || 'selesai';

  const total = Number(summary.total) || 0;
  const putra = Number(summary.putra) || 0;
  const putri = Number(summary.putri) || 0;
  const pctPutra = total > 0 ? Math.round((putra / total) * 100) : 0;
  const pctPutri = total > 0 ? Math.round((putri / total) * 100) : 0;

  return (
    <div className="statistik-diniyah-page">
      <PageHeader
        title="📊 Statistik Siswa Madrasah Diniyah"
        subtitle="Analisis demografi jumlah siswa per semester, per tingkat, dan tren tahun ajaran"
      />

      {/* Filter Bar */}
      <div className="filter-card">
        <div className="filter-item">
          <label><Calendar size={15} /> Tahun Ajaran</label>
          <select
            value={selectedTaId}
            onChange={e => setSelectedTaId(e.target.value)}
            className="filter-select"
          >
            {tahunAjaranList.map(ta => (
              <option key={ta.id} value={ta.id}>
                {ta.kode} {ta.is_active ? '★ (Aktif)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label><Filter size={15} /> Filter Semester</label>
          <div className="semester-tabs">
            <button
              type="button"
              className={selectedSemester === 'semua' ? 'active' : ''}
              onClick={() => setSelectedSemester('semua')}
            >
              Semua
            </button>
            <button
              type="button"
              className={selectedSemester === 'ganjil' ? 'active' : ''}
              onClick={() => setSelectedSemester('ganjil')}
            >
              Semester Ganjil
              {ganjilStatus === 'berjalan' && <span className="tab-pill-active">Aktif</span>}
              {ganjilStatus === 'akan_datang' && <span className="tab-pill-upcoming">Akan Datang</span>}
            </button>
            <button
              type="button"
              className={selectedSemester === 'genap' ? 'active' : ''}
              onClick={() => setSelectedSemester('genap')}
            >
              Semester Genap
              {genapStatus === 'berjalan' && <span className="tab-pill-active">Aktif</span>}
              {genapStatus === 'akan_datang' && <span className="tab-pill-upcoming">Akan Datang</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming / Not-yet-active semester notice */}
      {selectedSemester === 'genap' && genapStatus === 'akan_datang' && (
        <div className="semester-notice-card warning">
          <div className="notice-icon"><AlertCircle size={22} /></div>
          <div className="notice-text">
            <strong>Semester Genap Belum Berjalan (Akan Datang)</strong>
            <p>
              Tahun ajaran ini saat ini berada pada posisi <strong>Semester Ganjil</strong>. Data valid santri aktif untuk Semester Genap belum diverifikasi/berjalan resmi. Data statistik resmi akan disajikan saat kalender akademik memasuki Semester Genap.
            </p>
          </div>
        </div>
      )}

      {selectedSemester === 'ganjil' && ganjilStatus === 'akan_datang' && (
        <div className="semester-notice-card info">
          <div className="notice-icon"><Clock size={22} /></div>
          <div className="notice-text">
            <strong>Semester Ganjil Belum Berjalan (Akan Datang)</strong>
            <p>
              Tahun ajaran ini berstatus masa depan dan belum aktif/berjalan di sistem.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState message="Menghitung statistik siswa madrasah diniyah..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadStatistik} />
      ) : (
        <>
          {/* Main KPI Stats */}
          <div className="stats-kpi-grid">
            <div className="kpi-card total-card">
              <div className="kpi-icon"><Users size={24} /></div>
              <div className="kpi-info">
                <span className="label">Total Siswa Madin</span>
                <span className="value">{total}</span>
                <span className="sub">
                  Tahun Ajaran {data?.tahun_ajaran?.kode || '-'}
                </span>
              </div>
            </div>

            <div className="kpi-card putra-card">
              <div className="kpi-icon"><GraduationCap size={24} /></div>
              <div className="kpi-info">
                <span className="label">Santri Putra (Banin)</span>
                <span className="value">{putra}</span>
                <span className="sub">{pctPutra}% dari total siswa</span>
              </div>
            </div>

            <div className="kpi-card putri-card">
              <div className="kpi-icon"><GraduationCap size={24} /></div>
              <div className="kpi-info">
                <span className="label">Santri Putri (Banat)</span>
                <span className="value">{putri}</span>
                <span className="sub">{pctPutri}% dari total siswa</span>
              </div>
            </div>

            <div className="kpi-card ratio-card">
              <div className="kpi-icon"><PieChart size={24} /></div>
              <div className="kpi-info">
                <span className="label">Rasio Gender</span>
                <span className="value">{putra} : {putri}</span>
                <div className="ratio-bar">
                  <div className="ratio-fill putra" style={{ width: `${pctPutra}%` }} title={`Putra: ${pctPutra}%`} />
                  <div className="ratio-fill putri" style={{ width: `${pctPutri}%` }} title={`Putri: ${pctPutri}%`} />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Per Tingkat & Perbandingan Semester */}
          <div className="two-col-grid">
            {/* Breakdown Per Tingkat */}
            <div className="content-card">
              <div className="card-header">
                <h3><Layers size={18} /> Distribusi Jumlah Siswa Per Tingkat</h3>
                <span className="badge-count">{perTingkat.length} Tingkat</span>
              </div>
              <div className="tingkat-list">
                {perTingkat.map(t => {
                  const tTotal = Number(t.total) || 0;
                  const tPct = total > 0 ? Math.round((tTotal / total) * 100) : 0;
                  return (
                    <div key={t.tingkat} className="tingkat-item">
                      <div className="tingkat-header-row">
                        <span className="tingkat-title">{t.nama_tingkat}</span>
                        <div className="tingkat-counts">
                          <span className="count-total"><strong>{tTotal}</strong> Siswa</span>
                          <span className="count-gender">({t.putra} L / {t.putri} P)</span>
                          <span className="count-pct">{tPct}%</span>
                        </div>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${tPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Semester Activity Summary */}
            <div className="content-card">
              <div className="card-header">
                <h3><UserCheck size={18} /> Keaktifan Siswa Per Semester</h3>
                <span className="badge-count">Semester Data</span>
              </div>
              <div className="semester-summary-box">
                <div className="semester-item">
                  <div className="sem-header">
                    <div className="sem-title-group">
                      <span className="sem-name">Semester Ganjil</span>
                      {ganjilStatus === 'berjalan' && <span className="status-badge running">Sedang Berjalan (Aktif)</span>}
                      {ganjilStatus === 'selesai' && <span className="status-badge finished">Telah Selesai</span>}
                      {ganjilStatus === 'akan_datang' && <span className="status-badge upcoming">Akan Datang</span>}
                    </div>
                    <span className="sem-number">{ganjilStatus === 'akan_datang' ? 'Akan Datang' : `${summary.total_ganjil || 0} Santri`}</span>
                  </div>
                  <div className="sem-progress-bar">
                    <div
                      className="sem-progress-fill ganjil"
                      style={{ width: `${total > 0 && ganjilStatus !== 'akan_datang' ? Math.round(((summary.total_ganjil || 0) / total) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="sem-pct">
                    {ganjilStatus === 'akan_datang' ? 'Belum Berjalan' : `${total > 0 ? Math.round(((summary.total_ganjil || 0) / total) * 100) : 0}% Keaktifan`}
                  </span>
                </div>

                <div className="semester-item" style={{ marginTop: '20px' }}>
                  <div className="sem-header">
                    <div className="sem-title-group">
                      <span className="sem-name">Semester Genap</span>
                      {genapStatus === 'berjalan' && <span className="status-badge running">Sedang Berjalan (Aktif)</span>}
                      {genapStatus === 'selesai' && <span className="status-badge finished">Telah Selesai</span>}
                      {genapStatus === 'akan_datang' && <span className="status-badge upcoming">Akan Datang (Belum Berjalan)</span>}
                    </div>
                    <span className="sem-number">
                      {genapStatus === 'akan_datang' ? 'Akan Datang' : `${summary.total_genap || 0} Santri`}
                    </span>
                  </div>
                  <div className="sem-progress-bar">
                    <div
                      className={`sem-progress-fill genap ${genapStatus === 'akan_datang' ? 'pending' : ''}`}
                      style={{ width: `${total > 0 && genapStatus !== 'akan_datang' ? Math.round(((summary.total_genap || 0) / total) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="sem-pct">
                    {genapStatus === 'akan_datang'
                      ? 'Belum Berjalan • Menunggu Semester Genap'
                      : `${total > 0 ? Math.round(((summary.total_genap || 0) / total) * 100) : 0}% Keaktifan`}
                  </span>
                </div>

                <div className="sem-note">
                  💡 <em>Data keaktifan per semester disesuaikan dengan posisi Semester Aktif. Data Semester Genap akan disajikan secara valid saat kalender akademik resmi memasuki Semester Genap.</em>
                </div>
              </div>
            </div>
          </div>

          {/* Table: Breakdown Detail Per Kelas Diniyah */}
          <div className="content-card full-width">
            <div className="card-header">
              <h3><School size={18} /> Rincian Jumlah Siswa Per Kelas Diniyah</h3>
              <span className="badge-count">{perKelas.length} Kelas</span>
            </div>
            <div className="table-wrapper">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Kelas</th>
                    <th>Tingkat</th>
                    <th>Total Siswa</th>
                    <th>Putra (L)</th>
                    <th>Putri (P)</th>
                    <th>Rasio Gender</th>
                    <th>Proporsi Kelas</th>
                  </tr>
                </thead>
                <tbody>
                  {perKelas.map(k => {
                    const kTotal = Number(k.total) || 0;
                    const kPutra = Number(k.putra) || 0;
                    const kPutri = Number(k.putri) || 0;
                    const kPct = total > 0 ? Math.round((kTotal / total) * 100) : 0;
                    return (
                      <tr key={k.kelas_id}>
                        <td className="col-kelas"><strong>Kelas {k.nama_kelas}</strong></td>
                        <td>{k.tingkat === 99 ? 'Tingkat SP' : (k.tingkat === 0 ? 'Tingkat Sifir' : `Tingkat ${k.tingkat}`)}</td>
                        <td className="col-total"><strong>{kTotal}</strong> Santri</td>
                        <td className="col-putra">{kPutra}</td>
                        <td className="col-putri">{kPutri}</td>
                        <td>
                          <div className="mini-ratio-bar">
                            <div className="mini-fill putra" style={{ width: `${kTotal > 0 ? (kPutra / kTotal) * 100 : 50}%` }} />
                            <div className="mini-fill putri" style={{ width: `${kTotal > 0 ? (kPutri / kTotal) * 100 : 50}%` }} />
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${kPct}%`, height: '100%', background: '#059669', borderRadius: '4px' }} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>{kPct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tren Perbandingan Antar Tahun Ajaran */}
          <div className="content-card full-width">
            <div className="card-header">
              <h3><TrendingUp size={18} /> Tren Jumlah Siswa Antar Tahun Ajaran</h3>
              <span className="badge-count">{tren.length} Tahun Ajaran Terdata</span>
            </div>
            <div className="tren-grid">
              {tren.map(tr => (
                <div
                  key={tr.tahun_ajaran_id}
                  className={`tren-card ${String(tr.tahun_ajaran_id) === String(selectedTaId) ? 'current' : ''}`}
                  onClick={() => setSelectedTaId(String(tr.tahun_ajaran_id))}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="tren-year">
                    <span>{tr.kode}</span>
                    {tr.is_active && <span className="active-pill">Aktif</span>}
                  </div>
                  <div className="tren-number">{tr.total_diniyah || 0}</div>
                  <span className="tren-sub">Siswa Diniyah</span>
                  <div className="tren-details">
                    <span>👦 {tr.putra || 0}</span>
                    <span>•</span>
                    <span>👧 {tr.putri || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default StatistikDiniyah;

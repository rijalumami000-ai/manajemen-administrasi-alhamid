import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert, Search, RefreshCw, Calendar, Eye, EyeOff,
  User, Info, ArrowRight, ShieldCheck, AlertCircle, FileText,
  Activity, Layers, Clock
} from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import { AuditLogItem } from '../types/keuangan';
import './AuditKeuangan.scss';

const ACTION_OPTIONS = [
  { value: '', label: 'Semua Aktivitas' },
  { value: 'GENERATE_TAGIHAN_MASSAL', label: 'Generate SPP Massal' },
  { value: 'CATAT_PEMBAYARAN', label: 'Catat Pembayaran' },
  { value: 'VOID_PEMBAYARAN', label: 'Void Pembayaran' },
  { value: 'SET_TARIF', label: 'Atur Tarif Default' },
  { value: 'SET_TARIF_BULANAN', label: 'Override Tarif Bulanan' },
  { value: 'DELETE_TARIF_BULANAN', label: 'Hapus Override' },
  { value: 'SET_PENGECUALIAN', label: 'Tambah Free SPP' },
  { value: 'CABUT_PENGECUALIAN', label: 'Cabut Free SPP' },
  { value: 'CATAT_PENGELUARAN', label: 'Catat Kas Keluar' },
  { value: 'VOID_PENGELUARAN', label: 'Void Kas Keluar' },
];

const ENTITY_OPTIONS = [
  { value: '', label: 'Semua Objek' },
  { value: 'tagihan', label: 'Tagihan' },
  { value: 'pembayaran', label: 'Pembayaran' },
  { value: 'tarif_iuran', label: 'Tarif Default' },
  { value: 'tarif_iuran_bulanan', label: 'Override Bulanan' },
  { value: 'pengecualian_iuran', label: 'Pengecualian' },
  { value: 'kas_keluar', label: 'Kas Keluar' },
];

function getActionPillClass(action: string): string {
  const act = action.toUpperCase();
  if (act.includes('VOID') || act.includes('DELETE') || act.includes('CABUT')) {
    return 'act-danger';
  }
  if (act.includes('CATAT_PEMBAYARAN') || act.includes('SET_PENGECUALIAN')) {
    return 'act-success';
  }
  if (act.includes('GENERATE')) {
    return 'act-primary';
  }
  if (act.includes('TARIF')) {
    return 'act-warning';
  }
  return 'act-neutral';
}

function formatJSON(val: any): string {
  if (!val) return '—';
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function AuditKeuangan() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Detail viewing state
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const token = localStorage.getItem('token') ?? '';

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entity_type', entityFilter);

      const res = await fetch(`/api/keuangan/audit-log?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? 'Gagal memuat log audit.');
      }
      setLogs(json.data ?? []);
      setTotalPages(json.pagination?.total_pages ?? 1);
      setTotalItems(json.pagination?.total ?? 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, token]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [actionFilter, entityFilter]);

  const toggleExpand = (id: number) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  // Metrics Calculation from loaded logs (for overview stats)
  const stats = useMemo(() => {
    let voidCount = 0;
    let paymentCount = 0;
    let setupCount = 0;
    logs.forEach(l => {
      const act = l.action.toUpperCase();
      if (act.includes('VOID') || act.includes('DELETE') || act.includes('CABUT')) voidCount++;
      else if (act.includes('PEMBAYARAN') || act.includes('TAGIHAN')) paymentCount++;
      else if (act.includes('TARIF') || act.includes('PENGECUALIAN')) setupCount++;
    });
    return { voidCount, paymentCount, setupCount };
  }, [logs]);

  return (
    <div className="audit-keuangan-container">
      {/* 🍏 1. APPLE FLOATING DOCK HEADER (Option A Standard - NO HEADER ICON) */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Log Audit Keuangan</h2>
          <p className="page-subtitle">
            Pelacakan lengkap dan riwayat aktivitas perubahan transaksi keuangan pondok pesantren
          </p>
        </div>

        <div className="header-action-dock">
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={fetchLogs}
            disabled={loading}
            title="Segarkan Log"
          >
            <RefreshCw size={14} className={loading ? 'spinning-icon' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </header>

      {/* 📊 2. KPI AUDIT SUMMARY CARDS */}
      <div className="audit-kpi-grid">
        <div className="audit-glass-kpi card-sapphire">
          <div className="kpi-top-row">
            <span className="kpi-label">Total Aktivitas Tercatat</span>
            <div className="kpi-icon-orb orb-sapphire">
              <Activity size={18} />
            </div>
          </div>
          <div className="kpi-main-val text-sapphire">{totalItems} Log</div>
          <p className="kpi-sub-text">Keseluruhan rekam jejak sistem keuangan</p>
        </div>

        <div className="audit-glass-kpi card-emerald">
          <div className="kpi-top-row">
            <span className="kpi-label">Transaksi & Tagihan</span>
            <div className="kpi-icon-orb orb-emerald">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="kpi-main-val text-emerald">{stats.paymentCount} Transaksi</div>
          <p className="kpi-sub-text">Pembayaran SPP dan generate tagihan massal</p>
        </div>

        <div className="audit-glass-kpi card-rose">
          <div className="kpi-top-row">
            <span className="kpi-label">Pembatalan & Void (Security)</span>
            <div className="kpi-icon-orb orb-rose">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="kpi-main-val text-rose">{stats.voidCount} Dibatalkan</div>
          <p className="kpi-sub-text">Transaksi kas atau kuitansi yang dibatalkan</p>
        </div>

        <div className="audit-glass-kpi card-amber">
          <div className="kpi-top-row">
            <span className="kpi-label">Perubahan Tarif & Setup</span>
            <div className="kpi-icon-orb orb-amber">
              <Layers size={18} />
            </div>
          </div>
          <div className="kpi-main-val text-amber">{stats.setupCount} Modifikasi</div>
          <p className="kpi-sub-text">Penetapan tarif baku & pengecualian</p>
        </div>
      </div>

      {error && (
        <div className="audit-alert-banner">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* 📋 3. TABLE SECTION WITH CUSTOM FILTERS */}
      <div className="audit-table-card">
        <div className="table-section-toolbar">
          <div className="toolbar-filters-group">
            <div style={{ width: 220 }}>
              <CustomSelect
                value={actionFilter}
                onChange={val => setActionFilter(String(val))}
                options={ACTION_OPTIONS}
                placeholder="Pilih Aktivitas"
                size="md"
              />
            </div>

            <div style={{ width: 180 }}>
              <CustomSelect
                value={entityFilter}
                onChange={val => setEntityFilter(String(val))}
                options={ENTITY_OPTIONS}
                placeholder="Pilih Objek"
                size="md"
              />
            </div>
          </div>

          <div className="toolbar-counter-group">
            <span className="log-counter-badge">
              Menampilkan {logs.length} dari {totalItems} log
            </span>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="table-responsive-wrapper">
          <table className="audit-glass-table">
            <thead>
              <tr>
                <th style={{ width: 45 }}>#</th>
                <th style={{ width: 140 }}>Waktu Transaksi</th>
                <th>Aktivitas</th>
                <th>Objek Terkait</th>
                <th>Petugas / Bendahara</th>
                <th>Keterangan</th>
                <th className="cell-center" style={{ width: 70 }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan={7}>
                      <div className="table-skeleton-bar" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty-cell">
                    <FileText size={32} className="empty-icon" />
                    <p>Tidak ada catatan audit yang cocok dengan filter yang dipilih.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const isExpanded = expandedLogId === log.id;
                  const userInitial = log.nama_user ? log.nama_user.charAt(0).toUpperCase() : 'S';
                  const dateStr = new Date(log.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const timeStr = new Date(log.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <React.Fragment key={log.id}>
                      <tr className={isExpanded ? 'row-expanded-parent' : ''}>
                        <td className="cell-muted">{(page - 1) * 25 + idx + 1}</td>
                        <td>
                          <div className="timestamp-cell">
                            <span className="date-txt">{dateStr}</span>
                            <span className="time-txt">
                              <Clock size={11} /> {timeStr}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`log-action-pill ${getActionPillClass(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <span className="entity-tag">
                            {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                          </span>
                        </td>
                        <td>
                          <div className="user-cell-group">
                            <div className="user-avatar-orb">{userInitial}</div>
                            <div className="user-info-col">
                              <span className="user-name">{log.nama_user || 'Sistem Otomatis'}</span>
                              <span className="user-meta">
                                {log.username || 'system'} · {log.ip_address || '127.0.0.1'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="keterangan-txt" title={log.keterangan}>
                            {log.keterangan || '—'}
                          </div>
                        </td>
                        <td className="cell-center">
                          <button
                            type="button"
                            className={`action-circle-btn ${isExpanded ? 'active-btn' : ''}`}
                            onClick={() => toggleExpand(log.id)}
                            title={isExpanded ? 'Tutup Detail Data' : 'Lihat Detail Nilai'}
                          >
                            {isExpanded ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </td>
                      </tr>

                      {/* 🔍 EXPANDED DIFF ROW */}
                      {isExpanded && (
                        <tr className="row-expanded-content">
                          <td colSpan={7}>
                            <div className="expanded-diff-container">
                              <div className="diff-panels-grid">
                                {log.nilai_lama && (
                                  <div className="diff-card card-old">
                                    <div className="diff-header">
                                      <span className="diff-title text-rose">Nilai Sebelumnya (Lama)</span>
                                    </div>
                                    <pre className="diff-pre">{formatJSON(log.nilai_lama)}</pre>
                                  </div>
                                )}

                                {log.nilai_baru && (
                                  <div className="diff-card card-new">
                                    <div className="diff-header">
                                      <span className="diff-title text-emerald">Nilai Baru (Sesudah)</span>
                                    </div>
                                    <pre className="diff-pre">{formatJSON(log.nilai_baru)}</pre>
                                  </div>
                                )}

                                {!log.nilai_lama && !log.nilai_baru && (
                                  <div className="diff-empty-msg">
                                    <Info size={15} />
                                    <span>Tidak ada detail payload nilai yang tersimpan untuk aktivitas ini.</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 🍏 4. PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="table-pagination-dock">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="action-pill-btn secondary-pill"
            >
              ← Sebelumnya
            </button>
            <span className="page-indicator-txt">
              Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="action-pill-btn secondary-pill"
            >
              Berikutnya →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

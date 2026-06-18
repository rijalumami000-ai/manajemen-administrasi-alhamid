import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Search, RefreshCw, Calendar, Eye, EyeOff, User, Info } from 'lucide-react';
import './AuditKeuangan.scss';

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  nilai_lama: any;
  nilai_baru: any;
  keterangan?: string;
  ip_address?: string;
  created_at: string;
  nama_user?: string;
  username?: string;
}

export default function AuditKeuangan() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
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
        limit: '25'
      });
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entity_type', entityFilter);

      const res = await fetch(`/api/keuangan/audit-log?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
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

  const formatJSON = (val: any) => {
    if (!val) return '—';
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  };

  return (
    <div className="k-page audit-keuangan-page">
      <div className="k-page__header">
        <div>
          <h1>
            <ShieldAlert size={22} style={{ marginRight: 8, color: '#E11D48', verticalAlign: 'middle' }} />
            Log Audit Keuangan
          </h1>
          <p>Pelacakan lengkap aktivitas pencatatan keuangan pondok pesantren (admin only)</p>
        </div>
        <div className="k-page__header-actions">
          <button className="k-btn-secondary" onClick={fetchLogs} title="Refresh data">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="tagihan-toolbar">
        <div className="tagihan-toolbar__left">
          <select 
            className="k-select" 
            value={actionFilter} 
            onChange={e => setActionFilter(e.target.value)}
          >
            <option value="">Semua Aktivitas</option>
            <option value="GENERATE_TAGIHAN_MASSAL">Generate SPP Massal</option>
            <option value="CATAT_PEMBAYARAN">Catat Pembayaran</option>
            <option value="VOID_PEMBAYARAN">Void Pembayaran</option>
            <option value="SET_TARIF">Atur Tarif Default</option>
            <option value="SET_TARIF_BULANAN">Override Tarif Bulanan</option>
            <option value="DELETE_TARIF_BULANAN">Hapus Override</option>
            <option value="SET_PENGECUALIAN">Tambah Free SPP</option>
            <option value="CABUT_PENGECUALIAN">Cabut Free SPP</option>
            <option value="CATAT_PENGELUARAN">Catat Kas Keluar</option>
            <option value="VOID_PENGELUARAN">Void Kas Keluar</option>
          </select>

          <select 
            className="k-select" 
            value={entityFilter} 
            onChange={e => setEntityFilter(e.target.value)}
          >
            <option value="">Semua Objek</option>
            <option value="tagihan">Tagihan</option>
            <option value="pembayaran">Pembayaran</option>
            <option value="tarif_iuran">Tarif Default</option>
            <option value="tarif_iuran_bulanan">Override Bulanan</option>
            <option value="pengecualian_iuran">Pengecualian</option>
            <option value="kas_keluar">Kas Keluar</option>
          </select>
        </div>
        
        <div className="tagihan-toolbar__right">
          <span className="muted" style={{ fontSize: 13 }}>
            Total: <strong>{totalItems}</strong> log
          </span>
        </div>
      </div>

      {error && (
        <div className="k-alert k-alert--danger" style={{ marginBottom: 16 }}>
          <ShieldAlert size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="laporan-skeleton">
          {[1, 2, 3, 4].map(i => <div key={i} className="k-skeleton" style={{ height: 60, marginBottom: 8 }} />)}
        </div>
      ) : (
        <div className="k-table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Waktu</th>
                <th>Aktivitas</th>
                <th>Objek</th>
                <th>Bendahara</th>
                <th>Keterangan</th>
                <th className="center">Data</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <>
                    <tr key={log.id} className={isExpanded ? 'active-row' : ''}>
                      <td className="muted">{(page - 1) * 25 + idx + 1}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 500 }}>
                          {new Date(log.created_at).toLocaleDateString('id-ID')}
                        </div>
                        <div className="muted" style={{ fontSize: 11 }}>
                          {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <span className={`log-badge log-badge--${log.action.toLowerCase()}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="muted" style={{ fontSize: 12.5 }}>
                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{log.nama_user || 'System'}</div>
                        <div className="muted" style={{ fontSize: 11 }}>{log.username || 'system'} · {log.ip_address || '—'}</div>
                      </td>
                      <td>
                        <div className="log-keterangan">{log.keterangan || '—'}</div>
                      </td>
                      <td className="center">
                        <button
                          className="k-btn-icon"
                          onClick={() => toggleExpand(log.id)}
                          title="Lihat Detail Nilai"
                          style={{ color: isExpanded ? '#3B6FE8' : '#94A3B8' }}
                        >
                          {isExpanded ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className="log-detail-row">
                        <td colSpan={7}>
                          <div className="log-diff-view">
                            {log.nilai_lama && (
                              <div className="diff-panel">
                                <h6>Nilai Lama</h6>
                                <pre>{formatJSON(log.nilai_lama)}</pre>
                              </div>
                            )}
                            {log.nilai_baru && (
                              <div className="diff-panel">
                                <h6>Nilai Baru</h6>
                                <pre style={{ color: '#10A05B' }}>{formatJSON(log.nilai_baru)}</pre>
                              </div>
                            )}
                            {!log.nilai_lama && !log.nilai_baru && (
                              <div className="muted center" style={{ padding: 12 }}>
                                <Info size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Tidak ada detail data nilai tersimpan untuk aktivitas ini.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="center muted" style={{ padding: 24 }}>
                    Tidak ada log audit ditemukan untuk filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="k-pagination" style={{ marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="k-btn-ghost">← Sebelumnya</button>
          <span>Halaman {page} dari {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="k-btn-ghost">Berikutnya →</button>
        </div>
      )}
    </div>
  );
}

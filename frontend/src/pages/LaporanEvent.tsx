import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Search, X, CheckCircle2, Clock, XCircle, Minus,
  Layers, Users, Banknote, AlertCircle, Calendar, Sparkles
} from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import {
  StatusTagihan,
  TahunAjaran,
  LaporanEventResponse,
  LaporanEventItem,
  LaporanEventSantri
} from '../types/keuangan';
import './LaporanEvent.scss';

function rp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function getPctClass(pct: number): string {
  if (pct >= 100) return 'pct-done';
  if (pct >= 80) return 'pct-good';
  if (pct >= 50) return 'pct-warning';
  return 'pct-danger';
}

function StatusBadge({ status }: { status: StatusTagihan }) {
  if (!status) return <span className="tagihan-status-badge badge-belum-lunas">—</span>;
  const map: Record<StatusTagihan, { label: string; className: string; Icon: React.ElementType }> = {
    lunas:       { label: 'Lunas',      className: 'badge-lunas',       Icon: CheckCircle2 },
    sebagian:    { label: 'Sebagian',   className: 'badge-sebagian',    Icon: Clock },
    belum_lunas: { label: 'Belum',      className: 'badge-belum-lunas', Icon: XCircle },
    dibebaskan:  { label: 'Bebas',      className: 'badge-dibebaskan',  Icon: Minus },
  };
  const { label, className, Icon } = map[status] ?? map.belum_lunas;
  return (
    <span className={`tagihan-status-badge ${className}`}>
      <Icon size={10} />
      <span>{label}</span>
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function LaporanEvent() {
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [tahunId, setTahunId] = useState<number | null>(null);
  const [data, setData] = useState<LaporanEventResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEventCode, setSelectedEventCode] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const token = localStorage.getItem('token') ?? '';

  useEffect(() => {
    fetch('/api/tahun-ajaran', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((list: TahunAjaran[]) => {
        setTahunList(list);
        const aktif = list.find(t => t.is_active);
        if (aktif) setTahunId(aktif.id);
      })
      .catch(() => {});
  }, [token]);

  const fetchData = useCallback(async () => {
    if (!tahunId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/keuangan/laporan/event?tahun_ajaran_id=${tahunId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const json: LaporanEventResponse = await res.json();
        setData(json);
        if (json.per_event?.length > 0) {
          const exists = json.per_event.some(e => e.kode === selectedEventCode);
          if (!exists) setSelectedEventCode(json.per_event[0].kode);
        } else {
          setSelectedEventCode('');
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tahunId, token, selectedEventCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const events: LaporanEventItem[] = data?.per_event ?? [];
  const activeEvent = events.find(e => e.kode === selectedEventCode);

  const detailSantri: LaporanEventSantri[] = activeEvent?.detail_santri ?? [];
  const filteredSantri = detailSantri.filter(s =>
    s.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tahunOptions = tahunList.map(t => ({
    value: t.id,
    label: `${t.kode}${t.is_active ? ' (Aktif)' : ''}`,
  }));

  return (
    <div className="laporan-event-container">
      {/* 🍏 1. APPLE FLOATING DOCK HEADER (Option A Standard - NO HEADER ICON) */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Laporan Keuangan Event</h2>
          <p className="page-subtitle">
            Realisasi pembayaran iuran temporer / event insidental santri (Haflah, Kitab Romadhon, dll.)
          </p>
        </div>

        <div className="header-action-dock">
          <div style={{ width: 170 }}>
            <CustomSelect
              value={tahunId}
              onChange={val => setTahunId(Number(val))}
              options={tahunOptions}
              placeholder="Pilih Tahun Ajaran"
              size="md"
            />
          </div>

          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={fetchData}
            disabled={loading}
            title="Segarkan Data"
          >
            <RefreshCw size={14} className={loading ? 'spinning-icon' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="laporan-skeleton-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="laporan-skeleton-card" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* 📊 2. KPI SUMMARY GRID */}
          <div className="laporan-kpi-grid">
            {/* Target Seluruh Event */}
            <div className="laporan-glass-kpi card-sapphire">
              <div className="kpi-top-row">
                <span className="kpi-label">Target Seluruh Event</span>
                <div className="kpi-icon-orb orb-sapphire">
                  <Banknote size={18} />
                </div>
              </div>
              <div className="kpi-main-val text-sapphire">{rp(Number(data.grand_target))}</div>
              <p className="kpi-sub-text">Total estimasi dari {events.length} event terdaftar</p>
            </div>

            {/* Total Terkumpul */}
            <div className="laporan-glass-kpi card-emerald">
              <div className="kpi-top-row">
                <span className="kpi-label">Total Terkumpul</span>
                <div className="kpi-icon-orb orb-emerald">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="kpi-main-val text-emerald">{rp(Number(data.grand_terkumpul))}</div>
              <div className="kpi-progress-track">
                <div
                  className="kpi-progress-fill fill-emerald"
                  style={{ width: `${data.realisasi_pct}%` }}
                />
              </div>
              <div className="kpi-meta-footer">
                <span>{data.realisasi_pct}% Realisasi Global</span>
                <span className="meta-sub">Penerimaan masuk</span>
              </div>
            </div>

            {/* Total Piutang Event */}
            <div className="laporan-glass-kpi card-rose">
              <div className="kpi-top-row">
                <span className="kpi-label">Total Piutang Event</span>
                <div className="kpi-icon-orb orb-rose">
                  <AlertCircle size={18} />
                </div>
              </div>
              <div className="kpi-main-val text-rose">{rp(Number(data.grand_tunggakan))}</div>
              <p className="kpi-sub-text">Belum dilunasi oleh santri</p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="event-empty-box">
              <Sparkles size={36} className="empty-icon" />
              <h3>Belum Ada Event Aktif</h3>
              <p>Tidak ada tagihan event keuangan yang terdaftar pada tahun ajaran ini.</p>
            </div>
          ) : (
            /* ── 3. DUA KOLOM: Event Sidebar + Event Detail Panel ──────── */
            <div className="event-master-detail-layout">
              {/* KOLOM KIRI: Daftar Event Selector */}
              <div className="event-sidebar-card">
                <div className="sidebar-header">
                  <h4 className="sidebar-title">Daftar Event ({events.length})</h4>
                </div>
                <div className="event-pills-list">
                  {events.map(ev => {
                    const isActive = selectedEventCode === ev.kode;
                    return (
                      <button
                        key={ev.kode}
                        type="button"
                        className={`event-selector-pill ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedEventCode(ev.kode);
                          setSearchQuery('');
                        }}
                      >
                        <div className="pill-top-row">
                          <span className="event-name">{ev.nama}</span>
                          <span className={`pill-pct-badge ${getPctClass(ev.realisasi_pct)}`}>
                            {ev.realisasi_pct}%
                          </span>
                        </div>
                        <div className="pill-sub-row">
                          <span className="nominal-txt">Terkumpul: {rp(ev.terkumpul)}</span>
                          <span className="code-txt">{ev.kode}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* KOLOM KANAN: Detail Panel Event Terpilih */}
              {activeEvent && (
                <div className="event-detail-card">
                  {/* Panel Header */}
                  <div className="event-panel-header">
                    <div className="header-text-group">
                      <h3 className="event-main-title">{activeEvent.nama}</h3>
                      <span className="event-code-tag">Kode Iuran: {activeEvent.kode}</span>
                    </div>

                    <div className="event-realisasi-badge-wrap">
                      <span className="pct-num text-sapphire">{activeEvent.realisasi_pct}%</span>
                      <span className="lbl-txt">Realisasi</span>
                    </div>
                  </div>

                  {/* 4 Micro Stat Cards */}
                  <div className="panel-micro-stats-grid">
                    <div className="micro-stat-card">
                      <span className="lbl">Target Event</span>
                      <span className="val">{rp(activeEvent.target)}</span>
                    </div>
                    <div className="micro-stat-card">
                      <span className="lbl">Terkumpul</span>
                      <span className="val text-emerald">{rp(activeEvent.terkumpul)}</span>
                    </div>
                    <div className="micro-stat-card">
                      <span className="lbl">Kekurangan</span>
                      <span className="val text-rose">{rp(activeEvent.target - activeEvent.terkumpul)}</span>
                    </div>
                    <div className="micro-stat-card">
                      <span className="lbl">Partisipasi Santri</span>
                      <span className="val-text">
                        <strong>{activeEvent.jumlah_lunas}</strong> lunas · <strong>{activeEvent.jumlah_sebagian}</strong> sebagian
                      </span>
                    </div>
                  </div>

                  {/* Table Section */}
                  <div className="event-table-section">
                    <div className="section-toolbar">
                      <h4 className="section-title">Daftar Santri Terdaftar</h4>

                      {/* Inset Search Pill */}
                      <div className="search-pill-wrapper">
                        <Search size={14} className="search-icon" />
                        <input
                          type="text"
                          placeholder="Cari santri / NIS..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="search-input"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            className="search-clear-btn"
                            onClick={() => setSearchQuery('')}
                            title="Hapus pencarian"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="laporan-table-card">
                      <div className="table-responsive-wrapper">
                        <table className="laporan-glass-table">
                          <thead>
                            <tr>
                              <th style={{ width: 45 }}>#</th>
                              <th>Santri</th>
                              <th className="cell-right">Tagihan</th>
                              <th className="cell-right">Telah Dibayar</th>
                              <th className="cell-right">Sisa Tagihan</th>
                              <th className="cell-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSantri.map((s, idx) => {
                              const initial = s.nama ? s.nama.charAt(0).toUpperCase() : '?';
                              return (
                                <tr key={s.santri_id}>
                                  <td className="cell-muted">{idx + 1}</td>
                                  <td>
                                    <div className="santri-cell-group">
                                      <div className="santri-avatar-orb">{initial}</div>
                                      <div className="santri-name-column">
                                        <span className="santri-name">{s.nama}</span>
                                        <span className="santri-nis-pill">NIS: {s.nis}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="cell-right font-numeric">{rp(s.tagihan)}</td>
                                  <td className="cell-right font-numeric text-emerald font-bold">{rp(s.dibayar)}</td>
                                  <td className={`cell-right font-numeric font-bold ${s.sisa > 0 ? 'text-rose' : 'text-emerald'}`}>
                                    {rp(s.sisa)}
                                  </td>
                                  <td className="cell-center">
                                    <StatusBadge status={s.status} />
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredSantri.length === 0 && (
                              <tr>
                                <td colSpan={6} className="table-empty-cell">
                                  Tidak ada santri yang cocok dengan pencarian "{searchQuery}"
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

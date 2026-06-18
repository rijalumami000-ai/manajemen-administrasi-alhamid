import { useState, useEffect, useCallback } from 'react';
import { CalendarRange, TrendingUp, TrendingDown, RefreshCw, Search, Award } from 'lucide-react';
import './LaporanEvent.scss';

type StatusTagihan = 'belum_lunas' | 'sebagian' | 'lunas' | 'dibebaskan';

interface TahunAjaran {
  id: number;
  kode: string;
  is_active: boolean;
}

function rp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function getPctClass(pct: number): string {
  if (pct >= 100) return 'pct-done';
  if (pct >= 80) return 'pct-good';
  if (pct >= 50) return 'pct-warning';
  return 'pct-danger';
}

function StatusBadge({ status }: { status: StatusTagihan }) {
  if (!status) return <span className="k-badge k-badge--belum_lunas">—</span>;
  const map: Record<StatusTagihan, string> = {
    lunas: 'k-badge--lunas', sebagian: 'k-badge--sebagian',
    belum_lunas: 'k-badge--belum_lunas', dibebaskan: 'k-badge--dibebaskan',
  };
  const labels: Record<StatusTagihan, string> = {
    lunas: 'Lunas', sebagian: 'Sebagian', belum_lunas: 'Belum', dibebaskan: 'Bebas',
  };
  return <span className={`k-badge ${map[status]}`}>{labels[status]}</span>;
}

export default function LaporanEvent() {
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [tahunId, setTahunId] = useState<number | null>(null);
  const [data, setData] = useState<any>(null);
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
      });
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
        const json = await res.json();
        setData(json);
        if (json.per_event?.length > 0) {
          // Keep selection or default to first
          const exists = json.per_event.some((e: any) => e.kode === selectedEventCode);
          if (!exists) setSelectedEventCode(json.per_event[0].kode);
        } else {
          setSelectedEventCode('');
        }
      }
    } catch (err) {
      console.error('Fetch Laporan Event error:', err);
    } finally {
      setLoading(false);
    }
  }, [tahunId, token, selectedEventCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const events = data?.per_event ?? [];
  const activeEvent = events.find((e: any) => e.kode === selectedEventCode);
  
  const detailSantri = activeEvent?.detail_santri ?? [];
  const filteredSantri = detailSantri.filter((s: any) =>
    s.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="k-page laporan-event-page">
      <div className="k-page__header">
        <div>
          <h1>
            <CalendarRange size={22} style={{ marginRight: 8, color: '#3B6FE8', verticalAlign: 'middle' }} />
            Laporan Keuangan Event
          </h1>
          <p>Realisasi pembayaran iuran temporer / event (Haflah, Kitab Ramadhan, dll)</p>
        </div>
        <div className="k-page__header-actions">
          <select className="k-select" value={tahunId ?? ''} onChange={e => setTahunId(Number(e.target.value))}>
            {tahunList.map(t => <option key={t.id} value={t.id}>{t.kode}{t.is_active ? ' (Aktif)' : ''}</option>)}
          </select>
          <button className="k-btn-secondary" onClick={fetchData} title="Refresh data">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="laporan-skeleton">
          {[1, 2, 3].map(i => <div key={i} className="k-skeleton" style={{ height: 80, marginBottom: 12 }} />)}
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="laporan-summary-grid">
            <div className="laporan-summary-card laporan-summary-card--makan">
              <h4>Target Seluruh Event</h4>
              <div className="laporan-summary-card__big">{rp(Number(data.grand_target))}</div>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Total target untuk {events.length} event
              </p>
            </div>
            <div className="laporan-summary-card laporan-summary-card--total">
              <h4>Total Terkumpul</h4>
              <div className="laporan-summary-card__big" style={{ color: '#10A05B' }}>{rp(Number(data.grand_terkumpul))}</div>
              <div className="k-progress__bar-wrap" style={{ marginTop: 8 }}>
                <div className={`k-progress__bar ${getPctClass(Number(data.realisasi_pct))}`}
                  style={{ width: `${data.realisasi_pct}%` }} />
              </div>
              <div className="laporan-summary-card__pct">{data.realisasi_pct}% Realisasi Global</div>
            </div>
            <div className="laporan-summary-card laporan-summary-card--madin">
              <h4>Total Piutang Event</h4>
              <div className="laporan-summary-card__big" style={{ color: '#DC3545' }}>{rp(Number(data.grand_tunggakan))}</div>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Belum dilunasi oleh santri
              </p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="k-card-bg center muted" style={{ padding: 48, marginTop: 24, borderRadius: 8 }}>
              Tidak ada event keuangan aktif yang terdaftar di tahun ajaran ini.
            </div>
          ) : (
            <div className="event-layout" style={{ marginTop: 24 }}>
              {/* Event Selector List Sidebar */}
              <div className="event-sidebar">
                <h4 style={{ fontWeight: 600, marginBottom: 12, paddingLeft: 8 }}>Daftar Event</h4>
                <div className="event-list">
                  {events.map((ev: any) => (
                    <button
                      key={ev.kode}
                      className={`event-item ${selectedEventCode === ev.kode ? 'event-item--active' : ''}`}
                      onClick={() => {
                        setSelectedEventCode(ev.kode);
                        setSearchQuery('');
                      }}
                    >
                      <div className="event-item__title">{ev.nama}</div>
                      <div className="event-item__sub">
                        <span>Realisasi: {rp(ev.terkumpul)}</span>
                        <span className={`badge-pct ${getPctClass(ev.realisasi_pct)}`}>
                          {ev.realisasi_pct}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Detail Panel */}
              {activeEvent && (
                <div className="event-detail-panel">
                  <div className="event-panel-header">
                    <div>
                      <h2>{activeEvent.nama}</h2>
                      <span className="muted">Kode Event: {activeEvent.kode}</span>
                    </div>
                    <div className="panel-realisasi-mini">
                      <span className="pct">{activeEvent.realisasi_pct}%</span>
                      <span className="label">terkumpul</span>
                    </div>
                  </div>

                  {/* Micro stats grid */}
                  <div className="panel-stats-grid">
                    <div className="p-stat">
                      <span className="p-stat__label">Target Event</span>
                      <span className="p-stat__val">{rp(activeEvent.target)}</span>
                    </div>
                    <div className="p-stat">
                      <span className="p-stat__label">Terkumpul</span>
                      <span className="p-stat__val" style={{ color: '#10A05B' }}>{rp(activeEvent.terkumpul)}</span>
                    </div>
                    <div className="p-stat">
                      <span className="p-stat__label">Kekurangan</span>
                      <span className="p-stat__val" style={{ color: '#DC3545' }}>{rp(activeEvent.target - activeEvent.terkumpul)}</span>
                    </div>
                    <div className="p-stat">
                      <span className="p-stat__label">Status Santri</span>
                      <span className="p-stat__val" style={{ fontSize: 13, fontWeight: 500 }}>
                        {activeEvent.jumlah_lunas} lunas · {activeEvent.jumlah_sebagian} sebagian
                      </span>
                    </div>
                  </div>

                  {/* Student list */}
                  <div className="event-students-list" style={{ marginTop: 24 }}>
                    <div className="list-search-row">
                      <h4 style={{ fontWeight: 600 }}>Daftar Santri Terdaftar</h4>
                      <div className="search-box">
                        <Search size={15} />
                        <input
                          type="text"
                          placeholder="Cari santri..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="k-table-wrap" style={{ marginTop: 12 }}>
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Santri</th>
                            <th className="right">Tagihan</th>
                            <th className="right">Telah Dibayar</th>
                            <th className="right">Sisa Tagihan</th>
                            <th className="center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSantri.map((s: any, idx: number) => (
                            <tr key={s.santri_id}>
                              <td className="muted">{idx + 1}</td>
                              <td>
                                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.nama}</div>
                                <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.nis}</div>
                              </td>
                              <td className="right">{rp(s.tagihan)}</td>
                              <td className="right" style={{ color: '#10A05B' }}>{rp(s.dibayar)}</td>
                              <td className="right" style={{ color: s.sisa > 0 ? '#DC3545' : '#10A05B', fontWeight: 600 }}>
                                {rp(s.sisa)}
                              </td>
                              <td className="center">
                                <StatusBadge status={s.status} />
                              </td>
                            </tr>
                          ))}
                          {filteredSantri.length === 0 && (
                            <tr>
                              <td colSpan={6} className="center muted" style={{ padding: 24 }}>
                                Tidak ada santri yang cocok dengan kriteria pencarian
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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

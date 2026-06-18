import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, TrendingUp, TrendingDown, RefreshCw, Search, ChevronRight, User } from 'lucide-react';
import './LaporanDaftarUlang.scss';

type TipeDaftarUlang = 'baru' | 'lama';
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

function pctBar(terkumpul: number, target: number): number {
  if (!target) return 0;
  return Math.min(100, Math.round((terkumpul / target) * 100));
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

export default function LaporanDaftarUlang() {
  const [tipe, setTipe] = useState<TipeDaftarUlang>('baru');
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [tahunId, setTahunId] = useState<number | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
        `/api/keuangan/laporan/daftar-ulang?tahun_ajaran_id=${tahunId}&tipe=${tipe}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Fetch Laporan Daftar Ulang error:', err);
    } finally {
      setLoading(false);
    }
  }, [tahunId, tipe, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summaryItems = data?.summary_per_item ?? [];
  const perSantri = data?.per_santri ?? [];
  const filteredSantri = perSantri.filter((s: any) =>
    s.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="k-page laporan-du-page">
      <div className="k-page__header">
        <div>
          <h1>
            <ClipboardList size={22} style={{ marginRight: 8, color: '#3B6FE8', verticalAlign: 'middle' }} />
            Laporan Daftar Ulang
          </h1>
          <p>Status pembayaran administrasi Daftar Ulang santri baru & lama</p>
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

      {/* Tabs */}
      <div className="k-tabs" style={{ marginBottom: 20 }}>
        {([['baru', 'Santri Baru'], ['lama', 'Santri Lama']] as const).map(([id, label]) => (
          <button key={id} className={`k-tab ${tipe === id ? 'k-tab--active' : ''}`}
            onClick={() => setTipe(id)}>{label}</button>
        ))}
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
              <h4>Total Target</h4>
              <div className="laporan-summary-card__big">{rp(Number(data.grand_target))}</div>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Estimasi dari seluruh santri terdaftar
              </p>
            </div>
            <div className="laporan-summary-card laporan-summary-card--total">
              <h4>Total Terkumpul</h4>
              <div className="laporan-summary-card__big" style={{ color: '#10A05B' }}>{rp(Number(data.grand_terkumpul))}</div>
              <div className="k-progress__bar-wrap" style={{ marginTop: 8 }}>
                <div className={`k-progress__bar ${getPctClass(Number(data.realisasi_pct))}`}
                  style={{ width: `${data.realisasi_pct}%` }} />
              </div>
              <div className="laporan-summary-card__pct">{data.realisasi_pct}% Realisasi</div>
            </div>
            <div className="laporan-summary-card laporan-summary-card--madin">
              <h4>Total Piutang/Sisa</h4>
              <div className="laporan-summary-card__big" style={{ color: '#DC3545' }}>{rp(Number(data.grand_tunggakan))}</div>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Sisa administrasi yang belum dilunasi
              </p>
            </div>
          </div>

          {/* Itemized breakdown cards */}
          <h3 style={{ marginTop: 24, marginBottom: 12, fontWeight: 600 }}>Rincian per Administrasi</h3>
          <div className="du-breakdown-grid">
            {summaryItems.map((item: any) => {
              const pct = pctBar(item.terkumpul, item.target);
              return (
                <div key={item.kode} className="du-item-card">
                  <div className="du-item-card__header">
                    <h5>{item.nama}</h5>
                    <span className="muted" style={{ fontSize: 11 }}>{item.kode}</span>
                  </div>
                  <div className="du-item-card__body">
                    <div className="du-item-val-row">
                      <span className="label">Realisasi</span>
                      <span className="val" style={{ color: '#10A05B', fontWeight: 600 }}>{rp(item.terkumpul)}</span>
                    </div>
                    <div className="du-item-val-row">
                      <span className="label">Target</span>
                      <span className="val">{rp(item.target)}</span>
                    </div>
                    <div className="du-item-val-row">
                      <span className="label">Sisa</span>
                      <span className="val" style={{ color: '#DC3545' }}>{rp(item.target - item.terkumpul)}</span>
                    </div>
                    <div className="k-progress__bar-wrap" style={{ marginTop: 10 }}>
                      <div className={`k-progress__bar ${getPctClass(pct)}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="du-item-card__footer">
                      <span>{pct}% terkumpul</span>
                      <span className="muted">
                        {item.jumlah_lunas} Lunas · {item.jumlah_sebagian} Sebagian
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Student Matrix */}
          <div className="du-students-section" style={{ marginTop: 32 }}>
            <div className="du-section-header">
              <h3 style={{ fontWeight: 600 }}>Detail Pembayaran Santri</h3>
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
                    {summaryItems.map((item: any) => (
                      <th key={item.kode} className="center">{item.nama}</th>
                    ))}
                    <th className="right">Total Tagihan</th>
                    <th className="right">Total Dibayar</th>
                    <th className="right">Sisa Tagihan</th>
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
                      {summaryItems.map((item: any) => {
                        const detail = s.status_per_item[item.kode];
                        return (
                          <td key={item.kode} className="center">
                            {detail ? (
                              <div className="du-cell-status">
                                <StatusBadge status={detail.status} />
                                <span className="cell-num">{rp(detail.dibayar)}</span>
                              </div>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="right">{rp(s.total_tagihan)}</td>
                      <td className="right" style={{ color: '#10A05B', fontWeight: 600 }}>{rp(s.total_dibayar)}</td>
                      <td className="right" style={{ color: s.total_sisa > 0 ? '#DC3545' : '#10A05B', fontWeight: 700 }}>
                        {rp(s.total_sisa)}
                      </td>
                    </tr>
                  ))}
                  {filteredSantri.length === 0 && (
                    <tr>
                      <td colSpan={summaryItems.length + 5} className="center muted" style={{ padding: 24 }}>
                        Tidak ada data santri yang cocok dengan pencarian
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

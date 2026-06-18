import { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Download } from 'lucide-react';
import './LaporanSPP.scss';

type SubTab = 'bulanan' | 'semester' | 'tahunan';
type StatusTagihan = 'belum_lunas' | 'sebagian' | 'lunas' | 'dibebaskan';

const NAMA_BULAN: Record<number, string> = {
  1:'Januari',2:'Februari',3:'Maret',4:'April',5:'Mei',6:'Juni',
  7:'Juli',8:'Agustus',9:'September',10:'Oktober',11:'November',12:'Desember'
};

function rp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function pctBar(terkumpul: number, target: number): string {
  if (!target) return '0';
  return String(Math.min(100, Math.round((terkumpul / target) * 100)));
}

function getPctClass(pct: number): string {
  if (pct >= 100) return 'pct-done';
  if (pct >= 80) return 'pct-good';
  if (pct >= 50) return 'pct-warning';
  return 'pct-danger';
}

interface TahunAjaran { id: number; kode: string; is_active: boolean; tahun_mulai: number; }

// ─── Komponen Realisasi Progress ─────────────────────────────────────────
function RealisasiBar({ terkumpul, target }: { terkumpul: number; target: number }) {
  const pct = Number(pctBar(terkumpul, target));
  return (
    <div className="k-realisasi">
      <div className="k-realisasi__numbers">
        <span style={{ color: '#10A05B', fontWeight: 700 }}>{rp(terkumpul)}</span>
        <span style={{ color: '#94A3B8' }}> / {rp(target)}</span>
      </div>
      <div className="k-progress__bar-wrap">
        <div
          className={`k-progress__bar ${getPctClass(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="k-realisasi__pct">{pct}%</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// LAPORAN BULANAN
// ────────────────────────────────────────────────────────────────────────────
function LaporanBulanan({ tahunId, token }: { tahunId: number; token: string }) {
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/keuangan/laporan/spp/bulanan?tahun_ajaran_id=${tahunId}&bulan=${bulan}&tahun=${tahun}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [tahunId, bulan, tahun, token]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const summary = data?.summary as Record<string, unknown> | undefined;
  const perSantri = (data?.per_santri as unknown[]) ?? [];

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="laporan-content">
      {/* Filter bar */}
      <div className="laporan-filter">
        <select className="k-select" value={bulan} onChange={e => setBulan(Number(e.target.value))}>
          {Object.entries(NAMA_BULAN).map(([n, nama]) => (
            <option key={n} value={n}>{nama}</option>
          ))}
        </select>
        <select className="k-select" value={tahun} onChange={e => setTahun(Number(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="k-btn-primary" onClick={fetch_}>Tampilkan</button>
      </div>

      {loading ? (
        <div className="laporan-skeleton">
          {[1,2,3].map(i => <div key={i} className="k-skeleton" style={{ height: 72, marginBottom: 8 }} />)}
        </div>
      ) : summary ? (
        <>
          {/* Summary Cards */}
          <div className="laporan-summary-grid">
            <div className="laporan-summary-card laporan-summary-card--makan">
              <h4>SPP Makan</h4>
              <div className="laporan-summary-card__big">{rp(Number(summary.terkumpul_makan))}</div>
              <div className="laporan-summary-card__target">Target: {rp(Number(summary.target_makan))}</div>
              <div className="laporan-summary-card__sisa" style={{ color: '#DC3545' }}>
                Sisa: {rp(Number(summary.target_makan) - Number(summary.terkumpul_makan))}
              </div>
              <div className="k-progress__bar-wrap" style={{ marginTop: 8 }}>
                <div className={`k-progress__bar ${getPctClass(Number(summary.realisasi_makan_pct))}`}
                  style={{ width: `${summary.realisasi_makan_pct}%` }} />
              </div>
              <div className="laporan-summary-card__pct">{String(summary.realisasi_makan_pct)}% · {Number(summary.santri_lunas_makan)} lunas · {Number(summary.santri_bebas_makan)} dibebaskan</div>
            </div>

            <div className="laporan-summary-card laporan-summary-card--madin">
              <h4>SPP Madin</h4>
              <div className="laporan-summary-card__big">{rp(Number(summary.terkumpul_madin))}</div>
              <div className="laporan-summary-card__target">Target: {rp(Number(summary.target_madin))}</div>
              <div className="laporan-summary-card__sisa" style={{ color: '#DC3545' }}>
                Sisa: {rp(Number(summary.target_madin) - Number(summary.terkumpul_madin))}
              </div>
              <div className="k-progress__bar-wrap" style={{ marginTop: 8 }}>
                <div className={`k-progress__bar ${getPctClass(Number(summary.realisasi_madin_pct))}`}
                  style={{ width: `${summary.realisasi_madin_pct}%` }} />
              </div>
              <div className="laporan-summary-card__pct">{String(summary.realisasi_madin_pct)}% · {Number(summary.santri_lunas_madin)} lunas · {Number(summary.santri_bebas_madin)} dibebaskan</div>
            </div>

            <div className="laporan-summary-card laporan-summary-card--total">
              <h4>Total SPP</h4>
              <div className="laporan-summary-card__big">{rp(Number(summary.total_terkumpul))}</div>
              <div className="laporan-summary-card__target">Target: {rp(Number(summary.total_target))}</div>
              <div className="laporan-summary-card__sisa" style={{ color: '#DC3545' }}>
                Tunggakan: {rp(Number(summary.total_tunggakan))}
              </div>
              <div className="k-progress__bar-wrap" style={{ marginTop: 8 }}>
                <div className={`k-progress__bar ${getPctClass(Number(summary.realisasi_pct))}`}
                  style={{ width: `${summary.realisasi_pct}%` }} />
              </div>
              <div className="laporan-summary-card__pct">{String(summary.realisasi_pct)}% realisasi · {Number(summary.total_santri)} santri</div>
            </div>
          </div>

          {/* Tabel detail per santri */}
          <div className="k-table-wrap" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Santri</th>
                  <th className="right">SPP Makan</th>
                  <th className="center">Status Makan</th>
                  <th className="right">SPP Madin</th>
                  <th className="center">Status Madin</th>
                  <th className="right">Total Dibayar</th>
                  <th className="right">Total Sisa</th>
                </tr>
              </thead>
              <tbody>
                {(perSantri as Record<string, unknown>[]).map((s, i) => {
                  const makanDibayar = Number(s.nominal_dibayar_makan);
                  const madinDibayar = Number(s.nominal_dibayar_madin);
                  const makanTagihan = Number(s.nominal_tagihan_makan);
                  const madinTagihan = Number(s.nominal_tagihan_madin);
                  const totalDibayar = makanDibayar + madinDibayar;
                  const totalSisa = (makanTagihan - makanDibayar) + (madinTagihan - madinDibayar);

                  return (
                    <tr key={String(s.santri_id)}>
                      <td className="muted">{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{String(s.nama)}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{String(s.nis)}</div>
                      </td>
                      <td className="right">{rp(makanDibayar)} <span style={{ color: '#94A3B8', fontSize: 11 }}>/ {rp(makanTagihan)}</span></td>
                      <td className="center"><StatusBadgeSimple status={s.status_makan as StatusTagihan} /></td>
                      <td className="right">{rp(madinDibayar)} <span style={{ color: '#94A3B8', fontSize: 11 }}>/ {rp(madinTagihan)}</span></td>
                      <td className="center"><StatusBadgeSimple status={s.status_madin as StatusTagihan} /></td>
                      <td className="right" style={{ color: '#10A05B', fontWeight: 700 }}>{rp(totalDibayar)}</td>
                      <td className="right" style={{ color: totalSisa > 0 ? '#DC3545' : '#10A05B', fontWeight: 700 }}>{rp(Math.max(0, totalSisa))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}><strong>TOTAL ({perSantri.length} santri)</strong></td>
                  <td className="right"><strong>{rp(Number(summary.terkumpul_makan))}</strong></td>
                  <td />
                  <td className="right"><strong>{rp(Number(summary.terkumpul_madin))}</strong></td>
                  <td />
                  <td className="right" style={{ color: '#10A05B' }}><strong>{rp(Number(summary.total_terkumpul))}</strong></td>
                  <td className="right" style={{ color: '#DC3545' }}><strong>{rp(Number(summary.total_tunggakan))}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Simpel status badge ─────────────────────────────────────────────────
function StatusBadgeSimple({ status }: { status: StatusTagihan }) {
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

// ────────────────────────────────────────────────────────────────────────────
// LAPORAN SEMESTER
// ────────────────────────────────────────────────────────────────────────────
function LaporanSemester({ tahunId, token }: { tahunId: number; token: string }) {
  const [semester, setSemester] = useState<'ganjil' | 'genap'>('ganjil');
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/keuangan/laporan/spp/semester?tahun_ajaran_id=${tahunId}&semester=${semester}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [tahunId, semester, token]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const grand = data?.grand_total as Record<string, unknown> | undefined;
  const bulanList = (data?.bulan_list as number[]) ?? [];
  const perSantri = (data?.per_santri as Record<string, unknown>[]) ?? [];

  return (
    <div className="laporan-content">
      <div className="laporan-filter">
        <div className="k-pill-group">
          {(['ganjil', 'genap'] as const).map(s => (
            <button
              key={s}
              className={`k-pill ${semester === s ? 'k-pill--active' : ''}`}
              onClick={() => setSemester(s)}
            >
              Semester {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <button className="k-btn-primary" onClick={fetch_}>Tampilkan</button>
      </div>

      {loading ? (
        <div className="laporan-skeleton">
          {[1,2,3].map(i => <div key={i} className="k-skeleton" style={{ height: 60, marginBottom: 8 }} />)}
        </div>
      ) : grand ? (
        <>
          <div className="laporan-summary-grid">
            <div className="laporan-summary-card laporan-summary-card--makan">
              <h4>SPP Makan (6 Bulan)</h4>
              <div className="laporan-summary-card__big">{rp(Number(grand.terkumpul_makan))}</div>
              <div className="laporan-summary-card__target">Target: {rp(Number(grand.target_makan))}</div>
              <div className="laporan-summary-card__sisa" style={{ color: '#DC3545' }}>Sisa: {rp(Number(grand.target_makan) - Number(grand.terkumpul_makan))}</div>
            </div>
            <div className="laporan-summary-card laporan-summary-card--madin">
              <h4>SPP Madin (6 Bulan)</h4>
              <div className="laporan-summary-card__big">{rp(Number(grand.terkumpul_madin))}</div>
              <div className="laporan-summary-card__target">Target: {rp(Number(grand.target_madin))}</div>
              <div className="laporan-summary-card__sisa" style={{ color: '#DC3545' }}>Sisa: {rp(Number(grand.target_madin) - Number(grand.terkumpul_madin))}</div>
            </div>
            <div className="laporan-summary-card laporan-summary-card--total">
              <h4>Total Semester {semester === 'ganjil' ? 'Ganjil' : 'Genap'}</h4>
              <div className="laporan-summary-card__big">{rp(Number(grand.total_terkumpul))}</div>
              <div className="laporan-summary-card__target">Target: {rp(Number(grand.total_target))}</div>
              <div className="laporan-summary-card__sisa" style={{ color: '#DC3545' }}>Tunggakan: {rp(Number(grand.total_tunggakan))}</div>
              <div className="k-progress__bar-wrap" style={{ marginTop: 8 }}>
                <div className={`k-progress__bar ${getPctClass(Number(grand.realisasi_pct))}`}
                  style={{ width: `${grand.realisasi_pct}%` }} />
              </div>
              <div className="laporan-summary-card__pct">{String(grand.realisasi_pct)}% realisasi</div>
            </div>
          </div>

          {/* Tabel per santri x per bulan */}
          <div className="k-table-wrap" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Santri</th>
                  {bulanList.map(b => (
                    <th key={b} className="center" colSpan={2}>{NAMA_BULAN[b]?.substring(0,3)}</th>
                  ))}
                  <th className="right">Total Dibayar</th>
                  <th className="right">Tunggakan</th>
                </tr>
                <tr className="thead-sub">
                  <th /><th />
                  {bulanList.map(b => (
                    <>
                      <th key={`m-${b}`} className="center" style={{ fontSize: 10 }}>Makan</th>
                      <th key={`d-${b}`} className="center" style={{ fontSize: 10 }}>Madin</th>
                    </>
                  ))}
                  <th /><th />
                </tr>
              </thead>
              <tbody>
                {perSantri.map((s, i) => {
                  const makanPB = s.makan_per_bulan as Record<number, Record<string, unknown>>;
                  const madinPB = s.madin_per_bulan as Record<number, Record<string, unknown>>;
                  return (
                    <tr key={String(s.santri_id)}>
                      <td className="muted">{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{String(s.nama)}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{String(s.nis)}</div>
                      </td>
                      {bulanList.map(b => (
                        <>
                          <td key={`m-${b}`} className="center">
                            <StatusBadgeSimple status={(makanPB?.[b]?.status as StatusTagihan) ?? 'belum_lunas'} />
                          </td>
                          <td key={`d-${b}`} className="center">
                            <StatusBadgeSimple status={(madinPB?.[b]?.status as StatusTagihan) ?? 'belum_lunas'} />
                          </td>
                        </>
                      ))}
                      <td className="right" style={{ color: '#10A05B', fontWeight: 700 }}>
                        {rp(Number(s.total_dibayar_makan) + Number(s.total_dibayar_madin))}
                      </td>
                      <td className="right" style={{ color: Number(s.total_tunggakan) > 0 ? '#DC3545' : '#10A05B', fontWeight: 700 }}>
                        {rp(Number(s.total_tunggakan))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// LAPORAN TAHUNAN
// ────────────────────────────────────────────────────────────────────────────
function LaporanTahunan({ tahunId, token }: { tahunId: number; token: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/keuangan/laporan/spp/tahunan?tahun_ajaran_id=${tahunId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [tahunId, token]);

  const summary = data?.summary as Record<string, unknown> | undefined;
  const perSantri = (data?.per_santri as Record<string, unknown>[]) ?? [];

  return (
    <div className="laporan-content">
      {loading ? (
        <div className="laporan-skeleton">
          {[1,2,3].map(i => <div key={i} className="k-skeleton" style={{ height: 72, marginBottom: 8 }} />)}
        </div>
      ) : summary ? (
        <>
          <div className="laporan-summary-grid">
            <div className="laporan-summary-card laporan-summary-card--makan">
              <h4>SPP Makan (Setahun)</h4>
              <div className="laporan-summary-card__big">{rp(Number(summary.grand_terkumpul_makan))}</div>
              <div className="laporan-summary-card__target">Target: {rp(Number(summary.grand_target_makan))}</div>
            </div>
            <div className="laporan-summary-card laporan-summary-card--madin">
              <h4>SPP Madin (Setahun)</h4>
              <div className="laporan-summary-card__big">{rp(Number(summary.grand_terkumpul_madin))}</div>
              <div className="laporan-summary-card__target">Target: {rp(Number(summary.grand_target_madin))}</div>
            </div>
            <div className="laporan-summary-card laporan-summary-card--total">
              <h4>Total Setahun</h4>
              <div className="laporan-summary-card__big">{rp(Number(summary.grand_terkumpul))}</div>
              <div className="laporan-summary-card__target">Target: {rp(Number(summary.grand_target))}</div>
              <div className="laporan-summary-card__sisa" style={{ color: '#DC3545' }}>Tunggakan: {rp(Number(summary.grand_tunggakan))}</div>
              <div className="k-progress__bar-wrap" style={{ marginTop: 8 }}>
                <div className={`k-progress__bar ${getPctClass(Number(summary.realisasi_pct))}`}
                  style={{ width: `${summary.realisasi_pct}%` }} />
              </div>
              <div className="laporan-summary-card__pct">{String(summary.realisasi_pct)}% · {Number(summary.santri_lunas_penuh)} lunas penuh · {Number(summary.santri_menunggak)} menunggak</div>
            </div>
          </div>

          <div className="k-table-wrap" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Santri</th>
                  <th className="right">Target Makan</th>
                  <th className="right">Bayar Makan</th>
                  <th className="right">Target Madin</th>
                  <th className="right">Bayar Madin</th>
                  <th className="right">Total Dibayar</th>
                  <th className="right">Tunggakan</th>
                  <th className="center">Status</th>
                </tr>
              </thead>
              <tbody>
                {perSantri.map((s, i) => (
                  <tr key={String(s.santri_id)}>
                    <td className="muted">{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{String(s.nama)}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{String(s.nis)}</div>
                    </td>
                    <td className="right">{rp(Number(s.target_makan))}</td>
                    <td className="right" style={{ color: '#10A05B' }}>{rp(Number(s.dibayar_makan))}</td>
                    <td className="right">{rp(Number(s.target_madin))}</td>
                    <td className="right" style={{ color: '#10A05B' }}>{rp(Number(s.dibayar_madin))}</td>
                    <td className="right" style={{ color: '#10A05B', fontWeight: 700 }}>{rp(Number(s.total_dibayar))}</td>
                    <td className="right" style={{ color: Number(s.total_tunggakan) > 0 ? '#DC3545' : '#10A05B', fontWeight: 700 }}>{rp(Number(s.total_tunggakan))}</td>
                    <td className="center">
                      <span className={`k-badge ${s.status_keseluruhan === 'lunas_penuh' ? 'k-badge--lunas' : 'k-badge--belum_lunas'}`}>
                        {s.status_keseluruhan === 'lunas_penuh' ? 'Lunas Penuh' : 'Menunggak'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}><strong>TOTAL</strong></td>
                  <td className="right"><strong>{rp(Number(summary.grand_target_makan))}</strong></td>
                  <td className="right" style={{ color: '#10A05B' }}><strong>{rp(Number(summary.grand_terkumpul_makan))}</strong></td>
                  <td className="right"><strong>{rp(Number(summary.grand_target_madin))}</strong></td>
                  <td className="right" style={{ color: '#10A05B' }}><strong>{rp(Number(summary.grand_terkumpul_madin))}</strong></td>
                  <td className="right" style={{ color: '#10A05B' }}><strong>{rp(Number(summary.grand_terkumpul))}</strong></td>
                  <td className="right" style={{ color: '#DC3545' }}><strong>{rp(Number(summary.grand_tunggakan))}</strong></td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function LaporanSPP() {
  const [subTab, setSubTab] = useState<SubTab>('bulanan');
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [tahunId, setTahunId] = useState<number | null>(null);
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

  return (
    <div className="k-page laporan-spp-page">
      <div className="k-page__header">
        <div>
          <h1><BarChart3 size={21} style={{ marginRight: 8, color: '#3B6FE8', verticalAlign: 'middle' }} />
            Laporan SPP
          </h1>
          <p>Rekapitulasi SPP Makan & Madin — target, terkumpul, sisa, dan realisasi</p>
        </div>
        <div className="k-page__header-actions">
          <select className="k-select" value={tahunId ?? ''} onChange={e => setTahunId(Number(e.target.value))}>
            {tahunList.map(t => <option key={t.id} value={t.id}>{t.kode}{t.is_active ? ' (Aktif)' : ''}</option>)}
          </select>
          <button className="k-btn-icon" title="Export Excel (coming soon)"><Download size={15} /></button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="k-tabs" style={{ marginBottom: 20 }}>
        {([['bulanan', 'Per Bulan'], ['semester', 'Per Semester'], ['tahunan', 'Per Tahun']] as const).map(([id, label]) => (
          <button key={id} className={`k-tab ${subTab === id ? 'k-tab--active' : ''}`}
            onClick={() => setSubTab(id)}>{label}</button>
        ))}
      </div>

      {tahunId && (
        <>
          {subTab === 'bulanan'   && <LaporanBulanan tahunId={tahunId} token={token} />}
          {subTab === 'semester'  && <LaporanSemester tahunId={tahunId} token={token} />}
          {subTab === 'tahunan'   && <LaporanTahunan tahunId={tahunId} token={token} />}
        </>
      )}
    </div>
  );
}

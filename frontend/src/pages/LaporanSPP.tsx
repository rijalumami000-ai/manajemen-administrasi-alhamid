import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, RefreshCw, Download,
  Layers, CheckCircle2, Clock, XCircle, Minus,
  Calendar, Users, Banknote, AlertCircle
} from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import {
  SubTabLaporanSPP,
  StatusTagihan,
  TahunAjaran,
  KelasItem,
  LaporanSPPBulananResponse,
  LaporanSPPSemesterResponse,
  LaporanSPPTahunanResponse
} from '../types/keuangan';
import './LaporanSPP.scss';

const NAMA_BULAN: Record<number, string> = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April', 5: 'Mei', 6: 'Juni',
  7: 'Juli', 8: 'Agustus', 9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
};

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

// ─── Status Badge ──────────────────────────────────────────────────────────
function StatusBadgeSimple({ status }: { status: StatusTagihan }) {
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
// 1. LAPORAN BULANAN
// ════════════════════════════════════════════════════════════════════════════
function LaporanBulanan({ tahunId, token }: { tahunId: number; token: string }) {
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [data, setData] = useState<LaporanSPPBulananResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/kelas', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setKelasList(d.filter((k: KelasItem) => k.jenis === 'Diniyah'));
        }
      })
      .catch(() => {});
  }, [token]);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const kelasQuery = selectedKelasId ? `&kelas_id=${selectedKelasId}` : '';
      const res = await fetch(
        `/api/keuangan/laporan/spp/bulanan?tahun_ajaran_id=${tahunId}&bulan=${bulan}&tahun=${tahun}${kelasQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        setData(await res.json());
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [tahunId, bulan, tahun, selectedKelasId, token]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const summary = data?.summary;
  const perSantri = data?.per_santri ?? [];

  const bulanOptions = Object.entries(NAMA_BULAN).map(([n, nama]) => ({
    value: Number(n),
    label: nama,
  }));

  const tahunOptions = [2024, 2025, 2026, 2027].map(y => ({
    value: y,
    label: String(y),
  }));

  const kelasOptions = [
    { value: '', label: 'Semua Kelas' },
    ...kelasList.map(k => ({ value: String(k.id), label: `Kelas ${k.nama}` })),
  ];

  return (
    <div className="laporan-content-flow">
      {/* 🔍 Inset Frosted Filter Bar */}
      <div className="laporan-filter-dock">
        <div style={{ width: 140 }}>
          <CustomSelect
            value={bulan}
            onChange={val => setBulan(Number(val))}
            options={bulanOptions}
            placeholder="Pilih Bulan"
            size="md"
          />
        </div>

        <div style={{ width: 110 }}>
          <CustomSelect
            value={tahun}
            onChange={val => setTahun(Number(val))}
            options={tahunOptions}
            placeholder="Tahun"
            size="md"
          />
        </div>

        <div style={{ width: 180 }}>
          <CustomSelect
            value={selectedKelasId}
            onChange={val => setSelectedKelasId(String(val))}
            options={kelasOptions}
            placeholder="Pilih Kelas"
            size="md"
          />
        </div>

        <button
          type="button"
          className="action-pill-btn primary-pill"
          onClick={fetch_}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spinning-icon' : ''} />
          <span>Tampilkan</span>
        </button>
      </div>

      {loading ? (
        <div className="laporan-skeleton-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="laporan-skeleton-card" />
          ))}
        </div>
      ) : summary ? (
        <>
          {/* 📊 3 VisionOS Liquid Glass KPI Summary Cards */}
          <div className="laporan-kpi-grid">
            {/* SPP Makan */}
            <div className="laporan-glass-kpi card-emerald">
              <div className="kpi-top-row">
                <span className="kpi-label">SPP Makan</span>
                <div className="kpi-icon-orb orb-emerald">
                  <Banknote size={18} />
                </div>
              </div>
              <div className="kpi-main-val">{rp(Number(summary.terkumpul_makan))}</div>
              <div className="kpi-target-row">
                <span>Target: <strong>{rp(Number(summary.target_makan))}</strong></span>
                <span className="text-rose">Sisa: {rp(Number(summary.target_makan) - Number(summary.terkumpul_makan))}</span>
              </div>
              <div className="kpi-progress-track">
                <div
                  className="kpi-progress-fill fill-emerald"
                  style={{ width: `${summary.realisasi_makan_pct}%` }}
                />
              </div>
              <div className="kpi-meta-footer">
                <span>{summary.realisasi_makan_pct}% Realisasi</span>
                <span className="meta-sub">
                  {summary.santri_lunas_makan} lunas · {summary.santri_bebas_makan} dibebaskan
                </span>
              </div>
            </div>

            {/* SPP Madin */}
            <div className="laporan-glass-kpi card-sapphire">
              <div className="kpi-top-row">
                <span className="kpi-label">SPP Madin</span>
                <div className="kpi-icon-orb orb-sapphire">
                  <Users size={18} />
                </div>
              </div>
              <div className="kpi-main-val text-sapphire">{rp(Number(summary.terkumpul_madin))}</div>
              <div className="kpi-target-row">
                <span>Target: <strong>{rp(Number(summary.target_madin))}</strong></span>
                <span className="text-rose">Sisa: {rp(Number(summary.target_madin) - Number(summary.terkumpul_madin))}</span>
              </div>
              <div className="kpi-progress-track">
                <div
                  className="kpi-progress-fill fill-sapphire"
                  style={{ width: `${summary.realisasi_madin_pct}%` }}
                />
              </div>
              <div className="kpi-meta-footer">
                <span>{summary.realisasi_madin_pct}% Realisasi</span>
                <span className="meta-sub">
                  {summary.santri_lunas_madin} lunas · {summary.santri_bebas_madin} dibebaskan
                </span>
              </div>
            </div>

            {/* Total SPP */}
            <div className="laporan-glass-kpi card-amber">
              <div className="kpi-top-row">
                <span className="kpi-label">Total SPP Periode</span>
                <div className="kpi-icon-orb orb-amber">
                  <Calendar size={18} />
                </div>
              </div>
              <div className="kpi-main-val text-amber">{rp(Number(summary.total_terkumpul))}</div>
              <div className="kpi-target-row">
                <span>Target: <strong>{rp(Number(summary.total_target))}</strong></span>
                <span className="text-rose">Tunggakan: {rp(Number(summary.total_tunggakan))}</span>
              </div>
              <div className="kpi-progress-track">
                <div
                  className="kpi-progress-fill fill-amber"
                  style={{ width: `${summary.realisasi_pct}%` }}
                />
              </div>
              <div className="kpi-meta-footer">
                <span>{summary.realisasi_pct}% Realisasi</span>
                <span className="meta-sub">{summary.total_santri} total santri</span>
              </div>
            </div>
          </div>

          {/* 💎 VisionOS Liquid Glass Table Container */}
          <div className="laporan-table-card">
            <div className="table-responsive-wrapper">
              <table className="laporan-glass-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Santri</th>
                    <th className="cell-right">SPP Makan</th>
                    <th className="cell-center">Status Makan</th>
                    <th className="cell-right">SPP Madin</th>
                    <th className="cell-center">Status Madin</th>
                    <th className="cell-right">Total Dibayar</th>
                    <th className="cell-right">Total Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  {perSantri.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="table-empty-cell">
                        Tidak ada data pembayaran SPP untuk filter terpilih.
                      </td>
                    </tr>
                  ) : (
                    perSantri.map((s, i) => {
                      const makanDibayar = Number(s.nominal_dibayar_makan);
                      const madinDibayar = Number(s.nominal_dibayar_madin);
                      const makanTagihan = Number(s.nominal_tagihan_makan);
                      const madinTagihan = Number(s.nominal_tagihan_madin);
                      const totalDibayar = makanDibayar + madinDibayar;
                      const totalSisa = (makanTagihan - makanDibayar) + (madinTagihan - madinDibayar);
                      const initial = s.nama ? s.nama.charAt(0).toUpperCase() : '?';

                      return (
                        <tr key={String(s.santri_id)}>
                          <td className="cell-muted">{i + 1}</td>
                          <td>
                            <div className="santri-cell-group">
                              <div className="santri-avatar-orb">{initial}</div>
                              <div className="santri-name-column">
                                <span className="santri-name">{s.nama}</span>
                                <span className="santri-nis-pill">NIS: {s.nis}</span>
                              </div>
                            </div>
                          </td>
                          <td className="cell-right font-numeric">
                            <span className="text-emerald">{rp(makanDibayar)}</span>
                            <span className="meta-target"> / {rp(makanTagihan)}</span>
                          </td>
                          <td className="cell-center">
                            <StatusBadgeSimple status={s.status_makan} />
                          </td>
                          <td className="cell-right font-numeric">
                            <span className="text-sapphire">{rp(madinDibayar)}</span>
                            <span className="meta-target"> / {rp(madinTagihan)}</span>
                          </td>
                          <td className="cell-center">
                            <StatusBadgeSimple status={s.status_madin} />
                          </td>
                          <td className="cell-right font-numeric text-emerald font-bold">
                            {rp(totalDibayar)}
                          </td>
                          <td className={`cell-right font-numeric font-bold ${totalSisa > 0 ? 'text-rose' : 'text-emerald'}`}>
                            {rp(Math.max(0, totalSisa))}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="footer-title">TOTAL ({perSantri.length} santri)</td>
                    <td className="cell-right font-numeric text-emerald"><strong>{rp(Number(summary.terkumpul_makan))}</strong></td>
                    <td />
                    <td className="cell-right font-numeric text-sapphire"><strong>{rp(Number(summary.terkumpul_madin))}</strong></td>
                    <td />
                    <td className="cell-right font-numeric text-emerald"><strong>{rp(Number(summary.total_terkumpul))}</strong></td>
                    <td className="cell-right font-numeric text-rose"><strong>{rp(Number(summary.total_tunggakan))}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. LAPORAN SEMESTER
// ════════════════════════════════════════════════════════════════════════════
function LaporanSemester({ tahunId, token }: { tahunId: number; token: string }) {
  const [semester, setSemester] = useState<'ganjil' | 'genap'>('ganjil');
  const [data, setData] = useState<LaporanSPPSemesterResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/keuangan/laporan/spp/semester?tahun_ajaran_id=${tahunId}&semester=${semester}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        setData(await res.json());
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [tahunId, semester, token]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const grand = data?.grand_total;
  const bulanList = data?.bulan_list ?? [];
  const perSantri = data?.per_santri ?? [];

  return (
    <div className="laporan-content-flow">
      {/* Semester Segmented Pills */}
      <div className="laporan-filter-dock">
        <div className="tactile-segmented-control" role="tablist">
          {(['ganjil', 'genap'] as const).map(s => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={semester === s}
              className={`segment-btn ${semester === s ? 'active' : ''}`}
              onClick={() => setSemester(s)}
            >
              <Calendar size={14} />
              <span>Semester {s.charAt(0).toUpperCase() + s.slice(1)}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="action-pill-btn primary-pill"
          onClick={fetch_}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spinning-icon' : ''} />
          <span>Segarkan</span>
        </button>
      </div>

      {loading ? (
        <div className="laporan-skeleton-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="laporan-skeleton-card" />
          ))}
        </div>
      ) : grand ? (
        <>
          {/* Summary Cards */}
          <div className="laporan-kpi-grid">
            <div className="laporan-glass-kpi card-emerald">
              <div className="kpi-top-row">
                <span className="kpi-label">SPP Makan (6 Bulan)</span>
                <div className="kpi-icon-orb orb-emerald"><Banknote size={18} /></div>
              </div>
              <div className="kpi-main-val">{rp(Number(grand.terkumpul_makan))}</div>
              <div className="kpi-target-row">
                <span>Target: <strong>{rp(Number(grand.target_makan))}</strong></span>
                <span className="text-rose">Sisa: {rp(Number(grand.target_makan) - Number(grand.terkumpul_makan))}</span>
              </div>
            </div>

            <div className="laporan-glass-kpi card-sapphire">
              <div className="kpi-top-row">
                <span className="kpi-label">SPP Madin (6 Bulan)</span>
                <div className="kpi-icon-orb orb-sapphire"><Users size={18} /></div>
              </div>
              <div className="kpi-main-val text-sapphire">{rp(Number(grand.terkumpul_madin))}</div>
              <div className="kpi-target-row">
                <span>Target: <strong>{rp(Number(grand.target_madin))}</strong></span>
                <span className="text-rose">Sisa: {rp(Number(grand.target_madin) - Number(grand.terkumpul_madin))}</span>
              </div>
            </div>

            <div className="laporan-glass-kpi card-amber">
              <div className="kpi-top-row">
                <span className="kpi-label">Total Semester {semester === 'ganjil' ? 'Ganjil' : 'Genap'}</span>
                <div className="kpi-icon-orb orb-amber"><Calendar size={18} /></div>
              </div>
              <div className="kpi-main-val text-amber">{rp(Number(grand.total_terkumpul))}</div>
              <div className="kpi-target-row">
                <span>Target: <strong>{rp(Number(grand.total_target))}</strong></span>
                <span className="text-rose">Tunggakan: {rp(Number(grand.total_tunggakan))}</span>
              </div>
              <div className="kpi-progress-track">
                <div
                  className="kpi-progress-fill fill-amber"
                  style={{ width: `${grand.realisasi_pct}%` }}
                />
              </div>
              <div className="kpi-meta-footer">
                <span>{grand.realisasi_pct}% Realisasi</span>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="laporan-table-card">
            <div className="table-responsive-wrapper">
              <table className="laporan-glass-table table-matrix">
                <thead>
                  <tr>
                    <th style={{ width: 45 }}>#</th>
                    <th>Santri</th>
                    {bulanList.map(b => (
                      <th key={b} className="cell-center" colSpan={2}>
                        {NAMA_BULAN[b]?.substring(0, 3)}
                      </th>
                    ))}
                    <th className="cell-right">Total Dibayar</th>
                    <th className="cell-right">Tunggakan</th>
                  </tr>
                  <tr className="thead-sub-row">
                    <th /><th />
                    {bulanList.map(b => (
                      <React.Fragment key={b}>
                        <th className="cell-center sub-th">Mkn</th>
                        <th className="cell-center sub-th">Mdn</th>
                      </React.Fragment>
                    ))}
                    <th /><th />
                  </tr>
                </thead>
                <tbody>
                  {perSantri.map((s, i) => {
                    const makanPB = s.makan_per_bulan;
                    const madinPB = s.madin_per_bulan;
                    const totalDibayar = Number(s.total_dibayar_makan) + Number(s.total_dibayar_madin);
                    const tunggakan = Number(s.total_tunggakan);
                    const initial = s.nama ? s.nama.charAt(0).toUpperCase() : '?';

                    return (
                      <tr key={String(s.santri_id)}>
                        <td className="cell-muted">{i + 1}</td>
                        <td>
                          <div className="santri-cell-group">
                            <div className="santri-avatar-orb">{initial}</div>
                            <div className="santri-name-column">
                              <span className="santri-name">{s.nama}</span>
                              <span className="santri-nis-pill">NIS: {s.nis}</span>
                            </div>
                          </div>
                        </td>
                        {bulanList.map(b => (
                          <React.Fragment key={b}>
                            <td className="cell-center">
                              <StatusBadgeSimple status={makanPB?.[b]?.status ?? 'belum_lunas'} />
                            </td>
                            <td className="cell-center">
                              <StatusBadgeSimple status={madinPB?.[b]?.status ?? 'belum_lunas'} />
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="cell-right font-numeric text-emerald font-bold">
                          {rp(totalDibayar)}
                        </td>
                        <td className={`cell-right font-numeric font-bold ${tunggakan > 0 ? 'text-rose' : 'text-emerald'}`}>
                          {rp(tunggakan)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 3. LAPORAN TAHUNAN
// ════════════════════════════════════════════════════════════════════════════
function LaporanTahunan({ tahunId, token }: { tahunId: number; token: string }) {
  const [data, setData] = useState<LaporanSPPTahunanResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/keuangan/laporan/spp/tahunan?tahun_ajaran_id=${tahunId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tahunId, token]);

  const summary = data?.summary;
  const perSantri = data?.per_santri ?? [];

  return (
    <div className="laporan-content-flow">
      {loading ? (
        <div className="laporan-skeleton-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="laporan-skeleton-card" />
          ))}
        </div>
      ) : summary ? (
        <>
          {/* Summary Cards */}
          <div className="laporan-kpi-grid">
            <div className="laporan-glass-kpi card-emerald">
              <div className="kpi-top-row">
                <span className="kpi-label">SPP Makan (Setahun)</span>
                <div className="kpi-icon-orb orb-emerald"><Banknote size={18} /></div>
              </div>
              <div className="kpi-main-val">{rp(Number(summary.grand_terkumpul_makan))}</div>
              <div className="kpi-target-row">
                <span>Target: <strong>{rp(Number(summary.grand_target_makan))}</strong></span>
              </div>
            </div>

            <div className="laporan-glass-kpi card-sapphire">
              <div className="kpi-top-row">
                <span className="kpi-label">SPP Madin (Setahun)</span>
                <div className="kpi-icon-orb orb-sapphire"><Users size={18} /></div>
              </div>
              <div className="kpi-main-val text-sapphire">{rp(Number(summary.grand_terkumpul_madin))}</div>
              <div className="kpi-target-row">
                <span>Target: <strong>{rp(Number(summary.grand_target_madin))}</strong></span>
              </div>
            </div>

            <div className="laporan-glass-kpi card-amber">
              <div className="kpi-top-row">
                <span className="kpi-label">Total Setahun</span>
                <div className="kpi-icon-orb orb-amber"><Calendar size={18} /></div>
              </div>
              <div className="kpi-main-val text-amber">{rp(Number(summary.grand_terkumpul))}</div>
              <div className="kpi-target-row">
                <span>Target: <strong>{rp(Number(summary.grand_target))}</strong></span>
                <span className="text-rose">Tunggakan: {rp(Number(summary.grand_tunggakan))}</span>
              </div>
              <div className="kpi-progress-track">
                <div
                  className="kpi-progress-fill fill-amber"
                  style={{ width: `${summary.realisasi_pct}%` }}
                />
              </div>
              <div className="kpi-meta-footer">
                <span>{summary.realisasi_pct}% Realisasi</span>
                <span className="meta-sub">
                  {summary.santri_lunas_penuh} lunas · {summary.santri_menunggak} menunggak
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="laporan-table-card">
            <div className="table-responsive-wrapper">
              <table className="laporan-glass-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Santri</th>
                    <th className="cell-right">Target Makan</th>
                    <th className="cell-right">Bayar Makan</th>
                    <th className="cell-right">Target Madin</th>
                    <th className="cell-right">Bayar Madin</th>
                    <th className="cell-right">Total Dibayar</th>
                    <th className="cell-right">Tunggakan</th>
                    <th className="cell-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {perSantri.map((s, i) => {
                    const initial = s.nama ? s.nama.charAt(0).toUpperCase() : '?';
                    return (
                      <tr key={String(s.santri_id)}>
                        <td className="cell-muted">{i + 1}</td>
                        <td>
                          <div className="santri-cell-group">
                            <div className="santri-avatar-orb">{initial}</div>
                            <div className="santri-name-column">
                              <span className="santri-name">{s.nama}</span>
                              <span className="santri-nis-pill">NIS: {s.nis}</span>
                            </div>
                          </div>
                        </td>
                        <td className="cell-right font-numeric">{rp(Number(s.target_makan))}</td>
                        <td className="cell-right font-numeric text-emerald">{rp(Number(s.dibayar_makan))}</td>
                        <td className="cell-right font-numeric">{rp(Number(s.target_madin))}</td>
                        <td className="cell-right font-numeric text-sapphire">{rp(Number(s.dibayar_madin))}</td>
                        <td className="cell-right font-numeric text-emerald font-bold">{rp(Number(s.total_dibayar))}</td>
                        <td className={`cell-right font-numeric font-bold ${Number(s.total_tunggakan) > 0 ? 'text-rose' : 'text-emerald'}`}>
                          {rp(Number(s.total_tunggakan))}
                        </td>
                        <td className="cell-center">
                          <span className={`tagihan-status-badge ${s.status_keseluruhan === 'lunas_penuh' ? 'badge-lunas' : 'badge-belum-lunas'}`}>
                            {s.status_keseluruhan === 'lunas_penuh' ? (
                              <><CheckCircle2 size={10} /><span>Lunas Penuh</span></>
                            ) : (
                              <><XCircle size={10} /><span>Menunggak</span></>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="footer-title">TOTAL</td>
                    <td className="cell-right font-numeric"><strong>{rp(Number(summary.grand_target_makan))}</strong></td>
                    <td className="cell-right font-numeric text-emerald"><strong>{rp(Number(summary.grand_terkumpul_makan))}</strong></td>
                    <td className="cell-right font-numeric"><strong>{rp(Number(summary.grand_target_madin))}</strong></td>
                    <td className="cell-right font-numeric text-sapphire"><strong>{rp(Number(summary.grand_terkumpul_madin))}</strong></td>
                    <td className="cell-right font-numeric text-emerald"><strong>{rp(Number(summary.grand_terkumpul))}</strong></td>
                    <td className="cell-right font-numeric text-rose"><strong>{rp(Number(summary.grand_tunggakan))}</strong></td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function LaporanSPP() {
  const [subTab, setSubTab] = useState<SubTabLaporanSPP>('bulanan');
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
      })
      .catch(() => {});
  }, [token]);

  const tahunOptions = tahunList.map(t => ({
    value: t.id,
    label: `${t.kode}${t.is_active ? ' (Aktif)' : ''}`,
  }));

  return (
    <div className="laporan-spp-container">
      {/* 🍏 1. APPLE FLOATING DOCK HEADER (Option A Standard - NO HEADER ICON) */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Laporan SPP</h2>
          <p className="page-subtitle">
            Rekapitulasi tagihan, realisasi pembayaran, dan monitoring tunggakan SPP Makan & Madin
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
        </div>
      </header>

      {/* 🍏 2. APPLE SEGMENTED CONTROL TABS */}
      <div className="tactile-segmented-control" role="tablist">
        {([
          ['bulanan', 'Per Bulan'],
          ['semester', 'Per Semester'],
          ['tahunan', 'Per Tahun'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={subTab === id}
            className={`segment-btn ${subTab === id ? 'active' : ''}`}
            onClick={() => setSubTab(id)}
          >
            <Layers size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── SubTab Contents ────────────────────────────────────────── */}
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

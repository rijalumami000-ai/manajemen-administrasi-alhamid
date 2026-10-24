import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Search, X, CheckCircle2, Clock, XCircle, Minus,
  Layers, Users, Banknote, AlertCircle
} from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import {
  TipeDaftarUlang,
  StatusTagihan,
  TahunAjaran,
  LaporanDUResponse,
  LaporanDUSummaryItem,
  LaporanDUSantriItem
} from '../types/keuangan';
import './LaporanDaftarUlang.scss';

function rp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function pctBar(terkumpul: number, target: number): number {
  if (!target) return 0;
  return Math.min(100, Math.round((terkumpul / target) * 100));
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
export default function LaporanDaftarUlang() {
  const [tipe, setTipe] = useState<TipeDaftarUlang>('baru');
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [tahunId, setTahunId] = useState<number | null>(null);
  const [data, setData] = useState<LaporanDUResponse | null>(null);
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
      })
      .catch(() => {});
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
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tahunId, tipe, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summaryItems: LaporanDUSummaryItem[] = data?.summary_per_item ?? [];
  const perSantri: LaporanDUSantriItem[] = data?.per_santri ?? [];
  const filteredSantri = perSantri.filter(s =>
    s.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tahunOptions = tahunList.map(t => ({
    value: t.id,
    label: `${t.kode}${t.is_active ? ' (Aktif)' : ''}`,
  }));

  return (
    <div className="laporan-du-container">
      {/* 🍏 1. APPLE FLOATING DOCK HEADER (Option A Standard - NO HEADER ICON) */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Laporan Daftar Ulang</h2>
          <p className="page-subtitle">
            Status pembayaran administrasi Daftar Ulang santri baru & santri lama
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

      {/* 🍏 2. APPLE SEGMENTED CONTROL TABS */}
      <div className="tactile-segmented-control" role="tablist">
        {([
          ['baru', 'Santri Baru'],
          ['lama', 'Santri Lama']
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tipe === id}
            className={`segment-btn ${tipe === id ? 'active' : ''}`}
            onClick={() => setTipe(id)}
          >
            <Users size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="laporan-skeleton-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="laporan-skeleton-card" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* 📊 3. KPI SUMMARY GRID */}
          <div className="laporan-kpi-grid">
            {/* Total Target */}
            <div className="laporan-glass-kpi card-sapphire">
              <div className="kpi-top-row">
                <span className="kpi-label">Total Target</span>
                <div className="kpi-icon-orb orb-sapphire">
                  <Banknote size={18} />
                </div>
              </div>
              <div className="kpi-main-val text-sapphire">{rp(Number(data.grand_target))}</div>
              <p className="kpi-sub-text">Estimasi dari seluruh santri terdaftar</p>
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
                <span>{data.realisasi_pct}% Realisasi</span>
                <span className="meta-sub">Penerimaan masuk</span>
              </div>
            </div>

            {/* Total Piutang/Sisa */}
            <div className="laporan-glass-kpi card-rose">
              <div className="kpi-top-row">
                <span className="kpi-label">Total Piutang / Sisa</span>
                <div className="kpi-icon-orb orb-rose">
                  <AlertCircle size={18} />
                </div>
              </div>
              <div className="kpi-main-val text-rose">{rp(Number(data.grand_tunggakan))}</div>
              <p className="kpi-sub-text">Sisa administrasi yang belum dilunasi</p>
            </div>
          </div>

          {/* 📋 4. ITEM CARDS GRID (Rincian per Administrasi) */}
          <div className="du-breakdown-section">
            <h3 className="section-title">Rincian per Komponen Administrasi</h3>
            <div className="du-breakdown-grid">
              {summaryItems.map(item => {
                const pct = pctBar(item.terkumpul, item.target);
                return (
                  <div key={item.kode} className="du-item-glass-card">
                    <div className="card-top-header">
                      <h4 className="item-title">{item.nama}</h4>
                      <span className="item-code-chip">{item.kode}</span>
                    </div>

                    <div className="card-metric-rows">
                      <div className="metric-row">
                        <span className="lbl">Realisasi</span>
                        <span className="val text-emerald">{rp(item.terkumpul)}</span>
                      </div>
                      <div className="metric-row">
                        <span className="lbl">Target</span>
                        <span className="val">{rp(item.target)}</span>
                      </div>
                      <div className="metric-row">
                        <span className="lbl">Sisa</span>
                        <span className="val text-rose">{rp(item.target - item.terkumpul)}</span>
                      </div>
                    </div>

                    <div className="kpi-progress-track">
                      <div
                        className="kpi-progress-fill fill-emerald"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="card-footer-meta">
                      <span className="pct-badge">{pct}% terkumpul</span>
                      <span className="counts-text">
                        <strong>{item.jumlah_lunas}</strong> lunas · <strong>{item.jumlah_sebagian}</strong> sebagian
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 💎 5. DETAIL PEMBAYARAN SANTRI TABLE */}
          <div className="du-table-section">
            <div className="table-header-bar">
              <h3 className="section-title">Detail Pembayaran Santri</h3>

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
                      {summaryItems.map(item => (
                        <th key={item.kode} className="cell-center">{item.nama}</th>
                      ))}
                      <th className="cell-right">Total Tagihan</th>
                      <th className="cell-right">Total Dibayar</th>
                      <th className="cell-right">Sisa Tagihan</th>
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
                          {summaryItems.map(item => {
                            const detail = s.status_per_item[item.kode];
                            return (
                              <td key={item.kode} className="cell-center">
                                {detail ? (
                                  <div className="du-cell-status">
                                    <StatusBadge status={detail.status} />
                                    <span className="cell-num">{rp(detail.dibayar)}</span>
                                  </div>
                                ) : (
                                  <span className="cell-muted">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="cell-right font-numeric">{rp(s.total_tagihan)}</td>
                          <td className="cell-right font-numeric text-emerald font-bold">{rp(s.total_dibayar)}</td>
                          <td className={`cell-right font-numeric font-bold ${s.total_sisa > 0 ? 'text-rose' : 'text-emerald'}`}>
                            {rp(s.total_sisa)}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSantri.length === 0 && (
                      <tr>
                        <td colSpan={summaryItems.length + 5} className="table-empty-cell">
                          Tidak ada data santri yang cocok dengan pencarian "{searchQuery}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

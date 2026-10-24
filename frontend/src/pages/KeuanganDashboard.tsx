import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, AlertCircle,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  Banknote, Users, ChevronRight, Zap,
  BarChart3, BookOpen, FileText, Settings,
  CheckCircle2, Calendar
} from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import {
  DashboardKeuanganData,
  TahunAjaran,
  DashboardTopTunggakan
} from '../types/keuangan';
import './KeuanganDashboard.scss';

// ─── Format Rupiah ─────────────────────────────────────────────────────────
function rp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function rpShort(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return rp(n);
}

// ─── Komponen MetricCard (Option A Glass Card + 3D Orb) ─────────────────────
interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  pct?: number;
  pctPositiveIsGood?: boolean;
  icon: React.ElementType;
  variant: 'emerald' | 'rose' | 'sapphire' | 'amber';
  loading?: boolean;
}

function MetricCard({
  label,
  value,
  sublabel,
  pct,
  pctPositiveIsGood = true,
  icon: Icon,
  variant,
  loading = false,
}: MetricCardProps) {
  const isPositive = (pct ?? 0) >= 0;
  const isGood = pctPositiveIsGood ? isPositive : !isPositive;

  return (
    <div className={`kd-metric-card card-${variant}`}>
      <div className="card-top-row">
        <span className="card-label">{label}</span>
        <div className={`card-icon-orb orb-${variant}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="card-content">
        {loading ? (
          <div className="kd-skeleton kd-skeleton--val" />
        ) : (
          <div className="card-value">{value}</div>
        )}

        {sublabel && !loading && (
          <div className="card-sublabel">{sublabel}</div>
        )}

        {pct !== undefined && !loading && (
          <div className={`card-trend-badge ${isGood ? 'trend-good' : 'trend-bad'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{Math.abs(pct)}% vs bulan lalu</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Komponen ProgressBar (Glass Progress Bar) ──────────────────────────────
function ProgressBar({
  label,
  value,
  total,
  color,
  textColor,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  textColor?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="kd-breakdown-row">
      <div className="kd-breakdown-info">
        <span className="kd-breakdown-label">{label}</span>
        <div className="kd-breakdown-amount-wrap">
          <span className="kd-breakdown-nominal" style={{ color: textColor }}>{rp(value)}</span>
          <span className="kd-breakdown-pct-tag">{pct}%</span>
        </div>
      </div>
      <div className="kd-progress-track">
        <div
          className="kd-progress-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Quick Action Card (Apple Liquid Glass Action Button) ───────────────────
function QuickAction({
  icon: Icon,
  label,
  desc,
  variant,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  variant: 'blue' | 'green' | 'amber' | 'purple';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`kd-quick-action action-${variant}`}
      onClick={onClick}
    >
      <div className={`action-icon-box box-${variant}`}>
        <Icon size={18} />
      </div>
      <div className="action-text-block">
        <span className="action-title">{label}</span>
        <span className="action-subtitle">{desc}</span>
      </div>
      <div className="action-chevron">
        <ChevronRight size={16} />
      </div>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function KeuanganDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardKeuanganData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [tahunId, setTahunId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem('token');

  // Load daftar tahun ajaran
  useEffect(() => {
    fetch('/api/tahun-ajaran', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((list: TahunAjaran[]) => {
        setTahunList(list);
        const aktif = list.find(t => t.is_active);
        if (aktif) setTahunId(aktif.id);
      })
      .catch(() => {/* silent */});
  }, [token]);

  const fetchDashboard = useCallback(async () => {
    if (!tahunId) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/keuangan/dashboard?tahun_ajaran_id=${tahunId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat data');
      const json: DashboardKeuanganData = await res.json();
      setData(json);
      setError('');
    } catch {
      setError('Gagal memuat data dashboard keuangan. Pastikan server aktif.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tahunId, token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const totalMasuk = data?.total_masuk_bulan_ini ?? 0;
  const totalKeluar = data?.total_keluar_bulan_ini ?? 0;
  const saldoBersih = totalMasuk - totalKeluar;
  const activeTahun = tahunList.find(t => t.id === tahunId);

  const tahunOptions = tahunList.map(t => ({
    value: t.id,
    label: `${t.kode}${t.is_active ? ' (Aktif)' : ''}`,
  }));

  return (
    <div className="keuangan-dashboard-container">
      {/* 🍏 1. APPLE FLOATING DOCK HEADER (Option A Standard - NO HEADER ICON) */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Dashboard Keuangan</h2>
          <p className="page-subtitle">
            Ringkasan arus kas, monitoring tunggakan santri, dan laporan keuangan pesantren
          </p>
        </div>

        <div className="header-action-dock">
          {data && (
            <div className="kd-period-badge">
              <Calendar size={14} />
              <span>{data.nama_bulan} {data.tahun}</span>
            </div>
          )}

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
            onClick={fetchDashboard}
            disabled={refreshing}
            title="Segarkan Data"
          >
            <RefreshCw size={14} className={refreshing ? 'spinning-icon' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </header>

      {/* ── ERROR STATE BANNER ───────────────────────────────────── */}
      {error && (
        <div className="kd-alert kd-alert--danger">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 📊 2. KPI METRICS CARDS (Apple Liquid Glass + 3D Spherical Lens Orbs) */}
      <div className="kd-metrics-grid">
        <MetricCard
          label="Pemasukan Bulan Ini"
          icon={ArrowUpRight}
          variant="emerald"
          value={loading ? '...' : rpShort(totalMasuk)}
          sublabel={loading ? '' : `Total: ${rp(totalMasuk)}`}
          pct={data?.pct_change_masuk}
          pctPositiveIsGood={true}
          loading={loading}
        />
        <MetricCard
          label="Pengeluaran Bulan Ini"
          icon={ArrowDownRight}
          variant="rose"
          value={loading ? '...' : rpShort(totalKeluar)}
          sublabel={loading ? '' : `Total: ${rp(totalKeluar)}`}
          pct={data?.pct_change_keluar}
          pctPositiveIsGood={false}
          loading={loading}
        />
        <MetricCard
          label="Saldo Bersih"
          icon={Banknote}
          variant="sapphire"
          value={loading ? '...' : rpShort(saldoBersih)}
          sublabel={loading ? '' : saldoBersih >= 0 ? 'Surplus operasional bulan ini' : 'Defisit operasional'}
          loading={loading}
        />
        <MetricCard
          label="Tunggakan Aktif"
          icon={AlertCircle}
          variant="amber"
          value={loading ? '...' : rpShort(data?.total_tunggakan_aktif ?? 0)}
          sublabel={loading ? '' : `${data?.jumlah_santri_menunggak ?? 0} santri menunggak tagihan`}
          loading={loading}
        />
      </div>

      {/* ── 3. MAIN DASHBOARD CONTENT GRID (2 Kolom) ─────────────── */}
      <div className="kd-main-grid">
        {/* KOLOM KIRI (Aksi Cepat & Breakdown Transaksi) */}
        <div className="kd-column-left">
          {/* Aksi Cepat */}
          <div className="kd-glass-card">
            <div className="kd-card-header">
              <div className="kd-card-title-group">
                <div className="kd-mini-orb orb-amber">
                  <Zap size={14} />
                </div>
                <h3 className="kd-card-title">Aksi Cepat Keuangan</h3>
              </div>
              <span className="kd-header-tag">Pintasan</span>
            </div>

            <div className="kd-quick-actions-grid">
              <QuickAction
                icon={BarChart3}
                label="Generate SPP Bulan Ini"
                desc="Buat tagihan massal untuk semua santri"
                variant="blue"
                onClick={() => navigate('/keuangan/tagihan')}
              />
              <QuickAction
                icon={Banknote}
                label="Catat Pembayaran"
                desc="Input pembayaran tagihan & cetak kwitansi"
                variant="green"
                onClick={() => navigate('/keuangan/tagihan')}
              />
              <QuickAction
                icon={BookOpen}
                label="Catat Pengeluaran"
                desc="Input arus kas keluar pondok & madin"
                variant="amber"
                onClick={() => navigate('/keuangan/kas')}
              />
              <QuickAction
                icon={FileText}
                label="Lihat Laporan SPP"
                desc="Rekap bulanan, semester, dan tahunan"
                variant="purple"
                onClick={() => navigate('/keuangan/laporan/spp')}
              />
            </div>
          </div>

          {/* Breakdown Pemasukan */}
          <div className="kd-glass-card">
            <div className="kd-card-header">
              <div className="kd-card-title-group">
                <div className="kd-mini-orb orb-emerald">
                  <ArrowUpRight size={14} />
                </div>
                <h3 className="kd-card-title">Breakdown Pemasukan Bulan Ini</h3>
              </div>
              <span className="kd-amount-badge badge-emerald">{rp(totalMasuk)}</span>
            </div>

            {loading ? (
              <div className="kd-skeleton-list">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="kd-skeleton" style={{ height: 42, marginBottom: 10 }} />
                ))}
              </div>
            ) : data ? (
              <div className="kd-breakdown-list">
                <ProgressBar
                  label="SPP Makan"
                  value={data.breakdown_masuk.spp_makan ?? 0}
                  total={totalMasuk}
                  color="linear-gradient(90deg, #10b981 0%, #059669 100%)"
                  textColor="#059669"
                />
                <ProgressBar
                  label="SPP Madin"
                  value={data.breakdown_masuk.spp_madin ?? 0}
                  total={totalMasuk}
                  color="linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)"
                  textColor="#2563eb"
                />
                <ProgressBar
                  label="Daftar Ulang"
                  value={data.breakdown_masuk.daftar_ulang ?? 0}
                  total={totalMasuk}
                  color="linear-gradient(90deg, #a855f7 0%, #9333ea 100%)"
                  textColor="#9333ea"
                />
                <ProgressBar
                  label="Event / Insidental"
                  value={data.breakdown_masuk.event ?? 0}
                  total={totalMasuk}
                  color="linear-gradient(90deg, #f59e0b 0%, #d97706 100%)"
                  textColor="#d97706"
                />
              </div>
            ) : null}
          </div>

          {/* Breakdown Pengeluaran */}
          <div className="kd-glass-card">
            <div className="kd-card-header">
              <div className="kd-card-title-group">
                <div className="kd-mini-orb orb-rose">
                  <ArrowDownRight size={14} />
                </div>
                <h3 className="kd-card-title">Breakdown Pengeluaran Bulan Ini</h3>
              </div>
              <span className="kd-amount-badge badge-rose">{rp(totalKeluar)}</span>
            </div>

            {loading ? (
              <div className="kd-skeleton-list">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="kd-skeleton" style={{ height: 42, marginBottom: 10 }} />
                ))}
              </div>
            ) : data ? (
              <div className="kd-breakdown-list">
                <ProgressBar
                  label="Kas Pondok"
                  value={data.breakdown_keluar.kas_pondok ?? 0}
                  total={totalKeluar}
                  color="linear-gradient(90deg, #f43f5e 0%, #e11d48 100%)"
                  textColor="#e11d48"
                />
                <ProgressBar
                  label="Kas Madin"
                  value={data.breakdown_keluar.kas_madin ?? 0}
                  total={totalKeluar}
                  color="linear-gradient(90deg, #fb923c 0%, #ea580c 100%)"
                  textColor="#ea580c"
                />
                <ProgressBar
                  label="Semester Ganjil"
                  value={data.breakdown_keluar.kas_smt_ganjil ?? 0}
                  total={totalKeluar}
                  color="linear-gradient(90deg, #eab308 0%, #ca8a04 100%)"
                  textColor="#ca8a04"
                />
                <ProgressBar
                  label="Semester Genap"
                  value={data.breakdown_keluar.kas_smt_genap ?? 0}
                  total={totalKeluar}
                  color="linear-gradient(90deg, #c084fc 0%, #a855f7 100%)"
                  textColor="#a855f7"
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* KOLOM KANAN (Navigasi Modul & Top Tunggakan) */}
        <div className="kd-column-right">
          {/* Navigasi Modul Keuangan */}
          <div className="kd-glass-card">
            <div className="kd-card-header">
              <div className="kd-card-title-group">
                <div className="kd-mini-orb orb-sapphire">
                  <Settings size={14} />
                </div>
                <h3 className="kd-card-title">Menu Modul Keuangan</h3>
              </div>
            </div>

            <nav className="kd-nav-menu">
              {[
                { to: '/keuangan/tagihan', icon: FileText, label: 'Tagihan Santri', desc: 'SPP, DU, dan Tagihan Event', color: 'sapphire' },
                { to: '/keuangan/kas', icon: BookOpen, label: 'Buku Kas Keluar', desc: 'Arus kas keluar pondok & madin', color: 'amber' },
                { to: '/keuangan/laporan/spp', icon: BarChart3, label: 'Laporan SPP', desc: 'Bulanan, semester, dan tahunan', color: 'emerald' },
                { to: '/keuangan/laporan/daftar-ulang', icon: Users, label: 'Laporan Daftar Ulang', desc: 'Santri baru dan lama', color: 'purple' },
                { to: '/keuangan/laporan/event', icon: Zap, label: 'Laporan Event', desc: 'Haflah, kitab, dan insidental', color: 'rose' },
                { to: '/keuangan/setup', icon: Settings, label: 'Setup Keuangan', desc: 'Tarif iuran & pengecualian santri', color: 'sapphire' },
              ].map(({ to, icon: Icon, label, desc, color }) => (
                <button
                  key={to}
                  type="button"
                  className="kd-nav-item"
                  onClick={() => navigate(to)}
                >
                  <div className={`nav-icon-badge badge-${color}`}>
                    <Icon size={15} />
                  </div>
                  <div className="nav-text-block">
                    <span className="nav-title">{label}</span>
                    <span className="nav-desc">{desc}</span>
                  </div>
                  <ChevronRight size={15} className="nav-chevron" />
                </button>
              ))}
            </nav>
          </div>

          {/* Top Tunggakan Santri */}
          <div className="kd-glass-card">
            <div className="kd-card-header">
              <div className="kd-card-title-group">
                <div className="kd-mini-orb orb-rose">
                  <AlertCircle size={14} />
                </div>
                <h3 className="kd-card-title">Tunggakan Terbesar</h3>
              </div>
              <button
                type="button"
                className="kd-link-button"
                onClick={() => navigate('/keuangan/laporan/spp')}
              >
                Lihat Semua
              </button>
            </div>

            {loading ? (
              <div className="kd-skeleton-list">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="kd-skeleton" style={{ height: 46, marginBottom: 8 }} />
                ))}
              </div>
            ) : data?.top_tunggakan.length === 0 ? (
              <div className="kd-empty-state">
                <div className="kd-empty-orb">
                  <CheckCircle2 size={32} />
                </div>
                <p className="kd-empty-text">Tidak ada tunggakan aktif 🎉</p>
                <span className="kd-empty-subtext">Semua santri telah melunasi kewajiban tagihan.</span>
              </div>
            ) : (
              <div className="kd-tunggakan-list">
                {data?.top_tunggakan.map((t, idx) => (
                  <div key={t.santri_id} className="kd-tunggakan-row">
                    <div className={`kd-rank-pill rank-${idx < 3 ? idx + 1 : 'default'}`}>
                      {idx + 1}
                    </div>
                    <div className="kd-santri-info">
                      <span className="kd-santri-nama">{t.nama}</span>
                      <span className="kd-santri-meta">NIS: {t.nis} · <strong style={{ color: '#e11d48' }}>{t.bulan_menunggak} tagihan</strong></span>
                    </div>
                    <div className="kd-tunggakan-amount">
                      {rpShort(t.total_tunggakan)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

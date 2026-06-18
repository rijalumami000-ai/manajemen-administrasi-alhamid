import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, TrendingUp, TrendingDown, AlertCircle,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  Banknote, Users, ChevronRight, Zap,
  BarChart3, BookOpen, FileText, Settings
} from 'lucide-react';
import './KeuanganDashboard.scss';

interface DashboardData {
  bulan: number;
  tahun: number;
  nama_bulan: string;
  total_masuk_bulan_ini: number;
  total_masuk_bulan_lalu: number;
  pct_change_masuk: number;
  total_keluar_bulan_ini: number;
  total_keluar_bulan_lalu: number;
  pct_change_keluar: number;
  saldo_bersih: number;
  total_tunggakan_aktif: number;
  jumlah_santri_menunggak: number;
  breakdown_masuk: Record<string, number>;
  breakdown_keluar: Record<string, number>;
  top_tunggakan: Array<{
    santri_id: number;
    nama: string;
    nis: string;
    total_tunggakan: number;
    bulan_menunggak: number;
  }>;
}

interface TahunAjaran { id: number; kode: string; is_active: boolean; }

// ─── Format Rupiah ─────────────────────────────────────────────────────────
function rp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

function rpShort(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return rp(n);
}

// ─── Komponen MetricCard ───────────────────────────────────────────────────
function MetricCard({
  label, value, sublabel, pct, pctPositiveIsGood = true,
  icon: Icon, color, loading = false,
}: {
  label: string;
  value: string;
  sublabel?: string;
  pct?: number;
  pctPositiveIsGood?: boolean;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'orange';
  loading?: boolean;
}) {
  const isPositive = (pct ?? 0) >= 0;
  const isGood = pctPositiveIsGood ? isPositive : !isPositive;

  return (
    <div className={`k-metric-card k-metric-card--${color}`}>
      <div className="k-metric-card__top">
        <span className="k-metric-card__label">{label}</span>
        <div className={`k-metric-card__icon-wrap k-metric-card__icon-wrap--${color}`}>
          <Icon size={17} />
        </div>
      </div>
      {loading ? (
        <div className="k-skeleton k-skeleton--lg" style={{ marginTop: 8 }} />
      ) : (
        <div className="k-metric-card__value">{value}</div>
      )}
      {sublabel && !loading && (
        <div className="k-metric-card__sub">{sublabel}</div>
      )}
      {pct !== undefined && !loading && (
        <div className={`k-metric-card__trend ${isGood ? 'good' : 'bad'}`}>
          {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>{Math.abs(pct)}% vs bulan lalu</span>
        </div>
      )}
    </div>
  );
}

// ─── Komponen ProgressBar ─────────────────────────────────────────────────
function ProgressBar({ label, value, total, color }: {
  label: string; value: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="k-breakdown-row">
      <div className="k-breakdown-row__header">
        <span className="k-breakdown-row__label">{label}</span>
        <span className="k-breakdown-row__value">{rpShort(value)}</span>
      </div>
      <div className="k-progress__bar-wrap">
        <div
          className="k-progress__bar"
          style={{ width: `${pct}%`, background: color, transition: 'width 0.8s ease-out' }}
        />
      </div>
      <div className="k-breakdown-row__pct">{pct}%</div>
    </div>
  );
}

// ─── Quick Action Card ────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, desc, color, onClick }: {
  icon: React.ElementType; label: string; desc: string;
  color: string; onClick: () => void;
}) {
  return (
    <button className="k-quick-action" onClick={onClick} style={{ '--action-color': color } as React.CSSProperties}>
      <div className="k-quick-action__icon" style={{ background: `${color}18`, color }}>
        <Icon size={20} />
      </div>
      <div className="k-quick-action__text">
        <span className="k-quick-action__label">{label}</span>
        <span className="k-quick-action__desc">{desc}</span>
      </div>
      <ChevronRight size={16} className="k-quick-action__arrow" />
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function KeuanganDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
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
      const json = await res.json();
      setData(json);
      setError('');
    } catch (e) {
      setError('Gagal memuat data dashboard. Pastikan server berjalan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tahunId, token]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const totalMasuk = data?.total_masuk_bulan_ini ?? 0;
  const totalKeluar = data?.total_keluar_bulan_ini ?? 0;

  return (
    <div className="k-page keuangan-dashboard">
      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="k-page__header">
        <div>
          <h1>
            <Wallet size={22} style={{ marginRight: 10, verticalAlign: 'middle', color: '#3B6FE8' }} />
            Dashboard Keuangan
          </h1>
          <p>
            {data ? `${data.nama_bulan} ${data.tahun} · Tahun Ajaran ` : 'Memuat...'}
            {tahunList.find(t => t.id === tahunId)?.kode}
          </p>
        </div>
        <div className="k-page__header-actions">
          <select
            className="k-select"
            value={tahunId ?? ''}
            onChange={e => setTahunId(Number(e.target.value))}
          >
            {tahunList.map(t => (
              <option key={t.id} value={t.id}>{t.kode}{t.is_active ? ' (Aktif)' : ''}</option>
            ))}
          </select>
          <button
            className="k-btn-icon"
            onClick={fetchDashboard}
            disabled={refreshing}
            title="Refresh data"
          >
            <RefreshCw size={15} className={refreshing ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* ── ERROR STATE ─────────────────────────────────────────── */}
      {error && (
        <div className="k-alert k-alert--danger">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── 4 METRIC CARDS ─────────────────────────────────────── */}
      <div className="k-metrics-grid">
        <MetricCard
          label="Pemasukan Bulan Ini" icon={ArrowUpRight} color="green"
          value={loading ? '...' : rpShort(totalMasuk)}
          sublabel={loading ? '' : `Total: ${rp(totalMasuk)}`}
          pct={data?.pct_change_masuk}
          pctPositiveIsGood={true}
          loading={loading}
        />
        <MetricCard
          label="Pengeluaran Bulan Ini" icon={ArrowDownRight} color="red"
          value={loading ? '...' : rpShort(totalKeluar)}
          sublabel={loading ? '' : `Total: ${rp(totalKeluar)}`}
          pct={data?.pct_change_keluar}
          pctPositiveIsGood={false}
          loading={loading}
        />
        <MetricCard
          label="Saldo Bersih" icon={Banknote} color="blue"
          value={loading ? '...' : rpShort(totalMasuk - totalKeluar)}
          sublabel="Pemasukan minus pengeluaran bulan ini"
          loading={loading}
        />
        <MetricCard
          label="Tunggakan Aktif" icon={AlertCircle} color="orange"
          value={loading ? '...' : rpShort(data?.total_tunggakan_aktif ?? 0)}
          sublabel={loading ? '' : `${data?.jumlah_santri_menunggak ?? 0} santri menunggak SPP`}
          loading={loading}
        />
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <div className="k-dashboard-body">

        {/* KOLOM KIRI */}
        <div className="k-dashboard-left">

          {/* Quick Actions */}
          <div className="k-section-card">
            <div className="k-section-card__header">
              <Zap size={16} />
              <h3>Aksi Cepat</h3>
            </div>
            <div className="k-quick-actions-list">
              <QuickAction
                icon={BarChart3} label="Generate SPP Bulan Ini"
                desc="Buat tagihan massal untuk semua santri"
                color="#3B6FE8"
                onClick={() => navigate('/keuangan/tagihan')}
              />
              <QuickAction
                icon={Banknote} label="Catat Pembayaran"
                desc="Input pembayaran & cetak kwitansi"
                color="#10A05B"
                onClick={() => navigate('/keuangan/tagihan')}
              />
              <QuickAction
                icon={BookOpen} label="Catat Pengeluaran"
                desc="Buku kas pondok & madin"
                color="#E07B10"
                onClick={() => navigate('/keuangan/kas')}
              />
              <QuickAction
                icon={FileText} label="Lihat Laporan SPP"
                desc="Per bulan, semester, dan tahunan"
                color="#8B5CF6"
                onClick={() => navigate('/keuangan/laporan/spp')}
              />
            </div>
          </div>

          {/* Breakdown Pemasukan */}
          <div className="k-section-card">
            <div className="k-section-card__header">
              <ArrowUpRight size={16} style={{ color: '#10A05B' }} />
              <h3>Breakdown Pemasukan Bulan Ini</h3>
              <span className="k-section-card__total" style={{ color: '#10A05B' }}>
                {rp(totalMasuk)}
              </span>
            </div>
            {loading ? (
              <div className="k-skeleton-list">
                {[1, 2, 3].map(i => <div key={i} className="k-skeleton" style={{ height: 48, marginBottom: 8 }} />)}
              </div>
            ) : data ? (
              <div className="k-breakdown-list">
                <ProgressBar label="SPP Makan" value={data.breakdown_masuk.spp_makan ?? 0} total={totalMasuk} color="#10A05B" />
                <ProgressBar label="SPP Madin" value={data.breakdown_masuk.spp_madin ?? 0} total={totalMasuk} color="#3B6FE8" />
                <ProgressBar label="Daftar Ulang" value={data.breakdown_masuk.daftar_ulang ?? 0} total={totalMasuk} color="#8B5CF6" />
                <ProgressBar label="Event / Insidental" value={data.breakdown_masuk.event ?? 0} total={totalMasuk} color="#E07B10" />
              </div>
            ) : null}
          </div>

          {/* Breakdown Pengeluaran */}
          <div className="k-section-card">
            <div className="k-section-card__header">
              <ArrowDownRight size={16} style={{ color: '#DC3545' }} />
              <h3>Breakdown Pengeluaran Bulan Ini</h3>
              <span className="k-section-card__total" style={{ color: '#DC3545' }}>
                {rp(totalKeluar)}
              </span>
            </div>
            {loading ? (
              <div className="k-skeleton-list">
                {[1, 2].map(i => <div key={i} className="k-skeleton" style={{ height: 48, marginBottom: 8 }} />)}
              </div>
            ) : data ? (
              <div className="k-breakdown-list">
                <ProgressBar label="Kas Pondok" value={data.breakdown_keluar.kas_pondok ?? 0} total={totalKeluar} color="#DC3545" />
                <ProgressBar label="Kas Madin" value={data.breakdown_keluar.kas_madin ?? 0} total={totalKeluar} color="#F97316" />
                <ProgressBar label="Semester Ganjil" value={data.breakdown_keluar.kas_smt_ganjil ?? 0} total={totalKeluar} color="#EAB308" />
                <ProgressBar label="Semester Genap" value={data.breakdown_keluar.kas_smt_genap ?? 0} total={totalKeluar} color="#A855F7" />
              </div>
            ) : null}
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div className="k-dashboard-right">

          {/* Navigasi Laporan */}
          <div className="k-section-card">
            <div className="k-section-card__header">
              <Settings size={16} />
              <h3>Menu Keuangan</h3>
            </div>
            <nav className="k-nav-links">
              {[
                { to: '/keuangan/tagihan', icon: FileText, label: 'Tagihan Santri', desc: 'SPP, DU, Event' },
                { to: '/keuangan/kas', icon: BookOpen, label: 'Buku Kas Keluar', desc: 'Pondok & Madin' },
                { to: '/keuangan/laporan/spp', icon: BarChart3, label: 'Laporan SPP', desc: 'Bulanan · Semester · Tahunan' },
                { to: '/keuangan/laporan/daftar-ulang', icon: Users, label: 'Laporan Daftar Ulang', desc: 'Santri baru & lama' },
                { to: '/keuangan/laporan/event', icon: Zap, label: 'Laporan Event', desc: 'Haflah, Kitab, dll.' },
                { to: '/keuangan/setup', icon: Settings, label: 'Setup Keuangan', desc: 'Tarif & pengecualian' },
              ].map(({ to, icon: Icon, label, desc }) => (
                <button
                  key={to}
                  className="k-nav-link"
                  onClick={() => navigate(to)}
                >
                  <div className="k-nav-link__icon"><Icon size={15} /></div>
                  <div className="k-nav-link__text">
                    <span className="k-nav-link__label">{label}</span>
                    <span className="k-nav-link__desc">{desc}</span>
                  </div>
                  <ChevronRight size={14} className="k-nav-link__arrow" />
                </button>
              ))}
            </nav>
          </div>

          {/* Top Tunggakan */}
          <div className="k-section-card">
            <div className="k-section-card__header">
              <AlertCircle size={16} style={{ color: '#DC3545' }} />
              <h3>Tunggakan Terbesar</h3>
              <button
                className="k-text-btn"
                onClick={() => navigate('/keuangan/laporan/spp')}
              >
                Lihat semua
              </button>
            </div>
            {loading ? (
              <div className="k-skeleton-list">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="k-skeleton" style={{ height: 42, marginBottom: 6 }} />)}
              </div>
            ) : data?.top_tunggakan.length === 0 ? (
              <div className="k-empty-state">
                <TrendingUp size={32} style={{ color: '#10A05B' }} />
                <p>Tidak ada tunggakan aktif 🎉</p>
              </div>
            ) : (
              <div className="k-tunggakan-list">
                {data?.top_tunggakan.map((t, i) => (
                  <div key={t.santri_id} className="k-tunggakan-row">
                    <div className="k-tunggakan-rank">{i + 1}</div>
                    <div className="k-tunggakan-info">
                      <span className="k-tunggakan-nama">{t.nama}</span>
                      <span className="k-tunggakan-nis">{t.nis} · {t.bulan_menunggak} tagihan</span>
                    </div>
                    <div className="k-tunggakan-nominal">
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

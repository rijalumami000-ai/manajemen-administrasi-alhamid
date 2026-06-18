import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Plus, RefreshCw, Search, AlertCircle,
  Wallet, TrendingDown, X, CheckCircle, Trash2
} from 'lucide-react';
import './BukuKas.scss';

type JenisKas = 'kas_pondok' | 'kas_madin' | 'kas_smt_ganjil' | 'kas_smt_genap';

const JENIS_KAS_LABEL: Record<JenisKas, string> = {
  kas_pondok:    'Kas Pondok',
  kas_madin:     'Kas Madin',
  kas_smt_ganjil:'Semester Ganjil',
  kas_smt_genap: 'Semester Genap',
};

const JENIS_KAS_COLOR: Record<JenisKas, string> = {
  kas_pondok:    '#DC3545',
  kas_madin:     '#F97316',
  kas_smt_ganjil:'#EAB308',
  kas_smt_genap: '#A855F7',
};

interface KasKeluar {
  id: number;
  jenis_kas: JenisKas;
  nominal: number;
  tanggal: string;
  keterangan: string;
  penerima?: string;
  nama_pencatat: string;
  is_void: boolean;
  void_reason?: string;
}

interface TahunAjaran { id: number; kode: string; is_active: boolean; }
interface Summary { jenis_kas: string; total: number; jumlah: number; }

function rp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function formatTgl(s: string): string {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Modal Tambah Pengeluaran ─────────────────────────────────────────────
function ModalTambah({ tahunId, onClose, onSuccess }: {
  tahunId: number; onClose: () => void; onSuccess: () => void;
}) {
  const [jenis, setJenis] = useState<JenisKas>('kas_pondok');
  const [nominal, setNominal] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState('');
  const [penerima, setPenerima] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/keuangan/kas-keluar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jenis_kas: jenis,
          tahun_ajaran_id: tahunId,
          nominal: Number(nominal.replace(/\D/g, '')),
          tanggal,
          keterangan,
          penerima: penerima || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Gagal mencatat pengeluaran');
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="k-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="k-modal">
        <div className="k-modal__header">
          <div className="k-modal__title">
            <TrendingDown size={18} style={{ color: '#DC3545' }} />
            <h3>Catat Pengeluaran</h3>
          </div>
          <button className="k-modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        <form className="k-modal__form" onSubmit={handleSubmit}>
          {error && (
            <div className="k-alert k-alert--danger"><AlertCircle size={14} /> {error}</div>
          )}

          <div className="k-form-group">
            <label>Jenis Kas <span className="required">*</span></label>
            <div className="buku-kas-jenis-grid">
              {(Object.entries(JENIS_KAS_LABEL) as [JenisKas, string][]).map(([k, label]) => (
                <label
                  key={k}
                  className={`buku-kas-jenis-card ${jenis === k ? 'active' : ''}`}
                  style={{ '--accent': JENIS_KAS_COLOR[k] } as React.CSSProperties}
                >
                  <input type="radio" value={k} checked={jenis === k} onChange={() => setJenis(k)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="k-form-group">
            <label>Nominal <span className="required">*</span></label>
            <div className="k-input-prefix">
              <span>Rp</span>
              <input
                type="text"
                className="k-input"
                value={nominal}
                onChange={e => setNominal(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                required
                autoFocus
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="k-form-group">
              <label>Tanggal <span className="required">*</span></label>
              <input type="date" className="k-input" value={tanggal} onChange={e => setTanggal(e.target.value)} required />
            </div>
            <div className="k-form-group">
              <label>Penerima <span className="optional">(opsional)</span></label>
              <input type="text" className="k-input" value={penerima} onChange={e => setPenerima(e.target.value)} placeholder="Nama vendor / penerima" />
            </div>
          </div>

          <div className="k-form-group">
            <label>Keterangan <span className="required">*</span></label>
            <textarea
              className="k-input"
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              rows={3}
              placeholder="Uraian pengeluaran..."
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="k-modal__actions">
            <button type="button" className="k-btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="k-btn-primary" disabled={loading}>
              {loading ? <><span className="k-spinner" /> Menyimpan...</> : <><CheckCircle size={15} /> Simpan Pengeluaran</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function BukuKas() {
  const [activeTab, setActiveTab] = useState<JenisKas>('kas_pondok');
  const [data, setData] = useState<KasKeluar[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [tahunId, setTahunId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const token = localStorage.getItem('token');

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
      const [kas, sum] = await Promise.all([
        fetch(`/api/keuangan/kas-keluar?tahun_ajaran_id=${tahunId}&jenis_kas=${activeTab}&page=${page}&limit=30`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`/api/keuangan/kas-keluar/summary?tahun_ajaran_id=${tahunId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),
      ]);
      setData(kas.data ?? []);
      setSummary(sum.summary ?? []);
    } catch { setData([]); }
    setLoading(false);
  }, [tahunId, activeTab, page, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVoid = async (id: number) => {
    const reason = prompt('Alasan pembatalan:');
    if (!reason) return;
    await fetch(`/api/keuangan/kas-keluar/${id}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ void_reason: reason }),
    });
    fetchData();
  };

  const summaryByJenis = (j: JenisKas) => summary.find(s => s.jenis_kas === j);
  const filtered = data.filter(d =>
    !search || d.keterangan.toLowerCase().includes(search.toLowerCase()) ||
    (d.penerima ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const totalFiltered = filtered.filter(d => !d.is_void).reduce((s, d) => s + d.nominal, 0);

  return (
    <div className="k-page buku-kas-page">
      <div className="k-page__header">
        <div>
          <h1><BookOpen size={21} style={{ marginRight: 8, color: '#E07B10', verticalAlign: 'middle' }} />
            Buku Kas Keluar
          </h1>
          <p>Pencatatan semua pengeluaran pondok dan madin</p>
        </div>
        <div className="k-page__header-actions">
          <select className="k-select" value={tahunId ?? ''} onChange={e => setTahunId(Number(e.target.value))}>
            {tahunList.map(t => <option key={t.id} value={t.id}>{t.kode}{t.is_active ? ' (Aktif)' : ''}</option>)}
          </select>
          <button className="k-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="buku-kas-summary">
        {(Object.entries(JENIS_KAS_LABEL) as [JenisKas, string][]).map(([jenis, label]) => {
          const s = summaryByJenis(jenis);
          return (
            <button
              key={jenis}
              className={`buku-kas-summary-card ${activeTab === jenis ? 'active' : ''}`}
              style={{ '--accent': JENIS_KAS_COLOR[jenis] } as React.CSSProperties}
              onClick={() => { setActiveTab(jenis); setPage(1); }}
            >
              <div className="buku-kas-summary-card__label">{label}</div>
              <div className="buku-kas-summary-card__total">
                {loading ? '—' : rp(Number(s?.total ?? 0))}
              </div>
              <div className="buku-kas-summary-card__count">
                {loading ? '—' : `${s?.jumlah ?? 0} transaksi`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="tagihan-toolbar" style={{ marginBottom: 12 }}>
        <div className="k-search-box">
          <Search size={14} />
          <input type="text" placeholder="Cari keterangan..." value={search}
            onChange={e => setSearch(e.target.value)} className="k-input" />
        </div>
        <button className="k-btn-icon" onClick={fetchData} title="Refresh"><RefreshCw size={14} /></button>
      </div>

      {/* Tabel */}
      <div className="k-table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Penerima</th>
              <th className="right">Nominal</th>
              <th>Dicatat oleh</th>
              <th className="center">Status</th>
              <th className="center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                  <td key={j}><div className="k-skeleton" style={{ height: 12 }} /></td>
                ))}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="k-table-empty">Belum ada pengeluaran dicatat.</td></tr>
            ) : (
              filtered.map((k, i) => (
                <tr key={k.id} className={k.is_void ? 'row-void' : ''}>
                  <td className="muted">{i + 1}</td>
                  <td className="muted">{formatTgl(k.tanggal)}</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>{k.keterangan}</div>
                    {k.is_void && (
                      <div style={{ fontSize: 11, color: '#DC3545' }}>VOID: {k.void_reason}</div>
                    )}
                  </td>
                  <td className="muted">{k.penerima ?? '—'}</td>
                  <td className="right" style={{ color: k.is_void ? undefined : '#DC3545', fontWeight: 700 }}>
                    {rp(k.nominal)}
                  </td>
                  <td className="muted">{k.nama_pencatat}</td>
                  <td className="center">
                    {k.is_void
                      ? <span className="k-badge k-badge--dibebaskan">Void</span>
                      : <span className="k-badge k-badge--lunas">Valid</span>
                    }
                  </td>
                  <td className="center">
                    {!k.is_void && (
                      <button
                        className="k-action-btn k-action-btn--print"
                        onClick={() => handleVoid(k.id)}
                        title="Batalkan (void)"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && filtered.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={4}><strong>TOTAL KELUAR ({JENIS_KAS_LABEL[activeTab]})</strong></td>
                <td className="right" style={{ color: '#DC3545' }}><strong>{rp(totalFiltered)}</strong></td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {showModal && tahunId && (
        <ModalTambah
          tahunId={tahunId}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}

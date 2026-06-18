import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from 'antd';
import {
  FileText, Plus, Search, Filter, Download,
  CheckCircle, Clock, XCircle, Minus, RefreshCw,
  AlertCircle, ChevronDown, Banknote, X, Printer
} from 'lucide-react';
import './TagihanSantri.scss';

// ─── Types ────────────────────────────────────────────────────────────────
type StatusTagihan = 'belum_lunas' | 'sebagian' | 'lunas' | 'dibebaskan';
type Tab = 'spp_makan' | 'spp_madin' | 'daftar_ulang' | 'event';

interface Kelas {
  id: number;
  jenis: 'Diniyah' | 'Sekolah';
  nama: string;
  tingkat?: number;
}

interface Tagihan {
  id: number;
  santri_id: number;
  nama_santri: string;
  nis: string;
  kelas_diniyah?: string;
  nama_iuran: string;
  kode_iuran: string;
  kategori: string;
  periode_bulan?: number;
  periode_tahun?: number;
  nominal_tagihan: number;
  nominal_diskon: number;
  total_dibayar: number;
  sisa_tagihan: number;
  status: StatusTagihan;
  pembayaran_id?: number | null;
}

interface TahunAjaran { id: number; kode: string; is_active: boolean; }

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

// ─── Status Badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: StatusTagihan }) {
  const map: Record<StatusTagihan, { label: string; className: string; Icon: React.ElementType }> = {
    lunas:       { label: 'Lunas',     className: 'k-badge--lunas',      Icon: CheckCircle },
    sebagian:    { label: 'Sebagian',  className: 'k-badge--sebagian',   Icon: Clock },
    belum_lunas: { label: 'Belum',     className: 'k-badge--belum_lunas',Icon: XCircle },
    dibebaskan:  { label: 'Dibebaskan',className: 'k-badge--dibebaskan', Icon: Minus },
  };
  const { label, className, Icon } = map[status] ?? map.belum_lunas;
  return (
    <span className={`k-badge ${className}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}

// ─── Modal Bayar ─────────────────────────────────────────────────────────
function ModalBayar({
  tagihan, tahunId, onClose, onSuccess,
}: { tagihan: Tagihan; tahunId: number; onClose: () => void; onSuccess: () => void }) {
  const [nominal, setNominal] = useState(String(tagihan.sisa_tagihan > 0 ? tagihan.sisa_tagihan : tagihan.nominal_tagihan));
  const [metode, setMetode] = useState('tunai');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/keuangan/pembayaran', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tagihan_id: tagihan.id,
          santri_id: tagihan.santri_id,
          jenis_iuran_id: tagihan.id, // akan diambil dari tagihan
          tahun_ajaran_id: tahunId,
          nominal: Number(nominal.replace(/\D/g, '')),
          metode_bayar: metode,
          keterangan,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Gagal mencatat pembayaran');
      onSuccess();
      // Buka kwitansi di tab baru
      const noKwitansi = json.pembayaran?.no_kwitansi;
      if (noKwitansi) {
        window.open(`/keuangan/kwitansi/${json.pembayaran.id}`, '_blank');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="k-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="k-modal">
        <div className="k-modal__header">
          <div className="k-modal__title">
            <Banknote size={18} style={{ color: '#10A05B' }} />
            <h3>Catat Pembayaran</h3>
          </div>
          <button className="k-modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="k-modal__info">
          <div className="k-modal__info-row">
            <span>Santri</span>
            <strong>{tagihan.nama_santri} <span className="text-muted">({tagihan.nis})</span></strong>
          </div>
          <div className="k-modal__info-row">
            <span>Iuran</span>
            <strong>{tagihan.nama_iuran}
              {tagihan.periode_bulan ? ` — ${NAMA_BULAN[tagihan.periode_bulan]} ${tagihan.periode_tahun}` : ''}
            </strong>
          </div>
          <div className="k-modal__info-row">
            <span>Total Tagihan</span>
            <strong>{rp(tagihan.nominal_tagihan)}</strong>
          </div>
          {tagihan.total_dibayar > 0 && (
            <div className="k-modal__info-row">
              <span>Sudah Dibayar</span>
              <strong style={{ color: '#10A05B' }}>{rp(tagihan.total_dibayar)}</strong>
            </div>
          )}
          <div className="k-modal__info-row k-modal__info-row--sisa">
            <span>Sisa Tagihan</span>
            <strong style={{ color: '#DC3545' }}>{rp(Math.max(0, tagihan.sisa_tagihan))}</strong>
          </div>
        </div>

        <form className="k-modal__form" onSubmit={handleSubmit}>
          {error && (
            <div className="k-alert k-alert--danger" style={{ marginBottom: 12 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="k-form-group">
            <label>Nominal Pembayaran <span className="required">*</span></label>
            <div className="k-input-prefix">
              <span>Rp</span>
              <input
                type="text"
                value={nominal}
                onChange={e => setNominal(e.target.value.replace(/\D/g, ''))}
                className="k-input"
                required
                autoFocus
              />
            </div>
            <div className="k-shortcut-btns">
              <button type="button" onClick={() => setNominal(String(tagihan.sisa_tagihan))}>
                Lunasi ({rp(tagihan.sisa_tagihan)})
              </button>
              {[100000, 200000, 350000].map(n => (
                <button key={n} type="button" onClick={() => setNominal(String(n))}>
                  {rp(n)}
                </button>
              ))}
            </div>
          </div>

          <div className="k-form-group">
            <label>Metode Pembayaran</label>
            <div className="k-metode-pills">
              {(['tunai', 'transfer', 'qris'] as const).map(m => (
                <label key={m} className={`k-pill ${metode === m ? 'k-pill--active' : ''}`}>
                  <input type="radio" value={m} checked={metode === m} onChange={() => setMetode(m)} />
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="k-form-group">
            <label>Keterangan <span className="optional">(opsional)</span></label>
            <input
              type="text"
              className="k-input"
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              placeholder="Misal: Bayar via wali santri"
            />
          </div>

          <div className="k-modal__actions">
            <button type="button" className="k-btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="k-btn-primary" disabled={loading}>
              {loading ? <><span className="k-spinner" /> Menyimpan...</> : <><CheckCircle size={15} /> Simpan & Cetak Kwitansi</>}
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
export default function TagihanSantri() {
  const [tab, setTab] = useState<Tab>('spp_makan');
  const [tagihan, setTagihan] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [tahunId, setTahunId] = useState<number | null>(null);
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahunKal, setTahunKal] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('semua');
  const [search, setSearch] = useState('');
  const [selectedTagihan, setSelectedTagihan] = useState<Tagihan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState('');
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);
  const [eventTypeList, setEventTypeList] = useState<{ id: number; nama: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const token = localStorage.getItem('token');

  // Load tahun ajaran
  useEffect(() => {
    fetch('/api/tahun-ajaran', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((list: TahunAjaran[]) => {
        setTahunList(list);
        const aktif = list.find(t => t.is_active);
        if (aktif) setTahunId(aktif.id);
      });
  }, [token]);

  // Load kelas (Madrasah Diniyah only)
  useEffect(() => {
    if (!tahunId) return;
    fetch(`/api/kelas?tahun_ajaran_id=${tahunId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((list: Kelas[]) => {
        const diniyahOnly = Array.isArray(list) ? list.filter(k => k.jenis === 'Diniyah') : [];
        setKelasList(diniyahOnly);
      })
      .catch(e => {
        console.error('Error fetching kelas:', e);
        setKelasList([]);
      });
  }, [tahunId, token]);

  // Load event types
  useEffect(() => {
    fetch('/api/keuangan/jenis-iuran', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((list: { id: number; nama: string; kategori: string; is_active: boolean }[]) => {
        if (Array.isArray(list)) {
          const events = list.filter(item => item.kategori === 'event' && item.is_active);
          setEventTypeList(events);
          if (events.length > 0) setSelectedEventId(events[0].id);
        }
      })
      .catch(e => console.error('Error fetching event types:', e));
  }, [token]);

  const fetchTagihan = useCallback(async () => {
    if (!tahunId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tahun_ajaran_id: String(tahunId),
        status: statusFilter,
        page: String(page),
        limit: '50',
      });
      if (tab === 'spp_makan' || tab === 'spp_madin') {
        params.set('kategori', 'spp_bulanan');
        params.set('kode_iuran', tab === 'spp_makan' ? 'SPP_MAKAN' : 'SPP_MADIN');
        params.set('bulan', String(bulan));
        params.set('tahun', String(tahunKal));
      }
      else if (tab === 'daftar_ulang') {
        params.set('kategori', 'daftar_ulang_baru,daftar_ulang_lama');
      }
      else {
        params.set('kategori', 'event');
      }

      // Filter by Class
      if (selectedKelasId) {
        const targetKelas = kelasList.find(k => k.id === selectedKelasId);
        if (targetKelas) {
          if (targetKelas.jenis === 'Diniyah') {
            params.set('kelas_diniyah_id', String(selectedKelasId));
          } else {
            params.set('kelas_sekolah_id', String(selectedKelasId));
          }
        }
      }

      const res = await fetch(`/api/keuangan/tagihan?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setTagihan(json.data ?? []);
      setPagination(json.pagination ?? { total: 0, total_pages: 1 });
    } catch {
      setTagihan([]);
    } finally {
      setLoading(false);
    }
  }, [tahunId, tab, statusFilter, bulan, tahunKal, page, selectedKelasId, kelasList, token]);

  useEffect(() => { fetchTagihan(); }, [fetchTagihan]);

  const handleGenerateSPP = async () => {
    if (!tahunId) return;
    Modal.confirm({
      title: 'Generate Tagihan SPP',
      content: `Generate tagihan SPP untuk semua santri aktif — ${NAMA_BULAN[bulan]} ${tahunKal}?\n\nProses ini aman, tagihan yang sudah ada tidak akan digandakan.`,
      okText: 'Generate',
      cancelText: 'Batal',
      onOk: async () => {
        setGenerating(true); setGenerateMsg('');
        try {
          const res = await fetch('/api/keuangan/tagihan/generate-spp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ tahun_ajaran_id: tahunId, bulan, ...({ tahun: tahunKal }) }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? 'Gagal');
          setGenerateMsg(`✅ ${json.message}`);
          fetchTagihan();
        } catch (e) {
          setGenerateMsg(`❌ ${e instanceof Error ? e.message : 'Gagal generate'}`);
        } finally {
          setGenerating(false);
        }
      }
    });
  };

  const handleGenerateDU = async () => {
    if (!tahunId) return;
    Modal.confirm({
      title: 'Generate Tagihan Daftar Ulang',
      content: 'Generate tagihan Daftar Ulang (Santri Baru & Lama) untuk semua santri aktif?\n\nProses ini aman, tagihan yang sudah ada tidak akan digandakan.',
      okText: 'Generate',
      cancelText: 'Batal',
      onOk: async () => {
        setGenerating(true); setGenerateMsg('');
        try {
          const res = await fetch('/api/keuangan/tagihan/generate-du', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ tahun_ajaran_id: tahunId }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? 'Gagal');
          setGenerateMsg(`✅ ${json.message}`);
          fetchTagihan();
        } catch (e) {
          setGenerateMsg(`❌ ${e instanceof Error ? e.message : 'Gagal generate'}`);
        } finally {
          setGenerating(false);
        }
      }
    });
  };

  const handleGenerateEvent = async () => {
    if (!tahunId || !selectedEventId) return;
    const eventName = eventTypeList.find(e => e.id === selectedEventId)?.nama ?? 'Event';
    Modal.confirm({
      title: 'Generate Tagihan Event',
      content: `Generate tagihan Event "${eventName}" untuk semua santri aktif?\n\nProses ini aman, tagihan yang sudah ada tidak akan digandakan.`,
      okText: 'Generate',
      cancelText: 'Batal',
      onOk: async () => {
        setGenerating(true); setGenerateMsg('');
        try {
          const res = await fetch('/api/keuangan/tagihan/generate-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ tahun_ajaran_id: tahunId, jenis_iuran_id: selectedEventId }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? 'Gagal');
          setGenerateMsg(`✅ ${json.message}`);
          fetchTagihan();
        } catch (e) {
          setGenerateMsg(`❌ ${e instanceof Error ? e.message : 'Gagal generate'}`);
        } finally {
          setGenerating(false);
        }
      }
    });
  };

  // Filter pencarian lokal
  const filtered = tagihan.filter(t =>
    !search || t.nama_santri.toLowerCase().includes(search.toLowerCase()) || t.nis.includes(search)
  );

  // Ringkasan bawah tabel
  const totalTagihan = filtered.reduce((s, t) => s + t.nominal_tagihan, 0);
  const totalDibayar = filtered.reduce((s, t) => s + t.total_dibayar, 0);
  const totalSisa    = filtered.reduce((s, t) => s + Math.max(0, t.sisa_tagihan), 0);

  return (
    <div className="k-page tagihan-page">
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="k-page__header">
        <div>
          <h1><FileText size={21} style={{ marginRight: 8, color: '#3B6FE8', verticalAlign: 'middle' }} />
            Tagihan Santri
          </h1>
          <p>Kelola tagihan SPP, Daftar Ulang, dan Event</p>
        </div>
        <div className="tagihan-page__header-actions">
          <select className="k-select" value={tahunId ?? ''} onChange={e => setTahunId(Number(e.target.value))}>
            {tahunList.map(t => <option key={t.id} value={t.id}>{t.kode}{t.is_active ? ' (Aktif)' : ''}</option>)}
          </select>
        </div>
      </div>

      {/* ── TABS ────────────────────────────────────────────────── */}
      <div className="k-tabs">
        {([
          ['spp_makan', 'SPP Makan'],
          ['spp_madin', 'SPP Madin'],
          ['daftar_ulang', 'Daftar Ulang'],
          ['event', 'Event']
        ] as const).map(([id, label]) => (
          <button
            key={id}
            className={`k-tab ${tab === id ? 'k-tab--active' : ''}`}
            onClick={() => { setTab(id); setPage(1); }}
          >{label}</button>
        ))}
      </div>

      {/* ── KELAS CHIPS (MINIMALIST CARDS) ───────────────────────── */}
      <div className="kelas-chips-scroll">
        <button
          className={`kelas-chip ${selectedKelasId === null ? 'kelas-chip--active' : ''}`}
          onClick={() => { setSelectedKelasId(null); setPage(1); }}
        >
          Semua Kelas
        </button>
        {kelasList.map(k => (
          <button
            key={k.id}
            className={`kelas-chip ${selectedKelasId === k.id ? 'kelas-chip--active' : ''}`}
            onClick={() => { setSelectedKelasId(k.id); setPage(1); }}
          >
            {k.nama}
          </button>
        ))}
      </div>

      {/* ── TOOLBAR ─────────────────────────────────────────────── */}
      <div className="tagihan-toolbar">
        <div className="tagihan-toolbar__left">
          {/* Search */}
          <div className="k-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Cari nama / NIS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="k-input"
            />
          </div>

          {/* Filter status */}
          <select className="k-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="semua">Semua Status</option>
            <option value="belum_lunas">Belum Lunas</option>
            <option value="sebagian">Sebagian</option>
            <option value="lunas">Lunas</option>
            <option value="dibebaskan">Dibebaskan</option>
          </select>

          {/* Filter bulan (hanya untuk SPP) */}
          {(tab === 'spp_makan' || tab === 'spp_madin') && (
            <>
              <select className="k-select" value={bulan} onChange={e => setBulan(Number(e.target.value))}>
                {Object.entries(NAMA_BULAN).map(([n, nama]) => (
                  <option key={n} value={n}>{nama}</option>
                ))}
              </select>
              <select className="k-select" value={tahunKal} onChange={e => setTahunKal(Number(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}

          <button className="k-btn-icon" onClick={fetchTagihan} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="tagihan-toolbar__right">
          {/* Generate SPP */}
          {(tab === 'spp_makan' || tab === 'spp_madin') && (
            <button
              className="k-btn-generate"
              onClick={handleGenerateSPP}
              disabled={generating}
            >
              {generating
                ? <><span className="k-spinner" style={{ borderColor: '#fff3', borderTopColor: '#fff' }} /> Generating...</>
                : <><Plus size={15} /> Generate SPP {NAMA_BULAN[bulan]}</>
              }
            </button>
          )}

          {/* Generate Daftar Ulang */}
          {tab === 'daftar_ulang' && (
            <button
              className="k-btn-generate k-btn-generate--du"
              onClick={handleGenerateDU}
              disabled={generating}
            >
              {generating
                ? <><span className="k-spinner" style={{ borderColor: '#fff3', borderTopColor: '#fff' }} /> Generating...</>
                : <><Plus size={15} /> Generate Daftar Ulang</>
              }
            </button>
          )}

          {/* Generate Event */}
          {tab === 'event' && (
            <div className="event-generate-wrap">
              <select 
                className="k-select"
                value={selectedEventId ?? ''}
                onChange={e => setSelectedEventId(Number(e.target.value))}
                style={{ minWidth: 160 }}
              >
                {eventTypeList.map(evt => (
                  <option key={evt.id} value={evt.id}>{evt.nama}</option>
                ))}
              </select>
              <button
                className="k-btn-generate k-btn-generate--event"
                onClick={handleGenerateEvent}
                disabled={generating || !selectedEventId}
              >
                {generating
                  ? <><span className="k-spinner" style={{ borderColor: '#fff3', borderTopColor: '#fff' }} /> Generating...</>
                  : <><Plus size={15} /> Generate Event</>
                }
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Generate message */}
      {generateMsg && (
        <div className={`k-alert ${generateMsg.startsWith('✅') ? 'k-alert--success' : 'k-alert--danger'}`}
          style={{ marginBottom: 12, marginTop: -4 }}>
          {generateMsg}
        </div>
      )}

      {/* ── SUMMARY CHIPS ────────────────────────────────────────── */}
      <div className="tagihan-summary-chips">
        <div className="tagihan-chip tagihan-chip--total">
          <span>Total Tagihan</span>
          <strong>{rp(totalTagihan)}</strong>
        </div>
        <div className="tagihan-chip tagihan-chip--dibayar">
          <span>Terkumpul</span>
          <strong>{rp(totalDibayar)}</strong>
        </div>
        <div className="tagihan-chip tagihan-chip--sisa">
          <span>Sisa / Tunggakan</span>
          <strong>{rp(totalSisa)}</strong>
        </div>
        <div className="tagihan-chip tagihan-chip--pct">
          <span>Realisasi</span>
          <strong>{totalTagihan > 0 ? Math.round((totalDibayar / totalTagihan) * 100) : 0}%</strong>
        </div>
      </div>

      {/* ── TABEL ───────────────────────────────────────────────── */}
      <div className="k-table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Santri</th>
              <th>Iuran</th>
              {(tab === 'spp_makan' || tab === 'spp_madin') && <th>Periode</th>}
              <th className="right">Tagihan</th>
              <th className="right">Dibayar</th>
              <th className="right">Sisa</th>
              <th className="center">Status</th>
              <th className="center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: (tab === 'spp_makan' || tab === 'spp_madin') ? 9 : 8 }).map((_, j) => (
                    <td key={j}><div className="k-skeleton" style={{ height: 12 }} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={(tab === 'spp_makan' || tab === 'spp_madin') ? 9 : 8} className="k-table-empty">
                  Tidak ada tagihan ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((t, i) => (
                <tr key={t.id}>
                  <td className="muted">{(page - 1) * 50 + i + 1}</td>
                  <td>
                    <div className="tagihan-santri-cell">
                      <span className="tagihan-santri-nama">{t.nama_santri}</span>
                      <span className="tagihan-santri-nis">{t.nis}</span>
                    </div>
                  </td>
                  <td>{t.nama_iuran}</td>
                  {(tab === 'spp_makan' || tab === 'spp_madin') && (
                    <td className="muted">
                      {t.periode_bulan ? `${NAMA_BULAN[t.periode_bulan]} ${t.periode_tahun}` : '—'}
                    </td>
                  )}
                  <td className="right">{rp(t.nominal_tagihan)}</td>
                  <td className="right" style={{ color: t.total_dibayar > 0 ? '#10A05B' : undefined }}>
                    {rp(t.total_dibayar)}
                  </td>
                  <td className="right" style={{ color: t.sisa_tagihan > 0 ? '#DC3545' : undefined }}>
                    {t.status === 'dibebaskan' ? '—' : rp(Math.max(0, t.sisa_tagihan))}
                  </td>
                  <td className="center">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="center">
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      {t.status !== 'lunas' && t.status !== 'dibebaskan' && (
                        <button
                          className="k-action-btn k-action-btn--pay"
                          onClick={() => setSelectedTagihan(t)}
                          title="Catat Pembayaran"
                        >
                          <Banknote size={13} /> Bayar
                        </button>
                      )}
                      {t.pembayaran_id && (
                        <button
                          className="k-action-btn k-action-btn--print"
                          title="Cetak Kwitansi"
                          onClick={() => window.open(`/keuangan/kwitansi/${t.pembayaran_id}`, '_blank')}
                        >
                          <Printer size={13} /> Cetak
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && filtered.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={(tab === 'spp_makan' || tab === 'spp_madin') ? 4 : 3}><strong>TOTAL ({filtered.length} tagihan)</strong></td>
                <td className="right"><strong>{rp(totalTagihan)}</strong></td>
                <td className="right" style={{ color: '#10A05B' }}><strong>{rp(totalDibayar)}</strong></td>
                <td className="right" style={{ color: '#DC3545' }}><strong>{rp(totalSisa)}</strong></td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="k-pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="k-btn-ghost">← Sebelumnya</button>
          <span>Halaman {page} dari {pagination.total_pages} ({pagination.total} tagihan)</span>
          <button disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)} className="k-btn-ghost">Berikutnya →</button>
        </div>
      )}

      {/* ── MODAL BAYAR ────────────────────────────────────────── */}
      {selectedTagihan && tahunId && (
        <ModalBayar
          tagihan={selectedTagihan}
          tahunId={tahunId}
          onClose={() => setSelectedTagihan(null)}
          onSuccess={() => { setSelectedTagihan(null); fetchTagihan(); }}
        />
      )}
    </div>
  );
}

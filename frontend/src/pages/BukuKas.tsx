import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, RefreshCw, Search, X, CheckCircle2, XCircle, AlertCircle,
  Trash2, Building2, GraduationCap, Calendar, Layers, AlertTriangle, FileText
} from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import {
  JenisKas,
  KasKeluarItem,
  BukuKasSummaryItem,
  TahunAjaran
} from '../types/keuangan';
import './BukuKas.scss';

const JENIS_KAS_CONFIG: Record<
  JenisKas,
  { label: string; sublabel: string; color: string; orbClass: string; Icon: React.ElementType }
> = {
  kas_pondok: {
    label: 'Kas Pondok',
    sublabel: 'Operasional Umum Pesantren',
    color: '#e11d48',
    orbClass: 'orb-rose',
    Icon: Building2,
  },
  kas_madin: {
    label: 'Kas Madin',
    sublabel: 'Operasional Madrasah Diniyah',
    color: '#d97706',
    orbClass: 'orb-amber',
    Icon: GraduationCap,
  },
  kas_smt_ganjil: {
    label: 'Semester Ganjil',
    sublabel: 'Kegiatan Smt 1',
    color: '#2563eb',
    orbClass: 'orb-sapphire',
    Icon: Calendar,
  },
  kas_smt_genap: {
    label: 'Semester Genap',
    sublabel: 'Kegiatan Smt 2',
    color: '#7c3aed',
    orbClass: 'orb-amethyst',
    Icon: Layers,
  },
};

function rp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function formatTgl(s: string): string {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return s;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL: CATAT PENGELUARAN BARU
// ════════════════════════════════════════════════════════════════════════════
interface ModalTambahProps {
  isOpen: boolean;
  tahunId: number;
  initialJenis: JenisKas;
  onClose: () => void;
  onSuccess: () => void;
}

function ModalTambahPengeluaran({
  isOpen,
  tahunId,
  initialJenis,
  onClose,
  onSuccess,
}: ModalTambahProps) {
  const [jenis, setJenis] = useState<JenisKas>(initialJenis);
  const [nominal, setNominal] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState('');
  const [penerima, setPenerima] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token') ?? '';

  useEffect(() => {
    if (isOpen) {
      setJenis(initialJenis);
      setNominal('');
      setTanggal(new Date().toISOString().slice(0, 10));
      setKeterangan('');
      setPenerima('');
      setError('');
    }
  }, [isOpen, initialJenis]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawNominal = Number(nominal.replace(/\D/g, ''));
    if (!rawNominal || rawNominal <= 0) {
      setError('Nominal harus lebih dari Rp 0');
      return;
    }
    if (!keterangan.trim()) {
      setError('Keterangan pengeluaran wajib diisi');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/keuangan/kas-keluar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jenis_kas: jenis,
          tahun_ajaran_id: tahunId,
          nominal: rawNominal,
          tanggal,
          keterangan: keterangan.trim(),
          penerima: penerima.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Gagal mencatat pengeluaran kas');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      setNominal('');
      return;
    }
    setNominal(new Intl.NumberFormat('id-ID').format(Number(digits)));
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Kas Keluar"
      subtitle="Tambahkan transaksi pengeluaran kas operasional baru"
      width={560}
    >
      <form onSubmit={handleSubmit} className="buku-kas-modal-form">
        {error && (
          <div className="buku-kas-alert-banner">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Radio Cards Jenis Kas */}
        <div className="form-field-group">
          <label className="field-label">
            Jenis Kas <span className="req-star">*</span>
          </label>
          <div className="kas-jenis-selector-grid">
            {(Object.entries(JENIS_KAS_CONFIG) as [JenisKas, typeof JENIS_KAS_CONFIG[JenisKas]][]).map(
              ([k, cfg]) => {
                const isSelected = jenis === k;
                const IconComponent = cfg.Icon;
                return (
                  <button
                    key={k}
                    type="button"
                    className={`kas-radio-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setJenis(k)}
                  >
                    <div className="radio-card-top">
                      <div className={`radio-icon-orb ${cfg.orbClass}`}>
                        <IconComponent size={14} />
                      </div>
                      <span className="radio-label">{cfg.label}</span>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* 2. Nominal Input */}
        <div className="form-field-group">
          <label className="field-label">
            Nominal Pengeluaran <span className="req-star">*</span>
          </label>
          <div className="currency-input-pill">
            <span className="currency-prefix">Rp</span>
            <input
              type="text"
              className="currency-field"
              placeholder="0"
              value={nominal}
              onChange={handleNominalChange}
              required
              autoFocus
            />
          </div>
        </div>

        {/* 3. Tanggal & Penerima Row */}
        <div className="form-two-cols">
          <div className="form-field-group">
            <label className="field-label">
              Tanggal Transaksi <span className="req-star">*</span>
            </label>
            <input
              type="date"
              className="standard-glass-input"
              value={tanggal}
              onChange={e => setTanggal(e.target.value)}
              required
            />
          </div>

          <div className="form-field-group">
            <label className="field-label">
              Penerima Dana <span className="opt-tag">(Opsional)</span>
            </label>
            <input
              type="text"
              className="standard-glass-input"
              placeholder="Contoh: Toko Barokah / Ustadz Hasan"
              value={penerima}
              onChange={e => setPenerima(e.target.value)}
            />
          </div>
        </div>

        {/* 4. Keterangan */}
        <div className="form-field-group">
          <label className="field-label">
            Uraian / Keterangan Keperluan <span className="req-star">*</span>
          </label>
          <textarea
            className="standard-glass-textarea"
            rows={3}
            placeholder="Jelaskan rincian atau peruntukan pengeluaran ini..."
            value={keterangan}
            onChange={e => setKeterangan(e.target.value)}
            required
          />
        </div>

        {/* Modal Actions */}
        <div className="modal-footer-actions">
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="submit"
            className="action-pill-btn primary-pill"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="spinning-icon" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Simpan Pengeluaran</span>
              </>
            )}
          </button>
        </div>
      </form>
    </CustomModal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL: KONFIRMASI PEMBATALAN (VOID) KAS KELUAR
// ════════════════════════════════════════════════════════════════════════════
interface ModalVoidProps {
  isOpen: boolean;
  item: KasKeluarItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ModalVoidPengeluaran({
  isOpen,
  item,
  onClose,
  onSuccess,
}: ModalVoidProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token') ?? '';

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (!reason.trim()) {
      setError('Harap masukkan alasan pembatalan transaksi');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/keuangan/kas-keluar/${item.id}/void`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ void_reason: reason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Gagal membatalkan transaksi');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Batalkan Pengeluaran (Void)"
      subtitle="Konfirmasi pembatalan catatan transaksi kas keluar"
      width={480}
    >
      <form onSubmit={handleVoidSubmit} className="buku-kas-modal-form">
        <div className="void-warning-callout">
          <AlertTriangle size={18} className="warn-icon" />
          <div className="callout-text">
            <strong>Perhatian: Tindakan tidak dapat dikembalikan!</strong>
            <p>
              Transaksi sebesar <strong>{item ? rp(item.nominal) : '—'}</strong> ({item?.keterangan}) akan ditandai
              sebagai VOID dan dikeluarkan dari kalkulasi total kas.
            </p>
          </div>
        </div>

        {error && (
          <div className="buku-kas-alert-banner">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-field-group">
          <label className="field-label">
            Alasan Pembatalan <span className="req-star">*</span>
          </label>
          <textarea
            className="standard-glass-textarea"
            rows={3}
            placeholder="Contoh: Salah input nominal, transaksi ganda, dll."
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="modal-footer-actions">
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={onClose}
            disabled={loading}
          >
            Tutup
          </button>
          <button
            type="submit"
            className="action-pill-btn danger-pill"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="spinning-icon" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Konfirmasi Void</span>
              </>
            )}
          </button>
        </div>
      </form>
    </CustomModal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function BukuKas() {
  const [activeTab, setActiveTab] = useState<JenisKas>('kas_pondok');
  const [data, setData] = useState<KasKeluarItem[]>([]);
  const [summary, setSummary] = useState<BukuKasSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [tahunId, setTahunId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showTambahModal, setShowTambahModal] = useState(false);
  const [voidItem, setVoidItem] = useState<KasKeluarItem | null>(null);
  const [page, setPage] = useState(1);

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
      const [kasRes, sumRes] = await Promise.all([
        fetch(
          `/api/keuangan/kas-keluar?tahun_ajaran_id=${tahunId}&jenis_kas=${activeTab}&page=${page}&limit=50`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).then(r => r.json()),
        fetch(
          `/api/keuangan/kas-keluar/summary?tahun_ajaran_id=${tahunId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).then(r => r.json()),
      ]);
      setData(kasRes.data ?? []);
      setSummary(sumRes.summary ?? []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tahunId, activeTab, page, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summaryByJenis = (j: JenisKas) => summary.find(s => s.jenis_kas === j);

  const filtered = data.filter(d =>
    !search ||
    d.keterangan?.toLowerCase().includes(search.toLowerCase()) ||
    (d.penerima ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (d.nama_pencatat ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalFiltered = filtered
    .filter(d => !d.is_void)
    .reduce((acc, curr) => acc + Number(curr.nominal), 0);

  const tahunOptions = tahunList.map(t => ({
    value: t.id,
    label: `${t.kode}${t.is_active ? ' (Aktif)' : ''}`,
  }));

  return (
    <div className="buku-kas-container">
      {/* 🍏 1. APPLE FLOATING DOCK HEADER (Option A Standard - NO HEADER ICON) */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Buku Kas Keluar</h2>
          <p className="page-subtitle">
            Pencatatan dan monitoring realisasi pengeluaran kas operasional pondok & madin
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

          <button
            type="button"
            className="action-pill-btn primary-pill"
            onClick={() => setShowTambahModal(true)}
          >
            <Plus size={15} />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </header>

      {/* 📊 2. INTERACTIVE 4 KAS SUMMARY CARDS */}
      <div className="buku-kas-summary-grid">
        {(Object.entries(JENIS_KAS_CONFIG) as [JenisKas, typeof JENIS_KAS_CONFIG[JenisKas]][]).map(
          ([jenis, cfg]) => {
            const s = summaryByJenis(jenis);
            const isActive = activeTab === jenis;
            const IconComponent = cfg.Icon;
            const totalNominal = Number(s?.total ?? 0);
            const countTrans = Number(s?.jumlah ?? 0);

            return (
              <button
                key={jenis}
                type="button"
                className={`buku-kas-summary-card ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(jenis);
                  setPage(1);
                }}
              >
                <div className="card-top-row">
                  <div className="card-title-group">
                    <span className="card-label">{cfg.label}</span>
                    <span className="card-sublabel">{cfg.sublabel}</span>
                  </div>
                  <div className={`card-icon-orb ${cfg.orbClass}`}>
                    <IconComponent size={18} />
                  </div>
                </div>

                <div className="card-main-val">
                  {loading ? '...' : rp(totalNominal)}
                </div>

                <div className="card-meta-footer">
                  <span className="count-badge">
                    {loading ? '—' : `${countTrans} Transaksi`}
                  </span>
                  {isActive && <span className="active-indicator">Aktif Ditampilkan</span>}
                </div>
              </button>
            );
          }
        )}
      </div>

      {/* 📋 3. TABLE SECTION WITH INSET SEARCH & TOOLBAR */}
      <div className="buku-kas-table-card">
        <div className="table-section-toolbar">
          <div className="toolbar-left-group">
            <span className="active-kas-pill">
              Kategori: <strong>{JENIS_KAS_CONFIG[activeTab].label}</strong>
            </span>
            <span className="filtered-count-txt">
              Menampilkan {filtered.length} catatan
            </span>
          </div>

          <div className="toolbar-right-group">
            {/* Inset Search Pill */}
            <div className="search-pill-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Cari keterangan, penerima, atau admin..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch('')}
                  title="Hapus pencarian"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table responsive wrap */}
        <div className="table-responsive-wrapper">
          <table className="buku-kas-glass-table">
            <thead>
              <tr>
                <th style={{ width: 45 }}>#</th>
                <th style={{ width: 120 }}>Tanggal</th>
                <th>Keterangan / Keperluan</th>
                <th>Penerima Dana</th>
                <th className="cell-right" style={{ width: 150 }}>Nominal Keluar</th>
                <th>Dicatat Oleh</th>
                <th className="cell-center" style={{ width: 110 }}>Status</th>
                <th className="cell-center" style={{ width: 70 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan={8}>
                      <div className="table-skeleton-bar" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-empty-cell">
                    <FileText size={32} className="empty-icon" />
                    <p>Belum ada catatan pengeluaran untuk {JENIS_KAS_CONFIG[activeTab].label}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  return (
                    <tr key={item.id} className={item.is_void ? 'row-void' : ''}>
                      <td className="cell-muted">{idx + 1}</td>
                      <td className="cell-date font-numeric">{formatTgl(item.tanggal)}</td>
                      <td>
                        <div className="keterangan-cell">
                          <span className="keterangan-title">{item.keterangan}</span>
                          {item.is_void && (
                            <span className="void-reason-pill">
                              <AlertCircle size={10} />
                              VOID: {item.void_reason || 'Dibatalkan oleh pengelola'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {item.penerima ? (
                          <span className="penerima-tag">{item.penerima}</span>
                        ) : (
                          <span className="cell-muted">—</span>
                        )}
                      </td>
                      <td className={`cell-right font-numeric font-bold ${item.is_void ? 'cell-void-val' : 'cell-expense-val'}`}>
                        {rp(item.nominal)}
                      </td>
                      <td>
                        <span className="pencatat-txt">
                          {item.nama_pencatat || item.nama_bendahara || 'Admin'}
                        </span>
                      </td>
                      <td className="cell-center">
                        {item.is_void ? (
                          <span className="kas-status-badge badge-void">
                            <XCircle size={10} />
                            <span>Void</span>
                          </span>
                        ) : (
                          <span className="kas-status-badge badge-valid">
                            <CheckCircle2 size={10} />
                            <span>Valid</span>
                          </span>
                        )}
                      </td>
                      <td className="cell-center">
                        {!item.is_void && (
                          <button
                            type="button"
                            className="action-circle-btn danger-hover"
                            onClick={() => setVoidItem(item)}
                            title="Batalkan (Void) Pengeluaran"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4} className="footer-summary-label">
                    Total Pengeluaran Kas Valid ({JENIS_KAS_CONFIG[activeTab].label})
                  </td>
                  <td className="cell-right font-numeric font-bold footer-summary-val">
                    {rp(totalFiltered)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal Tambah Pengeluaran */}
      {showTambahModal && tahunId && (
        <ModalTambahPengeluaran
          isOpen={showTambahModal}
          tahunId={tahunId}
          initialJenis={activeTab}
          onClose={() => setShowTambahModal(false)}
          onSuccess={() => {
            setShowTambahModal(false);
            fetchData();
          }}
        />
      )}

      {/* Modal Void Pengeluaran */}
      {voidItem && (
        <ModalVoidPengeluaran
          isOpen={Boolean(voidItem)}
          item={voidItem}
          onClose={() => setVoidItem(null)}
          onSuccess={() => {
            setVoidItem(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

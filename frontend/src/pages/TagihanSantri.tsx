import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, CheckCircle2, Clock, XCircle, Minus,
  RefreshCw, AlertCircle, Banknote, X, Printer,
  Calendar, Layers, AlertTriangle, ArrowRight
} from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import {
  StatusTagihan,
  TabTagihan,
  KelasItem,
  TagihanItem,
  TahunAjaran,
  JenisIuranItem,
  PaginationState
} from '../types/keuangan';
import './TagihanSantri.scss';

// ─── Nama Bulan ────────────────────────────────────────────────────────────
const NAMA_BULAN: Record<number, string> = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April', 5: 'Mei', 6: 'Juni',
  7: 'Juli', 8: 'Agustus', 9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
};

// ─── Format Rupiah ─────────────────────────────────────────────────────────
function rp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

// ─── Status Badge Component ────────────────────────────────────────────────
function StatusBadge({ status }: { status: StatusTagihan }) {
  const map: Record<StatusTagihan, { label: string; className: string; Icon: React.ElementType }> = {
    lunas:       { label: 'Lunas',      className: 'badge-lunas',       Icon: CheckCircle2 },
    sebagian:    { label: 'Sebagian',   className: 'badge-sebagian',    Icon: Clock },
    belum_lunas: { label: 'Belum Lunas', className: 'badge-belum-lunas', Icon: XCircle },
    dibebaskan:  { label: 'Dibebaskan', className: 'badge-dibebaskan',  Icon: Minus },
  };
  const { label, className, Icon } = map[status] ?? map.belum_lunas;
  return (
    <span className={`tagihan-status-badge ${className}`}>
      <Icon size={11} />
      <span>{label}</span>
    </span>
  );
}

// ─── Modal Bayar (Catat Pembayaran) ────────────────────────────────────────
interface ModalBayarProps {
  tagihan: TagihanItem;
  tahunId: number;
  onClose: () => void;
  onSuccess: () => void;
}

function ModalBayar({ tagihan, tahunId, onClose, onSuccess }: ModalBayarProps) {
  const initialNominal = tagihan.sisa_tagihan > 0 ? tagihan.sisa_tagihan : tagihan.nominal_tagihan;
  const [nominal, setNominal] = useState(String(initialNominal));
  const [metode, setMetode] = useState<'tunai' | 'transfer' | 'qris'>('tunai');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cleanNominal = Number(nominal.replace(/\D/g, ''));
      if (cleanNominal <= 0) {
        throw new Error('Nominal pembayaran harus lebih besar dari 0');
      }

      const res = await fetch('/api/keuangan/pembayaran', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tagihan_id: tagihan.id,
          santri_id: tagihan.santri_id,
          jenis_iuran_id: tagihan.id,
          tahun_ajaran_id: tahunId,
          nominal: cleanNominal,
          metode_bayar: metode,
          keterangan,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Gagal mencatat pembayaran');

      onSuccess();

      const noKwitansi = json.pembayaran?.no_kwitansi;
      if (noKwitansi || json.pembayaran?.id) {
        window.open(`/keuangan/kwitansi/${json.pembayaran.id}`, '_blank');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomModal
      open={true}
      onClose={onClose}
      title="Catat Pembayaran Tagihan"
      subtitle="Input transaksi pembayaran & terbitkan kwitansi resmi"
      width={520}
      footer={
        <div className="modal-footer-dock">
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="button"
            className="action-pill-btn primary-pill"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="spinning-icon" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Simpan & Cetak Kwitansi</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="tagihan-modal-body">
        {/* Info Santri & Tagihan Card */}
        <div className="modal-santri-card">
          <div className="santri-row">
            <span className="lbl">Santri</span>
            <span className="val-santri">
              <strong>{tagihan.nama_santri}</strong>
              <span className="nis-chip">NIS: {tagihan.nis}</span>
            </span>
          </div>

          <div className="santri-row">
            <span className="lbl">Iuran</span>
            <span className="val">
              {tagihan.nama_iuran}
              {tagihan.periode_bulan ? (
                <span className="periode-text"> — {NAMA_BULAN[tagihan.periode_bulan]} {tagihan.periode_tahun}</span>
              ) : ''}
            </span>
          </div>

          <div className="santri-row-grid">
            <div className="sub-stat">
              <span className="lbl">Total Tagihan</span>
              <span className="val-num">{rp(tagihan.nominal_tagihan)}</span>
            </div>
            {tagihan.total_dibayar > 0 && (
              <div className="sub-stat">
                <span className="lbl">Sudah Dibayar</span>
                <span className="val-num text-emerald">{rp(tagihan.total_dibayar)}</span>
              </div>
            )}
            <div className="sub-stat">
              <span className="lbl">Sisa Tagihan</span>
              <span className="val-num text-rose">{rp(Math.max(0, tagihan.sisa_tagihan))}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="modal-alert-error">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <div className="modal-form-inputs">
          <div className="form-item">
            <label className="form-label">
              Nominal Pembayaran <span className="req">*</span>
            </label>
            <div className="currency-input-wrap">
              <span className="prefix">Rp</span>
              <input
                type="text"
                value={nominal}
                onChange={e => setNominal(e.target.value.replace(/\D/g, ''))}
                className="currency-input"
                placeholder="0"
                required
                autoFocus
              />
            </div>

            {/* Quick Fill Shortcut Buttons */}
            <div className="quick-fill-chips">
              <button
                type="button"
                className="chip-btn chip-lunasi"
                onClick={() => setNominal(String(tagihan.sisa_tagihan))}
              >
                Lunasi ({rp(tagihan.sisa_tagihan)})
              </button>
              {[100000, 200000, 350000].map(n => (
                <button
                  key={n}
                  type="button"
                  className="chip-btn"
                  onClick={() => setNominal(String(n))}
                >
                  {rp(n)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-item">
            <label className="form-label">Metode Pembayaran</label>
            <div className="metode-segmented-control">
              {(['tunai', 'transfer', 'qris'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  className={`metode-btn ${metode === m ? 'active' : ''}`}
                  onClick={() => setMetode(m)}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="form-item">
            <label className="form-label">
              Catatan / Keterangan <span className="opt">(opsional)</span>
            </label>
            <input
              type="text"
              className="glass-text-input"
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              placeholder="Contoh: Titip via wali santri / transfer bank"
            />
          </div>
        </div>
      </div>
    </CustomModal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function TagihanSantri() {
  const [tab, setTab] = useState<TabTagihan>('spp_makan');
  const [tagihan, setTagihan] = useState<TagihanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [tahunId, setTahunId] = useState<number | null>(null);
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahunKal, setTahunKal] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('semua');
  const [search, setSearch] = useState('');
  const [selectedTagihan, setSelectedTagihan] = useState<TagihanItem | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ total: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);
  const [eventTypeList, setEventTypeList] = useState<JenisIuranItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  // VisionOS Confirm Dialog State (Replaces window.confirm)
  const [generateConfirm, setGenerateConfirm] = useState<{
    isOpen: boolean;
    type: 'spp' | 'du' | 'event';
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'spp',
    title: '',
    description: '',
  });

  const token = localStorage.getItem('token');

  // Load tahun ajaran
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

  // Load kelas (Madrasah Diniyah only)
  useEffect(() => {
    if (!tahunId) return;
    fetch(`/api/kelas?tahun_ajaran_id=${tahunId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((list: KelasItem[]) => {
        const diniyahOnly = Array.isArray(list) ? list.filter(k => k.jenis === 'Diniyah') : [];
        setKelasList(diniyahOnly);
      })
      .catch(() => setKelasList([]));
  }, [tahunId, token]);

  // Load event types
  useEffect(() => {
    fetch('/api/keuangan/jenis-iuran', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((list: JenisIuranItem[]) => {
        if (Array.isArray(list)) {
          const events = list.filter(item => item.kategori === 'event' && item.is_active);
          setEventTypeList(events);
          if (events.length > 0) setSelectedEventId(events[0].id);
        }
      })
      .catch(() => setEventTypeList([]));
  }, [token]);

  // Fetch tagihan
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
      } else if (tab === 'daftar_ulang') {
        params.set('kategori', 'daftar_ulang_baru,daftar_ulang_lama');
      } else {
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

  useEffect(() => {
    fetchTagihan();
  }, [fetchTagihan]);

  // Execute Generation after VisionOS confirmation
  const executeGenerate = async () => {
    if (!tahunId) return;
    setGenerating(true);
    setGenerateMsg('');
    const genType = generateConfirm.type;
    setGenerateConfirm(prev => ({ ...prev, isOpen: false }));

    try {
      let endpoint = '';
      let bodyData: Record<string, unknown> = {};

      if (genType === 'spp') {
        endpoint = '/api/keuangan/tagihan/generate-spp';
        bodyData = { tahun_ajaran_id: tahunId, bulan, tahun: tahunKal };
      } else if (genType === 'du') {
        endpoint = '/api/keuangan/tagihan/generate-du';
        bodyData = { tahun_ajaran_id: tahunId };
      } else if (genType === 'event') {
        if (!selectedEventId) return;
        endpoint = '/api/keuangan/tagihan/generate-event';
        bodyData = { tahun_ajaran_id: tahunId, jenis_iuran_id: selectedEventId };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bodyData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Gagal memproses pembuatan tagihan massal');
      setGenerateMsg(`✅ ${json.message}`);
      fetchTagihan();
    } catch (e: unknown) {
      setGenerateMsg(`❌ ${e instanceof Error ? e.message : 'Gagal memproses pembuatan tagihan massal'}`);
    } finally {
      setGenerating(false);
    }
  };

  // Trigger Confirmation Prompts
  const openGenerateSPPModal = () => {
    setGenerateConfirm({
      isOpen: true,
      type: 'spp',
      title: 'Generate Tagihan SPP Massal',
      description: `Apakah Anda yakin ingin membuat tagihan ${tab === 'spp_makan' ? 'SPP Makan' : 'SPP Madin'} untuk seluruh santri aktif periode ${NAMA_BULAN[bulan]} ${tahunKal}? Tagihan yang sudah ada tidak akan digandakan.`,
    });
  };

  const openGenerateDUModal = () => {
    setGenerateConfirm({
      isOpen: true,
      type: 'du',
      title: 'Generate Tagihan Daftar Ulang',
      description: 'Apakah Anda yakin ingin membuat tagihan Daftar Ulang (Santri Baru & Santri Lama) untuk seluruh santri aktif? Tagihan yang telah dibuat sebelumnya tidak akan terduplikasi.',
    });
  };

  const openGenerateEventModal = () => {
    const eventName = eventTypeList.find(e => e.id === selectedEventId)?.nama ?? 'Event';
    setGenerateConfirm({
      isOpen: true,
      type: 'event',
      title: `Generate Tagihan Event "${eventName}"`,
      description: `Apakah Anda yakin ingin menerbitkan tagihan event "${eventName}" untuk seluruh santri aktif? Tagihan yang sudah tercatat tidak akan digandakan.`,
    });
  };

  // Filter pencarian lokal
  const filtered = tagihan.filter(t =>
    !search || t.nama_santri.toLowerCase().includes(search.toLowerCase()) || t.nis.includes(search)
  );

  // Ringkasan metrik
  const totalTagihan = filtered.reduce((s, t) => s + t.nominal_tagihan, 0);
  const totalDibayar = filtered.reduce((s, t) => s + t.total_dibayar, 0);
  const totalSisa    = filtered.reduce((s, t) => s + Math.max(0, t.sisa_tagihan), 0);
  const pctRealisasi = totalTagihan > 0 ? Math.round((totalDibayar / totalTagihan) * 100) : 0;

  const tahunOptions = tahunList.map(t => ({
    value: t.id,
    label: `${t.kode}${t.is_active ? ' (Aktif)' : ''}`,
  }));

  const statusOptions = [
    { value: 'semua', label: 'Semua Status' },
    { value: 'belum_lunas', label: 'Belum Lunas' },
    { value: 'sebagian', label: 'Sebagian' },
    { value: 'lunas', label: 'Lunas' },
    { value: 'dibebaskan', label: 'Dibebaskan' },
  ];

  const bulanOptions = Object.entries(NAMA_BULAN).map(([n, nama]) => ({
    value: Number(n),
    label: nama,
  }));

  const tahunKalOptions = [2024, 2025, 2026, 2027].map(y => ({
    value: y,
    label: String(y),
  }));

  const eventOptions = eventTypeList.map(evt => ({
    value: evt.id,
    label: evt.nama,
  }));

  return (
    <div className="tagihan-page-container">
      {/* 🍏 1. APPLE FLOATING DOCK HEADER (Option A Standard - NO HEADER ICON) */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Tagihan Santri</h2>
          <p className="page-subtitle">
            Kelola invoice SPP bulanan, daftar ulang, dan tagihan event insidental santri
          </p>
        </div>

        <div className="header-action-dock">
          <div style={{ width: 170 }}>
            <CustomSelect
              value={tahunId}
              onChange={val => { setTahunId(Number(val)); setPage(1); }}
              options={tahunOptions}
              placeholder="Pilih Tahun Ajaran"
              size="md"
            />
          </div>

          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={fetchTagihan}
            disabled={loading}
            title="Segarkan Data Tagihan"
          >
            <RefreshCw size={14} className={loading ? 'spinning-icon' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </header>

      {/* 🍏 2. APPLE SEGMENTED CONTROL TABS */}
      <div className="tactile-segmented-control" role="tablist">
        {([
          ['spp_makan', 'SPP Makan'],
          ['spp_madin', 'SPP Madin'],
          ['daftar_ulang', 'Daftar Ulang'],
          ['event', 'Event Insidental'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`segment-btn ${tab === id ? 'active' : ''}`}
            onClick={() => { setTab(id); setPage(1); }}
          >
            <Layers size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 🏫 3. KELAS CHIPS DOCK (Minimalist Translucent Scrolling Pills) */}
      <div className="tagihan-kelas-dock">
        <button
          type="button"
          className={`kelas-chip ${selectedKelasId === null ? 'active' : ''}`}
          onClick={() => { setSelectedKelasId(null); setPage(1); }}
        >
          Semua Kelas
        </button>
        {kelasList.map(k => (
          <button
            key={k.id}
            type="button"
            className={`kelas-chip ${selectedKelasId === k.id ? 'active' : ''}`}
            onClick={() => { setSelectedKelasId(k.id); setPage(1); }}
          >
            {k.nama}
          </button>
        ))}
      </div>

      {/* 🔍 4. INSET FROSTED FILTER BAR & ACTION DOCK */}
      <div className="tagihan-toolbar-dock">
        <div className="toolbar-left-group">
          {/* Inset Search Pill */}
          <div className="search-pill-wrapper">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Cari nama santri / NIS..."
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

          {/* Status Filter */}
          <div style={{ width: 150 }}>
            <CustomSelect
              value={statusFilter}
              onChange={val => { setStatusFilter(String(val)); setPage(1); }}
              options={statusOptions}
              placeholder="Filter Status"
              size="md"
            />
          </div>

          {/* Month & Year Filters (Only for SPP) */}
          {(tab === 'spp_makan' || tab === 'spp_madin') && (
            <>
              <div style={{ width: 140 }}>
                <CustomSelect
                  value={bulan}
                  onChange={val => { setBulan(Number(val)); setPage(1); }}
                  options={bulanOptions}
                  placeholder="Pilih Bulan"
                  size="md"
                />
              </div>
              <div style={{ width: 110 }}>
                <CustomSelect
                  value={tahunKal}
                  onChange={val => { setTahunKal(Number(val)); setPage(1); }}
                  options={tahunKalOptions}
                  placeholder="Tahun"
                  size="md"
                />
              </div>
            </>
          )}

          {/* Event Filter (Only for Event) */}
          {tab === 'event' && (
            <div style={{ width: 190 }}>
              <CustomSelect
                value={selectedEventId}
                onChange={val => { setSelectedEventId(Number(val)); setPage(1); }}
                options={eventOptions}
                placeholder="Pilih Jenis Event"
                size="md"
              />
            </div>
          )}
        </div>

        <div className="toolbar-right-group">
          {/* Generate SPP Button */}
          {(tab === 'spp_makan' || tab === 'spp_madin') && (
            <button
              type="button"
              className="action-pill-btn primary-pill"
              onClick={openGenerateSPPModal}
              disabled={generating}
            >
              {generating ? (
                <>
                  <RefreshCw size={14} className="spinning-icon" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Plus size={15} />
                  <span>Generate SPP {NAMA_BULAN[bulan]}</span>
                </>
              )}
            </button>
          )}

          {/* Generate Daftar Ulang Button */}
          {tab === 'daftar_ulang' && (
            <button
              type="button"
              className="action-pill-btn primary-pill"
              onClick={openGenerateDUModal}
              disabled={generating}
            >
              {generating ? (
                <>
                  <RefreshCw size={14} className="spinning-icon" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Plus size={15} />
                  <span>Generate Daftar Ulang</span>
                </>
              )}
            </button>
          )}

          {/* Generate Event Button */}
          {tab === 'event' && (
            <button
              type="button"
              className="action-pill-btn primary-pill"
              onClick={openGenerateEventModal}
              disabled={generating || !selectedEventId}
            >
              {generating ? (
                <>
                  <RefreshCw size={14} className="spinning-icon" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Plus size={15} />
                  <span>Generate Event</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── GENERATE STATUS MESSAGE BANNER ──────────────────────── */}
      {generateMsg && (
        <div className={`tagihan-alert ${generateMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>
          {generateMsg.startsWith('✅') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{generateMsg}</span>
        </div>
      )}

      {/* 📊 5. FINANCIAL KPI SUMMARY DOCK */}
      <div className="tagihan-summary-grid">
        <div className="summary-glass-card card-total">
          <span className="summary-label">Total Tagihan</span>
          <span className="summary-value">{rp(totalTagihan)}</span>
          <span className="summary-sub">{filtered.length} santri terdaftar</span>
        </div>

        <div className="summary-glass-card card-dibayar">
          <span className="summary-label">Terkumpul</span>
          <span className="summary-value text-emerald">{rp(totalDibayar)}</span>
          <span className="summary-sub">Penerimaan masuk</span>
        </div>

        <div className="summary-glass-card card-sisa">
          <span className="summary-label">Sisa / Tunggakan</span>
          <span className="summary-value text-rose">{rp(totalSisa)}</span>
          <span className="summary-sub">Tunggakan aktif</span>
        </div>

        <div className="summary-glass-card card-pct">
          <span className="summary-label">Tingkat Realisasi</span>
          <span className="summary-value text-sapphire">{pctRealisasi}%</span>
          <div className="summary-pct-bar">
            <div className="pct-fill" style={{ width: `${pctRealisasi}%` }} />
          </div>
        </div>
      </div>

      {/* 💎 6. VISIONOS LIQUID GLASS TABLE CONTAINER */}
      <div className="tagihan-table-card">
        <div className="table-responsive-wrapper">
          <table className="tagihan-glass-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Santri</th>
                <th>Jenis Iuran</th>
                {(tab === 'spp_makan' || tab === 'spp_madin') && <th>Periode</th>}
                <th className="cell-right">Tagihan</th>
                <th className="cell-right">Dibayar</th>
                <th className="cell-right">Sisa</th>
                <th className="cell-center">Status</th>
                <th className="cell-center" style={{ width: 140 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: (tab === 'spp_makan' || tab === 'spp_madin') ? 9 : 8 }).map((_, j) => (
                      <td key={j}><div className="td-skeleton" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={(tab === 'spp_makan' || tab === 'spp_madin') ? 9 : 8}
                    className="table-empty-cell"
                  >
                    <div className="empty-state-wrap">
                      <div className="empty-icon-orb">
                        <CheckCircle2 size={28} />
                      </div>
                      <p className="empty-title">Tidak ada tagihan ditemukan</p>
                      <p className="empty-subtitle">
                        Silakan pilih kelas lain atau klik tombol Generate untuk membuat tagihan periode ini.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((t, i) => {
                  const initial = t.nama_santri ? t.nama_santri.charAt(0).toUpperCase() : '?';
                  return (
                    <tr key={t.id}>
                      <td className="cell-muted">{(page - 1) * 50 + i + 1}</td>
                      <td>
                        <div className="santri-cell-group">
                          <div className="santri-avatar-orb">
                            {initial}
                          </div>
                          <div className="santri-name-column">
                            <span className="santri-name">{t.nama_santri}</span>
                            <span className="santri-nis-pill">NIS: {t.nis}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="iuran-name">{t.nama_iuran}</span>
                      </td>
                      {(tab === 'spp_makan' || tab === 'spp_madin') && (
                        <td className="cell-muted">
                          {t.periode_bulan ? `${NAMA_BULAN[t.periode_bulan]} ${t.periode_tahun}` : '—'}
                        </td>
                      )}
                      <td className="cell-right font-numeric">{rp(t.nominal_tagihan)}</td>
                      <td className={`cell-right font-numeric ${t.total_dibayar > 0 ? 'text-emerald' : 'cell-muted'}`}>
                        {rp(t.total_dibayar)}
                      </td>
                      <td className={`cell-right font-numeric ${t.sisa_tagihan > 0 ? 'text-rose' : 'cell-muted'}`}>
                        {t.status === 'dibebaskan' ? '—' : rp(Math.max(0, t.sisa_tagihan))}
                      </td>
                      <td className="cell-center">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="cell-center">
                        <div className="cell-action-row">
                          {t.status !== 'lunas' && t.status !== 'dibebaskan' && (
                            <button
                              type="button"
                              className="table-act-pill pill-pay"
                              onClick={() => setSelectedTagihan(t)}
                              title="Catat Pembayaran"
                            >
                              <Banknote size={13} />
                              <span>Bayar</span>
                            </button>
                          )}
                          {t.pembayaran_id && (
                            <button
                              type="button"
                              className="table-act-pill pill-print"
                              title="Cetak Kwitansi Resmi"
                              onClick={() => window.open(`/keuangan/kwitansi/${t.pembayaran_id}`, '_blank')}
                            >
                              <Printer size={13} />
                              <span>Cetak</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={(tab === 'spp_makan' || tab === 'spp_madin') ? 4 : 3} className="footer-title">
                    TOTAL ({filtered.length} tagihan)
                  </td>
                  <td className="cell-right font-numeric"><strong>{rp(totalTagihan)}</strong></td>
                  <td className="cell-right font-numeric text-emerald"><strong>{rp(totalDibayar)}</strong></td>
                  <td className="cell-right font-numeric text-rose"><strong>{rp(totalSisa)}</strong></td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Dock */}
        {pagination.total_pages > 1 && (
          <div className="tagihan-pagination-dock">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="action-pill-btn secondary-pill"
            >
              ← Sebelumnya
            </button>
            <span className="pagination-info">
              Halaman <strong>{page}</strong> dari <strong>{pagination.total_pages}</strong> ({pagination.total} total data)
            </span>
            <button
              type="button"
              disabled={page >= pagination.total_pages}
              onClick={() => setPage(p => p + 1)}
              className="action-pill-btn secondary-pill"
            >
              Berikutnya →
            </button>
          </div>
        )}
      </div>

      {/* ── MODAL BAYAR ────────────────────────────────────────── */}
      {selectedTagihan && tahunId && (
        <ModalBayar
          tagihan={selectedTagihan}
          tahunId={tahunId}
          onClose={() => setSelectedTagihan(null)}
          onSuccess={() => {
            setSelectedTagihan(null);
            fetchTagihan();
          }}
        />
      )}

      {/* ⚠️ VISIONOS TACTILE CONFIRMATION MODAL (Replaces window.confirm) */}
      <CustomModal
        open={generateConfirm.isOpen}
        onClose={() => setGenerateConfirm(prev => ({ ...prev, isOpen: false }))}
        title={generateConfirm.title}
        width={460}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button
              type="button"
              className="action-pill-btn secondary-pill"
              onClick={() => setGenerateConfirm(prev => ({ ...prev, isOpen: false }))}
            >
              Batal
            </button>
            <button
              type="button"
              className="action-pill-btn primary-pill"
              onClick={executeGenerate}
            >
              <span>Ya, Generate Tagihan</span>
              <ArrowRight size={14} />
            </button>
          </div>
        }
      >
        <div className="visionos-confirm-dialog">
          <div className="dialog-icon-halo halo-sapphire">
            <AlertTriangle size={26} />
          </div>
          <div className="dialog-text-content">
            <h4>{generateConfirm.title}</h4>
            <p>{generateConfirm.description}</p>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

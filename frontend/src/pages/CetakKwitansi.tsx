import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, X, AlertCircle, CheckCircle } from 'lucide-react';
import './CetakKwitansi.scss';

interface KwitansiData {
  id: number;
  no_kwitansi: string;
  nama_santri: string;
  nis: string;
  kelas_diniyah?: string;
  nama_iuran: string;
  nominal: number;
  nominal_terbilang: string;
  metode_bayar: string;
  tanggal_bayar: string;
  nama_bendahara: string;
  kode_tahun_ajaran: string;
  periode_bulan?: number;
  periode_tahun?: number;
  nama_lembaga: string;
  is_valid: boolean;
  is_void: boolean;
  keterangan?: string;
}

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

function formatTanggal(d: string): string {
  const date = new Date(d);
  return `${date.getDate()} ${NAMA_BULAN[date.getMonth() + 1]} ${date.getFullYear()}`;
}

export default function CetakKwitansi() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<KwitansiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('token') ?? '';

  useEffect(() => {
    if (!id) return;
    fetch(`/api/keuangan/pembayaran/${id}/kwitansi`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error ?? 'Gagal memuat kwitansi');
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="kwitansi-loading">
        <div className="k-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p>Memuat kwitansi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kwitansi-error">
        <AlertCircle size={40} style={{ color: '#DC3545' }} />
        <h2>Kwitansi tidak ditemukan</h2>
        <p>{error}</p>
        <button className="k-btn-ghost" onClick={() => window.close()}>Tutup</button>
      </div>
    );
  }

  if (!data) return null;

  const renderKwitansiDoc = (isCopy: boolean) => {
    return (
      <div className={`kwitansi-doc ${isCopy ? 'kwitansi-doc--copy' : ''}`}>
        {isCopy && <div className="kwitansi-copy-badge">SALINAN ARSIP BENDAHARA</div>}
        
        {/* Kolom 1: Logo & Info Lembaga */}
        <div className="kwitansi-col kwitansi-col--left">
          <div className="kwitansi-header-logo-group">
            <div className="kwitansi-header__logo-circle">
              <span>AH</span>
            </div>
            <div className="kwitansi-header__lembaga">
              <h1>{data.nama_lembaga}</h1>
              <p className="address">H. Abdul Hamid No. 1, Jakarta Selatan</p>
            </div>
          </div>
          <div className="kwitansi-doc-title-box">
            <h2 className="doc-title">{isCopy ? 'SALINAN ARSIP' : 'KWITANSI PEMBAYARAN'}</h2>
          </div>
          <div className="kwitansi-no-info">
            <div className="kwitansi-no-info__row">
              <span className="label">No. KWT</span>
              <strong className="val">{data.no_kwitansi}</strong>
            </div>
            <div className="kwitansi-no-info__row">
              <span className="label">T.A.</span>
              <strong className="val">{data.kode_tahun_ajaran}</strong>
            </div>
          </div>
        </div>

        {/* Kolom 2: Rincian Pembayaran */}
        <div className="kwitansi-col kwitansi-col--center">
          <div className="kwitansi-row">
            <span>Diterima Dari</span>
            <strong>{data.nama_santri}</strong>
          </div>
          <div className="kwitansi-row">
            <span>NIS / Kelas</span>
            <strong>{data.nis} {data.kelas_diniyah ? `/ ${data.kelas_diniyah}` : ''}</strong>
          </div>
          <div className="kwitansi-row">
            <span>Pembayaran</span>
            <strong>
              {data.nama_iuran}
              {data.periode_bulan
                ? ` — ${NAMA_BULAN[data.periode_bulan]} ${data.periode_tahun}`
                : ''}
            </strong>
          </div>
          {data.keterangan && (
            <div className="kwitansi-row">
              <span>Keterangan</span>
              <strong>{data.keterangan}</strong>
            </div>
          )}
          <div className="kwitansi-row-group">
            <div className="kwitansi-row half">
              <span>Metode</span>
              <strong style={{ textTransform: 'capitalize' }}>{data.metode_bayar}</strong>
            </div>
            <div className="kwitansi-row half">
              <span>Tanggal</span>
              <strong>{formatTanggal(data.tanggal_bayar)}</strong>
            </div>
          </div>
        </div>

        {/* Kolom 3: Nominal & TTD */}
        <div className="kwitansi-col kwitansi-col--right">
          <div className="kwitansi-nominal-box">
            <div className="kwitansi-nominal-box__label">NOMINAL PEMBAYARAN</div>
            <div className="kwitansi-nominal-box__value">{rp(data.nominal)}</div>
          </div>
          <div className="kwitansi-nominal-terbilang">
            <span>Terbilang:</span> <em>"{data.nominal_terbilang} Rupiah"</em>
          </div>
          <div className="kwitansi-signature">
            <div className="kwitansi-signature__space" />
            <div className="kwitansi-signature__name">{data.nama_bendahara}</div>
            <div className="kwitansi-signature__role">Bendahara</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="kwitansi-page">
      {/* ── Toolbar (tidak tercetak) ─────────────────────────── */}
      <div className="kwitansi-toolbar no-print">
        <div className="kwitansi-toolbar__info">
          {data.is_void ? (
            <span className="kwitansi-status kwitansi-status--void">
              <X size={14} /> DIBATALKAN (VOID)
            </span>
          ) : (
            <span className="kwitansi-status kwitansi-status--valid">
              <CheckCircle size={14} /> Kwitansi Aktif
            </span>
          )}
          <span className="kwitansi-no">{data.no_kwitansi}</span>
        </div>
        <div className="kwitansi-toolbar__actions">
          <button className="k-btn-ghost" onClick={() => window.close()}>
            <X size={14} /> Tutup
          </button>
          <button className="k-btn-primary" onClick={handlePrint} disabled={data.is_void}>
            <Printer size={14} /> Cetak Kwitansi (F4/3)
          </button>
        </div>
      </div>

      {/* ── Area Cetak ──────────────────────────────────────── */}
      <div className="kwitansi-preview" ref={printRef}>
        {/* VOID WATERMARK */}
        {data.is_void && (
          <div className="kwitansi-void-watermark">DIBATALKAN</div>
        )}

        {/* KWITANSI UTAMA (ASLI) */}
        {renderKwitansiDoc(false)}
      </div>
    </div>
  );
}

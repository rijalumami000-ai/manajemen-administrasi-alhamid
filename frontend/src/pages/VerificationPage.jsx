import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, User } from 'lucide-react';
import { LoadingState } from '../components/common/LoadingState';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function VerificationPage() {
  const { no_peserta } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/public/verify/${no_peserta}`);
        const result = await res.json();
        
        if (!res.ok) {
          throw new Error(result.error || 'Gagal memuat data verifikasi.');
        }
        
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (no_peserta) {
      fetchData();
    }
  }, [no_peserta]);

  const formatTGL = (tgl) => {
    if (!tgl) return '-';
    return new Date(tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const ttl = data ? [data.tempat_lahir, formatTGL(data.tanggal_lahir)].filter(Boolean).join(', ') : '-';

  if (loading) return <LoadingState message="Memverifikasi Data..." />;

  if (error || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
        <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', textAlign: 'center', border: '1px solid #cbd5e1', maxWidth: '400px' }}>
          <XCircle size={56} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Verifikasi Gagal</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{error || 'Data peserta tidak ditemukan.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <CheckCircle2 size={48} style={{ color: '#16a34a', marginBottom: '12px' }} />
          <h2 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '20px' }}>Kartu Terverifikasi</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Data peserta ujian ini resmi terdaftar di sistem.</p>
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px', textAlign: 'center', marginBottom: '20px', color: '#166534', fontWeight: 600, fontSize: '13px' }}>
          PESERTA UJIAN SEMESTER
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
          {data.foto_url ? (
            <img 
              src={`${API_BASE}${data.foto_url}`} 
              alt="Foto Santri" 
              style={{ width: '90px', height: '115px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          ) : (
            <div style={{ width: '90px', height: '115px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <User size={36} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>NAMA LENGKAP</span>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{data.nama || '-'}</div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>NO. PESERTA</span>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2196f3', fontFamily: 'monospace' }}>{data.no_peserta || '-'}</div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>NIS</span>
              <div style={{ fontSize: '13px', color: '#334155' }}>{data.nis || '-'}</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Kelas:</span>
            <strong>{data.nama_kelas || '-'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Jenis Kelamin:</span>
            <strong>{data.jenis_kelamin === 'L' ? 'Laki-laki' : data.jenis_kelamin === 'P' ? 'Perempuan' : (data.jenis_kelamin || '-')}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>TTL:</span>
            <strong>{ttl}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Alamat:</span>
            <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{data.alamat || '-'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

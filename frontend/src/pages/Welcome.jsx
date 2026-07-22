import React from 'react';
import { BookOpen, FileText, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';

export function Welcome() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  return (
    <div style={{
      padding: isMobile ? 16 : 24,
      background: 'var(--lt-bg-main, #f8fafc)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: 480,
        width: '100%',
        borderRadius: 16,
        background: '#fff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        textAlign: 'center',
        padding: isMobile ? '20px' : '32px'
      }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <img 
            src="/logo-pondok.png" 
            alt="Logo Pondok" 
            style={{ width: 80, height: 80, objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        <h2 style={{ color: '#0f172a', marginBottom: 8, fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold' }}>
          Selamat datang Ustadz dan Ustadzoh 😊
        </h2>

        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: 24 }}>
          Sistem Informasi Online dan terintegrasi Madrasah Diniyah Ponpes Al-Hamid.
        </p>

        <div style={{ height: '1px', background: '#e2e8f0', margin: '24px 0' }} />

        <h4 style={{ textAlign: 'left', marginBottom: 16, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
          Pilih Menu Untuk Memulai:
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <button
            type="button"
            className="btn-custom btn-primary"
            onClick={() => navigate('/nilai')}
            style={{ height: 48, fontSize: '15px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <BookOpen size={18} /> Input Penilaian
          </button>

          <button
            type="button"
            className="btn-custom btn-secondary"
            onClick={() => navigate('/laporan-ujian-khusus')}
            style={{ height: 48, fontSize: '15px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <FileText size={18} /> Laporan Ujian
          </button>
        </div>

        <div style={{ marginTop: 28, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            💡 <strong>Tips:</strong> Tambahkan halaman ini ke Layar Utama HP Anda untuk akses lebih cepat di kemudian hari.
          </span>
        </div>
      </div>
    </div>
  );
}

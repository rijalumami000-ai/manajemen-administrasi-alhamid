import React, { useState } from 'react';
import { FileText, Edit2, ArrowRight, Lock, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import { CustomModal } from '../components/ui/CustomModal';
import { FloatingInput } from '../components/ui/FloatingInput';

export function UjianMenu() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAccess = (e) => {
    if (e) e.preventDefault();
    if (accessCode === 'madin123') {
      setIsModalVisible(false);
      setAccessCode('');
      setErrorMsg('');
      navigate('/lembar-ujian');
    } else {
      setErrorMsg('Kode akses salah!');
    }
  };

  return (
    <div style={{
      padding: isMobile ? 16 : 24,
      background: 'var(--lt-bg-main, #f8fafc)',
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: isMobile ? 40 : 60
    }}>
      <div style={{ maxWidth: 500, width: '100%' }}>
        <h2 style={{ color: '#0f172a', marginBottom: 8, textAlign: 'center', fontWeight: 'bold', fontSize: '22px' }}>
          Menu Ujian
        </h2>
        <p style={{ display: 'block', textAlign: 'center', marginBottom: 32, color: '#64748b', fontSize: '14px' }}>
          Pilih kategori untuk mulai kelola ujian
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          {/* Kartu 1: Input Soal */}
          <div
            onClick={() => setIsModalVisible(true)}
            style={{
              background: '#fff',
              padding: '16px 20px',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              borderLeft: '4px solid #2196f3',
              transition: 'all 0.2s'
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              background: '#e3f2fd',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2196f3',
              marginRight: 16
            }}>
              <FileText size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: 16, color: '#0f172a' }}>Input Soal</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Buat dan kelola lembar soal ujian santri.</div>
            </div>
            <div style={{ color: '#94a3b8' }}>
              <ArrowRight size={18} />
            </div>
          </div>

          {/* Kartu 2: Input Nilai */}
          <div
            style={{
              background: '#f1f5f9',
              padding: '16px 20px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'not-allowed',
              borderLeft: '4px solid #cbd5e1',
              opacity: 0.7
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              background: '#e2e8f0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              marginRight: 16
            }}>
              <Edit2 size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: 16, color: '#64748b' }}>Input Nilai <span style={{ color: '#f59e0b', fontSize: '12px' }}>(Parkir)</span></div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Input nilai ujian semester (Dalam Perbaikan).</div>
            </div>
            <div style={{ color: '#94a3b8' }}>
              <Lock size={18} />
            </div>
          </div>
        </div>
      </div>

      <CustomModal
        open={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setAccessCode('');
          setErrorMsg('');
        }}
        title="Verifikasi Tim Ujian"
        subtitle="Masukkan kode akses khusus tim ujian untuk melanjutkan"
        icon={<KeyRound />}
        width={420}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn-custom btn-secondary" onClick={() => setIsModalVisible(false)}>
              Batal
            </button>
            <button type="button" className="btn-custom btn-primary" onClick={handleAccess}>
              Masuk
            </button>
          </div>
        }
      >
        <form onSubmit={handleAccess} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <FloatingInput
            label="Kode Akses Tim Ujian"
            name="accessCode"
            type="password"
            icon={Lock}
            value={accessCode}
            onChange={(e) => { setAccessCode(e.target.value); setErrorMsg(''); }}
            error={errorMsg}
            required
            autoFocus
          />
        </form>
      </CustomModal>
    </div>
  );
}

export default UjianMenu;

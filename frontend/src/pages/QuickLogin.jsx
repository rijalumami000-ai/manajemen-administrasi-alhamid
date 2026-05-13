import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin, message } from 'antd';

export function QuickLogin() {
  const { key } = useParams();
  const { magicLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleQuickLogin = async () => {
      // Kita tetapkan kode rahasianya adalah 'guru-alhamid'
      if (key === 'guru-alhamid') {
        if (typeof magicLogin !== 'function') {
          message.error('Sistem belum diperbarui di browser Anda. Silakan lakukan refresh penuh (Ctrl+F5 atau tarik layar ke bawah).');
          return;
        }
        
        const result = await magicLogin(key);
        
        if (result.success) {
          message.success('Berhasil masuk menggunakan Akses Cepat!');
          navigate('/welcome');
        } else {
          message.error(`Gagal masuk: ${result.error || 'Akun mungkin belum siap.'}`);
          navigate('/login');
        }
      } else {
        message.error('Kode Akses Cepat tidak valid!');
        navigate('/login');
      }
    };

    handleQuickLogin();
  }, [key, magicLogin, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <Spin size="large" />
      <div>Memproses Akses Cepat, mohon tunggu...</div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/common/LoadingState';

export function QuickLogin() {
  const { key } = useParams();
  const { magicLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleQuickLogin = async () => {
      if (key === 'guru-alhamid') {
        if (typeof magicLogin !== 'function') {
          alert('Sistem belum diperbarui di browser Anda.');
          return;
        }
        
        const result = await magicLogin(key);
        
        if (result.success) {
          navigate('/welcome');
        } else {
          alert(`Gagal masuk: ${result.error || 'Akun mungkin belum siap.'}`);
          navigate('/login');
        }
      } else {
        alert('Kode Akses Cepat tidak valid!');
        navigate('/login');
      }
    };

    handleQuickLogin();
  }, [key, magicLogin, navigate]);

  return <LoadingState message="Memproses Akses Cepat, mohon tunggu..." />;
}

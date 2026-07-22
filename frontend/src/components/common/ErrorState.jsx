import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ErrorState.scss';

export function ErrorState({
  title = 'Gagal Memuat Data',
  subtitle,
  message,
  showRetry = true,
  onRetry,
  showHome = false
}) {
  const navigate = useNavigate();
  const desc = message || subtitle || 'Terjadi kesalahan sistem saat memproses data.';

  return (
    <div className="custom-error-state">
      <div className="error-icon-wrapper">
        <AlertCircle size={40} />
      </div>
      <h3 className="error-title">{title}</h3>
      <p className="error-description">{desc}</p>
      <div className="error-actions">
        {showRetry && onRetry && (
          <button type="button" className="btn-custom btn-primary" onClick={onRetry}>
            <RotateCcw size={16} /> Coba Lagi
          </button>
        )}
        {showHome && (
          <button type="button" className="btn-custom btn-secondary" onClick={() => navigate('/')}>
            <Home size={16} /> Ke Beranda
          </button>
        )}
      </div>
    </div>
  );
}

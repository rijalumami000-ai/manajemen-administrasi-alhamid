import { useEffect, useState } from 'react';
import { CheckCircle, User } from 'lucide-react';
import './AttendanceSuccessOverlay.scss';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function AttendanceSuccessOverlay({ visible, name, sholat, photo, kelas, time, onDismiss, variant = 'light' }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
    }
  }, [visible]);

  if (!visible) return null;

  const timeStr = time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className={`success-overlay ${show ? 'show' : ''} ${variant}`} onClick={onDismiss}>
      <div className="success-overlay__card" onClick={e => e.stopPropagation()}>
        {/* Animated rings */}
        <div className="success-overlay__rings">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
        </div>

        <div className="success-overlay__icon">
          <CheckCircle size={48} />
        </div>

        <h2 className="success-overlay__title">ABSENSI BERHASIL</h2>

        <div className="success-overlay__photo">
          {photo ? (
            <img src={`${API_BASE}${photo}`} alt={name} onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div className="success-overlay__photo-placeholder">
              <User size={48} />
            </div>
          )}
        </div>

        <h3 className="success-overlay__name">{name}</h3>
        {kelas && <p className="success-overlay__kelas">{kelas}</p>}
        
        <div className="success-overlay__details">
          <div className="success-overlay__detail-item">
            <span className="label">Sholat</span>
            <span className="value">{sholat}</span>
          </div>
          <div className="success-overlay__divider" />
          <div className="success-overlay__detail-item">
            <span className="label">Waktu</span>
            <span className="value">{timeStr}</span>
          </div>
        </div>

        <div className="success-overlay__dismiss-hint">Klik untuk menutup</div>
      </div>
    </div>
  );
}

import { Check, X, Clock, Info, HeartPulse } from 'lucide-react';
import './StatusPill.scss';

const STATUS_CONFIG = {
  Hadir: { icon: Check, color: 'success' },
  Alfa: { icon: X, color: 'error' },
  Masbuq: { icon: Clock, color: 'warning' },
  Sakit: { icon: HeartPulse, color: 'info' },
  Izin: { icon: Info, color: 'info' },
  Haid: { icon: Info, color: 'pink' },
  Istihadoh: { icon: Info, color: 'pink' }
};

export function StatusPill({ status, active = false, onClick, className = '' }) {
  const config = STATUS_CONFIG[status] || { icon: Info, color: 'default' };
  const Icon = config.icon;

  return (
    <button
      className={`status-pill status-pill--${config.color} ${active ? 'active' : ''} ${className}`}
      onClick={() => onClick && onClick(status)}
      type="button"
    >
      <Icon size={14} className="status-pill__icon" />
      <span className="status-pill__label">{status}</span>
    </button>
  );
}

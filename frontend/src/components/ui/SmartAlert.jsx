import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import './SmartAlert.scss';

const VARIANTS = {
  warning: { icon: AlertTriangle, color: 'warning' },
  error: { icon: AlertCircle, color: 'error' },
  info: { icon: Info, color: 'info' }
};

export function SmartAlert({ message, type = 'warning', variant = 'light' }) {
  const { icon: Icon, color } = VARIANTS[type] || VARIANTS.warning;

  return (
    <div className={`smart-alert smart-alert--${color} ${variant}`}>
      <Icon size={16} className="smart-alert__icon" />
      <span className="smart-alert__message">{message}</span>
    </div>
  );
}

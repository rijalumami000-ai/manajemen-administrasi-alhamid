import React, { FC } from 'react';
import { AlertTriangle, Info, AlertCircle, LucideIcon } from 'lucide-react';
import './SmartAlert.scss';

export type SmartAlertType = 'warning' | 'error' | 'info';

interface VariantConfig {
  icon: LucideIcon;
  color: string;
}

const VARIANTS: Record<SmartAlertType, VariantConfig> = {
  warning: { icon: AlertTriangle, color: 'warning' },
  error: { icon: AlertCircle, color: 'error' },
  info: { icon: Info, color: 'info' }
};

export interface SmartAlertProps {
  message: string;
  type?: SmartAlertType;
  variant?: 'light' | 'filled' | 'outlined' | string;
}

export const SmartAlert: FC<SmartAlertProps> = ({ message, type = 'warning', variant = 'light' }) => {
  const { icon: Icon, color } = VARIANTS[type] || VARIANTS.warning;

  return (
    <div className={`smart-alert smart-alert--${color} ${variant}`}>
      <Icon size={16} className="smart-alert__icon" />
      <span className="smart-alert__message">{message}</span>
    </div>
  );
};

export default SmartAlert;

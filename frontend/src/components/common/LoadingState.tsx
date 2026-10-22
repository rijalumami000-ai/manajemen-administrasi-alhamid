import React, { ReactNode } from 'react';
import './LoadingState.scss';

export interface LoadingStateProps {
  tip?: ReactNode;
  message?: ReactNode;
}

export function LoadingState({ tip = 'Memuat data...', message }: LoadingStateProps) {
  const label = message || tip;
  return (
    <div className="custom-loading-state">
      <div className="custom-spinner"></div>
      <span className="loading-tip">{label}</span>
    </div>
  );
}

export default LoadingState;

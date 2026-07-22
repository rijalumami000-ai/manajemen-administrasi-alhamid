import React from 'react';
import './LoadingState.scss';

export function LoadingState({ tip = 'Memuat data...', message }) {
  const label = message || tip;
  return (
    <div className="custom-loading-state">
      <div className="custom-spinner"></div>
      <span className="loading-tip">{label}</span>
    </div>
  );
}

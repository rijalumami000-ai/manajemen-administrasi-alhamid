import React from 'react';
import './AnimatedCard.scss';

export function AnimatedCard({ children, className = '', style, onClick }) {
  return (
    <div className={`custom-animated-card ${className}`} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

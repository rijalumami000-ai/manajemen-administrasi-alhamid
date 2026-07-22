import React from 'react';
import './LoadingSkeleton.scss';

export function LoadingSkeleton({ type = 'card', count = 3 }) {
  if (type === 'table') {
    return (
      <div className="skeleton-container">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="skeleton-line pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card pulse">
          <div className="skeleton-header pulse" />
          <div className="skeleton-text pulse" />
          <div className="skeleton-text short pulse" />
        </div>
      ))}
    </div>
  );
}

import React from 'react';
import './CustomTag.scss';

export function CustomTag({ children, color = 'default', className = '', style }) {
  return (
    <span className={`custom-tag tag-${color} ${className}`} style={style}>
      {children}
    </span>
  );
}

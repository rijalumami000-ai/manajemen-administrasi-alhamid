import React, { CSSProperties, ReactNode } from 'react';
import './CustomTag.scss';

export interface CustomTagProps {
  children?: ReactNode;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'danger' | 'info' | string;
  className?: string;
  style?: CSSProperties;
}

export function CustomTag({ children, color = 'default', className = '', style }: CustomTagProps) {
  return (
    <span className={`custom-tag tag-${color} ${className}`} style={style}>
      {children}
    </span>
  );
}

export default CustomTag;

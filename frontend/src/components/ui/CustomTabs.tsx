import React, { ReactNode } from 'react';
import './CustomTabs.scss';

export interface CustomTabItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
}

export interface CustomTabsProps {
  items: CustomTabItem[];
  activeKey?: string;
  onChange: (key: string) => void;
  className?: string;
}

export function CustomTabs({ items = [], activeKey, onChange, className = '' }: CustomTabsProps) {
  const activeItem = items.find(item => item.key === activeKey) || items[0];

  return (
    <div className={`custom-tabs-container ${className}`}>
      <div className="custom-tabs-header">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`tab-btn ${activeKey === item.key ? 'active' : ''}`}
            onClick={() => onChange(item.key)}
          >
            {item.icon && <span className="tab-icon">{item.icon}</span>}
            <span className="tab-label">{item.label}</span>
            {item.badge !== undefined && (
              <span className="tab-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div className="custom-tab-content">
        {activeItem && activeItem.children}
      </div>
    </div>
  );
}

export default CustomTabs;
